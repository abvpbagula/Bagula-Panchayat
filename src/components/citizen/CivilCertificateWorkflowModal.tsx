import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ScrollText,
  Users,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Printer,
  Copy,
  Check,
  ArrowRight,
  Clock,
  ShieldCheck,
  Scale,
  Building2,
  FileText,
  Info,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Link as LinkIcon,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import WarishApplicationFormPrint from "@/components/warish/WarishApplicationFormPrint";

interface CivilCertificateWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "warish" | "dependent" | "linkage";
}

export default function CivilCertificateWorkflowModal({
  open,
  onOpenChange,
  initialTab = "warish",
}: CivilCertificateWorkflowModalProps) {
  const [activeTab, setActiveTab] = useState<"warish" | "dependent" | "linkage">(initialTab);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLinkageText, setCopiedLinkageText] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState<"workflow" | "documents" | "legal" | "sample" | "form" | "faq">("workflow");

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setSelectedSubTab("workflow");
    }
  }, [open, initialTab]);

  // Sample Affidavit Text for Warish
  const warishAffidavitSample = `BEFORE THE NOTARY PUBLIC / 1ST CLASS EXECUTIVE MAGISTRATE AT RANAGHAT / KRISHNANAGAR, NADIA

AFFIDAVIT FOR DECLARATION OF LEGAL HEIRS (VAMSHABRIKSHA)
(Section 19 of WB Panchayat Act, 1973 & Hindu Succession Act, 1956)

I, Sri/Smt. ________________________, son/daughter/wife of Late ________________________, aged about _____ years, by faith Hindu/Muslim, by occupation _________________, residing permanently at Village: ________________________, Post Office: Bagula, Police Station: Hanskhali, District: Nadia, West Bengal, PIN: 741502, within the territorial jurisdiction of Bagula 2 No Gram Panchayat (Sansad No. ____), do hereby solemnly affirm and state on oath as follows:

1. That my father/mother/husband/relative Late ________________________ was a permanent bona fide resident of the aforesaid address under Bagula 2 No Gram Panchayat, Nadia.
2. That the said Late ________________________ breathed his/her last on dated __/__/____ at (Hospital/Home) ________________________ as per Registration No: ________________________ issued by Janma-Mrityu Tathya Portal / Health Authority.
3. That during his/her lifetime, the deceased was the absolute owner of landed property / bank accounts / service benefits.
4. That the deceased left behind surviving ONLY the following legal heirs (Vamshabriksha):
   Sl No. | Name of Legal Heir | Relationship with Deceased | Age | Marital Status | Present Address & Aadhaar No.
   1.     | __________________ | _________________________ | ___ | ______________ | ___________________________
   2.     | __________________ | _________________________ | ___ | ______________ | ___________________________
   3.     | __________________ | _________________________ | ___ | ______________ | ___________________________
   4.     | __________________ | _________________________ | ___ | ______________ | ___________________________

5. That apart from the above-mentioned individuals, the deceased left behind NO OTHER son, daughter, widow, mother, or legal heir either in India or abroad.
6. That the married daughters (if any) are legally acknowledged as equal coparceners under the Hindu Succession (Amendment) Act, 2005 and have been duly accounted for.
7. That all statements made above are true to my knowledge and belief and nothing material has been concealed.

Deponent Signature: _________________________
Identified by me (Advocate): _________________`;

  const copyAffidavit = () => {
    navigator.clipboard.writeText(warishAffidavitSample);
    setCopiedText(true);
    toast.success("Sample Court Affidavit copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Sample Statutory Linkage Certificate Format (Bagula II GP Standard)
  const linkageProformaSample = `Office of the
BAGULA II GRAM PANCHAYAT
(UNDER HANSKHALI PANCHAYAT SAMITY)
Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Block: Hanskhali
Dist.: Nadia, West Bengal, PIN: 741502
E-mail: Bagula2NoGP111@Gmail.Com

Smt. Susmita Biswas Barman                               Sri Manaranjan Bhowmick
         Prodhan                                               Upa-Prodhan

Memo No: _________ /BGL-II /2026                               Date: ___/___/2026

                              TO WHOM IT MAY CONCERN

This is to certify that Sri/Smt. _______________________________________________________,
w/d/s of _____________________________________________________________________________,
Vill: __________________________, P.O.: ______________________, P.S. and Block: Hanskhali,
District Nadia, under the jurisdiction of this Gram Panchayat, is personally known to me.

It is further certified that he/she is registered / unregistered as a voter under 89 Ranaghat (S.C.) North East Assembly Constituency, Part No. __________, Serial No. __________ in the Draft Electoral Roll 2025 and his/her EPIC No. __________________________.

It is also certified that his/her father and mother are enrolled as voters in the Draft Electoral Roll 2025 under 89 Ranaghat (S.C.) North East Assembly Constituency, details of which are given below:

  Name                      Relation   Part No.   Serial Number   EPIC No.
  ________________________  Father     ________   _____________   ________________
  ________________________  Mother     ________   _____________   ________________

It is further certified that he/she is lawfully married to Sri/Smt. _______________________________________________________,
S/o / W/o Late __________________________________________, Resident of Village __________________________________________,
Post Office __________________________________________, Police Station __________________________________________,
Panchayat __________________________________________, Development Block __________________________________________.

He/She intends to be enrolled as a beneficiary voter of the said Assembly Constituency.
I wish him/her every success in life.


        Counter Signed                                       Yours faithfully,


    E.A / Secretary / Sahayak                                     Prodhan
    Bagula II Gram Panchayat                             Bagula II Gram Panchayat
    (Official Round Seal)                                (Official Round Seal)`;

  const copyLinkageProforma = () => {
    navigator.clipboard.writeText(linkageProformaSample);
    setCopiedLinkageText(true);
    toast.success("Official Linkage Certificate format copied!");
    setTimeout(() => setCopiedLinkageText(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/5 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold">
                  🏛️ Bagula 2 No Gram Panchayat · Hanskhali, Nadia
                </Badge>
                <Badge variant="secondary" className="text-[11px] font-medium">
                  Direct Civil Certification Workflow
                </Badge>
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Citizen Certificate Workflow & Guidelines</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
                সম্পূর্ণ সরকারি নির্দেশিকা: ওয়ারিশান, ডিপেন্ডেন্ট ও ভোটার লিঙ্কেজ (পারিবারিক/বৈবাহিক সংযোগ) শংসাপত্র প্রাপ্তির নিয়মাবলী ও অনলাইন আবেদন
              </DialogDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 rounded-lg border-border/60"
                onClick={handlePrint}
              >
                <Printer size={13} />
                <span>Print Guide</span>
              </Button>
            </div>
          </div>

          {/* Top Certificate Switcher Tabs */}
          <div className="mt-4 flex gap-2 p-1 bg-muted/60 rounded-xl max-w-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab("warish");
                setSelectedSubTab("workflow");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "warish"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ScrollText size={14} />
              <span>1. Warish (উত্তরাধিকার)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("dependent");
                setSelectedSubTab("workflow");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "dependent"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={14} />
              <span>2. Dependent (পোষ্য)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("linkage");
                setSelectedSubTab("workflow");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "linkage"
                  ? "bg-white text-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LinkIcon size={14} />
              <span>3. Linkage (ভোটার/পারিবারিক)</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* WARISH CERTIFICATE CONTENT */}
          {activeTab === "warish" && (
            <div className="space-y-6">
              {/* Quick Specs Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Clock size={12} className="text-primary" /> Turnaround
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">7 to 15 Days</p>
                  <p className="text-[10px] text-muted-foreground">Post Sansad verification</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Building2 size={12} className="text-primary" /> Issuing Desk
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">GP Pradhan</p>
                  <p className="text-[10px] text-muted-foreground">Smt. Susmita Biswas Barman</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Scale size={12} className="text-primary" /> Legal Framework
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">HSA 1956 & WBPA</p>
                  <p className="text-[10px] text-muted-foreground">Sec 19 WB Panchayat Act</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" /> Validity
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">Permanent</p>
                  <p className="text-[10px] text-muted-foreground">QR-verified digital record</p>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex gap-2 border-b border-border/60 pb-2 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("workflow")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "workflow"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>1. 6-Step Workflow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("documents")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "documents"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>2. Required Documents (7)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("legal")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "legal"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>3. Legal Heir Rules & Rights</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("sample")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "sample"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>4. Sample Court Affidavit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("form")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "form"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Printer size={13} />
                  <span>5. অফিশিয়াল আবেদনপত্র (A4 Form)</span>
                </button>
              </div>

              {/* Sub-tab 1: Workflow */}
              {selectedSubTab === "workflow" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-foreground flex items-start gap-2.5">
                    <Info size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-primary">Purpose of Warish (Legal Heir) Certificate:</p>
                      <p className="text-muted-foreground mt-0.5">
                        Mandatory for BL&LRO land mutation (জমির মিউটেশন ও পরচা তৈরি), settlement of deceased family member's bank accounts & fixed deposits, family pension disbursement, life insurance death claims, and ancestral property partition.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        step: 1,
                        title: "Obtain Official Death Certificate & Panchayat Tax Receipt",
                        bn: "ডিজিটাল মৃত্যু শংসাপত্র ও পঞ্চায়েত কর পরিশোধ",
                        desc: "Procure the digital QR-coded Death Certificate of the deceased from Janma-Mrityu Tathya (CRS) portal or issuing hospital. Verify that current year property tax (Khajna) of Bagula 2 No Gram Panchayat is paid.",
                        tip: "The spelling of the deceased's name and father/husband name on the death certificate must strictly match land deeds and heir Aadhaar cards.",
                        actor: "Citizen / Family",
                      },
                      {
                        step: 2,
                        title: "Execute Court Affidavit with Complete Family Tree (Vamshabriksha)",
                        bn: "নোটারি বা ম্যাজিস্ট্রেটের সম্মুখে বংশবৃক্ষ হলফনামা সম্পাদন",
                        desc: "Draft a sworn affidavit before a 1st Class Judicial Magistrate, Executive Magistrate, or Notary Public. List ALL living Class-I legal heirs (sons, married/unmarried daughters, widow, mother) with age and marital status.",
                        tip: "Under the 2005 amendment to the Hindu Succession Act, married daughters have equal coparcenary rights and CANNOT be excluded under penalty of law.",
                        actor: "Notary / Advocate",
                      },
                      {
                        step: 3,
                        title: "Local Gram Sansad Member Physical Field Enquiry",
                        bn: "স্থানীয় গ্রাম সংসদ সদস্যের সরজমিন পরিদর্শন ও ২ জন সাক্ষীর স্বাক্ষর",
                        desc: "Present the affidavit and genealogy to the elected Gram Sansad Member of your ward (Sansad 1 to 30 of Bagula 2 No Gram Panchayat). The member conducts a local village enquiry with two independent neighbors to attest that no heirs were concealed.",
                        tip: "Keep copies of Aadhaar cards of two local neighbor witnesses ready for the member's report.",
                        actor: "Elected Ward Member",
                      },
                      {
                        step: 4,
                        title: "Submit Online or at GP DEO Desk",
                        bn: "অনলাইন পোর্টাল বা পঞ্চায়েত ডিইও ডেস্কে আবেদনপত্র দাখিল",
                        desc: "Apply directly via the Bagula 2 No Gram Panchayat Online Portal (/apply/warish) by uploading scans of death certificate, affidavit, and heir ID proofs. Alternatively, hand over the physical dossier at the Bagula 2 No Gram Panchayat office DEO counter.",
                        tip: "Note your generated Acknowledgment Reference Number for online tracking at /verify.",
                        actor: "Online Portal / GP DEO",
                      },
                      {
                        step: 5,
                        title: "Administrative Scrutiny by Executive Assistant & Secretary",
                        bn: "দাপ্তরিক যাচাই ও ৭ দিনের গণবিজ্ঞপ্তি (প্রযোজ্য ক্ষেত্রে)",
                        desc: "The GP office cross-checks land records against the GP assessment register and inspects the validity of the affidavit. In case of disputed or multi-branch inheritance, a 7-day public notice is displayed on the GP notice board for objections.",
                        tip: "If any family member has an objection, they must submit written grounds within the 7-day window.",
                        actor: "Executive Assistant / Secretary",
                      },
                      {
                        step: 6,
                        title: "Final Approval by GP Pradhan & Digital Certificate Issuance",
                        bn: "প্রধানের চূড়ান্ত অনুমোদন ও ডিজিটাল কিউআর শংসাপত্র প্রদান",
                        desc: "GP Pradhan Smt. Susmita Biswas Barman digitally approves the file. The official Warish Certificate is generated with a cryptographic verification ID and QR code, immediately verifiable across West Bengal.",
                        tip: "Download the watermarked digital copy anytime or collect an embossed physical copy from the GP office.",
                        actor: "GP Pradhan",
                      },
                    ].map((w) => (
                      <div
                        key={w.step}
                        className="p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all flex gap-3.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {w.step}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-1">
                            <h4 className="text-xs font-bold text-foreground">{w.title}</h4>
                            <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {w.actor}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-primary/90 font-bengali">
                            {w.bn}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {w.desc}
                          </p>
                          <div className="text-[11px] text-amber-800 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-1 flex items-start gap-1.5">
                            <span className="font-bold shrink-0">💡 Pro Tip:</span>
                            <span>{w.tip}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Required Documents */}
              {selectedSubTab === "documents" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground">
                    All uploaded files should be clear, legible scans in PDF or JPG format. Ensure no text or seals are clipped.
                  </div>

                  <div className="grid gap-2.5">
                    {[
                      {
                        name: "Digital Death Certificate of Deceased",
                        bn: "মৃত ব্যক্তির ডিজিটাল কিউআর মৃত্যু শংসাপত্র (CRS / হাসপাতাল)",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 2 MB",
                        detail: "Issued by Janma-Mrityu Tathya portal, municipality, or government hospital.",
                      },
                      {
                        name: "Sworn Court Affidavit with Family Tree (Vamshabriksha)",
                        bn: "নোটারি বা ১ম শ্রেণীর ম্যাজিস্ট্রেটের সম্মুখে সম্পাদিত বংশবৃক্ষ হলফনামা",
                        mandatory: true,
                        format: "Original / PDF",
                        size: "Max 2 MB",
                        detail: "Declaring all surviving legal heirs, ages, relations, and declaring no other heir exists.",
                      },
                      {
                        name: "Current Year Bagula 2 No Gram Panchayat Property Tax / Khajna Receipt",
                        bn: "বগুলা ২ নং গ্রাম পঞ্চায়েতের হালসনের ট্যাক্স / খাজনা রশিদ",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 1 MB",
                        detail: "Proves domicile and clear municipal assessment within GP area.",
                      },
                      {
                        name: "Aadhaar Card & Voter ID of ALL Surviving Legal Heirs",
                        bn: "সকল বৈধ ওয়ারিশানের আধার কার্ড ও ভোটার কার্ড",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 2 MB each",
                        detail: "Mandatory for every son, daughter, widow, or mother listed in the genealogy.",
                      },
                      {
                        name: "Land Deed (দলিল) or RoR / Porcha (খতিয়ান)",
                        bn: "জমির মূল দলিল বা পরচা / আর.ও.আর খতিয়ান",
                        mandatory: true,
                        format: "PDF / Reference",
                        size: "Max 2 MB",
                        detail: "Showing deceased's recorded land/property ownership in Hanskhali / Nadia.",
                      },
                      {
                        name: "Gram Sansad Member Enquiry Report & 2 Witness Signatures",
                        bn: "গ্রাম সংসদ সদস্যের সরজমিন তদন্ত রিপোর্ট ও ২ জন স্থানীয় সাক্ষীর স্বাক্ষর",
                        mandatory: true,
                        format: "Physical / PDF",
                        size: "Max 2 MB",
                        detail: "Endorsement from elected ward member of Bagula 2 No Gram Panchayat with 2 local neighbor voter proofs.",
                      },
                      {
                        name: "Death Certificate of any Pre-deceased Legal Heir",
                        bn: "পূর্বে মৃত কোনো ওয়ারিশান থাকলে তাঁর মৃত্যু শংসাপত্র ও উত্তরাধিকারী সংযোগ",
                        mandatory: false,
                        format: "PDF / JPG",
                        size: "Max 1 MB",
                        detail: "Required only if a son or daughter passed away earlier, leaving grandchildren entitled to shares.",
                      },
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border/50 bg-card flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2
                            size={16}
                            className={doc.mandatory ? "text-primary mt-0.5 shrink-0" : "text-muted-foreground mt-0.5 shrink-0"}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{doc.name}</span>
                              {doc.mandatory ? (
                                <Badge variant="destructive" className="text-[9px] py-0 px-1.5 h-4">Mandatory</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">Conditional</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-primary font-medium font-bengali mt-0.5">
                              {doc.bn}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {doc.detail}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-foreground">
                            {doc.format}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{doc.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Legal Rules */}
              {selectedSubTab === "legal" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Scale size={15} className="text-amber-700" />
                      CRITICAL LEGAL MANDATE: Equal Rights for Married Daughters
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      Pursuant to the landmark Supreme Court ruling in <em>Vineeta Sharma v. Rakesh Sharma (2020)</em> interpreting the <strong>Hindu Succession (Amendment) Act, 2005</strong>, daughters—regardless of whether married or unmarried, and regardless of whether the father passed away before 2005—are coparceners by birth with rights equal to sons.
                    </p>
                    <p className="text-xs text-amber-900/90 font-medium font-bengali">
                      হিন্দু উত্তরাধিকার (সংশোধনী) আইন ২০০৫ অনুযায়ী বিবাহিতা বা অবিবাহিতা কন্যা পুত্রের সমান অংশীদার। কোনো ওয়ারিশান শংসাপত্রে কন্যাসন্তানের নাম বাদ দেওয়া বেআইনি ও দণ্ডনীয় অপরাধ।
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <Card className="p-4 space-y-2 border-border/60">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-primary" /> Class-I Heirs (Direct Inheritance)
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Sons (বিবাহিত বা অবিবাহিত পুত্র)</li>
                        <li>• Daughters (বিবাহিতা, অবিবাহিতা বা বিধবা কন্যা)</li>
                        <li>• Surviving Widow / Husband (মৃতের স্বামী বা স্ত্রী)</li>
                        <li>• Mother of the deceased (মৃতের মা)</li>
                        <li>• Children of a predeceased son/daughter</li>
                      </ul>
                      <p className="text-[10px] text-muted-foreground pt-1 border-t">
                        Father and siblings are Class-II heirs and ONLY inherit if NO Class-I heir exists.
                      </p>
                    </Card>

                    <Card className="p-4 space-y-2 border-border/60">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-600" /> Ground for Cancellation & Penalties
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Deliberate omission of any daughter or widow</li>
                        <li>• False affidavit under Section 193/199 Indian Penal Code</li>
                        <li>• Fabricated local witness or Sansad report</li>
                        <li>• Fake or forged death certificate</li>
                      </ul>
                      <p className="text-[10px] text-rose-600/90 pt-1 border-t font-medium">
                        Disputes will freeze the BL&LRO land mutation process immediately.
                      </p>
                    </Card>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Sample Affidavit */}
              {selectedSubTab === "sample" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">Standard Legal Heir Affidavit & Vamshabriksha Format</h4>
                      <p className="text-[11px] text-muted-foreground">
                        Execute on Non-Judicial Stamp Paper (₹10 or ₹20) before a Notary Public or Magistrate at Ranaghat.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                      onClick={copyAffidavit}
                    >
                      {copiedText ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      <span>{copiedText ? "Copied to Clipboard!" : "Copy Affidavit Text"}</span>
                    </Button>
                  </div>

                  <div className="relative rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto max-h-72 select-all">
                    <pre className="whitespace-pre-wrap">{warishAffidavitSample}</pre>
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Official A4 Application Form */}
              {selectedSubTab === "form" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        বগুলা ২নং গ্রাম পঞ্চায়েত · অফিশিয়াল উত্তরাধিকার আবেদনপত্র
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Printable physical application form for submission to Ward Member & Gram Panchayat Sub-Registrar.
                      </p>
                    </div>
                    <Button asChild size="sm" className="rounded-xl text-xs gap-1.5 bg-primary text-primary-foreground font-semibold">
                      <Link to="/warish-application-form" target="_blank">
                        <Printer size={13} />
                        <span>Open Full Screen A4 Print</span>
                      </Link>
                    </Button>
                  </div>

                  <WarishApplicationFormPrint showControls={true} />
                </div>
              )}

              {/* Action Bar for Warish */}
              <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-foreground">Ready with all 7 documents?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Submit your application via the Bagula 2 No Gram Panchayat Online Portal or GP Help Desk.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto text-xs rounded-xl gap-1.5 border border-primary/20 font-medium">
                    <Link to="/warish-application-form">
                      <Printer size={13} />
                      <span>Download A4 Form</span>
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs rounded-xl">
                    <Link to="/verify">
                      <span>Track Existing File</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full sm:w-auto text-xs rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5 shadow-sm">
                    <Link to="/apply/warish">
                      <span>Apply Online</span>
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DEPENDENT CERTIFICATE CONTENT */}
          {activeTab === "dependent" && (
            <div className="space-y-6">
              {/* Quick Specs Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Clock size={12} className="text-primary" /> Turnaround
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">3 to 7 Days</p>
                  <p className="text-[10px] text-muted-foreground">Upon scrutiny of pay slip/PPO</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Building2 size={12} className="text-primary" /> Issuing Desk
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">GP Pradhan</p>
                  <p className="text-[10px] text-muted-foreground">Bagula 2 No Gram Panchayat</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <ShieldCheck size={12} className="text-primary" /> Primary Purpose
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">Medical & Jobs</p>
                  <p className="text-[10px] text-muted-foreground">CGHS, WBHS, Railway, DIH</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Clock size={12} className="text-emerald-600" /> Certificate Validity
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">1 Year</p>
                  <p className="text-[10px] text-muted-foreground">Renewable annually</p>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex gap-2 border-b border-border/60 pb-2 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("workflow")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "workflow"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>1. 5-Step Workflow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("documents")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "documents"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>2. Required Documents (7)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("legal")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 shrink-0 ${
                    selectedSubTab === "legal"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span>3. Who Qualifies as Dependent?</span>
                </button>
              </div>

              {/* Sub-tab 1: Workflow */}
              {selectedSubTab === "workflow" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 text-xs text-foreground flex items-start gap-2.5">
                    <Info size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-primary">Purpose of Dependent (পোষ্য) Certificate:</p>
                      <p className="text-muted-foreground mt-0.5">
                        Required by Eastern Railway, Defence, Central Govt (CGHS), West Bengal Health Scheme (WBHS), and public sector undertakings for adding parents/spouse/children to medical treatment cards, railway passes, and compassionate appointments under Died-in-Harness scheme.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        step: 1,
                        title: "Check Departmental Proforma & Requirements",
                        bn: "নিয়োগকারী দপ্তর বা কর্তৃপক্ষের নির্দিষ্ট ফরম্যাট যাচাই",
                        desc: "Verify whether your employer (e.g. Eastern Railway, WBHS, Postal, Armed Forces) requires the GP certificate on their specific proforma or accepts the Bagula 2 No Gram Panchayat standard certificate.",
                        tip: "If a specific departmental proforma is provided, keep it ready along with the application.",
                        actor: "Applicant / Dept",
                      },
                      {
                        step: 2,
                        title: "Gather Principal Earner Proof & Dependent Non-Earning Proof",
                        bn: "কর্মচারীর বর্তমান পে-স্লিপ ও পোষ্যের উপার্জনহীনতার প্রমাণপত্র",
                        desc: "Collect the employee's latest monthly pay slip, Pension Payment Order (PPO), or departmental identity card. For the dependent, prepare an affidavit or declaration stating that they have no independent taxable income.",
                        tip: "If the dependent child is over 18 years old, attach an ongoing college/school student bonafide certificate.",
                        actor: "Principal Earner",
                      },
                      {
                        step: 3,
                        title: "Establish Shared Domicile in Bagula 2 No Gram Panchayat",
                        bn: "একত্রে বসবাসের প্রমাণ ও পারিবারিক ডিজিটাল রেশন কার্ড",
                        desc: "Provide the family Digital Ration Card or Voter List showing that the employee/pensioner and the dependent person reside together under the same roof within Bagula 2 No Gram Panchayat.",
                        tip: "Both the employee's and dependent's Aadhaar cards must show a residence within Bagula 2 No Gram Panchayat area.",
                        actor: "Citizen",
                      },
                      {
                        step: 4,
                        title: "Gram Sansad Member Field Attestation",
                        bn: "গ্রাম সংসদ সদস্যের সরজমিন পরিদর্শন ও প্রত্যয়ন",
                        desc: "The elected Gram Sansad Member of the respective ward certifies that the dependent is genuinely maintained by the employee and does not engage in any separate business or employment.",
                        tip: "The member confirms actual co-residence and financial dependency in their field report.",
                        actor: "Ward Sansad Member",
                      },
                      {
                        step: 5,
                        title: "Online Submission & Digital Certificate Issuance",
                        bn: "অনলাইনে আবেদন এবং প্রধানের ডিজিটাল স্বাক্ষরিত শংসাপত্র সংগ্রহ",
                        desc: "Submit online via /apply/dependent or visit the Bagula 2 No Gram Panchayat office DEO counter. Upon verification by the GP Executive Assistant, Pradhan Smt. Susmita Biswas Barman signs and issues the certificate with digital verification code.",
                        tip: "The certificate can be checked anytime at /verify using the 8-character verification ID.",
                        actor: "Online Portal / GP Pradhan",
                      },
                    ].map((w) => (
                      <div
                        key={w.step}
                        className="p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-all flex gap-3.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {w.step}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-1">
                            <h4 className="text-xs font-bold text-foreground">{w.title}</h4>
                            <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              {w.actor}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-primary/90 font-bengali">
                            {w.bn}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {w.desc}
                          </p>
                          <div className="text-[11px] text-amber-800 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-1 flex items-start gap-1.5">
                            <span className="font-bold shrink-0">💡 Pro Tip:</span>
                            <span>{w.tip}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Required Documents */}
              {selectedSubTab === "documents" && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground">
                    Ensure all uploads are clear scans. Incomplete or forged income declarations will result in immediate disqualification.
                  </div>

                  <div className="grid gap-2.5">
                    {[
                      {
                        name: "Principal Earner Current Pay Slip / PPO / Service Card",
                        bn: "কর্মচারীর বর্তমান পে-স্লিপ / পেনশন পেমেন্ট অর্ডার (PPO) বা সার্ভিস কার্ড",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 2 MB",
                        detail: "Demonstrates active employment or pension entitlement of the primary provider.",
                      },
                      {
                        name: "Joint Residence Proof (Ration Card / Voter List)",
                        bn: "একত্রে বসবাসের প্রমাণ (ডিজিটাল রেশন কার্ড / পরিবারের ভোটার তালিকা)",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 2 MB",
                        detail: "Must show common residence under the same roof within Bagula 2 No Gram Panchayat area.",
                      },
                      {
                        name: "Aadhaar Card of Principal Earner & Dependent",
                        bn: "কর্মচারী ও পোষ্য উভয়ের আধার কার্ড",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 2 MB each",
                        detail: "Verifies identity, age, and local address within Hanskhali block.",
                      },
                      {
                        name: "Age & Relationship Proof of Dependent",
                        bn: "পোষ্যের জন্ম শংসাপত্র বা মাধ্যমিকের অ্যাডমিট কার্ড",
                        mandatory: true,
                        format: "PDF / JPG",
                        size: "Max 2 MB",
                        detail: "Establishes lawful relationship (son/daughter/parent/spouse) and age.",
                      },
                      {
                        name: "Non-Earning / Unemployment Declaration Affidavit",
                        bn: "পোষ্যের নিজস্ব কোনো উপার্জনের উৎস নেই মর্মে স্বঘোষণাপত্র",
                        mandatory: true,
                        format: "PDF / Original",
                        size: "Max 1 MB",
                        detail: "Sworn statement confirming zero independent income or employment.",
                      },
                      {
                        name: "Student Bonafide Certificate (if student over 18)",
                        bn: "শিক্ষা প্রতিষ্ঠানে পাঠরত থাকার প্রশংসাপত্র (প্রাপ্তবয়স্কদের ক্ষেত্রে)",
                        mandatory: false,
                        format: "PDF / JPG",
                        size: "Max 1 MB",
                        detail: "Mandatory if the dependent child is an adult undergoing full-time study.",
                      },
                      {
                        name: "Disability Certificate from CMOH / District Hospital (if claimed)",
                        bn: "প্রতিবন্ধী শংসাপত্র (অসুস্থ বা বিশেষ চাহিদাসম্পন্ন পোষ্যের ক্ষেত্রে)",
                        mandatory: false,
                        format: "PDF / JPG",
                        size: "Max 2 MB",
                        detail: "Required for permanently infirm dependent children/siblings seeking lifetime dependency.",
                      },
                      {
                        name: "Gram Sansad Member Enquiry Certificate",
                        bn: "সংশ্লিষ্ট গ্রাম সংসদ সদস্যের সরজমিন তদন্ত ও প্রত্যয়ন রিপোর্ট",
                        mandatory: true,
                        format: "Physical / PDF",
                        size: "Max 1 MB",
                        detail: "Ward member attestation certifying physical co-residence and financial dependency.",
                      },
                    ].map((doc, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border/50 bg-card flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2
                            size={16}
                            className={doc.mandatory ? "text-primary mt-0.5 shrink-0" : "text-muted-foreground mt-0.5 shrink-0"}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-foreground">{doc.name}</span>
                              {doc.mandatory ? (
                                <Badge variant="destructive" className="text-[9px] py-0 px-1.5 h-4">Mandatory</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4">Conditional</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-primary font-medium font-bengali mt-0.5">
                              {doc.bn}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {doc.detail}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-foreground">
                            {doc.format}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{doc.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Eligibility Rules */}
              {selectedSubTab === "legal" && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Card className="p-4 space-y-2 border-border/60">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-primary" /> Permissible Dependents (যোগ্য পোষ্য)
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li>• <strong>Spouse:</strong> Husband or Wife wholly dependent on the principal earner.</li>
                        <li>• <strong>Children:</strong> Sons (until 25 years or starting employment) & Unmarried daughters.</li>
                        <li>• <strong>Parents:</strong> Father & Mother residing with the employee whose monthly income does not exceed statutory limits.</li>
                        <li>• <strong>Widowed / Divorced Daughter:</strong> Living with parents with no alimony or separate income.</li>
                        <li>• <strong>Disabled Children:</strong> Permanent handicap certified by District CMOH.</li>
                      </ul>
                    </Card>

                    <Card className="p-4 space-y-2 border-border/60">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <AlertCircle size={14} className="text-rose-600" /> Disqualification Criteria (অযোগ্যতা)
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li>• Married son (regardless of employment status).</li>
                        <li>• Married daughter living with her husband's family.</li>
                        <li>• Any family member having independent monthly income above ₹9,000 + DA.</li>
                        <li>• Persons having a separate residence or running independent commercial businesses.</li>
                      </ul>
                    </Card>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">Railway & CGHS Special Clause:</p>
                    <p>
                      For Eastern Railway passes and CGHS card inclusion, the candidate must satisfy the Railway Board / Ministry of Health guidelines. The Gram Panchayat certificate confirms civil co-residence and financial dependency under the West Bengal Panchayat Act.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Bar for Dependent */}
              <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-foreground">Ready to apply for Dependent Certificate?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Submit your application via the Bagula 2 No Gram Panchayat Online Portal or GP Help Desk.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs rounded-xl">
                    <Link to="/verify">
                      <span>Track Existing File</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full sm:w-auto text-xs rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5 shadow-sm">
                    <Link to="/apply/dependent">
                      <span>Apply Online</span>
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* LINKAGE CERTIFICATE CONTENT (ELECTORAL & MARITAL LINKAGE) */}
          {activeTab === "linkage" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Quick Specs Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Clock size={12} className="text-primary" /> Turnaround
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">3 to 7 Days</p>
                  <p className="text-[10px] text-muted-foreground">Roll 2025 verification</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Building2 size={12} className="text-primary" /> Dual Signatories
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">EA & Prodhan</p>
                  <p className="text-[10px] text-muted-foreground">Counter-Signed + Round Seal</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <Scale size={12} className="text-primary" /> Constituency
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">89 Ranaghat (SC)</p>
                  <p className="text-[10px] text-muted-foreground">North East AC (Fixed)</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-600" /> Core Target
                  </span>
                  <p className="text-sm font-bold text-foreground mt-0.5">Married / Shifted</p>
                  <p className="text-[10px] text-muted-foreground">ECI Form 6 &amp; Form 8</p>
                </div>
              </div>

              {/* Sub-tab Navigation for Linkage */}
              <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("workflow")}
                  className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubTab === "workflow"
                      ? "bg-white text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Workflow (কার্যপদ্ধতি)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("documents")}
                  className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubTab === "documents"
                      ? "bg-white text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  6 Documents (নথিপত্র)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("legal")}
                  className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubTab === "legal"
                      ? "bg-white text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Legal Rules (আইন ও নিয়ম)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("faq")}
                  className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubTab === "faq"
                      ? "bg-white text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  FAQ (প্রশ্নোত্তর)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubTab("sample")}
                  className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubTab === "sample"
                      ? "bg-white text-foreground shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Proforma (নমুনা ও খালি ফরম)
                </button>
              </div>

              {/* Sub-tab 1: Linkage 6-Step Workflow */}
              {selectedSubTab === "workflow" && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-blue-900">
                      <Sparkles size={14} className="text-blue-700" />
                      Statutory Purpose of Electoral &amp; Marital Linkage Certificate
                    </p>
                    <p className="leading-relaxed">
                      This certificate is specifically required when a daughter or resident of Bagula II Gram Panchayat marries into another village/block/district or shifts residence, and needs to enroll or update her EPIC voter card under Election Commission of India (ECI) Form 6 or Form 8 by establishing parental linkage in <strong>89 Ranaghat (S.C.) North East Assembly Constituency</strong>.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {[
                      {
                        step: 1,
                        title: "Verify Parents' Draft Electoral Roll 2025 Details",
                        bengali: "পিতা ও মাতার নাম, পার্ট নং ও ক্রমিক নং যাচাই (ভোটার তালিকা ২০২৫)",
                        desc: "Check the latest Draft Electoral Roll 2025 under 89 Ranaghat (S.C.) North East AC. Note down the Father's and Mother's Part Number, Serial Number, and EPIC number.",
                        badge: "Parentage Roll Link",
                      },
                      {
                        step: 2,
                        title: "Procure Daughter's Age & Identity Proof",
                        bengali: "কন্যার বয়সের প্রমাণপত্র সংগ্রহ (মাধ্যমিক অ্যাডমিট / জন্ম শংসাপত্র)",
                        desc: "Collect the applicant's Madhyamik Admit Card, Secondary Marksheet, or Digital Birth Certificate. This legally establishes biological parentage and date of birth.",
                        badge: "Age & Parentage",
                      },
                      {
                        step: 3,
                        title: "Procure Marriage Proof & Husband's GP Residential Certificate",
                        bengali: "বৈবাহিক প্রমাণ ও স্বামীর গ্রাম পঞ্চায়েতের আবাসিক সনদপত্র সংগ্রহ",
                        desc: "Obtain a Residential Certificate issued by the husband's Gram Panchayat / Municipality stating she lives with her husband, or an official Marriage Registration Certificate.",
                        badge: "Marital Coordinates",
                      },
                      {
                        step: 4,
                        title: "Clear Bagula II Gram Panchayat Latest Property Tax",
                        bengali: "পিতা-মাতার বর্তমান আর্থিক বছরের পঞ্চায়েত ট্যাক্স / খাজনা রশিদ",
                        desc: "Verify that the parental family property or homestead holding tax is paid up to date with Bagula II Gram Panchayat. Attach the original or digital tax clearance receipt.",
                        badge: "GP Tax Clearance",
                      },
                      {
                        step: 5,
                        title: "Portal Entry at Online Portal / GP DEO Counter",
                        bengali: "অনলাইন পোর্টাল বা পঞ্চায়েত ডিইও ডেস্কে তথ্য এন্ট্রি ও ড্রাফট তৈরি",
                        desc: "The authorized operator enters all details in the Bagula II GP Linkage Certificate Engine. An official computerized draft is generated with a secure verification hash and QR code.",
                        badge: "Online / Offline Draft",
                      },
                      {
                        step: 6,
                        title: "Dual Official Signatures: Counter Signed by EA & Signed by Prodhan",
                        bengali: "দ্বৈত স্বাক্ষর ও গোল সিল: এক্সিকিউটিভ অ্যাসিস্ট্যান্টের প্রতিস্বাক্ষর এবং প্রধানের চূড়ান্ত সই",
                        desc: "The physical certificate is counter-signed by the Executive Assistant / Secretary / Sahayak on the left, and signed by GP Prodhan Smt. Susmita Biswas Barman on the right with official round rubber seals.",
                        badge: "Final Issuance",
                      },
                    ].map((st) => (
                      <div
                        key={st.step}
                        className="p-4 rounded-xl border border-border/70 bg-card hover:border-primary/40 transition-all flex items-start gap-3.5"
                      >
                        <span className="w-7 h-7 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {st.step}
                        </span>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h5 className="text-xs font-bold text-foreground">{st.title}</h5>
                            <Badge variant="outline" className="text-[10px] font-semibold">
                              {st.badge}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-primary font-bengali">{st.bengali}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">{st.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: 6 Mandatory Documents */}
              {selectedSubTab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        The 6 Statutory Required Documents for Linkage Certificate
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        All 6 documents must be carried to the Gram Panchayat office for physical ink verification.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[10px] font-semibold">
                      6 Mandatory Items
                    </Badge>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      {
                        num: 1,
                        name: "Parents' Latest EPIC & Latest Voter List (Draft Roll 2025)",
                        bengali: "পিতা ও মাতার বর্তমান ভোটার কার্ড ও ভোটার তালিকা ২০২৫-এর জেরক্স",
                        details: "Must show Father & Mother enrolled under 89 Ranaghat (S.C.) North East AC with Part No. & Serial No.",
                        format: "PDF / Photocopy",
                        mandatory: true,
                      },
                      {
                        num: 2,
                        name: "Proof of Age of Daughter/Applicant (Madhyamik / Birth Cert)",
                        bengali: "কন্যার বয়সের প্রমাণপত্র (মাধ্যমিক অ্যাডমিট / মার্কশিট বা জন্ম সনদ)",
                        details: "Madhyamik Admit Card, Secondary Board Marksheet, or Digital Birth Certificate establishing parentage.",
                        format: "PDF / Original",
                        mandatory: true,
                      },
                      {
                        num: 3,
                        name: "Proof of Marriage (Husband GP Residential / Marriage Cert)",
                        bengali: "বিবাহের প্রমাণ (স্বামীর গ্রাম পঞ্চায়েতের আবাসিক সনদ / বিবাহ রেজিস্ট্রি)",
                        details: "Residential Certificate issued by husband's GP/Municipality or official Marriage Registration Certificate.",
                        format: "PDF / Original",
                        mandatory: true,
                      },
                      {
                        num: 4,
                        name: "Bagula II GP Latest Property / Holding Tax Receipt of Parents",
                        bengali: "বগুলা ২ নং গ্রাম পঞ্চায়েতের পিতা-মাতার হালসনের কর / খাজনা রশিদ",
                        details: "Current financial year property tax clearance receipt establishing territorial jurisdiction of Bagula II GP.",
                        format: "PDF / Original",
                        mandatory: true,
                      },
                      {
                        num: 5,
                        name: "Applicant's EPIC Copy (If already registered)",
                        bengali: "আবেদনকারীর নিজস্ব ভোটার কার্ডের জেরক্স (যদি ইতিপূর্বে ভোটার হয়ে থাকেন)",
                        details: "Required for Form 8 shifting of residence or constituency transfer from another place.",
                        format: "PDF / Photocopy",
                        mandatory: false,
                      },
                      {
                        num: 6,
                        name: "Husband's Proof of Identity / Residence (Aadhaar / EPIC)",
                        bengali: "স্বামীর পরিচয় ও বাসস্থানের প্রমাণপত্র (আধার কার্ড / ভোটার কার্ড)",
                        details: "Husband's Aadhaar card, EPIC card, or land deed confirming his residence in the destination village/block.",
                        format: "PDF / Photocopy",
                        mandatory: true,
                      },
                    ].map((doc) => (
                      <div
                        key={doc.num}
                        className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-primary/40 transition-all flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-md bg-muted text-foreground font-bold text-xs flex items-center justify-center shrink-0">
                          {doc.num}
                        </span>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <p className="text-xs font-bold text-foreground">{doc.name}</p>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-medium ${
                                doc.mandatory
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {doc.mandatory ? "Mandatory" : "Optional / Transfer"}
                            </Badge>
                          </div>
                          <p className="text-[11px] font-medium text-primary font-bengali">{doc.bengali}</p>
                          <p className="text-[10px] text-muted-foreground leading-snug">{doc.details}</p>
                          <span className="text-[9px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded inline-block mt-1">
                            Format: {doc.format}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Legal Framework & Rules */}
              {selectedSubTab === "legal" && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Card className="p-4 space-y-2 border-border/60">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Scale size={14} className="text-primary" /> Statutory Legal Framework
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li>• <strong>WB Panchayat Act, 1973 (Section 19):</strong> Empowers the Gram Panchayat Pradhan and Executive Assistant to certify resident lineage and civil status.</li>
                        <li>• <strong>Representation of the People Act, 1950 (Section 23):</strong> Governs inclusion of names in electoral rolls and inter-constituency shifting.</li>
                        <li>• <strong>Registration of Electors Rules, 1960:</strong> Mandates documentary proof linking shifted electors with ancestral parents' voter records.</li>
                        <li>• <strong>Fixed Constituency:</strong> All parental records under Bagula II GP must strictly belong to <strong>89 Ranaghat (S.C.) North East Assembly Constituency</strong>.</li>
                      </ul>
                    </Card>

                    <Card className="p-4 space-y-2 border-border/60">
                      <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-600" /> Married Women Shifting Rules
                      </h5>
                      <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li>• <strong>Form 8 Shifting:</strong> Married women moving to their marital home use this certificate to transfer their voter name to their husband's polling station.</li>
                        <li>• <strong>Form 6 First Enrolment:</strong> If she has never been enrolled before, she registers as a fresh voter linking her father/mother Part No. and Serial No.</li>
                        <li>• <strong>Husband's GP Proof:</strong> A residential certificate from the husband's Gram Panchayat confirms domestic cohabitation.</li>
                        <li>• <strong>Dual Manual Signatures:</strong> ERO/BDO hearing officers require the physical pen counter-signature of the Secretary/EA and Prodhan with round rubber seal.</li>
                      </ul>
                    </Card>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-amber-700" />
                      Applicant &amp; Staff Advisory (পরামর্শ ও সতর্কতা):
                    </p>
                    <p className="leading-relaxed text-[11px]">
                      1. Always cross-check the spelling of the Father's name on the Madhyamik Admit Card with the Draft Electoral Roll 2025.
                      2. Ensure the parent tax receipt is for the current financial year.
                      3. For offline physical processing, operators can generate a clean blank template ("খালি ফরম") directly from the generator tool.
                    </p>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Frequently Asked Questions (FAQ) */}
              {selectedSubTab === "faq" && (
                <div className="space-y-3">
                  {[
                    {
                      q: "What is a Linkage Certificate and who needs it from Bagula II GP?",
                      bq: "লিঙ্কেজ সার্টিফিকেট কি এবং বগুলা ২ নং গ্রাম পঞ্চায়েত থেকে কাদের এটি প্রয়োজন?",
                      a: "A Linkage Certificate is a statutory civil document issued by Bagula II Gram Panchayat establishing that a woman or citizen is the child of parents enrolled in 89 Ranaghat (S.C.) North East AC. It is primarily required for married women shifting to their husband's place to enrol or transfer their voter EPIC under ECI Form 6 or Form 8.",
                    },
                    {
                      q: "Why is the certificate specifically required for married women?",
                      bq: "বিবাহিত মহিলাদের জন্য বাসস্থান পরিবর্তনের ক্ষেত্রে এই সার্টিফিকেট কেন অপরিহার্য?",
                      a: "When a woman moves to her husband's home in another village or constituency, the Electoral Registration Officer (ERO/BDO) requires conclusive evidence of both her ancestral roots (parents' voter records in Bagula II GP) and lawful marriage. The Linkage Certificate bridges both sides seamlessly.",
                    },
                    {
                      q: "Which Assembly Constituency is covered under Bagula II Gram Panchayat?",
                      bq: "বগুলা ২ নং গ্রাম পঞ্চায়েতের আওতাধীন কোন বিধানসভা কেন্দ্র প্রযোজ্য?",
                      a: "The entire jurisdiction of Bagula II Gram Panchayat strictly belongs to '89 Ranaghat (S.C.) North East Assembly Constituency'. All parental voter roll references must reflect their Part Number and Serial Number in Draft Roll 2025 under this constituency.",
                    },
                    {
                      q: "Why does it require dual physical manual signatures and round seals?",
                      bq: "লিঙ্কেজ সার্টিফিকেটে কেন যুগ্ম স্বাক্ষর (কাউন্টার সাইন ও প্রধানের স্বাক্ষর) এবং সিল লাগে?",
                      a: "ECI statutory verification guidelines mandate that Linkage Certificates presented before the ERO/AERO during voter list revision hearings bear the physical pen counter-signature of the Executive Assistant / Secretary / Sahayak, along with the signature and round seal of GP Prodhan Smt. Susmita Biswas Barman.",
                    },
                    {
                      q: "Can an unmarried citizen or first-time voter apply for this certificate?",
                      bq: "অবিবাহিত বা তরুণ ভোটার কি এই সার্টিফিকেটের জন্য আবেদন করতে পারেন?",
                      a: "Yes. While the primary workflow is designed for married women shifting residence, first-time young voters establishing father/mother lineage under 89 Ranaghat AC can also obtain it by selecting 'Unregistered' status. In that case, the marriage paragraph is marked N/A.",
                    },
                  ].map((faq, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border/70 bg-card space-y-1">
                      <p className="text-xs font-bold text-foreground flex items-center gap-2">
                        <HelpCircle size={13} className="text-primary shrink-0" />
                        <span>{faq.q}</span>
                      </p>
                      <p className="text-[11px] font-medium text-primary font-bengali pl-5">{faq.bq}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pl-5 pt-0.5">{faq.a}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-tab 5: Sample Format Proforma & Blank Template */}
              {selectedSubTab === "sample" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        Official Bagula II GP Linkage Certificate Format (Standard Letterhead)
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Official statutory layout with dual signatories (EA/Secretary &amp; Prodhan) under 89 Ranaghat AC.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10"
                        onClick={copyLinkageProforma}
                      >
                        {copiedLinkageText ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        <span>{copiedLinkageText ? "Copied!" : "Copy Proforma Text"}</span>
                      </Button>
                      <Button asChild size="sm" className="h-8 text-xs gap-1.5 rounded-lg bg-primary text-primary-foreground font-semibold">
                        <Link to="/linkage-certificate">
                          <Printer size={13} />
                          <span>Open Certificate Generator</span>
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="relative rounded-xl border border-border/60 bg-muted/30 p-4 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto max-h-80 select-all">
                    <pre className="whitespace-pre-wrap">{linkageProformaSample}</pre>
                  </div>

                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Need a Blank Physical Form (খালি ফরম)?</p>
                      <p className="text-[11px] text-muted-foreground">
                        Print a blank pre-formatted letterhead template for manual pen fill-up and physical field verification.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="secondary" className="rounded-xl text-xs gap-1.5 border border-primary/20 font-medium">
                      <Link to="/linkage-certificate">
                        <Download size={13} />
                        <span>Print Blank Template (খালি ফরম)</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Bar for Linkage */}
              <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/20 p-4 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-foreground">Ready to generate Linkage Certificate?</p>
                  <p className="text-[11px] text-muted-foreground">
                    Generate an official computerized certificate with QR verification or print a blank proforma.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs rounded-xl">
                    <Link to="/verify">
                      <span>Track at /verify</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full sm:w-auto text-xs rounded-xl bg-primary text-primary-foreground font-semibold gap-1.5 shadow-sm">
                    <Link to="/linkage-certificate">
                      <span>Open Linkage Generator</span>
                      <ArrowRight size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-muted/30 border-t border-border/50 flex items-center justify-between gap-2 shrink-0">
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            🏛️ Bagula 2 No Gram Panchayat · Hanskhali Block, Nadia · Open Mon-Sat 10:30 AM to 5:00 PM
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Close Guide
            </Button>
            <Button
              size="sm"
              className="text-xs rounded-xl bg-primary text-primary-foreground font-medium"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Got it, Thank You
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
