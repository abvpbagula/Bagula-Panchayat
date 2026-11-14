import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Database, CheckCircle2, ArrowRight, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import {
  submitPublicServiceApplication,
  type PublicServiceApplicationSubmission,
} from "@/lib/publicCitizenBackendService";

interface PublicFormBackendBannerProps {
  serviceCode: PublicServiceApplicationSubmission["serviceCode"];
  serviceTitle: string;
  serviceTitleBn: string;
  defaultApplicantName?: string;
  defaultSubjectName?: string;
}

export const PublicFormBackendBanner: React.FC<PublicFormBackendBannerProps> = ({
  serviceCode,
  serviceTitle,
  serviceTitleBn,
  defaultApplicantName = "",
  defaultSubjectName = "",
}) => {
  const [applicantName, setApplicantName] = useState(defaultApplicantName);
  const [subjectName, setSubjectName] = useState(defaultSubjectName);
  const [wardNumber, setWardNumber] = useState("Ward 04 (Stationpara)");
  const [mobileNumber, setMobileNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState<string | null>(null);

  const handleRegisterOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      toast.error("Please enter the Applicant Name to generate a live Tracking Reference ID.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitPublicServiceApplication({
        serviceCode,
        serviceTitle,
        serviceTitleBn,
        applicantName: applicantName.trim(),
        subjectOrDeceasedName: subjectName.trim() || undefined,
        mobileNumber: mobileNumber.trim() || undefined,
        wardNumber: wardNumber.trim() || "Ward 04",
        village: "Bagula",
        payload: {
          submittedVia: "Cyber Cafe & Assisted Form Registration",
          timestamp: new Date().toISOString(),
        },
      });

      setGeneratedRefId(result.referenceId);
      toast.success(
        `Application registered in Panchayat DAR! Reference ID: ${result.referenceId}`
      );
    } catch (err: any) {
      toast.error(err?.message || "Could not register application.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRef = () => {
    if (!generatedRefId) return;
    navigator.clipboard?.writeText(generatedRefId);
    toast.success("Tracking Reference ID copied to clipboard!");
  };

  return (
    <div className="no-print mb-6 rounded-2xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-900 dark:text-blue-300">
              <Database size={12} aria-hidden="true" />
              Supabase DAR Connected
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold">{serviceTitleBn}</span>
          </div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Step 1: Register Application in Live Panchayat Database for Online Tracking
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Save your application details to the Digital Administrative Register (DAR) to receive an instant{" "}
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              B2GP-2026-XXXX
            </span>{" "}
            Tracking ID before printing your physical A4 form.
          </p>
        </div>

        {generatedRefId ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 shrink-0">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Live Reference ID Generated</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black tabular-nums text-emerald-950 dark:text-white">
                  {generatedRefId}
                </span>
                <button
                  type="button"
                  onClick={copyRef}
                  className="p-1 rounded hover:bg-emerald-100 text-emerald-800"
                  title="Copy Reference ID"
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>

            <Button
              asChild
              size="sm"
              className="h-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5"
            >
              <Link to={`/track?tab=track&search=${encodeURIComponent(generatedRefId)}`}>
                <span>Track Live Status</span>
                <ArrowRight size={13} />
              </Link>
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleRegisterOnline}
            className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 w-full lg:w-auto lg:min-w-[540px]"
          >
            <Input
              required
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="Applicant Full Name *"
              className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800"
            />
            <Input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Child / Deceased Name"
              className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800"
            />
            <Input
              value={wardNumber}
              onChange={(e) => setWardNumber(e.target.value)}
              placeholder="Sansad / Ward (e.g. Ward 04)"
              className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold gap-1.5"
            >
              <Send size={13} />
              <span>{submitting ? "Saving..." : "Save & Get Tracking ID"}</span>
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
