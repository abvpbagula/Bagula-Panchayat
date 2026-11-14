import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  User,
  Phone,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Calendar,
  AlertOctagon,
  Users,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ELECTED_REPRESENTATIVES_DATA,
  type ElectedRepresentativeRecord,
} from "@/lib/electedRepresentativesData";
import {
  memberWarishVerificationService,
  type MemberWarishNotice,
  getRemainingDays,
} from "@/lib/memberWarishVerificationService";
import { PartyOfficialLogo } from "@/components/PartyOfficialLogo";
import { ListSkeleton } from "@/components/skeletons/DashboardSkeletons";
import MemberEpicLinkageVerificationPanel from "@/pages/member/MemberEpicLinkageVerificationPanel";

export default function ElectedMemberPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const wardParam = searchParams.get("ward");
  const tabParam = searchParams.get("tab");

  const [activePortalTab, setActivePortalTab] = useState<"linkage" | "warish">(
    tabParam === "warish" ? "warish" : "linkage"
  );

  // Default to member 1 (Nandini Biswas, Ward 1) or ward in URL
  const [selectedWardNumber, setSelectedWardNumber] = useState<number>(() => {
    const parsed = parseInt(wardParam || "1", 10);
    return isNaN(parsed) || parsed < 1 || parsed > 30 ? 1 : parsed;
  });

  const [notices, setNotices] = useState<MemberWarishNotice[]>([]);
  const [loadingNotices, setLoadingNotices] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Dispute Dialog State
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [activeNoticeForDispute, setActiveNoticeForDispute] = useState<MemberWarishNotice | null>(null);
  const [disputeRemarks, setDisputeRemarks] = useState("");
  const [disputePhone, setDisputePhone] = useState("");
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Notice Detail Modal
  const [selectedNoticeDetail, setSelectedNoticeDetail] = useState<MemberWarishNotice | null>(null);

  // Sync notices from service
  const refreshNotices = useCallback(() => {
    setNotices(memberWarishVerificationService.getNoticesByMember(selectedWardNumber));
  }, [selectedWardNumber]);

  useEffect(() => {
    setLoadingNotices(true);
    refreshNotices();
    const timer = setTimeout(() => setLoadingNotices(false), 200);
    const unsubscribe = memberWarishVerificationService.subscribe(refreshNotices);
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [refreshNotices]);

  // Current active member details
  const activeMember: ElectedRepresentativeRecord = useMemo(() => {
    return (
      ELECTED_REPRESENTATIVES_DATA.find((m) => m.wardNumber === selectedWardNumber) ||
      ELECTED_REPRESENTATIVES_DATA[0]
    );
  }, [selectedWardNumber]);

  const handleMemberChange = (wardNo: number) => {
    setSelectedWardNumber(wardNo);
    setSearchParams({ ward: String(wardNo) });
  };

  // Filtered notices
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && n.status === "pending_enquiry") ||
        (statusFilter === "disputed" && n.status === "disputed") ||
        (statusFilter === "auto_approved" && (n.status === "auto_approved" || n.status === "acknowledged"));

      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        n.deceasedName.toLowerCase().includes(q) ||
        n.applicantName.toLowerCase().includes(q) ||
        n.memoNo.toLowerCase().includes(q) ||
        n.village.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [notices, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: notices.length,
      pending: notices.filter((n) => n.status === "pending_enquiry").length,
      disputed: notices.filter((n) => n.status === "disputed").length,
      approved: notices.filter((n) => n.status === "auto_approved" || n.status === "acknowledged").length,
    };
  }, [notices]);

  // Actions
  const handleOpenDispute = (n: MemberWarishNotice) => {
    setActiveNoticeForDispute(n);
    setDisputeRemarks("");
    setDisputePhone(activeMember.contact || "");
    setDisputeDialogOpen(true);
  };

  const handleConfirmDispute = () => {
    if (!activeNoticeForDispute) return;
    setIsSubmittingDispute(true);

    try {
      memberWarishVerificationService.raiseDispute(activeNoticeForDispute.id, {
        statement:
          "I did not attend an enquiry and did not give any signature to anyone regarding this warish certificate.",
        detailedRemarks: disputeRemarks.trim() || undefined,
        contactMobile: disputePhone.trim() || undefined,
      });

      toast.error(
        "Formal Complaint Lodged: Verification disputed! Office administration has been notified and auto-approval is permanently blocked."
      );
      setDisputeDialogOpen(false);
      refreshNotices();
    } catch {
      toast.error("Failed to submit complaint. Please retry.");
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  const handleAcknowledge = (n: MemberWarishNotice) => {
    memberWarishVerificationService.acknowledgeNotice(
      n.id,
      "Field verification conducted in ward and signature confirmed."
    );
    toast.success("Verification endorsed: Inquiry and signature confirmed by elected member.");
    refreshNotices();
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20">
      <Helmet>
        <title>Elected Representatives Portal — Bagula 2 No Gram Panchayat</title>
        <meta
          name="description"
          content="Official portal for 30 Elected Members of Bagula 2 No Gram Panchayat. Manage Warish inquiries, 45-day verification notices, and ward representation."
        />
      </Helmet>

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-border/60 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-xl text-amber-600 border border-amber-500/20">
              🏛️
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase">
                Bagula 2 No Gram Panchayat · Nadia
              </p>
              <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <span>Elected Representatives Portal</span>
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 bg-amber-50">
                  30 Ward Members
                </Badge>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="min-h-[40px] text-xs">
              <Link to="/elected-representatives">All 30 Members Directory</Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="min-h-[40px] text-xs">
              <Link to="/">Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Member Selector Bar */}
        <section className="bg-white rounded-2xl border border-border/70 p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Select Your Representative Profile (30 Elected Members)
              </label>
              <p className="text-xs text-muted-foreground">
                Switch between any of the 30 Gram Sansad ward members to review their active inquiries.
              </p>
            </div>
            <div className="w-full sm:w-80">
              <select
                value={selectedWardNumber}
                onChange={(e) => handleMemberChange(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-slate-50 text-sm font-semibold text-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
              >
                {ELECTED_REPRESENTATIVES_DATA.map((m) => (
                  <option key={m.slNo} value={m.wardNumber}>
                    Ward {m.wardNumber} (Sansad {m.sansadNo}): {m.name} — {m.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Member Bio Card */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/5 via-slate-50 to-primary/5 border border-amber-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-2xl font-bold text-amber-700 shrink-0">
                {activeMember.wardNumber}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">{activeMember.name}</h2>
                  <span className="text-xs text-muted-foreground font-medium">({activeMember.nameBn})</span>
                  <Badge className="bg-amber-600 text-white text-[11px] font-semibold">{activeMember.designation}</Badge>
                  {activeMember.isDualBooth && (
                    <Badge variant="outline" className="border-indigo-400 text-indigo-700 bg-indigo-50 text-[10px]">
                      Dual Booth Sansad
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>📍 Sansad {activeMember.sansadNo} ({activeMember.address})</span>
                  <span>•</span>
                  <span>🗳️ Booths: {activeMember.boothNumbers.join(", ")} (Part {activeMember.partNo})</span>
                  <span>•</span>
                  <span>📞 {activeMember.contact ? `+91 ${activeMember.contact}` : "Registered"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Affiliation</p>
                <p className="text-xs font-semibold text-foreground">{activeMember.partyName}</p>
              </div>
              <PartyOfficialLogo partyCode={activeMember.partyName} size="md" className="w-10 h-10" />
            </div>
          </div>
        </section>

        {/* Portal Module Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border/70 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActivePortalTab("linkage")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activePortalTab === "linkage"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-700 border hover:bg-slate-50"
            }`}
          >
            <span>🗳️</span>
            <span>EPIC Parent Linkage (বিবাহিতা কন্যার ভোটার সংযোগ)</span>
            <Badge className={`text-[10px] ml-1 ${activePortalTab === "linkage" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-800"}`}>
              Ward {activeMember.wardNumber}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActivePortalTab("warish")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
              activePortalTab === "warish"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-slate-700 border hover:bg-slate-50"
            }`}
          >
            <span>📜</span>
            <span>Warish Inquiries (ওয়ারিশ তদন্ত ও আপত্তি)</span>
            <Badge className={`text-[10px] ml-1 ${activePortalTab === "warish" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
              {notices.length}
            </Badge>
          </button>

          <Link
            to={`/sc-st-lineage?tab=review&ward=${activeMember.wardNumber}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-slate-700 border hover:bg-slate-50 transition-all whitespace-nowrap"
          >
            <span>🌳</span>
            <span>SC/ST Paternal Lineage (বংশতালিকা)</span>
          </Link>
        </div>

        {activePortalTab === "linkage" ? (
          <MemberEpicLinkageVerificationPanel activeMember={activeMember} />
        ) : (
          <>
        {/* Statutory 45-Day Objection Rule Guidance Banner */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs text-blue-950">
              <h3 className="font-bold text-sm text-blue-900 flex items-center gap-2">
                <span>Statutory 45-Day Ward Inquiry & Verification Protocol</span>
                <Badge className="bg-blue-600 text-white text-[10px]">Rule Safeguard</Badge>
              </h3>
              <p className="leading-relaxed">
                Whenever an applicant or operator issues a Warish Certificate citing you as the{" "}
                <strong>Concerned Elected Ward Member</strong>, a formal notification is registered on your profile.
              </p>
              <ul className="list-disc list-inside space-y-1 text-blue-900/90 mt-1">
                <li>
                  <strong>45-Day Review Period:</strong> You have 45 calendar days from notice date to verify if you
                  personally conducted the enquiry.
                </li>
                <li>
                  <strong>Member Objection / Complaint:</strong> If you did NOT attend the enquiry or did NOT give any
                  signature, click <em>"Raise Concern / Dispute"</em>. The certificate is immediately frozen for administrative review.
                </li>
                <li>
                  <strong>Automatic Approval:</strong> If 45 days elapse without any claim or dispute lodged, the verification
                  is <strong>automatically granted as approved</strong> under statutory panchayat succession rules!
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 bg-white border-border/70 shadow-xs">
            <p className="text-xs text-muted-foreground font-medium">Total Inquiries</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Assigned to Ward {activeMember.wardNumber}</p>
          </Card>

          <Card className="p-4 bg-white border-border/70 shadow-xs">
            <p className="text-xs text-amber-600 font-medium">Pending 45-Day Review</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Within objection window</p>
          </Card>

          <Card className="p-4 bg-white border-border/70 shadow-xs">
            <p className="text-xs text-rose-600 font-medium">Disputed / Complaints</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{stats.disputed}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Member raised objection</p>
          </Card>

          <Card className="p-4 bg-white border-border/70 shadow-xs">
            <p className="text-xs text-emerald-600 font-medium">Granted / Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">45-day elapsed or endorsed</p>
          </Card>
        </div>

        {/* SC/ST Paternal Lineage & Vamshabriksha Scrutiny Desk Quick Access */}
        <div className="rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-amber-100/70 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm font-bold">
              SC
            </div>
            <div className="space-y-0.5 text-xs text-amber-950">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-amber-900">
                  SC/ST Paternal Lineage &amp; Vamshabriksha Verification Desk
                </h3>
                <Badge className="bg-amber-600 text-white text-[10px]">Act 1994 Protocol</Badge>
              </div>
              <p className="text-amber-900/90">
                SC/ST পৈতৃক বংশতালিকা ও সম্পর্ক যাচাই — Review multi-generational recursive family trees, examine local witnesses, and record your statutory declaration under Section 5 of WB SC/ST Act 1994.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Link
              to={`/sc-st-lineage?tab=review&ward=${activeMember.wardNumber}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all"
            >
              <span>Open Ward #{activeMember.wardNumber} Lineage Desk</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Notice Register Section */}
        <section className="bg-white rounded-2xl border border-border/70 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Warish Verification Notices & Inquiry Queue</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {filteredNotices.length} items
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Tracking all legal heir certificates citing {activeMember.name} as verifying representative.
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-border/40 text-xs">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === "all" ? "bg-white text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === "pending" ? "bg-amber-500 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setStatusFilter("disputed")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === "disputed" ? "bg-rose-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Disputed ({stats.disputed})
                </button>
                <button
                  onClick={() => setStatusFilter("auto_approved")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    statusFilter === "auto_approved" ? "bg-emerald-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Approved ({stats.approved})
                </button>
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search deceased / memo..."
                  className="h-8 pl-8 text-xs rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Notices Grid */}
          {loadingNotices ? (
            <ListSkeleton count={3} />
          ) : filteredNotices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <FileText className="w-10 h-10 mx-auto opacity-30 text-amber-600" />
              <p className="text-sm font-semibold">No Warish verification notices in this category</p>
              <p className="text-xs">
                When new certificates are drafted in Ward {activeMember.wardNumber}, they will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => {
                const rem = getRemainingDays(notice.expiryDate);
                const percentElapsed = Math.round((rem.elapsedDays / rem.totalDays) * 100);

                return (
                  <div
                    key={notice.id}
                    className={`rounded-2xl border transition-all p-4 space-y-3 ${
                      notice.status === "disputed"
                        ? "border-rose-300 bg-rose-50/40"
                        : notice.status === "auto_approved" || notice.status === "acknowledged"
                        ? "border-emerald-300 bg-emerald-50/30"
                        : "border-amber-200 bg-amber-50/20 hover:border-amber-400"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            Memo: {notice.memoNo}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({notice.trackingNo})
                          </span>

                          {notice.status === "pending_enquiry" && (
                            <Badge className="bg-amber-500 text-white text-[11px] gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{rem.daysLeft} Days Remaining to Object</span>
                            </Badge>
                          )}

                          {notice.status === "auto_approved" && (
                            <Badge className="bg-emerald-600 text-white text-[11px] gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Auto-Approved (45-Day Period Elapsed)</span>
                            </Badge>
                          )}

                          {notice.status === "acknowledged" && (
                            <Badge className="bg-emerald-600 text-white text-[11px] gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Inquiry Confirmed by Member</span>
                            </Badge>
                          )}

                          {notice.status === "disputed" && (
                            <Badge className="bg-rose-600 text-white text-[11px] gap-1">
                              <AlertOctagon className="w-3 h-3" />
                              <span>Disputed: No Enquiry Conducted</span>
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm font-semibold text-foreground">
                          Deceased: <span className="text-primary font-bold">Late {notice.deceasedName}</span>
                          <span className="text-xs font-normal text-muted-foreground ml-2">
                            (Father/Husband: {notice.deceasedFatherHusband})
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                          <span>🏡 Village: {notice.village}</span>
                          <span>•</span>
                          <span>👤 Applicant: {notice.applicantName} ({notice.applicantRelation})</span>
                          <span>•</span>
                          <span>👥 Total Heirs: {notice.heirsCount}</span>
                          <span>•</span>
                          <span>📅 Notice Issued: {new Date(notice.noticeDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedNoticeDetail(notice)}
                          className="text-xs h-8"
                        >
                          View Details
                        </Button>

                        {notice.status === "pending_enquiry" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAcknowledge(notice)}
                              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Confirm Enquiry
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenDispute(notice)}
                              className="text-xs h-8 gap-1 font-semibold"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>Raise Concern / Dispute</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 45-Day Statutory Clock Visualizer */}
                    {notice.status === "pending_enquiry" && (
                      <div className="space-y-1.5 pt-2 border-t border-amber-200/60">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-amber-800 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Statutory 45-Day Window: {rem.elapsedDays} of 45 days passed</span>
                          </span>
                          <span className="text-amber-900 font-bold">
                            {rem.daysLeft} days remaining until automatic grant
                          </span>
                        </div>
                        <Progress value={percentElapsed} className="h-2 bg-amber-100" />
                        <p className="text-[11px] text-amber-800/80">
                          Notice expires on <strong>{new Date(notice.expiryDate).toLocaleDateString()}</strong>. If no dispute is lodged,
                          this succession statement is automatically approved.
                        </p>
                      </div>
                    )}

                    {/* Dispute Info Box */}
                    {notice.status === "disputed" && notice.complaint && (
                      <div className="mt-2 p-3 rounded-xl bg-rose-100/70 border border-rose-300 text-xs text-rose-950 space-y-1">
                        <p className="font-bold flex items-center gap-1 text-rose-900">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Member's Formal Complaint On Record (Filed {new Date(notice.complaint.filedAt).toLocaleString()}):</span>
                        </p>
                        <p className="italic font-medium text-rose-900 bg-white/70 p-2 rounded-lg border border-rose-200">
                          "{notice.complaint.statement}"
                        </p>
                        {notice.complaint.detailedRemarks && (
                          <p className="text-rose-800">
                            <strong>Additional Remarks:</strong> {notice.complaint.detailedRemarks}
                          </p>
                        )}
                        <p className="text-[11px] text-rose-700">
                          🛑 Certificate generation & auto-approval halted. Sent to GP Prodhan and Executive Assistant for statutory inquiry.
                        </p>
                      </div>
                    )}

                    {/* Acknowledged / Auto Approved Banner */}
                    {notice.status === "auto_approved" && (
                      <div className="mt-2 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          <strong>Statutory Approval Granted:</strong> The 45-day inquiry window elapsed on{" "}
                          {notice.autoApprovedAt ? new Date(notice.autoApprovedAt).toLocaleDateString() : "schedule"} without any objection.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
          </>
        )}
      </main>

      {/* DISPUTE / COMPLAINT DIALOG */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Raise Formal Concern / Dispute Verification</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              File a statutory objection if you did not conduct this field inquiry or sign the application.
            </DialogDescription>
          </DialogHeader>

          {activeNoticeForDispute && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <p className="font-bold text-foreground">
                  Certificate Memo: {activeNoticeForDispute.memoNo}
                </p>
                <p className="text-muted-foreground">
                  Deceased: <strong>Late {activeNoticeForDispute.deceasedName}</strong> · Village: {activeNoticeForDispute.village}
                </p>
                <p className="text-muted-foreground">
                  Applicant: <strong>{activeNoticeForDispute.applicantName}</strong> ({activeNoticeForDispute.applicantRelation})
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-foreground">Mandatory Statutory Declaration:</label>
                <div className="p-3 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 font-semibold leading-relaxed">
                  "I did not attend an enquiry and did not give any signature to anyone regarding this warish certificate."
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">
                  Additional Details / Reason for Disputing (Optional):
                </label>
                <Textarea
                  value={disputeRemarks}
                  onChange={(e) => setDisputeRemarks(e.target.value)}
                  placeholder="e.g. Applicant did not approach me; succession claim is contested locally; no Gram Sansad signature was given..."
                  className="text-xs min-h-[70px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Your Contact Mobile Number for Confirmation:</label>
                <Input
                  value={disputePhone}
                  onChange={(e) => setDisputePhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="text-xs h-9"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                ⚠️ Filing this dispute will immediately freeze this certificate in the Gram Panchayat register.
                Auto-approval will be revoked and an inquiry notice will be served to the Prodhan.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisputeDialogOpen(false)}
              disabled={isSubmittingDispute}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDispute}
              disabled={isSubmittingDispute}
              className="gap-1.5 font-bold"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm & Lodge Formal Dispute</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NOTICE DETAILS MODAL */}
      <Dialog open={!!selectedNoticeDetail} onOpenChange={() => setSelectedNoticeDetail(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>Warish Inquiry Details</span>
            </DialogTitle>
          </DialogHeader>

          {selectedNoticeDetail && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Memo Number</span>
                  <span className="font-bold font-mono">{selectedNoticeDetail.memoNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Tracking ID</span>
                  <span className="font-mono">{selectedNoticeDetail.trackingNo}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Notice Date</span>
                  <span>{new Date(selectedNoticeDetail.noticeDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">45-Day Deadline</span>
                  <span>{new Date(selectedNoticeDetail.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-1 border-t pt-2">
                <p>
                  <strong>Deceased Person:</strong> Late {selectedNoticeDetail.deceasedName}
                </p>
                <p>
                  <strong>Care of / Father:</strong> {selectedNoticeDetail.deceasedFatherHusband}
                </p>
                <p>
                  <strong>Village & Post:</strong> {selectedNoticeDetail.village}, {selectedNoticeDetail.postOffice}
                </p>
                <p>
                  <strong>Applicant:</strong> {selectedNoticeDetail.applicantName} ({selectedNoticeDetail.applicantRelation})
                </p>
                <p>
                  <strong>Recorded Heirs Count:</strong> {selectedNoticeDetail.heirsCount} successors
                </p>
                <p>
                  <strong>Verification Mode:</strong>{" "}
                  {selectedNoticeDetail.verificationType === "affidavit" ? "Court Affidavit" : "Local Neighbour Declaration"}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                <strong>Statutory Note:</strong> Verified under the authority of{" "}
                {selectedNoticeDetail.verifyingMemberName} (Ward {selectedNoticeDetail.wardNumber}). If no dispute is
                filed within 45 days, this succession certificate is automatically issued.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setSelectedNoticeDetail(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
