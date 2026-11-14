import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { setLastRedirectReason, writeAdminAuthDebug } from "@/lib/adminAuthDebug";
import ForceChangePassword from "@/components/ForceChangePassword";
import { AdminIdleTimer } from "@/components/AdminIdleTimer";
import {
  TEMP_ADMIN_EMAIL,
  getConfiguredOfficeCredential,
} from "@/lib/tempAdminCredentials";
import { isSupabaseConfigured } from "@/lib/supabaseEnv";
import {
  isSuperAdminEmail,
  isPrimarySuperAdminEmail,
  getDesignatedOfficeRole,
  SUPER_ADMIN_EMAILS,
  PRIMARY_SUPER_ADMIN_EMAIL,
} from "@/lib/permissions";
import {
  recordAdminAuthAuditEvent,
  upsertAdminSessionHeartbeat,
} from "@/lib/authAuditService";

// Whitelist mirrored server-side in the `bootstrap_admin_role` RPC.
// Actual role assignment is done there — do not infer permissions from this list.
export const ADMIN_EMAILS = [
  PRIMARY_SUPER_ADMIN_EMAIL,
  "bagulaiiofficerecords@gmail.com",
  "nitish374482@gmail.com",
  "nitush6488@gmail.com",
  "nitush8343980898@gmail.com",
];

type Status = "checking" | "allowed" | "granted" | "denied" | "error" | "must_change_password";

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  // Fast synchronous session check for instant bypass without waiting or UI flashing
  const [status, setStatus] = useState<Status>(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("auth-token"))) {
          const item = localStorage.getItem(key);
          if (item && SUPER_ADMIN_EMAILS.some((e) => item.includes(e))) {
            return "granted";
          }
        }
      }
    } catch (_err) {
      // Local storage not accessible
    }
    return "checking";
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let active = true;

    const verify = async () => {
      writeAdminAuthDebug({
        sessionState: "checking",
        roleLookupResult: "not_checked",
        roleLookupMessage: "Admin guard started session restoration.",
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        if (active) {
          setLastRedirectReason("No persisted session found in admin guard.");
          setStatus("denied");
          navigate("/admin", { replace: true });
        }
        return;
      }

      const email = session.user.email?.trim().toLowerCase() ?? null;
      const isSyntheticOfficeSession = Boolean(
        session.access_token?.startsWith("temp_admin_token_")
      );

      // =========================================================================
      // AUTHORIZATION BYPASS FOR DESIGNATED SUPER ADMINS
      // =========================================================================
      if (isSuperAdminEmail(email)) {
        if (active) {
          setUserId(session.user.id);
          setStatus("granted");
          writeAdminAuthDebug({
            sessionState: "present",
            userId: session.user.id,
            email,
            roleLookupResult: "found",
            roleLookupMessage: "Super Admin boss account bypass: access granted unconditionally.",
            lastRedirectReason: null,
          });
        }
        // Asynchronously synchronize super_admin role and active profile without blocking or rejecting
        upsertAdminSessionHeartbeat({
          email,
          role: "super_admin",
          loginMethod: "session",
        });
        if (isSupabaseConfigured && !isSyntheticOfficeSession) {
          supabase
            .from("user_roles")
            .upsert({ user_id: session.user.id, role: "super_admin" } as any)
            .then(() => {});
          supabase
            .from("admin_profiles")
            .upsert({
              user_id: session.user.id,
              email: email,
              display_name: isPrimarySuperAdminEmail(email)
                ? "Super Admin (Bagula 2 No Gram Panchayat)"
                : "Super Admin (Bagula 2 No Gram Panchayat)",
              status: "active",
              allowed_login_method: "all",
              service_scope: ["all"],
              archived_at: null,
            } as any)
            .then(() => {});
        }
        return;
      }

      // Allow configured local/preview office credentials (e.g. nitush6488@gmail.com DEO, nitush8343980898@gmail.com Admin)
      const configuredCred = getConfiguredOfficeCredential(email);
      if (configuredCred && (!isSupabaseConfigured || isSyntheticOfficeSession)) {
        if (active) {
          setUserId(session.user.id);
          setStatus("allowed");
          writeAdminAuthDebug({
            sessionState: "present",
            userId: session.user.id,
            email,
            roleLookupResult: "found",
            roleLookupMessage: `Configured office session verified (${configuredCred.role}); access granted.`,
            lastRedirectReason: null,
          });
        }
        upsertAdminSessionHeartbeat({
          email,
          role: configuredCred.role,
          loginMethod: "session",
        });
        return;
      }

      // Check roles and admin profile
      const [{ data: roles, error }, { data: profile }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .in("role", ["admin", "super_admin", "deo"]),
        supabase
          .from("admin_profiles")
          .select("status, must_change_password, created_at, archived_at, temp_password_issued_at, updated_at")
          .eq("user_id", session.user.id)
          .maybeSingle(),
      ]);

      if (!active) return;

      if (error) {
        setMessage(`Access check failed: ${error.message}`);
        writeAdminAuthDebug({
          sessionState: "present",
          userId: session.user.id,
          email,
          roleLookupResult: "error",
          roleLookupMessage: error.message,
        });
        setStatus("error");
        return;
      }

      const isTempAdminSession =
        (email === TEMP_ADMIN_EMAIL || isSuperAdminEmail(email)) &&
        sessionStorage.getItem("bagula2_temp_must_change_password") === "true";

      if (isSuperAdminEmail(email)) {
        const hasSuperRole = (roles ?? []).some((r) => r.role === "super_admin");
        if (!hasSuperRole) {
          supabase
            .from("user_roles")
            .upsert({ user_id: session.user.id, role: "super_admin" } as any)
            .then(() => {});
        }
        if (!profile) {
          supabase
            .from("admin_profiles")
            .upsert({
              user_id: session.user.id,
              email: email,
              display_name: "Super Admin (Bagula 2 No Gram Panchayat)",
              status: "active",
              allowed_login_method: "all",
              service_scope: ["all"],
              archived_at: null,
            } as any)
            .then(() => {});
        }
      } else if (!roles || roles.length === 0) {
        // Allow self-provision for whitelisted emails or temp admin session
        if (isTempAdminSession) {
          // Authorized session for primary GP Super Admin
        } else if (email && ADMIN_EMAILS.includes(email)) {
          const { error: rpcError } = await supabase.rpc("bootstrap_admin_role");
          if (!active) return;
          if (rpcError) {
            setMessage(`Admin role setup failed: ${rpcError.message}`);
            setStatus("error");
            return;
          }
        } else {
          await recordAdminAuthAuditEvent({
            eventType: "auth.unauthorized_admin_route",
            actorEmail: email,
            loginMethod: "session",
            reason: "Authenticated non-admin user attempted to access protected administrative route",
            severity: "warning",
            isUnauthorizedAttempt: true,
          });
          await supabase.auth.signOut();
          setLastRedirectReason("Signed-in user has no admin role.");
          setStatus("denied");
          navigate("/admin", { replace: true });
          return;
        }
      }

      // Check suspended status / temporary password
      if (profile?.status === "suspended" || profile?.archived_at) {
        await recordAdminAuthAuditEvent({
          eventType: "auth.suspended_account_blocked",
          actorEmail: email,
          loginMethod: "session",
          reason: "Suspended or archived office account blocked by session guard",
          severity: "warning",
          isUnauthorizedAttempt: true,
        });
        await supabase.auth.signOut();
        if (active) {
          setLastRedirectReason("Admin account is suspended.");
          setStatus("denied");
          navigate("/admin", { replace: true });
        }
        return;
      }

      const resolvedRole =
        getDesignatedOfficeRole(email) || (roles ?? [])[0]?.role || "admin";

      writeAdminAuthDebug({
        sessionState: "present",
        userId: session.user.id,
        email,
        roleLookupResult: "found",
        roleLookupMessage: "Admin role verified; access granted.",
        lastRedirectReason: null,
      });

      upsertAdminSessionHeartbeat({
        email,
        role: resolvedRole,
        loginMethod: "session",
      });

      // Best-effort last_login_at update (once per session)
      const key = `lastLoginUpdated:${session.user.id}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        supabase
          .from("admin_profiles")
          .update({ last_login_at: new Date().toISOString() })
          .eq("user_id", session.user.id)
          .then(() => {});
      }

      setUserId(session.user.id);

      // Login with a Super-Admin-issued temporary password.
      const mustChange =
        isTempAdminSession || !!(profile as any)?.must_change_password;

      if (mustChange) {
        // Enforce 30-minute window from temporary password issue time
        let issuedTimeStr =
          (profile as any)?.temp_password_issued_at ||
          (profile as any)?.updated_at ||
          (profile as any)?.created_at;

        if (isTempAdminSession) {
          const storedIssuedAt = sessionStorage.getItem("bagula2_temp_issued_at");
          if (storedIssuedAt) {
            issuedTimeStr = new Date(Number(storedIssuedAt)).toISOString();
          }
        }

        const issuedTime = new Date(issuedTimeStr || Date.now()).getTime();
        const now = Date.now();
        const thirtyMinutes = 30 * 60 * 1000; // 30-minute window

        if (now - issuedTime > thirtyMinutes) {
          await supabase.auth.signOut();
          sessionStorage.removeItem("bagula2_temp_must_change_password");
          sessionStorage.removeItem("bagula2_temp_issued_at");
          if (active) {
            setLastRedirectReason(
              "Your temporary credentials have expired (30-minute limit). Please request a password reset from Super Admin."
            );
            setStatus("denied");
            navigate("/admin", { replace: true });
          }
          return;
        }

        setStatus("must_change_password");
        return;
      }


      setStatus("allowed");
    };

    verify();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setLastRedirectReason("Auth state changed to signed out.");
        setStatus("denied");
        navigate("/admin", { replace: true });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-foreground max-w-md">{message}</p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/admin", { replace: true });
          }}
          className="text-xs underline text-muted-foreground"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (status === "must_change_password" && userId) {
    return <ForceChangePassword userId={userId} onDone={() => setStatus("allowed")} />;
  }

  if (status !== "allowed" && status !== "granted") return null;

  return <AdminIdleTimer>{children}</AdminIdleTimer>;
}
