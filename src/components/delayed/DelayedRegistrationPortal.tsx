import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  Plus,
  Printer,
  Home,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Building,
  Info,
  ExternalLink,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface Witness {
  name: string;
  village: string;
  idProof: string;
  phone: string;
}

interface CustomDocument {
  id: string;
  name: string;
  fileName?: string;
  fileSize?: string;
  notes?: string;
}

export default function DelayedRegistrationPortal() {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get("type") === "death" ? "death" : "birth";

  const [appType, setAppType] = useState<"birth" | "death">(initialType);

  useEffect(() => {
    const t = searchParams.get("type");
    if (t === "death" || t === "birth") {
      setAppType(t);
    }
  }, [searchParams]);

  // Subject details
  const [subjectName, setSubjectName] = useState("");
  const [subjectBengaliName, setSubjectBengaliName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventPlace, setEventPlace] = useState("Bagula 2 No GP Area (Home / Local Facility)");
  const [gender, setGender] = useState("male");
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [parentAadhaar, setParentAadhaar] = useState("");
  const [applicantRelation, setApplicantRelation] = useState("Self / Father / Mother");
  const [address, setAddress] = useState("Vill - Bagula, PO - Bagula, PS - Hanskhali, Dist - Nadia, PIN - 741502");
  const [contactPhone, setContactPhone] = useState("");

  // Court & GP references
  const [sdoOrderNo, setSdoOrderNo] = useState("");
  const [sdoOrderDate, setSdoOrderDate] = useState("");
  const [form10RefNo, setForm10RefNo] = useState("");
  const [form10IssueDate, setForm10IssueDate] = useState("");

  // Document 1: Declaration of Five People with signature of Prodhan
  const [doc1ProdhanSigned, setDoc1ProdhanSigned] = useState(true);
  const [doc1FileName, setDoc1FileName] = useState<string | null>("Declaration_Five_People_Prodhan_Attested.pdf");
  const [witnesses, setWitnesses] = useState<Witness[]>([
    { name: "1. Shri Subhas Mondal", village: "Bagula North", idProof: "EPIC: WB/08/045/XXXXX", phone: "9832XXXXXX" },
    { name: "2. Smt. Anita Biswas", village: "Bagula Station Para", idProof: "Aadhaar: XXXX-XXXX-4512", phone: "8910XXXXXX" },
    { name: "3. Shri Tapan Roy", village: "Dakshin Bagula", idProof: "EPIC: WB/08/045/YYYYY", phone: "9733XXXXXX" },
    { name: "4. Smt. Manju Ghosh", village: "Kalambagan", idProof: "Aadhaar: XXXX-XXXX-8921", phone: "9475XXXXXX" },
    { name: "5. Shri Bimal Das", village: "Bagula Bazar", idProof: "EPIC: WB/08/045/ZZZZZ", phone: "9123XXXXXX" },
  ]);

  // Document 2: Form-10 Non Availability Certificate
  const [doc2FileName, setDoc2FileName] = useState<string | null>("Form_10_Non_Availability_Bagula_GP.pdf");

  // Document 3: Daima Certificate (For Birth only, 2 documents)
  const [doc3aAttestationName, setDoc3aAttestationName] = useState<string | null>(
    "Daima_Delivery_Attestation_Certificate.pdf"
  );
  const [doc3bIdProofName, setDoc3bIdProofName] = useState<string | null>(
    "Daima_Aadhaar_ID_Proof.pdf"
  );
  const [daimaName, setDaimaName] = useState("Smt. Kamala Sardar (Traditional Midwife / ASHA)");
  const [daimaVillage, setDaimaVillage] = useState("Bagula 2 No Gram Panchayat");

  // Document 4: Other, I will add names and can add more documents
  const [customDocuments, setCustomDocuments] = useState<CustomDocument[]>([
    {
      id: "doc-init-1",
      name: "SDO Ranaghat Magistrate Permission Order under Sec 13(3)",
      fileName: "SDO_Ranaghat_Magistrate_Order_Sec13_3.pdf",
      fileSize: "420 KB",
      notes: "Mandatory court order permitting registration after 1 year",
    },
    {
      id: "doc-init-2",
      name: "School Board Admit Card (Proof of Date of Birth & Age)",
      fileName: "WBBSE_Admit_Card_Age_Proof.pdf",
      fileSize: "280 KB",
      notes: "Age verification for applicant",
    },
    {
      id: "doc-init-3",
      name: "Parents' Voter Card & Aadhaar Copies",
      fileName: "Parents_Identity_Proof_EPIC.pdf",
      fileSize: "350 KB",
      notes: "Identity and citizenship proof",
    },
  ]);

  const [newDocInputName, setNewDocInputName] = useState("");

  // Load from local storage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bagula_delayed_registration_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.subjectName) setSubjectName(parsed.subjectName);
        if (parsed.customDocuments) setCustomDocuments(parsed.customDocuments);
        if (parsed.form10RefNo) setForm10RefNo(parsed.form10RefNo);
        if (parsed.sdoOrderNo) setSdoOrderNo(parsed.sdoOrderNo);
      }
    } catch (e) {
      console.warn("Could not read local draft", e);
    }
  }, []);

  const handleSaveDraft = () => {
    const draft = {
      appType,
      subjectName,
      subjectBengaliName,
      eventDate,
      eventPlace,
      gender,
      fatherOrHusbandName,
      motherName,
      parentAadhaar,
      applicantRelation,
      address,
      contactPhone,
      sdoOrderNo,
      sdoOrderDate,
      form10RefNo,
      form10IssueDate,
      customDocuments,
      witnesses,
    };
    localStorage.setItem("bagula_delayed_registration_draft", JSON.stringify(draft));
    toast.success("Delayed registration application draft saved locally!");
  };

  const handleReset = () => {
    if (window.confirm("Reset this form? Any unsaved local edits will be cleared.")) {
      localStorage.removeItem("bagula_delayed_registration_draft");
      setSubjectName("");
      setSubjectBengaliName("");
      setEventDate("");
      setSdoOrderNo("");
      setForm10RefNo("");
      toast.info("Form reset to blank state.");
    }
  };

  const handleAddCustomDoc = () => {
    const name = newDocInputName.trim();
    if (!name) {
      toast.error("Please enter a document name");
      return;
    }
    const newDoc: CustomDocument = {
      id: `doc-${Date.now()}`,
      name,
      fileName: `${name.replace(/[^a-zA-Z0-9]/g, "_")}_Scan.pdf`,
      fileSize: "Pending Upload",
      notes: "Additional supporting evidence added by applicant",
    };
    setCustomDocuments([...customDocuments, newDoc]);
    setNewDocInputName("");
    toast.success(`Document added: ${name}`);
  };

  const handleRemoveCustomDoc = (id: string) => {
    setCustomDocuments(customDocuments.filter((d) => d.id !== id));
    toast.info("Document removed");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <Helmet>
        <title>
          Delayed {appType === "birth" ? "Birth" : "Death"} Certificate Application &amp; Document Engine — Bagula 2 No Gram Panchayat
        </title>
        <meta
          name="description"
          content="Official Delayed Birth and Death Registration Application Dossier (Section 13(3) RBD Act 1969) with Declaration of Five People, Form-10 Non-Availability, Daima Certificates, and dynamic custom document management."
        />
      </Helmet>

      {/* Navigation Bar (no-print) */}
      <div className="no-print sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/80 px-4 py-3 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-8 font-medium">
                <ArrowLeft size={14} />
                <span>GP Portal</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border/60" />
            <span className="text-xs font-bold text-foreground">
              Delayed Registration Intake &amp; Document Engine
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-8"
              onClick={handleSaveDraft}
            >
              <Save size={13} />
              <span className="hidden sm:inline">Save Draft</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
              onClick={handleReset}
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-8 bg-primary text-primary-foreground font-semibold shadow-xs"
              onClick={handlePrint}
            >
              <Printer size={13} />
              <span>Print A4 Dossier</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* Header Banner (no-print) */}
        <div className="no-print p-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-primary/40 text-primary font-bold text-xs uppercase tracking-wide">
                  Statutory RBD Act Sec 13(3)
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  Bagula 2 No Gram Panchayat • Hanskhali • Nadia
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Delayed {appType === "birth" ? "Birth" : "Death"} Certificate Application &amp; Document Engine
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-bengali">
                বিলম্বিত জন্ম বা মৃত্যু নিবন্ধন আবেদনপত্র এবং প্রয়োজনীয় নথিপত্র সংযোজন ব্যবস্থা
              </p>
            </div>

            {/* Type Selector Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/80">
              <button
                type="button"
                onClick={() => setAppType("birth")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  appType === "birth"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                👶 Delayed Birth (জন্ম)
              </button>
              <button
                type="button"
                onClick={() => setAppType("death")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  appType === "death"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🕊️ Delayed Death (মৃত্যু)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-xl border border-border/60 bg-background/80 flex items-center gap-2.5">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Prodhan Attestation</p>
                <p className="text-[11px] text-muted-foreground">Countersigned by Smt. Susmita Biswas Barman</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-border/60 bg-background/80 flex items-center gap-2.5">
              <FileText size={18} className="text-blue-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Form-10 Verification</p>
                <p className="text-[11px] text-muted-foreground">Mandatory Non-Availability Certificate</p>
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-border/60 bg-background/80 flex items-center gap-2.5">
              <Building size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">SDO Ranaghat Jurisdiction</p>
                <p className="text-[11px] text-muted-foreground">Magistrate Order under Section 13(3)</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Applicant & Event Details (no-print editing UI) */}
        <div className="no-print p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-5">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <User size={18} className="text-primary" />
              <span>1. {appType === "birth" ? "Child & Parents' Details" : "Deceased & Applicant's Details"} / বিবরণ</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the primary identification details for the delayed registration dossier.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {appType === "birth" ? "Name of Child (English)" : "Name of Deceased (English)"} *
              </Label>
              <Input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Rahul Biswas"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {appType === "birth" ? "Name of Child (Bengali)" : "Name of Deceased (Bengali)"}
              </Label>
              <Input
                value={subjectBengaliName}
                onChange={(e) => setSubjectBengaliName(e.target.value)}
                placeholder="e.g. রাহুল বিশ্বাস"
                className="text-xs font-bengali"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {appType === "birth" ? "Date of Birth (জন্ম তারিখ)" : "Date of Death (মৃত্যু তারিখ)"} *
              </Label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Must be more than 1 year ago for delayed registration</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Gender (লিঙ্গ)</Label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-xs rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="male">Male (পুরুষ)</option>
                <option value="female">Female (মহিলা)</option>
                <option value="other">Other (অন্যান্য)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {appType === "birth" ? "Father's Full Name" : "Father's / Husband's Name"} *
              </Label>
              <Input
                value={fatherOrHusbandName}
                onChange={(e) => setFatherOrHusbandName(e.target.value)}
                placeholder="e.g. Subal Biswas"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {appType === "birth" ? "Mother's Full Name" : "Mother's / Applicant's Name"} *
              </Label>
              <Input
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="e.g. Pratima Biswas"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Place of Occurrence (স্থান)</Label>
              <Input
                value={eventPlace}
                onChange={(e) => setEventPlace(e.target.value)}
                placeholder="e.g. Bagula, Nadia"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">SDO / Magistrate Case No. &amp; Date</Label>
              <Input
                value={sdoOrderNo}
                onChange={(e) => setSdoOrderNo(e.target.value)}
                placeholder="e.g. SDO/RNG/MISC/2026/142 dt 15/01/2026"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">GP Form-10 Certificate Ref No. &amp; Date</Label>
              <Input
                value={form10RefNo}
                onChange={(e) => setForm10RefNo(e.target.value)}
                placeholder="e.g. B2GP/NON-AVAIL/2026/89 dt 05/01/2026"
                className="text-xs"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
              <Label className="text-xs font-semibold">Permanent Residential Address (স্থায়ী ঠিকানা)</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: THE 4 STATUTORY & DYNAMIC DOCUMENTS (no-print) */}
        <div className="no-print space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <span>2. Statutory Document Engine / প্রয়োজনীয় ও কাস্টম প্রমাণ্য নথিসমূহ</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Manage the required documents for the delayed {appType} certificate application.
              </p>
            </div>

            <Badge variant="outline" className="border-primary/40 bg-primary/5 text-primary text-xs">
              Total Documents in Dossier: {3 + (appType === "birth" ? 2 : 0) + customDocuments.length}
            </Badge>
          </div>

          {/* DOCUMENT 1: Declaration of Five People with signature of Prodhan */}
          <div className="p-5 rounded-2xl border-2 border-primary/30 bg-card shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">Document 1</Badge>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Declaration of Five People with the signature of the Prodhan
                  </h3>
                </div>
                <p className="text-xs font-bengali text-primary font-medium">
                  ১. প্রধানের স্বাক্ষরসহ ৫ জন স্থানীয় গণ্যমান্য ব্যক্তির ঘোষণাপত্র
                </p>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Statutory neighbor attestation under Section 13(3) of RBD Act 1969 signed by five local respectable residents of Bagula 2 No Gram Panchayat and countersigned with official seal by Pradhan Smt. Susmita Biswas Barman.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-semibold gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Mandatory
                </Badge>
              </div>
            </div>

            {/* Prodhan Verification Checkbox */}
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer">
                <Checkbox
                  checked={doc1ProdhanSigned}
                  onCheckedChange={(c) => setDoc1ProdhanSigned(c === true)}
                />
                <span className="font-semibold">
                  Signed and officially sealed by Pradhan, Bagula 2 No Gram Panchayat (শ্রীমতী সুস্মিতা বিশ্বাস বর্মন, প্রধান)
                </span>
              </label>

              <Badge variant="outline" className="text-[11px] text-emerald-700 border-emerald-500/40">
                Official Seal Attached
              </Badge>
            </div>

            {/* 5 Witnesses Table */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Details of 5 Local Witnesses (৫ জন সাক্ষীর বিবরণ):
              </Label>
              <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-background text-xs">
                {witnesses.map((w, idx) => (
                  <div key={idx} className="p-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    <span className="font-semibold text-foreground">{w.name}</span>
                    <span className="text-muted-foreground">{w.village}</span>
                    <span className="text-muted-foreground font-mono">{w.idProof}</span>
                    <span className="text-muted-foreground sm:text-right">{w.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload File Box */}
            <div className="p-3 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <FileText size={16} className="text-primary" />
                <span className="font-medium text-foreground">{doc1FileName}</span>
                <span className="text-muted-foreground">(Uploaded • 850 KB PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1">
                  <Upload size={12} /> Replace File
                </Button>
              </div>
            </div>
          </div>

          {/* DOCUMENT 2: Form-10 Non Availability Certificate */}
          <div className="p-5 rounded-2xl border-2 border-primary/30 bg-card shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">Document 2</Badge>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Form-10 Non Availability Certificate
                  </h3>
                </div>
                <p className="text-xs font-bengali text-primary font-medium">
                  ২. ফর্ম-১০ অপ্রাপ্যতা শংসাপত্র (গ্রাম পঞ্চায়েত উপ-নিবন্ধক কর্তৃক প্রদত্ত)
                </p>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Statutory certificate issued by the Sub-Registrar of Bagula 2 No Gram Panchayat under Section 17 of RBD Act, certifying that manual register volumes have been searched and no prior birth/death entry was found.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs font-semibold gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Mandatory
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border/80 bg-background space-y-1">
                <span className="font-bold text-foreground">Issuing Authority:</span>
                <p className="text-muted-foreground">Office of the Sub-Registrar, Births &amp; Deaths, Bagula 2 No Gram Panchayat</p>
              </div>
              <div className="p-3 rounded-xl border border-border/80 bg-background space-y-1">
                <span className="font-bold text-foreground">Search Period Checked:</span>
                <p className="text-muted-foreground">Registers for Hanskhali Block / Bagula GP (All Volumes)</p>
              </div>
            </div>

            {/* Upload File Box */}
            <div className="p-3 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <FileText size={16} className="text-primary" />
                <span className="font-medium text-foreground">{doc2FileName}</span>
                <span className="text-muted-foreground">(Uploaded • 410 KB PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs rounded-lg gap-1">
                  <Upload size={12} /> Replace File
                </Button>
              </div>
            </div>
          </div>

          {/* DOCUMENT 3: Daima Certificate (For Birth only, 2 documents) */}
          {appType === "birth" ? (
            <div className="p-5 rounded-2xl border-2 border-primary/30 bg-card shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground text-xs font-bold">Document 3</Badge>
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Daima Certificate (For Birth only, 2 documents)
                    </h3>
                  </div>
                  <p className="text-xs font-bengali text-primary font-medium">
                    ৩. দাইমা সার্টিফিকেট (শুধুমাত্র জন্মের ক্ষেত্রে, ২টি নথি)
                  </p>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    Statutory evidence of home delivery attended by the local traditional birth attendant (Daima) or accredited health worker in Bagula 2 No Gram Panchayat area. Requires exactly two documentary annexures.
                  </p>
                </div>

                <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs">
                  For Birth Only (2 Files Required)
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3A: Delivery Attestation Certificate */}
                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Document 3A: Daima Delivery Attestation Certificate
                    </span>
                    <Badge variant="outline" className="text-[10px]">Part 1 of 2</Badge>
                  </div>
                  <p className="text-[11px] font-bengali text-muted-foreground">
                    দাইমার প্রসব প্রত্যয়নপত্র (প্রসবকালে উপস্থিত থাকার স্বহস্তে লিখিত বা প্রত্যায়িত সনদ)
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <Label className="text-[11px]">Midwife / Daima Name</Label>
                    <Input
                      value={daimaName}
                      onChange={(e) => setDaimaName(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="truncate">{doc3aAttestationName}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[11px]">
                      Change
                    </Button>
                  </div>
                </div>

                {/* 3B: Daima Identity Proof */}
                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">
                      Document 3B: Daima Identity / Registration Proof
                    </span>
                    <Badge variant="outline" className="text-[10px]">Part 2 of 2</Badge>
                  </div>
                  <p className="text-[11px] font-bengali text-muted-foreground">
                    দাইমার পরিচয়পত্র (আধার কার্ড / ভোটার কার্ড / স্বাস্থ্যকর্মী রেজিস্ট্রেশন কপি)
                  </p>

                  <div className="space-y-1.5 text-xs">
                    <Label className="text-[11px]">Daima Address / Ward</Label>
                    <Input
                      value={daimaVillage}
                      onChange={(e) => setDaimaVillage(e.target.value)}
                      className="text-xs h-8"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg border border-dashed border-border bg-muted/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText size={14} className="text-primary shrink-0" />
                      <span className="truncate">{doc3bIdProofName}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-[11px]">
                      Change
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-muted bg-muted/10 text-xs text-muted-foreground flex items-center gap-2">
              <Info size={16} />
              <span>
                <strong>Document 3 (Daima Certificate):</strong> Excluded automatically for Delayed Death Registration. (Applicable for Birth applications only).
              </span>
            </div>
          )}

          {/* DOCUMENT 4: Other, I will add names and can add more documents */}
          <div className="p-5 rounded-2xl border-2 border-primary/30 bg-card shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold">Document 4</Badge>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">
                    Other, I will add names and can add more documents
                  </h3>
                </div>
                <p className="text-xs font-bengali text-primary font-medium">
                  ৪. অন্যান্য প্রমাণ্য নথি (পছন্দমতো নাম ও একাধিক নথি সংযোজনযোগ্য)
                </p>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  Dynamic document adder: Enter any custom document name (such as SDO Court Order, Hospital Admission Slips, School Admit Cards, Cremation Certificates, Land Porcha) and add unlimited supporting files to this application dossier.
                </p>
              </div>

              <Badge variant="outline" className="text-xs border-primary/40 bg-primary/5 text-primary">
                {customDocuments.length} Custom Documents Added
              </Badge>
            </div>

            {/* Input Bar to Add Custom Documents */}
            <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-3">
              <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Plus size={14} /> Add Any Custom Named Document
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newDocInputName}
                  onChange={(e) => setNewDocInputName(e.target.value)}
                  placeholder="e.g. SDO Ranaghat Order under Sec 13(3), School Admit Card, Hospital Discharge Card..."
                  className="text-xs bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomDoc();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCustomDoc}
                  className="text-xs gap-1.5 shrink-0 bg-primary text-primary-foreground font-semibold"
                >
                  <Plus size={14} /> Add Document
                </Button>
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-muted-foreground">
                <span>Quick Suggestions:</span>
                {[
                  "SDO Order Copy under Sec 13(3)",
                  "Madhyamik Admit Card",
                  "Cremation / Burial Receipt",
                  "Hospital Discharge Summary",
                  "Parents' Land Porcha (খতিয়ান)",
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      setNewDocInputName(sug);
                    }}
                    className="px-2 py-0.5 rounded-md border border-border/80 bg-background hover:bg-primary/10 hover:text-primary transition-colors text-left"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Documents List */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Attached Custom Documents ({customDocuments.length}):
              </Label>

              {customDocuments.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
                  No additional documents added yet. Use the field above to add any document name.
                </div>
              ) : (
                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-background">
                  {customDocuments.map((doc, idx) => (
                    <div
                      key={doc.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {idx + 1}. {doc.name}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            Custom File
                          </Badge>
                        </div>
                        {doc.notes && (
                          <p className="text-[11px] text-muted-foreground">{doc.notes}</p>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{doc.fileName}</span>
                          <span>•</span>
                          <span>{doc.fileSize}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                          onClick={() => handleRemoveCustomDoc(doc.id)}
                        >
                          <Trash2 size={13} /> Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL PRINTABLE A4 DOSSIER & ANNEXURE (Visible on Screen & in Print)   */}
        {/* ========================================================================= */}
        <div className="mt-8 p-8 bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-md font-sans text-xs space-y-6 print:border-0 print:shadow-none print:p-0 print:m-0 print:rounded-none">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-700">
              Government of West Bengal • Department of Health &amp; Family Welfare
            </p>
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-slate-950 uppercase">
              Office of the Bagula 2 No Gram Panchayat
            </h2>
            <p className="text-xs font-semibold text-slate-800">
              P.O. Bagula, P.S. Hanskhali, District Nadia, West Bengal — 741502
            </p>
            <p className="text-[11px] font-medium text-slate-700">
              Sub-Registrar (Births &amp; Deaths) • Registration of Births &amp; Deaths Act, 1969 (Section 13(3))
            </p>
            <div className="inline-block mt-1 px-3 py-0.5 rounded border border-slate-800 font-bold uppercase text-[11px] bg-slate-100">
              Statutory Application Dossier &amp; Mandatory Document Checklist
            </div>
          </div>

          {/* Dossier Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] border border-slate-400 p-2.5 rounded bg-slate-50">
            <div>
              <span className="font-bold">Application Type:</span>{" "}
              <span className="uppercase font-semibold text-slate-900">
                Delayed {appType} Registration
              </span>
            </div>
            <div>
              <span className="font-bold">Form-10 Ref:</span>{" "}
              <span className="font-mono">{form10RefNo || "Pending / Attached"}</span>
            </div>
            <div>
              <span className="font-bold">SDO Order Ref:</span>{" "}
              <span className="font-mono">{sdoOrderNo || "Pending / Attached"}</span>
            </div>
            <div>
              <span className="font-bold">Date of Intake:</span>{" "}
              <span>{new Date().toLocaleDateString("en-IN")}</span>
            </div>
          </div>

          {/* Subject Details Table */}
          <div className="space-y-1">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-800 border-b border-slate-300 pb-0.5">
              1. Registration Identification Data:
            </h3>
            <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100 w-1/4">Name of Subject:</td>
                  <td className="p-1.5 font-semibold">{subjectName || "[Not Provided]"}</td>
                  <td className="p-1.5 font-bold bg-slate-100 w-1/4">Bengali Script Name:</td>
                  <td className="p-1.5 font-bengali">{subjectBengaliName || "-"}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100">Date of Occurrence:</td>
                  <td className="p-1.5">{eventDate || "[Pending Date]"}</td>
                  <td className="p-1.5 font-bold bg-slate-100">Gender:</td>
                  <td className="p-1.5 uppercase">{gender}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="p-1.5 font-bold bg-slate-100">
                    {appType === "birth" ? "Father's Full Name:" : "Father's / Husband's Name:"}
                  </td>
                  <td className="p-1.5">{fatherOrHusbandName || "-"}</td>
                  <td className="p-1.5 font-bold bg-slate-100">Mother's / Applicant's Name:</td>
                  <td className="p-1.5">{motherName || "-"}</td>
                </tr>
                <tr>
                  <td className="p-1.5 font-bold bg-slate-100">Place &amp; Address:</td>
                  <td colSpan={3} className="p-1.5">{address}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* STATUTORY DOCUMENT ATTACHMENT TABLE */}
          <div className="space-y-1.5">
            <h3 className="font-bold uppercase tracking-wider text-[11px] text-slate-800 border-b border-slate-300 pb-0.5">
              2. Mandatory &amp; Custom Documentary Attachments Checklist:
            </h3>
            <table className="w-full text-left border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-400 font-bold">
                  <th className="p-1.5 w-12 text-center">Sl</th>
                  <th className="p-1.5">Statutory Document Category &amp; Title</th>
                  <th className="p-1.5 w-36">Authority / Signatory</th>
                  <th className="p-1.5 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {/* 1. Declaration of Five People */}
                <tr>
                  <td className="p-1.5 text-center font-bold">1</td>
                  <td className="p-1.5">
                    <strong>Declaration of Five People with the signature of the Prodhan</strong>
                    <div className="text-[10px] text-slate-600 font-bengali">
                      প্রধানের স্বাক্ষরসহ ৫ জন স্থানীয় বাসিন্দার প্রত্যয়নপত্র (পাঁচজন সাক্ষীর নাম নথিভুক্ত)
                    </div>
                  </td>
                  <td className="p-1.5">Pradhan, Bagula 2 No GP &amp; 5 Witnesses</td>
                  <td className="p-1.5 text-center font-bold text-emerald-800">
                    {doc1ProdhanSigned ? "✓ ATTESTED" : "PENDING"}
                  </td>
                </tr>

                {/* 2. Form-10 Non Availability Certificate */}
                <tr>
                  <td className="p-1.5 text-center font-bold">2</td>
                  <td className="p-1.5">
                    <strong>Form-10 Non Availability Certificate</strong>
                    <div className="text-[10px] text-slate-600 font-bengali">
                      ফর্ম-১০ অপ্রাপ্যতা শংসাপত্র (পূর্বের নথিভুক্তিকরণ না থাকার সনদ)
                    </div>
                  </td>
                  <td className="p-1.5">GP Sub-Registrar</td>
                  <td className="p-1.5 text-center font-bold text-emerald-800">✓ ATTACHED</td>
                </tr>

                {/* 3. Daima Certificate (For Birth only, 2 documents) */}
                {appType === "birth" ? (
                  <>
                    <tr className="bg-slate-50">
                      <td className="p-1.5 text-center font-bold">3A</td>
                      <td className="p-1.5">
                        <strong>Daima Certificate: Delivery Attestation Certificate</strong>
                        <div className="text-[10px] text-slate-600 font-bengali">
                          দাইমার প্রসব প্রত্যয়নপত্র (সনাতনী দাইমা / প্রসব পরিচালনাকারীর সনদ)
                        </div>
                      </td>
                      <td className="p-1.5">{daimaName}</td>
                      <td className="p-1.5 text-center font-bold text-emerald-800">✓ ATTACHED</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-1.5 text-center font-bold">3B</td>
                      <td className="p-1.5">
                        <strong>Daima Certificate: Identity / Registration Proof</strong>
                        <div className="text-[10px] text-slate-600 font-bengali">
                          দাইমার পরিচয়পত্র (আধার কার্ড / ভোটার কার্ড কপি)
                        </div>
                      </td>
                      <td className="p-1.5">Aadhaar / EPIC Verified</td>
                      <td className="p-1.5 text-center font-bold text-emerald-800">✓ ATTACHED</td>
                    </tr>
                  </>
                ) : (
                  <tr className="text-slate-400 bg-slate-50">
                    <td className="p-1.5 text-center font-bold">3</td>
                    <td className="p-1.5 italic">
                      Daima Certificate (For Birth only, 2 documents)
                    </td>
                    <td className="p-1.5 italic">Not Applicable</td>
                    <td className="p-1.5 text-center italic">EXCLUDED (DEATH)</td>
                  </tr>
                )}

                {/* 4. Other, I will add names and can add more documents */}
                {customDocuments.map((doc, idx) => (
                  <tr key={doc.id}>
                    <td className="p-1.5 text-center font-bold">4.{idx + 1}</td>
                    <td className="p-1.5">
                      <strong>{doc.name}</strong>
                      {doc.notes && (
                        <div className="text-[10px] text-slate-600">{doc.notes}</div>
                      )}
                    </td>
                    <td className="p-1.5 font-mono text-[10px]">{doc.fileName}</td>
                    <td className="p-1.5 text-center font-bold text-emerald-800">✓ ATTACHED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Endorsement & Signatures Area */}
          <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[11px] border-t border-slate-400">
            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-600 pt-1 font-semibold">
                Signature / LTI of Applicant
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-600 pt-1 font-semibold">
                Verified by Executive Assistant
                <br />
                <span className="text-[10px] text-slate-600">Bagula 2 No Gram Panchayat</span>
              </div>
            </div>

            <div className="space-y-12">
              <div className="h-10" />
              <div className="border-t border-slate-600 pt-1 font-bold">
                Pradhan &amp; Sub-Registrar
                <br />
                <span className="text-[10px] font-normal text-slate-700">
                  Bagula 2 No Gram Panchayat (Official Seal)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guidance */}
        <div className="no-print p-4 rounded-xl border border-border/60 bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            Office of the Bagula 2 No Gram Panchayat • Hanskhali Block • District Nadia • Pin 741502
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs gap-1.5"
              onClick={handlePrint}
            >
              <Printer size={13} /> Print Application Dossier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
