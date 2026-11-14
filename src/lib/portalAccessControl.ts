import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PortalKey = "cyber_cafe" | "elected" | "admin";

export interface PortalAccessStatus {
  portal: PortalKey;
  label: string;
  isAuthorized: boolean;
  userIdentifier?: string;
  roleName?: string;
  checking: boolean;
  requiredRoleLabel: string;
  loginPath: string;
}

export interface SystemAccessOverview {
  cyberCafe: PortalAccessStatus;
  elected: PortalAccessStatus;
  admin: PortalAccessStatus;
  isLoading: boolean;
}

export type PortalAccessState = SystemAccessOverview;

/**
 * Real-time hook checking open vs. office authorization state:
 * - Cyber Cafe Hub & Elected Member Portal: Open Access (zero login required)
 * - GP Office Administration (/admin): Fail-closed for DEO, Admin, and Super Admin only.
 */
export function usePortalAccessState(): SystemAccessOverview {
  const [adminAuth, setAdminAuth] = useState<{
    isAuthorized: boolean;
    email?: string;
    role?: string;
    checking: boolean;
  }>({
    isAuthorized: false,
    checking: true,
  });

  useEffect(() => {
    let active = true;

    const checkSupabase = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session || !session.user) {
          if (active) {
            setAdminAuth({ isAuthorized: false, checking: false });
          }
          return;
        }

        const email = session.user.email?.toLowerCase().trim() || "";
        const isSuperAdminEmail =
          email === "bagula2nogp111@gmail.com" ||
          email === "nitish374482@gmail.com" ||
          email === "nitush6488@gmail.com";

        if (isSuperAdminEmail) {
          if (active) {
            setAdminAuth({
              isAuthorized: true,
              email,
              role: "Super Admin / Admin",
              checking: false,
            });
          }
          return;
        }

        const { data: rolesData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (!active) return;

        const roles = (rolesData ?? []).map((r: any) => r.role);
        const hasAdminRole = roles.some((r) =>
          ["admin", "super_admin", "deo"].includes(r)
        );

        if (hasAdminRole) {
          setAdminAuth({
            isAuthorized: true,
            email,
            role: roles.includes("super_admin")
              ? "Super Admin"
              : roles.includes("admin")
              ? "Admin"
              : "DEO",
            checking: false,
          });
        } else {
          setAdminAuth({ isAuthorized: false, checking: false });
        }
      } catch (_err) {
        if (active) {
          setAdminAuth({ isAuthorized: false, checking: false });
        }
      }
    };

    checkSupabase();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      checkSupabase();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    cyberCafe: {
      portal: "cyber_cafe",
      label: "সাইবার ক্যাফে · Cyber Cafe & Assisted Service Hub",
      isAuthorized: true,
      userIdentifier: "Open Assisted Access",
      roleName: "Open Cyber Cafe Hub",
      checking: false,
      requiredRoleLabel: "Open Access (No Login Required)",
      loginPath: "/cyber-cafe",
    },
    elected: {
      portal: "elected",
      label: "জনপ্রতিনিধি · 30 Elected Sansad Ward Reps",
      isAuthorized: true,
      userIdentifier: "Open Ward Verification Desk",
      roleName: "Ward Inquiry & Verification Desk",
      checking: false,
      requiredRoleLabel: "Open Access (No Login Required)",
      loginPath: "/elected-portal",
    },
    admin: {
      portal: "admin",
      label: "অফিস প্রশাসন · GP Office Administration",
      isAuthorized: adminAuth.isAuthorized,
      userIdentifier: adminAuth.email,
      roleName: adminAuth.role || "DEO · Admin · Super Admin",
      checking: adminAuth.checking,
      requiredRoleLabel: "DEO / Admin / Super Admin Office Login",
      loginPath: "/admin",
    },
    isLoading: adminAuth.checking,
  };
}
