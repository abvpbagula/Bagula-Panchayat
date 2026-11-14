import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Pause,
  Play,
  ExternalLink,
  MapPin,
  Clock,
  Tent,
  FileCheck,
  Building2,
} from "lucide-react";
import {
  getActiveNotices,
  Notice,
  DEFAULT_NOTICES,
  getNoticeGpDepartment,
} from "@/services/noticeService";
import { useAppSettings } from "@/lib/appSettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Dedicated camp date & statutory update items to guarantee high-priority Gram Panchayat announcements
const CAMP_AND_SPECIAL_UPDATES: Notice[] = [
  {
    id: "camp-duare-sarkar",
    notice_no: "B-II/CAMP/2026/08",
    title: "Special Warish & Mutation Facilitation Camp: Every Monday & Thursday at GP Auditorium",
    category: "camp",
    department: "Succession, Legal Heir & Citizen Welfare Department",
    department_bn: "ওয়ারিশান, উত্তরাধিকার ও নাগরিক পরিষেবা শাখা",
    content:
      "A dedicated facilitation desk is active at the Bagula II Gram Panchayat auditorium every Monday and Thursday (10:00 AM to 3:30 PM). Citizens can get their Warish (Legal Heir) draft documents pre-verified by Sansad representatives and submit succession applications without delays. Required: Original death certificate, family tree declaration, land ROR/Khatian copies.",
    is_pinned: true,
    is_published: true,
    priority: "urgent",
    target_audience: "citizens",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_name: "Sub-Registrar & Pradhan, Bagula-II GP",
  },
  {
    id: "camp-birth-verification",
    notice_no: "B-II/CAMP/2026/02",
    title: "Legacy Birth Certificate Digitization Drive: 1st Tuesday & 1st Wednesday Monthly Intake (Quota 100/day)",
    category: "camp",
    department: "Civil Registration & Vital Statistics Department",
    department_bn: "নাগরিক ও জন্ম-মৃত্যু নিবন্ধন বিভাগ",
    content:
      "Under Section 12/17 of the RBD Act 1969 & West Bengal Rules 2000, legacy handwritten birth certificates (issued prior to 2016) are verified in person against official Volume Registers. Citizen intake is conducted on the 1st Tuesday & 1st Wednesday of every month at Counter #2 (10:00 AM to 3:00 PM). Please carry original handwritten certificate or Police General Diary (GD) for lost records.",
    is_pinned: true,
    is_published: true,
    priority: "high",
    target_audience: "citizens",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_name: "Sub-Registrar, Bagula-II GP",
  },
  {
    id: "camp-prd-tax",
    notice_no: "B-II/CAMP/2026/14",
    title: "PRD Property Tax Clearance & Aadhaar-Linked Receipt Drive: Daily at GP Revenue Counter",
    category: "tax",
    department: "Revenue, Assessment & Property Tax Department (PRD Tax)",
    department_bn: "রাজস্ব, কর নির্ধারণ ও পঞ্চায়েত তহবিল শাখা",
    content:
      "Annual holding and panchayat property tax collection camp is active across all 30 Sansads. Pay online via prdtax.wb.gov.in or visit the GP revenue desk. Instant digitally signed QR receipts issued.",
    is_pinned: true,
    is_published: true,
    priority: "normal",
    target_audience: "citizens",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by_name: "Revenue Inspector, Bagula-II GP",
  },
];

export function AnnouncementTicker() {
  const { authority } = useAppSettings();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const fetched = await getActiveNotices();
        if (isMounted) {
          // Merge camp updates with database notices to ensure rich, informative marquee
          const existingIds = new Set((fetched || []).map((n) => n.id));
          const uniqueCamps = CAMP_AND_SPECIAL_UPDATES.filter((c) => !existingIds.has(c.id));
          const combined = [...uniqueCamps, ...(fetched && fetched.length > 0 ? fetched : DEFAULT_NOTICES)];
          setNotices(combined);
        }
      } catch (err) {
        console.warn("Could not fetch active notices for ticker, using defaults:", err);
        if (isMounted) setNotices([...CAMP_AND_SPECIAL_UPDATES, ...DEFAULT_NOTICES]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Emergency notice check from authority settings
  const hasEmergency = authority?.emergencyNoticeEnabled && authority?.emergencyNoticeTextEn;

  return (
    <>
      {/* ============================================================ */}
      {/* ANNOUNCEMENT TICKER CONTAINER                                */}
      {/* Fixed height to prevent Layout Shift (CLS) on mobile/desktop */}
      {/* Uses subtle background from 'muted' theme variable          */}
      {/* High-contrast text & official Gram Panchayat accents        */}
      {/* ============================================================ */}
      <aside
        aria-label="Official Announcements & Camp Dates Ticker"
        className="w-full h-10 sm:h-11 min-h-[40px] sm:min-h-[44px] bg-muted/80 backdrop-blur-sm border-b border-border/80 relative z-20 overflow-hidden select-none transition-colors"
      >
        <div className="max-w-7xl mx-auto h-full px-2 sm:px-4 flex items-center justify-between overflow-hidden">
          {/* STATIC LEFT BADGE: Gram Panchayat Identity (High Contrast) */}
          <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 pr-2 sm:pr-3 py-0.5 border-r border-border/80 z-10 bg-muted">
            {hasEmergency ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-amber-950 text-[10px] sm:text-xs font-bold uppercase tracking-wide animate-pulse shadow-xs">
                <AlertTriangle size={12} className="shrink-0" />
                <span>Alert</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-900 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wide shadow-xs">
                <Tent size={12} className="shrink-0 text-amber-400" />
                <span className="hidden xs:inline">Camp Dates</span>
                <span className="xs:hidden">Camps</span>
              </span>
            )}
            <span className="text-[11px] font-bold text-foreground hidden md:inline">
              Panchayat Updates:
            </span>
          </div>

          {/* MARQUEE STREAM: High-Contrast Scrolling Ticker */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-hidden relative mx-2 h-full flex items-center group cursor-pointer"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            tabIndex={0}
            role="region"
            aria-live="polite"
            aria-label="Panchayat announcements stream. Press space or click to pause."
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setIsPaused((prev) => !prev);
              }
            }}
          >
            {/* Visual gradient mask for smooth fade into edges */}
            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-muted to-transparent z-1 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-muted to-transparent z-1 pointer-events-none" />

            {loading ? (
              /* Accessible Zero-Shift Skeleton */
              <div className="flex items-center gap-6 text-xs text-muted-foreground w-full animate-pulse">
                <div className="h-3 w-40 bg-foreground/10 rounded-full" />
                <div className="h-3 w-64 bg-foreground/10 rounded-full hidden sm:block" />
                <div className="h-3 w-52 bg-foreground/10 rounded-full hidden md:block" />
              </div>
            ) : (
              <div
                className="flex items-center gap-8 whitespace-nowrap text-xs text-foreground py-0.5 animate-marquee"
                style={{
                  display: "inline-flex",
                  animationPlayState: isPaused ? "paused" : "running",
                }}
              >
                {/* Emergency Notice if enabled */}
                {hasEmergency && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedNotice({
                        id: "emergency-notice",
                        title: "Emergency Administrative Notice",
                        content: `${authority.emergencyNoticeTextEn} ${
                          authority.emergencyNoticeTextBn ? `\n\n${authority.emergencyNoticeTextBn}` : ""
                        }`,
                        priority: "urgent",
                        category: "emergency",
                        published_at: new Date().toISOString(),
                        effective_date: new Date().toISOString().slice(0, 10),
                        is_pinned: true,
                        is_published: true,
                        target_audience: "citizens",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      })
                    }
                    className="inline-flex items-center gap-2 font-bold text-amber-900 bg-amber-100/90 dark:bg-amber-950/80 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-300 hover:underline cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block shrink-0" />
                    <span>{authority.emergencyNoticeTextEn}</span>
                    {authority.emergencyNoticeTextBn && (
                      <span className="font-bengali font-normal text-[11px] opacity-90">
                        ({authority.emergencyNoticeTextBn})
                      </span>
                    )}
                  </button>
                )}

                {/* Primary Notice Items */}
                {notices.map((n, idx) => {
                  const isCamp =
                    n.category === "camp" ||
                    n.title.toLowerCase().includes("camp") ||
                    n.title.toLowerCase().includes("drive");
                  const dept = getNoticeGpDepartment(n);

                  return (
                    <button
                      type="button"
                      key={n.id || idx}
                      onClick={() => setSelectedNotice(n)}
                      className="inline-flex items-center gap-2 text-foreground hover:text-blue-900 dark:hover:text-blue-400 group cursor-pointer transition-colors focus:outline-none focus:underline"
                    >
                      {/* Priority / Category Pill */}
                      {isCamp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200">
                          <Tent size={10} className="text-emerald-700" />
                          <span>Camp</span>
                        </span>
                      ) : n.priority === "urgent" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                          <Bell size={10} className="text-amber-700" />
                          <span>Urgent</span>
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 inline-block shrink-0" />
                      )}

                      {/* GP Department Tag */}
                      <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded shrink-0 hidden sm:inline-flex items-center gap-1">
                        <Building2 size={9} className="text-blue-700" />
                        <span>{dept.code}</span>
                      </span>

                      {/* Notice Title */}
                      <span className="font-semibold text-foreground group-hover:underline">
                        {n.title}
                      </span>

                      {/* Reference No or Date */}
                      {n.notice_no && (
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground">
                          {n.notice_no}
                        </span>
                      )}

                      <span className="text-muted-foreground/60 select-none">·</span>
                    </button>
                  );
                })}

                {/* Duplicate items for seamless continuous marquee loop */}
                {notices.map((n, idx) => {
                  const isCamp =
                    n.category === "camp" ||
                    n.title.toLowerCase().includes("camp") ||
                    n.title.toLowerCase().includes("drive");
                  const dept = getNoticeGpDepartment(n);

                  return (
                    <button
                      type="button"
                      key={`dup-${n.id || idx}`}
                      onClick={() => setSelectedNotice(n)}
                      className="inline-flex items-center gap-2 text-foreground hover:text-blue-900 dark:hover:text-blue-400 group cursor-pointer transition-colors focus:outline-none focus:underline"
                      aria-hidden="true"
                    >
                      {isCamp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200">
                          <Tent size={10} className="text-emerald-700" />
                          <span>Camp</span>
                        </span>
                      ) : n.priority === "urgent" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-200">
                          <Bell size={10} className="text-amber-700" />
                          <span>Urgent</span>
                        </span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-700 inline-block shrink-0" />
                      )}

                      {/* GP Department Tag */}
                      <span className="text-[10px] font-semibold text-blue-900 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded shrink-0 hidden sm:inline-flex items-center gap-1">
                        <Building2 size={9} className="text-blue-700" />
                        <span>{dept.code}</span>
                      </span>

                      <span className="font-semibold text-foreground group-hover:underline">
                        {n.title}
                      </span>

                      {n.notice_no && (
                        <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground">
                          {n.notice_no}
                        </span>
                      )}

                      <span className="text-muted-foreground/60 select-none">·</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STATIC RIGHT CONTROLS: Pause/Play & Direct Notice Board Link */}
          <div className="shrink-0 flex items-center gap-1 sm:gap-1.5 pl-2 sm:pl-3 border-l border-border/80 z-10 bg-muted">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-md text-foreground/80 hover:text-foreground hover:bg-muted-foreground/10 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
              title={isPaused ? "Play scrolling ticker (Space)" : "Pause scrolling ticker (Space)"}
              aria-label={isPaused ? "Resume announcements marquee" : "Pause announcements marquee"}
            >
              {isPaused ? <Play size={13} className="text-blue-900 dark:text-blue-400" /> : <Pause size={13} />}
            </button>

            <Link
              to="/?section=notices#notices"
              className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 dark:text-blue-400 hover:text-blue-950 px-2 py-0.5 rounded hover:bg-muted-foreground/10 transition-colors"
            >
              <span>All Notices</span>
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </aside>

      {/* NOTICE & CAMP DETAIL DIALOG */}
      <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
        <DialogContent className="sm:max-w-lg">
          {(() => {
            const dept = selectedNotice ? getNoticeGpDepartment(selectedNotice) : null;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider font-bold ${
                        selectedNotice?.category === "camp"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : selectedNotice?.priority === "urgent"
                          ? "bg-rose-50 text-rose-800 border-rose-300"
                          : "bg-blue-50 text-blue-800 border-blue-300"
                      }`}
                    >
                      {selectedNotice?.category === "camp"
                        ? "Special Camp & Drive"
                        : selectedNotice?.category || "Notice"}
                    </Badge>
                    {dept && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        <Building2 size={10} className="text-blue-700" />
                        <span>{dept.code}</span>
                      </span>
                    )}
                    {selectedNotice?.notice_no && (
                      <span className="font-mono text-xs text-muted-foreground ml-auto">
                        {selectedNotice.notice_no}
                      </span>
                    )}
                  </div>

                  <DialogTitle className="text-base font-bold text-foreground leading-snug">
                    {selectedNotice?.title}
                  </DialogTitle>

                  <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} className="text-muted-foreground" />
                      <span>
                        Effective:{" "}
                        {selectedNotice?.effective_date
                          ? new Date(selectedNotice.effective_date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Immediate"}
                      </span>
                    </span>
                  </DialogDescription>
                </DialogHeader>

                {/* GP DEPARTMENT & ISSUING AUTHORITY BOX */}
                {dept && (
                  <div className="rounded-xl p-3 bg-muted/70 border border-border/80 space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                          <Building2 size={11} className="text-blue-700" />
                          <span>Panchayat Department (গ্রাম পঞ্চায়েত বিভাগ)</span>
                        </div>
                        <p className="font-bold text-foreground text-xs sm:text-sm">
                          {dept.name}
                        </p>
                        <p className="font-bengali text-[11px] text-muted-foreground">
                          {dept.name_bn} · <span className="font-sans font-medium text-foreground/80">{dept.desk}</span>
                        </p>
                      </div>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-border font-bold shrink-0">
                        {dept.code}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 text-foreground/90">
                        <FileCheck size={12} className="text-emerald-600 shrink-0" />
                        <span>
                          <strong>Issued by (দ্বারা জারি):</strong>{" "}
                          {selectedNotice?.created_by_name || "Gram Panchayat Authorized Authority"}
                        </span>
                      </span>
                      <span className="text-muted-foreground text-[10px]">
                        Bagula II Gram Panchayat
                      </span>
                    </div>
                  </div>
                )}

                {/* Content Body */}
                <div className="py-2 text-xs leading-relaxed text-foreground whitespace-pre-line max-h-64 overflow-y-auto border-t border-b border-border/50 my-2">
                  {selectedNotice?.content}
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    to="/?section=notices#notices"
                    onClick={() => setSelectedNotice(null)}
                    className="text-xs text-blue-800 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <span>View in Panchayat Notice Board</span>
                    <ExternalLink size={12} />
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedNotice(null)}
                    className="text-xs h-8 px-3"
                  >
                    Close
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}
