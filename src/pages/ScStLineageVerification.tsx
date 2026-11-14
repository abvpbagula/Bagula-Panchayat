import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ShieldCheck,
  Award,
  Users,
  GitBranch,
  FileText,
  Printer,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Building2,
  Lock,
  ArrowRight,
  ExternalLink,
  Search,
  Download,
  HelpCircle,
  Eye,
  Plus,
  Layers,
  Sparkles,
  Landmark,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { scStLineageService } from "@/services/scStLineageService";
import {
  ScStLineageCase,
  LineageTreeNode,
  ExistingCertificateHolderInfo,
  ApplicantInfo,
} from "@/types/scStLineageTypes";
import {
  PATERNAL_RELATIONSHIP_RULES,
  evaluatePaternalRelationship,
} from "@/lib/paternalRelationshipRules";
import { PaternalValidationAlert } from "@/components/lineage/PaternalValidationAlert";
import { FamilyTreeVisualizer } from "@/components/lineage/FamilyTreeVisualizer";
import { RecursiveFamilyTree } from "@/components/lineage/RecursiveFamilyTree";
import { GramSansadDeclarationPrint } from "@/components/lineage/GramSansadDeclarationPrint";
import { ELECTED_REPRESENTATIVES_DATA } from "@/lib/electedRepresentativesData";

export default function ScStLineageVerification() {
  const [searchParams, setSearchParams] = useSearchParams();
  const caseIdParam = searchParams.get("case");
  const tabParam = searchParams.get("tab") || "builder";

  // Tab State: "builder" | "review" | "print"
  const [activeTab, setActiveTab] = useState<"builder" | "review" | "print">(
    tabParam === "review" || tabParam === "print" ? tabParam : "builder"
  );

  // Loaded Case Data
  const [cases, setCases] = useState<ScStLineageCase[]>([]);
  const [activeCase, setActiveCase] = useState<ScStLineageCase>(() => {
    const all = scStLineageService.getAllCases();
    if (caseIdParam) {
      const found = all.find((c) => c.caseId === caseIdParam);
      if (found) return found;
    }
    return all[0];
  });

  // Reload cases
  const reloadCases = () => {
    const all = scStLineageService.getAllCases();
    setCases(all);
    if (activeCase) {
      const fresh = all.find((c) => c.caseId === activeCase.caseId);
      if (fresh) setActiveCase(fresh);
    }
  };

  useEffect(() => {
    reloadCases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL tab
  const handleTabChange = (tab: "builder" | "review" | "print") => {
    setActiveTab(tab);
    setSearchParams({ tab, case: activeCase.caseId });
  };

  // Switch Active Case
  const handleSwitchCase = (caseId: string) => {
    const target = cases.find((c) => c.caseId === caseId);
    if (target) {
      setActiveCase(target);
      setSearchParams({ tab: activeTab, case: target.caseId });
    }
  };

  // --- BUILDER FORM STATES ---
  const [applicantFullName, setApplicantFullName] = useState(activeCase.applicant.fullName);
  const [applicantFatherName, setApplicantFatherName] = useState(activeCase.applicant.fatherName);
  const [applicantMotherName, setApplicantMotherName] = useState(activeCase.applicant.motherName);
  const [applicantDob, setApplicantDob] = useState(activeCase.applicant.dateOfBirth);
  const [applicantVillage, setApplicantVillage] = useState(activeCase.applicant.villagePara);
  const [applicantWardNo, setApplicantWardNo] = useState(activeCase.applicant.gramSansadWardNo);
  const [targetSubCaste, setTargetSubCaste] = useState(activeCase.applicant.targetSubCaste);

  // Existing Certificate Holder States
  const [holderName, setHolderName] = useState(activeCase.existingCertificateHolder.holderName);
  const [holderRelationship, setHolderRelationship] = useState(
    activeCase.existingCertificateHolder.relationshipCode || "PAT_UNCLE_YOUNGER"
  );
  const [holderCertNo, setHolderCertNo] = useState(activeCase.existingCertificateHolder.certificateNumber);
  const [holderIssueDate, setHolderIssueDate] = useState(activeCase.existingCertificateHolder.issueDate);
  const [holderIssuingAuth, setHolderIssuingAuth] = useState(activeCase.existingCertificateHolder.issuingAuthority);
  const [holderSubCaste, setHolderSubCaste] = useState(activeCase.existingCertificateHolder.subCaste);

  // Sync builder form when activeCase changes
  useEffect(() => {
    setApplicantFullName(activeCase.applicant.fullName);
    setApplicantFatherName(activeCase.applicant.fatherName);
    setApplicantMotherName(activeCase.applicant.motherName);
    setApplicantDob(activeCase.applicant.dateOfBirth);
    setApplicantVillage(activeCase.applicant.villagePara);
    setApplicantWardNo(activeCase.applicant.gramSansadWardNo);
    setTargetSubCaste(activeCase.applicant.targetSubCaste);

    setHolderName(activeCase.existingCertificateHolder.holderName);
    setHolderRelationship(activeCase.existingCertificateHolder.relationshipCode || "PAT_UNCLE_YOUNGER");
    setHolderCertNo(activeCase.existingCertificateHolder.certificateNumber);
    setHolderIssueDate(activeCase.existingCertificateHolder.issueDate);
    setHolderIssuingAuth(activeCase.existingCertificateHolder.issuingAuthority);
    setHolderSubCaste(activeCase.existingCertificateHolder.subCaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCase.caseId]);

  // Update tree nodes callback
  const handleNodesChange = (updatedNodes: LineageTreeNode[]) => {
    const updatedCase: ScStLineageCase = {
      ...activeCase,
      treeNodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };
    scStLineageService.saveCaseDraft(updatedCase);
    setActiveCase(updatedCase);
    toast.success("Family tree nodes updated successfully.");
  };

  // Save Builder Draft
  const handleSaveDraft = () => {
    const matchedRule = PATERNAL_RELATIONSHIP_RULES.find((r) => r.code === holderRelationship);

    const updatedApplicant: ApplicantInfo = {
      ...activeCase.applicant,
      fullName: applicantFullName.trim().toUpperCase(),
      fatherName: applicantFatherName.trim().toUpperCase(),
      motherName: applicantMotherName.trim().toUpperCase(),
      dateOfBirth: applicantDob,
      villagePara: applicantVillage.trim(),
      gramSansadWardNo: applicantWardNo,
      targetSubCaste: targetSubCaste.trim(),
    };

    const updatedHolder: ExistingCertificateHolderInfo = {
      ...activeCase.existingCertificateHolder,
      holderName: holderName.trim().toUpperCase(),
      relationshipCode: holderRelationship,
      relationshipToApplicant: matchedRule ? matchedRule.labelEn : holderRelationship,
      certificateNumber: holderCertNo.trim(),
      issueDate: holderIssueDate.trim(),
      issuingAuthority: holderIssuingAuth.trim(),
      subCaste: holderSubCaste.trim(),
    };

    // Also sync the applicant and holder tree nodes if present
    const updatedNodes = activeCase.treeNodes.map((n) => {
      if (n.isApplicant) {
        return {
          ...n,
          fullName: applicantFullName.trim().toUpperCase(),
          villagePara: applicantVillage.trim(),
        };
      }
      if (n.isCertificateHolder) {
        return {
          ...n,
          fullName: holderName.trim().toUpperCase(),
          relationshipCode: holderRelationship,
          relationshipToApplicant: matchedRule ? matchedRule.labelEn : holderRelationship,
          casteCertDetails: {
            certNo: holderCertNo.trim(),
            subCaste: holderSubCaste.trim(),
            issueDate: holderIssueDate.trim(),
            issuingAuthority: holderIssuingAuth.trim(),
            state: "West Bengal",
          },
        };
      }
      return n;
    });

    const updatedCase: ScStLineageCase = {
      ...activeCase,
      applicant: updatedApplicant,
      existingCertificateHolder: updatedHolder,
      treeNodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    };

    scStLineageService.saveCaseDraft(updatedCase);
    setActiveCase(updatedCase);
    reloadCases();
    toast.success("Case draft and lineage details saved successfully.");
  };

  // Create Fresh New Case
  const handleCreateNewCase = () => {
    const ts = Date.now();
    const ancId = `node_anc_${ts}`;
    const fatId = `node_fat_${ts}`;
    const holId = `node_hol_${ts}`;
    const appId = `node_app_${ts}`;
    const newCaseId = `B2GP-SCS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTrackingId = `TRK-LIN-${Math.floor(10000 + Math.random() * 90000)}`;

    const newCase: ScStLineageCase = {
      caseId: newCaseId,
      trackingId: newTrackingId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "Draft",
      applicant: {
        fullName: "NEW APPLICANT",
        gender: "Male",
        dateOfBirth: "2002-01-01",
        fatherName: "FATHER NAME",
        motherName: "MOTHER NAME",
        villagePara: "Bagula Stationpara",
        postOffice: "Bagula",
        policeStation: "Hanskhali",
        district: "Nadia",
        pinCode: "741502",
        gramSansadWardNo: 4,
        targetSubCaste: "Namasudra (SC)",
      },
      existingCertificateHolder: {
        holderName: "EXISTING CERTIFICATE HOLDER",
        relationshipToApplicant: "Paternal Uncle (কাকামশাই)",
        relationshipCode: "PAT_UNCLE_YOUNGER",
        casteCategory: "SC",
        subCaste: "Namasudra",
        certificateNumber: "WB/NAD/SC/...",
        issueDate: "2010-01-01",
        issuingAuthority: "SDO Ranaghat, Nadia",
        holderVillage: "Bagula",
        isLiving: true,
        proofDocumentAttached: true,
      },
      treeNodes: [
        {
          id: ancId,
          parentId: null,
          fullName: "LATE COMMON ANCESTOR",
          relationshipToApplicant: "Paternal Grandfather (পিতামহ)",
          relationshipCode: "PAT_GRANDFATHER",
          generationLevel: 2,
          gender: "Male",
          villagePara: "Bagula",
          status: "Deceased",
          isCertificateHolder: false,
          verificationStatus: "Verified by Records",
          supportingDocRef: "Land Khatian / 1971 Voter List",
        },
        {
          id: fatId,
          parentId: ancId,
          fullName: "FATHER NAME",
          relationshipToApplicant: "Father (পিতা)",
          relationshipCode: "FATHER",
          generationLevel: 1,
          gender: "Male",
          villagePara: "Bagula",
          status: "Living",
          isCertificateHolder: false,
          verificationStatus: "Verified by Records",
          supportingDocRef: "Aadhaar Card",
        },
        {
          id: holId,
          parentId: ancId,
          fullName: "EXISTING CERTIFICATE HOLDER",
          relationshipToApplicant: "Paternal Uncle (কাকামশাই)",
          relationshipCode: "PAT_UNCLE_YOUNGER",
          generationLevel: 1,
          gender: "Male",
          villagePara: "Bagula",
          status: "Living",
          isCertificateHolder: true,
          casteCertDetails: {
            certNo: "WB/NAD/SC/...",
            subCaste: "Namasudra",
            issueDate: "2010-01-01",
            issuingAuthority: "SDO Ranaghat, Nadia",
            state: "West Bengal",
          },
          verificationStatus: "Verified by Records",
        },
        {
          id: appId,
          parentId: fatId,
          fullName: "NEW APPLICANT",
          relationshipToApplicant: "Self / Applicant (আবেদনকারী)",
          relationshipCode: "SELF",
          generationLevel: 0,
          gender: "Male",
          villagePara: "Bagula",
          status: "Living",
          isCertificateHolder: false,
          isApplicant: true,
          verificationStatus: "Verified by Field Inquiry",
          supportingDocRef: "Madhyamik Admit Card",
        },
      ],
      rootAncestorNodeId: ancId,
      applicantNodeId: appId,
      certificateHolderNodeId: holId,
      supportingDocuments: [
        { docType: "SC_CERTIFICATE", docName: "Existing SC Certificate Copy", attached: true },
        { docType: "LAND_RECORD", docName: "CS/RS Land Khatian", attached: true },
        { docType: "VOTER_LIST", docName: "Electoral Roll Extract", attached: true },
      ],
      declarationHistory: [],
      mergedPdfBundleReady: false,
    };

    scStLineageService.saveCaseDraft(newCase);
    setActiveCase(newCase);
    reloadCases();
    toast.success(`Created new lineage case file ${newCaseId}`);
  };

  // --- MEMBER REVIEW & ENDORSEMENT FORM STATES ---
  const [selectedWardForMemberReview, setSelectedWardForMemberReview] = useState<number>(
    activeCase.applicant.gramSansadWardNo
  );
  const [memberObservations, setMemberObservations] = useState(
    activeCase.currentDeclaration?.memberObservations ||
      `Local inquiry conducted at ${activeCase.applicant.villagePara}. The applicant is confirmed to be the biological son of ${activeCase.applicant.fatherName}. Paternal genealogical linkage with certificate holder ${activeCase.existingCertificateHolder.holderName} verified authentic.`
  );
  const [fieldInquiryConducted, setFieldInquiryConducted] = useState(true);
  const [localWitnesses, setLocalWitnesses] = useState("Prabir Sarkar, Nirmal Pramanik");
  const [isEndorsing, setIsEndorsing] = useState(false);

  // Current elected representative for the selected ward
  const activeWardRep = ELECTED_REPRESENTATIVES_DATA.find(
    (r) => r.wardNumber === selectedWardForMemberReview
  ) || ELECTED_REPRESENTATIVES_DATA[0];

  const handleEndorseDeclaration = async () => {
    setIsEndorsing(true);
    try {
      const witnessList = localWitnesses
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean);

      const updated = await scStLineageService.endorseMemberDeclaration(activeCase.caseId, {
        wardNumber: selectedWardForMemberReview,
        memberObservations: memberObservations.trim(),
        fieldInquiryConducted,
        localWitnessNames: witnessList,
      });

      setActiveCase(updated);
      reloadCases();
      toast.success(
        `Declaration Endorsed & Sealed by Ward ${selectedWardForMemberReview} Member (${activeWardRep.name}). Version: ${updated.currentDeclaration?.version}`
      );
      handleTabChange("print");
    } catch (err: any) {
      toast.error(err.message || "Failed to endorse declaration.");
    } finally {
      setIsEndorsing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <Helmet>
        <title>SC/ST Paternal Lineage Verification | Bagula II Gram Panchayat</title>
        <meta
          name="description"
          content="SC/ST Paternal Lineage Verification and Gram Sansad Vamshabriksha Declaration Desk, Bagula II Gram Panchayat, Nadia."
        />
      </Helmet>

      {/* TOP STATUTORY HEADER */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center shrink-0">
                <GitBranch size={26} className="text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2 py-0.5">
                    Statutory Vamshabriksha Desk
                  </Badge>
                  <span className="text-xs text-slate-400">Bagula II Gram Panchayat</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                  SC/ST Paternal Lineage Verification
                </h1>
                <p className="text-xs sm:text-sm text-amber-300 font-medium font-bengali">
                  SC/ST পৈতৃক বংশতালিকা ও সম্পর্ক যাচাই এবং গ্রাম সংসদ সদস্যের প্রত্যয়ন
                </p>
              </div>
            </div>

            {/* Case Selector Dropdown & New Case Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={activeCase.caseId} onValueChange={handleSwitchCase}>
                <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-xs text-white min-w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {cases.map((c) => (
                    <SelectItem key={c.caseId} value={c.caseId} className="text-xs">
                      {c.caseId} — {c.applicant.fullName} ({c.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreateNewCase}
                size="sm"
                variant="outline"
                className="h-8 text-xs border-amber-400/40 text-amber-300 hover:bg-amber-400/10 gap-1.5"
              >
                <Plus size={13} />
                <span>New Case File</span>
              </Button>

              <Button
                asChild
                size="sm"
                className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold gap-1.5 whitespace-nowrap shrink-0"
              >
                <Link
                  to={`/family-tree-generator?from=sc-st-lineage&applicant=${encodeURIComponent(
                    applicantFullName
                  )}&head=${encodeURIComponent(
                    activeCase.treeNodes.find((n) => n.parentId === null)?.fullName ||
                      applicantFatherName
                  )}&sansad=${encodeURIComponent(`Ward ${applicantWardNo}`)}`}
                >
                  <GitBranch size={13} />
                  <span>Family Tree Generator (বংশতালিকা)</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* PRIMARY ARCHITECTURAL DISTINCTION BANNER */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Scale size={15} className="shrink-0" />
              <span>Crucial Architectural Distinction &amp; Statutory Role:</span>
            </div>
            <p className="leading-relaxed text-[11px] text-amber-100/90">
              This document is a <strong>Paternal Vamshabriksha &amp; Caste Relationship Declaration (পৈতৃক বংশতালিকা ও সম্পর্ক প্রত্যয়ন)</strong> executed by the authorized Gram Sansad Member. It is <strong>NOT a final caste certificate</strong>. Final statutory decision and certificate issuance rests exclusively with the Competent Authority (Sub-Divisional Officer / SDO) under the <em>West Bengal Scheduled Castes and Scheduled Tribes (Identification) Act, 1994</em>.
            </p>
          </div>

          {/* MAIN TABS NAVIGATION */}
          <div className="flex items-center gap-2 pt-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange("builder")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "builder"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <GitBranch size={14} />
              <span>1. Lineage &amp; Tree Builder (বংশতালিকা গঠন)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("review")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "review"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              <span>2. Gram Sansad Member Review (সদস্যের প্রত্যয়ন)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("print")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeTab === "print"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <Printer size={14} />
              <span>3. Case File &amp; Print (মুদ্রণ ও OSCAR প্রস্তুতি)</span>
            </button>
          </div>
        </div>
      </div>

      {/* BODY CONTENT CONTAINER */}
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* TAB 1: LINEAGE & TREE BUILDER */}
        {activeTab === "builder" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Case Overview Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-border/80 shadow-2xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary">{activeCase.caseId}</span>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    Status: {activeCase.status}
                  </Badge>
                  {activeCase.currentDeclaration?.version && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                      Declaration v{activeCase.currentDeclaration.version}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Applicant: <strong>{activeCase.applicant.fullName}</strong> · Sansad Ward #{activeCase.applicant.gramSansadWardNo} · Target: {activeCase.applicant.targetSubCaste}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveDraft} className="bg-primary text-primary-foreground text-xs gap-1.5">
                  Save Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTabChange("review")}
                  className="text-xs gap-1.5"
                >
                  Proceed to Review
                  <ArrowRight size={13} />
                </Button>
              </div>
            </div>

            {/* Step 1 & 2 Inputs: Applicant & Existing Certificate Holder */}
            <div className="grid md:grid-cols-2 gap-5">
              {/* CARD: APPLICANT DETAILS */}
              <Card className="p-5 space-y-4 rounded-2xl border-border/80 shadow-2xs">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Users size={16} className="text-primary" />
                    <span>Applicant Information (আবেদনকারী)</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-mono">Step 1</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-[11px]">Full Legal Name (as in Aadhaar/School Admit)</Label>
                    <Input
                      value={applicantFullName}
                      onChange={(e) => setApplicantFullName(e.target.value.toUpperCase())}
                      placeholder="e.g. BIKASH BISWAS"
                      className="mt-1 h-8 text-xs font-bold uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Biological Father&apos;s Name</Label>
                      <Input
                        value={applicantFatherName}
                        onChange={(e) => setApplicantFatherName(e.target.value.toUpperCase())}
                        placeholder="e.g. SUBODH BISWAS"
                        className="mt-1 h-8 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Mother&apos;s Name</Label>
                      <Input
                        value={applicantMotherName}
                        onChange={(e) => setApplicantMotherName(e.target.value.toUpperCase())}
                        placeholder="e.g. SULATA BISWAS"
                        className="mt-1 h-8 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Date of Birth</Label>
                      <Input
                        type="date"
                        value={applicantDob}
                        onChange={(e) => setApplicantDob(e.target.value)}
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Gram Sansad (Ward No. 1 to 30)</Label>
                      <Select
                        value={String(applicantWardNo)}
                        onValueChange={(v) => setApplicantWardNo(parseInt(v, 10))}
                      >
                        <SelectTrigger className="mt-1 h-8 text-xs font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {ELECTED_REPRESENTATIVES_DATA.map((r) => (
                            <SelectItem key={r.wardNumber} value={String(r.wardNumber)} className="text-xs">
                              Ward {r.wardNumber} ({r.sansadNo}) — {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Village / Para</Label>
                      <Input
                        value={applicantVillage}
                        onChange={(e) => setApplicantVillage(e.target.value)}
                        placeholder="e.g. Stationpara"
                        className="mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Target Caste Claimed</Label>
                      <Input
                        value={targetSubCaste}
                        onChange={(e) => setTargetSubCaste(e.target.value)}
                        placeholder="e.g. Namasudra (SC)"
                        className="mt-1 h-8 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* CARD: EXISTING PATERNAL SC/ST CERTIFICATE HOLDER */}
              <Card className="p-5 space-y-4 rounded-2xl border-border/80 shadow-2xs bg-amber-50/20">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Award size={16} className="text-amber-600" />
                    <span>Existing SC/ST Certificate Holder (প্রমাণক)</span>
                  </h3>
                  <Badge variant="outline" className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                    Paternal Relative
                  </Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <Label className="text-[11px]">Certificate Holder Full Legal Name</Label>
                    <Input
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                      placeholder="e.g. AMAL BISWAS"
                      className="mt-1 h-8 text-xs font-bold uppercase bg-white"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px]">Relationship to Applicant</Label>
                    <Select value={holderRelationship} onValueChange={setHolderRelationship}>
                      <SelectTrigger className="mt-1 h-8 text-xs font-semibold bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PATERNAL_RELATIONSHIP_RULES.map((r) => (
                          <SelectItem key={r.code} value={r.code} className="text-xs">
                            {r.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">SC/ST Certificate Number</Label>
                      <Input
                        value={holderCertNo}
                        onChange={(e) => setHolderCertNo(e.target.value)}
                        placeholder="WB/NAD/SC/2004/008741"
                        className="mt-1 h-8 text-xs font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Sub-caste on Certificate</Label>
                      <Input
                        value={holderSubCaste}
                        onChange={(e) => setHolderSubCaste(e.target.value)}
                        placeholder="Namasudra"
                        className="mt-1 h-8 text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Date of Issuance</Label>
                      <Input
                        value={holderIssueDate}
                        onChange={(e) => setHolderIssueDate(e.target.value)}
                        placeholder="2004-11-20"
                        className="mt-1 h-8 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Issuing Authority (SDO)</Label>
                      <Input
                        value={holderIssuingAuth}
                        onChange={(e) => setHolderIssuingAuth(e.target.value)}
                        placeholder="SDO Ranaghat, Nadia"
                        className="mt-1 h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* LIVE PATERNAL RELATIONSHIP VALIDATION ALERT */}
            <PaternalValidationAlert relationshipCodeOrLabel={holderRelationship} />

            {/* RECURSIVE EXPANDABLE FAMILY TREE (VAMSHABRIKSHA) */}
            <RecursiveFamilyTree
              nodes={activeCase.treeNodes}
              onNodesChange={handleNodesChange}
              readOnly={false}
              applicantName={applicantFullName}
            />

            {/* SUPPORTING EVIDENCE LIST */}
            <Card className="p-5 space-y-3 rounded-2xl border-border/80">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span>Mandatory Supporting Evidence Checklist (প্রয়োজনীয় নথিপত্র)</span>
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  OSCAR Linkage Checklist
                </Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {activeCase.supportingDocuments.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-start gap-2.5"
                  >
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground text-xs">{doc.docName}</p>
                      {doc.docNumber && (
                        <p className="text-[11px] text-muted-foreground font-mono">Ref: {doc.docNumber}</p>
                      )}
                      {doc.remarks && (
                        <p className="text-[10px] text-slate-500 italic">{doc.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ACTION FOOTER BAR */}
            <div className="p-4 rounded-2xl bg-white border border-border/80 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-bold text-foreground">Finished editing family tree &amp; evidence?</p>
                <p className="text-[11px] text-muted-foreground">
                  Proceed to the Gram Sansad Member review terminal to record field observations and apply digital seal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSaveDraft} variant="outline" size="sm" className="text-xs">
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleTabChange("review")}
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs gap-1.5"
                >
                  <span>Member Review Terminal</span>
                  <ArrowRight size={13} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GRAM SANSAD MEMBER REVIEW & ENDORSEMENT TERMINAL */}
        {activeTab === "review" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* Member Identity & Ward Scoping Bar */}
            <Card className="p-5 rounded-2xl border-border/80 bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-base shadow-sm">
                    {activeWardRep.sansadNo}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                      Authorized Gram Sansad Member Review Desk
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {activeWardRep.name} ({activeWardRep.nameBn})
                    </h3>
                    <p className="text-xs text-slate-300">
                      Ward No. {activeWardRep.wardNumber} · Booth {activeWardRep.partNo} · Bagula II GP
                    </p>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <span className="text-slate-400 block text-[11px]">Switch Representative Ward:</span>
                  <Select
                    value={String(selectedWardForMemberReview)}
                    onValueChange={(v) => setSelectedWardForMemberReview(parseInt(v, 10))}
                  >
                    <SelectTrigger className="h-8 bg-slate-800 border-slate-700 text-xs text-white min-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {ELECTED_REPRESENTATIVES_DATA.map((r) => (
                        <SelectItem key={r.wardNumber} value={String(r.wardNumber)} className="text-xs">
                          Ward {r.wardNumber} ({r.sansadNo}) — {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Case Summary Card Under Scrutiny */}
            <Card className="p-5 rounded-2xl border-border/80 space-y-4">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Submitted Case Scrutiny: {activeCase.applicant.fullName}</span>
                </h4>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeCase.caseId}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Applicant</span>
                  <span className="font-bold text-foreground text-xs mt-0.5 block">{activeCase.applicant.fullName}</span>
                  <span className="text-[10px] text-muted-foreground">S/O {activeCase.applicant.fatherName}</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Target Caste</span>
                  <span className="font-bold text-foreground text-xs mt-0.5 block">{activeCase.applicant.targetSubCaste}</span>
                  <span className="text-[10px] text-muted-foreground">{activeCase.applicant.villagePara}</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-amber-900 block text-[10px] uppercase font-bold">Cert Holder</span>
                  <span className="font-bold text-amber-950 text-xs mt-0.5 block">
                    {activeCase.existingCertificateHolder.holderName}
                  </span>
                  <span className="text-[10px] text-amber-800">
                    {activeCase.existingCertificateHolder.relationshipToApplicant}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Certificate No</span>
                  <span className="font-bold text-foreground text-xs mt-0.5 block font-mono">
                    {activeCase.existingCertificateHolder.certificateNumber}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Issued: {activeCase.existingCertificateHolder.issueDate}
                  </span>
                </div>
              </div>
            </Card>

            {/* Read-Only Family Tree for Member Scrutiny */}
            <RecursiveFamilyTree
              nodes={activeCase.treeNodes}
              readOnly={true}
              applicantName={activeCase.applicant.fullName}
            />

            {/* Member Local Field Inquiry Form */}
            <Card className="p-5 rounded-2xl border-border/80 space-y-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileCheck2 size={16} className="text-primary" />
                <span>Local Field Inquiry &amp; Observations of Gram Sansad Member</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground text-xs">
                    <input
                      type="checkbox"
                      checked={fieldInquiryConducted}
                      onChange={(e) => setFieldInquiryConducted(e.target.checked)}
                      className="rounded text-primary"
                    />
                    <span>Local physical inquiry conducted in Ward #{selectedWardForMemberReview} ({activeCase.applicant.villagePara})</span>
                  </label>
                </div>

                <div>
                  <Label className="text-[11px]">Local Witnesses / Village Elder Co-residents Examined</Label>
                  <Input
                    value={localWitnesses}
                    onChange={(e) => setLocalWitnesses(e.target.value)}
                    placeholder="e.g. Prabir Sarkar, Nirmal Pramanik"
                    className="mt-1 h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-[11px]">Member&apos;s Field Inquiry Observations &amp; Kinship Confirmation</Label>
                  <Textarea
                    value={memberObservations}
                    onChange={(e) => setMemberObservations(e.target.value)}
                    rows={3}
                    placeholder="Record your field observations regarding the biological relationship between the applicant and the certificate holder..."
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              {/* STATUTORY MANDATORY DECLARATION CLAUSE */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Lock size={12} />
                    Statutory Declaration Text (West Bengal SC/ST Rules)
                  </span>
                  <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">
                    Immutable When Signed
                  </Badge>
                </div>

                <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 font-serif text-xs leading-relaxed text-slate-100">
                  &ldquo;I have examined the submitted lineage information and supporting records and declare that the above paternal relationship information is based on the records/evidence placed before me.&rdquo;
                </div>

                <p className="font-bengali text-xs text-amber-200">
                  &ldquo;আমি দাখিলকৃত বংশতালিকা ও সহযোগী নথিপত্র পরীক্ষা ও স্থানীয়ভাবে অনুসন্ধানপূর্বক ঘোষণা করিতেছি যে, উপরোক্ত পৈতৃক রক্তের সম্পর্ক এবং বংশলতিকার তথ্য আমার নিকট উপস্থাপিত প্রমাণ ও তথ্যাবলীর ভিত্তিতে সঠিক।&rdquo;
                </p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="text-[11px] text-slate-400">
                    Signatory: <strong>{activeWardRep.name}</strong>, Elected Member (Ward #{selectedWardForMemberReview})
                  </div>
                  <Button
                    onClick={handleEndorseDeclaration}
                    disabled={isEndorsing}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <ShieldCheck size={14} />
                    <span>{isEndorsing ? "Affixing Digital Seal..." : "Execute & Seal Declaration"}</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Declaration History / Immutability Log */}
            {activeCase.declarationHistory && activeCase.declarationHistory.length > 0 && (
              <Card className="p-4 rounded-2xl border-border/80 space-y-2 text-xs">
                <span className="font-bold text-muted-foreground uppercase text-[10px]">
                  Declaration Audit Trail &amp; Version History
                </span>
                <div className="space-y-1.5">
                  {activeCase.declarationHistory.map((h, i) => (
                    <div key={i} className="p-2 rounded bg-muted/40 flex items-center justify-between text-[11px]">
                      <span>Version {h.version} · Signed by {h.memberName}</span>
                      <span className="font-mono text-muted-foreground">{h.verificationHash}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: CASE FILE & PRINT / OSCAR UPLOAD PREPARATION */}
        {activeTab === "print" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            {/* OSCAR UPLOAD PREPARATION BANNER */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <Sparkles size={16} className="text-blue-600" />
                  <span>Office Upload Preparation Rule (OSCAR / WBPMS Portal Guidance):</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-900/90">
                  For submission on <strong>castecertificatewb.gov.in (OSCAR)</strong>, attach this authenticated Gram Sansad Vamshabriksha Sheet along with the clear scanned copy of the existing SC/ST certificate into a single merged PDF file. (Recommended single PDF file size &lt; 2 MB).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-white text-blue-900 border-blue-300"
                >
                  <a href="https://castcertificatewb.gov.in" target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                    <span>castecertificatewb.gov.in</span>
                    <ExternalLink size={12} />
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-8 text-xs bg-blue-700 text-white font-semibold"
                >
                  <Link to={`/verify?id=${activeCase.currentDeclaration?.verificationHash || activeCase.caseId}`}>
                    <span>Test on /verify</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* PRINT COMPONENT */}
            <GramSansadDeclarationPrint caseData={activeCase} />
          </div>
        )}
      </div>
    </div>
  );
}
