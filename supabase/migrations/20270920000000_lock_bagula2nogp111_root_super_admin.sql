-- Migration: 20270920000000_lock_bagula2nogp111_root_super_admin.sql
-- Purpose: Establish bagula2nogp111@gmail.com as the authoritative Root Super Admin
--          (with nitish374482@gmail.com as secondary Super Admin) across SQL policies,
--          bootstrap RPCs, and immutable account protection triggers.

-- 1. Ensure both Super Admin accounts have active profiles and super_admin roles
DO $$
DECLARE
  _rec RECORD;
BEGIN
  FOR _rec IN
    SELECT id, lower(email) AS email
    FROM auth.users
    WHERE lower(email) IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com')
  LOOP
    DELETE FROM public.user_roles WHERE user_id = _rec.id AND role != 'super_admin';

    INSERT INTO public.user_roles (user_id, role)
    VALUES (_rec.id, 'super_admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.admin_profiles (
      user_id,
      email,
      display_name,
      status,
      designation,
      allowed_login_method,
      service_scope,
      must_change_password,
      archived_at
    )
    VALUES (
      _rec.id,
      _rec.email,
      CASE
        WHEN _rec.email = 'bagula2nogp111@gmail.com' THEN 'Super Admin (Bagula 2 No Gram Panchayat)'
        ELSE 'Secondary Super Admin (Bagula 2 No Gram Panchayat)'
      END,
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
END $$;

-- 2. Authoritative helper function: public.is_super_admin(_user_id uuid)
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
  IF _email IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com') THEN
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

-- 3. Update bootstrap_admin_role() to recognize bagula2nogp111@gmail.com (and nitish374482@gmail.com) as super_admin
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
    WHEN 'bagula2nogp111@gmail.com'   THEN 'super_admin'::app_role
    WHEN 'nitish374482@gmail.com'     THEN 'super_admin'::app_role
    WHEN 'nitush6488@gmail.com'       THEN 'admin'::app_role
    WHEN 'nitush8343980898@gmail.com' THEN 'deo'::app_role
    ELSE NULL
  END;

  IF _role IS NULL THEN
    RAISE EXCEPTION 'Email % is not in the bootstrap whitelist', _email;
  END IF;

  -- Unconditionally guarantee super_admin role and active profile for designated Super Admins
  IF _email IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com') THEN
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
      CASE
        WHEN _email = 'bagula2nogp111@gmail.com' THEN 'Super Admin (Bagula 2 No Gram Panchayat)'
        ELSE 'Secondary Super Admin (Bagula 2 No Gram Panchayat)'
      END,
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

-- 4. Database Trigger Guard: Prevent demotion or deletion of bagula2nogp111@gmail.com role
CREATE OR REPLACE FUNCTION public.prevent_root_super_admin_role_loss()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT lower(email) INTO _email FROM auth.users WHERE id = OLD.user_id;
    IF _email = 'bagula2nogp111@gmail.com' AND OLD.role = 'super_admin'::public.app_role THEN
      RAISE EXCEPTION 'Protected Root Super Admin (bagula2nogp111@gmail.com) cannot have the super_admin role removed.';
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT lower(email) INTO _email FROM auth.users WHERE id = OLD.user_id;
    IF _email = 'bagula2nogp111@gmail.com' AND OLD.role = 'super_admin'::public.app_role AND NEW.role != 'super_admin'::public.app_role THEN
      RAISE EXCEPTION 'Protected Root Super Admin (bagula2nogp111@gmail.com) cannot be demoted from super_admin.';
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_root_super_admin_role ON public.user_roles;
CREATE TRIGGER trg_protect_root_super_admin_role
  BEFORE UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_root_super_admin_role_loss();

-- 5. Database Trigger Guard: Prevent suspension or archiving of bagula2nogp111@gmail.com profile
CREATE OR REPLACE FUNCTION public.prevent_root_super_admin_profile_lockout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(COALESCE(OLD.email, NEW.email, '')) = 'bagula2nogp111@gmail.com' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Protected Root Super Admin profile (bagula2nogp111@gmail.com) cannot be deleted.';
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.status := 'active';
      NEW.archived_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_root_super_admin_profile ON public.admin_profiles;
CREATE TRIGGER trg_protect_root_super_admin_profile
  BEFORE UPDATE OR DELETE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_root_super_admin_profile_lockout();
