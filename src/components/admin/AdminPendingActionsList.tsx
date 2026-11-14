import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  FileCheck2,
  Building2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { logActivity } from "@/lib/activityLog";
import { useMasterData } from "@/lib/masterData";

export interface PendingActionItem {
  id: string;
  kind: "warish" | "dependent" | "linkage";
  verification_id: string;
  applicant_name: string;
  secondary_info?: string;
  village: string | null;
  contact_mobile?: string | null;
  created_at: string;
  cert_date?: string | null;
  document_mode?: string | null;
}

const COMMON_REJECTION_REASONS = [
  "Incomplete or blurred supporting documents",
  "Discrepancy in applicant name or legal heir hierarchy",
  "Deceased date or death certificate record mismatch",
  "Applicant not a permanent resident of Bagula 2 No GP",
  "Missing required identity proof or affidavit",
  "Duplicate submission of an existing registered application",
];

async function fetchNextMemoSerial(year: number): Promise<number> {
  try {
    const [wRes, dRes, seqRes] = await Promise.all([
      supabase
        .from("warish_certificates")
        .select("memo_serial, issue_date, cert_date")
        .not("memo_serial", "is", null),
      supabase
        .from("dependent_certificates")
        .select("memo_serial, issue_date, cert_date")
        .not("memo_serial", "is", null),
      supabase
        .from("certificate_sequences")
        .select("last_value")
        .eq("sequence_year", year)
        .maybeSingle(),
    ]);

    let maxSerial = 0;
    const processRows = (rows: any[] | null) => {
      if (!rows) return;
      for (const r of rows) {
        const d = r.issue_date || r.cert_date;
        const itemYear = d ? new Date(d).getFullYear() : null;
        if (!itemYear || itemYear === year) {
          if (typeof r.memo_serial === "number" && r.memo_serial > maxSerial) {
            maxSerial = r.memo_serial;
          }
        }
      }
    };

    processRows(wRes.data as any);
    processRows(dRes.data as any);

    const seqVal = seqRes.data?.last_value ?? 0;
    return Math.max(maxSerial, seqVal) + 1;
  } catch (err) {
    console.error("Error computing next memo serial:", err);
    return 1;
  }
}

interface AdminPendingActionsListProps {
  onActionCompleted?: () => void;
  className?: string;
}

export function AdminPendingActionsList({
  onActionCompleted,
  className,
}: AdminPendingActionsListProps) {
  const [items, setItems] = useState<PendingActionItem[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<"all" | "warish" | "dependent" | "linkage">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Targets for inline modals
  const [approveItem, setApproveItem] = useState<PendingActionItem | null>(null);
  const [rejectItem, setRejectItem] = useState<PendingActionItem | null>(null);
  const [busy, setBusy] = useState<boolean>(false);

  // Approve dialog state
  const currentYear = new Date().getFullYear();
  const [memoYear, setMemoYear] = useState<number>(currentYear);
  const [autoSerial, setAutoSerial] = useState<number | null>(null);
  const [loadingSerial, setLoadingSerial] = useState(false);
  const [issueDate, setIssueDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [approveRemarks, setApproveRemarks] = useState("Documents verified. Application in order.");

  // Reject dialog state
  const [rejectReason, setRejectReason] = useState<string>("");
  const { items: masterReasons } = useMasterData("rejection_reason");

  const rejectionOptions = useMemo(() => {
    const list = masterReasons.map((m) => m.label);
    COMMON_REJECTION_REASONS.forEach((r) => {
      if (!list.includes(r)) list.push(r);
    });
    return list;
  }, [masterReasons]);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, dRes] = await Promise.all([
        supabase
          .from("warish_certificates")
          .select("id, verification_id, status, applicant_name, deceased_name, village, contact_mobile, created_at, cert_date, document_mode")
          .eq("status", "Pending Signature & Memo Registration")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("dependent_certificates")
          .select("id, verification_id, status, applicant_name, village, department, contact_mobile, created_at, cert_date, document_mode")
          .eq("status", "Pending Signature & Memo Registration")
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const warishList: PendingActionItem[] = (wRes.data || []).map((w: any) => ({
        id: w.id,
        kind: "warish",
        verification_id: w.verification_id || `WAR-${w.id.slice(0, 6)}`,
        applicant_name: w.applicant_name || "Applicant",
        secondary_info: w.deceased_name ? `Heir of ${w.deceased_name}` : undefined,
        village: w.village,
        contact_mobile: w.contact_mobile,
        created_at: w.created_at,
        cert_date: w.cert_date,
        document_mode: w.document_mode,
      }));

      const dependentList: PendingActionItem[] = (dRes.data || []).map((d: any) => {
        const isLinkage = d.department === "linkage";
        return {
          id: d.id,
          kind: isLinkage ? "linkage" : "dependent",
          verification_id: d.verification_id || (isLinkage ? `LNK-${d.id.slice(0, 6)}` : `DEP-${d.id.slice(0, 6)}`),
          applicant_name: d.applicant_name || "Applicant",
          secondary_info: isLinkage ? "Linkage Certificate Verification" : d.department ? `Dept: ${d.department}` : undefined,
          village: d.village,
          contact_mobile: d.contact_mobile,
          created_at: d.created_at,
          cert_date: d.cert_date,
          document_mode: d.document_mode,
        };
      });

      const combined = [...warishList, ...dependentList].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setItems(combined);
    } catch (err) {
      console.error("Failed to load pending actions:", err);
      toast.error("Could not load pending review items.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Load next available memo serial when approve modal opens
  useEffect(() => {
    if (!approveItem) return;
    let active = true;
    setLoadingSerial(true);
    setIssueDate(new Date().toISOString().slice(0, 10));
    setApproveRemarks("Documents verified. Application in order.");

    fetchNextMemoSerial(memoYear).then((serial) => {
      if (active) {
        setAutoSerial(serial);
        setLoadingSerial(false);
      }
    });

    return () => {
      active = false;
    };
  }, [approveItem, memoYear]);

  // Handle inline Approve execution
  const handleExecuteApprove = async () => {
    if (!approveItem) return;
    setBusy(true);

    const chosenSerial = autoSerial || 1;
    const memoYearVal = memoYear;
    const computedMemoNo = `${chosenSerial}/BGL-II/${memoYearVal}`;

    try {
      // 1. Try stored procedure RPC
      const { data, error } = await supabase.rpc("approve_certificate_v2", {
        _kind: approveItem.kind,
        _cert_id: approveItem.id,
        _memo_serial: chosenSerial,
        _memo_year: memoYearVal,
        _issue_date: issueDate,
      });

      if (error) {
        // Fallback to direct table update if RPC signature mismatched
        const table = approveItem.kind === "warish" ? "warish_certificates" : "dependent_certificates";
        const { error: updateError } = await supabase
          .from(table)
          .update({
            status: "Approved",
            memo_no: computedMemoNo,
            memo_serial: chosenSerial,
            memo_year: memoYearVal,
            issue_date: issueDate,
            approval_timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", approveItem.id);

        if (updateError) throw updateError;
      }

      await logActivity({
        action_type: "certificate.approve",
        target_id: approveItem.id,
        target_table: approveItem.kind === "warish" ? "warish_certificates" : "dependent_certificates",
        metadata: {
          memo_no: (data as any)?.memo_no || computedMemoNo,
          memo_serial: chosenSerial,
          memo_year: memoYearVal,
          verification_id: approveItem.verification_id,
          source: "admin_dashboard_inline_shortcut",
        },
      });

      toast.success(
        `✅ Approved: Memo ${((data as any)?.memo_no || computedMemoNo)} registered for ${approveItem.applicant_name}`
      );

      // Optimistically remove from list
      setItems((prev) => (prev ? prev.filter((p) => p.id !== approveItem.id) : []));
      setApproveItem(null);
      onActionCompleted?.();
    } catch (err: any) {
      console.error("Approve error:", err);
      toast.error(`Approval failed: ${err.message || "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  // Handle inline Reject execution
  const handleExecuteReject = async () => {
    if (!rejectItem) return;
    const finalReason = rejectReason.trim();
    if (!finalReason) {
      toast.error("Please provide or select a rejection reason");
      return;
    }

    setBusy(true);
    try {
      // 1. Try stored procedure RPC
      const { error } = await supabase.rpc("reject_certificate_v2", {
        _kind: rejectItem.kind,
        _cert_id: rejectItem.id,
        _reason: finalReason,
      });

      if (error) {
        // Fallback to direct table update
        const table = rejectItem.kind === "warish" ? "warish_certificates" : "dependent_certificates";
        const { error: updateError } = await supabase
          .from(table)
          .update({
            status: "Rejected",
            rejection_reason: finalReason,
            rejected_at: new Date().toISOString(),
            rejection_timestamp: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", rejectItem.id);

        if (updateError) throw updateError;
      }

      await logActivity({
        action_type: "certificate.reject",
        target_id: rejectItem.id,
        target_table: rejectItem.kind === "warish" ? "warish_certificates" : "dependent_certificates",
        metadata: {
          verification_id: rejectItem.verification_id,
          reason: finalReason,
          source: "admin_dashboard_inline_shortcut",
        },
      });

      toast.success(`❌ Application ${rejectItem.verification_id} rejected.`);

      // Optimistically remove from list
      setItems((prev) => (prev ? prev.filter((p) => p.id !== rejectItem.id) : []));
      setRejectItem(null);
      setRejectReason("");
      onActionCompleted?.();
    } catch (err: any) {
      console.error("Reject error:", err);
      toast.error(`Rejection failed: ${err.message || "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  };

  // Filter items
  const filteredList = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      if (filterType !== "all" && item.kind !== filterType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.verification_id.toLowerCase().includes(q) ||
        item.applicant_name.toLowerCase().includes(q) ||
        (item.village && item.village.toLowerCase().includes(q)) ||
        (item.secondary_info && item.secondary_info.toLowerCase().includes(q))
      );
    });
  }, [items, filterType, searchQuery]);

  const counts = useMemo(() => {
    if (!items) return { all: 0, warish: 0, dependent: 0, linkage: 0 };
    return {
      all: items.length,
      warish: items.filter((i) => i.kind === "warish").length,
      dependent: items.filter((i) => i.kind === "dependent").length,
      linkage: items.filter((i) => i.kind === "linkage").length,
    };
  }, [items]);

  return (
    <section className={`rounded-2xl border border-border/50 bg-white/95 backdrop-blur-sm p-4 sm:p-5 shadow-sm space-y-4 ${className || ""}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <ClipboardList size={16} />
            </div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              Pending Actions
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-300 font-mono text-[11px] px-2 py-0.5"
              >
                {counts.all} waiting
              </Badge>
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Streamlined review queue — execute instant approvals or rejections directly inline.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPending}
            disabled={loading}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
            title="Refresh pending actions"
          >
            <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/5 rounded-lg"
          >
            <Link to="/admin/review?kind=warish&filter=waiting">
              <span>Full Review Workspace</span>
              <ExternalLink size={12} />
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="inline-flex rounded-xl bg-slate-100/80 p-1 text-xs border border-border/30 overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === "all"
                ? "bg-white text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>All</span>
            <span className="text-[10px] opacity-75">({counts.all})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("warish")}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === "warish"
                ? "bg-white text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>📜 Warish</span>
            <span className="text-[10px] opacity-75">({counts.warish})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("dependent")}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === "dependent"
                ? "bg-white text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>👤 Dependent</span>
            <span className="text-[10px] opacity-75">({counts.dependent})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterType("linkage")}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterType === "linkage"
                ? "bg-white text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>🗳️ Linkage</span>
            <span className="text-[10px] opacity-75">({counts.linkage})</span>
          </button>
        </div>

        {/* Search filter input */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pending ID, name, village…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border/50 bg-white/90 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-2">
        {loading && items === null && (
          <div className="p-8 text-center space-y-2">
            <div className="inline-block animate-spin text-primary">
              <RotateCcw size={20} />
            </div>
            <p className="text-xs text-muted-foreground">Loading pending review queue…</p>
          </div>
        )}

        {!loading && filteredList.length === 0 && (
          <div className="p-8 text-center rounded-xl border border-dashed border-border/60 bg-slate-50/50">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              {searchQuery ? "No matching pending records found" : "All caught up!"}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mx-auto">
              {searchQuery
                ? `No pending items matched "${searchQuery}". Clear your search query to see all records.`
                : "There are currently no applications waiting for administrative review."}
            </p>
          </div>
        )}

        {filteredList.map((item) => {
          const kindBadge =
            item.kind === "warish"
              ? { label: "📜 Warish", tone: "bg-sky-50 text-sky-800 border-sky-200" }
              : item.kind === "linkage"
              ? { label: "🗳️ Linkage", tone: "bg-purple-50 text-purple-800 border-purple-200" }
              : { label: "👤 Dependent", tone: "bg-violet-50 text-violet-800 border-violet-200" };

          return (
            <div
              key={item.id}
              className="p-3.5 sm:p-4 rounded-xl border border-border/50 bg-white hover:border-primary/30 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 hover:shadow-xs group"
            >
              {/* Left Item Details */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-[10px] font-medium py-0 px-2 ${kindBadge.tone}`}>
                    {kindBadge.label}
                  </Badge>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {item.verification_id}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-medium py-0 px-1.5"
                  >
                    ● Waiting Review
                  </Badge>
                </div>

                <div className="text-sm font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{item.applicant_name}</span>
                  {item.secondary_info && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({item.secondary_info})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  {item.village && (
                    <span className="flex items-center gap-1">
                      <Building2 size={12} className="text-muted-foreground/80" />
                      <span>{item.village}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-muted-foreground/80" />
                    <span>{new Date(item.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                </div>
              </div>

              {/* Right Inline Shortcut Actions */}
              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border/30">
                {/* Inline Review Shortcut */}
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg gap-1"
                >
                  <Link to={`/admin/review?kind=${item.kind}&q=${encodeURIComponent(item.verification_id)}`}>
                    <Eye size={13} />
                    <span className="hidden sm:inline">Details</span>
                  </Link>
                </Button>

                {/* Inline REJECT Shortcut Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectItem(item);
                    setRejectReason("");
                  }}
                  className="h-8 px-3 text-xs font-medium border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 rounded-lg gap-1.5 transition-colors"
                  title="Reject this application with remarks"
                >
                  <XCircle size={13} className="text-rose-600" />
                  <span>Reject</span>
                </Button>

                {/* Inline APPROVE Shortcut Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setApproveItem(item)}
                  className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1.5 shadow-xs transition-colors"
                  title="Directly approve and assign memo registration"
                >
                  <CheckCircle2 size={13} />
                  <span>Approve</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK APPROVE INLINE DIALOG */}
      <Dialog open={!!approveItem} onOpenChange={(o) => !o && setApproveItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Inline Approval &amp; Memo Issuance</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Confirm official Memo Number assignment for verification ID{" "}
              <strong className="font-mono text-foreground">{approveItem?.verification_id}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Applicant Summary Pill */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Applicant</p>
                <p className="font-bold text-foreground text-sm">{approveItem?.applicant_name}</p>
                {approveItem?.village && (
                  <p className="text-[11px] text-muted-foreground">{approveItem.village}</p>
                )}
              </div>
              <Badge variant="outline" className="font-mono text-xs font-bold text-primary bg-primary/5">
                {approveItem?.kind === "warish" ? "Warish" : approveItem?.kind === "linkage" ? "Linkage" : "Dependent"}
              </Badge>
            </div>

            {/* Generated Memo Preview */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <FileCheck2 size={14} className="text-emerald-600" />
                  Auto-Assigned Memo Number:
                </span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  {loadingSerial ? "Calculating next…" : "Next In Sequence"}
                </span>
              </div>
              <div className="font-mono text-lg font-extrabold text-emerald-800">
                {loadingSerial ? "Assigning next serial…" : `${autoSerial || 1}/BGL-II/${memoYear}`}
              </div>
            </div>

            {/* Issue Date Field */}
            <div className="space-y-1">
              <label className="font-medium text-foreground block">Official Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-lg font-mono text-xs bg-white"
              />
            </div>

            {/* Remarks Field */}
            <div className="space-y-1">
              <label className="font-medium text-foreground block">Verification Remarks</label>
              <textarea
                value={approveRemarks}
                onChange={(e) => setApproveRemarks(e.target.value)}
                rows={2}
                placeholder="Documents verified. Application in order."
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setApproveItem(null)}
              disabled={busy}
              className="text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteApprove}
              disabled={busy || loadingSerial}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg gap-1.5"
            >
              <CheckCircle2 size={13} />
              <span>{busy ? "Approving…" : "Confirm & Issue Memo"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUICK REJECT INLINE DIALOG */}
      <Dialog open={!!rejectItem} onOpenChange={(o) => !o && setRejectItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-destructive">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Reject Application</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rejecting application{" "}
              <strong className="font-mono text-foreground">{rejectItem?.verification_id}</strong> (
              {rejectItem?.applicant_name}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground block">
                Quick Preset Reason:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-lg bg-slate-50 border border-border/40">
                {rejectionOptions.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRejectReason(opt)}
                    className={`text-[11px] text-left px-2 py-1 rounded-md border transition-colors ${
                      rejectReason === opt
                        ? "bg-rose-100 border-rose-300 text-rose-900 font-semibold"
                        : "bg-white hover:bg-slate-100 border-border/60 text-muted-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground block">
                Rejection Remarks *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="State the reason for rejecting this application…"
                className="w-full px-3 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectItem(null)}
              disabled={busy}
              className="text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExecuteReject}
              disabled={busy || !rejectReason.trim()}
              className="text-xs rounded-lg gap-1.5"
            >
              <XCircle size={13} />
              <span>{busy ? "Rejecting…" : "Confirm Rejection"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
