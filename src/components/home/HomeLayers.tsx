import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileCheck2,
  ScrollText,
  Users,
  ShieldCheck,
  Search,
  ArrowRight,
  Download,
  Building2,
  Lock,
  Monitor,
  ExternalLink,
  ChevronRight,
  BookOpen,
  MapPin,
  Clock,
  Mail,
  Phone,
  Landmark,
  QrCode,
  FileText,
  BadgeCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PortalAccessState } from "@/lib/portalAccessControl";
import { useAuthz } from "@/lib/permissions";

interface HomeLayersProps {
  portalAccess: PortalAccessState;
  birthRule: {
    title: string;
    acceptedDays: string;
    dailyLimit: number;
    monthlyLimit: number;
  };
  openCivilWorkflow: (tab: "warish" | "dependent") => void;
  openGuide: (key: string) => void;
  onNavigateToSection: (section: "notices" | "faq" | "help") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredServices: any[];
}

export function HomeLayers({
  portalAccess,
  birthRule,
  openCivilWorkflow,
  openGuide,
  onNavigateToSection,
  searchQuery,
  setSearchQuery,
  filteredServices,
}: HomeLayersProps) {
  const navigate = useNavigate();
  const authz = useAuthz();
  const isStaffUser = Boolean(authz.isSuperAdmin || authz.isAdmin || authz.isDeo);
  const [homeVerifyTab, setHomeVerifyTab] = useState<"verify" | "track">("verify");
  const [referenceIdInput, setReferenceIdInput] = useState("");

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = referenceIdInput.trim();
    if (homeVerifyTab === "track") {
      if (cleanRef) {
        navigate(`/track?tab=track&search=${encodeURIComponent(cleanRef)}`);
      } else {
        navigate("/track");
      }
    } else {
      if (cleanRef) {
        navigate(`/verify?tab=verify&search=${encodeURIComponent(cleanRef)}`);
      } else {
        navigate("/verify");
      }
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      {/* ============================================================ */}
      {/* SEARCH OVERLAY (When Citizen is searching for a service)     */}
      {/* ============================================================ */}
      {searchQuery && (
        <div className="space-y-3 animate-fade-in bg-white/90 p-5 rounded-2xl border border-blue-200 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search size={16} className="text-blue-700" />
              <span>Matching Services for "{searchQuery}"</span>
            </h3>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-blue-700 hover:underline font-medium"
            >
              Clear Search
            </button>
          </div>
          {filteredServices.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No matching service found. Try searching "warish", "dependent", "linkage", or "tax".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {filteredServices.map((s, i) => {
                const inner = (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left">
                    <span className="text-2xl shrink-0">{s.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900">{s.title}</p>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{s.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 shrink-0 mt-1" />
                  </div>
                );
                if ("to" in s && s.to) {
                  return <Link key={i} to={s.to}>{inner}</Link>;
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => openGuide(("guideKey" in s ? s.guideKey : "wbpms-general") as string)}
                    className="w-full"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* LAYER A: STREAMLINED CITIZEN HERO — 3 CLEAR CITIZEN ACTIONS  */}
      {/* ============================================================ */}
      <section
        aria-labelledby="official-hero-heading"
        className="relative overflow-hidden rounded-3xl bg-slate-950 text-white border border-slate-800 shadow-lg"
      >
        <div className="relative px-6 py-8 sm:px-10 sm:py-12 max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-300 font-semibold">
                Government of West Bengal · Nadia District · Hanskhali Block
              </div>
              <h1
                id="official-hero-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white"
              >
                Bagula 2 No Gram Panchayat · বগুলা ২ নং গ্রাম পঞ্চায়েত
              </h1>
            </div>

            <div className="text-xs text-slate-300 font-mono shrink-0">
              30 Sansads · Cyber Cafe &amp; Assisted e-Services
            </div>
          </div>

          {/* 3 Clear Citizen Action Cards Above the Fold */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Action 1: Apply for Certificate */}
            <button
              type="button"
              onClick={() => scrollToSection("citizen-services")}
              className="group text-left p-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/10">
                  1 · Apply Online
                </span>
                <ScrollText size={20} className="text-slate-950" />
              </div>
              <div>
                <div className="text-base font-extrabold leading-snug">
                  Apply for Certificate
                </div>
                <div className="text-xs font-semibold opacity-90 font-bengali mt-0.5">
                  শংসাপত্রের জন্য অনলাইন আবেদন
                </div>
                <p className="text-xs opacity-80 mt-1.5">
                  Warish (Succession), Dependent, Family Linkage &amp; Birth Digitization.
                </p>
              </div>
              <div className="text-xs font-bold inline-flex items-center gap-1 pt-1">
                <span>Start Application</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Action 2: Verify or Track Status */}
            <button
              type="button"
              onClick={() => scrollToSection("verify-track")}
              className="group text-left p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 text-white border border-slate-700 hover:border-emerald-400 transition-all flex flex-col justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  2 · Verify &amp; Track
                </span>
                <FileCheck2 size={20} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-base font-extrabold leading-snug">
                  Verify or Track Status
                </div>
                <div className="text-xs font-semibold text-emerald-300 font-bengali mt-0.5">
                  শংসাপত্র যাচাই ও আবেদনের অবস্থান
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  Check live status with your Reference ID (<span className="font-mono">B2GP-2026-XXXX</span>) or verify QR certificates.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1 pt-1">
                <span>Enter Reference ID</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Action 3: Camp Schedule & Public Works Tracker */}
            <Link
              to="/tracker"
              className="group text-left p-5 rounded-2xl bg-slate-900 hover:bg-slate-800/90 text-white border border-slate-700 hover:border-sky-400 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                  3 · Public Tracker
                </span>
                <TrendingUp size={20} className="text-sky-400" />
              </div>
              <div>
                <div className="text-base font-extrabold leading-snug">
                  Camps &amp; Public Works
                </div>
                <div className="text-xs font-semibold text-sky-300 font-bengali mt-0.5">
                  ক্যাম্প সূচি ও উন্নয়ন প্রকল্প ট্র্যাকার
                </div>
                <p className="text-xs text-slate-300 mt-1.5">
                  Track Sansad works, camp schedules, and submit on-ground citizen updates.
                </p>
              </div>
              <div className="text-xs font-bold text-sky-400 inline-flex items-center gap-1 pt-1">
                <span>Open Public Tracker</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>

          {/* Quick Search Shortcut */}
          <div className="pt-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="search"
                aria-label="Search all services"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any service (Warish, Dependent, Birth Certificate, Property Tax, Ward Member)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 text-white placeholder:text-slate-400 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LAYER B: CITIZEN SERVICES (Decluttered, Zero Staff Clutter) */}
      {/* ============================================================ */}
      <section id="citizen-services" aria-labelledby="citizen-services-heading" className="space-y-6 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <BadgeCheck size={15} className="text-blue-700" />
              <span>Cyber Cafe &amp; Panchayat Certificates</span>
            </div>
            <h2 id="citizen-services-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Certificate Application Services · শংসাপত্র আবেদন সেবা
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Choose a certificate below to start a Cyber Cafe assisted application or view required documents.
            </p>
          </div>
          <Link
            to="/cyber-cafe"
            className="text-xs font-bold text-blue-800 hover:text-blue-900 inline-flex items-center gap-1 shrink-0 group min-h-[40px] px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            <span>Open Cyber Cafe Hub</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* The 3 Core Live Certificate Services */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. WARISH (SUCCESSION) CERTIFICATE */}
          <div className="rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100">
                  <ScrollText size={22} />
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Turnaround: 7–15 Days
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Warish (Succession) Certificate
                </h3>
                <p className="text-xs font-semibold text-blue-800 mt-0.5 font-bengali">
                  ওয়ারিশান (উত্তরাধিকার) শংসাপত্র
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Legal heirship certificate for land mutation (BL&amp;LRO), bank claims, and family succession of deceased residents.
              </p>
            </div>

            {/* Clean Citizen Actions */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <Button
                asChild
                className="w-full min-h-[44px] rounded-xl font-bold bg-blue-700 hover:bg-blue-800 text-white text-xs shadow-xs"
              >
                <Link to="/apply/warish" className="flex items-center justify-center gap-1.5">
                  <span>Apply via Cyber Cafe (আবেদন করুন)</span>
                  <ArrowRight size={14} />
                </Link>
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openCivilWorkflow("warish")}
                  className="text-xs font-semibold text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  <BookOpen size={12} />
                  <span>Required Documents</span>
                </button>
                <Link
                  to="/warish-application-form"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                >
                  <Download size={12} />
                  <span>A4 Form + Track ID</span>
                </Link>
              </div>
              {isStaffUser && (
                <div className="pt-1 border-t border-dashed border-slate-200 text-right">
                  <Link
                    to="/warish-certificate"
                    className="text-[10px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                  >
                    <Lock size={10} />
                    <span>Staff Drafting Tool</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* 2. DEPENDENT CERTIFICATE */}
          <div className="rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold border border-sky-100">
                  <Users size={22} />
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Turnaround: 3–7 Days
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Dependent Certificate
                </h3>
                <p className="text-xs font-semibold text-sky-800 mt-0.5 font-bengali">
                  পোষ্য / নির্ভরশীলতা শংসাপত্র
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Family dependency attestation for CGHS medical reimbursement, railway pass privileges, and welfare benefits.
              </p>
            </div>

            {/* Clean Citizen Actions */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <Button
                asChild
                className="w-full min-h-[44px] rounded-xl font-bold bg-sky-700 hover:bg-sky-800 text-white text-xs shadow-xs"
              >
                <Link to="/apply/dependent" className="flex items-center justify-center gap-1.5">
                  <span>Apply via Cyber Cafe (আবেদন করুন)</span>
                  <ArrowRight size={14} />
                </Link>
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openCivilWorkflow("dependent")}
                  className="text-xs font-semibold text-sky-800 hover:underline inline-flex items-center gap-1"
                >
                  <BookOpen size={12} />
                  <span>Required Documents</span>
                </button>
                {isStaffUser && (
                  <Link
                    to="/dependent-certificate"
                    className="text-[10px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                  >
                    <Lock size={10} />
                    <span>Staff Drafting Tool</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* 3. LINKAGE CERTIFICATE */}
          <div className="rounded-2xl bg-white border border-slate-200 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold border border-emerald-100">
                  <FileText size={22} />
                </div>
                <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                  Turnaround: 3–7 Days
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Family Linkage Certificate
                </h3>
                <p className="text-xs font-semibold text-emerald-800 mt-0.5 font-bengali">
                  পারিবারিক / নির্বাচনী সংযোগ শংসাপত্র
                </p>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Ancestral and parental linkage certification across historical electoral rolls, land deeds, and family registers.
              </p>
            </div>

            {/* Clean Citizen Actions */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <Button
                asChild
                className="w-full min-h-[44px] rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white text-xs shadow-xs"
              >
                <Link to="/apply/linkage" className="flex items-center justify-center gap-1.5">
                  <span>Apply via Cyber Cafe (আবেদন করুন)</span>
                  <ArrowRight size={14} />
                </Link>
              </Button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openGuide("wbpms-residential")}
                  className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  <BookOpen size={12} />
                  <span>Required Documents</span>
                </button>
                {isStaffUser && (
                  <Link
                    to="/linkage-certificate"
                    className="text-[10px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                  >
                    <Lock size={10} />
                    <span>Staff Drafting Tool</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Panchayat Facilitations (Clean Row) */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Additional Panchayat Facilitations &amp; Portals
            </h4>
            <span className="text-[11px] text-slate-500">Statutory Registries</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Legacy Birth */}
            <Link
              to="/birth-digitization-form"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all flex items-start gap-2.5"
            >
              <span className="text-lg shrink-0">👶</span>
              <div>
                <p className="font-bold text-slate-900">Legacy Birth Digitization</p>
                <p className="text-[11px] text-slate-500">Sec 12/17 RBD Act (Pre-2016 verification)</p>
              </div>
            </Link>

            {/* PRD Tax */}
            <a
              href="https://prdtax.wb.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all flex items-start gap-2.5"
            >
              <span className="text-lg shrink-0">🏛️</span>
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-bold text-slate-900">PRD Property Tax</p>
                  <ExternalLink size={11} className="text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-500">Online tax assessment &amp; payment</p>
              </div>
            </a>

            {/* WBPMS Guide */}
            <Link
              to="/wbpms-info"
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex items-start gap-2.5"
            >
              <span className="text-lg shrink-0">📑</span>
              <div>
                <p className="font-bold text-slate-900">WBPMS Certificates</p>
                <p className="text-[11px] text-slate-500">Residential, Income, Character guide</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LAYER C: VERIFY & TRACK                                      */}
      {/* ============================================================ */}
      <section id="verify-track" aria-labelledby="verify-track-heading" className="space-y-4 scroll-mt-20">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 border border-blue-900/80 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                <ShieldCheck size={16} className="text-amber-400" />
                <span>Public Authenticity &amp; Tracking Desk</span>
              </div>
              <h2 id="verify-track-heading" className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Verify &amp; Track · শংসাপত্র যাচাই ও ট্র্যাকিং
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Statutory certificate authenticity validation and live application progress tracking for Bagula II Gram Panchayat.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-3.5 rounded-xl text-xs gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Link to="/verify">
                  <QrCode size={14} className="text-emerald-400" />
                  <span>Full Portal →</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Segmented Switcher for Home: Verify vs Track */}
          <div className="inline-flex rounded-xl bg-white/10 p-1 border border-white/15 text-xs">
            <button
              type="button"
              onClick={() => {
                setHomeVerifyTab("verify");
                setReferenceIdInput("");
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                homeVerifyTab === "verify"
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <FileCheck2 size={14} className={homeVerifyTab === "verify" ? "text-emerald-600" : "text-amber-300"} />
              <span>Verify Issued Certificate</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setHomeVerifyTab("track");
                setReferenceIdInput("");
              }}
              className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                homeVerifyTab === "track"
                  ? "bg-white text-blue-950 shadow-sm"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <Clock size={14} className={homeVerifyTab === "track" ? "text-blue-700" : "text-amber-300"} />
              <span>Track Application Status</span>
            </button>
          </div>

          {/* Verification / Tracking Form */}
          <form onSubmit={handleVerifySubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={referenceIdInput}
                  onChange={(e) => setReferenceIdInput(e.target.value)}
                  placeholder={
                    homeVerifyTab === "verify"
                      ? "Enter Verification ID / Memo No (e.g. BGL2-WAR-2026-0001)..."
                      : "Enter Application Reference ID (e.g. BGL2-WAR-2026-0914)..."
                  }
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 text-xs sm:text-sm bg-white/10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className={`w-full sm:w-auto h-12 px-7 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center justify-center gap-1.5 shrink-0 ${
                  homeVerifyTab === "verify"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {homeVerifyTab === "verify" ? <FileCheck2 size={16} /> : <Clock size={16} />}
                <span>{homeVerifyTab === "verify" ? "Verify Certificate" : "Track Status"}</span>
              </Button>
            </div>

            {/* Quick Test Sample Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 pt-1">
              <span className="font-semibold text-slate-200">Sample References:</span>
              {homeVerifyTab === "verify" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceIdInput("BGL2-WAR-2026-0001");
                      navigate("/verify?tab=verify&search=BGL2-WAR-2026-0001");
                    }}
                    className="underline text-amber-300 hover:text-amber-200 font-mono"
                  >
                    BGL2-WAR-2026-0001 (Warish)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceIdInput("BGL2-DEP-2026-0001");
                      navigate("/verify?tab=verify&search=BGL2-DEP-2026-0001");
                    }}
                    className="underline text-amber-300 hover:text-amber-200 font-mono"
                  >
                    BGL2-DEP-2026-0001 (Dependent)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceIdInput("BGL2-WAR-2026-0914");
                      navigate("/track?tab=track&search=BGL2-WAR-2026-0914");
                    }}
                    className="underline text-amber-300 hover:text-amber-200 font-mono"
                  >
                    BGL2-WAR-2026-0914 (Ward Inquiry)
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReferenceIdInput("BGL2-DEP-2026-0312");
                      navigate("/track?tab=track&search=BGL2-DEP-2026-0312");
                    }}
                    className="underline text-amber-300 hover:text-amber-200 font-mono"
                  >
                    BGL2-DEP-2026-0312 (Approved)
                  </button>
                </>
              )}
            </div>

            {/* Approved Help Text & Strict Public Privacy Safeguard */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-300 pt-2 border-t border-white/10">
              <p className="flex items-center gap-1.5">
                <span>ℹ️</span>
                <span>Enter reference ID printed on acknowledgment slip or QR certificate.</span>
              </p>
              <p className="text-slate-400">
                🔒 DPDP Act 2023: Personal identifiers &amp; lineage records are shielded from public exposure.
              </p>
            </div>
          </form>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LAYER D: PORTAL & ACCESS SECTION                             */}
      {/* ============================================================ */}
      <section id="portal-access" aria-labelledby="portal-access-heading" className="space-y-6 scroll-mt-20">
        <div className="border-b border-slate-200 pb-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <Building2 size={15} className="text-slate-700" />
            <span>Role-Specific &amp; Assisted Workspaces</span>
          </div>
          <h2 id="portal-access-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            Portal &amp; Access
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Dedicated operational workspaces for authorized assisted service operators, elected representatives, and Panchayat office administration.
          </p>
        </div>

        {/* 3 Dedicated Workspace Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Cyber Cafe Hub */}
          <div className="rounded-2xl bg-white border border-orange-200/90 hover:border-orange-500 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center font-bold border border-orange-100">
                  <Monitor size={22} />
                </div>
                <span className="text-xs font-medium text-orange-800">
                  Open Workstation · No Login
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cyber Cafe Hub
                </h3>
                <p className="text-[11px] font-semibold text-orange-800 mt-0.5">
                  Assisted Service &amp; Application Prep
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Open-access workstation for Cyber Cafe operators and residents to initiate applications, format IDs, and print forms.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button
                asChild
                className="w-full min-h-[44px] rounded-xl font-bold bg-orange-600 hover:bg-orange-700 text-white text-xs shadow-xs"
              >
                <Link to="/cyber-cafe" className="flex items-center justify-center gap-1.5">
                  <span>Open Cyber Cafe Hub</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. Elected Representatives */}
          <div className="rounded-2xl bg-white border border-amber-200/90 hover:border-amber-500 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold border border-amber-100">
                  <Users size={22} />
                </div>
                <span className="text-xs font-medium text-amber-900 tabular-nums">
                  30 Gram Sansads
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Elected Representatives
                </h3>
                <p className="text-[11px] font-semibold text-amber-900 mt-0.5">
                  Ward-Wise Directory &amp; Inquiry Desk
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Ward-wise elected representative directory and open-access 45-day Warish &amp; EPIC linkage verification desk.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                asChild
                className="w-full min-h-[44px] rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs shadow-xs"
              >
                <Link to="/elected-representatives" className="flex items-center justify-center gap-1.5">
                  <span>View Representatives</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
              <div className="text-center">
                <Link
                  to="/elected-portal"
                  className="text-xs text-slate-600 hover:text-amber-800 font-medium underline inline-flex items-center min-h-[32px]"
                >
                  Open Ward Inquiry &amp; Verification Desk →
                </Link>
              </div>
            </div>
          </div>

          {/* 3. Office Login */}
          <div className="rounded-2xl bg-white border border-slate-300 hover:border-slate-800 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center font-bold border border-slate-200">
                  <Lock size={22} />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  DEO · Admin · Super Admin
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Office Login
                </h3>
                <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                  Authorized Administrative Workspace
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Protected Gram Panchayat office portal exclusively for DEO, Admin, and Super Admin personnel.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button
                asChild
                className="w-full min-h-[44px] rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white text-xs shadow-xs"
              >
                <Link to="/admin" className="flex items-center justify-center gap-1.5">
                  <span>Office Sign In</span>
                  <ArrowRight size={13} />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LAYER E: ABOUT & TRUST SECTION                               */}
      {/* ============================================================ */}
      <section aria-labelledby="about-trust-heading" className="space-y-6">
        <div className="rounded-3xl bg-slate-100/90 border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Landmark size={15} className="text-blue-900" />
              <span>Administrative Overview</span>
            </div>
            <h2 id="about-trust-heading" className="text-lg sm:text-xl font-bold text-slate-900">
              About Digital Administrative Register (DAR)
            </h2>
            {/* Approved About Copy (Verbatim) */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
              The Digital Administrative Register provides a structured digital environment for Panchayat administrative records and certificate-related workflows. It is designed to support controlled processing, record management and public certificate verification.
            </p>
          </div>

          {/* Pillars of Administrative Transparency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="font-bold text-blue-950 block text-[11px]">1. Controlled Processing</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Multi-stage application intake, statutory ward-level enquiry, and Sub-Registrar / Pradhan approval.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="font-bold text-blue-950 block text-[11px]">2. Record Management</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Preservation of historical volume registers, legacy birth records, and tamper-evident civil certificate logs.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <span className="font-bold text-blue-950 block text-[11px]">3. Public Verification</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Decentralized, cryptographic verification of issued certificates via Unique Reference IDs and QR codes.
              </p>
            </div>
          </div>

          {/* Office Address & Working Hours Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin size={14} className="text-blue-700" />
                <span>Bagula II Gram Panchayat Office &amp; Helpdesk</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Hanskhali Block · Nadia South · PIN: 741502</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Location</span>
                <p className="text-slate-800 font-medium">Vill: Stationpara, P.O.: Bagula</p>
                <p className="text-slate-500 text-[11px]">P.S.: Hanskhali, Dist: Nadia, W.B.</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Working Hours</span>
                <p className="text-slate-800 font-semibold">Mon – Fri: 10:00 AM – 5:00 PM</p>
                <p className="text-slate-500 text-[11px]">Submission Counters close at 3:30 PM</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Email</span>
                <p className="text-slate-800 font-mono text-[11px] font-semibold">bagula2nogp111@gmail.com</p>
                <p className="text-slate-500 text-[11px]">Subject to official record keeping</p>
              </div>
            </div>
          </div>

          {/* Approved Disclaimer (Verbatim) */}
          <div className="pt-2 border-t border-slate-200/80">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Disclaimer:</strong> This website is a digital administrative platform of Bagula II Gram Panchayat for record management, certificate-related workflows and public certificate verification. Information and services available through this platform are subject to applicable Panchayat procedures and administrative review.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
