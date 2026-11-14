-- Migration: 20270922000000_comprehensive_security_hardening.sql
-- Purpose:
--   1. Enable Row Level Security (RLS) on EVERY public table and add least-privilege policies.
--   2. Harden Storage Buckets (make citizen-documents strictly PRIVATE, 5MB limit, jpg/png/pdf only, non-listable by anon).
--   3. Revoke anonymous write grants on master_data and enforce auth/role checks on SECURITY DEFINER RPCs.
--   4. Add server-side XSS sanitization triggers and brute-force rate limiting RPC.

-- ============================================================================
-- 1. ENABLE RLS ON ALLPreviously Unprotected Public Tables
-- ============================================================================

ALTER TABLE IF EXISTS public.master_villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_post_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_rejection_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_appointment_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents_engine ENABLE ROW LEVEL SECURITY;

-- Dynamic safety sweep: guarantee EVERY table in schema 'public' has RLS enabled
DO $$
DECLARE
  _tbl record;
BEGIN
  FOR _tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', _tbl.tablename);
  END LOOP;
END $$;

-- ============================================================================
-- 2. ADD LEAST-PRIVILEGE RLS POLICIES FOR MASTER & DOCUMENT ENGINE TABLES
-- ============================================================================

DO $$
DECLARE
  _master_tbl text;
  _master_tables text[] := ARRAY[
    'master_villages',
    'master_post_offices',
    'master_wards',
    'master_relations',
    'master_designations',
    'master_document_types',
    'master_rejection_reasons',
    'master_notification_types',
    'master_appointment_document_types',
    'master_workflow_states',
    'workflow_transitions',
    'master_document_requirements',
    'master_service_categories'
  ];
BEGIN
  FOREACH _master_tbl IN ARRAY _master_tables
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = _master_tbl) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', _master_tbl || '_public_read', _master_tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true);',
        _master_tbl || '_public_read',
        _master_tbl
      );

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', _master_tbl || '_admin_write', _master_tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin''));',
        _master_tbl || '_admin_write',
        _master_tbl
      );
    END IF;
  END LOOP;
END $$;

-- Strict RLS for role_permissions (authenticated read, super_admin write)
DROP POLICY IF EXISTS role_permissions_auth_read ON public.role_permissions;
CREATE POLICY role_permissions_auth_read ON public.role_permissions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS role_permissions_super_admin_write ON public.role_permissions;
CREATE POLICY role_permissions_super_admin_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Strict RLS for documents_engine (owner or office staff only — never public)
DROP POLICY IF EXISTS documents_engine_owner_select ON public.documents_engine;
CREATE POLICY documents_engine_owner_select ON public.documents_engine
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS documents_engine_owner_insert ON public.documents_engine;
CREATE POLICY documents_engine_owner_insert ON public.documents_engine
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS documents_engine_staff_update ON public.documents_engine;
CREATE POLICY documents_engine_staff_update ON public.documents_engine
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- ============================================================================
-- 3. REVOKE ANONYMOUS WRITE ACCESS ON MASTER_DATA & HARDEN RPCs
-- ============================================================================

REVOKE INSERT, UPDATE, DELETE ON public.master_data FROM anon;
DROP POLICY IF EXISTS "master_data_admin_write" ON public.master_data;
CREATE POLICY "master_data_admin_write" ON public.master_data
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'deo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'deo')
  );

REVOKE EXECUTE ON FUNCTION public.toggle_master_data(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_master_data_item(text, text, text, text, text, int, boolean) FROM anon;

-- Harden rpc_submit_application and rpc_approve_application against dynamic SQL injection
CREATE OR REPLACE FUNCTION public.rpc_submit_application(p_application_id UUID, p_table_name VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_state_submitted UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_table_name NOT IN ('warish_certificates', 'dependent_certificates', 'linkage_certificates') THEN
    RAISE EXCEPTION 'Invalid application table specified';
  END IF;

  SELECT id INTO v_state_submitted FROM public.master_workflow_states WHERE state_name = 'Submitted';

  EXECUTE format(
    'UPDATE public.%I SET state_id = $1, updated_at = NOW() WHERE id = $2 AND (created_by = $3 OR public.has_role($3, ''deo'') OR public.has_role($3, ''admin'') OR public.has_role($3, ''super_admin''))',
    p_table_name
  ) USING v_state_submitted, p_application_id, v_uid;

  INSERT INTO public.events_engine (event_type, application_id, actor_id)
  VALUES ('submit', p_application_id, v_uid);

  RETURN '{"status": "success", "message": "Application submitted successfully"}'::jsonb;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_approve_application(p_application_id UUID, p_table_name VARCHAR)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_state_approved UUID;
BEGIN
  IF v_uid IS NULL OR NOT (public.has_role(v_uid, 'admin') OR public.has_role(v_uid, 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied: Admin or Super Admin role required';
  END IF;

  IF p_table_name NOT IN ('warish_certificates', 'dependent_certificates', 'linkage_certificates') THEN
    RAISE EXCEPTION 'Invalid application table specified';
  END IF;

  SELECT id INTO v_state_approved FROM public.master_workflow_states WHERE state_name = 'Approved';

  EXECUTE format('UPDATE public.%I SET state_id = $1, updated_at = NOW() WHERE id = $2', p_table_name)
    USING v_state_approved, p_application_id;

  INSERT INTO public.events_engine (event_type, application_id, actor_id)
  VALUES ('approve', p_application_id, v_uid);

  RETURN '{"status": "success", "message": "Application approved successfully"}'::jsonb;
END;
$$;

-- ============================================================================
-- 4. STORAGE BUCKET HARDENING (PRIVATE BUCKET, 5MB LIMIT, STRICT MIME TYPES)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'citizen-documents',
  'citizen-documents',
  false,
  5242880, -- 5 MB max
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'application/pdf'];

-- Ensure anonymous users can NEVER list or read personal photos in storage.objects
DROP POLICY IF EXISTS citizen_docs_anon_select ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- ============================================================================
-- 5. SERVER-SIDE XSS SANITIZATION TRIGGER & RATE LIMITING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.strip_script_tags(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(
      COALESCE(input_text, ''),
      '<script\M[^>]*>.*?</script>',
      '',
      'gi'
    ),
    'javascript\s*:',
    '',
    'gi'
  );
$$;

CREATE OR REPLACE FUNCTION public.trg_sanitize_public_tracker_reports()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.citizen_name := left(trim(public.strip_script_tags(NEW.citizen_name)), 120);
  NEW.ward_number := left(trim(public.strip_script_tags(NEW.ward_number)), 80);
  NEW.details := left(trim(public.strip_script_tags(NEW.details)), 2000);
  NEW.initiative_title := left(trim(public.strip_script_tags(NEW.initiative_title)), 200);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_public_tracker_reports_trg ON public.public_tracker_reports;
CREATE TRIGGER sanitize_public_tracker_reports_trg
  BEFORE INSERT OR UPDATE ON public.public_tracker_reports
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_public_tracker_reports();

CREATE OR REPLACE FUNCTION public.trg_sanitize_public_service_applications()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.applicant_name := left(trim(public.strip_script_tags(NEW.applicant_name)), 150);
  NEW.sansad_or_village := left(trim(public.strip_script_tags(NEW.sansad_or_village)), 150);
  NEW.service_label := left(trim(public.strip_script_tags(NEW.service_label)), 150);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_public_service_applications_trg ON public.public_service_applications;
CREATE TRIGGER sanitize_public_service_applications_trg
  BEFORE INSERT OR UPDATE ON public.public_service_applications
  FOR EACH ROW EXECUTE FUNCTION public.trg_sanitize_public_service_applications();

-- Database Rate Limiting Table & Verification Function (max 5 attempts / min for auth gates)
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  bucket_key text PRIMARY KEY,
  hit_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_rate_limits FROM anon, authenticated;
GRANT ALL ON public.security_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket_key text,
  _max_hits integer DEFAULT 5,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _now timestamptz := now();
  _count integer;
  _win timestamptz;
BEGIN
  SELECT hit_count, window_start INTO _count, _win
  FROM public.security_rate_limits
  WHERE bucket_key = left(_bucket_key, 200);

  IF _win IS NULL OR _now > (_win + make_interval(secs => _window_seconds)) THEN
    INSERT INTO public.security_rate_limits (bucket_key, hit_count, window_start)
    VALUES (left(_bucket_key, 200), 1, _now)
    ON CONFLICT (bucket_key) DO UPDATE SET
      hit_count = 1,
      window_start = _now;
    RETURN true;
  END IF;

  IF _count >= _max_hits THEN
    RETURN false;
  END IF;

  UPDATE public.security_rate_limits
  SET hit_count = hit_count + 1
  WHERE bucket_key = left(_bucket_key, 200);

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO anon, authenticated, service_role;
