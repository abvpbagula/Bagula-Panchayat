import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  ArrowLeft,
  RefreshCw,
  Database,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Info,
  Clock,
  Layers,
  FileCode,
  Zap,
  Trash2,
} from "lucide-react";
import { useAuthz } from "@/lib/permissions";
import { refetchSchemaCache } from "@/lib/adminDatabaseErrorHandler";
import {
  probeTableRls,
  probeRpc,
  fetchAllDiagnosticIncidents,
  analyzePermissionFailure,
  recordDiagnosticIncident,
  type DiagnosticProbeResult,
  type RlsIncidentLog,
} from "@/lib/diagnosticsService";

export default function AdminDiagnostics() {
  const authz = useAuthz();
  const [probes, setProbes] = useState<DiagnosticProbeResult[]>([]);
  const [probing, setProbing] = useState(false);
  const [incidents, setIncidents] = useState<RlsIncidentLog[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<RlsIncidentLog[] | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedSql, setCopiedSql] = useState(false);

  // Load all incidents
  const loadIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    try {
      const data = await fetchAllDiagnosticIncidents();
      setIncidents(data);
    } catch (err: any) {
      toast.error("Failed to load diagnostic logs: " + err.message);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  // Run comprehensive diagnostic probes
  const runAllProbes = useCallback(async () => {
    setProbing(true);
    const results: DiagnosticProbeResult[] = [];

    // 1. Probe dependent_certificates
    const depRes = await probeTableRls("dependent_certificates");
    results.push(depRes);

    // 2. Probe warish_certificates
    const warRes = await probeTableRls("warish_certificates");
    results.push(warRes);

    // 3. Probe core RPCs
    const rpc1 = await probeRpc("archive_expired_rejections");
    results.push(rpc1);

    const rpc2 = await probeRpc("restore_certificate", { _kind: "dependent", _cert_id: "00000000-0000-0000-0000-000000000000" });
    results.push(rpc2);

    const rpc3 = await probeRpc("reject_certificate_v2", {
      _kind: "dependent",
      _cert_id: "00000000-0000-0000-0000-000000000000",
      _reason: "Diagnostic probe dry-run",
    });
    results.push(rpc3);

    setProbes(results);
    setProbing(false);
    loadIncidents();

    const anyFailed = results.some((r) => r.status === "permission_denied" || r.status === "error");
    if (anyFailed) {
      toast.error("Diagnostic probe completed with permission errors detected.");
    } else {
      toast.success("Diagnostic probes completed successfully.");
    }
  }, [loadIncidents]);

  useEffect(() => {
    runAllProbes();
  }, [runAllProbes]);

  // SQL remediation script
  const sqlRemediationScript = `-- 1. GRANT TABLE LEVEL PERMISSIONS FOR DEPENDENT CERTIFICATES
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dependent_certificates TO authenticated;
GRANT SELECT ON TABLE public.dependent_certificates TO anon;

-- 2. VERIFY AND ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.dependent_certificates ENABLE ROW LEVEL SECURITY;

-- 3. ENSURE PERMISSIVE POLICIES FOR AUTHENTICATED STAFF & CREATORS
DROP POLICY IF EXISTS "Allow staff read dependent_certificates" ON public.dependent_certificates;
CREATE POLICY "Allow staff read dependent_certificates"
ON public.dependent_certificates FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Allow staff insert dependent_certificates" ON public.dependent_certificates;
CREATE POLICY "Allow staff insert dependent_certificates"
ON public.dependent_certificates FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow staff update dependent_certificates" ON public.dependent_certificates;
CREATE POLICY "Allow staff update dependent_certificates"
ON public.dependent_certificates FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. ENSURE CRITICAL WORKFLOW RPCS RUN AS SECURITY DEFINER (BYPASS CALLER RLS)
ALTER FUNCTION public.reject_certificate_v2(_kind public.cert_kind, _cert_id uuid, _reason text) SECURITY DEFINER;
ALTER FUNCTION public.restore_certificate(_kind text, _cert_id uuid) SECURITY DEFINER;
ALTER FUNCTION public.approve_certificate_v2 SECURITY DEFINER;
ALTER FUNCTION public.permanently_delete_rejected(_kind text, _cert_id uuid) SECURITY DEFINER;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlRemediationScript);
    setCopiedSql(true);
    toast.success("SQL remediation script copied to clipboard!");
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTarget = (inc.target_table || inc.rpc_name || "").toLowerCase().includes(q);
      const matchMsg = inc.error_message.toLowerCase().includes(q);
      const matchActor = (inc.actor_email || "").toLowerCase().includes(q);
      const matchCause = inc.root_cause.toLowerCase().includes(q);
      if (!matchTarget && !matchMsg && !matchActor && !matchCause) return false;
    }
    return true;
  });

  const clearLocalLogs = () => {
    localStorage.removeItem("bg2_rls_rpc_incidents_v1");
    toast.success("Local incident buffer cleared.");
    loadIncidents();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Link to="/admin" className="hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft size={12} /> Dashboard
              </Link>
              <span>/</span>
              <span>Super Admin Diagnostics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  RLS & RPC Application Diagnostics
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                    Super Admin Exclusive
                  </Badge>
                </h1>
                <p className="text-xs text-muted-foreground">
                  Deep diagnostic telemetry for PostgreSQL Row Level Security (RLS) and RPC execution logs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const tId = toast.loading("Refreshing PostgREST schema cache...");
                const res = await refetchSchemaCache();
                toast.dismiss(tId);
                if (res.success) {
                  toast.success("PostgREST schema synchronized!");
                  runAllProbes();
                } else {
                  toast.error(res.message);
                }
              }}
              className="text-xs gap-1.5"
            >
              <Database size={13} className="text-primary" />
              Sync Schema Cache
            </Button>

            <Button
              size="sm"
              onClick={runAllProbes}
              disabled={probing}
              className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
            >
              <RefreshCw size={13} className={probing ? "animate-spin" : ""} />
              {probing ? "Probing..." : "Run Live Diagnostic Probe"}
            </Button>
          </div>
        </div>

        {/* Live Probes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {probes.map((probe, idx) => {
            const isSuccess = probe.status === "success";
            const isDenied = probe.status === "permission_denied";
            return (
              <div
                key={idx}
                className={`rounded-2xl border p-4 bg-white shadow-xs transition ${
                  isDenied
                    ? "border-red-300 bg-red-50/20"
                    : isSuccess
                    ? "border-emerald-200 bg-white"
                    : "border-amber-200 bg-amber-50/20"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isDenied
                          ? "bg-red-100 text-red-700"
                          : isSuccess
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {probe.type === "table" ? <Layers size={14} /> : <Zap size={14} />}
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-800 break-all">{probe.target}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{probe.type} probe</div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isDenied
                        ? "bg-red-50 text-red-700 border-red-200"
                        : isSuccess
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {isDenied ? "42501 Denied" : isSuccess ? "Pass (200)" : probe.statusCode ?? "Notice"}
                  </Badge>
                </div>

                <div className="mt-3 text-xs text-slate-600 line-clamp-2">{probe.message}</div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Latency: {probe.latencyMs}ms</span>
                  <span>Role: {authz.role ?? "authenticated"}</span>
                </div>

                {probe.remediation && (
                  <div className="mt-2 text-[11px] bg-red-100/60 text-red-800 p-2 rounded-lg leading-relaxed">
                    <strong>Remedy:</strong> {probe.remediation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Special Root-Cause Diagnostic Analysis Card for dependent_certificates */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Deep Root-Cause Analysis: &quot;permission denied for table dependent_certificates&quot;
                </h2>
                <p className="text-xs text-muted-foreground">
                  Architectural breakdown of why PostgreSQL 42501 permission denied occurs and exact fixes.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={copySqlToClipboard}
              className="text-xs gap-1.5 shrink-0"
            >
              {copiedSql ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copiedSql ? "Copied SQL!" : "Copy Fix SQL"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
                Public / Citizen Direct Insert
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                When an unauthenticated public citizen submits a Dependent Certificate application, client queries execute under the PostgreSQL <code>anon</code> role. Because <code>dependent_certificates</code> table only allows authenticated staff inserts, direct client insertion throws <code>42501 permission denied</code>.
              </p>
              <div className="text-[11px] text-blue-700 font-medium">
                ✅ Fixed: The application now automatically routes citizen drafts through the Edge Function service role bypass.
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
                RPC &quot;SECURITY DEFINER&quot; Context
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                PostgreSQL stored procedures (such as <code>reject_certificate_v2</code>, <code>restore_certificate</code>, and <code>permanently_delete_rejected</code>) by default execute as <code>SECURITY INVOKER</code>. If the calling user lacks direct table UPDATE or DELETE permissions, PostgreSQL halts with <code>permission denied for table dependent_certificates</code>.
              </p>
              <div className="text-[11px] text-blue-700 font-medium">
                ✅ Fixed: RPCs must be declared with <code>SECURITY DEFINER</code> so they execute with owner authority.
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
                DEO Account Role &amp; Quotas
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If a Data Entry Operator (DEO) has their account tier restricted to <code>1-tier (Warish only)</code> in the DEO Quotas console, any attempt to draft or query <code>dependent_certificates</code> is blocked by RLS policies checking <code>has_permission(&apos;dependent_certs&apos;)</code>.
              </p>
              <div className="text-[11px] text-blue-700 font-medium">
                ✅ Fixed: Super Admins can verify and enable 2-tier or 3-tier access in the <strong>DEO Quotas &amp; Tiers</strong> console.
              </div>
            </div>
          </div>

          {/* SQL Remediation Script Box */}
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-amber-400" />
                <span>PostgreSQL RLS Remediation Script (Supabase SQL Editor)</span>
              </div>
              <button
                onClick={copySqlToClipboard}
                className="hover:text-white transition flex items-center gap-1"
              >
                <Copy size={12} /> {copiedSql ? "Copied" : "Copy SQL"}
              </button>
            </div>
            <pre className="text-[11px] text-emerald-400 leading-relaxed select-all">
              {sqlRemediationScript}
            </pre>
          </div>
        </div>

        {/* Diagnostic Logs & Recent RPC Failures */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Activity size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  RLS Permission Denied Incidents &amp; Recent RPC Failures
                </h2>
                <p className="text-xs text-muted-foreground">
                  Filtered activity log of authentication, table permission rejections, and RPC exceptions.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearLocalLogs}
                className="text-xs text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 size={12} /> Clear Local Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadIncidents}
                disabled={loadingIncidents}
                className="text-xs gap-1"
              >
                <RefreshCw size={12} className={loadingIncidents ? "animate-spin" : ""} /> Refresh
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <input
              type="text"
              placeholder="Search table, error code, actor email, or root cause..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[240px] px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-[11px]">Severity:</span>
              {(["all", "critical", "high", "warning", "info"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeverityFilter(s)}
                  className={`px-2.5 py-1 rounded-full capitalize text-[11px] font-medium border ${
                    severityFilter === s
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Incidents Table */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {loadingIncidents ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-primary" />
                Querying database activity logs and incident telemetry...
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No incidents match the selected filter criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                {filteredIncidents.map((inc) => {
                  const isCrit = inc.severity === "critical";
                  return (
                    <div key={inc.id} className="p-4 hover:bg-slate-50/80 transition space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              isCrit
                                ? "bg-red-50 text-red-700 border-red-200"
                                : inc.severity === "high"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {inc.severity.toUpperCase()}
                          </Badge>
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {inc.action_type}
                          </span>
                          {inc.target_table && (
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {inc.target_table}
                            </Badge>
                          )}
                          {inc.error_code && (
                            <span className="text-[11px] font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              code: {inc.error_code}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          <Clock size={12} />
                          {new Date(inc.timestamp).toLocaleString()}
                          <span>·</span>
                          <span>{inc.actor_email ?? "system"}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-700 font-medium">
                        {inc.error_message}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                          <span className="font-semibold text-slate-800 block mb-0.5">🔍 Root Cause:</span>
                          <span className="text-slate-600 leading-relaxed">{inc.root_cause}</span>
                        </div>
                        <div className="bg-emerald-50/50 rounded-lg p-2.5 border border-emerald-100">
                          <span className="font-semibold text-emerald-800 block mb-0.5">💡 Remediation:</span>
                          <span className="text-emerald-700 leading-relaxed">{inc.recommended_fix}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
