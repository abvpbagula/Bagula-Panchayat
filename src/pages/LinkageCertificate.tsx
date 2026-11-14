import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BackButton } from "@/components/BackButton";
import { toast } from "sonner";
import {
  Printer,
  Download,
  QrCode,
  ShieldCheck,
  Building2,
  FileText,
  FileCheck2,
  Edit3,
  CheckCircle2,
  Info,
} from "lucide-react";
import { getCachedAuthoritySettings } from "@/lib/appSettings";
import { getActiveTemplate, getLocalCachedTemplate } from "@/core/certificateTemplateService";
import { generateCertificatePdf, injectPrintPageStyles } from "@/core/certificatePrintEngine";
import { CertificateTemplateConfig } from "@/core/certificateTemplateTypes";

interface ParentElectoralRecord {
  name: string;
  relation: string;
  partNo?: string;
  serialNo?: string;
  epicNo?: string;
  assemblyConstituency?: string;
  electoralRollYear?: string;
}

export default function LinkageCertificate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const certRef = useRef<HTMLDivElement>(null);

  const loadId = searchParams.get("load");
  const isReprint = searchParams.get("reprint") === "1";

  const [loading, setLoading] = useState(Boolean(loadId));
  const [record, setRecord] = useState<Record<string, any> | null>(null);

  const authority = getCachedAuthoritySettings();
  const [activeTemplate, setActiveTemplate] = useState<CertificateTemplateConfig>(() =>
    getLocalCachedTemplate("linkage")
  );

  // Mode toggles
  const [isBlankMode, setIsBlankMode] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);

  // Statutory Certificate Fields
  const [verificationId, setVerificationId] = useState("");
  const [memoNo, setMemoNo] = useState("");
  const [certDate, setCertDate] = useState("");

  const [applicantName, setApplicantName] = useState("");
  const [relationType, setRelationType] = useState("D/O");
  const [guardianName, setGuardianName] = useState("");
  const [village, setVillage] = useState("Bagula");
  const [postOffice, setPostOffice] = useState("Bagula");
  const [policeStation, setPoliceStation] = useState("Hanskhali");
  const [block, setBlock] = useState("Hanskhali");
  const [district, setDistrict] = useState("Nadia");

  // Electoral Details (Constituency is fixed to 89 Ranaghat North East)
  const [assemblyConstituency, setAssemblyConstituency] = useState(
    "89 Ranaghat (S.C.) North East Assembly Constituency"
  );
  const [voterStatus, setVoterStatus] = useState<"registered" | "unregistered">("unregistered");
  const [applicantPartNo, setApplicantPartNo] = useState("");
  const [applicantSerialNo, setApplicantSerialNo] = useState("");
  const [applicantEpicNo, setApplicantEpicNo] = useState("");

  // Spousal Particulars (for married women or shifted citizens)
  const [spouseName, setSpouseName] = useState("");
  const [spouseParentInfo, setSpouseParentInfo] = useState("");
  const [spouseVillage, setSpouseVillage] = useState("");
  const [spousePostOffice, setSpousePostOffice] = useState("Bagula");
  const [spousePoliceStation, setSpousePoliceStation] = useState("Hanskhali");
  const [spousePanchayat, setSpousePanchayat] = useState("Bagula II");
  const [spouseBlock, setSpouseBlock] = useState("Hanskhali");

  // Parental Electoral Roll Table (Father & Mother)
  const [electoralRecords, setElectoralRecords] = useState<ParentElectoralRecord[]>([
    {
      name: "",
      relation: "Father",
      partNo: "",
      serialNo: "",
      epicNo: "",
      electoralRollYear: "Draft Electoral Roll 2025",
      assemblyConstituency: "89 Ranaghat (S.C.) North East Assembly Constituency",
    },
    {
      name: "",
      relation: "Mother",
      partNo: "",
      serialNo: "",
      epicNo: "",
      electoralRollYear: "Draft Electoral Roll 2025",
      assemblyConstituency: "89 Ranaghat (S.C.) North East Assembly Constituency",
    },
  ]);

  useEffect(() => {
    getActiveTemplate("linkage").then((tpl) => {
      if (tpl) setActiveTemplate(tpl);
    });
  }, []);

  useEffect(() => {
    if (!loadId) return;

    let active = true;
    (async () => {
      setLoading(true);
      try {
        let data: any = null;
        const { data: depData } = await supabase
          .from("dependent_certificates")
          .select("*")
          .eq("id", loadId)
          .maybeSingle();

        if (depData) {
          data = depData;
        } else {
          try {
            const { data: linkData } = await supabase
              .from("linkage_certificates" as any)
              .select("*, linkage_parent_electoral_records(*)")
              .eq("id", loadId)
              .maybeSingle();
            data = linkData;
          } catch {
            // ignore
          }
        }

        if (!data) {
          toast.error("Linkage Certificate record not found");
          return;
        }

        if (!active) return;
        setRecord(data);
        setVerificationId(data.verification_id || "");
        setMemoNo(data.memo_no || "");
        setCertDate(data.issue_date || data.cert_date || new Date().toISOString().slice(0, 10));

        setApplicantName(data.applicant_name || "");
        setRelationType(data.relationship_type || "D/O");
        setGuardianName(data.guardian_name || "");
        setVillage(data.village || "Stationpara");
        setAssemblyConstituency("89 Ranaghat (S.C.) North East Assembly Constituency");
        setVoterStatus(data.voter_status === "registered" ? "registered" : "unregistered");
        setApplicantPartNo(data.applicant_part_no || "");
        setApplicantSerialNo(data.applicant_serial_no || "");
        setApplicantEpicNo(data.applicant_epic_no || "");

        setSpouseName(data.spouse_name || "");
        setSpouseParentInfo(data.spouse_parent_info || "");
        setSpouseVillage(data.spouse_village || "");
        setSpousePostOffice(data.spouse_post_office || "Bagula");
        setSpousePoliceStation(data.spouse_police_station || "Hanskhali");
        setSpousePanchayat(data.spouse_panchayat || "Bagula II");
        setSpouseBlock(data.spouse_block || "Hanskhali");

        const rawData = data.data as Record<string, any> | null;
        if (rawData?.__wizard?.applicant) {
          const app = rawData.__wizard.applicant;
          if (app.postOffice) setPostOffice(app.postOffice);
          if (app.policeStation) setPoliceStation(app.policeStation);
          if (app.block) setBlock(app.block);
          if (app.district) setDistrict(app.district);
        }

        if (rawData?.__wizard?.linkage?.parentElectoralRecords) {
          setElectoralRecords(rawData.__wizard.linkage.parentElectoralRecords);
        } else {
          const joinedRecords = (data as any).linkage_parent_electoral_records;
          if (Array.isArray(joinedRecords) && joinedRecords.length > 0) {
            setElectoralRecords(
              joinedRecords.map((r: any) => ({
                name: r.name,
                relation: r.relation,
                partNo: r.part_no,
                serialNo: r.serial_no,
                epicNo: r.epic_no,
                assemblyConstituency: "89 Ranaghat (S.C.) North East Assembly Constituency",
                electoralRollYear: "Draft Electoral Roll 2025",
              }))
            );
          }
        }

        toast.success("Linkage Certificate loaded successfully");

        if (isReprint && (data.status === "Approved" || data.memo_no)) {
          setTimeout(handleDownloadPDF, 1000);
        }
      } catch (err: any) {
        toast.error("Failed to load certificate: " + (err.message || err));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId, isReprint]);

  const handlePrint = () => {
    const cleanup = injectPrintPageStyles(activeTemplate);
    window.print();
    setTimeout(cleanup, 2000);
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    const toastId = toast.loading("Generating official high-resolution PDF...");
    try {
      const tpl = await getActiveTemplate("linkage");
      const safeName = (applicantName || "Linkage_Certificate").replace(/\s+/g, "_");
      await generateCertificatePdf(
        certRef.current,
        tpl,
        `Linkage_Certificate_${safeName}_${verificationId || "Draft"}.pdf`
      );
      toast.success("PDF downloaded successfully!", { id: toastId });
    } catch (e: any) {
      console.error("PDF generation failed", e);
      toast.error("Could not generate PDF: " + (e.message || "Unknown error"), { id: toastId });
    }
  };

  const verifyUrl = `${window.location.origin}/verify?id=${encodeURIComponent(
    verificationId || loadId || "PENDING"
  )}`;

  // Table records for Father and Mother
  const fatherRecord = electoralRecords.find((r) => r.relation.toLowerCase() === "father") || {
    name: "",
    relation: "Father",
    partNo: "",
    serialNo: "",
    epicNo: "",
  };

  const motherRecord = electoralRecords.find((r) => r.relation.toLowerCase() === "mother") || {
    name: "",
    relation: "Mother",
    partNo: "",
    serialNo: "",
    epicNo: "",
  };

  const otherRecords = electoralRecords.filter(
    (r) => r.relation.toLowerCase() !== "father" && r.relation.toLowerCase() !== "mother"
  );

  const rawData = (record as any)?.data as Record<string, any> | null;
  const epicParentLinkageData = rawData?.epicParentLinkage || rawData?.__wizard?.linkage?.epicParentLinkage;
  const isFatherLinked = epicParentLinkageData
    ? Boolean(epicParentLinkageData.linkFather || epicParentLinkageData.linkageSelection === "father" || epicParentLinkageData.linkageSelection === "both")
    : Boolean(fatherRecord.name);
  const isMotherLinked = epicParentLinkageData
    ? Boolean(epicParentLinkageData.linkMother || epicParentLinkageData.linkageSelection === "mother" || epicParentLinkageData.linkageSelection === "both")
    : Boolean(motherRecord.name);
  const memberDeclaration = epicParentLinkageData?.memberVerification || epicParentLinkageData?.issuedCertificateSnapshot;

  return (
    <div className="min-h-screen bg-slate-100/70 py-6 px-3 sm:px-6 print:p-0 print:bg-white text-slate-900 font-sans">
      <Helmet>
        <title>Electoral Linkage Certificate — Bagula II Gram Panchayat</title>
      </Helmet>

      {/* Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <BackButton fallbackUrl="/admin/dashboard" label="⬅️ Back to Dashboard" />
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-primary" />
              Electoral Linkage Certificate Portal
            </h1>
            <p className="text-xs text-muted-foreground">
              Office of the Bagula II Gram Panchayat • Manual Sign &amp; Seal Workflow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChecklistOpen(true)}
            className="gap-1.5 border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 text-xs shadow-xs"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-amber-700" />
            📋 Required Documents (৬টি নথি)
          </Button>

          <Button
            variant={isBlankMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsBlankMode(!isBlankMode)}
            className="gap-1.5 text-xs shadow-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            {isBlankMode ? "Show Filled Data" : "Blank Template (খালি ফরম)"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Fields
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs shadow-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Certificate
          </Button>

          <Button
            size="sm"
            onClick={handleDownloadPDF}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Official Certificate Page */}
      <div className="overflow-x-auto pb-8">
        <div
          ref={certRef}
          className="certificate-area bg-white border border-slate-400 shadow-xl relative overflow-hidden print:border-none print:shadow-none print:p-0 mx-auto"
          style={{
            width: `${activeTemplate.pageWidthMm}mm`,
            minHeight: `${activeTemplate.pageHeightMm}mm`,
            paddingTop: `${activeTemplate.marginTopMm}mm`,
            paddingBottom: `${activeTemplate.marginBottomMm}mm`,
            paddingLeft: `${activeTemplate.marginLeftMm}mm`,
            paddingRight: `${activeTemplate.marginRightMm}mm`,
            boxSizing: "border-box",
            fontFamily: "'Times New Roman', Times, Georgia, serif",
          }}
        >
          {/* Subtle Security Seal Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
            <div className="text-center transform -rotate-45">
              <span className="text-8xl font-black uppercase tracking-widest text-slate-900">
                BAGULA - II GP
              </span>
              <br />
              <span className="text-5xl font-bold uppercase tracking-wider text-slate-900">
                OFFICIAL RECORD
              </span>
            </div>
          </div>

          {/* EXACT LETTERHEAD */}
          <div className="relative z-10 text-center pb-2 border-b-2 border-slate-900">
            <div className="text-xs italic text-slate-800 tracking-wide">
              Office of the
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-950 uppercase mt-0.5">
              BAGULA II GRAM PANCHAYAT
            </h2>
            <div className="text-xs font-bold text-slate-900 tracking-widest uppercase">
              (UNDER HANSKHALI PANCHAYAT SAMITY)
            </div>
            <div className="text-xs text-slate-800 font-medium mt-1">
              Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Block: Hanskhali
            </div>
            <div className="text-xs text-slate-800 font-medium">
              Dist.: Nadia, West Bengal
            </div>
            <div className="text-xs text-slate-800 font-medium">
              E-mail- <span className="font-sans font-semibold">Bagula2NoGP111@Gmail.Com</span>
            </div>

            {/* Prodhan & Upa-Prodhan Names Row */}
            <div className="mt-4 pt-2 border-t border-slate-400 flex justify-between items-start px-2 sm:px-6">
              <div className="text-left">
                <div className="font-bold text-sm text-slate-950">
                  Smt. Susmita Biswas Barman
                </div>
                <div className="text-xs font-semibold text-slate-700 pl-8">
                  Prodhan
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-slate-950">
                  Sri Manaranjan Bhowmick
                </div>
                <div className="text-xs font-semibold text-slate-700 pr-8">
                  Upa-Prodhan
                </div>
              </div>
            </div>
          </div>

          {/* MEMO NO & DATE LINE */}
          <div className="relative z-10 flex justify-between items-center text-xs font-semibold py-3 border-b border-slate-400">
            <div>
              <span>Memo No: </span>
              <span className="font-mono font-bold text-slate-950 text-sm">
                {isBlankMode
                  ? "         /BGL-II /2026"
                  : memoNo || "         /BGL-II /2026"}
              </span>
            </div>
            <div>
              <span>Date: </span>
              <span className="font-mono font-bold text-slate-950 text-sm">
                {isBlankMode
                  ? "                  "
                  : certDate || new Date().toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>

          {/* TO WHOM IT MAY CONCERN */}
          <div className="relative z-10 text-center my-5">
            <h3 className="inline-block text-base sm:text-lg font-black tracking-widest text-slate-950 uppercase border-b-2 border-slate-900 pb-0.5">
              TO WHOM IT MAY CONCERN
            </h3>
          </div>

          {/* PARAGRAPH 1: APPLICANT IDENTITY & RESIDENCE */}
          <div className="relative z-10 text-xs sm:text-[13px] leading-relaxed text-slate-900 space-y-4 text-justify">
            <p>
              This is to certify that Sri/Smt{" "}
              <strong className="underline underline-offset-4 font-bold uppercase">
                {isBlankMode
                  ? "_______________________________________________________"
                  : applicantName || "_______________________________________________________"}
              </strong>
              ,{" "}
              <span className="font-medium">
                {isBlankMode
                  ? "w/d/s/of"
                  : relationType === "W/O"
                  ? "w/of"
                  : relationType === "D/O"
                  ? "d/of"
                  : "s/of"}
              </span>{" "}
              <strong className="underline underline-offset-4 font-bold uppercase">
                {isBlankMode
                  ? "_____________________________"
                  : guardianName || "_____________________________"}
              </strong>
              , Vill:{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode ? "_________________________________" : village || "Stationpara"}
              </span>
              , P.O:{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode ? "________________________" : postOffice || "Bagula"}
              </span>
              , P.S and Block: Hanskhali, District Nadia, under the jurisdiction of this Gram Panchayat, is personally known to me.
            </p>

            {/* PARAGRAPH 2: VOTER REGISTRATION STATUS */}
            <p>
              It is further certified that he/she is{" "}
              <span className="font-bold underline underline-offset-2">
                {isBlankMode
                  ? "registered / unregistered"
                  : voterStatus === "unregistered"
                  ? "unregistered"
                  : "registered"}
              </span>{" "}
              as a voter under <strong>89 Ranaghat (S.C.) North East Assembly Constituency</strong>, Part No.{" "}
              <span className="font-mono font-bold underline underline-offset-2">
                {isBlankMode
                  ? "__________"
                  : voterStatus === "unregistered"
                  ? "N/A"
                  : applicantPartNo || "__________"}
              </span>
              , Serial No.{" "}
              <span className="font-mono font-bold underline underline-offset-2">
                {isBlankMode
                  ? "__________"
                  : voterStatus === "unregistered"
                  ? "N/A"
                  : applicantSerialNo || "__________"}
              </span>{" "}
              in the Draft Electoral Roll 2029 and his/her EPIC No.{" "}
              <span className="font-mono font-bold underline underline-offset-2">
                {isBlankMode
                  ? "__________________________"
                  : voterStatus === "unregistered"
                  ? "N/A (Applying for Fresh Enrolment)"
                  : applicantEpicNo || "__________________________"}
              </span>
              .
            </p>

            {/* PARAGRAPH 3: PARENTS' ELECTORAL ROLL 2025 TABLE */}
            <div className="space-y-2 pt-1">
              <p>
                {isBlankMode || (isFatherLinked && isMotherLinked) ? (
                  <>
                    It is also certified that his/her biological father and mother are enrolled as voters in the{" "}
                  </>
                ) : isFatherLinked ? (
                  <>
                    It is also certified that his/her biological father is enrolled as a voter in the{" "}
                  </>
                ) : (
                  <>
                    It is also certified that his/her biological mother is enrolled as a voter in the{" "}
                  </>
                )}
                <strong>Draft Electoral Roll 2025</strong> under{" "}
                <strong>89 Ranaghat (S.C.) North East Assembly Constituency</strong>, details of which are given below:
              </p>

              <div className="border border-slate-900 rounded-none overflow-hidden my-2">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 bg-slate-50 font-bold text-slate-950">
                      <th className="py-1.5 px-3 border-r border-slate-900">Name</th>
                      <th className="py-1.5 px-3 border-r border-slate-900">Relation</th>
                      <th className="py-1.5 px-3 border-r border-slate-900">Part No.</th>
                      <th className="py-1.5 px-3 border-r border-slate-900">Serial Number</th>
                      <th className="py-1.5 px-3">EPIC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {/* Row 1: Father (if selected or blank template) */}
                    {(isBlankMode || isFatherLinked) && (
                      <tr>
                        <td className="py-2 px-3 border-r border-slate-800 font-bold uppercase">
                          {isBlankMode ? "\u00A0" : fatherRecord.name || "—"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 font-medium">
                          Father
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 font-mono">
                          {isBlankMode ? "\u00A0" : fatherRecord.partNo || "—"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 font-mono">
                          {isBlankMode ? "\u00A0" : fatherRecord.serialNo || "—"}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {isBlankMode ? "\u00A0" : fatherRecord.epicNo || "—"}
                        </td>
                      </tr>
                    )}

                    {/* Row 2: Mother (if selected or blank template) */}
                    {(isBlankMode || isMotherLinked) && (
                      <tr>
                        <td className="py-2 px-3 border-r border-slate-800 font-bold uppercase">
                          {isBlankMode ? "\u00A0" : motherRecord.name || "—"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 font-medium">
                          Mother
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 font-mono">
                          {isBlankMode ? "\u00A0" : motherRecord.partNo || "—"}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-800 font-mono">
                          {isBlankMode ? "\u00A0" : motherRecord.serialNo || "—"}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {isBlankMode ? "\u00A0" : motherRecord.epicNo || "—"}
                        </td>
                      </tr>
                    )}

                    {/* Extra records if any */}
                    {!isBlankMode &&
                      otherRecords.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1.5 px-3 border-r border-slate-800 font-bold uppercase">
                            {item.name}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-800">
                            {item.relation}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-800 font-mono">
                            {item.partNo || "—"}
                          </td>
                          <td className="py-1.5 px-3 border-r border-slate-800 font-mono">
                            {item.serialNo || "—"}
                          </td>
                          <td className="py-1.5 px-3 font-mono font-bold">
                            {item.epicNo || "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PARAGRAPH 4: LAWFUL MARRIAGE & SPOUSAL LINKAGE */}
            <p>
              It is further certified that he/she is lawfully married to Sri/Smt.{" "}
              <strong className="underline underline-offset-4 font-bold uppercase">
                {isBlankMode
                  ? "_______________________________________________________"
                  : spouseName || "_______________________________________________________"}
              </strong>
              , S/o / W/o Late{" "}
              <span className="underline underline-offset-4 font-medium">
                {isBlankMode
                  ? "__________________________________________"
                  : spouseParentInfo || "__________________________________________"}
              </span>
              , Resident of Village{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode
                  ? "__________________________________________"
                  : spouseVillage || "__________________________________________"}
              </span>
              , Post Office{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode
                  ? "__________________________________________"
                  : spousePostOffice || "__________________________________________"}
              </span>
              , Police Station{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode
                  ? "__________________________________________"
                  : spousePoliceStation || "Hanskhali"}
              </span>
              , Panchayat{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode
                  ? "__________________________________________"
                  : spousePanchayat || "Bagula II"}
              </span>
              , Development Block{" "}
              <span className="underline underline-offset-4 font-semibold">
                {isBlankMode
                  ? "__________________________________________"
                  : spouseBlock || "Hanskhali"}
              </span>
              .
            </p>

            {/* PARAGRAPH 5: INTENT & BLESSING */}
            <p>
              He/She intends to be enrolled as a beneficiary voter of the said Assembly Constituency.
              <br />
              I wish him/her every success in life.
            </p>

            {/* GRAM SANSAD MEMBER STATUTORY VERIFICATION & DECLARATION SEAL */}
            {memberDeclaration?.memberDeclarationText && (
              <div className="mt-4 p-3 bg-slate-50/90 border border-slate-400 rounded-xs text-xs space-y-1.5 print:bg-transparent">
                <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
                  <span>Gram Sansad Member Statutory Lineage Endorsement</span>
                  <span className="font-mono text-[10px] text-slate-700">
                    Sansad {memberDeclaration.sansadNo || "—"} · Ward {memberDeclaration.wardNumber || "—"}
                  </span>
                </div>
                <p className="italic text-[11px] text-slate-800 leading-relaxed">
                  "{memberDeclaration.memberDeclarationText}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 font-mono">
                  <span>
                    Verified By: <strong>{memberDeclaration.verifyingMemberName}</strong> ({memberDeclaration.designation})
                  </span>
                  <span>
                    Sign: {memberDeclaration.signatureHash || memberDeclaration.memberSignatureHash || "VERIFIED-MEMBER-AUTHENTICATED"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* DUAL SIGNATORIES BLOCK (MANUAL SIGNATURE & SEAL) */}
          <div className="relative z-10 mt-12 pt-6 flex justify-between items-end text-xs">
            {/* Left Signatory: Counter Signed */}
            <div className="text-center min-w-[220px]">
              <div className="font-bold text-sm text-slate-950 mb-1">
                Counter Signed
              </div>

              {/* Physical Pen Signing and Rubber Stamp Zone */}
              <div className="h-16 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded my-1 text-slate-400 text-[10px] italic">
                <span>[ Physical Manual Signature ]</span>
                <span className="text-[9px] uppercase tracking-wider">[ Official Round Seal ]</span>
              </div>

              <div className="font-bold text-slate-950 mt-1">
                E.A / Secretary / Sahayk
              </div>
              <div className="text-[11px] font-semibold text-slate-800">
                Bagula II Gram Panchayat
              </div>
            </div>

            {/* Right Signatory: Prodhan */}
            <div className="text-center min-w-[220px]">
              <div className="font-bold text-sm text-slate-950 mb-1">
                Yours faithfully.
              </div>

              {/* Physical Pen Signing and Rubber Stamp Zone */}
              <div className="h-16 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded my-1 text-slate-400 text-[10px] italic">
                <span>[ Physical Manual Signature ]</span>
                <span className="text-[9px] uppercase tracking-wider">[ Official Prodhan Seal ]</span>
              </div>

              <div className="font-bold text-slate-950 mt-1">
                Prodhan
              </div>
              <div className="text-[11px] font-semibold text-slate-800">
                Bagula II Gram Panchayat
              </div>
              <div className="text-[10px] text-slate-600">
                (Smt. Susmita Biswas Barman)
              </div>
            </div>
          </div>

          {/* OFFICIAL SECURITY & VERIFICATION FOOTER */}
          <div className="relative z-10 mt-8 pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-sans">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white border border-slate-400 rounded">
                <QrCode className="h-10 w-10 text-slate-950" />
              </div>
              <div>
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[9px] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  Bagula II GP Secure Electoral Linkage Verification
                </div>
                <div className="text-[9px] text-slate-600">
                  Verification Ref: <span className="font-mono font-bold text-slate-900">{verificationId || "BGL2-LNK-2026-DRAFT"}</span>
                </div>
                <div className="text-[8px] text-slate-400 break-all max-w-[320px]">
                  {verifyUrl}
                </div>
              </div>
            </div>
            <div className="text-right text-[8px] text-slate-400 max-w-[260px] leading-tight font-serif">
              Issued under the West Bengal Panchayat Act 1973 &amp; Representation of the People Act guidelines. Requires physical counter-signature and seal to be legally operative.
            </div>
          </div>
        </div>
      </div>

      {/* STATUTORY REQUIRED DOCUMENTS CHECKLIST MODAL */}
      <Dialog open={isChecklistOpen} onOpenChange={setIsChecklistOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <FileCheck2 className="h-5 w-5 text-amber-600" />
              Statutory Required Documents for Linkage Certificate
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Mandatory proofs required by Bagula II Gram Panchayat for women married or shifted to another place seeking EPIC / Electoral Roll enrolment under 89 Ranaghat (S.C.) North East AC:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">1. Parents' Latest EPIC &amp; Voter List (Draft Roll 2025)</div>
                  <div className="text-slate-600">Xerox copy of Father and Mother's Voter Cards along with the relevant part/serial extract of 89 Ranaghat (S.C.) North East AC.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">2. Proof of Age of Daughter / Applicant</div>
                  <div className="text-slate-600">Madhyamik Admit Card / Secondary Marksheet or Digital Birth Certificate establishing parentage and age.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">3. Proof of Marriage</div>
                  <div className="text-slate-600">Residential Certificate issued by Husband's Gram Panchayat / Official Marriage Registration Certificate.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">4. Panchayat Latest Tax Receipt of Parents</div>
                  <div className="text-slate-600">Current financial year property / holding tax payment receipt issued by Bagula II Gram Panchayat.</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">5. Applicant's EPIC Copy (If Registered)</div>
                  <div className="text-slate-600">Photocopy of applicant's voter identity card (if already registered and applying for constituency transfer).</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900">6. Husband's Proof of Identity / Residence</div>
                  <div className="text-slate-600">Husband's Aadhaar Card / EPIC / Land Deed / Residential Proof of marital home.</div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QUICK IN-PLACE EDIT MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Edit3 className="h-4 w-4 text-primary" />
              Quick Edit Linkage Certificate Fields
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Modify certificate values directly prior to printing or PDF download:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Memo & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Memo No.</Label>
                <Input
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  placeholder="e.g. 142/BGL-II/2026"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Certificate Date</Label>
                <Input
                  value={certDate}
                  onChange={(e) => setCertDate(e.target.value)}
                  placeholder="e.g. 24/09/2026"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            {/* Applicant Particulars */}
            <div className="border-t pt-3 space-y-3">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Applicant Details
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Applicant Name</Label>
                  <Input
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value.toUpperCase())}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Parent / Guardian Name</Label>
                  <Input
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value.toUpperCase())}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Village</Label>
                  <Input
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Post Office</Label>
                  <Input
                    value={postOffice}
                    onChange={(e) => setPostOffice(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Voter Status & Roll */}
            <div className="border-t pt-3 space-y-3">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Applicant Voter Particulars
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Voter Status</Label>
                  <select
                    value={voterStatus}
                    onChange={(e) => setVoterStatus(e.target.value as any)}
                    className="w-full h-8 text-xs mt-1 rounded border border-slate-300 px-2 bg-white"
                  >
                    <option value="unregistered">Unregistered</option>
                    <option value="registered">Registered</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Part No.</Label>
                  <Input
                    value={applicantPartNo}
                    onChange={(e) => setApplicantPartNo(e.target.value)}
                    disabled={voterStatus === "unregistered"}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Serial No.</Label>
                  <Input
                    value={applicantSerialNo}
                    onChange={(e) => setApplicantSerialNo(e.target.value)}
                    disabled={voterStatus === "unregistered"}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">EPIC No.</Label>
                  <Input
                    value={applicantEpicNo}
                    onChange={(e) => setApplicantEpicNo(e.target.value.toUpperCase())}
                    disabled={voterStatus === "unregistered"}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Parents' Table Quick Edit */}
            <div className="border-t pt-3 space-y-3">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Parents' Electoral Details (Draft Roll 2025)
              </div>
              {/* Father */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded">
                <div className="col-span-4 font-semibold text-slate-800 text-[11px]">Father Record</div>
                <div>
                  <Label className="text-[10px]">Name</Label>
                  <Input
                    value={fatherRecord.name}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "father");
                      if (idx >= 0) updated[idx].name = e.target.value;
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Part No.</Label>
                  <Input
                    value={fatherRecord.partNo}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "father");
                      if (idx >= 0) updated[idx].partNo = e.target.value;
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Serial No.</Label>
                  <Input
                    value={fatherRecord.serialNo}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "father");
                      if (idx >= 0) updated[idx].serialNo = e.target.value;
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">EPIC</Label>
                  <Input
                    value={fatherRecord.epicNo}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "father");
                      if (idx >= 0) updated[idx].epicNo = e.target.value.toUpperCase();
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              {/* Mother */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded">
                <div className="col-span-4 font-semibold text-slate-800 text-[11px]">Mother Record</div>
                <div>
                  <Label className="text-[10px]">Name</Label>
                  <Input
                    value={motherRecord.name}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "mother");
                      if (idx >= 0) updated[idx].name = e.target.value;
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Part No.</Label>
                  <Input
                    value={motherRecord.partNo}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "mother");
                      if (idx >= 0) updated[idx].partNo = e.target.value;
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">Serial No.</Label>
                  <Input
                    value={motherRecord.serialNo}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "mother");
                      if (idx >= 0) updated[idx].serialNo = e.target.value;
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px]">EPIC</Label>
                  <Input
                    value={motherRecord.epicNo}
                    onChange={(e) => {
                      const updated = [...electoralRecords];
                      const idx = updated.findIndex((r) => r.relation.toLowerCase() === "mother");
                      if (idx >= 0) updated[idx].epicNo = e.target.value.toUpperCase();
                      setElectoralRecords(updated);
                    }}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Spouse Particulars */}
            <div className="border-t pt-3 space-y-3">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-700">
                Spouse / Marital Linkage Particulars
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Spouse Name (Sri/Smt.)</Label>
                  <Input
                    value={spouseName}
                    onChange={(e) => setSpouseName(e.target.value.toUpperCase())}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">S/o / W/o Late (Parent Info)</Label>
                  <Input
                    value={spouseParentInfo}
                    onChange={(e) => setSpouseParentInfo(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Spouse Village</Label>
                  <Input
                    value={spouseVillage}
                    onChange={(e) => setSpouseVillage(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Spouse Post Office</Label>
                  <Input
                    value={spousePostOffice}
                    onChange={(e) => setSpousePostOffice(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Spouse Police Station</Label>
                  <Input
                    value={spousePoliceStation}
                    onChange={(e) => setSpousePoliceStation(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Spouse Gram Panchayat</Label>
                  <Input
                    value={spousePanchayat}
                    onChange={(e) => setSpousePanchayat(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Spouse Development Block</Label>
                  <Input
                    value={spouseBlock}
                    onChange={(e) => setSpouseBlock(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button size="sm" onClick={() => setIsEditOpen(false)}>
                Done &amp; Update Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
