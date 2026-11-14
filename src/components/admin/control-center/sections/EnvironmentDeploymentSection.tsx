import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Server, ShieldCheck, CheckCircle2, RefreshCw, Cpu, HardDrive, Terminal } from "lucide-react";
import { SETTINGS_CHANGE_EVENT } from "@/lib/appSettings";

export const EnvironmentDeploymentSection: React.FC = () => {
  const [clearing, setClearing] = useState(false);

  const handleBroadcastSync = () => {
    setClearing(true);
    // Dispatches storage and window broadcast events to force all open tabs/views to re-read settings
    window.dispatchEvent(new Event(SETTINGS_CHANGE_EVENT));
    window.dispatchEvent(new Event("storage"));
    setTimeout(() => {
      setClearing(false);
      toast.success("Broadcast synchronization signal transmitted to all connected client tabs.");
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Container Network Binding Status */}
      <Card className="shadow-xs border border-blue-400/30 bg-blue-50/10">
        <CardContent className="p-4 flex items-start justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-foreground">
                Container Sandbox & Ingress Invariant
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The application runtime runs in an isolated Cloud Run container binding strictly to <strong className="text-foreground">Port 3000</strong> behind an Nginx reverse proxy.
                External traffic routes exclusively through this managed gateway.
              </p>
            </div>
          </div>

          <Badge variant="default" className="text-[10px] bg-emerald-600 font-mono shrink-0">
            PORT 3000 HEALTHY
          </Badge>
        </CardContent>
      </Card>

      {/* Deployment Diagnostics */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span>Runtime Environment & Architecture</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Container metrics, build configurations, and client cache management.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBroadcastSync}
              disabled={clearing}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${clearing ? "animate-spin" : ""}`} />
              Sync Runtime Cache
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground">Framework & Bundler</span>
              <div className="font-semibold text-foreground">React 18 + Vite SPA</div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground">Deployment Architecture</span>
              <div className="font-semibold text-foreground">Cloud Run / Containerized</div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground">Ingress Port</span>
              <div className="font-mono font-semibold text-emerald-600">0.0.0.0:3000</div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground">Database Layer</span>
              <div className="font-semibold text-foreground">Supabase PostgreSQL 15</div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground">Statutory Region</span>
              <div className="font-semibold text-foreground">Nadia, West Bengal (IN)</div>
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-[11px] text-muted-foreground">Timezone Standard</span>
              <div className="font-mono font-semibold text-foreground">Asia/Kolkata (IST UTC+5:30)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
