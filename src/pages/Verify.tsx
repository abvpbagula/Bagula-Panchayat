import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  ExternalLink,
  Building2,
  FileCheck2,
  RotateCcw,
  AlertCircle,
  FileText,
  UserCheck,
  Landmark,
  ArrowRight,
  ArrowLeft,
  Download,
  Calendar,
  Layers,
  MapPin,
  HelpCircle,
} from "lucide-react";
import {
  executePublicVerification,
  executePublicTracking,
  maskName,
  type VerificationResult,
  type ApplicationTrackingResult,
} from "@/lib/publicVerification";
import { GP_DEPARTMENTS } from "@/services/noticeService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type FoundStatus = "Approved" | "Pending Signature & Memo Registration" | "Rejected" | string;

const VERIFICATION_NOTICE = `This online verification confirms that an authentic administrative record exists in the Digital Administrative Register (DAR) of Bagula II Gram Panchayat, Nadia.

It confirms only the existence, registration date, and official issuance status of the certificate and shall not be interpreted as a judicial determination of ownership, title, succession, or disputed entitlement.`;

const STATUTORY_NONE = `No matching digital administrative record was found based on the information provided. If you possess a document bearing physical signatures or official rubber stamps but no corresponding digital administrative record is available, the document may not have completed the prescribed digital registration process, may relate to legacy manual records (pre-2016), or may require physical volume register verification at the Gram Panchayat office.`;

function fmtDateTime(iso: string | undefined) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ---------- Detail rendering for Verification ----------
type Row = { k: string; v: string | React.ReactNode | null | undefined };

function Section({ title, rows }: { title: string; rows: Row[] }) {
  const shown = rows.filter((r) => r.v !== null && r.v !== undefined && String(r.v).trim() !== "");
  if (shown.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
        <span>{title}</span>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white/90 divide-y divide-slate-100 text-xs sm:text-sm shadow-2xs">
        {shown.map((r, i) => (
          <div key={i} className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] gap-3 px-3.5 py-2">
            <div className="text-slate-500 font-medium">{r.k}</div>
            <div className="text-slate-900 font-semibold break-words">{r.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WarishDetails({ data, dec }: { data: any; dec: string | null }) {
  const heirs: any[] = Array.isArray(data?.heirs) ? data.heirs : [];
  return (
    <>
      <Section
        title="👤 Public Verification Summary (জনসাধারণ যাচাই সারসংক্ষেপ)"
        rows={[
          { k: "Applicant Identity", v: maskName(data?.applicantName) },
          {
            k: "Relationship",
            v: data?.applicantRelation === "Other" ? data?.applicantRelOther : data?.applicantRelation,
          },
          { k: "Jurisdiction Village", v: data?.village || "Bagula II GP Area" },
          { k: "Post Office", v: data?.postOffice || "Bagula" },
          { k: "Police Station", v: "Hanskhali" },
          { k: "Deceased Person", v: maskName(dec ?? data?.deceasedName) },
          {
            k: "Legal Heirs Recorded",
            v: `${heirs.length} ${heirs.length === 1 ? "Heir" : "Heirs"} (Certified in Official Register)`,
          },
        ]}
      />
      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Privacy Safeguard (DPDP Act 2023):</strong> In compliance with the Digital Personal Data Protection
          Act 2023, full names of successors, Aadhaar numbers, phone numbers, and genealogical lineage records are
          withheld from public lookup to prevent identity theft.
        </span>
      </div>
    </>
  );
}

function DependentDetails({ data }: { data: any }) {
  const deps: any[] = Array.isArray(data?.dependents) ? data.dependents : [];
  const village = data?.village === "Other" ? data?.villageManual : data?.village;
  const po = data?.po === "Other" ? data?.poManual : data?.po;
  const dept = data?.dept === "Other" ? data?.deptManual : data?.dept;
  const empFull = [data?.appTitle, data?.appName].filter(Boolean).join(" ");
  return (
    <>
      <Section
        title="💼 Public Verification Summary (কর্মচারী ও পোষ্য যাচাই)"
        rows={[
          { k: "Certified Employee", v: maskName(empFull) },
          { k: "Department / Employer", v: dept || "Government / PSU / Private Service" },
          { k: "Jurisdiction Village", v: village || "Bagula II GP Area" },
          { k: "Post Office", v: po || "Bagula" },
          {
            k: "Dependents Certified",
            v: `${deps.length} ${deps.length === 1 ? "Eligible Dependent" : "Eligible Dependents"} (Registered)`,
          },
        ]}
      />
      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Privacy Safeguard (DPDP Act 2023):</strong> In compliance with the Digital Personal Data Protection
          Act 2023, employee ID numbers, dependent dates of birth, salary details, and identity documents are withheld
          from public search results.
        </span>
      </div>
    </>
  );
}

function LinkageDetails({ data, applicantName }: { data: any; applicantName?: string | null }) {
  const records: any[] = Array.isArray(data?.parentElectoralRecords) ? data.parentElectoralRecords : [];
  const constituency = data?.assemblyConstituency || data?.targetAssemblyConstituency || "91 - Ranaghat Uttar Purba (SC)";
  const purpose = data?.purpose || "Election enrolment & parental linkage verification";
  return (
    <>
      <Section
        title="🏛️ Election Enrolment Particulars (নির্বাচনী সংযোগ তথ্য)"
        rows={[
          { k: "Applicant Identity", v: maskName(applicantName || data?.applicantName) },
          { k: "Assembly Constituency", v: constituency },
          { k: "Enrolment Purpose", v: purpose },
          { k: "Electoral Records Verified", v: `${records.length} Ancestor / Parental Record(s) Linked` },
        ]}
      />
      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <span>
          <strong>Privacy Safeguard (DPDP Act 2023):</strong> Voter EPIC numbers, electoral part/serial references, and
          private mobile contacts are shielded from unauthorized harvesting.
        </span>
      </div>
    </>
  );
}

interface VerifyProps {
  defaultTab?: "verify" | "track";
}

export default function Verify({ defaultTab }: VerifyProps) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State: verify or track
  const urlTab = params.get("tab");
  const isTrackRoute = location.pathname.startsWith("/track");
  const initialTab = (urlTab === "track" || isTrackRoute || defaultTab === "track") ? "track" : "verify";
  const [activeTab, setActiveTab] = useState<"verify" | "track">(initialTab);

  // Inputs: single unified query for Verification or Tracking
  const initialQuery = params.get("search") || params.get("id") || params.get("ref") || params.get("memo") || "";
  const [vidInput, setVidInput] = useState(initialQuery);
  const [trackRefInput, setTrackRefInput] = useState(initialQuery);

  // Results
  const [verifyResult, setVerifyResult] = useState<VerificationResult>({ status: "idle" });
  const [trackResult, setTrackResult] = useState<ApplicationTrackingResult | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Robust Go Back Handler
  const handleGoBack = () => {
    try {
      const raw = sessionStorage.getItem("bgl2_internal_nav_history");
      if (raw) {
        const stack: string[] = JSON.parse(raw);
        for (let i = stack.length - 1; i >= 0; i--) {
          const p = stack[i];
          const base = p.split("?")[0];
          if (base !== "/verify" && base !== "/track" && base !== "/track-status") {
            navigate(p);
            return;
          }
        }
      }
    } catch {
      // ignore
    }

    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Synchronize URL parameters with tab change
  const handleTabChange = (tab: "verify" | "track") => {
    setActiveTab(tab);
    setParams((prev) => {
      const n = new URLSearchParams(prev);
      n.set("tab", tab);
      return n;
    });
  };

  // Run Verification
  const runVerification = useCallback(
    async (customQuery?: string) => {
      const id = (customQuery !== undefined ? customQuery : vidInput ?? "").trim();
      if (!id) return;
      setVerifyResult({ status: "loading" });
      try {
        const res = await executePublicVerification(id);
        setVerifyResult(res);
      } catch {
        setVerifyResult({ status: "not_found" });
      }
    },
    [vidInput]
  );

  // Run Application Tracking
  const runTracking = useCallback(
    async (customRef?: string) => {
      const ref = (customRef !== undefined ? customRef : trackRefInput ?? "").trim();
      if (!ref) {
        toast.error("Please enter a valid Application Reference ID");
        return;
      }
      setTrackLoading(true);
      try {
        const res = await executePublicTracking(ref);
        setTrackResult(res);
      } catch {
        toast.error("Failed to query application status. Please try again.");
      } finally {
        setTrackLoading(false);
      }
    },
    [trackRefInput]
  );

  // Trigger auto-search on mount if query params exist
  useEffect(() => {
    if (initialQuery) {
      if (initialTab === "track") {
        setTrackRefInput(initialQuery);
        runTracking(initialQuery);
      } else {
        setVidInput(initialQuery);
        runVerification(initialQuery);
      }
    }
  }, [initialQuery, initialTab, runVerification, runTracking]);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col">
      <Helmet>
        <title>
          {activeTab === "track"
            ? "Track Application Status — Bagula 2 No Gram Panchayat"
            : "Verify Certificate Authenticity — Bagula 2 No Gram Panchayat"}
        </title>
        <meta
          name="description"
          content="Official verification and tracking portal of Bagula II Gram Panchayat, Hanskhali, Nadia. Validate certificate genuineness or track pending Warish and Dependent applications."
        />
        <link rel="canonical" href="https://bagula2gp.lovable.app/verify" />
      </Helmet>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-10 space-y-6">
        {/* Navigation & Official Header */}
        <div className="no-print space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-100 shadow-2xs text-xs sm:text-sm font-bold transition-all group cursor-pointer"
              aria-label="Go Back to Previous Page"
            >
              <ArrowLeft size={16} className="text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Go Back (ফিরে যান)</span>
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 transition-colors"
            >
              <Landmark size={14} />
              <span>Gram Panchayat Home</span>
            </Link>
          </div>

          {/* Department Banner & Title */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 border border-blue-900 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                  <Landmark size={15} />
                  <span>Bagula II Gram Panchayat · Nadia, WB</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Verify &amp; Track Portal (যাচাই ও ট্র্যাকিং পোর্টাল)
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Decentralized Public Verification Registry under Section 12/17 RBD Act &amp; West Bengal Panchayat Act 1973.
                  Check issued certificate genuineness or track real-time application processing milestones.
                </p>
              </div>

              {/* Verified Security Badge */}
              <div className="shrink-0 bg-white/10 rounded-2xl p-3 border border-white/15 text-center hidden md:block">
                <ShieldCheck size={28} className="text-emerald-400 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-white block">DPDP 2023 Guard</span>
                <span className="text-[10px] text-slate-300">Privacy Safeguarded</span>
              </div>
            </div>

            {/* TAB SELECTOR: STRICT DUAL ARCHITECTURE */}
            <div className="mt-6 pt-5 border-t border-white/15 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleTabChange("verify")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "verify"
                    ? "bg-white text-blue-950 shadow-md scale-[1.02]"
                    : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                }`}
              >
                <FileCheck2 size={16} className={activeTab === "verify" ? "text-emerald-600" : "text-amber-300"} />
                <span>Verify Issued Certificate (শংসাপত্র যাচাই)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("track")}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === "track"
                    ? "bg-white text-blue-950 shadow-md scale-[1.02]"
                    : "bg-white/10 text-white/90 hover:bg-white/20 hover:text-white"
                }`}
              >
                <Clock size={16} className={activeTab === "track" ? "text-blue-600" : "text-amber-300"} />
                <span>Track Application Status (আবেদনের অগ্রগতি)</span>
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: VERIFY ISSUED CERTIFICATE (AUTHENTICITY REGISTRY)           */}
        {/* =================================================================== */}
        {activeTab === "verify" && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Department Info */}
            <div className="no-print flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-slate-600 font-semibold flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Public Certificate Authenticity Verification (Section 12/17 RBD Act)</span>
              </div>

              {/* Official Issuing Department Callout */}
              <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-700" />
                <span>Dept: {GP_DEPARTMENTS.warish_succession.name}</span>
              </div>
            </div>

            {/* Input Card */}
            <div className="no-print bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runVerification();
                }}
                className="space-y-3"
              >
                <label htmlFor="verify-vid-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Enter Certificate Verification ID, Memo Number, or QR String
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="verify-vid-input"
                      aria-label="Verification ID or Memo Number"
                      value={vidInput}
                      onChange={(e) => setVidInput(e.target.value)}
                      placeholder="e.g. BGL2-WAR-2026-0001, 142/BGL-II/WAR/2026, or BGL2-DEP-2026-0001"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-mono uppercase text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-7 rounded-xl font-bold bg-blue-950 hover:bg-blue-900 text-white text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 shrink-0"
                  >
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Verify Authenticity</span>
                  </Button>
                </div>

                {/* Quick Test Samples */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Quick Test Samples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVidInput("BGL2-WAR-2026-0001");
                      runVerification("BGL2-WAR-2026-0001");
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-mono"
                  >
                    BGL2-WAR-2026-0001 (Warish)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVidInput("BGL2-DEP-2026-0001");
                      runVerification("BGL2-DEP-2026-0001");
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-mono"
                  >
                    BGL2-DEP-2026-0001 (Dependent)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVidInput("142/BGL-II/WAR/2026");
                      runVerification("142/BGL-II/WAR/2026");
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-mono"
                  >
                    142/BGL-II/WAR/2026 (Memo No)
                  </button>
                </div>
              </form>
            </div>

            {/* VERIFICATION RESULTS DISPLAY */}
            <div className="space-y-4">
              {verifyResult.status === "loading" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-950 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-bold text-slate-900">
                    Verifying certificate in Bagula II Digital Register...
                  </p>
                  <p className="text-xs text-slate-500">Checking cryptographic integrity and Pradhan digital record.</p>
                </div>
              )}

              {verifyResult.status === "rate_limited" && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-amber-900 space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-700" />
                    <span>Too Many Verification Requests</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    To prevent automated data harvesting under the DPDP Act 2023, public verification queries are rate limited.
                    Please wait 2 minutes and retry.
                  </p>
                </div>
              )}

              {verifyResult.status === "inconsistent" && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-900 space-y-2">
                  <div className="font-bold flex items-center gap-2">
                    <AlertCircle size={18} className="text-rose-700" />
                    <span>Administrative Register Inconsistency Detected</span>
                  </div>
                  <p className="text-xs text-rose-800">
                    A record was found, but internal memo registration hash does not match. Please contact Bagula II Gram
                    Panchayat office with the physical document for manual ledger scrutiny.
                  </p>
                </div>
              )}

              {verifyResult.status === "not_found" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                    <AlertCircle size={20} />
                    <span>No Matching Certificate Record Found (কোনো রেকর্ড পাওয়া যায়নি)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{STATUTORY_NONE}</p>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleTabChange("track")}
                      className="rounded-xl font-bold text-xs"
                    >
                      <Clock size={14} className="mr-1.5" />
                      <span>Check Application Tracking Instead</span>
                    </Button>
                    <Link
                      to="/birth-digitization-form"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
                    >
                      <span>Pre-2016 Legacy Digitization Portal →</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* SUCCESSFUL VERIFICATION */}
              {verifyResult.status === "found" && (
                <div className="bg-white rounded-3xl border-2 border-emerald-500/60 p-6 sm:p-8 shadow-sm space-y-5 print:border-none print:shadow-none print:p-0">
                  {/* Verified Header Header with Government Watermark Aesthetic */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold">
                        <CheckCircle2 size={14} className="text-emerald-700" />
                        <span>OFFICIALLY VERIFIED &amp; RECORDED · বৈধ শংসাপত্র ✓</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                        {verifyResult.certificate_type || "Administrative Certificate"}
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">
                        Verification Reference: {verifyResult.verification_id}
                      </p>
                    </div>

                    <div className="no-print flex items-center gap-2">
                      <Button
                        type="button"
                        onClick={handlePrintSlip}
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-bold text-xs gap-1.5 border-slate-300 hover:bg-slate-50"
                      >
                        <Printer size={14} />
                        <span>Print Verification Slip</span>
                      </Button>
                    </div>
                  </div>

                  {/* Administrative Record Details Table */}
                  <div>
                    <Section
                      title="📋 Official Administrative Issuance Record (দাপ্তরিক মেমো তথ্য)"
                      rows={[
                        {
                          k: "Unique Verification ID",
                          v: <span className="font-mono text-blue-900 font-bold">{verifyResult.verification_id}</span>,
                        },
                        { k: "Certificate Category", v: verifyResult.certificate_type },
                        {
                          k: "Statutory Memo Number",
                          v: <span className="font-mono">{verifyResult.memo_no || "Issued under DAR Reference"}</span>,
                        },
                        { k: "Original Issue Date", v: verifyResult.issue_date },
                        ...(verifyResult.valid_until ? [{ k: "Validity / Expiry", v: verifyResult.valid_until }] : []),
                        {
                          k: "Current Status",
                          v: (
                            <Badge className="bg-emerald-600 text-white font-bold text-xs">
                              {verifyResult.record_status || "Approved & Active"}
                            </Badge>
                          ),
                        },
                        {
                          k: "Issuing Authority",
                          v: verifyResult.issued_by || "Prodhan, Bagula II Gram Panchayat",
                        },
                        {
                          k: "Department Desk",
                          v: verifyResult.issuing_department || GP_DEPARTMENTS.warish_succession.name,
                        },
                        { k: "Verification Timestamp", v: fmtDateTime(verifyResult.server_time) },
                      ]}
                    />
                  </div>

                  {/* Specific certificate payload details */}
                  {verifyResult.kind === "warish" && verifyResult.record_data && (
                    <WarishDetails data={verifyResult.record_data} dec={verifyResult.deceased_name} />
                  )}
                  {verifyResult.kind === "dependent" && verifyResult.record_data && (
                    <DependentDetails data={verifyResult.record_data} />
                  )}
                  {verifyResult.kind === "linkage" && verifyResult.record_data && (
                    <LinkageDetails data={verifyResult.record_data} applicantName={verifyResult.applicant_name} />
                  )}

                  {/* Statutory Legal Disclaimer Notice */}
                  <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed whitespace-pre-line">
                    <p>
                      <strong>Official Notice:</strong> {VERIFICATION_NOTICE}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: TRACK APPLICATION STATUS (LIFECYCLE MILESTONE STEPPER)       */}
        {/* =================================================================== */}
        {activeTab === "track" && (
          <div className="space-y-6 animate-fade-in">
            {/* Tracking Input Card */}
            <div className="no-print bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runTracking();
                }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label htmlFor="track-ref-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Enter Application Acknowledgment or Reference Number
                  </label>
                  <span className="text-[11px] text-blue-700 font-semibold">
                    Live Status Ledger (আবেদন ট্র্যাকিং)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="track-ref-input"
                      value={trackRefInput}
                      onChange={(e) => setTrackRefInput(e.target.value)}
                      placeholder="e.g. BGL2-WAR-2026-0914 or BGL2-DEP-2026-0312"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl font-mono uppercase text-xs sm:text-sm text-slate-900 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 px-7 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 shrink-0"
                  >
                    <Clock size={16} className="text-amber-300" />
                    <span>Track Status</span>
                  </Button>
                </div>

                {/* Quick Reference Test Samples */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Quick Test Samples:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackRefInput("BGL2-WAR-2026-0914");
                      runTracking("BGL2-WAR-2026-0914");
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-mono"
                  >
                    BGL2-WAR-2026-0914 (Pending Ward Inquiry)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackRefInput("BGL2-DEP-2026-0312");
                      runTracking("BGL2-DEP-2026-0312");
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-mono"
                  >
                    BGL2-DEP-2026-0312 (Approved &amp; Ready)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTrackRefInput("BGL2-LIN-2026-0105");
                      runTracking("BGL2-LIN-2026-0105");
                    }}
                    className="text-blue-700 hover:text-blue-900 underline font-mono"
                  >
                    BGL2-LIN-2026-0105 (Under Scrutiny)
                  </button>
                </div>
              </form>
            </div>

            {/* TRACKING RESULTS VIEW */}
            {trackLoading && (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-slate-900">
                  Querying Bagula II Gram Panchayat application ledger...
                </p>
                <p className="text-xs text-slate-500">Checking ward member verification logs and departmental desk status.</p>
              </div>
            )}

            {!trackLoading && trackResult && trackResult.status === "found" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                {/* Header Information Card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                        Ref ID: {trackResult.reference_id}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="text-xs text-blue-900 font-semibold">
                        Submitted: {trackResult.submission_date}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {trackResult.service_type}
                    </h3>
                    <p className="text-xs font-semibold text-blue-800">
                      {trackResult.service_name_bn}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0 space-y-1">
                    <Badge
                      className={`text-xs px-3 py-1 font-bold ${
                        trackResult.status_tone === "emerald"
                          ? "bg-emerald-600 text-white"
                          : trackResult.status_tone === "amber"
                          ? "bg-amber-500 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {trackResult.status_badge}
                    </Badge>
                    <p className="text-[11px] text-slate-500">
                      Last Updated: {trackResult.last_updated}
                    </p>
                  </div>
                </div>

                {/* Applicant & Administrative Metadata Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicant</span>
                    <p className="font-bold text-slate-800 mt-0.5">{trackResult.applicant_name_masked}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Stage</span>
                    <p className="font-bold text-slate-800 mt-0.5">{trackResult.current_stage_label}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Desk</span>
                    <p className="font-bold text-slate-800 mt-0.5">{trackResult.assigned_desk}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Statutory Clock</span>
                    <p className="font-bold text-slate-800 mt-0.5">
                      Day {trackResult.statutory_day_current} of {trackResult.statutory_days_total}
                    </p>
                  </div>
                </div>

                {/* Statutory Progress Countdown Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-700" />
                      <span>Statutory Turnaround Timeline (পশ্চিমবঙ্গ পঞ্চায়েত আইন সময়সীমা)</span>
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {trackResult.statutory_days_total - trackResult.statutory_day_current} working days remaining
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        trackResult.is_approved
                          ? "bg-emerald-600 w-full"
                          : "bg-blue-600"
                      }`}
                      style={{
                        width: trackResult.is_approved
                          ? "100%"
                          : `${Math.min(
                              100,
                              Math.round((trackResult.statutory_day_current / trackResult.statutory_days_total) * 100)
                            )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 5-STAGE VISUAL LIFECYCLE STEPPER */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-700" />
                    <span>Application Processing Lifecycle (পর্যায়ক্রমিক অগ্রগতি)</span>
                  </h4>

                  <div className="space-y-3 pt-1">
                    {trackResult.milestones.map((m) => {
                      const isCompleted = m.status === "completed";
                      const isCurrent = m.status === "current";
                      return (
                        <div
                          key={m.step}
                          className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                            isCompleted
                              ? "bg-emerald-50/50 border-emerald-200 text-slate-800"
                              : isCurrent
                              ? "bg-amber-50/80 border-amber-300 shadow-xs"
                              : "bg-slate-50/50 border-slate-200/60 opacity-60 text-slate-500"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs mt-0.5 ${
                              isCompleted
                                ? "bg-emerald-600 text-white"
                                : isCurrent
                                ? "bg-amber-500 text-white animate-pulse"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 size={16} /> : m.step}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-slate-900">
                                  {m.label} <span className="font-normal text-xs text-slate-600">({m.labelBn})</span>
                                </p>
                              </div>
                              {m.timestamp && (
                                <span className="text-[11px] font-mono text-slate-500">{m.timestamp}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{m.desc}</p>
                            {m.actor && (
                              <p className="text-[10px] font-semibold text-blue-900 mt-1">
                                Designated Officer: {m.actor}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Note Callout */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <UserCheck size={14} className="text-blue-700" />
                    <span>Official Desk Directive (বর্তমান করণীয়)</span>
                  </p>
                  <p className="leading-relaxed text-blue-900">{trackResult.action_note}</p>
                </div>

                {/* Completion Action */}
                {trackResult.is_approved && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={() => toast.success("Downloading approved official certificate...")}
                      className="h-11 px-6 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2 shadow-xs"
                    >
                      <Download size={15} />
                      <span>Download Approved Certificate (PDF)</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange("verify");
                        setVidInput(trackResult.reference_id);
                        runVerification(trackResult.reference_id);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Verify Official Seal &amp; QR →</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {!trackLoading && trackResult && trackResult.status === "not_found" && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
                  <AlertCircle size={20} className="text-slate-500" />
                  <span>No Application Found with Reference "{trackResult.reference_id}"</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please verify your acknowledgment receipt slip or SMS. References are formatted like{" "}
                  <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-900">BGL2-WAR-2026-XXXX</code> or{" "}
                  <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-900">BGL2-DEP-2026-XXXX</code>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Centralized Helpdesk & Privacy Safeguard Footer */}
        <div className="no-print bg-slate-100 rounded-3xl border border-slate-200/90 p-5 sm:p-6 text-xs text-slate-600 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building2 size={14} className="text-blue-900" />
              <span>Bagula II Gram Panchayat Statutory Service Counters</span>
            </span>
            <span className="text-[11px] text-slate-500">Hanskhali Block · Working Days: 10:00 AM – 5:00 PM</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
            <div>
              <span className="font-bold text-slate-700 block">Counter #1 (Warish &amp; Mutation)</span>
              <p className="text-slate-500">Succession certificates &amp; legal heir inquiry verification.</p>
            </div>
            <div>
              <span className="font-bold text-slate-700 block">Counter #2 (Civil Registration)</span>
              <p className="text-slate-500">Birth, death &amp; family dependency attestation desk.</p>
            </div>
            <div>
              <span className="font-bold text-slate-700 block">DPDP Privacy Compliance</span>
              <p className="text-slate-500">Zero unauthenticated disclosure of personal citizen identifiers.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
