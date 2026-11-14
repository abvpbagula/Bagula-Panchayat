import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  useAuthz,
  hasPermission,
  hasServiceScope,
  isSuperAdminEmail,
  SUPER_ADMIN_EMAILS,
  type AppPermission,
  type AppAction,
} from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { recordAdminAuthAuditEvent } from "@/lib/authAuditService";

interface Props {
  permission: AppPermission;
  action?: AppAction;
  superAdminOnly?: boolean;
  children: ReactNode;
}

export default function RequirePermission({ permission, action = "view", superAdminOnly, children }: Props) {
  const authz = useAuthz();

  // Fast synchronous session check for instant bypass without waiting for async role lookups
  const [fastEmail, setFastEmail] = useState<string | null>(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("sb-") || key.includes("auth-token"))) {
          const item = localStorage.getItem(key);
          if (item) {
            const matched = SUPER_ADMIN_EMAILS.find((e) => item.includes(e));
            if (matched) return matched;
          }
        }
      }
    } catch (_err) {
      // Local storage not accessible
    }
    return null;
  });

  useEffect(() => {
    if (!fastEmail) {
      supabase.auth.getSession().then(({ data }) => {
        const e = data?.session?.user?.email?.trim().toLowerCase();
        if (isSuperAdminEmail(e)) {
          setFastEmail(e ?? null);
        }
      });
    }
  }, [fastEmail]);

  const currentEmail = authz.email?.trim().toLowerCase() || fastEmail;

  let allowed = isSuperAdminEmail(currentEmail)
    ? true
    : superAdminOnly
    ? authz.isSuperAdmin
    : hasPermission(authz, permission, action);

  if (allowed && !isSuperAdminEmail(currentEmail) && authz.role === "deo") {
    if (permission === "warish_certs") {
      allowed = hasServiceScope(
        {
          role: authz.role,
          serviceScope: authz.serviceScope,
          email: authz.email,
          isSuperAdmin: authz.isSuperAdmin,
        },
        "warish"
      );
    }
    if (permission === "dependent_certs") {
      allowed = hasServiceScope(
        {
          role: authz.role,
          serviceScope: authz.serviceScope,
          email: authz.email,
          isSuperAdmin: authz.isSuperAdmin,
        },
        "dependent"
      );
    }
  }

  useEffect(() => {
    if (!authz.loading && !allowed) {
      recordAdminAuthAuditEvent({
        eventType: superAdminOnly ? "auth.super_admin_route_blocked" : "auth.permission_denied",
        actorEmail: currentEmail || "unauthenticated",
        loginMethod: "session",
        reason: `Unauthorized access attempt to ${permission}:${action}${superAdminOnly ? " (Super Admin Restricted Module)" : ""}`,
        severity: superAdminOnly ? "critical" : "warning",
        isUnauthorizedAttempt: true,
        targetSuperAdminOverride: Boolean(superAdminOnly),
      });
    }
  }, [authz.loading, allowed, superAdminOnly, currentEmail, permission, action]);

  if (isSuperAdminEmail(currentEmail)) {
    return <>{children}</>;
  }

  if (authz.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Checking permissions…
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h2 className="text-base font-semibold">Access denied</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          You don't have the <code>{permission}:{action}</code> permission
          {superAdminOnly ? " (Super Admin required)" : ""}. This attempt has been logged in the Authentication Audit ledger.
        </p>
        <Link to="/admin/dashboard" className="text-xs underline text-muted-foreground">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
