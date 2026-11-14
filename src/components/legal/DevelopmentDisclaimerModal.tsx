import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Scale,
  Megaphone,
  Bell,
  ArrowRight,
  Info,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getActiveNotices, Notice } from "@/services/noticeService";

const STORAGE_KEY_DISCLAIMER = "b2gp_disclaimer_accepted_v2";
const STORAGE_PREFIX_NOTICE = "b2gp_notice_acknowledged_";

export function DevelopmentDisclaimerModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [stage, setStage] = useState<"disclaimer" | "announcement">("disclaimer");
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [isDeclined, setIsDeclined] = useState<boolean>(false);
  const [urgentNotice, setUrgentNotice] = useState<Notice | null>(null);

  // Check state on mount & fetch active urgent notice if any
  useEffect(() => {
    const checkStatus = async () => {
      const disclaimerAccepted = localStorage.getItem(STORAGE_KEY_DISCLAIMER) === "true";

      // Fetch notices to see if there is an unacknowledged urgent notice
      let activeUrgent: Notice | null = null;
      try {
        const notices = await getActiveNotices();
        const urgent = notices.find(
          (n) => (n.priority === "urgent" || n.is_pinned) && n.is_published
        );
        if (urgent) {
          const isAck = localStorage.getItem(`${STORAGE_PREFIX_NOTICE}${urgent.id}`) === "true";
          if (!isAck) {
            activeUrgent = urgent;
            setUrgentNotice(urgent);
          }
        }
      } catch (err) {
        console.warn("Could not load urgent notices for disclaimer modal:", err);
      }

      if (!disclaimerAccepted) {
        setStage("disclaimer");
        setIsOpen(true);
      } else if (activeUrgent) {
        setStage("announcement");
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkStatus();

    // Listen to manual open requests (e.g. from footer or settings)
    const handleManualOpen = () => {
      setIsDeclined(false);
      setIsChecked(true);
      setStage("disclaimer");
      setIsOpen(true);
    };

    window.addEventListener("open_disclaimer_modal", handleManualOpen);
    return () => {
      window.removeEventListener("open_disclaimer_modal", handleManualOpen);
    };
  }, []);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleAcceptDisclaimer = () => {
    if (!isChecked) return;
    localStorage.setItem(STORAGE_KEY_DISCLAIMER, "true");

    // If an urgent announcement exists that hasn't been acknowledged yet, transition to it
    if (urgentNotice && localStorage.getItem(`${STORAGE_PREFIX_NOTICE}${urgentNotice.id}`) !== "true") {
      setStage("announcement");
    } else {
      setIsOpen(false);
    }
  };

  const handleDeclineDisclaimer = () => {
    setIsDeclined(true);
  };

  const handleAcknowledgeAnnouncement = () => {
    if (urgentNotice) {
      localStorage.setItem(`${STORAGE_PREFIX_NOTICE}${urgentNotice.id}`, "true");
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-2xl my-auto bg-white rounded-3xl shadow-2xl border-2 border-amber-400/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Tricolor Identity Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600 border-b border-border/30" />

        {/* STAGE 1: DISCLAIMER GATE */}
        {stage === "disclaimer" && !isDeclined && (
          <>
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white border-b border-amber-200/80 flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-md border-2 border-amber-300">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    সক্রিয় উন্নয়ন ও পরীক্ষণ পর্যায় · Beta / Pilot Stage
                  </Badge>
                  <Badge className="bg-red-600 text-white text-[10px] font-bold">
                    আইনি দায়মুক্তি বাধ্যতামূলক
                  </Badge>
                </div>
                <h2 id="disclaimer-title" className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  বগুলা ২ নং গ্রাম পঞ্চায়েত ডিজিটাল সেবা বাতায়ন
                </h2>
                <p className="text-xs text-amber-900/90 font-medium">
                  বিকাশমান প্রক্রিয়ার আনুষ্ঠানিক সতর্কবার্তা ও আইনগত দায়মুক্তি সংক্রান্ত ঘোষণাপত্র
                </p>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-foreground/90 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 font-medium flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  নাগরিক ও ব্যবহারকারীদের অবগতির জন্য জানানো যাচ্ছে যে, এই প্ল্যাটফর্মটি বর্তমানে কারিগরি বিকাশ ও পরীক্ষামূলক পর্যায়ে রয়েছে। ওয়েবসাইটে প্রবেশ করতে নিচের প্রতিটি শর্ত ও দায়মুক্তি ধারা সচেতনভাবে মেনে নেওয়া বাধ্যতামূলক।
                </p>
              </div>

              {/* Legal Clauses List */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px]">১</span>
                    <span>সফটওয়্যার বিকাশ ও পরীক্ষামূলক পর্যায় (Prototyping &amp; Testing Phase)</span>
                  </h3>
                  <p className="text-muted-foreground text-[11.5px] pl-7">
                    এই ওয়েবসাইটটি সফটওয়্যার পরীক্ষণ, সিস্টেম অপ্টিমাইজেশন ও নাগরিক সেবা ডিজিটাইজেশনের প্রাথমিক/পাইলট পর্যায়ে রয়েছে। এটি এখনো সরকারিভাবে কোনো আনুষ্ঠানিক বা অপরিবর্তনীয় গেজেট হিসেবে বলবৎ নয়।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px]">২</span>
                    <span>বাস্তব ও সরকারি নথির সাথে তথ্যের সম্ভাব্য অমিল (Data Variance Notice)</span>
                  </h3>
                  <p className="text-muted-foreground text-[11.5px] pl-7">
                    এই পোর্টালে প্রদর্শিত বিভিন্ন নিয়মাবলী, তথ্য, নমুনা ফি, সময়সীমা, খসড়া আবেদনপত্র বা অন্যান্য নথিপত্রের বিবরণ বাস্তবের সরকারি ভৌত নথির (Official Physical Records) সাথে ভিন্ন বা অসম্পূর্ণ হতে পারে।
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
                  <h3 className="font-bold text-rose-950 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-[10px]">৩</span>
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-rose-700" />
                      <span>পঞ্চায়েত ও কর্মচারীদের আইনগত ও আর্থিক সম্পূর্ণ দায়মুক্তি (Complete Non-Liability)</span>
                    </span>
                  </h3>
                  <p className="text-rose-900/90 text-[11.5px] pl-7">
                    এই ওয়েবসাইটে প্রদর্শিত কোনো তথ্যের যথার্থতা, অসাবধানতাবশত ঘটে যাওয়া মুদ্রণ বা প্রযুক্তিগত ত্রুটি, সার্ভার জনিত বিভ্রাট কিংবা এখানে প্রাপ্ত তথ্যের ভিত্তিতে ব্যবহারকারী কর্তৃক গৃহীত কোনো সিদ্ধান্তের কারণে সৃষ্ট কোনো প্রকার ক্ষতি বা অসঙ্গতির জন্য <strong>বগুলা ২ নং গ্রাম পঞ্চায়েত কর্তৃপক্ষ, মাননীয়া প্রধান, উপপ্রধান, সকল নির্বাচিত সদস্যবৃন্দ, কার্যনির্বাহী সহকারী (EA), নির্মাণ সহায়ক (NS), সচিব বা পঞ্চায়েতের কোনো কর্মচারী কোনোভাবেই আইনত, দেওয়ানি, ফৌজদারি কিংবা আর্থিকভাবে দায়ী বা দায়বদ্ধ থাকবেন না।</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center text-[10px]">৪</span>
                    <span>সরকারি ফিজিক্যাল নথির চূড়ান্ত মান্যতা (Physical Records Supersede Digital View)</span>
                  </h3>
                  <p className="text-muted-foreground text-[11.5px] pl-7">
                    যেকোনো বিরোধ, অনুসন্ধান বা চূড়ান্ত সিদ্ধান্তের জন্য পঞ্চায়েত কার্যালয়ে রক্ষিত সরকারি ভৌত নথি, ক্যাশ রেজিস্টার, মাস্টার রেজিস্টার ও সরাসরি প্রশাসনিক আদেশই একমাত্র চূড়ান্ত ও প্রামাণ্য ভিত্তি হিসেবে গণ্য হবে।
                  </p>
                </div>
              </div>

              {/* Mandatory Checkbox */}
              <div className="pt-2">
                <label
                  htmlFor="disclaimer-accept-checkbox"
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                    isChecked
                      ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900"
                  }`}
                >
                  <input
                    id="disclaimer-accept-checkbox"
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setIsChecked(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-400 cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-semibold leading-relaxed select-none">
                    আমি সচেতনভাবে উপরোক্ত শর্তাবলী ও দায়মুক্তি সতর্কবার্তা সম্পূর্ণ পড়েছি, বুঝেছি এবং সত্য ও ন্যায়সঙ্গত বলে স্বীকার করে নিচ্ছি। (I have read, understood, and solemnly accept the prototyping disclaimer and non-liability terms).
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDeclineDisclaimer}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline py-1 px-2"
              >
                প্রবেশ করতে অনিচ্ছুক (Decline &amp; Exit)
              </button>

              <Button
                type="button"
                disabled={!isChecked}
                onClick={handleAcceptDisclaimer}
                className={`w-full sm:w-auto h-11 px-6 rounded-xl font-bold text-xs gap-2 transition-all shadow-md ${
                  isChecked
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed opacity-60"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>শর্তাবলী মেনে ওয়েবসাইটে প্রবেশ করুন (Accept &amp; Enter Portal)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {/* STAGE 1 (DECLINED VIEW): LOCKED STATE */}
        {stage === "disclaimer" && isDeclined && (
          <div className="p-6 sm:p-8 text-center space-y-5 my-auto">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center text-3xl border-2 border-rose-300 shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <Badge variant="outline" className="bg-rose-50 text-rose-900 border-rose-300 text-xs font-bold font-mono">
                প্রবেশাধিকার অবরুদ্ধ · Access Gated
              </Badge>
              <h3 className="text-xl font-bold text-foreground">
                আপনি শর্তাবলী গ্রহণ করেননি
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                বগুলা ২ নং গ্রাম পঞ্চায়েতের এই ডিজিটাল সিস্টেমটি উন্নয়ন ও পরীক্ষামূলক পর্যায়ে থাকায় দায়মুক্তি শর্তাবলী স্বীকার করা ব্যতিরেকে ওয়েবসাইটে প্রবেশ করা সম্ভব নয়।
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                onClick={() => {
                  setIsDeclined(false);
                  setIsChecked(false);
                }}
                className="w-full sm:w-auto h-10 px-6 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>পুনরায় শর্তাবলী পর্যালোচনা করুন (Review Terms)</span>
              </Button>
            </div>
          </div>
        )}

        {/* STAGE 2: SPECIAL / URGENT ANNOUNCEMENT GATE ("I GOT IT") */}
        {stage === "announcement" && urgentNotice && (
          <>
            {/* Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-br from-rose-50 via-amber-50/50 to-white border-b border-rose-200 flex items-start gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-md border-2 border-rose-300 animate-pulse">
                <Megaphone className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    <span>জরুরি পঞ্চায়েত বিজ্ঞপ্তি · Official Broadcast</span>
                  </Badge>
                  {urgentNotice.notice_no && (
                    <Badge variant="outline" className="text-[10px] font-mono border-rose-300 text-rose-900 bg-rose-100">
                      {urgentNotice.notice_no}
                    </Badge>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                  {urgentNotice.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  প্রকাশের তারিখ: {new Date(urgentNotice.published_at).toLocaleDateString("bn-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Announcement Details */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-foreground/90 leading-relaxed">
              <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/80 text-rose-950 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-normal">
                {urgentNotice.content}
              </div>

              {urgentNotice.created_by_name && (
                <div className="p-3 rounded-xl bg-slate-50 border text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>বিজ্ঞপ্তি প্রদানকারী কর্তৃপক্ষ:</span>
                  <strong className="text-foreground">{urgentNotice.created_by_name}</strong>
                </div>
              )}

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  ওয়েবসাইটে প্রবেশের পূর্বে এই বিশেষ বিজ্ঞপ্তিটি সতর্কতার সাথে পড়ার জন্য অনুরোধ করা হচ্ছে।
                </span>
              </div>
            </div>

            {/* Acknowledge Button */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-border flex items-center justify-end">
              <Button
                type="button"
                onClick={handleAcknowledgeAnnouncement}
                className="w-full sm:w-auto h-11 px-7 rounded-xl font-bold text-xs bg-rose-700 hover:bg-rose-800 text-white gap-2 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>আমি অবগত হলাম (I Got It / Understood)</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
