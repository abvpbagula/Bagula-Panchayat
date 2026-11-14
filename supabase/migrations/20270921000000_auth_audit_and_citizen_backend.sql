-- ============================================================================
-- Migration: Authentication Audit Console & Citizen Backend Wiring
-- 1. Admin Active Sessions & Admin Auth Audit Logs (flagging Super Admin intrusions)
-- 2. Public Tracker Reports & Public Service Applications (live tracking IDs)
-- ============================================================================

-- 1. Admin Active Sessions Table
CREATE TABLE IF NOT EXISTS public.admin_active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key text UNIQUE NOT NULL,
  user_id uuid,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'deo',
  login_method text NOT NULL DEFAULT 'password',
  location_label text NOT NULL DEFAULT 'Bagula, Nadia, West Bengal (IN)',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ip_hash text NOT NULL DEFAULT '0000000000000000',
  device_summary text NOT NULL DEFAULT 'Desktop Browser',
  is_active boolean NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by text
);

CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_email ON public.admin_active_sessions (lower(email));
CREATE INDEX IF NOT EXISTS idx_admin_active_sessions_active ON public.admin_active_sessions (is_active, last_seen_at DESC);

ALTER TABLE public.admin_active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view active sessions" ON public.admin_active_sessions;
CREATE POLICY "Admins can view active sessions"
  ON public.admin_active_sessions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage own or super admin sessions" ON public.admin_active_sessions;
CREATE POLICY "Admins can manage own or super admin sessions"
  ON public.admin_active_sessions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com')
  )
  WITH CHECK (true);

-- 2. Admin Authentication Audit Logs Table (captures unauthenticated intrusion attempts too)
CREATE TABLE IF NOT EXISTS public.admin_auth_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_email text NOT NULL,
  actor_user_id uuid,
  target_super_admin boolean NOT NULL DEFAULT false,
  is_unauthorized_attempt boolean NOT NULL DEFAULT false,
  severity text NOT NULL DEFAULT 'info',
  login_method text NOT NULL DEFAULT 'password',
  location_label text NOT NULL DEFAULT 'Unknown Location',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  ip_hash text NOT NULL DEFAULT '0000000000000000',
  device_summary text NOT NULL DEFAULT 'Browser Client',
  reason text NOT NULL DEFAULT '',
  route_path text,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by text,
  acknowledged_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_auth_audit_logs_created ON public.admin_auth_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_auth_audit_logs_super_admin ON public.admin_auth_audit_logs (target_super_admin, is_unauthorized_attempt, created_at DESC);

ALTER TABLE public.admin_auth_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated office users can read auth audit logs" ON public.admin_auth_audit_logs;
CREATE POLICY "Authenticated office users can read auth audit logs"
  ON public.admin_auth_audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert auth audit events via security definer or direct" ON public.admin_auth_audit_logs;
CREATE POLICY "Anyone can insert auth audit events via security definer or direct"
  ON public.admin_auth_audit_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Super admins can update auth audit logs" ON public.admin_auth_audit_logs;
CREATE POLICY "Super admins can update auth audit logs"
  ON public.admin_auth_audit_logs
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com')
  );

-- 3. SECURITY DEFINER RPC: Record Admin Auth Audit Event (callable by anon on failed login)
CREATE OR REPLACE FUNCTION public.record_admin_auth_audit_event(
  _event_type text,
  _actor_email text,
  _login_method text DEFAULT 'password',
  _location_label text DEFAULT 'Bagula, Nadia, West Bengal (IN)',
  _timezone text DEFAULT 'Asia/Kolkata',
  _ip_hash text DEFAULT '0000000000000000',
  _device_summary text DEFAULT 'Web Browser',
  _reason text DEFAULT '',
  _route_path text DEFAULT '/admin',
  _severity text DEFAULT 'info',
  _is_unauthorized boolean DEFAULT false,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_email text := lower(trim(coalesce(_actor_email, 'unknown')));
  v_targets_super boolean := false;
  v_id uuid;
BEGIN
  IF v_norm_email IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com')
     OR coalesce((_metadata ->> 'super_admin_route')::boolean, false) = true THEN
    v_targets_super := true;
  END IF;

  INSERT INTO public.admin_auth_audit_logs (
    event_type,
    actor_email,
    actor_user_id,
    target_super_admin,
    is_unauthorized_attempt,
    severity,
    login_method,
    location_label,
    timezone,
    ip_hash,
    device_summary,
    reason,
    route_path,
    metadata
  ) VALUES (
    _event_type,
    v_norm_email,
    auth.uid(),
    v_targets_super,
    _is_unauthorized,
    CASE WHEN v_targets_super AND _is_unauthorized THEN 'critical' ELSE _severity END,
    coalesce(_login_method, 'password'),
    coalesce(_location_label, 'Bagula, Nadia, West Bengal (IN)'),
    coalesce(_timezone, 'Asia/Kolkata'),
    coalesce(_ip_hash, '0000000000000000'),
    coalesce(_device_summary, 'Web Browser'),
    coalesce(_reason, ''),
    coalesce(_route_path, '/admin'),
    coalesce(_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_admin_auth_audit_event(text, text, text, text, text, text, text, text, text, text, boolean, jsonb) TO anon, authenticated;

-- 4. SECURITY DEFINER RPC: Upsert Admin Active Session Heartbeat
CREATE OR REPLACE FUNCTION public.upsert_admin_session_heartbeat(
  _session_key text,
  _email text,
  _role text DEFAULT 'deo',
  _login_method text DEFAULT 'session',
  _location_label text DEFAULT 'Bagula, Nadia, West Bengal (IN)',
  _timezone text DEFAULT 'Asia/Kolkata',
  _ip_hash text DEFAULT '0000000000000000',
  _device_summary text DEFAULT 'Web Browser'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_active_sessions (
    session_key,
    user_id,
    email,
    role,
    login_method,
    location_label,
    timezone,
    ip_hash,
    device_summary,
    is_active,
    started_at,
    last_seen_at,
    revoked_at
  ) VALUES (
    _session_key,
    auth.uid(),
    lower(trim(_email)),
    coalesce(_role, 'deo'),
    coalesce(_login_method, 'session'),
    coalesce(_location_label, 'Bagula, Nadia, West Bengal (IN)'),
    coalesce(_timezone, 'Asia/Kolkata'),
    coalesce(_ip_hash, '0000000000000000'),
    coalesce(_device_summary, 'Web Browser'),
    true,
    now(),
    now(),
    null
  )
  ON CONFLICT (session_key) DO UPDATE SET
    last_seen_at = now(),
    is_active = CASE WHEN public.admin_active_sessions.revoked_at IS NOT NULL THEN false ELSE true END,
    location_label = EXCLUDED.location_label,
    device_summary = EXCLUDED.device_summary;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_admin_session_heartbeat(text, text, text, text, text, text, text, text) TO anon, authenticated;

-- 5. SECURITY DEFINER RPC: Revoke Admin Sessions
CREATE OR REPLACE FUNCTION public.revoke_admin_sessions(
  _target_email text,
  _revoked_by text DEFAULT 'bagula2nogp111@gmail.com'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.admin_active_sessions
  SET is_active = false,
      revoked_at = now(),
      revoked_by = _revoked_by
  WHERE lower(email) = lower(trim(_target_email))
    AND is_active = true;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_admin_sessions(text, text) TO authenticated;

-- 6. Public Accountability Tracker Reports Table (Citizen On-Ground Reports)
CREATE TABLE IF NOT EXISTS public.public_tracker_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id text NOT NULL,
  citizen_name text NOT NULL,
  ward_number text NOT NULL DEFAULT 'Local Sansad',
  claim_status text NOT NULL DEFAULT 'in_progress',
  details text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_tracker_reports_created ON public.public_tracker_reports (created_at DESC);

ALTER TABLE public.public_tracker_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read tracker reports" ON public.public_tracker_reports;
CREATE POLICY "Public can read tracker reports"
  ON public.public_tracker_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can submit tracker reports" ON public.public_tracker_reports;
CREATE POLICY "Public can submit tracker reports"
  ON public.public_tracker_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(citizen_name)) > 0 AND length(trim(details)) > 0);

-- 7. Public Service Applications Table (links public forms to live /track Reference IDs)
CREATE TABLE IF NOT EXISTS public.public_service_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text UNIQUE NOT NULL,
  service_code text NOT NULL,
  service_title text NOT NULL,
  service_title_bn text NOT NULL DEFAULT '',
  applicant_name text NOT NULL,
  subject_or_deceased_name text,
  mobile_number text,
  ward_number text DEFAULT 'Ward 01',
  village text DEFAULT 'Bagula',
  status text NOT NULL DEFAULT 'Under Statutory Inquiry',
  current_stage text NOT NULL DEFAULT 'Application Registered & Assigned to Sansad Desk',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_service_applications_ref ON public.public_service_applications (upper(reference_id));

ALTER TABLE public.public_service_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read service applications by reference" ON public.public_service_applications;
CREATE POLICY "Public can read service applications by reference"
  ON public.public_service_applications
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can submit service applications" ON public.public_service_applications;
CREATE POLICY "Public can submit service applications"
  ON public.public_service_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(trim(applicant_name)) > 0);

DROP POLICY IF EXISTS "Admins can update service applications" ON public.public_service_applications;
CREATE POLICY "Admins can update service applications"
  ON public.public_service_applications
  FOR UPDATE
  TO authenticated
  USING (true);
