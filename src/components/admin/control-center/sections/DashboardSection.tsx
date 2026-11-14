import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  type ControlCenterSectionId,
} from "../types";
import {
  loadPublicWebsiteConfig,
  savePublicWebsiteConfig,
  loadFeatureFlagsConfig,
  saveFeatureFlagsConfig,
  type PublicWebsiteConfig,
  type FeatureFlagsConfig,
} from "@/lib/governanceCenterService";
import {
  FileText,
  Users,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  RefreshCw,
  Activity,
  SlidersHorizontal,
  KeyRound,
  ShieldAlert,
  Server,
  FileCheck2,
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardSectionProps {
  onNavigate: (section: ControlCenterSectionId) => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    warishPending: 0,
    warishApproved: 0,
    dependentPending: 0,
    dependentApproved: 0,
    activeDeos: 0,
    activeAdmins: 0,
    totalAuditCount: 0,
  });
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const [websiteConfig, setWebsiteConfig] = useState<PublicWebsiteConfig | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlagsConfig | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [
        { count: wPend },
        { count: wAppr },
        { count: dPend },
        { count: dAppr },
        { count: deos },
        { count: admins },
        { count: logsCount, data: logsData },
        webCfg,
        featCfg,
      ] = await Promise.all([
        supabase.from("warish_certificates" as any).select("id", { count: "exact", head: true }).eq("status", "Pending Signature & Memo Registration" as any),
        supabase.from("warish_certificates" as any).select("id", { count: "exact", head: true }).eq("status", "Approved" as any),
        supabase.from("dependent_certificates" as any).select("id", { count: "exact", head: true }).eq("status", "Pending Signature & Memo Registration" as any),
        supabase.from("dependent_certificates" as any).select("id", { count: "exact", head: true }).eq("status", "Approved" as any),
        supabase.from("user_roles" as any).select("id", { count: "exact", head: true }).eq("role", "deo" as any),
        supabase.from("user_roles" as any).select("id", { count: "exact", head: true }).in("role", ["admin", "super_admin"] as any),
        supabase.from("activity_logs" as any).select("id, action_type, actor_email, target_table, created_at").order("created_at", { ascending: false }).limit(6),
        loadPublicWebsiteConfig(),
        loadFeatureFlagsConfig(),
      ]);

      setStats({
        warishPending: wPend || 0,
        warishApproved: wAppr || 0,
        dependentPending: dPend || 0,
        dependentApproved: dAppr || 0,
        activeDeos: deos || 0,
        activeAdmins: admins || 0,
        totalAuditCount: logsCount || 0,
      });

      setRecentAudit(logsData || []);
      setWebsiteConfig(webCfg);
      setFeatureFlags(featCfg);
    } catch (err: any) {
      console.warn("Failed fetching dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleEmergencyBanner = async (checked: boolean) => {
    if (!websiteConfig) return;
    setUpdating(true);
    const updated = { ...websiteConfig, emergencyBannerActive: checked };
    setWebsiteConfig(updated);
    const res = await savePublicWebsiteConfig(updated);
    setUpdating(false);
    if (res.success) {
      toast.success(checked ? "Emergency Notice Banner activated on public portal." : "Emergency Notice Banner deactivated.");
    } else {
      toast.error(res.error || "Failed to update emergency banner");
    }
  };

  const handleToggleCyberIntake = async (checked: boolean) => {
    if (!featureFlags) return;
    setUpdating(true);
    const updated = { ...featureFlags, citizenOnlineApply: checked };
    setFeatureFlags(updated);
    const res = await saveFeatureFlagsConfig(updated);
    setUpdating(false);
    if (res.success) {
      toast.success(checked ? "Cyber Cafe Online Intake enabled." : "Cyber Cafe Online Intake paused.");
    } else {
      toast.error(res.error || "Failed to update feature flag");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome / Notice Card */}
      <div className="rounded-lg border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] tracking-wider uppercase font-mono">
              Central Command
            </Badge>
            <span className="text-xs text-muted-foreground">Bagula 2 No Gram Panchayat Authority Node</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground mt-1">
            Super Admin Full System Governance Center
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
            Authoritative administrative control over appearance, branding, public portal, certificate templates, security policies, and user authorization with strict backend audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
            className="text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Warish Queue</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-heading">{stats.warishPending}</span>
              <span className="text-[11px] text-muted-foreground">pending review</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-1.5">
              <span>Issued Register</span>
              <span className="font-semibold text-foreground">{stats.warishApproved}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Dependent Queue</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-heading">{stats.dependentPending}</span>
              <span className="text-[11px] text-muted-foreground">pending review</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-1.5">
              <span>Issued Register</span>
              <span className="font-semibold text-foreground">{stats.dependentApproved}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Staff & Roles</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-heading">{stats.activeDeos}</span>
              <span className="text-[11px] text-muted-foreground">authorized DEOs</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-1.5">
              <span>Super/Admins</span>
              <span className="font-semibold text-foreground">{stats.activeAdmins}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Security & Audit</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-heading text-emerald-600">PASS</span>
              <span className="text-[11px] text-muted-foreground">RLS Hardened</span>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between border-t pt-1.5">
              <span>Logged Actions</span>
              <span className="font-semibold text-foreground">{stats.totalAuditCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fast Operational Controls */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Fast Administrative Switches</span>
            <Badge variant="outline" className="text-[10px] font-mono">Live Sync</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Immediate runtime switches affecting the public website and intake channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 gap-2">
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Public Emergency Notice Banner</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Displays top emergency ribbon on Cyber Cafe Portal and application pages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={websiteConfig?.emergencyBannerActive || false}
                onCheckedChange={handleToggleEmergencyBanner}
                disabled={updating || !websiteConfig}
              />
              <span className="text-xs font-medium w-12 text-right">
                {websiteConfig?.emergencyBannerActive ? "Active" : "Off"}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-muted/20 gap-2">
            <div>
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                <span>Cyber Cafe Online Application Intake</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Allows open Cyber Cafe &amp; Assisted Desks to submit Warish, Dependent, and Linkage forms.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={featureFlags?.citizenOnlineApply || false}
                onCheckedChange={handleToggleCyberIntake}
                disabled={updating || !featureFlags}
              />
              <span className="text-xs font-medium w-12 text-right">
                {featureFlags?.citizenOnlineApply ? "Active" : "Paused"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Columns: Recent Audit & Key Jumps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Audit Timeline */}
        <Card className="shadow-xs border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Recent Governance Activity</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Audited modifications across configuration and user scopes.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate("audit-log")}
              className="text-xs text-primary gap-1 p-0 h-auto font-medium"
            >
              Full Log <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recentAudit.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No recent administrative activity recorded.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAudit.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-md border bg-card text-xs flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-foreground truncate font-mono text-[11px]">
                        {log.action_type}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        By: <span className="font-medium text-foreground/80">{log.actor_email || "System"}</span> | Table: {log.target_table || "global"}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {new Date(log.created_at).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Essential Governance Shortcuts */}
        <Card className="shadow-xs border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>Priority Governance Portals</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Direct access to critical administrative centers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <button
              onClick={() => onNavigate("appearance")}
              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-foreground group-hover:text-primary">
                  Appearance & Party Themes
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Configure Panchayat naming, party color profiles (BJP/TMC/CPIM/Congress), and layout density.
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate("auth")}
              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-foreground group-hover:text-primary">
                  Office Authentication Policies
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Manage DEO, Admin, and Super Admin password, Email OTP, and Google SSO policies.
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate("templates")}
              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-foreground group-hover:text-primary">
                  Certificate Templates & Print Setup
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Design certificate layouts, bind data tokens, set millimeter margins, and inspect version snapshots.
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
            </button>

            <button
              onClick={() => onNavigate("security")}
              className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-foreground group-hover:text-primary">
                  Security Center & RLS Audit
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Inspect database security policies, password complexity rules, and container runtime isolation.
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
