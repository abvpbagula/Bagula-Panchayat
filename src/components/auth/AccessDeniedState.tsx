import { ShieldAlert, Lock, ArrowLeft, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PortalKey } from "@/lib/portalAccessControl";

interface AccessDeniedStateProps {
  portal: PortalKey;
  title?: string;
  description?: string;
  requiredRoleLabel?: string;
  loginPath?: string;
  onRetry?: () => void;
  showBackHome?: boolean;
}

const PORTAL_META: Record<PortalKey, { name: string; defaultRole: string; loginUrl: string }> = {
  elected: {
    name: "Ward Inquiry & Representative Desk (জনপ্রতিনিধি ডেস্ক)",
    defaultRole: "Open Access Directory",
    loginUrl: "/elected-portal",
  },
  admin: {
    name: "GP Office Administration (অফিস প্রশাসন)",
    defaultRole: "DEO / Admin / Super Admin Office Login",
    loginUrl: "/admin",
  },
};

export function AccessDeniedState({
  portal,
  title,
  description,
  requiredRoleLabel,
  loginPath,
  showBackHome = true,
}: AccessDeniedStateProps) {
  const navigate = useNavigate();
  const meta = PORTAL_META[portal] || PORTAL_META.admin;

  const targetRole = requiredRoleLabel || meta.defaultRole;
  const targetLogin = loginPath || meta.loginUrl;

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 sm:p-8 bg-white border border-red-200 shadow-lg rounded-2xl space-y-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center text-red-700 border border-red-200">
          <ShieldAlert className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-widest text-red-700">
            Fail-Closed Office Access Control
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {title || "Access Restricted · প্রবেশাধিকার সংরক্ষিত"}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description ||
              `Access to ${meta.name} requires verified office credentials. Unauthorized access is blocked under fail-closed security.`}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2 text-slate-800 font-semibold border-b border-slate-200 pb-2">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              Required Office Role
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-900">
              {targetRole}
            </span>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Authorized DEO, Admin, and Super Admin personnel must sign in at the Office Login portal using their official account.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {showBackHome && (
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="w-full sm:w-1/2 min-h-[44px] rounded-lg text-xs font-semibold gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Back to Home</span>
            </Button>
          )}

          <Button
            onClick={() => navigate(targetLogin)}
            className="w-full sm:w-1/2 min-h-[44px] rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>Office Login</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}
