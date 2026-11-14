import React, { useState, useEffect, useCallback } from "react";
import {
  memberLinkageVerificationService,
  type MemberLinkageNotice,
} from "@/lib/services/memberLinkageVerificationService";
import type { VerificationState } from "@/modules/linkage/epicParentLinkageTypes";
import EpicParentLinkageVisualCard from "@/modules/linkage/EpicParentLinkageVisualCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileCheck2,
  Clock,
  Search,
  ExternalLink,
  Printer,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  activeMember: {
    id: number;
    name: string;
    nameBn?: string;
    designation: string;
    wardNumber: number;
    sansadNo: string;
    contact?: string;
  };
}

export default function MemberEpicLinkageVerificationPanel({ activeMember }: Props) {
  const [notices, setNotices] = useState<MemberLinkageNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Selected Notice for Review & Verification Modal
  const [selectedNotice, setSelectedNotice] = useState<MemberLinkageNotice | null>(null);

  // Independent verification review state
  const [fatherStatus, setFatherStatus] = useState<VerificationState>("verified");
  const [fatherRemarks, setFatherRemarks] = useState("");
  const [motherStatus, setMotherStatus] = useState<VerificationState>("verified");
  const [motherRemarks, setMotherRemarks] = useState("");
  const [evidenceStatus, setEvidenceStatus] = useState<VerificationState>("verified");
  const [evidenceRemarks, setEvidenceRemarks] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [endorseConfirmOpen, setEndorseConfirmOpen] = useState(false);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await memberLinkageVerificationService.getNoticesForMember(
        activeMember.wardNumber,
        activeMember.sansadNo
      );
      setNotices(data);
    } catch (e) {
      console.warn("Failed to load member linkage notices:", e);
    } finally {
      setLoading(false);
    }
  }, [activeMember.wardNumber, activeMember.sansadNo]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  // Open review modal and reset checks
  const handleOpenReview = (notice: MemberLinkageNotice) => {
    setSelectedNotice(notice);
    const existing = notice.epic_parent_linkage.memberVerification;
    setFatherStatus(existing?.fatherStatus || "verified");
    setFatherRemarks(existing?.fatherRemarks || "");
    setMotherStatus(existing?.motherStatus || "verified");
    setMotherRemarks(existing?.motherRemarks || "");
    setEvidenceStatus(existing?.evidenceStatus || "verified");
    setEvidenceRemarks(existing?.evidenceRemarks || "");
  };

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.verification_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.father_name && n.father_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.mother_name && n.mother_name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "pending") {
      return n.status.toLowerCase().includes("pending") || n.status.toLowerCase().includes("submit");
    }
    if (statusFilter === "verified") {
      return n.status.toLowerCase().includes("verified") || n.status.toLowerCase().includes("approved");
    }
    if (statusFilter === "correction") {
      return n.status.toLowerCase().includes("correction") || n.status.toLowerCase().includes("returned");
    }
    return true;
  });

  const handleEndorseClick = () => {
    if (!selectedNotice) return;
    const isFather = selectedNotice.linkage_selection === "father" || selectedNotice.linkage_selection === "both";
    const isMother = selectedNotice.linkage_selection === "mother" || selectedNotice.linkage_selection === "both";

    if (isFather && fatherStatus !== "verified") {
      toast.error("Biological Father relationship must be marked 'Verified' before signing declaration.");
      return;
    }
    if (isMother && motherStatus !== "verified") {
      toast.error("Biological Mother relationship must be marked 'Verified' before signing declaration.");
      return;
    }
    if (evidenceStatus !== "verified") {
      toast.error("Supporting documentary evidence must be marked 'Verified' before signing declaration.");
      return;
    }

    setEndorseConfirmOpen(true);
  };

  const handleConfirmEndorse = async () => {
    if (!selectedNotice) return;
    setSubmitting(true);
    try {
      const res = await memberLinkageVerificationService.submitMemberVerification(
        selectedNotice,
        activeMember,
        {
          fatherStatus,
          fatherRemarks,
          motherStatus,
          motherRemarks,
          evidenceStatus,
          evidenceRemarks,
          action: "verify_and_endorse",
        }
      );

      toast.success(res.message);
      setEndorseConfirmOpen(false);
      setSelectedNotice(null);
      loadNotices();
    } catch (err: any) {
      toast.error(err.message || "Failed to endorse verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!selectedNotice) return;
    const reasons = [fatherRemarks, motherRemarks, evidenceRemarks].filter(Boolean);
    if (reasons.length === 0) {
      toast.error("Please enter specific correction remarks explaining what the applicant must correct.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await memberLinkageVerificationService.submitMemberVerification(
        selectedNotice,
        activeMember,
        {
          fatherStatus,
          fatherRemarks,
          motherStatus,
          motherRemarks,
          evidenceStatus,
          evidenceRemarks,
          action: "request_correction",
        }
      );

      toast.success(res.message);
      setSelectedNotice(null);
      loadNotices();
    } catch (err: any) {
      toast.error(err.message || "Failed to return application.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFatherSelected =
    selectedNotice?.linkage_selection === "father" ||
    selectedNotice?.linkage_selection === "both" ||
    selectedNotice?.epic_parent_linkage.linkFather;

  const isMotherSelected =
    selectedNotice?.linkage_selection === "mother" ||
    selectedNotice?.linkage_selection === "both" ||
    selectedNotice?.epic_parent_linkage.linkMother;

  return (
    <div className="space-y-6">
      {/* Overview Guidance Card */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-emerald-50/80 p-4 sm:p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              🗳️
            </div>
            <div className="space-y-1 text-xs text-indigo-950">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-indigo-900">
                  EPIC Parent Linkage Verification Desk (বিবাহিতা কন্যার ভোটার সংযোগ প্রত্যয়ন)
                </h3>
                <Badge className="bg-indigo-600 text-white text-[10px]">
                  Ward {activeMember.wardNumber}
                </Badge>
              </div>
              <p className="leading-relaxed">
                Review applications submitted by married daughters residing in or originating from{" "}
                <strong>Ward {activeMember.wardNumber} (Gram Sansad {activeMember.sansadNo})</strong> seeking to link
                their electoral enrolment with their biological father and/or mother in{" "}
                <strong>89 - Ranaghat (S.C.) North East Assembly Constituency</strong>.
              </p>
              <p className="text-[11px] text-slate-600 italic">
                ⚖️ Note: This review is strictly for electoral voter enrolment purposes. Verify parentage independently;
                do not merge or confuse with caste certificates or succession inquiries.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={loadNotices}
            disabled={loading}
            className="text-xs bg-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by applicant, father, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="h-8 text-xs font-semibold"
          >
            All ({notices.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            className="h-8 text-xs font-semibold"
          >
            Pending Review
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "verified" ? "default" : "outline"}
            onClick={() => setStatusFilter("verified")}
            className="h-8 text-xs font-semibold"
          >
            Verified &amp; Endorsed
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "correction" ? "default" : "outline"}
            onClick={() => setStatusFilter("correction")}
            className="h-8 text-xs font-semibold"
          >
            Correction Required
          </Button>
        </div>
      </div>

      {/* List of Applications */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border text-sm text-muted-foreground">
          Loading assigned parent linkage applications...
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed text-sm text-muted-foreground space-y-2">
          <div className="text-3xl">📭</div>
          <p className="font-semibold text-slate-800">No applications matching current filter</p>
          <p className="text-xs text-slate-500">
            Applications submitted by married daughters in Ward {activeMember.wardNumber} ({activeMember.sansadNo}) will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotices.map((notice) => {
            const isVerified =
              notice.status.toLowerCase().includes("verified") ||
              notice.status.toLowerCase().includes("approved");
            const isCorrection =
              notice.status.toLowerCase().includes("correction") ||
              notice.status.toLowerCase().includes("returned");

            return (
              <Card
                key={notice.id}
                className="p-4 bg-white border border-border/80 shadow-xs hover:border-indigo-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-slate-300 text-slate-700 bg-slate-50"
                    >
                      {notice.verification_id}
                    </Badge>
                    <Badge
                      className={
                        isVerified
                          ? "bg-emerald-600 text-white text-[10px]"
                          : isCorrection
                          ? "bg-rose-600 text-white text-[10px]"
                          : "bg-amber-500 text-white text-[10px]"
                      }
                    >
                      {isVerified ? "Member Verified" : isCorrection ? "Correction Required" : "Pending Review"}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {notice.applicant_name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      W/O: {notice.husband_name || "—"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      📍 {notice.village}, Sansad {notice.sansad_no}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border text-xs space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-600">
                      Claimed Parental Linkage:
                    </div>
                    {notice.father_name && (
                      <div className="text-slate-800">
                        <span className="font-semibold">Father:</span> {notice.father_name}{" "}
                        {notice.father_epic && (
                          <span className="font-mono text-[11px] text-indigo-700">({notice.father_epic})</span>
                        )}
                      </div>
                    )}
                    {notice.mother_name && (
                      <div className="text-slate-800">
                        <span className="font-semibold">Mother:</span> {notice.mother_name}{" "}
                        {notice.mother_epic && (
                          <span className="font-mono text-[11px] text-indigo-700">({notice.mother_epic})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(notice.created_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleOpenReview(notice)}
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  >
                    <span>{isVerified ? "View Declaration" : "Review & Verify"}</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MEMBER REVIEW & VERIFICATION MODAL */}
      <Dialog open={Boolean(selectedNotice)} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedNotice && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600 text-white text-[10px] uppercase font-semibold">
                    Elected Member Verification
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    Ref: {selectedNotice.verification_id}
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900 pt-1">
                  EPIC Parent Linkage Scrutiny — Smt. {selectedNotice.applicant_name}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Review applicant details, voter IDs, and supporting evidence. Independently verify the biological
                  father and/or mother records before generating the formal Gram Sansad Member Declaration.
                </DialogDescription>
              </DialogHeader>

              {/* Visual Relationship Card Hierarchy */}
              <EpicParentLinkageVisualCard
                data={selectedNotice.epic_parent_linkage}
                showVerificationStamp={true}
              />

              {/* INDEPENDENT REVIEW SECTION */}
              <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/70 p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <span>📋</span>
                  <span>Independent Member Scrutiny Checklist (স্বতন্ত্র যাচাইকরণ)</span>
                </h4>

                {/* 1. Biological Father Verification (if selected) */}
                {isFatherSelected && (
                  <div className="p-3 bg-white rounded-xl border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">
                          1. Biological Father Linkage (পিতার সম্পর্ক যাচাই)
                        </h5>
                        <p className="text-[11px] text-muted-foreground">
                          Claimed: Shri {selectedNotice.father_name} · EPIC: {selectedNotice.father_epic || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFatherStatus("verified")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            fatherStatus === "verified"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-100 text-slate-700 border-border"
                          }`}
                        >
                          ✓ Verified
                        </button>
                        <button
                          type="button"
                          onClick={() => setFatherStatus("correction_required")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            fatherStatus === "correction_required"
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-slate-100 text-slate-700 border-border"
                          }`}
                        >
                          ⚠ Correction
                        </button>
                      </div>
                    </div>

                    {fatherStatus === "correction_required" && (
                      <Input
                        placeholder="Explain required correction for Father's details/spelling/EPIC..."
                        value={fatherRemarks}
                        onChange={(e) => setFatherRemarks(e.target.value)}
                        className="text-xs h-8 bg-rose-50/50 border-rose-200"
                      />
                    )}
                  </div>
                )}

                {/* 2. Biological Mother Verification (if selected) */}
                {isMotherSelected && (
                  <div className="p-3 bg-white rounded-xl border space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">
                          2. Biological Mother Linkage (মাতার সম্পর্ক যাচাই)
                        </h5>
                        <p className="text-[11px] text-muted-foreground">
                          Claimed: Smt. {selectedNotice.mother_name} · EPIC: {selectedNotice.mother_epic || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMotherStatus("verified")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            motherStatus === "verified"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-slate-100 text-slate-700 border-border"
                          }`}
                        >
                          ✓ Verified
                        </button>
                        <button
                          type="button"
                          onClick={() => setMotherStatus("correction_required")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            motherStatus === "correction_required"
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-slate-100 text-slate-700 border-border"
                          }`}
                        >
                          ⚠ Correction
                        </button>
                      </div>
                    </div>

                    {motherStatus === "correction_required" && (
                      <Input
                        placeholder="Explain required correction for Mother's details/spelling/EPIC..."
                        value={motherRemarks}
                        onChange={(e) => setMotherRemarks(e.target.value)}
                        className="text-xs h-8 bg-rose-50/50 border-rose-200"
                      />
                    )}
                  </div>
                )}

                {/* 3. Supporting Evidence Verification */}
                <div className="p-3 bg-white rounded-xl border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">
                        3. Supporting Documents &amp; Evidence (নথিপত্র নিরীক্ষা)
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedNotice.epic_parent_linkage.supportingDocs?.filter((d) => d.provided).length || 0}{" "}
                        document(s) submitted by applicant.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEvidenceStatus("verified")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          evidenceStatus === "verified"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-100 text-slate-700 border-border"
                        }`}
                      >
                        ✓ Verified
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceStatus("correction_required")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          evidenceStatus === "correction_required"
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-slate-100 text-slate-700 border-border"
                        }`}
                      >
                        ⚠ Correction
                      </button>
                    </div>
                  </div>

                  {evidenceStatus === "correction_required" && (
                    <Input
                      placeholder="Explain missing or illegible documents that applicant must provide..."
                      value={evidenceRemarks}
                      onChange={(e) => setEvidenceRemarks(e.target.value)}
                      className="text-xs h-8 bg-rose-50/50 border-rose-200"
                    />
                  )}
                </div>
              </div>

              {/* Applicant Declarations Summary */}
              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-indigo-600" />
                  <span>Applicant's Statutory Self-Declaration Record:</span>
                </div>
                {isFatherSelected && (
                  <p className="text-[11px] leading-relaxed">
                    • Father: "I declare that the person identified above as my biological father is my biological father."
                  </p>
                )}
                {isMotherSelected && (
                  <p className="text-[11px] leading-relaxed">
                    • Mother: "I declare that the person identified above as my biological mother is my biological mother."
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedNotice(null)}
                  disabled={submitting}
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={handleRequestCorrection}
                    disabled={submitting}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold"
                  >
                    <span>Request Correction</span>
                  </Button>

                  <Button
                    onClick={handleEndorseClick}
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Endorse &amp; Sign Declaration</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION & STATUTORY DECLARATION MODAL */}
      <Dialog open={endorseConfirmOpen} onOpenChange={setEndorseConfirmOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-base font-bold text-slate-900">
              Execute Gram Sansad Member Statutory Declaration
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              Confirm your formal verification and endorsement under electoral enrolment guidelines.
            </DialogDescription>
          </DialogHeader>

          {selectedNotice && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-300 text-emerald-950 space-y-2">
                <p className="font-bold text-[11px] uppercase tracking-wider text-emerald-900">
                  Statutory Declaration Text to be Signed:
                </p>
                <p className="italic leading-relaxed bg-white/90 p-3 rounded-xl border border-emerald-200 text-slate-800">
                  "I, {activeMember.name}, {activeMember.designation} of Ward {activeMember.wardNumber} (Gram Sansad {activeMember.sansadNo}), Bagula II Gram Panchayat, Nadia, hereby certify that I have examined the submitted electoral particulars, physical/digital records, and supporting documentary evidence for Smt. {selectedNotice.applicant_name}, married daughter and resident of {selectedNotice.village}. I hereby confirm and formally verify the claimed parent-child linkage with her biological parent(s) for the statutory purpose of Electoral Roll (EPIC) voter enrolment under 89 - Ranaghat (S.C.) North East Assembly Constituency."
                </p>
              </div>

              <div className="rounded-xl border p-3 bg-slate-50 space-y-1 text-slate-700 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Authorized Representative:</span>
                  <span className="font-bold">{activeMember.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation &amp; Ward:</span>
                  <span>{activeMember.designation} (Ward {activeMember.wardNumber}, Sansad {activeMember.sansadNo})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Digital Signature Authority:</span>
                  <span className="font-mono text-emerald-700 font-semibold">AUTHENTICATED-MEMBER-SESSION</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setEndorseConfirmOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmEndorse}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {submitting ? "Signing & Issuing..." : "Confirm & Sign Declaration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
