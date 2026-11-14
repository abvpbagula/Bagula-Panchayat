import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Plug, ShieldCheck, CheckCircle2, Globe, Database, Mail, Lock, AlertCircle, RefreshCw } from "lucide-react";

export const IntegrationsSection: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "error">("checking");
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  // Real Google OAuth check
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const googleConfigured = Boolean(googleClientId && googleClientId !== "your-google-client-id");

  const pingDatabase = async () => {
    setDbStatus("checking");
    const t0 = performance.now();
    try {
      const { error } = await supabase.from("business_rules" as any).select("id").limit(1);
      const elapsed = Math.round(performance.now() - t0);
      if (error) {
        setDbStatus("error");
        setDbError(error.message);
        toast.error(`Database query failed: ${error.message}`);
      } else {
        setDbStatus("connected");
        setDbLatency(elapsed);
        setDbError(null);
        toast.success(`Database latency: ${elapsed}ms. Connected to PostgreSQL.`);
      }
    } catch (err: any) {
      setDbStatus("error");
      setDbError(err.message || "Unknown error");
      toast.error(`Database unreachable: ${err.message}`);
    }
  };

  useEffect(() => {
    pingDatabase();
  }, []);

  return (
    <div className="space-y-6">
      {/* Zero Leakage Security Notice */}
      <Card className="shadow-xs border border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Zero-Exposure Secret Management Principle
            </div>
            <p className="text-muted-foreground leading-relaxed">
              API secrets, Supabase Service Role keys, and OAuth private certificates are managed securely via container environment configurations and never exposed in browser DOM or client inputs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Connected Services Grid */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Plug className="h-4 w-4 text-primary" />
            <span>Infrastructure Gateways & Third-Party Connectors</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Real-time verified status of database clusters, identity providers, and government gateways.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          {/* Supabase */}
          <div className="p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">Supabase PostgreSQL & Storage Cluster</span>
                  {dbStatus === "connected" && (
                    <Badge variant="default" className="text-[9px] bg-emerald-600">CONNECTED ({dbLatency}ms)</Badge>
                  )}
                  {dbStatus === "checking" && (
                    <Badge variant="secondary" className="text-[9px]">PINGING...</Badge>
                  )}
                  {dbStatus === "error" && (
                    <Badge variant="destructive" className="text-[9px]">ERROR</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Authoritative RLS data layer, transaction logs, and private document store buckets.
                  {dbError && <span className="block text-destructive mt-1 font-mono text-[10px]">{dbError}</span>}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 self-end sm:self-center gap-1.5"
              disabled={dbStatus === "checking"}
              onClick={pingDatabase}
            >
              <RefreshCw className={`h-3 w-3 ${dbStatus === "checking" ? "animate-spin" : ""}`} />
              Ping Cluster
            </Button>
          </div>

          {/* Google Identity */}
          <div className="p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">Google Identity Services (GSI)</span>
                  {googleConfigured ? (
                    <Badge variant="default" className="text-[9px] bg-emerald-600">CONFIGURED</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">NOT CONFIGURED</Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {googleConfigured
                    ? "Client-side Google One-Tap & OAuth token exchange enabled for citizen SSO."
                    : "VITE_GOOGLE_CLIENT_ID not specified in environment. Google sign-in falls back to email OTP."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 self-end sm:self-center"
              onClick={() => {
                if (googleConfigured) {
                  toast.success("Google OAuth Client ID is set.");
                } else {
                  toast.info("Google OAuth is not configured. Email OTP is the primary citizen channel.");
                }
              }}
            >
              Check Status
            </Button>
          </div>

          {/* Mail Delivery */}
          <div className="p-3.5 rounded-lg border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">Transactional Mail Delivery</span>
                  <Badge variant="outline" className="text-[9px] text-blue-600 border-blue-300">SUPABASE AUTH MAILER</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Authentication confirmation, login OTPs, and system notifications dispatched through Supabase Mail infrastructure.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 self-end sm:self-center"
              onClick={() => toast.info("Supabase Auth Mailer active for OTP & auth notifications.")}
            >
              Mailer Info
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
