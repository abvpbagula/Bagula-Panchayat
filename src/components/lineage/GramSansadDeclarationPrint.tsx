import React from "react";
import {
  Printer,
  ShieldCheck,
  Building2,
  Scale,
  Award,
  Calendar,
  CheckCircle2,
  FileCheck2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScStLineageCase } from "@/types/scStLineageTypes";

interface Props {
  caseData: ScStLineageCase;
  onPrint?: () => void;
}

export const GramSansadDeclarationPrint: React.FC<Props> = ({ caseData, onPrint }) => {
  const { applicant, existingCertificateHolder, treeNodes, currentDeclaration } = caseData;

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

  // Group nodes by generation
  const sortedNodes = [...treeNodes].sort((a, b) => b.generationLevel - a.generationLevel);

  return (
    <div className="space-y-4">
      {/* Top Action Bar (hidden in print) */}
      <div className="print:hidden flex items-center justify-between p-3.5 bg-muted/40 rounded-2xl border border-border/60">
        <div>
          <h4 className="text-sm font-bold text-foreground">
            Printable Gram Sansad Vamshabriksha &amp; Declaration Sheet
          </h4>
          <p className="text-xs text-muted-foreground">
            Formatted on official Bagula II GP standard letterhead with dual signatories and verification hash.
          </p>
        </div>
        <Button onClick={handlePrint} size="sm" className="bg-primary text-primary-foreground gap-1.5 shadow-xs">
          <Printer size={14} />
          <span>Print Declaration Sheet</span>
        </Button>
      </div>

      {/* PRINT-OPTIMIZED CONTAINER */}
      <div
        id="sc-st-lineage-print-area"
        className="bg-white text-slate-900 border border-slate-300 p-8 sm:p-10 rounded-2xl shadow-sm space-y-6 max-w-4xl mx-auto font-serif text-[13px] leading-relaxed print:p-0 print:border-none print:shadow-none print:max-w-none print:m-0"
      >
        {/* OFFICIAL LETTERHEAD */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-600">
            Government of West Bengal · Directorate of Backward Classes Welfare
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 uppercase">
            Office of the Bagula II Gram Panchayat
          </h1>
          <div className="text-xs font-sans text-slate-700">
            P.O. Bagula, P.S. Hanskhali, Block: Hanskhali, Dist: Nadia, West Bengal, PIN: 741502
          </div>
          <div className="inline-block mt-1 px-3 py-1 bg-slate-100 rounded border border-slate-300 text-xs font-sans font-bold uppercase tracking-wide">
            Gram Sansad Paternal Vamshabriksha &amp; Caste Relationship Declaration
          </div>
          <div className="text-[11px] font-sans text-slate-500 mt-0.5">
            Issued under Section 5 of the West Bengal SC/ST (Identification) Act, 1994 &amp; Rule 3 of 1995 Rules
          </div>
        </div>

        {/* METADATA BAR */}
        <div className="flex items-center justify-between text-xs font-mono border-b border-slate-200 pb-2 text-slate-700 flex-wrap gap-2">
          <div>
            Case Ref: <strong>{caseData.caseId}</strong>
          </div>
          <div>
            Sansad / Ward: <strong>Ward No. {applicant.gramSansadWardNo}</strong> (Booth Part No. 24)
          </div>
          <div>
            Verification Ref: <strong>{currentDeclaration?.verificationHash || "PENDING-FINAL-SEAL"}</strong>
          </div>
        </div>

        {/* STATUTORY PREAMBLE & DISCLAIMER */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs font-sans space-y-1 text-slate-800">
          <p className="font-bold flex items-center gap-1.5 text-slate-900">
            <Scale size={13} className="text-slate-700" />
            Statutory Scope &amp; Legal Character:
          </p>
          <p className="text-[11px] leading-relaxed">
            This document represents an authenticated <strong>Gram Sansad Paternal Genealogical Tree (Vamshabriksha) &amp; Bloodline Declaration</strong> executed by the elected Gram Sansad Member and attested by Bagula II Gram Panchayat. It is tendered as primary supporting evidence of paternal lineage for online application on <strong>castecertificatewb.gov.in (OSCAR)</strong>. Statutory issuance of the final Scheduled Caste / Scheduled Tribe Certificate is the sole jurisdiction of the Sub-Divisional Officer (SDO) / Competent Authority.
          </p>
        </div>

        {/* SECTION 1: APPLICANT PARTICULARS */}
        <div className="space-y-2">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            1. Applicant Particulars (আবেদনকারীর বিবরণ)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Full Legal Name:</span>
              <span className="font-bold text-slate-950 uppercase">{applicant.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Biological Father:</span>
              <span className="font-bold text-slate-950 uppercase">{applicant.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Biological Mother:</span>
              <span className="font-bold text-slate-950 uppercase">{applicant.motherName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Village / Para:</span>
              <span className="font-medium text-slate-900">{applicant.villagePara}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Post Office &amp; P.S.:</span>
              <span className="font-medium text-slate-900">{applicant.postOffice}, {applicant.policeStation}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Target Caste &amp; Sub-caste:</span>
              <span className="font-bold text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                {applicant.targetSubCaste}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: EXISTING PATERNAL SC/ST CERTIFICATE HOLDER */}
        <div className="space-y-2">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 flex items-center justify-between">
            <span>2. Existing Paternal SC/ST Certificate Holder (প্রমাণক সার্টিফিকেটধারী)</span>
            <span className="text-[10px] text-slate-500 font-normal">Agnatic Paternal Bloodline</span>
          </h3>
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-500 block text-[11px]">Certificate Holder Name:</span>
              <span className="font-bold text-slate-900 uppercase">{existingCertificateHolder.holderName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Paternal Relationship:</span>
              <span className="font-bold text-amber-900">{existingCertificateHolder.relationshipToApplicant}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">SC/ST Certificate No:</span>
              <span className="font-mono font-bold text-slate-900">{existingCertificateHolder.certificateNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Issuing Authority &amp; Date:</span>
              <span className="text-slate-800">{existingCertificateHolder.issuingAuthority} ({existingCertificateHolder.issueDate})</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: RECURSIVE PATERNAL FAMILY TREE (VAMSHABRIKSHA) TABLE */}
        <div className="space-y-2">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            3. Authenticated Paternal Vamshabriksha (পৈতৃক বংশতালিকা)
          </h3>
          <p className="text-[11px] text-slate-600">
            Genealogical chain of descent tracing from root paternal ancestor through intermediate generations down to applicant:
          </p>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-sans font-bold text-left">
                <th className="border border-slate-300 py-1.5 px-2">Gen</th>
                <th className="border border-slate-300 py-1.5 px-2">Relative Full Name</th>
                <th className="border border-slate-300 py-1.5 px-2">Relationship to Applicant</th>
                <th className="border border-slate-300 py-1.5 px-2">Status / Village</th>
                <th className="border border-slate-300 py-1.5 px-2">Caste Cert / Evidence Reference</th>
              </tr>
            </thead>
            <tbody>
              {sortedNodes.map((n) => (
                <tr
                  key={n.id}
                  className={
                    n.isCertificateHolder
                      ? "bg-amber-50 font-semibold"
                      : n.isApplicant
                      ? "bg-blue-50 font-semibold"
                      : ""
                  }
                >
                  <td className="border border-slate-300 py-1.5 px-2 font-mono text-[11px]">
                    L-{n.generationLevel}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2">
                    {n.fullName} {n.isApplicant && "(APPLICANT)"} {n.isCertificateHolder && "(CERT HOLDER)"}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-[11px]">
                    {n.relationshipToApplicant}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-[11px]">
                    {n.status} · {n.villagePara}
                  </td>
                  <td className="border border-slate-300 py-1.5 px-2 text-[11px] font-mono">
                    {n.isCertificateHolder
                      ? `SC Cert: ${n.casteCertDetails?.certNo || "Attached"}`
                      : n.supportingDocRef || "Local Record"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 4: MEMBER VERIFICATION FINDINGS */}
        {currentDeclaration && (
          <div className="space-y-2">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
              4. Local Inquiry Observations of Gram Sansad Member
            </h3>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
              <p className="italic text-slate-800 leading-relaxed">
                &ldquo;{currentDeclaration.memberObservations}&rdquo;
              </p>
              {currentDeclaration.localWitnessNames && currentDeclaration.localWitnessNames.length > 0 && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  <span className="font-bold">Local Ward Witnesses / Co-residents:</span>{" "}
                  {currentDeclaration.localWitnessNames.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: STATUTORY MEMBER DECLARATION (MANDATORY EXACT CLAUSE) */}
        <div className="p-4 bg-slate-100 rounded-xl border-2 border-slate-800 text-xs space-y-2">
          <div className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-emerald-700" />
            <span>Formal Declaration of Elected Gram Sansad Member</span>
          </div>

          <div className="p-3 bg-white rounded border border-slate-300 font-serif text-sm font-semibold text-slate-950 leading-relaxed">
            &ldquo;I have examined the submitted lineage information and supporting records and declare that the above paternal relationship information is based on the records/evidence placed before me.&rdquo;
          </div>

          <p className="font-bengali text-xs text-slate-800 leading-normal">
            &ldquo;আমি দাখিলকৃত বংশতালিকা ও সহযোগী নথিপত্র পরীক্ষা ও স্থানীয়ভাবে অনুসন্ধানপূর্বক ঘোষণা করিতেছি যে, উপরোক্ত পৈতৃক রক্তের সম্পর্ক এবং বংশলতিকার তথ্য আমার নিকট উপস্থাপিত প্রমাণ ও তথ্যাবলীর ভিত্তিতে সঠিক।&rdquo;
          </p>
        </div>

        {/* SECTION 6: DUAL SIGNATURES & OFFICIAL SEALS */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs font-sans">
          {/* LEFT: GRAM SANSAD MEMBER */}
          <div className="space-y-2 border border-slate-300 p-4 rounded-lg bg-slate-50">
            <div className="h-14 flex flex-col justify-end items-center">
              <span className="font-mono text-[11px] text-slate-700 font-bold">
                {currentDeclaration?.digitalSignatureHash || "SIGNED ELECTRONICALLY"}
              </span>
              <span className="text-[10px] text-slate-500">
                Timestamp: {currentDeclaration ? new Date(currentDeclaration.timestamp).toLocaleString("en-IN") : "—"}
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1 space-y-0.5">
              <div className="font-bold text-slate-950">
                {currentDeclaration?.memberName || "Gram Sansad Member"}
              </div>
              <div className="text-[11px] text-slate-700">
                Elected Member, Gram Sansad No. {applicant.gramSansadWardNo}
              </div>
              <div className="text-[10px] text-slate-500">
                Bagula II Gram Panchayat, Nadia
              </div>
              <div className="text-[10px] font-mono text-slate-600 mt-1">
                [ Member Round Seal ]
              </div>
            </div>
          </div>

          {/* RIGHT: PANCHAYAT OFFICE COUNTER-SIGNATORY */}
          <div className="space-y-2 border border-slate-300 p-4 rounded-lg bg-slate-50">
            <div className="h-14 flex flex-col justify-end items-center">
              <span className="text-[10px] text-slate-400 italic">
                (Physical Counter-Signature &amp; Round Office Seal)
              </span>
            </div>
            <div className="border-t border-slate-400 pt-1 space-y-0.5">
              <div className="font-bold text-slate-950">
                Executive Assistant / Prodhan
              </div>
              <div className="text-[11px] text-slate-700">
                Bagula II Gram Panchayat
              </div>
              <div className="text-[10px] text-slate-500">
                Hanskhali Development Block, Nadia
              </div>
              <div className="text-[10px] font-mono text-slate-600 mt-1">
                [ Official GP Round Seal ]
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER NOTICE / OSCAR UPLOAD GUIDELINE */}
        <div className="border-t border-slate-300 pt-3 text-[11px] font-sans text-slate-500 text-center space-y-0.5">
          <p className="font-bold text-slate-700">
            Office Upload Preparation Rule (অফিস নথি প্রস্তুতি নির্দেশিকা):
          </p>
          <p>
            Merge this authenticated declaration sheet with the clear scanned copy of the existing SC/ST certificate into a single PDF document (recommended size &lt; 2 MB) for direct upload on <strong>castecertificatewb.gov.in (OSCAR)</strong> portal.
          </p>
          <p className="font-mono text-[10px] text-slate-400">
            Audit Hash: {caseData.caseId} · Verification: /verify?id={currentDeclaration?.verificationHash || caseData.caseId}
          </p>
        </div>
      </div>
    </div>
  );
};
