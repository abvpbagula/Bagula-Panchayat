import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePortalAccessState, type PortalKey } from "@/lib/portalAccessControl";
import { AccessDeniedState } from "./AccessDeniedState";
import { MetricCardsSkeleton, ApplicationListSkeleton } from "@/components/skeletons/DashboardSkeletons";

interface FailClosedAccessWrapperProps {
  portal: PortalKey;
  children: ReactNode;
  fallback?: ReactNode;
  redirectIfUnauthorized?: boolean;
  requiredRoleLabel?: string;
  loginPath?: string;
}

/**
 * Fail-Closed Access Control Wrapper.
 * Default behavior: DENIED until explicit authorization is verified.
 * Unauthorized requests fail closed to AccessDeniedState or direct login redirect.
 */
export function FailClosedAccessWrapper({
  portal,
  children,
  fallback,
  redirectIfUnauthorized = false,
  requiredRoleLabel,
  loginPath,
}: FailClosedAccessWrapperProps) {
  const access = usePortalAccessState();
  const location = useLocation();

  const portalStatus = access[portal];

  // While checking, render a smooth skeleton placeholder rather than leaking or flickering
  if (portalStatus?.checking || (portal === "admin" && access.isLoading)) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <MetricCardsSkeleton count={4} />
        <ApplicationListSkeleton count={3} />
      </div>
    );
  }

  // Not authorized: fail closed!
  if (portalStatus && !portalStatus.isAuthorized) {
    if (redirectIfUnauthorized) {
      return (
        <Navigate
          to={loginPath || portalStatus.loginPath}
          replace
          state={{ from: location.pathname, failClosedDenied: true }}
        />
      );
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDeniedState
        portal={portal}
        requiredRoleLabel={requiredRoleLabel || portalStatus.requiredRoleLabel}
        loginPath={loginPath || portalStatus.loginPath}
      />
    );
  }

  // Authorized: render protected content
  return <>{children}</>;
}
