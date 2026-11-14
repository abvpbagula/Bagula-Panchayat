-- Migration: 20270924000000_update_office_role_assignments.sql
-- Purpose:
--   1. Assign nitush6488@gmail.com -> deo
--   2. Assign nitush8343980898@gmail.com -> admin
--   3. Add bagulaiiofficerecords@gmail.com -> super_admin
--   4. Update is_super_admin(), bootstrap_admin_role(), record_admin_auth_audit_event(),
--      and RLS policies accordingly.

-- 1. Reconcile existing auth.users rows for the updated office accounts
DO $$
DECLARE
  _rec RECORD;
BEGIN
  -- Super Admin: bagulaiiofficerecords@gmail.com (and existing super admins)
  FOR _rec IN
    SELECT id, lower(email) AS email
    FROM auth.users
    WHERE lower(email) IN (
      'bagula2nogp111@gmail.com',
      'bagulaiiofficerecords@gmail.com',
      'nitish374482@gmail.com'
    )
  LOOP
    DELETE FROM public.user_roles WHERE user_id = _rec.id AND role != 'super_admin';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_rec.id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_profiles (
      user_id, email, display_name, status, designation, allowed_login_method, service_scope, must_change_password, archived_at
    )
    VALUES (
      _rec.id,
      _rec.email,
      'Super Admin (Bagula 2 No Gram Panchayat)',
      'active',
      'pradhan',
      'all',
      ARRAY['all'],
      false,
      NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      allowed_login_method = 'all',
      service_scope = ARRAY['all'],
      archived_at = NULL;
  END LOOP;

  -- Admin (Reviewing Authority): nitush8343980898@gmail.com
  FOR _rec IN
    SELECT id, lower(email) AS email
    FROM auth.users
    WHERE lower(email) = 'nitush8343980898@gmail.com'
  LOOP
    DELETE FROM public.user_roles WHERE user_id = _rec.id AND role != 'admin';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_rec.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_profiles (
      user_id, email, display_name, status, designation, allowed_login_method, service_scope, must_change_password, archived_at
    )
    VALUES (
      _rec.id,
      _rec.email,
      'Admin (Bagula 2 No Gram Panchayat)',
      'active',
      'secretary',
      'both',
      ARRAY['all'],
      false,
      NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      allowed_login_method = 'both',
      service_scope = ARRAY['all'],
      archived_at = NULL;
  END LOOP;

  -- DEO (Data Entry Operator): nitush6488@gmail.com
  FOR _rec IN
    SELECT id, lower(email) AS email
    FROM auth.users
    WHERE lower(email) = 'nitush6488@gmail.com'
  LOOP
    DELETE FROM public.user_roles WHERE user_id = _rec.id AND role != 'deo';
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_rec.id, 'deo'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_profiles (
      user_id, email, display_name, status, designation, allowed_login_method, service_scope, must_change_password, archived_at
    )
    VALUES (
      _rec.id,
      _rec.email,
      'DEO (Bagula 2 No Gram Panchayat)',
      'active',
      'deo',
      'both',
      ARRAY['all'],
      false,
      NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      allowed_login_method = 'both',
      service_scope = ARRAY['all'],
      archived_at = NULL;
  END LOOP;
END $$;

-- 2. Update public.is_super_admin(_user_id uuid)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT lower(email) INTO _email FROM auth.users WHERE id = _user_id;
  IF _email IN ('bagula2nogp111@gmail.com', 'bagulaiiofficerecords@gmail.com', 'nitish374482@gmail.com') THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::public.app_role
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, anon, service_role;

-- 3. Update bootstrap_admin_role() with new role assignments
CREATE OR REPLACE FUNCTION public.bootstrap_admin_role()
RETURNS TABLE(assigned_role app_role, was_created boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _role app_role;
  _existing app_role;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT lower(email) INTO _email FROM auth.users WHERE id = _uid;

  _role := CASE _email
    WHEN 'bagula2nogp111@gmail.com'       THEN 'super_admin'::app_role
    WHEN 'bagulaiiofficerecords@gmail.com' THEN 'super_admin'::app_role
    WHEN 'nitish374482@gmail.com'         THEN 'super_admin'::app_role
    WHEN 'nitush8343980898@gmail.com'     THEN 'admin'::app_role
    WHEN 'nitush6488@gmail.com'           THEN 'deo'::app_role
    ELSE NULL
  END;

  IF _role IS NULL THEN
    RAISE EXCEPTION 'Email % is not in the bootstrap whitelist', _email;
  END IF;

  IF _email IN ('bagula2nogp111@gmail.com', 'bagulaiiofficerecords@gmail.com', 'nitish374482@gmail.com') THEN
    DELETE FROM public.user_roles WHERE user_id = _uid AND role != 'super_admin';
    INSERT INTO public.user_roles (user_id, role)
      VALUES (_uid, 'super_admin'::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_profiles (
      user_id, email, display_name, status, designation, allowed_login_method, service_scope, archived_at
    )
    VALUES (
      _uid,
      _email,
      'Super Admin (Bagula 2 No Gram Panchayat)',
      'active',
      'pradhan',
      'all',
      ARRAY['all'],
      NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      allowed_login_method = 'all',
      service_scope = ARRAY['all'],
      archived_at = NULL;

    RETURN QUERY SELECT 'super_admin'::app_role, true;
    RETURN;
  END IF;

  IF _email IN ('nitush8343980898@gmail.com', 'nitush6488@gmail.com') THEN
    DELETE FROM public.user_roles WHERE user_id = _uid AND role != _role;
    INSERT INTO public.user_roles (user_id, role)
      VALUES (_uid, _role)
      ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_profiles (
      user_id, email, display_name, status, designation, allowed_login_method, service_scope, archived_at
    )
    VALUES (
      _uid,
      _email,
      CASE WHEN _role = 'admin' THEN 'Admin (Bagula 2 No Gram Panchayat)' ELSE 'DEO (Bagula 2 No Gram Panchayat)' END,
      'active',
      CASE WHEN _role = 'admin' THEN 'secretary' ELSE 'deo' END,
      'both',
      ARRAY['all'],
      NULL
    )
    ON CONFLICT (user_id) DO UPDATE SET
      status = 'active',
      service_scope = ARRAY['all'],
      archived_at = NULL;

    RETURN QUERY SELECT _role, true;
    RETURN;
  END IF;

  SELECT role INTO _existing FROM public.user_roles WHERE user_id = _uid
    ORDER BY CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 WHEN 'deo' THEN 3 ELSE 4 END
    LIMIT 1;
  IF _existing IS NOT NULL THEN
    RETURN QUERY SELECT _existing, false;
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role);
  INSERT INTO public.admin_profiles (user_id, email, status)
    VALUES (_uid, _email, 'active')
    ON CONFLICT (user_id) DO NOTHING;

  RETURN QUERY SELECT _role, true;
END;
$$;

-- 4. Update audit & session policies/functions to include bagulaiiofficerecords@gmail.com
DROP POLICY IF EXISTS "Admins can manage own or super admin sessions" ON public.admin_active_sessions;
CREATE POLICY "Admins can manage own or super admin sessions"
  ON public.admin_active_sessions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('bagula2nogp111@gmail.com', 'bagulaiiofficerecords@gmail.com', 'nitish374482@gmail.com')
  )
  WITH CHECK (true);

DROP POLICY IF EXISTS "Super admins can update auth audit logs" ON public.admin_auth_audit_logs;
CREATE POLICY "Super admins can update auth audit logs"
  ON public.admin_auth_audit_logs
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('bagula2nogp111@gmail.com', 'bagulaiiofficerecords@gmail.com', 'nitish374482@gmail.com')
  );

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
  IF v_norm_email IN ('bagula2nogp111@gmail.com', 'bagulaiiofficerecords@gmail.com', 'nitish374482@gmail.com')
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
