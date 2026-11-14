import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ExternalLink,
  ChevronRight,
  Search,
  HelpCircle,
  Building,
  UserCheck,
  ShieldCheck,
  Calendar,
  Layers,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
  RotateCcw,
  FileCheck2,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface Props {
  onOpenRedirect?: (guideKey: string) => void;
}

export function CitizenSopAndHelpCenter({ onOpenRedirect }: Props) {
  const navigate = useNavigate();
  const [activeSopTab, setActiveSopTab] = useState<
    "warish" | "dependent" | "linkage" | "delayed" | "digitization" | "property_tax"
  >("warish");

  // Gateway search state for centralized Verify & Track Desk
  const [gatewayRef, setGatewayRef] = useState("");
  const [gatewayMode, setGatewayMode] = useState<"track" | "verify">("track");

  const handleGatewaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = gatewayRef.trim();
    if (gatewayMode === "track") {
      if (clean) {
        navigate(`/track?tab=track&search=${encodeURIComponent(clean)}`);
      } else {
        navigate("/track");
      }
    } else {
      if (clean) {
        navigate(`/verify?tab=verify&search=${encodeURIComponent(clean)}`);
      } else {
        navigate("/verify");
      }
    }
  };

  return (
    <div className="space-y-8" id="citizen-sop-desk">
      {/* =================================================================== */}
      {/* SECTION 1: CITIZEN CLARITY BANNER (WHAT IS FOR CITIZEN?)            */}
      {/* =================================================================== */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
            নাগরিক পরিষেবা ও এসওপি গাইড · Cyber Cafe Gateway &amp; Official SOP
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            সাইবার ক্যাফে ও পঞ্চায়েতে কী কী পরিষেবা আছে? <br className="hidden sm:inline" />
            <span className="text-blue-300 font-medium text-lg sm:text-2xl">
              (Available services at Bagula II Gram Panchayat)
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed max-w-2xl">
            Prepare Warish (legal heir) certificates, family dependency proofs, delayed civil registration, download official A4 forms, and track application progress through the 45-day statutory Sansad verification clock.
          </p>

          {/* Quick Access Anchor Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/cyber-cafe"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all min-h-[44px]"
            >
              <span>Open Cyber Cafe Hub</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#sop-guidelines"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 transition-all"
            >
              <span>📜 View Service SOPs &amp; Documents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="#track-status-section"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/25 transition-all"
            >
              <span>🔍 Track Application Status</span>
            </a>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 2: 3 PILLARS OF CITIZEN ASSISTANCE                           */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Online Applications */}
        <div className="p-5 rounded-3xl bg-white border border-border/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-blue-100">
              📝
            </div>
            <h3 className="font-bold text-base text-foreground">
              অনলাইন আবেদন ও সনদ
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Warish Certificate, Dependent Certificate, and Delayed Registration applications can be submitted online with zero hassle.
            </p>
          </div>
          <Link
            to="/cyber-cafe"
            className="pt-3 border-t border-border/50 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-between"
          >
            <span>Open Cyber Cafe Desk</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Pillar 2: SOP & Document Checklists */}
        <div className="p-5 rounded-3xl bg-white border border-border/80 shadow-xs hover:border-amber-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-100">
              📋
            </div>
            <h3 className="font-bold text-base text-foreground">
              প্রয়োজনীয় নথি ও এসওপি
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete step-by-step checklists for deceased land succession, five-witness affidavits, Form-10, and Daima certificates.
            </p>
          </div>
          <a
            href="#sop-guidelines"
            className="pt-3 border-t border-border/50 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center justify-between"
          >
            <span>Read SOP Checklists Below</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Pillar 3: 45-Day Verification Transparency */}
        <div className="p-5 rounded-3xl bg-white border border-border/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
              🏛️
            </div>
            <h3 className="font-bold text-base text-foreground">
              ৩০ জন নির্বাচিত প্রতিনিধি ও স্বচ্ছতা
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Warish inquiry is conducted by your elected Sansad member with a statutory 45-day review clock, preventing fraud and unauthorized signatures.
            </p>
          </div>
          <Link
            to="/elected-representatives"
            className="pt-3 border-t border-border/50 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-between"
          >
            <span>View 30 Elected Members</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECTION 3: STEP-BY-STEP SOP HUB (STANDARD OPERATING PROCEDURES)      */}
      {/* =================================================================== */}
      <section id="sop-guidelines" className="bg-white rounded-3xl border border-border/80 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Standard Operating Procedures (SOP) ও নথি সহায়িকা
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official application procedures, eligibility, required documents, and turnaround times under West Bengal Panchayat Rules.
            </p>
          </div>
          <Badge variant="outline" className="text-xs px-3 py-1 font-semibold text-blue-900 border-blue-200 bg-blue-50/50 w-fit">
            Statutory SOP Guidelines
          </Badge>
        </div>

        {/* Level 2 Sub-Section Tabs (Progressive Disclosure) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "warish", label: "Warish (Legal Heir)", icon: "📜", badge: "Most Requested" },
            { id: "dependent", label: "Dependent Certificate", icon: "👤", badge: "Rail/Defense" },
            { id: "linkage", label: "Linkage Certificate", icon: "🔗", badge: "ECI / 89 AC" },
            { id: "delayed", label: "Delayed Birth/Death (Sec 13)", icon: "👶", badge: "Court Order" },
            { id: "digitization", label: "Legacy Birth Digitization", icon: "💾", badge: "Pre-2020" },
            { id: "property_tax", label: "Panchayat Property Tax", icon: "🏠", badge: "PRD Portal" },
          ].map((tab) => {
            const isActive = activeSopTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSopTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-2xl font-bold shrink-0 transition-all text-xs flex items-center gap-2 border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Warish Certificate SOP */}
        {activeSopTab === "warish" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-amber-950">
                  ওয়ারিশান শংসাপত্র (উত্তরাধিকার সনদ) — Warish Certificate SOP
                </h4>
                <Badge className="bg-amber-600 text-white text-[10px]">7 - 10 Working Days</Badge>
              </div>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                Issued under West Bengal Panchayat Act 1973. Required for legal heir land mutation at BL&amp;LRO, bank account settlement, insurance claims, and family property succession.
              </p>
            </div>

            {/* Department of this GP & Issuing Authority */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-700" />
                  <span>Gram Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                </span>
                <p className="font-bold text-sm text-amber-950">
                  Succession, Legal Heir &amp; Citizen Welfare Department
                </p>
                <p className="font-bengali text-xs text-amber-900/80">
                  ওয়ারিশান, উত্তরাধিকার ও নাগরিক পরিষেবা শাখা · Counter #1 (Warish Desk)
                </p>
              </div>
              <div className="sm:text-right text-xs text-amber-900 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200">
                <span className="block font-bold">Issued by / Authority:</span>
                <span>Executive Assistant &amp; Prodhan, Bagula-II GP</span>
              </div>
            </div>

            {/* Step-by-step workflow */}
            <div className="space-y-3">
              <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                ধাপ ১ থেকে ৪: আবেদন থেকে সনদ প্রাপ্তির প্রক্রিয়া (Step-by-Step Procedure)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-border/80 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                  <p className="font-bold text-foreground">আবেদন দাখিল (Submission)</p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Submit online via Cyber Cafe Hub or fill the physical A4 application with legal heir list.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-border/80 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                  <p className="font-bold text-foreground">সদস্য অনুসন্ধান (Ward Inquiry)</p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Assigned to your elected Sansad member with an active 45-day verification period.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-border/80 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">3</span>
                  <p className="font-bold text-foreground">অফিস অনুমোদন (Office Approval)</p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Verified by Executive Assistant &amp; digitally signed by Prodhan of Bagula II Gram Panchayat.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-border/80 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">4</span>
                  <p className="font-bold text-foreground">ডাউনলোড ও প্রিন্ট (Download)</p>
                  <p className="text-muted-foreground text-[11px] leading-snug">
                    Instant download of digitally authenticated certificate containing secure verification QR.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Checklist */}
            <div className="space-y-3 pt-2">
              <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                প্রয়োজনীয় কাগজপত্রের তালিকা (Mandatory Checklist)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  "মৃত ব্যক্তির মূল ডেথ সার্টিফিকেট (Original Death Certificate of Deceased)",
                  "আবেদনকারী ও সমস্ত ওয়ারিশদের আধার কার্ড (Aadhaar cards of all legal heirs)",
                  "মৃত ব্যক্তির জমির খতিয়ান / দলিলের কপি (Land Parcha or Registered Deed)",
                  "পরিবারের ওয়ারিশ তালিকা সংক্রান্ত ঘোষণাপত্র (Self-declaration family tree)",
                  "রেশন কার্ড অথবা ভোটার আইডি কার্ড (Voter/Ration cards for age and relation)",
                  "স্থানীয় পঞ্চায়েত সদস্যের প্রাথমিক প্রত্যয়ন (Ward Member Endorsement)",
                ].map((doc, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50/80 border border-border/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 text-[11px] font-medium leading-relaxed">{doc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/apply/warish"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
              >
                <span>Apply via Cyber Cafe</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/warish-application-form"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download Printable A4 Form (আবেদনপত্র)</span>
              </Link>
              <Link
                to="/elected-representatives"
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs border border-amber-300 flex items-center gap-1.5"
              >
                <span>Find Your Ward Member (30 Sansads)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Tab 2: Family Dependent Certificate SOP */}
        {activeSopTab === "dependent" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-blue-950">
                  পারিবারিক নির্ভরশীলতা শংসাপত্র — Family Dependent Certificate SOP
                </h4>
                <Badge className="bg-blue-600 text-white text-[10px]">5 - 7 Working Days</Badge>
              </div>
              <p className="text-xs text-blue-950/80 leading-relaxed">
                Required for Indian Railways employee family pass, defense dependent welfare card, government medical reimbursement, and pension claim processing.
              </p>
            </div>

            {/* Department of this GP & Issuing Authority */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-700" />
                  <span>Gram Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                </span>
                <p className="font-bold text-sm text-blue-950">
                  Succession, Legal Heir &amp; Citizen Welfare Department
                </p>
                <p className="font-bengali text-xs text-blue-900/80">
                  ওয়ারিশান, উত্তরাধিকার ও নাগরিক পরিষেবা শাখা · Counter #1 (Welfare Desk)
                </p>
              </div>
              <div className="sm:text-right text-xs text-blue-900 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-200">
                <span className="block font-bold">Issued by / Authority:</span>
                <span>Prodhan (Executive Authority), Bagula-II GP</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <h5 className="font-bold text-foreground">কারা আবেদন করতে পারেন? (Eligibility)</h5>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Parents, spouse, unmarried daughters, and dependent minor children of government or private employees residing within Bagula II GP jurisdiction.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <h5 className="font-bold text-foreground">প্রয়োজনীয় নথিপত্র (Documents Checklist)</h5>
                <ul className="text-muted-foreground text-[11px] space-y-1 list-disc pl-4">
                  <li>Employee Identity Card &amp; Pay Slip</li>
                  <li>Aadhaar cards of applicant and dependent relatives</li>
                  <li>Residential proof in Bagula II Gram Panchayat</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/apply/dependent"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
              >
                <span>Apply via Cyber Cafe (Dependent Certificate)</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dependent-certificate"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2"
              >
                <span>View Full Dependency Workflow &amp; Rules</span>
              </Link>
            </div>
          </div>
        )}

        {/* Tab: Linkage Certificate (Electoral & Marital Linkage) SOP */}
        {activeSopTab === "linkage" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-blue-950">
                  ভোটার ও পারিবারিক সংযোগ শংসাপত্র (লিঙ্কেজ সনদ) — Linkage Certificate SOP
                </h4>
                <Badge className="bg-blue-600 text-white text-[10px]">89 Ranaghat (SC) AC</Badge>
              </div>
              <p className="text-xs text-blue-950/80 leading-relaxed">
                Standard Operating Procedure for issuance of Parental &amp; Electoral Linkage Certificate under Section 19 of West Bengal Panchayat Act, 1973. Specifically designed for married women shifting residence to marital homes or new electors linking ancestry for ECI Form 6 &amp; Form 8 applications.
              </p>
            </div>

            {/* Department & Issuing Authority */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-700" />
                  <span>Gram Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                </span>
                <p className="font-bold text-sm text-blue-950">
                  Civil Registration, Electoral Verification &amp; Public Linkage Desk
                </p>
                <p className="font-bengali text-xs text-blue-900/80">
                  নাগরিক পরিচয়, ভোটার যাচাই ও পারিবারিক সংযোগ শাখা · Counter #3 (Linkage Desk)
                </p>
              </div>
              <div className="sm:text-right text-xs text-blue-900 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-200">
                <span className="block font-bold">Issued by / Authority:</span>
                <span>Executive Assistant &amp; Prodhan (Dual Signatories), Bagula-II GP</span>
              </div>
            </div>

            {/* Eligibility & Documents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <h5 className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>কারা আবেদন করতে পারেন? (Eligibility)</span>
                </h5>
                <ul className="text-muted-foreground text-[11px] space-y-1.5 list-disc pl-4">
                  <li><strong>Married Daughters:</strong> Women born/raised in Bagula II GP who have married and shifted to another village, GP, or district and require voter roll transfer (ECI Form 8).</li>
                  <li><strong>New Electors:</strong> Citizens establishing voter linkage with their parents enrolled in 89 Ranaghat (S.C.) North East AC (ECI Form 6).</li>
                  <li><strong>Ancestral Residents:</strong> Individuals whose father and mother are enrolled in Draft Electoral Roll 2025 under Bagula II GP.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border space-y-2">
                <h5 className="font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>প্রয়োজনীয় ৬টি নথিপত্র (6 Mandatory Documents)</span>
                </h5>
                <ul className="text-muted-foreground text-[11px] space-y-1 list-disc pl-4">
                  <li><strong>1. Parents' Draft Voter List 2025:</strong> Extract showing Part No. &amp; Serial No. under 89 Ranaghat AC + EPIC cards.</li>
                  <li><strong>2. Daughter's Age Proof:</strong> Madhyamik Admit Card / Marksheet or Digital Birth Certificate.</li>
                  <li><strong>3. Proof of Marriage:</strong> Residential Certificate issued by husband's GP or Marriage Registration Certificate.</li>
                  <li><strong>4. GP Tax Receipt:</strong> Bagula II GP current property tax / holding clearance receipt of parents.</li>
                  <li><strong>5. Applicant's EPIC:</strong> Existing voter card photocopy (if already registered / shifting).</li>
                  <li><strong>6. Husband's ID Proof:</strong> Husband's Aadhaar or EPIC card copy.</li>
                </ul>
              </div>
            </div>

            {/* 4-Step Standard Timeline */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
              <h5 className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>Standard 4-Stage Issuance Workflow (৩ থেকে ৭ দিনের মধ্যে শংসাপত্র প্রদান)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-blue-200/60 shadow-2xs space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">1</span>
                  <p className="font-bold text-foreground text-[11px]">Roll 2025 Check</p>
                  <p className="text-[10px] text-muted-foreground">Match parents' Part &amp; Serial No. in 89 Ranaghat AC roll.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-200/60 shadow-2xs space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">2</span>
                  <p className="font-bold text-foreground text-[11px]">Husband GP Proof</p>
                  <p className="text-[10px] text-muted-foreground">Validate marital residence certificate from destination GP.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-200/60 shadow-2xs space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">3</span>
                  <p className="font-bold text-foreground text-[11px]">DEO / Cyber Cafe</p>
                  <p className="text-[10px] text-muted-foreground">Fill online form or print pre-formatted proforma sheet.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-blue-200/60 shadow-2xs space-y-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center">4</span>
                  <p className="font-bold text-foreground text-[11px]">Dual Signature</p>
                  <p className="text-[10px] text-muted-foreground">Counter-signed by EA/Secretary and signed by Prodhan with round seal.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/linkage-certificate"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
              >
                <span>🔗 Open Linkage Certificate Generator</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/linkage-certificate"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Print Blank Proforma Template (খালি ফরম)</span>
              </Link>
              <button
                type="button"
                onClick={() => onOpenRedirect?.("linkage-workflow")}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 flex items-center gap-2"
              >
                <span>Official SOP &amp; Statutory Notes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Delayed Birth/Death Registration SOP */}
        {activeSopTab === "delayed" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-purple-950">
                  বিলম্বিত জন্ম বা মৃত্যু নিবন্ধন (১ বছর পর) — Delayed Registration SOP
                </h4>
                <Badge className="bg-purple-600 text-white text-[10px]">Sec 13(3) RBD Act 1969</Badge>
              </div>
              <p className="text-xs text-purple-950/80 leading-relaxed">
                Applicable when birth or death was not registered within 1 year of occurrence. Requires statutory clearance through SDO Ranaghat court order and Gram Panchayat verification.
              </p>
            </div>

            {/* Department of this GP & Issuing Authority */}
            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-purple-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-700" />
                  <span>Gram Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                </span>
                <p className="font-bold text-sm text-purple-950">
                  Civil Registration &amp; Vital Statistics Department
                </p>
                <p className="font-bengali text-xs text-purple-900/80">
                  নাগরিক ও জন্ম-মৃত্যু নিবন্ধন বিভাগ · Counter #2 (Civil Registration Desk)
                </p>
              </div>
              <div className="sm:text-right text-xs text-purple-900 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-200">
                <span className="block font-bold">Issued by / Authority:</span>
                <span>Sub-Registrar (Prodhan, Bagula-II GP) under SDO Ranaghat Order</span>
              </div>
            </div>

            {/* 4 Mandatory Documents */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-muted-foreground uppercase tracking-wider">
                ৪টি বাধ্যতামূলক নথির তালিকা (Mandatory Legal Requirements)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border space-y-1">
                  <p className="font-bold text-foreground">১. পাঁচজনের সাক্ষ্যপত্র (Declaration of 5 People)</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Signed by 5 respected local village witnesses verifying the event, endorsed by Prodhan.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border space-y-1">
                  <p className="font-bold text-foreground">২. অনুপলব্ধতা সনদ (Form-10 Non-Availability)</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Issued by Bagula II GP confirming the record does not exist in old physical registers.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border space-y-1">
                  <p className="font-bold text-foreground">৩. দাইমা প্রত্যয়নপত্র (Daima / Midwife Certificate)</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Declaration from attending midwife/ASHA worker or hospital discharge memo + Voter ID.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border space-y-1">
                  <p className="font-bold text-foreground">৪. মহকুমা শাসক আদালতের আদেশ (SDO Court Order)</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Magisterial order from Sub-Divisional Officer (SDO) Ranaghat under Section 13(3).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/delayed-registration"
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
              >
                <span>📝 Open Delayed Registration Application</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => onOpenRedirect?.("birth-death-delayed")}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2"
              >
                <span>Open West Bengal Janma-Mrityu Tathya Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Legacy Digitization */}
        {activeSopTab === "digitization" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-emerald-950">
                  পুরাতন হস্তলিখিত শংসাপত্র ডিজিটালাইজেশন — Birth Digitization SOP
                </h4>
                <Badge className="bg-emerald-600 text-white text-[10px]">Historic Records (1970–2020)</Badge>
              </div>
              <p className="text-xs text-emerald-950/80 leading-relaxed">
                Converts old paper birth certificates issued by Bagula II GP into modern digitally verifiable records on the Central/State CRS portal.
              </p>
            </div>

            {/* Department of this GP & Issuing Authority */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Gram Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                </span>
                <p className="font-bold text-sm text-emerald-950">
                  Civil Registration &amp; Vital Statistics Department
                </p>
                <p className="font-bengali text-xs text-emerald-900/80">
                  নাগরিক ও জন্ম-মৃত্যু নিবন্ধন বিভাগ · JMTP Digitization Counter #2
                </p>
              </div>
              <div className="sm:text-right text-xs text-emerald-900 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-200">
                <span className="block font-bold">Issued by / Authority:</span>
                <span>Sub-Registrar (Prodhan, Bagula-II GP) &amp; DEO</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/birth-digitization-form"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Fill &amp; Print Birth Digitization A4 Form</span>
              </Link>
              <Link
                to="/birth-digitization-portal"
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-2"
              >
                <span>Check Digitization Status</span>
              </Link>
            </div>
          </div>
        )}

        {/* Tab 5: Panchayat Property Tax */}
        {activeSopTab === "property_tax" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-blue-950">
                  পঞ্চায়েত নিজস্ব গৃহকর (PRD Tax) ও কর রশিদ — Rural Property Tax SOP
                </h4>
                <Badge className="bg-blue-600 text-white text-[10px]">Instant Online</Badge>
              </div>
              <p className="text-xs text-blue-950/80 leading-relaxed">
                Pay household property tax online or verify past receipts directly through the West Bengal Panchayat &amp; Rural Development Department PRD Tax system.
              </p>
            </div>

            {/* Department of this GP & Issuing Authority */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-700" />
                  <span>Gram Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                </span>
                <p className="font-bold text-sm text-blue-950">
                  Revenue, Assessment &amp; Property Tax Department (PRD Tax)
                </p>
                <p className="font-bengali text-xs text-blue-900/80">
                  রাজস্ব, কর নির্ধারণ ও পঞ্চায়েত তহবিল শাখা · Counter #3 (Revenue Desk)
                </p>
              </div>
              <div className="sm:text-right text-xs text-blue-900 pt-2 sm:pt-0 border-t sm:border-t-0 border-blue-200">
                <span className="block font-bold">Issued by / Authority:</span>
                <span>Revenue Inspector &amp; Tax Collector, Bagula-II GP</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenRedirect?.("prd-tax")}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2"
              >
                <span>Open WBPRD Tax Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* SECTION 4: CENTRALIZED VERIFICATION & APPLICATION TRACKING DESK   */}
      {/* =================================================================== */}
      <section
        id="track-status-section"
        className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-blue-900/80 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
              <Landmark size={15} />
              <span>Bagula II Gram Panchayat · Nadia</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Centralized Verify &amp; Track Desk (কেন্দ্রীয় যাচাই ও ট্র্যাকিং ডেস্ক)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Official gateway to check issued certificate genuineness or monitor live 45-day statutory application milestones
              under Section 12/17 RBD Act &amp; West Bengal Panchayat Act 1973.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Link
              to="/track"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm inline-flex items-center gap-1.5"
            >
              <Clock size={14} />
              <span>Track Desk →</span>
            </Link>
            <Link
              to="/verify"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm inline-flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              <span>Verify Portal →</span>
            </Link>
          </div>
        </div>

        {/* Quick Portal Switcher & Jump Input */}
        <div className="bg-white/10 rounded-2xl p-4 sm:p-5 border border-white/15 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setGatewayMode("track")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                gatewayMode === "track"
                  ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Clock size={13} />
              <span>Track Application (আবেদন অগ্রগতি)</span>
            </button>
            <button
              type="button"
              onClick={() => setGatewayMode("verify")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                gatewayMode === "verify"
                  ? "bg-emerald-500 text-white font-black shadow-xs"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <FileCheck2 size={13} />
              <span>Verify Certificate (শংসাপত্র সত্যতা)</span>
            </button>
          </div>

          <form onSubmit={handleGatewaySubmit} className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={gatewayRef}
                onChange={(e) => setGatewayRef(e.target.value)}
                placeholder={
                  gatewayMode === "track"
                    ? "Enter Application Ref No (e.g. BGL2-WAR-2026-0914)..."
                    : "Enter Certificate Verification ID (e.g. BGL2-WAR-2026-0001)..."
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/20 text-xs sm:text-sm bg-black/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
              />
            </div>
            <Button
              type="submit"
              className={`h-11 px-6 rounded-xl font-bold text-xs shrink-0 w-full sm:w-auto ${
                gatewayMode === "track"
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {gatewayMode === "track" ? "Open Live Tracker" : "Verify Authenticity"}
            </Button>
          </form>

          {/* Quick Clickable Samples */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-1">
            <span className="font-semibold text-slate-200">Try Sample:</span>
            {gatewayMode === "track" ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/track?tab=track&search=BGL2-WAR-2026-0914")}
                  className="underline text-amber-300 hover:text-amber-200 font-mono"
                >
                  BGL2-WAR-2026-0914 (Ward Inquiry Active)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => navigate("/track?tab=track&search=BGL2-DEP-2026-0312")}
                  className="underline text-amber-300 hover:text-amber-200 font-mono"
                >
                  BGL2-DEP-2026-0312 (Approved &amp; Ready)
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/verify?tab=verify&search=BGL2-WAR-2026-0001")}
                  className="underline text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  BGL2-WAR-2026-0001 (Warish Certified)
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => navigate("/verify?tab=verify&search=BGL2-DEP-2026-0001")}
                  className="underline text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  BGL2-DEP-2026-0001 (Dependent Certified)
                </button>
              </>
            )}
          </div>
        </div>

        {/* Counter and Department Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold text-amber-300 block text-[11px] uppercase tracking-wider">
              Counter #1 · Succession Desk
            </span>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Warish inquiry, mutation linkage, and 45-day statutory verification clock.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold text-emerald-400 block text-[11px] uppercase tracking-wider">
              Counter #2 · Civil Registration
            </span>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Sub-Registrar birth/death delayed filing and employee dependent certificates.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="font-bold text-blue-300 block text-[11px] uppercase tracking-wider">
              DPDP Act 2023 Shield
            </span>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Zero public exposure of Aadhaar, mobile numbers, or unverified genealogical lineages.
            </p>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* SECTION 5: OFFICE DIRECTORY & PUBLIC CONTACT HELPLINE               */}
      {/* =================================================================== */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              গ্রাম পঞ্চায়েত অফিস ও নাগরিক সহায়তা হেল্পলাইন (Public Help Desk)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Office of Bagula II Gram Panchayat, Hanskhali Block, Nadia South.
            </p>
          </div>
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            Mon – Fri · 10:00 AM – 5:00 PM
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <MapPin className="w-4 h-4" />
              <span>Office Address</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Nadia, West Bengal, PIN: 741502.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-bold">
              <Phone className="w-4 h-4" />
              <span>Public Assistance</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Citizen helpline available during official working hours for Warish inquiry &amp; civil status.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Mail className="w-4 h-4" />
              <span>Official Email</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              bagula2nogp111@gmail.com (For RTI, grievance, and formal departmental correspondence).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
