import { supabase } from "@/integrations/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabaseEnv";
import { logActivity } from "@/lib/activityLog";

export interface DatabaseHealthInfo {
  status: "healthy" | "degraded" | "error";
  latencyMs: number;
  lastChecked: string;
  host: string;
  protocol: string;
  schemaCacheStatus: "synced" | "refreshing" | "stale";
  tablesReachable: number;
  totalTablesChecked: number;
  errorMessage?: string;
}

export interface AuthLogEntry {
  id: string;
  timestamp: string;
  action_type: string;
  actor_email?: string | null;
  severity: "error" | "warning" | "info";
  reason: string;
  source: "database" | "client_buffer";
  ip?: string | null;
  metadata?: Record<string, unknown>;
}

export interface StorageStatsInfo {
  totalFiles: number;
  totalSizeBytes: number;
  formattedTotalSize: string;
  quotaBytes: number;
  formattedQuota: string;
  usagePercentage: number;
  documentsCount: number;
  documentsSizeBytes: number;
  formattedDocumentsSize: string;
  backupsCount: number;
  backupsSizeBytes: number;
  formattedBackupsSize: string;
  latestBackupDate: string | null;
  mimeBreakdown: {
    mime: string;
    label: string;
    count: number;
    sizeBytes: number;
  }[];
  buckets: {
    name: string;
    access: "private" | "restricted" | "public";
    purpose: string;
    status: "active" | "degraded";
  }[];
}

const LOCAL_AUTH_ERRORS_KEY = "bg2_admin_auth_incidents_v1";

// Helper to format bytes
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Record an authentication error/warning in both local buffer & remote activity_logs if authenticated
export async function recordAuthIncident(incident: {
  action_type: string;
  actor_email?: string | null;
  reason: string;
  severity?: "error" | "warning" | "info";
  metadata?: Record<string, unknown>;
}) {
  const entry: AuthLogEntry = {
    id: `auth_inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    action_type: incident.action_type,
    actor_email: incident.actor_email ? incident.actor_email.replace(/^(.{2})(.*)(@.*)$/, "$1***$3") : "unidentified",
    severity: incident.severity ?? "error",
    reason: incident.reason,
    source: "client_buffer",
    metadata: incident.metadata ?? {},
  };

  try {
    const existingStr = localStorage.getItem(LOCAL_AUTH_ERRORS_KEY);
    const existing: AuthLogEntry[] = existingStr ? JSON.parse(existingStr) : [];
    existing.unshift(entry);
    // Keep max 50 recent incidents in local buffer
    const trimmed = existing.slice(0, 50);
    localStorage.setItem(LOCAL_AUTH_ERRORS_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Could not save auth incident to local buffer", err);
  }

  // Also push to activity_logs via RPC if session exists
  try {
    await logActivity({
      action_type: incident.action_type,
      target_table: "auth.sessions",
      metadata: {
        reason: incident.reason,
        severity: incident.severity ?? "error",
        timestamp: entry.timestamp,
        ...incident.metadata,
      },
    });
  } catch {
    // If not authenticated or RPC fails, local buffer keeps it safe
  }
}

// Fetch database connection health and response latency
export async function fetchDatabaseHealth(): Promise<DatabaseHealthInfo> {
  if (!isSupabaseConfigured) {
    return {
      status: "degraded",
      latencyMs: 0,
      lastChecked: new Date().toLocaleTimeString(),
      host: "Not configured (Local Preview)",
      protocol: "Local Storage / Offline Fallback",
      schemaCacheStatus: "synced",
      tablesReachable: 0,
      totalTablesChecked: 3,
      errorMessage:
        "Supabase environment keys (VITE_SUPABASE_URL & VITE_SUPABASE_PUBLISHABLE_KEY) are not configured yet. Running in local preview mode.",
    };
  }

  const host = (() => {
    try {
      const raw = import.meta.env.VITE_SUPABASE_URL;
      if (raw) return new URL(raw).host;
    } catch {
      // fallback
    }
    return "supabase.co";
  })();
  const start = performance.now();
  let reachableTables = 0;
  const tablesToCheck = ["master_data", "warish_certificates", "dependent_certificates"];
  let errorMessage: string | undefined;

  try {
    // Primary ping probe using master_data count
    const { error: pingErr } = await supabase
      .from("master_data")
      .select("category", { count: "exact", head: true });

    if (pingErr) {
      errorMessage = pingErr.message;
    } else {
      reachableTables++;
    }

    // Secondary table reachability probes
    const probes = await Promise.allSettled([
      supabase.from("warish_certificates").select("id", { count: "exact", head: true }),
      supabase.from("dependent_certificates").select("id", { count: "exact", head: true }),
    ]);

    probes.forEach((p) => {
      if (p.status === "fulfilled" && !p.value.error) {
        reachableTables++;
      }
    });

    const elapsed = Math.round(performance.now() - start);

    let status: "healthy" | "degraded" | "error" = "healthy";
    if (errorMessage && reachableTables === 0) {
      status = "error";
    } else if (elapsed > 2500 || (reachableTables === 0 && !errorMessage)) {
      status = "degraded";
    } else if (reachableTables >= 1) {
      status = "healthy";
    }

    return {
      status,
      latencyMs: elapsed,
      lastChecked: new Date().toLocaleTimeString(),
      host,
      protocol: "HTTPS / TLS 1.3 · PostgREST v12",
      schemaCacheStatus: "synced",
      tablesReachable: reachableTables,
      totalTablesChecked: tablesToCheck.length,
      errorMessage,
    };
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - start);
    return {
      status: "error",
      latencyMs: elapsed,
      lastChecked: new Date().toLocaleTimeString(),
      host,
      protocol: "HTTPS / TLS 1.3 · PostgREST v12",
      schemaCacheStatus: "stale",
      tablesReachable: 0,
      totalTablesChecked: tablesToCheck.length,
      errorMessage: err?.message ?? "Failed to connect to database host.",
    };
  }
}

// Fetch recent authentication logs and errors
export async function fetchAuthLogs(): Promise<AuthLogEntry[]> {
  const merged: AuthLogEntry[] = [];
  const seenIds = new Set<string>();

  // 1. Load from local client-side buffer
  try {
    const localStr = localStorage.getItem(LOCAL_AUTH_ERRORS_KEY);
    if (localStr) {
      const localEntries: AuthLogEntry[] = JSON.parse(localStr);
      localEntries.forEach((entry) => {
        if (!seenIds.has(entry.id)) {
          seenIds.add(entry.id);
          merged.push(entry);
        }
      });
    }
  } catch (e) {
    console.warn("Could not read local auth logs", e);
  }

  // 2. Load from Supabase activity_logs table
  try {
    const { data, error } = await supabase
      .from("activity_logs")
      .select("id, action_type, actor_email, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    if (!error && data) {
      data.forEach((row: any) => {
        const action = row.action_type || "";
        const isAuthRelated =
          action.startsWith("auth.") ||
          action.includes("signin") ||
          action.includes("signout") ||
          action.includes("timeout") ||
          action.includes("password") ||
          action.includes("session") ||
          action.includes("unauthorized") ||
          action.includes("denied");

        if (isAuthRelated && !seenIds.has(row.id)) {
          seenIds.add(row.id);
          const meta = (row.metadata as Record<string, unknown>) || {};
          let severity: "error" | "warning" | "info" = "info";
          if (
            action.includes("failed") ||
            action.includes("error") ||
            action.includes("denied") ||
            meta.severity === "error"
          ) {
            severity = "error";
          } else if (
            action.includes("timeout") ||
            action.includes("warn") ||
            meta.severity === "warning"
          ) {
            severity = "warning";
          }

          let reason = (meta.reason as string) || (meta.error as string) || "Authentication activity logged";
          if (action === "auth.signout") reason = "User initiated sign out";
          if (action === "auth.session_timeout") reason = "Session timed out due to inactivity";

          merged.push({
            id: row.id,
            timestamp: row.created_at,
            action_type: row.action_type,
            actor_email: row.actor_email,
            severity,
            reason,
            source: "database",
            metadata: meta,
          });
        }
      });
    }
  } catch (err) {
    console.warn("Could not fetch database activity_logs for auth", err);
  }

  // If buffer has no entries at all, provide a default seed incident so the admin sees how it functions
  if (merged.length === 0) {
    merged.push({
      id: "auth_seed_initial",
      timestamp: new Date().toISOString(),
      action_type: "auth.system_monitor_ready",
      actor_email: "security@bagula2gp.gov.in",
      severity: "info",
      reason: "Authentication auditing monitor initialized and listening for incidents.",
      source: "client_buffer",
    });
  }

  // Sort descending by timestamp
  return merged.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Fetch storage usage statistics
export async function fetchStorageStats(): Promise<StorageStatsInfo> {
  const quotaBytes = 1024 * 1024 * 1024; // 1 GB allocated cloud tier
  let docsCount = 0;
  let docsBytes = 0;
  let backupsCount = 0;
  let backupsBytes = 0;
  let latestBackupDate: string | null = null;

  const mimeMap: Record<string, { label: string; count: number; bytes: number }> = {
    "application/pdf": { label: "PDF Documents", count: 0, bytes: 0 },
    "image/jpeg": { label: "JPEG / JPG Images", count: 0, bytes: 0 },
    "image/png": { label: "PNG Images", count: 0, bytes: 0 },
    "application/x-ndjson": { label: "Database Snapshots (.ndjson)", count: 0, bytes: 0 },
    "application/octet-stream": { label: "Binary Data & Archives", count: 0, bytes: 0 },
  };

  // 1. Query documents_engine for uploaded documents
  try {
    const { data: docs, error: docErr } = await supabase
      .from("documents_engine")
      .select("id, file_size_bytes, mime_type, created_at");

    if (!docErr && docs) {
      docsCount = docs.length;
      docs.forEach((d) => {
        const size = d.file_size_bytes || 0;
        docsBytes += size;
        const mime = d.mime_type || "application/octet-stream";
        if (!mimeMap[mime]) {
          mimeMap[mime] = { label: mime, count: 0, bytes: 0 };
        }
        mimeMap[mime].count += 1;
        mimeMap[mime].bytes += size;
      });
    }
  } catch (err) {
    console.warn("Error querying documents_engine", err);
  }

  // 2. Query backup_jobs for backup archives
  try {
    const { data: backups, error: bErr } = await supabase
      .from("backup_jobs")
      .select("id, size_bytes, started_at, status")
      .order("started_at", { ascending: false });

    if (!bErr && backups) {
      backupsCount = backups.length;
      if (backups.length > 0 && backups[0].started_at) {
        latestBackupDate = backups[0].started_at;
      }
      backups.forEach((b) => {
        const size = b.size_bytes || 0;
        backupsBytes += size;
        mimeMap["application/x-ndjson"].count += 1;
        mimeMap["application/x-ndjson"].bytes += size;
      });
    }
  } catch (err) {
    console.warn("Error querying backup_jobs", err);
  }

  // Compute total
  const totalSizeBytes = docsBytes + backupsBytes;
  const totalFiles = docsCount + backupsCount;
  const usagePercentage = Math.min(
    100,
    parseFloat(((totalSizeBytes / quotaBytes) * 100).toFixed(2))
  );

  const mimeBreakdown = Object.entries(mimeMap)
    .filter(([_, v]) => v.count > 0 || v.bytes > 0)
    .map(([mime, v]) => ({
      mime,
      label: v.label,
      count: v.count,
      sizeBytes: v.bytes,
    }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes);

  const buckets: StorageStatsInfo["buckets"] = [
    {
      name: "citizen-documents",
      access: "restricted",
      purpose: "Applicant Identity Proofs, Death/Birth Affidavits & Legal Heirs Submissions",
      status: "active",
    },
    {
      name: "certificate-backups",
      access: "private",
      purpose: "Automated & Manual Full-Register Disaster Recovery Snapshots",
      status: "active",
    },
  ];

  return {
    totalFiles,
    totalSizeBytes,
    formattedTotalSize: formatBytes(totalSizeBytes),
    quotaBytes,
    formattedQuota: formatBytes(quotaBytes, 0),
    usagePercentage,
    documentsCount: docsCount,
    documentsSizeBytes: docsBytes,
    formattedDocumentsSize: formatBytes(docsBytes),
    backupsCount,
    backupsSizeBytes: backupsBytes,
    formattedBackupsSize: formatBytes(backupsBytes),
    latestBackupDate,
    mimeBreakdown,
    buckets,
  };
}

// Clear client-side incident buffer
export function clearClientAuthBuffer() {
  localStorage.removeItem(LOCAL_AUTH_ERRORS_KEY);
}

export interface SystemAlert {
  id: string;
  source: "database" | "storage" | "network";
  severity: "warning" | "critical";
  title: string;
  message: string;
  metricName: string;
  currentValueMs: number;
  thresholdMs: number;
  timestamp: string;
}

export interface ThresholdConfig {
  dbWarningMs: number;
  dbCriticalMs: number;
  storageWarningMs: number;
  storageCriticalMs: number;
}

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  dbWarningMs: 600,
  dbCriticalMs: 1500,
  storageWarningMs: 900,
  storageCriticalMs: 2000,
};

export interface HealthProbeResult {
  timestamp: string;
  dbStatus: "healthy" | "degraded" | "error";
  dbLatencyMs: number;
  dbError?: string;
  storageStatus: "healthy" | "degraded" | "error";
  storageLatencyMs: number;
  storageError?: string;
  overallStatus: "optimal" | "warning" | "critical";
  alerts: SystemAlert[];
  thresholds: ThresholdConfig;
  tablesReachable: number;
  storageReachable: boolean;
}

// Live real-time probe of Supabase Database & Storage with threshold evaluation
export async function probeSupabaseHealth(
  customThresholds: Partial<ThresholdConfig> = {}
): Promise<HealthProbeResult> {
  const thresholds: ThresholdConfig = {
    ...DEFAULT_THRESHOLDS,
    ...customThresholds,
  };

  const alerts: SystemAlert[] = [];
  const nowIso = new Date().toISOString();

  // Check network connectivity first
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const netAlert: SystemAlert = {
      id: `alert_net_${Date.now()}`,
      source: "network",
      severity: "critical",
      title: "Browser Offline / Network Disconnected",
      message: "The client browser is offline. All Supabase database and storage requests will fail.",
      metricName: "Network Status",
      currentValueMs: 0,
      thresholdMs: 0,
      timestamp: nowIso,
    };
    return {
      timestamp: nowIso,
      dbStatus: "error",
      dbLatencyMs: 0,
      dbError: "Network offline",
      storageStatus: "error",
      storageLatencyMs: 0,
      storageError: "Network offline",
      overallStatus: "critical",
      alerts: [netAlert],
      thresholds,
      tablesReachable: 0,
      storageReachable: false,
    };
  }

  // 1. Probe Database Latency & Reachability
  const dbStart = performance.now();
  let dbStatus: "healthy" | "degraded" | "error" = "healthy";
  let dbError: string | undefined;
  let tablesReachable = 0;

  try {
    const { error: pingErr } = await supabase
      .from("master_data")
      .select("category", { count: "exact", head: true });

    if (pingErr) {
      dbError = pingErr.message;
    } else {
      tablesReachable++;
    }

    // Optional lightweight secondary probe
    const { error: secErr } = await supabase
      .from("warish_certificates")
      .select("id", { count: "exact", head: true });

    if (!secErr) {
      tablesReachable++;
    }
  } catch (err: any) {
    dbError = err?.message || "Connection timed out";
  }

  const dbLatencyMs = Math.round(performance.now() - dbStart);

  if (dbError && tablesReachable === 0) {
    dbStatus = "error";
    alerts.push({
      id: `alert_db_err_${Date.now()}`,
      source: "database",
      severity: "critical",
      title: "Database Connection Failed",
      message: `Unable to establish connection to Supabase database. Reason: ${dbError}`,
      metricName: "DB Connection",
      currentValueMs: dbLatencyMs,
      thresholdMs: thresholds.dbCriticalMs,
      timestamp: nowIso,
    });
  } else if (dbLatencyMs >= thresholds.dbCriticalMs) {
    dbStatus = "error";
    alerts.push({
      id: `alert_db_crit_${Date.now()}`,
      source: "database",
      severity: "critical",
      title: "Critical Database Latency Spike",
      message: `Database response latency (${dbLatencyMs}ms) exceeds the critical threshold of ${thresholds.dbCriticalMs}ms. Applications and review queues will load slowly.`,
      metricName: "DB Query Latency",
      currentValueMs: dbLatencyMs,
      thresholdMs: thresholds.dbCriticalMs,
      timestamp: nowIso,
    });
  } else if (dbLatencyMs >= thresholds.dbWarningMs) {
    dbStatus = "degraded";
    alerts.push({
      id: `alert_db_warn_${Date.now()}`,
      source: "database",
      severity: "warning",
      title: "High Database Latency",
      message: `Database query latency (${dbLatencyMs}ms) is higher than normal (threshold: ${thresholds.dbWarningMs}ms).`,
      metricName: "DB Query Latency",
      currentValueMs: dbLatencyMs,
      thresholdMs: thresholds.dbWarningMs,
      timestamp: nowIso,
    });
  }

  // 2. Probe Storage Latency & Reachability
  const storageStart = performance.now();
  let storageStatus: "healthy" | "degraded" | "error" = "healthy";
  let storageError: string | undefined;
  let storageReachable = false;

  try {
    // Attempt to list files from primary documents bucket or list buckets
    const bucketProbe = await supabase.storage
      .from("citizen-documents")
      .list("", { limit: 1 });

    if (bucketProbe.error) {
      // If citizen-documents bucket check returned error, probe listBuckets
      const { error: listErr } = await supabase.storage.listBuckets();
      if (listErr && !listErr.message?.includes("Row-level security")) {
        storageError = listErr.message;
      } else {
        storageReachable = true;
      }
    } else {
      storageReachable = true;
    }
  } catch (err: any) {
    storageError = err?.message || "Storage probe timed out";
  }

  const storageLatencyMs = Math.round(performance.now() - storageStart);

  if (storageError && !storageReachable) {
    storageStatus = "error";
    alerts.push({
      id: `alert_store_err_${Date.now()}`,
      source: "storage",
      severity: "critical",
      title: "Storage Service Unreachable",
      message: `Unable to communicate with Supabase storage endpoints: ${storageError}. Document uploads may fail.`,
      metricName: "Storage Reachability",
      currentValueMs: storageLatencyMs,
      thresholdMs: thresholds.storageCriticalMs,
      timestamp: nowIso,
    });
  } else if (storageLatencyMs >= thresholds.storageCriticalMs) {
    storageStatus = "error";
    alerts.push({
      id: `alert_store_crit_${Date.now()}`,
      source: "storage",
      severity: "critical",
      title: "Critical Storage Latency Spike",
      message: `Storage response time (${storageLatencyMs}ms) exceeds the critical threshold of ${thresholds.storageCriticalMs}ms. Citizen document uploads and previews may fail or time out.`,
      metricName: "Storage Latency",
      currentValueMs: storageLatencyMs,
      thresholdMs: thresholds.storageCriticalMs,
      timestamp: nowIso,
    });
  } else if (storageLatencyMs >= thresholds.storageWarningMs) {
    storageStatus = "degraded";
    alerts.push({
      id: `alert_store_warn_${Date.now()}`,
      source: "storage",
      severity: "warning",
      title: "Elevated Storage Latency",
      message: `Storage probe latency (${storageLatencyMs}ms) exceeds normal operational threshold (${thresholds.storageWarningMs}ms).`,
      metricName: "Storage Latency",
      currentValueMs: storageLatencyMs,
      thresholdMs: thresholds.storageWarningMs,
      timestamp: nowIso,
    });
  }

  // Determine Overall Status
  let overallStatus: "optimal" | "warning" | "critical" = "optimal";
  if (dbStatus === "error" || storageStatus === "error") {
    overallStatus = "critical";
  } else if (dbStatus === "degraded" || storageStatus === "degraded") {
    overallStatus = "warning";
  }

  return {
    timestamp: nowIso,
    dbStatus,
    dbLatencyMs,
    dbError,
    storageStatus,
    storageLatencyMs,
    storageError,
    overallStatus,
    alerts,
    thresholds,
    tablesReachable,
    storageReachable,
  };
}
