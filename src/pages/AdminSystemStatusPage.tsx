import { BackButton } from "@/components/BackButton";
import { AdminSystemStatusWidget } from "@/components/admin/AdminSystemStatusWidget";
import { useAuthz } from "@/lib/permissions";
import { ShieldCheck, Sparkles, Activity, Database, ShieldAlert, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AdminSystemStatusPage() {
  const authz = useAuthz();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <BackButton fallbackUrl="/admin/dashboard" label="🏠 Dashboard" className="-ml-2 text-xs" />
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-primary" />
            <span>Bagula 2 No Gram Panchayat · Super Admin Telemetry</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              🖥️ Super Admin System Status & Audit Telemetry
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Real-time monitoring of database connection telemetry, security & authentication incident logs, storage metrics, and Super Admin audit activity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium">
              <Link to="/admin/activity">
                <Activity size={13} className="mr-1.5 text-primary" />
                Audit & Activity Log
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-medium">
              <Link to="/admin/control-center">
                <ShieldAlert size={13} className="mr-1.5 text-emerald-600" />
                Control Center
              </Link>
            </Button>
          </div>
        </div>

        {/* Status widget in full layout */}
        <AdminSystemStatusWidget />

        <div className="p-4 rounded-xl border border-border/40 bg-white/70 text-xs text-muted-foreground space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            <Sparkles size={13} className="text-primary" />
            <span>Super Admin Security & Data Integrity Standards</span>
          </div>
          <p>
            • Database queries execute over TLS 1.3 secured channels with Postgres Row-Level Security (RLS) enforcement.
          </p>
          <p>
            • Audit trails record security events, session expirations, and credential validation failures while strictly masking private passwords and credentials.
          </p>
          <p>
            • Storage utilization metrics aggregate uploaded citizen proofs (Voter ID, Death Certificates, affidavits) and automated DR backups with sha256 checksum tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
