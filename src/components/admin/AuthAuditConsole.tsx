import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Monitor,
  Clock,
  RefreshCw,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Search,
  Users,
  Activity,
  ExternalLink,
} from "lucide-react";
import {
  fetchAuthAuditSnapshot,
  revokeAdminUserSessions,
  acknowledgeIntrusionAlert,
  recordAdminAuthAuditEvent,
  type AuthAuditSnapshot,
} from "@/lib/authAuditService";
import { PRIMARY_SUPER_ADMIN_EMAIL, useAuthz } from "@/lib/permissions";

interface AuthAuditConsoleProps {
  compact?: boolean;
}

export const AuthAuditConsole: React.FC<AuthAuditConsoleProps> = ({ compact = false }) => {
  const authz = useAuthz();
  const [snapshot, setSnapshot] = useState<AuthAuditSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "super_admin_intrusion" | "unauthorized" | "sessions">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAuthAuditSnapshot();
      setSnapshot(data);
    } catch (err: any) {
      toast.error("Failed to load authentication audit snapshot: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  const handleRevokeSessions = async (email: string) => {
    setRevokingEmail(email);
    try {
      await revokeAdminUserSessions(email, authz.email || PRIMARY_SUPER_ADMIN_EMAIL);
      toast.success(`Terminated active sessions for ${email}`);
      await loadSnapshot();
    } catch (err: any) {
      toast.error(err?.message || "Failed to revoke sessions");
    } finally {
      setRevokingEmail(null);
    }
  };

  const handleAcknowledgeAlert = async (logId: string) => {
    try {
      await acknowledgeIntrusionAlert(logId, authz.email || PRIMARY_SUPER_ADMIN_EMAIL);
      toast.success("Intrusion alert acknowledged and archived in audit ledger.");
      await loadSnapshot();
    } catch (err: any) {
      toast.error(err?.message || "Failed to acknowledge alert");
    }
  };

  const handleSimulateIntrusionCheck = async () => {
    await recordAdminAuthAuditEvent({
      eventType: "auth.super_admin_intrusion_blocked",
      actorEmail: PRIMARY_SUPER_ADMIN_EMAIL,
      loginMethod: "password",
      reason: `Unauthorized credential probe targeting Root Super Admin (${PRIMARY_SUPER_ADMIN_EMAIL}) intercepted & blocked`,
      routePath: "/admin",
      severity: "critical",
      isUnauthorizedAttempt: true,
      targetSuperAdminOverride: true,
    });
    toast.warning("Simulated Super Admin intrusion attempt logged & flagged in real-time.");
    await loadSnapshot();
  };

  const filteredLogs = (snapshot?.logs || []).filter((log) => {
    if (filterMode === "super_admin_intrusion") {
      if (!(log.is_unauthorized_attempt && log.target_super_admin)) return false;
    } else if (filterMode === "unauthorized") {
      if (!log.is_unauthorized_attempt) return false;
    } else if (filterMode === "sessions") {
      if (log.is_unauthorized_attempt) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actor_email.toLowerCase().includes(q) ||
        log.location_label.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q) ||
        log.event_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unacknowledgedIntrusions = (snapshot?.superAdminIntrusions || []).filter(
    (item) => !item.acknowledged
  );

  return (
    <div className="space-y-6">
      {/* Top Action & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Administrative Session &amp; Intrusion Audit
            </h2>
            <Badge variant="outline" className="font-mono text-[10px] tabular-nums">
              Root: {PRIMARY_SUPER_ADMIN_EMAIL}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live session counts, login geolocation telemetry, and Super Admin unauthorized access detection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateIntrusionCheck}
            className="h-8 text-xs font-medium gap-1.5"
            title="Test the Super Admin intrusion detection pipeline"
          >
            <ShieldAlert size={13} className="text-rose-600" />
            <span>Test Intrusion Flag</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadSnapshot}
            disabled={loading}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh Telemetry</span>
          </Button>
          {compact && (
            <Button asChild size="sm" className="h-8 text-xs font-semibold gap-1.5">
              <Link to="/admin/auth-audit">
                <span>Full Audit Console</span>
                <ExternalLink size={12} />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* 4-Card KPI Summary Strip (tabular-nums) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Active Admin Sessions</span>
            <Users size={15} className="text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {snapshot?.totalActiveSessions ?? "—"}
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              {snapshot?.officers.length ?? 4} Officers Monitored
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Recent Login Locations</span>
            <MapPin size={15} className="text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {snapshot?.uniqueLocationsCount ?? "—"}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Nadia · IST Primary
            </span>
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-2xs ${
            (snapshot?.unacknowledgedSuperAdminAlerts ?? 0) > 0
              ? "border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/30"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-rose-800 dark:text-rose-300">
            <span>Super Admin Intrusion Alerts</span>
            <ShieldAlert size={15} className="text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-700 dark:text-rose-400">
              {snapshot?.superAdminIntrusions.length ?? 0}
            </span>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 tabular-nums">
              {snapshot?.unacknowledgedSuperAdminAlerts ?? 0} Unacknowledged
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Root Super Admin Lock</span>
            <Lock size={15} className="text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400">
              PROTECTED
            </span>
            <span className="text-[11px] text-slate-500">
              RLS + Trigger Enforced
            </span>
          </div>
        </div>
      </div>

      {/* High-Priority Super Admin Unauthorized Access Alert Banner */}
      {unacknowledgedIntrusions.length > 0 && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50/90 dark:bg-rose-950/40 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  Flagged Unauthorized Access Attempts Targeting Super Admin Accounts ({unacknowledgedIntrusions.length})
                </h3>
                <p className="text-xs text-rose-800 dark:text-rose-300">
                  Immediate scrutiny recommended for attempts against{" "}
                  <span className="font-mono font-semibold">{PRIMARY_SUPER_ADMIN_EMAIL}</span> or{" "}
                  <span className="font-mono font-semibold">nitish374482@gmail.com</span>.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilterMode("super_admin_intrusion")}
              className="h-8 text-xs font-semibold border-rose-300 bg-white text-rose-800 hover:bg-rose-100 shrink-0"
            >
              Isolate Intrusion Logs
            </Button>
          </div>

          <div className="space-y-2 pt-1">
            {unacknowledgedIntrusions.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-rose-600 text-white text-[10px] font-mono uppercase">
                      SUPER ADMIN INTRUSION FLAG
                    </Badge>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {alert.actor_email}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {alert.location_label}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">{alert.reason}</p>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    Method: {alert.login_method.toUpperCase()} · Device: {alert.device_summary} · Hash: {alert.ip_hash} ·{" "}
                    {new Date(alert.created_at).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="h-7 text-xs gap-1"
                  >
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    <span>Acknowledge</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Administrative Users Session & Login Location Matrix */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users size={16} className="text-blue-700" />
                <span>Administrative Users — Active Sessions &amp; Login Locations</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time session count, recent login geography, and intrusion target counter per officer account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-3">Administrative Officer</th>
                  <th className="py-2.5 px-3">Role &amp; Protection</th>
                  <th className="py-2.5 px-3 text-right">Active Sessions</th>
                  <th className="py-2.5 px-3">Recent Login Locations</th>
                  <th className="py-2.5 px-3">Device &amp; Last Seen</th>
                  <th className="py-2.5 px-3 text-right">Flagged Attempts</th>
                  <th className="py-2.5 px-3 text-right">Session Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {(snapshot?.officers || []).map((officer) => (
                  <tr
                    key={officer.email}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {officer.displayName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {officer.email}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={officer.isSuperAdmin ? "default" : "secondary"}
                          className={`text-[10px] font-mono uppercase ${
                            officer.isPrimarySuperAdmin
                              ? "bg-blue-900 text-white"
                              : officer.isSuperAdmin
                              ? "bg-indigo-700 text-white"
                              : ""
                          }`}
                        >
                          {officer.isPrimarySuperAdmin
                            ? "ROOT SUPER ADMIN"
                            : officer.role.replace("_", " ")}
                        </Badge>
                        {officer.isSuperAdmin && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-0.5">
                            <Lock size={10} /> Locked
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top text-right font-mono font-bold tabular-nums">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                          officer.activeSessionCount > 0
                            ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            officer.activeSessionCount > 0 ? "bg-emerald-600" : "bg-slate-400"
                          }`}
                        />
                        {officer.activeSessionCount} active
                      </span>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="space-y-1">
                        {officer.recentLocations.map((loc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1 text-slate-700 dark:text-slate-300"
                          >
                            <MapPin size={12} className="text-blue-600 shrink-0" />
                            <span className="truncate max-w-[240px]">{loc}</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top">
                      <div className="text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Monitor size={12} className="text-slate-400 shrink-0" />
                        <span>{officer.lastDevice}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                        {officer.lastSeenAt
                          ? new Date(officer.lastSeenAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No recent session"}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-top text-right font-mono tabular-nums">
                      {officer.unauthorizedAttemptsAgainstAccount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                          <AlertTriangle size={11} />
                          {officer.unauthorizedAttemptsAgainstAccount} flagged
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="py-3 px-3 align-top text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={revokingEmail === officer.email || officer.activeSessionCount === 0}
                        onClick={() => handleRevokeSessions(officer.email)}
                        className="h-7 text-[11px] gap-1"
                      >
                        <LogOut size={11} />
                        <span>
                          {revokingEmail === officer.email ? "Revoking..." : "Revoke Sessions"}
                        </span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Authentication & Unauthorized Intrusion Feed */}
      {!compact && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity size={16} className="text-blue-700" />
                  <span>Authentication &amp; Intrusion Event Ledger ({filteredLogs.length})</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Every login, OTP challenge, and blocked access attempt with location and device fingerprint.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilterMode("all")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterMode === "all"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    All ({snapshot?.logs.length ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("super_admin_intrusion")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterMode === "super_admin_intrusion"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    Super Admin Alerts ({snapshot?.superAdminIntrusions.length ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("unauthorized")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterMode === "unauthorized"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    All Unauthorized
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterMode("sessions")}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      filterMode === "sessions"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Verified Logins
                  </button>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter email or location..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No authentication events match the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const isSuperIntrusion = log.is_unauthorized_attempt && log.target_super_admin;
                  return (
                    <div
                      key={log.id}
                      className={`py-3 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                        isSuperIntrusion ? "bg-rose-50/40 dark:bg-rose-950/20" : ""
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isSuperIntrusion ? (
                            <Badge className="bg-rose-600 text-white text-[10px] font-mono">
                              SUPER ADMIN INTRUSION ATTEMPT
                            </Badge>
                          ) : log.is_unauthorized_attempt ? (
                            <Badge variant="outline" className="border-amber-400 text-amber-800 text-[10px] font-mono">
                              UNAUTHORIZED ATTEMPT
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-300 text-emerald-800 text-[10px] font-mono">
                              AUTHORIZED SESSION
                            </Badge>
                          )}

                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {log.actor_email}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {log.event_type}
                          </span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300">{log.reason}</p>

                        <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Location: {log.location_label} · Device: {log.device_summary} · Route: {log.route_path} ·{" "}
                          {new Date(log.created_at).toLocaleString("en-IN")}
                        </div>
                      </div>

                      {isSuperIntrusion && !log.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledgeAlert(log.id)}
                          className="h-7 text-xs shrink-0 self-start sm:self-center"
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
