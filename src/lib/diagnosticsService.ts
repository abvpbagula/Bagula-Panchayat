import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";

export interface DiagnosticProbeResult {
  target: string;
  type: "table" | "rpc";
  status: "success" | "permission_denied" | "error" | "warning";
  statusCode?: string | number;
  latencyMs: number;
  message: string;
  details?: string;
  hint?: string;
  timestamp: string;
  remediation?: string;
}

export interface RlsIncidentLog {
  id: string;
  timestamp: string;
  action_type: string;
  target_table?: string;
  rpc_name?: string;
  actor_email?: string;
  actor_role?: string;
  error_code?: string;
  severity: "critical" | "high" | "warning" | "info";
  error_message: string;
  root_cause: string;
  recommended_fix: string;
  source: "database" | "client_buffer" | "probe";
  raw?: Record<string, any>;
}

const LOCAL_RLS_INCIDENTS_KEY = "bg2_rls_rpc_incidents_v1";

/**
 * Record an RLS or RPC failure incident into local storage and activity logs
 */
export async function recordDiagnosticIncident(incident: {
  action_type: string;
  target_table?: string;
  rpc_name?: string;
  actor_email?: string;
  error_code?: string;
  error_message: string;
  severity?: "critical" | "high" | "warning" | "info";
  raw?: Record<string, any>;
}) {
  const analysis = analyzePermissionFailure({
    table: incident.target_table,
    rpc: incident.rpc_name,
    message: incident.error_message,
    code: incident.error_code,
  });

  const entry: RlsIncidentLog = {
    id: `rls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action_type: incident.action_type,
    target_table: incident.target_table,
    rpc_name: incident.rpc_name,
    actor_email: incident.actor_email ?? "authenticated_user",
    error_code: incident.error_code,
    severity: incident.severity ?? "critical",
    error_message: incident.error_message,
    root_cause: analysis.rootCause,
    recommended_fix: analysis.recommendedFix,
    source: "client_buffer",
    raw: incident.raw,
  };

  try {
    const existing = getLocalIncidents();
    existing.unshift(entry);
    localStorage.setItem(LOCAL_RLS_INCIDENTS_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (err) {
    console.warn("Could not write to local incident buffer", err);
  }

  // Attempt to write to activity_logs
  try {
    await logActivity({
      action_type: incident.action_type,
      target_table: incident.target_table ?? null,
      metadata: {
        error_code: incident.error_code,
        error_message: incident.error_message,
        root_cause: analysis.rootCause,
        is_rls_incident: true,
      },
    });
  } catch {
    // Non-blocking
  }

  return entry;
}

export function getLocalIncidents(): RlsIncidentLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_RLS_INCIDENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Intelligent analyzer for Postgres / Supabase RLS & RPC permission errors
 */
export function analyzePermissionFailure(params: {
  table?: string;
  rpc?: string;
  message: string;
  code?: string;
}): {
  rootCause: string;
  recommendedFix: string;
  sqlRemedy: string;
  severity: "critical" | "high" | "warning";
} {
  const msg = (params.message || "").toLowerCase();
  const code = params.code || "";
  const table = params.table || (msg.includes("dependent_certificates") ? "dependent_certificates" : "unknown");

  if (table === "dependent_certificates" || msg.includes("dependent_certificates")) {
    if (code === "42501" || msg.includes("permission denied")) {
      return {
        rootCause:
          "PostgreSQL 42501: Role lacks table-level GRANT privileges or RLS policy rejects current caller context on 'dependent_certificates'. If invoked through RPC, the function may be missing 'SECURITY DEFINER' or search_path.",
        recommendedFix:
          "1. Ensure 'SECURITY DEFINER' is declared on certificate modification RPCs.\n2. Ensure authenticated and anon roles have necessary table permissions or submit drafts through the edge function.\n3. Verify that DEO has 'dependent_certs' permission in admin_permissions.",
        sqlRemedy: `-- Fix table grants and RLS policies for dependent_certificates
GRANT SELECT, INSERT, UPDATE ON TABLE public.dependent_certificates TO authenticated;
GRANT SELECT ON TABLE public.dependent_certificates TO anon;

-- Ensure RLS policies allow staff & supervisors
ALTER TABLE public.dependent_certificates ENABLE ROW LEVEL SECURITY;

-- If RPCs fail, alter them to run as SECURITY DEFINER
-- Example:
-- ALTER FUNCTION public.reject_certificate_v2 SECURITY DEFINER;
-- ALTER FUNCTION public.restore_certificate SECURITY DEFINER;`,
        severity: "critical",
      };
    }
  }

  if (msg.includes("jwt") || msg.includes("token") || msg.includes("unauthorized") || code === "PGRST301") {
    return {
      rootCause: "Session authentication token expired or invalid claims in auth header.",
      recommendedFix: "Refresh session via supabase.auth.refreshSession() or re-authenticate.",
      sqlRemedy: "-- Verify token claims function\nSELECT auth.uid(), auth.role();",
      severity: "high",
    };
  }

  if (code === "PGRST204" || msg.includes("column") || msg.includes("schema cache")) {
    return {
      rootCause: "PostgREST schema cache desynchronization. The client expects columns not yet indexed in schema cache.",
      recommendedFix: "Trigger NOTIFY pgrst, 'reload schema' via the Sync Schema button in the admin dashboard.",
      sqlRemedy: "NOTIFY pgrst, 'reload schema';",
      severity: "warning",
    };
  }

  return {
    rootCause: `PostgreSQL error [${code}]: ${params.message}`,
    recommendedFix: "Inspect Postgres RLS logs and verify caller permissions for the target object.",
    sqlRemedy: `-- Inspect table RLS policies
SELECT * FROM pg_policies WHERE tablename = '${table}';`,
    severity: "high",
  };
}

/**
 * Live Table Probe for RLS Verification
 */
export async function probeTableRls(tableName: "dependent_certificates" | "warish_certificates"): Promise<DiagnosticProbeResult> {
  const start = performance.now();
  const timestamp = new Date().toISOString();

  try {
    // 1. Attempt lightweight head query
    const { count, error } = await supabase
      .from(tableName as any)
      .select("id", { count: "exact", head: true });

    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      const isPermDenied = error.code === "42501" || error.message.toLowerCase().includes("permission denied");
      const analysis = analyzePermissionFailure({ table: tableName, message: error.message, code: error.code });

      await recordDiagnosticIncident({
        action_type: `rls.probe_failed.${tableName}`,
        target_table: tableName,
        error_code: error.code,
        error_message: error.message,
        severity: isPermDenied ? "critical" : "high",
        raw: error,
      });

      return {
        target: tableName,
        type: "table",
        status: isPermDenied ? "permission_denied" : "error",
        statusCode: error.code,
        latencyMs,
        message: error.message,
        details: error.details,
        hint: error.hint,
        timestamp,
        remediation: analysis.recommendedFix,
      };
    }

    return {
      target: tableName,
      type: "table",
      status: "success",
      statusCode: 200,
      latencyMs,
      message: `Table accessible. Count: ${count ?? 0} records readable under active session role.`,
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      target: tableName,
      type: "table",
      status: "error",
      statusCode: 500,
      latencyMs,
      message: err?.message || String(err),
      timestamp,
      remediation: "Check client connection and Supabase URL availability.",
    };
  }
}

/**
 * Live RPC Probe for Function Permissions
 */
export async function probeRpc(rpcName: string, sampleArgs: Record<string, any> = {}): Promise<DiagnosticProbeResult> {
  const start = performance.now();
  const timestamp = new Date().toISOString();

  try {
    const { data, error } = await (supabase.rpc as any)(rpcName, sampleArgs);
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      const isPermDenied = error.code === "42501" || error.message.toLowerCase().includes("permission denied");
      const analysis = analyzePermissionFailure({ rpc: rpcName, message: error.message, code: error.code });

      await recordDiagnosticIncident({
        action_type: `rpc.probe_failed.${rpcName}`,
        rpc_name: rpcName,
        error_code: error.code,
        error_message: error.message,
        severity: isPermDenied ? "critical" : "high",
        raw: error,
      });

      return {
        target: rpcName,
        type: "rpc",
        status: isPermDenied ? "permission_denied" : "error",
        statusCode: error.code,
        latencyMs,
        message: error.message,
        details: error.details,
        hint: error.hint,
        timestamp,
        remediation: analysis.recommendedFix,
      };
    }

    return {
      target: rpcName,
      type: "rpc",
      status: "success",
      statusCode: 200,
      latencyMs,
      message: `RPC executed successfully. Returns: ${JSON.stringify(data ?? "OK").slice(0, 80)}`,
      timestamp,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      target: rpcName,
      type: "rpc",
      status: "error",
      statusCode: 500,
      latencyMs,
      message: err?.message || String(err),
      timestamp,
    };
  }
}

/**
 * Fetch combined audit logs, RLS incidents, and RPC failures for Super Admin diagnostics
 */
export async function fetchAllDiagnosticIncidents(): Promise<RlsIncidentLog[]> {
  const localList = getLocalIncidents();
  const seenIds = new Set<string>(localList.map((i) => i.id));
  const merged: RlsIncidentLog[] = [...localList];

  try {
    // 1. Query remote activity_logs for permission failures or certificate operations
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, action_type, actor_email, target_table, metadata, created_at")
      .or(
        "action_type.ilike.%rls%,action_type.ilike.%denied%,action_type.ilike.%error%,action_type.ilike.%fail%,action_type.ilike.%dependent%,action_type.ilike.%rpc%"
      )
      .order("created_at", { ascending: false })
      .limit(60);

    if (!error && data) {
      for (const row of data as any[]) {
        if (seenIds.has(row.id)) continue;
        seenIds.add(row.id);

        const meta = (row.metadata as Record<string, any>) || {};
        const errMsg = meta.error_message || meta.error || meta.reason || row.action_type;
        const errCode = meta.error_code || meta.code;
        const analysis = analyzePermissionFailure({
          table: row.target_table || meta.target_table,
          rpc: meta.rpc_name,
          message: errMsg,
          code: errCode,
        });

        let severity: "critical" | "high" | "warning" | "info" = "high";
        if (String(errMsg).toLowerCase().includes("permission denied") || errCode === "42501") {
          severity = "critical";
        } else if (String(row.action_type).includes("warn")) {
          severity = "warning";
        }

        merged.push({
          id: row.id,
          timestamp: row.created_at,
          action_type: row.action_type,
          target_table: row.target_table || meta.target_table,
          rpc_name: meta.rpc_name,
          actor_email: row.actor_email,
          error_code: errCode,
          severity,
          error_message: errMsg,
          root_cause: analysis.rootCause,
          recommended_fix: analysis.recommendedFix,
          source: "database",
          raw: meta,
        });
      }
    }
  } catch (err) {
    console.warn("Error loading database activity_logs for diagnostics", err);
  }

  // 2. Query certificate_audit_logs if available
  try {
    const { data, error } = await supabase
      .from("certificate_audit_logs" as any)
      .select("id, cert_id, kind, action, actor_email, reason, metadata, created_at")
      .or("action.ilike.%fail%,action.ilike.%error%,action.ilike.%denied%,reason.ilike.%denied%,reason.ilike.%error%")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      for (const row of data as any[]) {
        if (seenIds.has(row.id)) continue;
        seenIds.add(row.id);

        const meta = (row.metadata as Record<string, any>) || {};
        const errMsg = row.reason || meta.error || `Action ${row.action} failed`;
        const analysis = analyzePermissionFailure({
          table: row.kind === "warish" ? "warish_certificates" : "dependent_certificates",
          message: errMsg,
        });

        merged.push({
          id: row.id,
          timestamp: row.created_at,
          action_type: `cert_audit.${row.action}`,
          target_table: row.kind === "warish" ? "warish_certificates" : "dependent_certificates",
          actor_email: row.actor_email,
          severity: "critical",
          error_message: errMsg,
          root_cause: analysis.rootCause,
          recommended_fix: analysis.recommendedFix,
          source: "database",
          raw: meta,
        });
      }
    }
  } catch {
    // optional table
  }

  // If list is completely empty, provide an informative baseline entry so the Super Admin understands the diagnostics tool
  if (merged.length === 0) {
    merged.push({
      id: "diag_baseline_seed",
      timestamp: new Date().toISOString(),
      action_type: "diagnostics.monitor_online",
      target_table: "dependent_certificates",
      actor_email: "system@bagula2gp.gov.in",
      severity: "info",
      error_message: "RLS & RPC Monitor initialized. No persistent 42501 permission denied incidents recorded in the current session window.",
      root_cause: "System baseline operating normally or previous incidents cleared.",
      recommended_fix: "Click 'Run Comprehensive Diagnostic Probe' above to test live table grants and RPC permissions.",
      source: "probe",
    });
  }

  return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
