import React, { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Share2,
  Sparkles,
  ArrowRight,
  Filter,
  FileCheck2,
  ShieldCheck,
  Send,
  PlusCircle,
  RotateCcw,
  Check,
  Eye,
  Info,
  HelpCircle,
  Landmark,
  Layers,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  TrackerInitiative,
  TrackerStatus,
  TrackerCategory,
  CitizenTrackerSubmission,
} from "@/types/trackerTypes";
import { TRACKER_INITIATIVES, TRACKER_RECENT_UPDATES } from "@/data/trackerData";
import {
  fetchPublicTrackerReports,
  submitPublicTrackerReport,
} from "@/lib/publicCitizenBackendService";

const STATUS_CONFIG: Record<
  TrackerStatus,
  {
    label: string;
    labelBn: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    badgeCls: string;
  }
> = {
  fulfilled: {
    label: "Fulfilled / Complete",
    labelBn: "বাস্তবায়িত ও সম্পন্ন",
    bg: "bg-emerald-50 dark:bg-emerald-950/60",
    text: "text-emerald-900 dark:text-emerald-200",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-600",
    badgeCls: "bg-emerald-600 text-white font-bold",
  },
  in_progress: {
    label: "In Progress",
    labelBn: "চলমান / প্রগতিশীল",
    bg: "bg-blue-50 dark:bg-blue-950/60",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-600",
    badgeCls: "bg-blue-600 text-white font-bold",
  },
  under_review: {
    label: "Under Review / Site Clear",
    labelBn: "পর্যালোচনাধীন / সাইট চিহ্নিতকরণ",
    bg: "bg-amber-50 dark:bg-amber-950/60",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    badgeCls: "bg-amber-500 text-slate-950 font-bold",
  },
  scheduled: {
    label: "Scheduled",
    labelBn: "পরিকল্পিত / সূচিভুক্ত",
    bg: "bg-purple-50 dark:bg-purple-950/60",
    text: "text-purple-900 dark:text-purple-200",
    border: "border-purple-200 dark:border-purple-800",
    dot: "bg-purple-500",
    badgeCls: "bg-purple-600 text-white font-bold",
  },
  stalled: {
    label: "Action Needed / Stalled",
    labelBn: "প্রশাসনিক পদক্ষেপ প্রয়োজন",
    bg: "bg-rose-50 dark:bg-rose-950/60",
    text: "text-rose-900 dark:text-rose-200",
    border: "border-rose-200 dark:border-rose-800",
    dot: "bg-rose-600",
    badgeCls: "bg-rose-600 text-white font-bold",
  },
};

const CATEGORIES: { id: TrackerCategory; label: string; labelBn: string; icon: string }[] = [
  { id: "all", label: "All Works & Services", labelBn: "সকল উদ্যোগ ও সেবা", icon: "📋" },
  { id: "certificates", label: "Citizen Certificates", labelBn: "নাগরিক শংসাপত্র", icon: "📑" },
  { id: "civil_registration", label: "Birth & Death Records", labelBn: "জন্ম-মৃত্যু নিবন্ধন", icon: "👶" },
  { id: "revenue_tax", label: "PRD Property Tax", labelBn: "পিআরডি সম্পত্তি কর", icon: "🏛️" },
  { id: "infrastructure", label: "Infrastructure & Roads", labelBn: "রাস্তা ও নিকাশী নালা", icon: "🏗️" },
  { id: "water_sanitation", label: "Water & Sanitation", labelBn: "পানীয় জল ও পরিবেশ", icon: "💧" },
  { id: "governance_it", label: "Governance & IT", labelBn: "প্রশাসন ও কিয়স্ক", icon: "💻" },
  { id: "welfare_livelihood", label: "Welfare & MGNREGA", labelBn: "সমাজকল্যাণ ও ১০০ দিন", icon: "🌾" },
];

export default function PublicTracker() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state sync
  const initialCategory = (searchParams.get("category") as TrackerCategory) || "all";
  const initialStatus = (searchParams.get("status") as TrackerStatus | "all") || "all";
  const initialQuery = searchParams.get("q") || "";
  const targetId = searchParams.get("id");

  const [activeTab, setActiveTab] = useState<"initiatives" | "updates">("initiatives");
  const [selectedCategory, setSelectedCategory] = useState<TrackerCategory>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<TrackerStatus | "all">(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(() => {
    if (targetId) {
      return { [targetId]: true };
    }
    return {};
  });

  // Citizen submission modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedInitiativeForReport, setSelectedInitiativeForReport] = useState<TrackerInitiative | null>(null);
  const [citizenName, setCitizenName] = useState("");
  const [wardNumber, setWardNumber] = useState("");
  const [citizenClaimStatus, setCitizenClaimStatus] = useState<TrackerStatus>("in_progress");
  const [citizenReportDetails, setCitizenReportDetails] = useState("");
  const [citizenSubmissions, setCitizenSubmissions] = useState<CitizenTrackerSubmission[]>([]);
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    fetchPublicTrackerReports().then((reports) => {
      setCitizenSubmissions(reports);
    });
  }, []);

  // Auto-scroll to target card if URL param exists
  useEffect(() => {
    if (targetId) {
      const el = document.getElementById(`initiative-${targetId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }
  }, [targetId]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = TRACKER_INITIATIVES.length;
    const fulfilled = TRACKER_INITIATIVES.filter((i) => i.status === "fulfilled").length;
    const inProgress = TRACKER_INITIATIVES.filter((i) => i.status === "in_progress").length;
    const underReview = TRACKER_INITIATIVES.filter((i) => i.status === "under_review").length;
    const scheduled = TRACKER_INITIATIVES.filter((i) => i.status === "scheduled").length;

    const fulfilledPct = Math.round((fulfilled / total) * 100);
    const inProgressPct = Math.round((inProgress / total) * 100);
    const underReviewPct = Math.round((underReview / total) * 100);
    const scheduledPct = Math.round((scheduled / total) * 100);

    return {
      total,
      fulfilled,
      inProgress,
      underReview,
      scheduled,
      fulfilledPct,
      inProgressPct,
      underReviewPct,
      scheduledPct,
    };
  }, []);

  // Filtered initiatives
  const filteredInitiatives = useMemo(() => {
    return TRACKER_INITIATIVES.filter((item) => {
      // Category filter
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inEn =
          item.title.toLowerCase().includes(q) ||
          item.verbatimPromiseEn.toLowerCase().includes(q) ||
          item.officialMemoNo.toLowerCase().includes(q) ||
          item.targetArea.toLowerCase().includes(q);
        const inBn =
          item.titleBn.toLowerCase().includes(q) ||
          item.verbatimPromiseBn.toLowerCase().includes(q) ||
          item.targetAreaBn.toLowerCase().includes(q);
        return inEn || inBn;
      }
      return true;
    });
  }, [selectedCategory, selectedStatus, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleShare = (slug: string) => {
    const url = `${window.location.origin}/tracker?id=${slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(
        language === "en"
          ? "Direct tracker link copied to clipboard!"
          : "ট্র্যাকার সরাসরি লিঙ্ক কপি করা হয়েছে!"
      );
    }
  };

  const handleOpenReportModal = (initiative?: TrackerInitiative) => {
    if (initiative) {
      setSelectedInitiativeForReport(initiative);
      setCitizenClaimStatus(initiative.status);
    } else {
      setSelectedInitiativeForReport(TRACKER_INITIATIVES[0]);
    }
    setIsSubmitModalOpen(true);
  };

  const handleSaveCitizenReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenReportDetails.trim() || !citizenName.trim()) {
      toast.error(
        language === "en"
          ? "Please provide your name and ground details."
          : "অনুগ্রহ করে আপনার নাম ও মাঠপর্যায়ের তথ্য উল্লেখ করুন।"
      );
      return;
    }

    setSubmittingReport(true);
    try {
      const { submission } = await submitPublicTrackerReport({
        initiativeId: selectedInitiativeForReport?.id || "general",
        citizenName: citizenName.trim(),
        wardNumber: wardNumber.trim() || "Local Ward",
        claimStatus: citizenClaimStatus,
        details: citizenReportDetails.trim(),
      });

      setCitizenSubmissions((prev) => [submission, ...prev]);
      toast.success(
        language === "en"
          ? "Citizen update saved to Panchayat accountability ledger!"
          : "নাগরিক তথ্য সফলভাবে পঞ্চায়েত ডাটাবেসে জমা হয়েছে!"
      );

      setIsSubmitModalOpen(false);
      setCitizenReportDetails("");
      setCitizenName("");
      setWardNumber("");
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-foreground pb-20">
      <Helmet>
        <title>
          {language === "en"
            ? "Public Accountability & Milestone Tracker — Bagula II Gram Panchayat"
            : "পাবলিক জবাবদিহিতা ও উন্নয়ন প্রকল্প ট্র্যাকার — বগুলা ২ নং গ্রাম পঞ্চায়েত"}
        </title>
        <meta
          name="description"
          content="Live administrative progress tracker for citizen certificates, infrastructure, and public schemes across all 30 Sansads of Bagula II Gram Panchayat, Nadia."
        />
        <link rel="canonical" href="https://bagula2gp.lovable.app/tracker" />
      </Helmet>

      {/* ============================================================ */}
      {/* TOP HEADER & JURISDICTION IDENTITY (tracker.wbupdates.com)   */}
      {/* ============================================================ */}
      <section className="bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-6">
          {/* Identity & Language Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 border border-white/15 text-xs font-mono font-bold uppercase tracking-wider">
                <Landmark size={14} className="text-amber-400" />
                <span>Government of West Bengal · Nadia District · Hanskhali Block</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                {language === "en" ? "Public Accountability & Milestone Tracker" : "প্রশাসনিক দায়বদ্ধতা ও উন্নয়ন প্রকল্প ট্র্যাকার"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {language === "en"
                  ? "An open public dashboard monitoring statutory citizen commitments, certificate facilitation desks, public infrastructure works, and PRD revenue milestones across all 30 Sansads."
                  : "বগুলা ২ নং গ্রাম পঞ্চায়েতের সকল ৩০টি সংসদের উন্নয়নমূলক কাজ, নাগরিক শংসাপত্র ক্যাম্প এবং নাগরিক প্রতিশ্রুতি বাস্তবায়নের উন্মুক্ত প্রশাসনিক ট্র্যাকার।"}
              </p>
            </div>

            {/* Language & Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
              {/* Language Switcher */}
              <div className="inline-flex p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    language === "en"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("bn")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    language === "bn"
                      ? "bg-white text-slate-950 shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  বাংলা
                </button>
              </div>

              {/* Submit Update Button */}
              <Button
                onClick={() => handleOpenReportModal()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 px-3.5 rounded-xl gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <PlusCircle size={15} />
                <span>{language === "en" ? "Submit An Update" : "তথ্য দাখিল করুন"}</span>
              </Button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* STATS OVERVIEW & PROGRESS METER (SIGNATURE TRACKER UI)       */}
          {/* ============================================================ */}
          <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
              {/* Total */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                <div className="text-2xl sm:text-3xl font-black text-white">{stats.total}</div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                  {language === "en" ? "Total Tracked" : "মোট উদ্যোগ"}
                </div>
              </div>

              {/* Fulfilled */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={20} className="text-emerald-400" />
                  <span>{stats.fulfilled}</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-300/90 uppercase tracking-wide mt-0.5">
                  {language === "en" ? "Fulfilled" : "বাস্তবায়িত"} ({stats.fulfilledPct}%)
                </div>
              </div>

              {/* In Progress */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                <div className="text-2xl sm:text-3xl font-black text-blue-400 flex items-center justify-center gap-1.5">
                  <Clock size={20} className="text-blue-400" />
                  <span>{stats.inProgress}</span>
                </div>
                <div className="text-[11px] font-semibold text-blue-300/90 uppercase tracking-wide mt-0.5">
                  {language === "en" ? "In Progress" : "চলমান কাজ"} ({stats.inProgressPct}%)
                </div>
              </div>

              {/* Under Review */}
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30">
                <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center justify-center gap-1.5">
                  <AlertCircle size={20} className="text-amber-400" />
                  <span>{stats.underReview}</span>
                </div>
                <div className="text-[11px] font-semibold text-amber-300/90 uppercase tracking-wide mt-0.5">
                  {language === "en" ? "Under Review" : "পর্যালোচনাধীন"} ({stats.underReviewPct}%)
                </div>
              </div>

              {/* Scheduled */}
              <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="text-2xl sm:text-3xl font-black text-purple-400 flex items-center justify-center gap-1.5">
                  <Calendar size={20} className="text-purple-400" />
                  <span>{stats.scheduled}</span>
                </div>
                <div className="text-[11px] font-semibold text-purple-300/90 uppercase tracking-wide mt-0.5">
                  {language === "en" ? "Scheduled" : "পরিকল্পিত"} ({stats.scheduledPct}%)
                </div>
              </div>
            </div>

            {/* Segmented Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-full bg-slate-900 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${stats.fulfilledPct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Fulfilled: ${stats.fulfilledPct}%`}
                />
                <div
                  style={{ width: `${stats.inProgressPct}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`In Progress: ${stats.inProgressPct}%`}
                />
                <div
                  style={{ width: `${stats.underReviewPct}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Under Review: ${stats.underReviewPct}%`}
                />
                <div
                  style={{ width: `${stats.scheduledPct}%` }}
                  className="bg-purple-500 transition-all duration-500"
                  title={`Scheduled: ${stats.scheduledPct}%`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  {language === "en"
                    ? `Overall Resolution Rate: ${stats.fulfilledPct}% Fulfilled`
                    : `সার্বিক বাস্তবায়ন হার: ${stats.fulfilledPct}% সমাপ্ত`}
                </span>
                <span className="font-mono text-[10px]">
                  Audited: September 2026 · Bagula II GP Secretariat
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* MAIN TRACKER CONTENT CONTAINER                               */}
      {/* ============================================================ */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Navigation Tabs (Initiatives vs Updates Feed) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-900 p-1 border border-slate-300 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("initiatives")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "initiatives"
                  ? "bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-950"
              }`}
            >
              <Layers size={14} />
              <span>
                {language === "en"
                  ? `All Initiatives (${TRACKER_INITIATIVES.length})`
                  : `সকল উদ্যোগ ও প্রকল্প (${TRACKER_INITIATIVES.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("updates")}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === "updates"
                  ? "bg-white dark:bg-slate-800 text-blue-950 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-950"
              }`}
            >
              <TrendingUp size={14} />
              <span>
                {language === "en"
                  ? `Public Record of Updates (${TRACKER_RECENT_UPDATES.length})`
                  : `সাম্প্রতিক প্রশাসনিক আপডেট লগ (${TRACKER_RECENT_UPDATES.length})`}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>
              {language === "en"
                ? "Official Records & Public Scrutiny Platform"
                : "সরকারি গেজেট ও প্রকাশ্য অনুসন্ধান রেজিস্টার"}
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: INITIATIVES CARDS VIEW                                */}
        {/* ============================================================ */}
        {activeTab === "initiatives" && (
          <div className="space-y-6">
            {/* Search and Category Filter Bar */}
            <div className="space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 ${
                      selectedCategory === cat.id
                        ? "bg-blue-900 text-white shadow-xs"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{language === "en" ? cat.label : cat.labelBn}</span>
                  </button>
                ))}
              </div>

              {/* Search & Status Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {/* Search Bar */}
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      language === "en"
                        ? "Search initiatives by keyword, village, scheme, or memo number..."
                        : "উদ্যোগ, প্রকল্প, গ্রাম বা মেমো নম্বর লিখে খুঁজুন..."
                    }
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Status Dropdown Filter */}
                <select
                  aria-label="Filter initiatives by status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="all">
                    {language === "en" ? "All Statuses (সব অবস্থা)" : "সব অবস্থা"}
                  </option>
                  <option value="fulfilled">
                    {language === "en" ? "🟢 Fulfilled (বাস্তবায়িত)" : "বাস্তবায়িত"}
                  </option>
                  <option value="in_progress">
                    {language === "en" ? "🔵 In Progress (চলমান)" : "চলমান"}
                  </option>
                  <option value="under_review">
                    {language === "en" ? "🟡 Under Review (পর্যালোচনাধীন)" : "পর্যালোচনাধীন"}
                  </option>
                  <option value="scheduled">
                    {language === "en" ? "🟣 Scheduled (সূচিভুক্ত)" : "সূচিভুক্ত"}
                  </option>
                </select>
              </div>

              {/* Results Count Counter */}
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  {language === "en"
                    ? `Showing ${filteredInitiatives.length} of ${TRACKER_INITIATIVES.length} initiatives`
                    : `মোট ${TRACKER_INITIATIVES.length}টির মধ্যে ${filteredInitiatives.length}টি প্রদর্শিত`}
                </span>
                {(selectedCategory !== "all" || selectedStatus !== "all" || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedStatus("all");
                      setSearchQuery("");
                    }}
                    className="text-blue-700 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>{language === "en" ? "Reset Filters" : "ফিল্টার রিসেট করুন"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* INITIATIVES CARDS GRID (SIGNATURE tracker.wbupdates.com CARDS) */}
            {filteredInitiatives.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <Search size={32} className="text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {language === "en" ? "No matching initiatives found" : "কোনো ফলাফল পাওয়া যায়নি"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {language === "en"
                    ? "Try adjusting your search terms or resetting category filters."
                    : "অনুগ্রহ করে অন্য শব্দ দিয়ে অনুসন্ধান করুন বা ফিল্টার পরিবর্তন করুন।"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedStatus("all");
                    setSearchQuery("");
                  }}
                  className="text-xs"
                >
                  {language === "en" ? "View All Initiatives" : "সকল উদ্যোগ দেখুন"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-5">
                {filteredInitiatives.map((item) => {
                  const cfg = STATUS_CONFIG[item.status];
                  const isExpanded = !!expandedCards[item.id];

                  return (
                    <div
                      key={item.id}
                      id={`initiative-${item.id}`}
                      className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-2xs hover:shadow-md p-5 sm:p-6 space-y-4"
                    >
                      {/* Card Header: Category Tag & Status Pill */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        {/* Category & Department */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                            <Building2 size={12} className="text-blue-700" />
                            <span>{language === "en" ? item.categoryLabel : item.categoryLabelBn}</span>
                          </span>

                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-muted-foreground border border-slate-200 dark:border-slate-700 font-semibold">
                            {item.officialMemoNo}
                          </span>
                        </div>

                        {/* Status Badge with Live Dot */}
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${cfg.dot} inline-block animate-pulse`} />
                          <span>{language === "en" ? item.statusLabel : item.statusLabelBn}</span>
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white leading-snug">
                          {language === "en" ? item.title : item.titleBn}
                        </h2>
                        {language === "en" && (
                          <p className="font-bengali text-xs text-muted-foreground mt-0.5">
                            {item.titleBn}
                          </p>
                        )}
                        {language === "bn" && (
                          <p className="font-sans text-xs text-muted-foreground mt-0.5">
                            {item.title}
                          </p>
                        )}
                      </div>

                      {/* Verbatim Scope Box (Signature wbupdates.com style) */}
                      <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-l-blue-600 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs sm:text-sm">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <FileCheck2 size={12} className="text-blue-700" />
                          <span>
                            {language === "en"
                              ? "Statutory Scope & Commitment"
                              : "আনুষ্ঠানিক দায়বদ্ধতা ও প্রশাসনিক পরিধি"}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-normal italic">
                          &ldquo;{language === "en" ? item.verbatimPromiseEn : item.verbatimPromiseBn}&rdquo;
                        </p>
                      </div>

                      {/* Progress Bar (if in progress or ongoing) */}
                      {item.progressPercent > 0 && item.progressPercent < 100 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            <span>{language === "en" ? "Milestone Progress" : "প্রকল্পের অগ্রগতি"}</span>
                            <span>{item.progressPercent}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${item.progressPercent}%` }}
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            />
                          </div>
                        </div>
                      )}

                      {/* Metadata Row: Target Area, Department & Last Audit */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <MapPin size={13} className="text-red-500 shrink-0" />
                            <span>{language === "en" ? item.targetArea : item.targetAreaBn}</span>
                          </span>

                          <span>·</span>

                          <span className="text-[11px]">
                            {language === "en" ? "Last updated:" : "হালনাগাদ:"}{" "}
                            {new Date(item.lastUpdated).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {/* Expand & Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleShare(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Share direct tracker card link"
                            aria-label="Share direct tracker card link"
                          >
                            <Share2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpand(item.id)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 dark:text-blue-400 hover:underline px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                          >
                            <span>
                              {isExpanded
                                ? language === "en"
                                  ? "Hide Milestones"
                                  : "মাইলস্টোন লুকান"
                                : language === "en"
                                ? "View Evidence & Timeline"
                                : "প্রমাণ ও সময়রেখা দেখুন"}
                            </span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* ============================================================ */}
                      {/* EXPANDABLE DRAWER: TIMELINE MILESTONES & DOCUMENT EVIDENCE   */}
                      {/* ============================================================ */}
                      {isExpanded && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in-50 duration-200">
                          {/* Official Notes / Verification Summary */}
                          {item.officialNotes && (
                            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                              <span className="font-bold text-blue-950 dark:text-blue-200 uppercase text-[10px] tracking-wider block">
                                {language === "en"
                                  ? "Official Verification Audit Note"
                                  : "প্রশাসনিক নিরীক্ষা ও যাচাই নোট"}
                              </span>
                              <p className="text-blue-900 dark:text-blue-300 leading-relaxed">
                                {language === "en" ? item.officialNotes : item.officialNotesBn}
                              </p>
                            </div>
                          )}

                          {/* Chronological Milestone Timeline */}
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                              {language === "en"
                                ? "Milestone Audit Trail"
                                : "পদক্ষেপ ও মাইলস্টোন সময়রেখা"}
                            </span>

                            <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-2">
                              {item.timeline.map((mile) => (
                                <div key={mile.id} className="relative group">
                                  {/* Dot */}
                                  <div
                                    className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                      mile.statusTag === "completed"
                                        ? "bg-emerald-600"
                                        : mile.statusTag === "in_progress"
                                        ? "bg-blue-600"
                                        : "bg-slate-400"
                                    }`}
                                  />

                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {language === "en" ? mile.title : mile.titleBn || mile.title}
                                      </span>
                                      <span className="font-mono text-[10px] text-muted-foreground">
                                        {mile.date}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300">
                                      {language === "en"
                                        ? mile.description
                                        : mile.descriptionBn || mile.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Action Links (Verify / Apply / External) */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.verificationLink && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold gap-1.5"
                                >
                                  <Link to={item.verificationLink}>
                                    <ShieldCheck size={13} className="text-emerald-600" />
                                    <span>
                                      {language === "en" ? "Verify in DAR" : "অনলাইনে যাচাই করুন"}
                                    </span>
                                  </Link>
                                </Button>
                              )}

                              {item.applyLink && (
                                <Button
                                  asChild
                                  size="sm"
                                  className="h-8 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white gap-1.5"
                                >
                                  <Link to={item.applyLink}>
                                    <span>{language === "en" ? "Apply Online" : "আবেদন করুন"}</span>
                                    <ArrowRight size={13} />
                                  </Link>
                                </Button>
                              )}

                              {item.externalNoticeLink && (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-semibold gap-1.5"
                                >
                                  <a
                                    href={item.externalNoticeLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <span>
                                      {language === "en" ? "State Portal" : "রাজ্য পোর্টাল"}
                                    </span>
                                    <ExternalLink size={12} />
                                  </a>
                                </Button>
                              )}
                            </div>

                            {/* Submit Update for this Specific Item */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenReportModal(item)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 gap-1.5"
                            >
                              <PlusCircle size={13} />
                              <span>
                                {language === "en"
                                  ? "Report On-Ground Status"
                                  : "মাঠপর্যায়ের তথ্য দিন"}
                              </span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PUBLIC RECORD OF ALL UPDATES (CHRONOLOGICAL FEED)     */}
        {/* ============================================================ */}
        {activeTab === "updates" && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp size={18} className="text-emerald-400" />
                  <span>
                    {language === "en"
                      ? "Chronological Administrative Log"
                      : "কালানুক্রমিক প্রশাসনিক আপডেট ও গেজেট লগ"}
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  {language === "en"
                    ? "Time-stamped record of official notifications, camp outcomes, and site inspections."
                    : "বিজ্ঞপ্তি, ক্যাম্প ফলাফল ও পরিদর্শনের সরকারি কালানুক্রমিক বিবরণ।"}
                </p>
              </div>

              <Badge className="bg-emerald-600 text-white font-mono text-xs font-bold self-start sm:self-auto">
                Live Public Log
              </Badge>
            </div>

            {/* Updates List */}
            <div className="space-y-4">
              {citizenSubmissions.map((sub) => {
                const cfg = STATUS_CONFIG[sub.claimStatus] || STATUS_CONFIG.under_review;
                const matchedInit = TRACKER_INITIATIVES.find((i) => i.id === sub.initiativeId);
                const formattedDate = sub.submittedAt
                  ? new Date(sub.submittedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recent";
                return (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-700 text-white text-[10px]">Citizen Ground Report</Badge>
                        <span className="font-bold text-blue-900 dark:text-blue-300">
                          {matchedInit?.title || sub.initiativeId}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-muted-foreground">{formattedDate}</span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span>{language === "en" ? cfg.label : cfg.labelBn}</span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-950 dark:text-white leading-snug">
                      Reported by {sub.citizenName} ({sub.wardNumber})
                    </h4>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {sub.details}
                    </p>
                  </div>
                );
              })}

              {TRACKER_RECENT_UPDATES.map((upd) => {
                const cfg = STATUS_CONFIG[upd.status];

                return (
                  <div
                    key={upd.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 hover:border-blue-400 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900 dark:text-blue-300">
                          {upd.initiativeTitle}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-muted-foreground">{upd.date}</span>
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold uppercase ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span>{language === "en" ? cfg.label : cfg.labelBn}</span>
                      </div>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white leading-snug">
                      {language === "en" ? upd.headline : upd.headlineBn}
                    </h4>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {language === "en" ? upd.details : upd.detailsBn}
                    </p>

                    {upd.memoNo && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-mono">Reference Memo: {upd.memoNo}</span>
                        <Link
                          to={`/tracker?id=${upd.initiativeId}`}
                          onClick={() => {
                            setActiveTab("initiatives");
                            setExpandedCards({ [upd.initiativeId]: true });
                          }}
                          className="text-blue-800 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          <span>{language === "en" ? "View Initiative" : "উদ্যোগ দেখুন"}</span>
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* CITIZEN SUBMIT AN UPDATE / FEEDBACK MODAL                     */}
      {/* ============================================================ */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle size={18} className="text-blue-700" />
              <span>
                {language === "en"
                  ? "Submit An On-Ground Update"
                  : "মাঠপর্যায়ের তথ্য বা প্রমাণ দাখিল করুন"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {language === "en"
                ? "Help verify administrative progress by submitting real on-ground feedback or reporting delays."
                : "প্রশাসনিক অগ্রগতি যাচাইয়ে সহায়তা করতে আপনার প্রত্যক্ষ অভিজ্ঞতা বা তথ্য প্রদান করুন।"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCitizenReport} className="space-y-4 pt-2">
            {/* Initiative Picker */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">
                {language === "en" ? "Selected Initiative / Scheme" : "উদ্যোগ বা প্রকল্প নির্বাচন"}
              </Label>
              <select
                aria-label="Selected initiative for citizen report"
                value={selectedInitiativeForReport?.id || ""}
                onChange={(e) => {
                  const it = TRACKER_INITIATIVES.find((i) => i.id === e.target.value);
                  setSelectedInitiativeForReport(it || null);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TRACKER_INITIATIVES.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.title} ({it.officialMemoNo})
                  </option>
                ))}
              </select>
            </div>

            {/* Citizen Name & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold">
                  {language === "en" ? "Your Name (আপনার নাম)" : "আপনার নাম"}
                </Label>
                <Input
                  required
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Subir Biswas"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold">
                  {language === "en" ? "Sansad / Ward Number" : "সংসদ / ওয়ার্ড নম্বর"}
                </Label>
                <Input
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder="e.g. Sansad 04 (Stationpara)"
                  className="text-xs h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Observed Ground Status */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">
                {language === "en" ? "Observed Ground Status" : "মাঠপর্যায়ের পর্যবেক্ষণ"}
              </Label>
              <select
                aria-label="Observed Ground Status"
                value={citizenClaimStatus}
                onChange={(e) => setCitizenClaimStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="fulfilled">🟢 Fully Operational / Resolved (সম্পন্ন)</option>
                <option value="in_progress">🔵 In Progress / Active Work (চলমান)</option>
                <option value="under_review">🟡 Pending Inspection / Clearance (পর্যালোচনাধীন)</option>
                <option value="stalled">🔴 Delayed / Middleman Activity Reported (বিলম্বিত)</option>
              </select>
            </div>

            {/* Detailed Ground Report */}
            <div className="space-y-1">
              <Label className="text-xs font-bold">
                {language === "en" ? "Ground Details / Note" : "বিস্তারিত তথ্য বা প্রমাণপত্রের বিবরণ"}
              </Label>
              <Textarea
                required
                rows={3}
                value={citizenReportDetails}
                onChange={(e) => setCitizenReportDetails(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Describe what you observed at the camp desk or work site..."
                    : "ক্যাম্প ডেস্ক বা কাজের স্থানে আপনার প্রত্যক্ষ অভিজ্ঞতা লিখুন..."
                }
                className="text-xs rounded-xl"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border text-[11px] text-muted-foreground flex items-start gap-2">
              <Info size={14} className="text-blue-700 shrink-0 mt-0.5" />
              <span>
                {language === "en"
                  ? "Your update is saved to the Bagula 2 No. GP Supabase database and reflected in live public verification counts."
                  : "আপনার জমা দেওয়া তথ্য বগুলা ২ নং গ্রাম পঞ্চায়েতের ডাটাবেসে সংরক্ষিত হবে এবং নাগরিক যাচাইকরণ গণনায় প্রতিফলিত হবে।"}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-xs h-9 rounded-xl"
              >
                {language === "en" ? "Cancel" : "বাতিল"}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-9 rounded-xl font-bold bg-blue-900 hover:bg-blue-800 text-white gap-1.5"
              >
                <Send size={13} />
                <span>{language === "en" ? "Submit Record" : "দাখিল করুন"}</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
