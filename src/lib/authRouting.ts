import { supabase } from "@/integrations/supabase/client";
import type { OfficeRole } from "@/lib/permissions";

export type ResolvedDestination = {
  destination: string;
  role: OfficeRole | null;
  error?: string;
};

export interface ResolveDestinationOptions {
  preferredPortal?: "admin" | "auto";
}

const SUPER_ADMIN_EMAILS = [
  "bagula2nogp111@gmail.com",
  "nitish374482@gmail.com",
];

const ADMIN_EMAILS = [
  ...SUPER_ADMIN_EMAILS,
  "nitush6488@gmail.com",
  "nitush8343980898@gmail.com",
];

/**
 * Authoritatively determines where an authenticated office user (DEO, Admin, Super Admin)
 * must be routed based on live database roles and profiles in Supabase.
 */
export async function resolveUserDestination(
  userId: string,
  email?: string | null,
  _options?: ResolveDestinationOptions
): Promise<ResolvedDestination> {
  const normEmail = (email ?? "").trim().toLowerCase();

  if (SUPER_ADMIN_EMAILS.includes(normEmail)) {
    supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" } as any)
      .then(() => {});
    supabase
      .from("admin_profiles")
      .upsert({
        user_id: userId,
        email: normEmail,
        display_name: "Super Admin (Bagula 2 No Gram Panchayat)",
        status: "active",
        allowed_login_method: "all",
        service_scope: ["all"],
      } as any)
      .then(() => {});

    return { destination: "/admin/dashboard", role: "super_admin" };
  }

  const [{ data: rolesData, error: rolesErr }, { data: adminProfile, error: adminErr }] =
    await Promise.all([
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["super_admin", "admin", "deo"]),
      supabase
        .from("admin_profiles")
        .select("status, archived_at")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

  if (rolesErr) {
    console.error("Role lookup error:", rolesErr);
  }
  if (adminErr) {
    console.error("Admin profile lookup error:", adminErr);
  }

  const roles = (rolesData ?? []).map((r) => r.role);

  if (roles.length === 0 && ADMIN_EMAILS.includes(normEmail)) {
    const { error: rpcError } = await supabase.rpc("bootstrap_admin_role");
    if (!rpcError) {
      if (normEmail === "nitush6488@gmail.com") {
        return { destination: "/admin/dashboard", role: "admin" };
      }
      return { destination: "/admin/deo", role: "deo" };
    }
  }

  if (roles.length > 0) {
    if (adminProfile?.status === "suspended" || adminProfile?.archived_at) {
      return {
        destination: "/admin",
        role: null,
        error: "This office account has been suspended or revoked. Please contact the Super Admin.",
      };
    }

    if (roles.includes("super_admin")) {
      return { destination: "/admin/dashboard", role: "super_admin" };
    }
    if (roles.includes("admin")) {
      return { destination: "/admin/dashboard", role: "admin" };
    }
    if (roles.includes("deo")) {
      return { destination: "/admin/deo", role: "deo" };
    }
  }

  return {
    destination: "/admin",
    role: null,
    error: "Access restricted to authorized office accounts (DEO, Admin, Super Admin).",
  };
}
