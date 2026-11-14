import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabaseEnv";

export type AppPermission =
  | "notices"
  | "representatives"
  | "staff"
  | "homepage_content"
  | "redirects"
  | "warish_certs"
  | "dependent_certs"
  | "linkage_certs"
  | "birth_certs"
  | "admins"
  | "activity_logs"
  | "backups";

export type AppAction = "view" | "create" | "edit" | "delete";

/** The three fixed office roles. The role alone decides every permission. */
export type OfficeRole = "deo" | "admin" | "super_admin";

export const PRIMARY_SUPER_ADMIN_EMAIL = "bagula2nogp111@gmail.com";

export const SUPER_ADMIN_EMAILS = [
  PRIMARY_SUPER_ADMIN_EMAIL,
  "nitish374482@gmail.com",
];

export function isPrimarySuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL;
}

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const norm = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.includes(norm);
}


interface AuthzState {
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDeo: boolean;
  role: OfficeRole | null;
  userId: string | null;
  email: string | null;
  serviceScope: string[] | null;
}

const initial: AuthzState = {
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  isDeo: false,
  role: null,
  userId: null,
  email: null,
  serviceScope: null,
};

export function useAuthz(): AuthzState {
  const [state, setState] = useState<AuthzState>(initial);

  useEffect(() => {
    let active = true;
    (async () => {
      let user = null;
      if (isSupabaseConfigured) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError && userData?.user) {
          user = userData.user;
        }
      }
      if (!user) {
        const { data: sessionData } = await supabase.auth.getSession();
        user = sessionData?.session?.user ?? null;
      }
      if (!user) {
        if (active) setState({ ...initial, loading: false });
        return;
      }

      const { data: roles } = isSupabaseConfigured
        ? await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
        : { data: [] as Array<{ role: string }> };

      const normEmail = user.email?.trim().toLowerCase() ?? null;
      const roleSet = new Set((roles ?? []).map((r) => r.role));

      let role: OfficeRole | null = null;

      // 1. Authoritative Super Admin designated account (bagula2nogp111@gmail.com primary, nitish374482@gmail.com secondary)
      if (isSuperAdminEmail(normEmail)) {
        role = "super_admin";
        if (isSupabaseConfigured) {
          if (!roleSet.has("super_admin")) {
            supabase
              .from("user_roles")
              .upsert({ user_id: user.id, role: "super_admin" } as any)
              .then(() => {});
          }
          // Auto-sync active profile with all login methods enabled
          supabase
            .from("admin_profiles")
            .upsert({
              user_id: user.id,
              email: normEmail,
              display_name: isPrimarySuperAdminEmail(normEmail)
                ? "Super Admin (Bagula 2 No Gram Panchayat)"
                : "Secondary Super Admin (Bagula 2 No Gram Panchayat)",
              status: "active",
              allowed_login_method: "all",
              service_scope: ["all"],
              archived_at: null,
            } as any)
            .then(() => {});
        }
      } 
      // 2. Authoritative Admin (Reviewing Authority) designated account
      else if (normEmail === "nitush6488@gmail.com") {
        role = "admin";
        // Cleanse any unintended super_admin role that was previously granted via bug
        if (roleSet.has("super_admin")) {
          supabase.from("user_roles").delete().eq("user_id", user.id).eq("role", "super_admin").then(() => {});
          supabase.from("user_roles").upsert({ user_id: user.id, role: "admin" } as any).then(() => {});
        }
      } 
      // 3. Authoritative DEO designated account
      else if (normEmail === "nitush8343980898@gmail.com") {
        role = "deo";
        // Cleanse any unintended super_admin or admin role that was previously granted via bug
        if (roleSet.has("super_admin") || roleSet.has("admin")) {
          supabase.from("user_roles").delete().eq("user_id", user.id).in("role", ["super_admin", "admin"]).then(() => {});
          supabase.from("user_roles").upsert({ user_id: user.id, role: "deo" } as any).then(() => {});
        }
      } 
      // 4. Any other office credentials — strictly respect database user_roles table
      else {
        if (roleSet.has("super_admin")) {
          role = "super_admin";
        } else if (roleSet.has("admin")) {
          role = "admin";
        } else if (roleSet.has("deo")) {
          role = "deo";
        } else {
          role = null;
        }
      }

      let serviceScope: string[] | null = null;
      if (role === "deo") {
        const { data: profile } = await supabase.from("admin_profiles").select("service_scope").eq("user_id", user.id).maybeSingle();
        serviceScope = profile?.service_scope || [];
      }

      if (!active) return;
      const isBossSuperAdmin = isSuperAdminEmail(normEmail) || role === "super_admin";
      setState({
        loading: false,
        isSuperAdmin: isBossSuperAdmin,
        isAdmin: role === "admin" || isBossSuperAdmin,
        isDeo: role === "deo" || isBossSuperAdmin,
        role: isBossSuperAdmin ? "super_admin" : role,
        userId: user.id,
        serviceScope: isBossSuperAdmin ? ["all"] : serviceScope,
        email: user.email ?? null,
      });
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/**
 * FIXED role → permission map. This is the single source of truth.
 *
 * There is no per-account permission matrix: changing an officer's role
 * automatically applies the whole permission set below, everywhere.
 *
 *  - DEO           : data entry only, on their own applications.
 *  - Admin         : review / return / approve / memo / issue. No data entry.
 *  - Super Admin   : accounts, notices, representatives, audit, settings.
 *                    Supervises the system, does not process certificates.
 */
export const ROLE_PERMISSIONS: Record<OfficeRole, Partial<Record<AppPermission, AppAction[]>>> = {
  deo: {
    // Create and edit their own drafts, submit for review, view only their own.
    warish_certs: ["view", "create", "edit"],
    dependent_certs: ["view", "create", "edit"],
    linkage_certs: ["view", "create", "edit"],
  },
  admin: {
    // Review workspace: sees everything, approves/returns/issues — but no data entry.
    warish_certs: ["view", "edit"],
    dependent_certs: ["view", "edit"],
    linkage_certs: ["view", "edit"],
    birth_certs: ["view", "edit"],
  },
  super_admin: {
    admins: ["view", "create", "edit", "delete"],
    notices: ["view", "create", "edit", "delete"],
    representatives: ["view", "create", "edit", "delete"],
    staff: ["view", "create", "edit", "delete"],
    homepage_content: ["view", "create", "edit", "delete"],
    redirects: ["view", "create", "edit", "delete"],
    activity_logs: ["view", "create", "edit", "delete"],
    backups: ["view", "create", "edit", "delete"],
    // Full authority over all certificate registers and issuance workflows
    warish_certs: ["view", "create", "edit", "delete"],
    dependent_certs: ["view", "create", "edit", "delete"],
    linkage_certs: ["view", "create", "edit", "delete"],
    birth_certs: ["view", "create", "edit", "delete"],
  },
};

export const ROLE_LABEL: Record<OfficeRole, string> = {
  deo: "DEO (Data Entry Operator)",
  admin: "Admin (Reviewing Authority)",
  super_admin: "Super Admin (Supervisor)",
};

export const ROLE_SUMMARY: Record<OfficeRole, string> = {
  deo: "Creates applications, edits only their own drafts, submits for review. Cannot review, approve, issue or manage accounts.",
  admin:
    "Reviews all DEO applications, returns for correction, approves, registers memo and issues certificates. Cannot do data entry or manage accounts.",
  super_admin:
    "Creates and manages office accounts, resets passwords, manages notices and representatives, views audit logs and system settings. Does not process certificates.",
};

export function permissionsFor(role: OfficeRole | null) {
  return (role ? ROLE_PERMISSIONS[role] : undefined) ?? {};
}

export function hasServiceScope(
  state: Pick<AuthzState, "role" | "serviceScope"> & { email?: string | null; isSuperAdmin?: boolean },
  scope: string
) {
  if (isSuperAdminEmail(state.email) || state.isSuperAdmin || state.role === "super_admin" || state.role === "admin") return true;
  if (state.role === "deo") {
     if (!state.serviceScope) return false;
     return state.serviceScope.includes(scope) || state.serviceScope.includes("all");
  }
  return false;
}

export function hasPermission(
  state: Pick<AuthzState, "role"> & { email?: string | null; isSuperAdmin?: boolean },
  perm: AppPermission,
  action: AppAction,
) {
  if (isSuperAdminEmail(state.email) || state.isSuperAdmin || state.role === "super_admin") return true; // Super Admin has all permissions allowed via backend
  if (!state.role) return false;
  return ROLE_PERMISSIONS[state.role]?.[perm]?.includes(action) ?? false;
}
