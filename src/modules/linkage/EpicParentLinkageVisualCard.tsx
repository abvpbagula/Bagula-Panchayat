import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle, ShieldCheck, UserCheck } from "lucide-react";
import type { EpicParentLinkageData } from "./epicParentLinkageTypes";

interface Props {
  data: EpicParentLinkageData;
  className?: string;
  showVerificationStamp?: boolean;
}

export default function EpicParentLinkageVisualCard({
  data,
  className = "",
  showVerificationStamp = true,
}: Props) {
  const isFather = data.linkFather || data.linkageSelection === "father" || data.linkageSelection === "both";
  const isMother = data.linkMother || data.linkageSelection === "mother" || data.linkageSelection === "both";

  const memberVer = data.memberVerification;
  const isVerified = memberVer?.overallStatus === "verified";

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Visual Relationship Structure */}
      <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-b from-primary/5 via-background to-emerald-500/5 p-5 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🪪</span>
            <div>
              <h4 className="text-sm font-bold text-foreground">
                Parent Linkage Structure / অভিভাবক সংযোগ নকশা
              </h4>
              <p className="text-xs text-muted-foreground">
                Statutory Parent-Child Linkage for Electoral Roll (EPIC) Enrolment
              </p>
            </div>
          </div>
          <Badge
            variant={isVerified ? "default" : "outline"}
            className={
              isVerified
                ? "bg-emerald-600 text-white font-semibold"
                : "border-amber-400 text-amber-800 bg-amber-50"
            }
          >
            {isVerified ? "Member Verified" : "Electoral Linkage Model"}
          </Badge>
        </div>

        {/* Node 1: Married Daughter Applicant */}
        <div className="max-w-md mx-auto">
          <div className="rounded-xl border-2 border-indigo-400/60 bg-white p-3.5 shadow-sm text-center">
            <Badge className="bg-indigo-600 text-white text-[10px] mb-1 font-semibold">
              Applicant / Married Daughter (বিবাহিতা কন্যা)
            </Badge>
            <h3 className="text-base font-bold text-foreground">
              {data.applicantFullName || "Applicant Full Name"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              W/O: {data.husbandName || "Husband's Name"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              📍 {data.villagePara || "Bagula II"}, {data.sansadNo || "Sansad"} · Hanskhali, Nadia
            </p>
            {data.applicantEpicNo && (
              <p className="text-[11px] font-mono text-indigo-700 mt-0.5 font-semibold">
                EPIC: {data.applicantEpicNo}
              </p>
            )}
          </div>
        </div>

        {/* Connector Line */}
        <div className="flex flex-col items-center my-2">
          <div className="w-0.5 h-6 bg-indigo-300" />
          <div className="px-2 py-0.5 rounded-full bg-slate-100 border text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
            Biological Parent Linkage (জন্মদাতা সম্পর্ক)
          </div>
          <div className="w-0.5 h-6 bg-indigo-300" />
        </div>

        {/* Node 2: Biological Parents (1 or 2 cards based on selection) */}
        <div
          className={`grid gap-4 ${
            isFather && isMother ? "sm:grid-cols-2" : "max-w-md mx-auto"
          }`}
        >
          {isFather && (
            <div className="rounded-xl border-2 border-emerald-400/60 bg-emerald-50/50 p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <Badge className="bg-emerald-700 text-white text-[10px] font-semibold">
                  Biological Father (জন্মদাতা পিতা)
                </Badge>
                {memberVer?.fatherStatus === "verified" ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : memberVer?.fatherStatus === "correction_required" ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                    <AlertCircle className="w-3.5 h-3.5" /> Correction
                  </span>
                ) : null}
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {data.fatherElectoral?.fullName || data.fatherName || "Father's Full Name"}
              </h4>
              <div className="mt-2 space-y-1 text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voter ID (EPIC):</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {data.fatherElectoral?.epicNo || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Part No / Sl No:</span>
                  <span className="font-semibold">
                    Part {data.fatherElectoral?.partNo || "—"} / Sl {data.fatherElectoral?.serialNo || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Electoral Roll:</span>
                  <span className="text-[11px]">
                    {data.fatherElectoral?.electoralRollYear || "Draft Roll 2025"}
                  </span>
                </div>
                <div className="pt-1 text-[10px] text-slate-500 border-t">
                  {data.fatherElectoral?.assemblyConstituency ||
                    "89 - Ranaghat (S.C.) North East Assembly Constituency"}
                </div>
              </div>
            </div>
          )}

          {isMother && (
            <div className="rounded-xl border-2 border-emerald-400/60 bg-emerald-50/50 p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <Badge className="bg-emerald-700 text-white text-[10px] font-semibold">
                  Biological Mother (জন্মদাত্রী মাতা)
                </Badge>
                {memberVer?.motherStatus === "verified" ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                ) : memberVer?.motherStatus === "correction_required" ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                    <AlertCircle className="w-3.5 h-3.5" /> Correction
                  </span>
                ) : null}
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {data.motherElectoral?.fullName || data.motherName || "Mother's Full Name"}
              </h4>
              <div className="mt-2 space-y-1 text-xs text-slate-700 bg-white/80 p-2 rounded-lg border border-emerald-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voter ID (EPIC):</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {data.motherElectoral?.epicNo || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Part No / Sl No:</span>
                  <span className="font-semibold">
                    Part {data.motherElectoral?.partNo || "—"} / Sl {data.motherElectoral?.serialNo || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Electoral Roll:</span>
                  <span className="text-[11px]">
                    {data.motherElectoral?.electoralRollYear || "Draft Roll 2025"}
                  </span>
                </div>
                <div className="pt-1 text-[10px] text-slate-500 border-t">
                  {data.motherElectoral?.assemblyConstituency ||
                    "89 - Ranaghat (S.C.) North East Assembly Constituency"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Member Formal Declaration & Stamp (if verified) */}
      {showVerificationStamp && isVerified && memberVer?.memberDeclarationText && (
        <Card className="p-4 bg-emerald-50/70 border-2 border-emerald-400 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Gram Sansad Member Formal Declaration (সদস্যের প্রত্যয়নপত্র)</span>
          </div>
          <p className="italic text-slate-800 leading-relaxed bg-white/90 p-3 rounded-xl border border-emerald-200">
            "{memberVer.memberDeclarationText}"
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-950 font-medium border-t border-emerald-200">
            <div>
              <span className="font-bold">{memberVer.verifyingMemberName}</span> ·{" "}
              <span>{memberVer.designation}</span> (Ward {memberVer.wardNumber}, Sansad {memberVer.sansadNo})
            </div>
            <div className="font-mono text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
              Sign: {memberVer.signatureHash}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
