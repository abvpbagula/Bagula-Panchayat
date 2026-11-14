import React, { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JURISDICTION } from "@/lib/masterData";
import { MasterDataService, VillageWithPostOffices } from "@/lib/api/MasterDataService";
import { ELECTED_REPRESENTATIVES_DATA } from "@/lib/electedRepresentativesData";
import EpicParentLinkageVisualCard from "./EpicParentLinkageVisualCard";
import type {
  EpicParentLinkageData,
  LinkageSelection,
  ParentElectoralDetails,
} from "./epicParentLinkageTypes";
import { toast } from "sonner";
import {
  UserCheck,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Save,
} from "lucide-react";

interface Props {
  value: EpicParentLinkageData;
  onChange: (next: EpicParentLinkageData) => void;
  onSaveDraft?: () => void;
  onSubmitApplication?: () => void;
  readOnly?: boolean;
  status?: string | null;
  returnRemark?: string | null;
}

export default function EpicParentLinkageForm({
  value,
  onChange,
  onSaveDraft,
  onSubmitApplication,
  readOnly = false,
  status,
  returnRemark,
}: Props) {
  const [activeSubStep, setActiveSubStep] = useState<
    "applicant" | "linkage_select" | "father_details" | "mother_details" | "declaration" | "review"
  >("applicant");

  const [villages, setVillages] = useState<VillageWithPostOffices[]>([]);
  const [loadingVillages, setLoadingVillages] = useState(true);

  // Load active villages & post offices from MasterDataService
  useEffect(() => {
    let active = true;
    MasterDataService.getActiveVillagesWithPostOffices().then((data) => {
      if (active) {
        setVillages(data);
        setLoadingVillages(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const set = (patch: Partial<EpicParentLinkageData>) => {
    onChange({ ...value, ...patch });
  };

  const setFather = (patch: Partial<ParentElectoralDetails>) => {
    onChange({
      ...value,
      fatherElectoral: { ...value.fatherElectoral, ...patch },
    });
  };

  const setMother = (patch: Partial<ParentElectoralDetails>) => {
    onChange({
      ...value,
      motherElectoral: { ...value.motherElectoral, ...patch },
    });
  };

  // Village selection handler
  const onVillageChange = (v: string) => {
    const selected = villages.find((vil) => vil.name === v);
    const autoPo = selected && selected.postOffices.length > 0 ? selected.postOffices[0].name : "Bagula";
    set({
      villagePara: v,
      postOffice: autoPo,
      policeStation: JURISDICTION.policeStation.replace(" P.S.", ""),
      block: JURISDICTION.block,
      district: JURISDICTION.district,
      pin: JURISDICTION.pin,
    });
  };

  // Selection toggle helper
  const handleLinkageChoice = (choice: LinkageSelection) => {
    let linkFather = false;
    let linkMother = false;
    if (choice === "father") {
      linkFather = true;
      linkMother = false;
    } else if (choice === "mother") {
      linkFather = false;
      linkMother = true;
    } else if (choice === "both") {
      linkFather = true;
      linkMother = true;
    }

    set({
      linkageSelection: choice,
      linkFather,
      linkMother,
    });
  };

  const isFatherSelected = value.linkFather || value.linkageSelection === "father" || value.linkageSelection === "both";
  const isMotherSelected = value.linkMother || value.linkageSelection === "mother" || value.linkageSelection === "both";

  // Form Validation checks per step
  const validateApplicant = () => {
    if (!value.applicantFullName.trim()) {
      toast.error("Please enter Applicant's (Married Daughter) Full Name.");
      return false;
    }
    if (!value.fatherName.trim()) {
      toast.error("Please enter Biological Father's Name.");
      return false;
    }
    if (!value.motherName.trim()) {
      toast.error("Please enter Biological Mother's Name.");
      return false;
    }
    if (!value.husbandName.trim()) {
      toast.error("Please enter Husband's Name.");
      return false;
    }
    if (!value.mobile || value.mobile.replace(/\D/g, "").length < 10) {
      toast.error("Please provide a valid 10-digit mobile number.");
      return false;
    }
    return true;
  };

  const validateLinkageSelection = () => {
    if (!isFatherSelected && !isMotherSelected) {
      toast.error("Please select at least one parent (Father and/or Mother) to link.");
      return false;
    }
    return true;
  };

  const validateFather = () => {
    if (!isFatherSelected) return true;
    if (!value.fatherElectoral.fullName.trim() && !value.fatherName.trim()) {
      toast.error("Please enter Father's full name as registered in Electoral Roll.");
      return false;
    }
    if (!value.fatherElectoral.epicNo.trim()) {
      toast.error("Please enter Father's Voter ID (EPIC) Number.");
      return false;
    }
    return true;
  };

  const validateMother = () => {
    if (!isMotherSelected) return true;
    if (!value.motherElectoral.fullName.trim() && !value.motherName.trim()) {
      toast.error("Please enter Mother's full name as registered in Electoral Roll.");
      return false;
    }
    if (!value.motherElectoral.epicNo.trim()) {
      toast.error("Please enter Mother's Voter ID (EPIC) Number.");
      return false;
    }
    return true;
  };

  const validateDeclarations = () => {
    if (isFatherSelected && !value.applicantFatherDeclarationAccepted) {
      toast.error("Please confirm your statutory declaration regarding your biological father.");
      return false;
    }
    if (isMotherSelected && !value.applicantMotherDeclarationAccepted) {
      toast.error("Please confirm your statutory declaration regarding your biological mother.");
      return false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Return for Correction Banner if applicable */}
      {returnRemark && (
        <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>Application Returned by Gram Sansad Member for Correction</span>
          </div>
          <p className="text-xs text-rose-900 leading-relaxed font-medium">
            Remarks: {returnRemark}
          </p>
          <p className="text-[11px] text-rose-700">
            Please make the necessary changes in the fields below and re-submit for verification.
          </p>
        </div>
      )}

      {/* Module Overview Notice */}
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 via-sky-50/70 to-blue-50/80 p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-sm">
            🗳️
          </div>
          <div className="space-y-1 text-xs text-indigo-950">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm text-indigo-900">
                EPIC Parent Linkage Certificate (বিবাহিতা কন্যার ভোটার সংযোগ ও অভিভাবক পরিচয়পত্র)
              </h3>
              <Badge variant="outline" className="text-[10px] border-indigo-300 text-indigo-800 bg-indigo-50 font-semibold">
                Section 16/19 R.P. Act, 1950
              </Badge>
            </div>
            <p className="leading-relaxed">
              Designed specifically for married daughters residing in or originating from Bagula II Gram Panchayat
              to establish their biological relationship with their <strong>father</strong> and/or <strong>mother</strong>{" "}
              for voter enrolment in <strong>89 - Ranaghat (S.C.) North East Assembly Constituency</strong>.
            </p>
            <p className="text-[11px] text-indigo-700 font-medium">
              ⚖️ Parentage is established directly with biological parents and is NOT inferred from the husband's details.
              Independent of caste or community certificates.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Step Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubStep("applicant")}
          className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
            activeSubStep === "applicant"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-white text-slate-700 border-border hover:bg-slate-50"
          }`}
        >
          1. Applicant (Married Daughter)
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateApplicant()) setActiveSubStep("linkage_select");
          }}
          className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
            activeSubStep === "linkage_select"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-white text-slate-700 border-border hover:bg-slate-50"
          }`}
        >
          2. Select Linkage Type
        </button>

        {isFatherSelected && (
          <button
            type="button"
            onClick={() => {
              if (validateApplicant() && validateLinkageSelection()) {
                setActiveSubStep("father_details");
              }
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
              activeSubStep === "father_details"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-700 border-border hover:bg-slate-50"
            }`}
          >
            3. Father's EPIC Details
          </button>
        )}

        {isMotherSelected && (
          <button
            type="button"
            onClick={() => {
              if (validateApplicant() && validateLinkageSelection()) {
                setActiveSubStep("mother_details");
              }
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
              activeSubStep === "mother_details"
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                : "bg-white text-slate-700 border-border hover:bg-slate-50"
            }`}
          >
            {isFatherSelected ? "4." : "3."} Mother's EPIC Details
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (validateApplicant() && validateLinkageSelection()) {
              setActiveSubStep("declaration");
            }
          }}
          className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
            activeSubStep === "declaration"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-white text-slate-700 border-border hover:bg-slate-50"
          }`}
        >
          Declarations &amp; Evidence
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateApplicant() && validateLinkageSelection() && validateDeclarations()) {
              setActiveSubStep("review");
            }
          }}
          className={`px-3 py-1.5 rounded-xl border transition-all whitespace-nowrap ${
            activeSubStep === "review"
              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
              : "bg-white text-slate-700 border-border hover:bg-slate-50"
          }`}
        >
          Review &amp; Visual Card
        </button>
      </div>

      {/* STEP 1: Applicant / Married Daughter */}
      {activeSubStep === "applicant" && (
        <Card className="p-5 bg-white border-border/80 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-indigo-600 text-white text-[10px] font-semibold uppercase">
                Step 1: Applicant Identity
              </Badge>
              <span className="text-xs text-muted-foreground">Mandatory details</span>
            </div>
            <h3 className="text-base font-bold text-foreground mt-1">
              Applicant / Married Daughter (আবেদনকারী / বিবাহিতা কন্যা)
            </h3>
            <p className="text-xs text-muted-foreground">
              Please enter the married daughter's personal details. Do not enter husband's parents here.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-800">
                Full Name of Married Daughter <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. SMT. PRIYA BISWAS"
                value={value.applicantFullName}
                onChange={(e) => set({ applicantFullName: e.target.value.toUpperCase() })}
                disabled={readOnly}
                className="font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter full legal maiden or married name as shown in official records.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Biological Father's Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. SHRI AMAL BISWAS"
                value={value.fatherName}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  set({
                    fatherName: val,
                    fatherElectoral: {
                      ...value.fatherElectoral,
                      fullName: value.fatherElectoral.fullName || val,
                    },
                  });
                }}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Biological Mother's Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. SMT. ANITA BISWAS"
                value={value.motherName}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  set({
                    motherName: val,
                    motherElectoral: {
                      ...value.motherElectoral,
                      fullName: value.motherElectoral.fullName || val,
                    },
                  });
                }}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-800">
                Husband's Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. SHRI SUBRATA MONDAL"
                value={value.husbandName}
                onChange={(e) => set({ husbandName: e.target.value.toUpperCase() })}
                disabled={readOnly}
              />
              <p className="text-[11px] text-muted-foreground">
                Notice: Husband's parentage is distinct from biological parental linkage.
              </p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              📍 Residential Address &amp; Gram Sansad Jurisdiction
            </h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Present Address / Street / Para</Label>
                <Input
                  placeholder="e.g. Bagula Collegepara, Near High School"
                  value={value.presentAddress}
                  onChange={(e) => set({ presentAddress: e.target.value })}
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Village / Mouza</Label>
                <Select
                  value={value.villagePara || "Bagula"}
                  onValueChange={onVillageChange}
                  disabled={readOnly}
                >
                  <SelectTrigger><SelectValue placeholder="Select village" /></SelectTrigger>
                  <SelectContent>
                    {loadingVillages ? (
                      <SelectItem value="loading" disabled>Loading villages...</SelectItem>
                    ) : (
                      villages.map((v) => (
                        <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>
                      ))
                    )}
                    <SelectItem value="Bagula">Bagula</SelectItem>
                    <SelectItem value="Bathanpara">Bathanpara</SelectItem>
                    <SelectItem value="Muragachha">Muragachha</SelectItem>
                    <SelectItem value="Huda">Huda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Gram Sansad / Ward No.</Label>
                <Select
                  value={value.sansadNo || "Sansad I"}
                  onValueChange={(v) => set({ sansadNo: v })}
                  disabled={readOnly}
                >
                  <SelectTrigger><SelectValue placeholder="Select Ward / Sansad" /></SelectTrigger>
                  <SelectContent>
                    {ELECTED_REPRESENTATIVES_DATA.map((m) => (
                      <SelectItem key={m.slNo} value={`Ward ${m.wardNumber} (${m.sansadNo})`}>
                        Ward {m.wardNumber} ({m.sansadNo}): {m.name} — {m.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Post Office</Label>
                <Input value={value.postOffice} onChange={(e) => set({ postOffice: e.target.value })} disabled={readOnly} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Police Station</Label>
                <Input value={value.policeStation} disabled />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">District</Label>
                <Input value={value.district} disabled />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">PIN Code</Label>
                <Input
                  maxLength={6}
                  value={value.pin}
                  onChange={(e) => set({ pin: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              🪪 Applicant Voter &amp; Contact Details
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Applicant EPIC (Voter ID) No. (If applicable)</Label>
                <Input
                  placeholder="e.g. WBG1234567 (Leave blank if not yet enrolled)"
                  value={value.applicantEpicNo}
                  onChange={(e) => set({ applicantEpicNo: e.target.value.toUpperCase() })}
                  disabled={readOnly}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Mobile Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={value.mobile}
                  onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  disabled={readOnly}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => {
                if (validateApplicant()) {
                  setActiveSubStep("linkage_select");
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <span>Next: Select Linkage Type</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2: Select Linkage */}
      {activeSubStep === "linkage_select" && (
        <Card className="p-5 bg-white border-border/80 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <Badge className="bg-indigo-600 text-white text-[10px] font-semibold uppercase">
              Step 2: Linkage Selection
            </Badge>
            <h3 className="text-base font-bold text-foreground mt-1">
              Select Biological Parent Linkage (অভিভাবক সংযোগ নির্বাচন)
            </h3>
            <p className="text-xs text-muted-foreground">
              Under Representation of the People Act guidelines, a married daughter may link her voter entry
              with her biological father, her biological mother, or both parents.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Option 1: Father Only */}
            <div
              onClick={() => !readOnly && handleLinkageChoice("father")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                value.linkageSelection === "father"
                  ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                  : "border-border hover:border-indigo-300 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">👨</span>
                <input
                  type="radio"
                  checked={value.linkageSelection === "father"}
                  onChange={() => handleLinkageChoice("father")}
                  disabled={readOnly}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Father Linkage Only</h4>
                <p className="text-xs text-slate-600 mt-0.5">কেবলমাত্র জন্মদাতা পিতার সংযোগ</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                Link applicant with biological father's EPIC card and voter list serial.
              </p>
            </div>

            {/* Option 2: Mother Only */}
            <div
              onClick={() => !readOnly && handleLinkageChoice("mother")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                value.linkageSelection === "mother"
                  ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                  : "border-border hover:border-indigo-300 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">👩</span>
                <input
                  type="radio"
                  checked={value.linkageSelection === "mother"}
                  onChange={() => handleLinkageChoice("mother")}
                  disabled={readOnly}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Mother Linkage Only</h4>
                <p className="text-xs text-slate-600 mt-0.5">কেবলমাত্র জন্মদাত্রী মাতার সংযোগ</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                Link applicant with biological mother's EPIC card and voter list serial.
              </p>
            </div>

            {/* Option 3: Both Father + Mother */}
            <div
              onClick={() => !readOnly && handleLinkageChoice("both")}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-2 ${
                value.linkageSelection === "both"
                  ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                  : "border-border hover:border-indigo-300 bg-slate-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">👨‍👩‍👧</span>
                <input
                  type="radio"
                  checked={value.linkageSelection === "both"}
                  onChange={() => handleLinkageChoice("both")}
                  disabled={readOnly}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Father + Mother Linkage</h4>
                <p className="text-xs text-slate-600 mt-0.5">পিতা ও মাতা উভয়েরই সংযোগ</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                Establish dual parental linkage with both father's and mother's voter records.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border text-xs text-slate-700 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              You can proceed with only one parent if the other parent's voter records are unavailable or deceased.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveSubStep("applicant")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateLinkageSelection()) {
                  if (isFatherSelected) setActiveSubStep("father_details");
                  else setActiveSubStep("mother_details");
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <span>Next: Electoral Details</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 3: Biological Father Electoral Details */}
      {activeSubStep === "father_details" && isFatherSelected && (
        <Card className="p-5 bg-white border-border/80 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <Badge className="bg-emerald-700 text-white text-[10px] font-semibold uppercase">
              Step 3: Biological Father Particulars
            </Badge>
            <h3 className="text-base font-bold text-foreground mt-1">
              Father's Electoral Roll (EPIC) Particulars (পিতার ভোটার বিবরণ)
            </h3>
            <p className="text-xs text-muted-foreground">
              Details of biological father: Shri {value.fatherName || value.fatherElectoral.fullName}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-800">
                Father's Full Name (As in Voter List) <span className="text-destructive">*</span>
              </Label>
              <Input
                value={value.fatherElectoral.fullName || value.fatherName}
                onChange={(e) => setFather({ fullName: e.target.value.toUpperCase() })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Father's Voter ID (EPIC) Number <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. WBG1234567"
                value={value.fatherElectoral.epicNo}
                onChange={(e) => setFather({ epicNo: e.target.value.toUpperCase() })}
                disabled={readOnly}
                className="font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assembly Constituency</Label>
              <Input
                value={value.fatherElectoral.assemblyConstituency}
                onChange={(e) => setFather({ assemblyConstituency: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part (Booth) Number</Label>
              <Input
                placeholder="e.g. 142"
                value={value.fatherElectoral.partNo}
                onChange={(e) => setFather({ partNo: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Serial Number in Part</Label>
              <Input
                placeholder="e.g. 384"
                value={value.fatherElectoral.serialNo}
                onChange={(e) => setFather({ serialNo: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Electoral Roll Year / Reference</Label>
              <Input
                value={value.fatherElectoral.electoralRollYear}
                onChange={(e) => setFather({ electoralRollYear: e.target.value })}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveSubStep("linkage_select")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateFather()) {
                  if (isMotherSelected) setActiveSubStep("mother_details");
                  else setActiveSubStep("declaration");
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <span>{isMotherSelected ? "Next: Mother's Details" : "Next: Declarations"}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 4: Biological Mother Electoral Details */}
      {activeSubStep === "mother_details" && isMotherSelected && (
        <Card className="p-5 bg-white border-border/80 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <Badge className="bg-emerald-700 text-white text-[10px] font-semibold uppercase">
              Step 4: Biological Mother Particulars
            </Badge>
            <h3 className="text-base font-bold text-foreground mt-1">
              Mother's Electoral Roll (EPIC) Particulars (মাতার ভোটার বিবরণ)
            </h3>
            <p className="text-xs text-muted-foreground">
              Details of biological mother: Smt. {value.motherName || value.motherElectoral.fullName}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-slate-800">
                Mother's Full Name (As in Voter List) <span className="text-destructive">*</span>
              </Label>
              <Input
                value={value.motherElectoral.fullName || value.motherName}
                onChange={(e) => setMother({ fullName: e.target.value.toUpperCase() })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Mother's Voter ID (EPIC) Number <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. WBG7654321"
                value={value.motherElectoral.epicNo}
                onChange={(e) => setMother({ epicNo: e.target.value.toUpperCase() })}
                disabled={readOnly}
                className="font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assembly Constituency</Label>
              <Input
                value={value.motherElectoral.assemblyConstituency}
                onChange={(e) => setMother({ assemblyConstituency: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Part (Booth) Number</Label>
              <Input
                placeholder="e.g. 142"
                value={value.motherElectoral.partNo}
                onChange={(e) => setMother({ partNo: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Serial Number in Part</Label>
              <Input
                placeholder="e.g. 385"
                value={value.motherElectoral.serialNo}
                onChange={(e) => setMother({ serialNo: e.target.value })}
                disabled={readOnly}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Electoral Roll Year / Reference</Label>
              <Input
                value={value.motherElectoral.electoralRollYear}
                onChange={(e) => setMother({ electoralRollYear: e.target.value })}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isFatherSelected) setActiveSubStep("father_details");
                else setActiveSubStep("linkage_select");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateMother()) setActiveSubStep("declaration");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <span>Next: Declarations</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 5: Relationship Declarations & Supporting Evidence */}
      {activeSubStep === "declaration" && (
        <Card className="p-5 bg-white border-border/80 shadow-xs space-y-6">
          <div className="border-b pb-3">
            <Badge className="bg-amber-600 text-white text-[10px] font-semibold uppercase">
              Step 5: Statutory Relationship Declarations
            </Badge>
            <h3 className="text-base font-bold text-foreground mt-1">
              Applicant Statutory Declarations (আবেদনকারীর সজ্ঞান ঘোষণাপত্র)
            </h3>
            <p className="text-xs text-muted-foreground">
              Explicit declarations under Election Commission &amp; Panchayat guidelines. The applicant herself
              declares her biological parentage for subsequent verification by the Gram Sansad Member.
            </p>
          </div>

          <div className="space-y-4">
            {/* Father Declaration */}
            {isFatherSelected && (
              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.applicantFatherDeclarationAccepted}
                    onCheckedChange={(c) =>
                      set({
                        applicantFatherDeclarationAccepted: c === true,
                        applicantDeclarationDate: new Date().toISOString(),
                      })
                    }
                    disabled={readOnly}
                    className="mt-1"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-indigo-950 text-sm">
                      Biological Father Statutory Declaration (পিতার ঘোষণাপত্র)
                    </p>
                    <p className="text-indigo-900 leading-relaxed font-medium">
                      "I, <strong>{value.applicantFullName || "Applicant"}</strong>, married daughter of{" "}
                      <strong>{value.fatherElectoral.fullName || value.fatherName || "Father"}</strong>, hereby
                      solemnly declare that the person identified above as my biological father is my biological
                      father."
                    </p>
                    <p className="text-[11px] text-slate-600 italic">
                      (আমি সজ্ঞানে ঘোষণা করছি যে উপরে উল্লেখিত ব্যক্তি শ্রী {value.fatherElectoral.fullName || value.fatherName} আমার জন্মদাতা পিতা।)
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Mother Declaration */}
            {isMotherSelected && (
              <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/50 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={value.applicantMotherDeclarationAccepted}
                    onCheckedChange={(c) =>
                      set({
                        applicantMotherDeclarationAccepted: c === true,
                        applicantDeclarationDate: new Date().toISOString(),
                      })
                    }
                    disabled={readOnly}
                    className="mt-1"
                  />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-indigo-950 text-sm">
                      Biological Mother Statutory Declaration (মাতার ঘোষণাপত্র)
                    </p>
                    <p className="text-indigo-900 leading-relaxed font-medium">
                      "I, <strong>{value.applicantFullName || "Applicant"}</strong>, married daughter of{" "}
                      <strong>{value.motherElectoral.fullName || value.motherName || "Mother"}</strong>, hereby
                      solemnly declare that the person identified above as my biological mother is my biological
                      mother."
                    </p>
                    <p className="text-[11px] text-slate-600 italic">
                      (আমি সজ্ঞানে ঘোষণা করছি যে উপরে উল্লেখিত ব্যক্তি শ্রীমতি {value.motherElectoral.fullName || value.motherName} আমার জন্মদাত্রী মাতা।)
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Statutory Boundary Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Notice on Statutory Verification Boundary:</span>
              </p>
              <p className="leading-relaxed text-[11px]">
                This software system records the applicant's self-declaration and routes it to the designated Gram
                Sansad Member for local enquiry and field endorsement. The system does not legally determine parentage;
                verification is conducted exclusively by the authorized Gram Sansad Member.
              </p>
            </div>
          </div>

          {/* Supporting Documents Checklist */}
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              📎 Supporting Documentary Evidence Checklist
            </h4>
            <div className="space-y-2">
              {value.supportingDocs.map((doc, idx) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border bg-slate-50 text-xs cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <Checkbox
                    checked={doc.provided}
                    onCheckedChange={(c) => {
                      const updated = value.supportingDocs.map((d, i) =>
                        i === idx ? { ...d, provided: c === true } : d
                      );
                      set({ supportingDocs: updated });
                    }}
                    disabled={readOnly}
                  />
                  <span className={doc.provided ? "font-semibold text-slate-900" : "text-slate-600"}>
                    {doc.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (isMotherSelected) setActiveSubStep("mother_details");
                else if (isFatherSelected) setActiveSubStep("father_details");
                else setActiveSubStep("linkage_select");
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back</span>
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateDeclarations()) setActiveSubStep("review");
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
            >
              <span>Next: Review &amp; Visual Card</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 6: Review & Visual Relationship Card */}
      {activeSubStep === "review" && (
        <Card className="p-5 bg-white border-border/80 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <Badge className="bg-emerald-600 text-white text-[10px] font-semibold uppercase">
              Step 6: Final Review
            </Badge>
            <h3 className="text-base font-bold text-foreground mt-1">
              Review Application &amp; Visual Relationship Linkage
            </h3>
            <p className="text-xs text-muted-foreground">
              Verify all entered particulars before submitting to the Gram Sansad Member for inquiry.
            </p>
          </div>

          {/* Simple Visual Relationship Card */}
          <EpicParentLinkageVisualCard data={value} />

          {/* Summary table */}
          <div className="rounded-xl border p-4 bg-slate-50/50 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Applicant (Married Daughter):</span>
              <span className="font-bold text-slate-900">{value.applicantFullName}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Husband's Name:</span>
              <span className="font-medium text-slate-800">{value.husbandName}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Selected Linkage:</span>
              <span className="font-bold text-indigo-700 uppercase">
                {value.linkageSelection === "both"
                  ? "Father + Mother Dual Linkage"
                  : value.linkageSelection === "mother"
                  ? "Mother Linkage Only"
                  : "Father Linkage Only"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-muted-foreground">Jurisdiction:</span>
              <span className="font-medium">{value.sansadNo} · Bagula II GP</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Contact Mobile:</span>
              <span className="font-mono">{value.mobile}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveSubStep("declaration")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Edit</span>
            </Button>

            <div className="flex items-center gap-2">
              {onSaveDraft && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveDraft}
                  className="text-slate-700"
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  <span>Save Draft</span>
                </Button>
              )}

              {onSubmitApplication && (
                <Button
                  type="button"
                  onClick={() => {
                    if (validateApplicant() && validateLinkageSelection() && validateDeclarations()) {
                      onSubmitApplication();
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Submit for Member Verification</span>
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
