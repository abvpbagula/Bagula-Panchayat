import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Activity,
  Database,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings2,
  X,
  ShieldAlert,
  Zap,
  Radio,
  ExternalLink,
  Sliders,
} from "lucide-react";
import {
  probeSupabaseHealth,
  type HealthProbeResult,
  type SystemAlert,
  type ThresholdConfig,
  DEFAULT_THRESHOLDS,
} from "@/lib/systemStatusService";

interface LatencyHistoryItem {
  id: string;
  time: string;
  dbLatencyMs: number;
  storageLatencyMs: number;
  hasAlert: boolean;
}

const STORAGE_THRESHOLDS_KEY = "bg2_health_thresholds_v1";
const STORAGE_INTERVAL_KEY = "bg2_health_poll_interval_v1";

export function AdminRealtimeHealthIndicator() {
  // Load saved thresholds or default
  const [thresholds, setThresholds] = useState<ThresholdConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THRESHOLDS_KEY);
      if (saved) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_THRESHOLDS;
  });

  // Polling interval in seconds (default: 30s; 0 = paused)
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INTERVAL_KEY);
      if (saved) return Number(saved);
    } catch {
      // fallback
    }
    return 30;
  });

  const [loading, setLoading] = useState(false);
  const [probe, setProbe] = useState<HealthProbeResult | null>(null);
  const [history, setHistory] = useState<LatencyHistoryItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [secondsUntilNextPoll, setSecondsUntilNextPoll] = useState(pollIntervalSec);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Execute probe
  const executeProbe = useCallback(
    async (isManual = false) => {
      setLoading(true);
      try {
        const result = await probeSupabaseHealth(thresholds);
        setProbe(result);

        const now = new Date();
        const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        setHistory((prev) => {
          const item: LatencyHistoryItem = {
            id: `h_${Date.now()}`,
            time: timeLabel,
            dbLatencyMs: result.dbLatencyMs,
            storageLatencyMs: result.storageLatencyMs,
            hasAlert: result.alerts.length > 0,
          };
          return [...prev.slice(-9), item];
        });

        // Reset countdown
        setSecondsUntilNextPoll(pollIntervalSec);

        if (isManual) {
          if (result.overallStatus === "optimal") {
            toast.success(`Supabase systems healthy · DB: ${result.dbLatencyMs}ms | Storage: ${result.storageLatencyMs}ms`);
          } else if (result.overallStatus === "warning") {
            toast.warning(`System latency warning · DB: ${result.dbLatencyMs}ms | Storage: ${result.storageLatencyMs}ms`);
          } else {
            toast.error(`Critical latency alert! Check database or storage connection.`);
          }
        }
      } catch (err: any) {
        console.error("Health probe error", err);
        if (isManual) {
          toast.error("Failed to probe Supabase status");
        }
      } finally {
        setLoading(false);
      }
    },
    [thresholds, pollIntervalSec]
  );

  // Initial probe on mount
  useEffect(() => {
    executeProbe(false);
  }, [executeProbe]);

  // Polling timer setup
  useEffect(() => {
    if (pollIntervalSec <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    setSecondsUntilNextPoll(pollIntervalSec);

    // Countdown tick every second
    countdownRef.current = setInterval(() => {
      setSecondsUntilNextPoll((prev) => (prev > 1 ? prev - 1 : pollIntervalSec));
    }, 1000);

    // Main poll timer
    timerRef.current = setInterval(() => {
      executeProbe(false);
    }, pollIntervalSec * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [pollIntervalSec, executeProbe]);

  // Handle threshold change
  const handleThresholdPreset = (preset: "strict" | "default" | "relaxed") => {
    let next: ThresholdConfig;
    if (preset === "strict") {
      next = { dbWarningMs: 400, dbCriticalMs: 900, storageWarningMs: 600, storageCriticalMs: 1200 };
    } else if (preset === "relaxed") {
      next = { dbWarningMs: 1000, dbCriticalMs: 2500, storageWarningMs: 1500, storageCriticalMs: 3500 };
    } else {
      next = DEFAULT_THRESHOLDS;
    }
    setThresholds(next);
    localStorage.setItem(STORAGE_THRESHOLDS_KEY, JSON.stringify(next));
    toast.info(`Latency thresholds set to ${preset.toUpperCase()}`);
    // re-run probe with new thresholds
    setTimeout(() => executeProbe(false), 100);
  };

  const handleCustomThreshold = (key: keyof ThresholdConfig, value: number) => {
    const next = { ...thresholds, [key]: value };
    setThresholds(next);
    localStorage.setItem(STORAGE_THRESHOLDS_KEY, JSON.stringify(next));
  };

  const handleIntervalChange = (interval: number) => {
    setPollIntervalSec(interval);
    localStorage.setItem(STORAGE_INTERVAL_KEY, String(interval));
    toast.info(interval === 0 ? "Real-time polling paused" : `Polling interval set to ${interval}s`);
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => new Set([...prev, alertId]));
  };

  // Filter visible alerts
  const activeAlerts = (probe?.alerts || []).filter((a) => !dismissedAlertIds.has(a.id));

  // Determine styles based on overall status
  const isCritical = probe?.overallStatus === "critical";
  const isWarning = probe?.overallStatus === "warning";

  // Helpers for latency styling
  const getDbLatencyBadgeClass = (ms: number) => {
    if (ms >= thresholds.dbCriticalMs) return "bg-rose-500/15 text-rose-700 border-rose-300 font-semibold";
    if (ms >= thresholds.dbWarningMs) return "bg-amber-500/15 text-amber-800 border-amber-300 font-medium";
    return "bg-emerald-500/10 text-emerald-700 border-emerald-300";
  };

  const getStorageLatencyBadgeClass = (ms: number) => {
    if (ms >= thresholds.storageCriticalMs) return "bg-rose-500/15 text-rose-700 border-rose-300 font-semibold";
    if (ms >= thresholds.storageWarningMs) return "bg-amber-500/15 text-amber-800 border-amber-300 font-medium";
    return "bg-emerald-500/10 text-emerald-700 border-emerald-300";
  };

  return (
    <div
      id="admin-health-indicator-widget"
      className={`rounded-2xl border transition-all duration-300 backdrop-blur-sm overflow-hidden shadow-xs ${
        isCritical
          ? "border-rose-300 bg-rose-50/70 dark:bg-rose-950/20"
          : isWarning
          ? "border-amber-300 bg-amber-50/70 dark:bg-amber-950/20"
          : "border-border/50 bg-white/85"
      }`}
    >
      {/* 1. TOP COMPACT HEALTH BAR */}
      <div className="p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Icon & Beacon */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              {loading ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              ) : isCritical ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              ) : isWarning ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              ) : (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  loading
                    ? "bg-primary"
                    : isCritical
                    ? "bg-rose-500"
                    : isWarning
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
              />
            </span>

            <span className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1">
              {isCritical ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <ShieldAlert size={14} /> Critical Latency Alert
                </span>
              ) : isWarning ? (
                <span className="text-amber-700 flex items-center gap-1">
                  <AlertTriangle size={14} /> Latency Warning
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Supabase Operational
                </span>
              )}
            </span>
          </div>

          {/* Database Latency Badge */}
          <Badge
            variant="outline"
            className={`text-[11px] px-2 py-0.5 rounded-md gap-1.5 font-mono ${
              probe ? getDbLatencyBadgeClass(probe.dbLatencyMs) : "text-muted-foreground"
            }`}
            title={`Database query latency: ${probe?.dbLatencyMs || 0}ms (Warning: >${thresholds.dbWarningMs}ms, Critical: >${thresholds.dbCriticalMs}ms)`}
          >
            <Database size={11} className="shrink-0" />
            <span>DB:</span>
            <span className="font-semibold">{probe ? `${probe.dbLatencyMs}ms` : "..."}</span>
          </Badge>

          {/* Storage Latency Badge */}
          <Badge
            variant="outline"
            className={`text-[11px] px-2 py-0.5 rounded-md gap-1.5 font-mono ${
              probe ? getStorageLatencyBadgeClass(probe.storageLatencyMs) : "text-muted-foreground"
            }`}
            title={`Storage probe latency: ${probe?.storageLatencyMs || 0}ms (Warning: >${thresholds.storageWarningMs}ms, Critical: >${thresholds.storageCriticalMs}ms)`}
          >
            <HardDrive size={11} className="shrink-0" />
            <span>Storage:</span>
            <span className="font-semibold">{probe ? `${probe.storageLatencyMs}ms` : "..."}</span>
          </Badge>

          {/* Active alerts count pill */}
          {activeAlerts.length > 0 && (
            <Badge className="text-[10px] bg-rose-600 text-white font-bold animate-pulse px-1.5 py-0.2">
              {activeAlerts.length} {activeAlerts.length === 1 ? "Alert" : "Alerts"}
            </Badge>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Polling countdown / mode */}
          <div
            className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground font-mono bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md"
            title={pollIntervalSec === 0 ? "Auto-polling paused" : `Auto-polls every ${pollIntervalSec}s. Next check in ${secondsUntilNextPoll}s`}
          >
            <Radio size={11} className={pollIntervalSec > 0 ? "text-emerald-500 animate-pulse" : "text-muted-foreground"} />
            <span>
              {pollIntervalSec === 0 ? "Paused" : `${secondsUntilNextPoll}s`}
            </span>
          </div>

          {/* Refresh / Poll Now Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => executeProbe(true)}
            disabled={loading}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            title="Poll database and storage latency immediately"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-primary" : ""} />
            <span className="hidden sm:inline">Poll Now</span>
          </Button>

          {/* Settings button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings((v) => !v)}
            className={`h-7 px-2 text-xs gap-1 ${showSettings ? "bg-black/10 text-foreground" : "text-muted-foreground"}`}
            title="Configure polling rate and latency thresholds"
          >
            <Settings2 size={12} />
          </Button>

          {/* Expand Details Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded((v) => !v)}
            className="h-7 px-2.5 text-xs gap-1 text-foreground border-border/60 shadow-2xs"
          >
            <span>{isExpanded ? "Hide Telemetry" : "Telemetry"}</span>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </Button>
        </div>
      </div>

      {/* 2. PROMINENT REAL-TIME LATENCY ALERTS */}
      {activeAlerts.length > 0 && (
        <div className="border-t border-rose-200/80 bg-rose-500/[0.08] p-3.5 space-y-2.5">
          {activeAlerts.map((alert) => {
            const isCrit = alert.severity === "critical";
            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 shadow-2xs ${
                  isCrit
                    ? "bg-white/95 border-rose-300 text-rose-950"
                    : "bg-white/95 border-amber-300 text-amber-950"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                      isCrit ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {isCrit ? <ShieldAlert size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold tracking-tight text-foreground flex items-center gap-1.5">
                        {alert.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono uppercase ${
                          isCrit
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {alert.severity}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Measured: {alert.currentValueMs}ms (Threshold: {alert.thresholdMs}ms)
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="pt-1 flex items-center gap-3 text-[11px]">
                      <span className="text-foreground/80 font-medium">
                        💡 Suggested: Verify cloud provider connection or inspect Supabase project status.
                      </span>
                      <Link
                        to="/admin/system-status"
                        className="text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                      >
                        Full System Status <ExternalLink size={10} />
                      </Link>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissAlert(alert.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                  title="Dismiss this alert"
                >
                  <X size={13} />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. SETTINGS POPOVER PANEL */}
      {showSettings && (
        <div className="border-t border-border/40 bg-muted/40 p-4 space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-foreground flex items-center gap-1.5">
              <Sliders size={13} className="text-primary" />
              Health Polling & Latency Threshold Settings
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSettings(false)}
              className="h-6 w-6 p-0 text-muted-foreground"
            >
              <X size={12} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Polling Interval */}
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium flex items-center justify-between">
                <span>Polling Frequency:</span>
                <span className="font-mono text-foreground font-semibold">
                  {pollIntervalSec === 0 ? "Manual Only" : `Every ${pollIntervalSec} seconds`}
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 30, 60, 0].map((sec) => (
                  <Button
                    key={sec}
                    size="sm"
                    variant={pollIntervalSec === sec ? "default" : "outline"}
                    className="h-7 text-xs"
                    onClick={() => handleIntervalChange(sec)}
                  >
                    {sec === 0 ? "Pause" : `${sec}s`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Threshold Presets */}
            <div className="space-y-1.5">
              <label className="text-muted-foreground font-medium flex items-center justify-between">
                <span>Sensitivity Profile:</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleThresholdPreset("strict")}
                  title="Strict: Alerts at 400ms DB / 600ms Storage"
                >
                  Strict (400ms)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs bg-primary/10 border-primary/30"
                  onClick={() => handleThresholdPreset("default")}
                  title="Default: Alerts at 600ms DB / 900ms Storage"
                >
                  Standard (600ms)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => handleThresholdPreset("relaxed")}
                  title="Relaxed: Alerts at 1000ms DB / 1500ms Storage"
                >
                  Relaxed (1000ms)
                </Button>
              </div>
            </div>
          </div>

          {/* Manual numeric inputs for fine tuning */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/30">
            <div>
              <span className="text-[10px] text-muted-foreground">DB Warning (ms):</span>
              <input
                type="number"
                value={thresholds.dbWarningMs}
                onChange={(e) => handleCustomThreshold("dbWarningMs", Number(e.target.value))}
                className="w-full h-7 px-2 text-xs border rounded bg-white dark:bg-black font-mono mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">DB Critical (ms):</span>
              <input
                type="number"
                value={thresholds.dbCriticalMs}
                onChange={(e) => handleCustomThreshold("dbCriticalMs", Number(e.target.value))}
                className="w-full h-7 px-2 text-xs border rounded bg-white dark:bg-black font-mono mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Storage Warning (ms):</span>
              <input
                type="number"
                value={thresholds.storageWarningMs}
                onChange={(e) => handleCustomThreshold("storageWarningMs", Number(e.target.value))}
                className="w-full h-7 px-2 text-xs border rounded bg-white dark:bg-black font-mono mt-0.5"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground">Storage Critical (ms):</span>
              <input
                type="number"
                value={thresholds.storageCriticalMs}
                onChange={(e) => handleCustomThreshold("storageCriticalMs", Number(e.target.value))}
                className="w-full h-7 px-2 text-xs border rounded bg-white dark:bg-black font-mono mt-0.5"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPANDED TELEMETRY DETAILS & SPARKLINE */}
      {isExpanded && (
        <div className="border-t border-border/40 p-4 bg-white/90 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Telemetry Gauge */}
            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <Database size={14} className="text-primary" />
                  <span>Database Health & Query Response</span>
                </div>
                <span className="text-xs font-mono font-bold">
                  {probe?.dbLatencyMs ?? 0} ms
                </span>
              </div>

              <Progress
                value={Math.min(100, ((probe?.dbLatencyMs || 0) / thresholds.dbCriticalMs) * 100)}
                className="h-2"
              />

              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1">
                <span>0 ms</span>
                <span className="text-amber-600 font-medium">Warn: {thresholds.dbWarningMs}ms</span>
                <span className="text-rose-600 font-medium">Crit: {thresholds.dbCriticalMs}ms</span>
              </div>

              <div className="pt-2 text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Reachable Core Tables:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {probe?.tablesReachable ?? 0}/2 verified
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="font-mono text-foreground">HTTPS / TLS 1.3</span>
                </div>
                {probe?.dbError && (
                  <p className="text-rose-600 font-mono text-[10px] bg-rose-50 p-1 rounded">
                    Error: {probe.dbError}
                  </p>
                )}
              </div>
            </div>

            {/* Storage Telemetry Gauge */}
            <div className="p-3.5 rounded-xl border border-border/50 bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                  <HardDrive size={14} className="text-primary" />
                  <span>Storage Probe & File Service</span>
                </div>
                <span className="text-xs font-mono font-bold">
                  {probe?.storageLatencyMs ?? 0} ms
                </span>
              </div>

              <Progress
                value={Math.min(100, ((probe?.storageLatencyMs || 0) / thresholds.storageCriticalMs) * 100)}
                className="h-2"
              />

              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-1">
                <span>0 ms</span>
                <span className="text-amber-600 font-medium">Warn: {thresholds.storageWarningMs}ms</span>
                <span className="text-rose-600 font-medium">Crit: {thresholds.storageCriticalMs}ms</span>
              </div>

              <div className="pt-2 text-[11px] text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Bucket Reachability:</span>
                  <span className="font-semibold text-emerald-600">
                    {probe?.storageReachable ? "Connected (citizen-documents)" : "Unreachable"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Polled:</span>
                  <span className="font-mono text-foreground">
                    {probe?.timestamp ? new Date(probe.timestamp).toLocaleTimeString() : "Never"}
                  </span>
                </div>
                {probe?.storageError && (
                  <p className="text-rose-600 font-mono text-[10px] bg-rose-50 p-1 rounded">
                    Error: {probe.storageError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 5. RECENT LATENCY POLL HISTORY */}
          {history.length > 0 && (
            <div className="p-3.5 rounded-xl border border-border/40 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Activity size={13} className="text-primary" />
                  Recent Probe History (Last {history.length} checks)
                </h5>
                <span className="text-[10px] text-muted-foreground">Real-time latency trend</span>
              </div>

              {/* Mini visual trend strip */}
              <div className="flex items-end gap-1.5 h-16 pt-2 px-1">
                {history.map((h) => {
                  const maxVal = Math.max(thresholds.dbCriticalMs, 1000);
                  const dbHeight = Math.min(100, Math.max(12, (h.dbLatencyMs / maxVal) * 100));
                  const storeHeight = Math.min(100, Math.max(12, (h.storageLatencyMs / maxVal) * 100));

                  const isDbWarn = h.dbLatencyMs >= thresholds.dbWarningMs;
                  const isDbCrit = h.dbLatencyMs >= thresholds.dbCriticalMs;
                  const isStoreWarn = h.storageLatencyMs >= thresholds.storageWarningMs;
                  const isStoreCrit = h.storageLatencyMs >= thresholds.storageCriticalMs;

                  return (
                    <div
                      key={h.id}
                      className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                    >
                      {/* Dual bars: DB (left) and Storage (right) */}
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div
                          style={{ height: `${dbHeight}%` }}
                          className={`w-1/2 rounded-t-xs transition-all ${
                            isDbCrit ? "bg-rose-500" : isDbWarn ? "bg-amber-500" : "bg-sky-500"
                          }`}
                        />
                        <div
                          style={{ height: `${storeHeight}%` }}
                          className={`w-1/2 rounded-t-xs transition-all ${
                            isStoreCrit ? "bg-rose-400" : isStoreWarn ? "bg-amber-400" : "bg-emerald-500"
                          }`}
                        />
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-popover text-popover-foreground text-[10px] p-1.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none border">
                        <span className="font-semibold text-foreground">{h.time}</span>
                        <span className="text-sky-600 font-mono">DB: {h.dbLatencyMs}ms</span>
                        <span className="text-emerald-600 font-mono">Storage: {h.storageLatencyMs}ms</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/20">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" /> DB Latency
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Storage Latency
                  </span>
                </div>
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-[11px] text-primary"
                >
                  <Link to="/admin/system-status" className="flex items-center gap-1">
                    Open Full System Telemetry Page <ExternalLink size={10} />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
