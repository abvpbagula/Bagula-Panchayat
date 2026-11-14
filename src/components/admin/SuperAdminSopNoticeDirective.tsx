import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Stamp,
  FolderArchive,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SuperAdminSopNoticeDirectiveProps {
  pendingCount?: number;
  issuedThisMonth?: number;
  warishTotal?: number;
  dependentTotal?: number;
}

export function SuperAdminSopNoticeDirective({
  pendingCount = 0,
  issuedThisMonth = 0,
  warishTotal = 0,
  dependentTotal = 0,
}: SuperAdminSopNoticeDirectiveProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [completedSopSteps, setCompletedSopSteps] = useState<{ [key: string]: boolean }>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

  const toggleSopStep = (stepKey: string) => {
    setCompletedSopSteps((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  };

  const completedCount = Object.values(completedSopSteps).filter(Boolean).length;
  const hasPendingBacklog = pendingCount > 0;

  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white to-sky-50/40 shadow-sm overflow-hidden transition-all">
      {/* Directive Header Banner */}
      <div className="p-4 sm:p-5 border-b border-amber-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>সুপার অ্যাডমিন দৈনিক এসওপি ও অধরা কাজের নির্দেশিকা</span>
              <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                (Super Admin SOP &amp; Directive Hub)
              </span>
            </h2>
            <Badge
              variant="outline"
              className={
                hasPendingBacklog
                  ? "bg-rose-50 text-rose-700 border-rose-300 font-mono text-[11px]"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-[11px]"
              }
            >
              {hasPendingBacklog ? `● ${pendingCount} Actions Required` : "● All Systems Operational"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {todayFormatted} • বগুলা ২ নং গ্রাম পঞ্চায়েত প্রশাসনিক নির্দেশাবলি
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-semibold text-muted-foreground">SOP Progress</p>
            <p className="text-xs font-bold text-foreground font-mono">
              {completedCount} / 4 Completed
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs gap-1 text-muted-foreground hover:text-foreground h-8"
          >
            {isExpanded ? (
              <>
                <span>সংকুচিত করুন</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>বিস্তারিত দেখুন</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Section 1: Urgent Action Required Cards (অধরা ও জরুরি কাজসমূহ) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>আজকের অধরা কাজ ও অবিলম্বে করণীয় (Pending Action Directive)</span>
              </h3>
              <span className="text-[11px] text-muted-foreground">অগ্রাধিকার ভিত্তিক তালিকা</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Task 1: Pending Signatures & Memos */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  hasPendingBacklog
                    ? "bg-rose-50/60 border-rose-200/90 shadow-2xs"
                    : "bg-emerald-50/50 border-emerald-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-rose-600">
                    <Stamp className="w-4 h-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      hasPendingBacklog
                        ? "bg-rose-100 text-rose-800 border-rose-300 text-[10px]"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]"
                    }
                  >
                    {hasPendingBacklog ? "অবিলম্বে করণীয়" : "সম্পন্ন"}
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  ডিজিটাল স্বাক্ষর ও মেমো রেজিস্ট্রি
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {hasPendingBacklog
                    ? `${pendingCount} টি ওয়ারিশ ও পোষ্য আবেদন পর্যালোচনা ও প্রধানের স্বাক্ষরের অপেক্ষায় রয়েছে।`
                    : "বর্তমানে কোনো আবেদন স্বাক্ষরের জন্য অপেক্ষমাণ নেই।"}
                </p>
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-rose-700">
                    {pendingCount} টি অপেক্ষমাণ
                  </span>
                  <Button
                    asChild
                    size="sm"
                    className="h-7 text-xs font-semibold px-2.5 gap-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs"
                  >
                    <Link to="/admin/review?kind=warish&tab=Pending%20Signature%20%26%20Memo%20Registration">
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Task 2: Birth Digitization Quality Check */}
              <div className="p-4 rounded-2xl border bg-amber-50/50 border-amber-200/80 shadow-2xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-amber-600">
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]"
                  >
                    দৈনিক ডিজিটাইজেশন
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  পুরোনো জন্ম নথি ডিজিটাইজেশন
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  গ্রাম পঞ্চায়েতের পুরোনো ভলিউম খতিয়ান থেকে নতুন জন্ম তথ্য এন্ট্রি ও ভেরিফিকেশন সম্পন্ন করুন।
                </p>
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">ডিজিটাইজেশন পোর্টাল</span>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-semibold px-2.5 gap-1 border-amber-300 text-amber-800 hover:bg-amber-100/70 rounded-lg"
                  >
                    <Link to="/birth-digitization-form">
                      <span>Add Entry</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Task 3: Security & DEO Logs Inspection */}
              <div className="p-4 rounded-2xl border bg-sky-50/50 border-sky-200/80 shadow-2xs">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center text-sky-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-sky-100 text-sky-800 border-sky-300 text-[10px]"
                  >
                    সিস্টেম নিরীক্ষা
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  কর্মী ও কিওস্ক অডিট লগ
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  সাইবার ক্যাফে ও ডিইও নোডের সাম্প্রতিক কার্যক্রম এবং অ্যাক্সেস লগ অননুমোদিত ব্যবহারের জন্য চেক করুন।
                </p>
                <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">রিয়েলটাইম মনিটর</span>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-semibold px-2.5 gap-1 border-sky-300 text-sky-800 hover:bg-sky-100/70 rounded-lg"
                  >
                    <Link to="/admin/activity">
                      <span>Inspect Logs</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Standard Operating Procedure (SOP) Interactive Checklist */}
          <div className="p-4 rounded-2xl bg-white border border-border/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  প্রমিত প্রশাসনিক কার্যপদ্ধতি (Super Admin Standard Operating Procedure)
                </h4>
              </div>
              <span className="text-[11px] text-muted-foreground">
                ধাপগুলোতে ক্লিক করে আজকের অগ্রগতি মার্ক করুন
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              {/* Step 1 */}
              <div
                onClick={() => toggleSopStep("step1")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  completedSopSteps.step1
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                    : "bg-slate-50/70 border-border/60 hover:bg-slate-100/70"
                }`}
              >
                <div className="mt-0.5">
                  {completedSopSteps.step1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    ধাপ ১: ইনকামিং আবেদন যাচাইকরণ (Morning Application Audit)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    ওয়ারিশ ও পোষ্য আবেদনের সাথে আপলোডকৃত আধার, ভোটার ও উত্তরাধিকার প্রমাণপত্রের সত্যতা যাচাই করুন।
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => toggleSopStep("step2")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  completedSopSteps.step2
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                    : "bg-slate-50/70 border-border/60 hover:bg-slate-100/70"
                }`}
              >
                <div className="mt-0.5">
                  {completedSopSteps.step2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    ধাপ ২: মেমো বরাদ্দ ও অনুমোদন (Memo Allotment &amp; Signing)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    সঠিক আবেদনসমূহে পঞ্চায়েত মেমো নম্বর জেনারেট করে ডিজিটাল স্বাক্ষর অথবা সিগনেচার স্ট্যাম্প কার্যকর করুন।
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => toggleSopStep("step3")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  completedSopSteps.step3
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                    : "bg-slate-50/70 border-border/60 hover:bg-slate-100/70"
                }`}
              >
                <div className="mt-0.5">
                  {completedSopSteps.step3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    ধাপ ৩: মাস্টার ডাটা ও নোটিশ আপডেট (Master Data Synchronization)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    গ্রাম বা ওয়ার্ডভিত্তিক কোনো নতুন পরিবর্তন থাকলে মাস্টার ডাটা আপডেট করুন এবং জনসাধারণের জন্য নোটিশ প্রকাশ করুন।
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => toggleSopStep("step4")}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                  completedSopSteps.step4
                    ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                    : "bg-slate-50/70 border-border/60 hover:bg-slate-100/70"
                }`}
              >
                <div className="mt-0.5">
                  {completedSopSteps.step4 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-foreground">
                    ধাপ ৪: দৈনিক রেজিস্টার ও ব্যাকআপ অডিট (Evening Registry Close)
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    আজকের ইস্যুকৃত সব সনদের কপি রেজিস্টারে এন্ট্রি নিশ্চিত করুন এবং ডেটাবেস স্কিমা সিঙ্ক পরীক্ষা করুন।
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
