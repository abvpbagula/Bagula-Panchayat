import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, RefreshCw, Download, Eye, ShieldCheck, Clock } from "lucide-react";
import { AuthAuditConsole } from "@/components/admin/AuthAuditConsole";

interface AuditLogRow {
  id: string;
  action_type: string;
  actor_email: string | null;
  target_table: string | null;
  target_id: string | null;
  metadata: any;
  created_at: string;
}

export const AuditLogSection: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogRow | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activity_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (err: any) {
      toast.error("Failed to fetch activity logs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportCsv = () => {
    if (logs.length === 0) {
      toast.info("No audit logs to export.");
      return;
    }

    const headers = ["ID", "Action", "Actor", "Target Table", "Target ID", "Timestamp"];
    const rows = logs.map((l) => [
      l.id,
      `"${l.action_type || ""}"`,
      `"${l.actor_email || ""}"`,
      `"${l.target_table || ""}"`,
      `"${l.target_id || ""}"`,
      `"${l.created_at}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bagula2_audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Audit log CSV exported.");
  };

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      l.action_type?.toLowerCase().includes(q) ||
      l.actor_email?.toLowerCase().includes(q) ||
      l.target_table?.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (actionFilter === "all") return true;
    return l.action_type?.toLowerCase().includes(actionFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <AuthAuditConsole compact />

      <Card className="shadow-xs border border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4 flex items-start justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-foreground">
                Immutable Governance Audit Trail (12-Year Retention)
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Under West Bengal Panchayat statutory record-keeping rules, every administrative configuration change, role elevation, and certificate lifecycle action is logged irrevocably with actor identity and timestamp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={fetchLogs} className="text-xs h-8 gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" onClick={handleExportCsv} className="text-xs h-8 gap-1">
              <Download className="h-3 w-3" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <span>Audit Entries ({logs.length})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time chronological trace of all governance modifications.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter by actor, action, or table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No audit logs match the current filter.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border bg-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground text-xs">
                        {log.action_type}
                      </span>
                      {log.target_table && (
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {log.target_table}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      Actor: <span className="font-medium text-foreground">{log.actor_email || "System"}</span> · Time: {new Date(log.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-3 w-3" /> Inspect Payload
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inspect Payload Modal */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Audit Event Payload</DialogTitle>
              <DialogDescription className="text-xs font-mono">
                {selectedLog.action_type} - {selectedLog.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs py-2">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded">
                <div>Actor: <strong className="text-foreground">{selectedLog.actor_email || "System"}</strong></div>
                <div>Table: <strong className="text-foreground">{selectedLog.target_table || "global"}</strong></div>
                <div>Time: <strong className="text-foreground">{new Date(selectedLog.created_at).toLocaleString("en-IN")}</strong></div>
                <div>Target ID: <strong className="text-foreground font-mono">{selectedLog.target_id || "N/A"}</strong></div>
              </div>

              <div>
                <div className="text-[11px] text-muted-foreground font-medium">Raw Metadata JSON:</div>
                <pre className="mt-1 p-3 rounded-md bg-muted text-[11px] font-mono overflow-auto max-h-60 border">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
