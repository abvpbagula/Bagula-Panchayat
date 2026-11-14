import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";
import { ShieldCheck, SlidersHorizontal, KeyRound } from "lucide-react";
import { AuthAuditConsole } from "@/components/admin/AuthAuditConsole";

export default function AdminAuthAuditPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <Helmet>
        <title>Authentication &amp; Intrusion Audit — Bagula 2 No Gram Panchayat</title>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <BackButton fallbackUrl="/admin/dashboard" label="Dashboard" size="sm" variant="outline" className="h-8 text-xs" />
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
              Security &amp; Session Telemetry
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Link to="/admin/manage">
                <KeyRound size={13} />
                <span>Office Accounts</span>
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Link to="/admin/auth-checklist">
                <ShieldCheck size={13} />
                <span>Auth Checklist</span>
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8 text-xs gap-1.5">
              <Link to="/admin/control-center">
                <SlidersHorizontal size={13} />
                <span>Control Center</span>
              </Link>
            </Button>
          </div>
        </div>

        <AuthAuditConsole />
      </div>
    </div>
  );
}
