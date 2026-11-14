import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JURISDICTION, resolvePostOffice } from "@/lib/masterData";
import {
  MasterDataService,
  type MasterRelation,
  type VillageWithPostOffices,
} from "@/lib/api/MasterDataService";
import { useEffect, useMemo, useState } from "react";
import type { ApplicantInfo, ApplicationKind, WarishDetails } from "./types";
import {
  applyWarishRelationChange,
  computeWarishCareOf,
  getCareOfMode,
  splitCareOfString,
  stripLatePrefix,
  validateWarishApplicantStep,
  type DeceasedChildRelation,
} from "@/modules/warish/careOfRules";

const RELATIONS = ["S/O", "D/O", "W/O", "C/O"];
const PREFIXES = ["Shri", "Smt.", "Md.", "Mst."];

interface Props {
  kind?: ApplicationKind;
  value: ApplicantInfo;
  onChange: (next: ApplicantInfo) => void;
  warishValue?: WarishDetails;
  onWarishChange?: (next: WarishDetails) => void;
  onWarishDraftPatch?: (applicant: ApplicantInfo, warish: WarishDetails) => void;
  readOnly?: boolean;
  /** Hide contact fields when they were already captured in the duplicate step. */
  hideContact?: boolean;
  /** Display specific Married Daughter guidance for EPIC Parent Linkage workflow. */
  isMarriedDaughterLinkage?: boolean;
}

/**
 * Reusable applicant block shared by Warish, Dependent and Linkage
 * certificate modules. Warish uses dedicated Care-of automation, master
 * relations, master-only villages, and full required-field validation.
 */
export default function ApplicantSection({
  kind,
  value,
  onChange,
  warishValue,
  onWarishChange,
  onWarishDraftPatch,
  readOnly = false,
  hideContact,
  isMarriedDaughterLinkage = false,
}: Props) {
  const isWarish = kind === "warish";
  const [villages, setVillages] = useState<VillageWithPostOffices[]>([]);
  const [relations, setRelations] = useState<MasterRelation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchMasterLists = async () => {
      try {
        const [vils, rels] = await Promise.all([
          MasterDataService.getActiveVillagesWithPostOffices(),
          isWarish ? MasterDataService.getActiveRelations() : Promise.resolve([]),
        ]);
        if (active) {
          setVillages(vils);
          if (isWarish) setRelations(rels);
          setLoading(false);
        }
      } catch {
        if (active) setLoading(false);
      }
    };

    fetchMasterLists();

    const handleUpdate = () => {
      MasterDataService.clearCache();
      fetchMasterLists();
    };

    window.addEventListener("bagula_master_data_updated", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("bagula_master_data_updated", handleUpdate);
    };
  }, [isWarish]);

  const availableVillages = useMemo(() => villages.map((v) => v.name), [villages]);

  const availablePostOffices = useMemo(() => {
    if (!value.village || value.village === "Other") return [];
    const selected = villages.find(
      (v) => v.name.toLowerCase() === value.village.toLowerCase(),
    );
    if (!selected) return [];
    return selected.postOffices.map((po) => po.name);
  }, [value.village, villages]);

  const set = (patch: Partial<ApplicantInfo>) => onChange({ ...value, ...patch });

  const currentManualCareOf =
    value.careOf !== undefined
      ? value.careOf
      : [value.relationType, value.guardianName].filter(Boolean).join(" ").trim();

  const careOfRule = computeWarishCareOf({
    relation: warishValue?.applicantRelation ?? "",
    deceasedName: warishValue?.deceasedName ?? "",
    applicantName: value.name,
    deceasedChildRelation: warishValue?.deceasedChildRelation ?? "",
    manualApplicantCareOf: currentManualCareOf,
  });

  // Keep applicant_relation_id synced once master relations finish loading
  useEffect(() => {
    if (!isWarish || !warishValue || !warishValue.applicantRelation || relations.length === 0) {
      return;
    }
    const matched = relations.find(
      (r) =>
        r.relation_name.toLowerCase() ===
        warishValue.applicantRelation.trim().toLowerCase(),
    );
    if (matched && warishValue.applicant_relation_id !== matched.id) {
      onWarishChange?.({
        ...warishValue,
        applicantRelation: matched.relation_name,
        applicant_relation_id: matched.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWarish, relations]);

  // Keep auto-computed Care-of fields synchronized if deceasedName / applicantName changed externally (e.g. Step 2)
  useEffect(() => {
    if (!isWarish || !warishValue) return;
    if (careOfRule.mode === "auto_applicant_from_deceased") {
      const split = splitCareOfString(careOfRule.applicantCareOf);
      const nextRelationType = split.relationType || careOfRule.prefix;
      if (
        value.careOf !== careOfRule.applicantCareOf ||
        value.relationType !== nextRelationType ||
        value.guardianName !== split.guardianName
      ) {
        onChange({
          ...value,
          careOf: careOfRule.applicantCareOf,
          relationType: nextRelationType,
          guardianName: split.guardianName,
        });
      }
    } else if (careOfRule.mode === "auto_deceased_from_applicant") {
      const cleanApplicant = stripLatePrefix(value.name);
      const nextFatherName = careOfRule.prefix ? cleanApplicant : "";
      if (
        warishValue.deceasedCareOf !== careOfRule.deceasedCareOf ||
        warishValue.fatherPrefix !== careOfRule.prefix ||
        warishValue.fatherName !== nextFatherName
      ) {
        onWarishChange?.({
          ...warishValue,
          deceasedCareOf: careOfRule.deceasedCareOf,
          fatherPrefix: careOfRule.prefix,
          fatherName: nextFatherName,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isWarish,
    careOfRule.mode,
    careOfRule.applicantCareOf,
    careOfRule.deceasedCareOf,
    careOfRule.prefix,
  ]);

  // Non-Warish behavior (Dependent & Linkage remain completely unchanged)
  if (!isWarish || !warishValue) {
    const onVillage = (v: string) => {
      const selected = villages.find((vil) => vil.name === v);
      const autoPo =
        selected && selected.postOffices.length > 0 ? selected.postOffices[0].name : "";
      const po = v === "Other" ? "" : autoPo;
      set({
        village: v,
        villageManual: v === "Other" ? value.villageManual : "",
        postOffice: po || value.postOffice,
        block: JURISDICTION.block,
        policeStation: JURISDICTION.policeStation.replace(" P.S.", ""),
        district: JURISDICTION.district,
        pin: JURISDICTION.pin,
      });
    };

    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">
            {isMarriedDaughterLinkage ? (
              <span className="text-indigo-900 font-bold flex items-center gap-2">
                <span>👤</span>
                <span>Applicant / Married Daughter (আবেদনকারী / বিবাহিতা কন্যা)</span>
              </span>
            ) : (
              "👤 Applicant Information"
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isMarriedDaughterLinkage
              ? "Establishing parent-child linkage with biological father and/or mother for electoral enrolment. Parentage is not inferred from husband's details."
              : "Address fields follow the Gram Panchayat master data — Post Office fills in automatically."}
          </p>
        </div>

        {isMarriedDaughterLinkage && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-950 flex items-center gap-2.5">
            <span className="text-base">ℹ️</span>
            <span>
              <strong>Statutory Rule:</strong> In accordance with Section 16 &amp; 19 of the
              Representation of the People Act, 1950, a married daughter establishes electoral
              linkage directly with her biological parents.
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ap-prefix">Prefix</Label>
            <Select value={value.prefix} onValueChange={(v) => set({ prefix: v })}>
              <SelectTrigger id="ap-prefix">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREFIXES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ap-name">
              Applicant Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ap-name"
              value={value.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-rel">Relationship</Label>
            <Select
              value={value.relationType}
              onValueChange={(v) => set({ relationType: v })}
            >
              <SelectTrigger id="ap-rel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ap-guardian">Guardian / Father / Husband Name</Label>
            <Input
              id="ap-guardian"
              value={value.guardianName}
              onChange={(e) => set({ guardianName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ap-village">
              📍 Village <span className="text-destructive">*</span>
            </Label>
            <Select value={value.village} onValueChange={onVillage}>
              <SelectTrigger id="ap-village">
                <SelectValue placeholder="Select village" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  availableVillages.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))
                )}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {value.village === "Other" && (
              <Input
                className="mt-2"
                placeholder="Type village name"
                value={value.villageManual}
                onChange={(e) => set({ villageManual: e.target.value })}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-po">Post Office (auto)</Label>
            <Select
              value={value.postOffice}
              onValueChange={(v) => set({ postOffice: v })}
            >
              <SelectTrigger id="ap-po">
                <SelectValue placeholder="Select post office" />
              </SelectTrigger>
              <SelectContent>
                {availablePostOffices.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {value.postOffice === "Other" && (
              <Input
                className="mt-2"
                placeholder="Type post office"
                value={value.postOfficeManual}
                onChange={(e) => set({ postOfficeManual: e.target.value })}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ap-ps">Police Station</Label>
            <Input
              id="ap-ps"
              value={value.policeStation}
              onChange={(e) => set({ policeStation: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-block">Block</Label>
            <Input
              id="ap-block"
              value={value.block}
              onChange={(e) => set({ block: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-district">District</Label>
            <Input
              id="ap-district"
              value={value.district}
              onChange={(e) => set({ district: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-pin">PIN</Label>
            <Input
              id="ap-pin"
              inputMode="numeric"
              maxLength={6}
              value={value.pin}
              onChange={(e) =>
                set({ pin: e.target.value.replace(/\D/g, "").slice(0, 6) })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ap-epic">🪪 Voter ID (EPIC) No.</Label>
            <Input
              id="ap-epic"
              value={value.epicNo}
              onChange={(e) => set({ epicNo: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ap-aadhaar">Aadhaar — last 4 digits only</Label>
            <Input
              id="ap-aadhaar"
              inputMode="numeric"
              maxLength={4}
              placeholder="XXXX"
              value={value.aadhaarLast4}
              onChange={(e) =>
                set({ aadhaarLast4: e.target.value.replace(/\D/g, "").slice(0, 4) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Full Aadhaar numbers are never stored.
            </p>
          </div>
        </div>

        {!hideContact && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-mobile">📱 Mobile</Label>
              <Input
                id="ap-mobile"
                inputMode="numeric"
                maxLength={10}
                value={value.mobile}
                onChange={(e) =>
                  set({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-email">📧 Email</Label>
              <Input
                id="ap-email"
                type="email"
                value={value.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // WARISH-ONLY STEP 1 (APPLICANT)
  // ============================================================================
  const commitBoth = (nextApplicant: ApplicantInfo, nextWarish: WarishDetails) => {
    if (onWarishDraftPatch) {
      onWarishDraftPatch(nextApplicant, nextWarish);
    } else {
      onChange(nextApplicant);
      onWarishChange?.(nextWarish);
    }
  };

  const handleApplicantNameChange = (nextName: string) => {
    const nextRule = computeWarishCareOf({
      relation: warishValue.applicantRelation,
      deceasedName: warishValue.deceasedName,
      applicantName: nextName,
      deceasedChildRelation: warishValue.deceasedChildRelation ?? "",
      manualApplicantCareOf: currentManualCareOf,
    });

    const nextApplicant: ApplicantInfo = {
      ...value,
      name: nextName,
    };

    if (nextRule.mode === "auto_deceased_from_applicant") {
      const cleanApplicant = stripLatePrefix(nextName);
      const nextWarish: WarishDetails = {
        ...warishValue,
        deceasedCareOf: nextRule.deceasedCareOf,
        fatherPrefix: nextRule.prefix,
        fatherName: nextRule.prefix ? cleanApplicant : "",
      };
      commitBoth(nextApplicant, nextWarish);
    } else {
      onChange(nextApplicant);
    }
  };

  const handleRelationChange = (selectedRelation: string) => {
    const relObj = relations.find((r) => r.relation_name === selectedRelation);
    const prevMode = getCareOfMode(warishValue.applicantRelation);
    const nextRule = applyWarishRelationChange({
      nextRelation: selectedRelation,
      deceasedName: warishValue.deceasedName,
      applicantName: value.name,
    });

    let nextApplicant: ApplicantInfo;
    if (nextRule.mode === "auto_applicant_from_deceased") {
      const split = splitCareOfString(nextRule.applicantCareOf);
      nextApplicant = {
        ...value,
        careOf: nextRule.applicantCareOf,
        relationType: split.relationType || nextRule.prefix,
        guardianName: split.guardianName,
      };
    } else {
      // Clear Care of when switching away from any relation so no old value remains
      nextApplicant = {
        ...value,
        careOf: "",
        relationType: "",
        guardianName: "",
      };
    }

    const isParentRelation = nextRule.mode === "auto_deceased_from_applicant";
    const nextWarish: WarishDetails = {
      ...warishValue,
      applicantRelation: selectedRelation,
      applicant_relation_id: relObj?.id,
      deceasedChildRelation: "",
      deceasedCareOf: "",
      ...(isParentRelation
        ? {
            fatherPrefix: "",
            fatherName: "",
            relationToGuardian:
              selectedRelation.trim().toLowerCase() === "mother" ? "Mother" : "Father",
          }
        : prevMode === "auto_deceased_from_applicant"
          ? {
              fatherPrefix: "Late",
              fatherName: "",
              relationToGuardian: "Father",
            }
          : {}),
    };

    commitBoth(nextApplicant, nextWarish);
  };

  const handleDeceasedNameChange = (nextDeceasedName: string) => {
    const nextRule = computeWarishCareOf({
      relation: warishValue.applicantRelation,
      deceasedName: nextDeceasedName,
      applicantName: value.name,
      deceasedChildRelation: warishValue.deceasedChildRelation ?? "",
      manualApplicantCareOf: currentManualCareOf,
    });

    const nextWarish: WarishDetails = {
      ...warishValue,
      deceasedName: nextDeceasedName,
    };

    if (nextRule.mode === "auto_applicant_from_deceased") {
      const split = splitCareOfString(nextRule.applicantCareOf);
      const nextApplicant: ApplicantInfo = {
        ...value,
        careOf: nextRule.applicantCareOf,
        relationType: split.relationType || nextRule.prefix,
        guardianName: split.guardianName,
      };
      commitBoth(nextApplicant, nextWarish);
    } else {
      onWarishChange?.(nextWarish);
    }
  };

  const handleDeceasedChildRelationSelect = (choice: DeceasedChildRelation) => {
    const nextRule = computeWarishCareOf({
      relation: warishValue.applicantRelation,
      deceasedName: warishValue.deceasedName,
      applicantName: value.name,
      deceasedChildRelation: choice,
      manualApplicantCareOf: currentManualCareOf,
    });

    const cleanApplicant = stripLatePrefix(value.name);
    onWarishChange?.({
      ...warishValue,
      deceasedChildRelation: choice,
      deceasedCareOf: nextRule.deceasedCareOf,
      fatherPrefix: nextRule.prefix,
      fatherName: nextRule.prefix ? cleanApplicant : "",
    });
  };

  const handleManualCareOfChange = (rawCareOf: string) => {
    const split = splitCareOfString(rawCareOf);
    set({
      careOf: rawCareOf,
      relationType: split.relationType,
      guardianName: split.guardianName,
    });
  };

  const handleWarishVillageChange = (villageName: string) => {
    const selected = villages.find((v) => v.name === villageName);
    const firstPo = selected?.postOffices?.[0];
    const autoPo = firstPo?.name || resolvePostOffice(villageName) || "";
    const autoPin = firstPo?.pin_code || JURISDICTION.pin;
    const ps = JURISDICTION.policeStation.replace(" P.S.", "");

    const nextApplicant: ApplicantInfo = {
      ...value,
      village: selected?.name ?? villageName,
      villageManual: "",
      postOffice: autoPo,
      postOfficeManual: "",
      block: JURISDICTION.block,
      policeStation: ps,
      district: JURISDICTION.district,
      pin: autoPin,
    };

    const nextWarish: WarishDetails = {
      ...warishValue,
      village: selected?.name ?? villageName,
      village_id: selected?.id,
      postOffice: autoPo,
      post_office_id: firstPo?.id,
      policeStation: ps,
      district: JURISDICTION.district,
      pin: autoPin,
    };

    commitBoth(nextApplicant, nextWarish);
  };

  const handleWarishPostOfficeChange = (poName: string) => {
    const selectedVil = villages.find(
      (v) => v.name.toLowerCase() === value.village.toLowerCase(),
    );
    const poObj = selectedVil?.postOffices.find((po) => po.name === poName);

    commitBoth(
      {
        ...value,
        postOffice: poName,
        postOfficeManual: "",
        pin: poObj?.pin_code || value.pin,
      },
      {
        ...warishValue,
        postOffice: poName,
        post_office_id: poObj?.id,
        pin: poObj?.pin_code || warishValue.pin,
      },
    );
  };

  const matchedMasterVillage = villages.find(
    (v) => v.name.toLowerCase() === (value.village ?? "").toLowerCase(),
  );
  const selectedVillageSelectValue = matchedMasterVillage
    ? matchedMasterVillage.name
    : value.village && value.village !== "Other" && loading
      ? value.village
      : "";

  const matchedMasterRelation = relations.find(
    (r) =>
      r.relation_name.toLowerCase() ===
      (warishValue.applicantRelation ?? "").trim().toLowerCase(),
  );
  const selectedRelationValue = matchedMasterRelation
    ? matchedMasterRelation.relation_name
    : warishValue.applicantRelation || "";

  const validation = validateWarishApplicantStep({
    prefix: value.prefix,
    name: value.name,
    applicantRelation: warishValue.applicantRelation,
    deceasedName: warishValue.deceasedName,
    deceasedChildRelation: warishValue.deceasedChildRelation ?? "",
    deceasedCareOf: warishValue.deceasedCareOf ?? careOfRule.deceasedCareOf,
    careOf: careOfRule.isApplicantCareOfReadOnly
      ? careOfRule.applicantCareOf
      : currentManualCareOf,
    village: value.village,
    postOffice: value.postOffice,
    mobile: value.mobile,
  });

  const fe = validation.fieldErrors;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold flex flex-wrap items-center gap-2">
          <span>👤 Applicant Details</span>
          <span className="text-xs font-normal text-muted-foreground">
            / আবেদনকারীর বিবরণ
          </span>
        </h2>
        <p className="text-sm text-muted-foreground">
          All fields marked <span className="text-destructive font-medium">*</span> are
          required. Care-of and Post Office are filled automatically from master rules.
        </p>
      </div>

      {/* 1. APPLICANT NAME (WITH PREFIX) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="ap-prefix">
            Prefix / উপসর্গ <span className="text-destructive">*</span>
          </Label>
          <Select
            disabled={readOnly}
            value={value.prefix}
            onValueChange={(v) => set({ prefix: v })}
          >
            <SelectTrigger id="ap-prefix">
              <SelectValue placeholder="Select prefix" />
            </SelectTrigger>
            <SelectContent>
              {PREFIXES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fe.prefix && <p className="text-xs text-destructive">{fe.prefix}</p>}
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ap-name">
            Applicant Name / আবেদনকারীর নাম <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ap-name"
            disabled={readOnly}
            placeholder="e.g. Subhashis Biswas"
            value={value.name}
            onChange={(e) => handleApplicantNameChange(e.target.value)}
          />
          {fe.name && <p className="text-xs text-destructive">{fe.name}</p>}
        </div>
      </div>

      {/* 2. RELATION TO DECEASED & NAME OF DECEASED (SHARED WITH STEP 2) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ap-warish-relation">
            Relation to the Deceased / মৃত ব্যক্তির সাথে সম্পর্ক{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            disabled={readOnly || loading}
            value={selectedRelationValue}
            onValueChange={handleRelationChange}
          >
            <SelectTrigger id="ap-warish-relation">
              <SelectValue
                placeholder={
                  loading
                    ? "Loading master relations..."
                    : "Select relation / সম্পর্ক নির্বাচন করুন"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {relations.map((r) => (
                <SelectItem key={r.id || r.relation_name} value={r.relation_name}>
                  {r.relation_name}
                  {r.relation_name_bn ? ` (${r.relation_name_bn})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Loaded from Bagula II Master Relations list.
          </p>
          {fe.applicantRelation && (
            <p className="text-xs text-destructive">{fe.applicantRelation}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ap-deceased-name">
            Name of the Deceased / মৃত ব্যক্তির নাম{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ap-deceased-name"
            disabled={readOnly}
            placeholder="e.g. Gouranga Chakraborty"
            value={warishValue.deceasedName}
            onChange={(e) => handleDeceasedNameChange(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">
            Shared with Step 2 — &ldquo;Late&rdquo; is applied automatically where required.
          </p>
          {fe.deceasedName && (
            <p className="text-xs text-destructive">{fe.deceasedName}</p>
          )}
        </div>
      </div>

      {/* CONDITIONAL FATHER / MOTHER SUB-QUESTION & DECEASED CARE-OF */}
      {careOfRule.requiresDeceasedChildQuestion && (
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Is the deceased a son or a daughter? / মৃত ব্যক্তি কি আপনার পুত্র না কন্যা?{" "}
              <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={readOnly}
                aria-pressed={warishValue.deceasedChildRelation === "son"}
                onClick={() => handleDeceasedChildRelationSelect("son")}
                className={[
                  "min-h-[38px] rounded-md border px-4 py-1.5 text-sm font-medium transition-colors",
                  warishValue.deceasedChildRelation === "son"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-muted",
                ].join(" ")}
              >
                Son / পুত্র
              </button>
              <button
                type="button"
                disabled={readOnly}
                aria-pressed={warishValue.deceasedChildRelation === "daughter"}
                onClick={() => handleDeceasedChildRelationSelect("daughter")}
                className={[
                  "min-h-[38px] rounded-md border px-4 py-1.5 text-sm font-medium transition-colors",
                  warishValue.deceasedChildRelation === "daughter"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-foreground hover:bg-muted",
                ].join(" ")}
              >
                Daughter / কন্যা
              </button>
            </div>
            {fe.deceasedChildRelation && (
              <p className="text-xs text-destructive">{fe.deceasedChildRelation}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ap-deceased-careof">
                Deceased&apos;s Care of / মৃত ব্যক্তির যত্নে
              </Label>
              <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Auto-filled · Read-only
              </span>
            </div>
            <Input
              id="ap-deceased-careof"
              readOnly
              value={careOfRule.deceasedCareOf}
              placeholder="Select Son or Daughter and enter Applicant Name above"
              className="bg-muted/60 cursor-not-allowed font-medium"
            />
            <p className="text-[11px] text-muted-foreground">
              Set automatically from the applicant&apos;s name without &ldquo;Late&rdquo;
              (জীবিত আবেদনকারীর নামের আগে &ldquo;Late&rdquo; বসবে না).
            </p>
            {fe.deceasedCareOf && (
              <p className="text-xs text-destructive">{fe.deceasedCareOf}</p>
            )}
          </div>
        </div>
      )}

      {/* 3. APPLICANT CARE OF (AUTO READ-ONLY OR MANUAL) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="ap-careof">
            Care of / যত্নে (অভিভাবক) <span className="text-destructive">*</span>
          </Label>
          {careOfRule.isApplicantCareOfReadOnly && (
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Auto-filled · Read-only
            </span>
          )}
        </div>
        {careOfRule.isApplicantCareOfReadOnly ? (
          <Input
            id="ap-careof"
            readOnly
            value={careOfRule.applicantCareOf}
            placeholder="Auto-fills once Name of the Deceased is entered"
            className="bg-muted/60 cursor-not-allowed font-medium"
          />
        ) : (
          <Input
            id="ap-careof"
            disabled={readOnly}
            value={currentManualCareOf}
            placeholder="e.g. Late Haripada Biswas / পিতা বা স্বামীর নাম লিখুন"
            onChange={(e) => handleManualCareOfChange(e.target.value)}
          />
        )}
        <p className="text-[11px] text-muted-foreground">
          {careOfRule.isApplicantCareOfReadOnly
            ? "Automatically computed from the selected relation and deceased name."
            : "Enter the applicant's Care-of manually."}
        </p>
        {fe.careOf && <p className="text-xs text-destructive">{fe.careOf}</p>}
      </div>

      {/* 4. VILLAGE (MASTER ONLY) & POST OFFICE (AUTO FROM VILLAGE MAPPING) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ap-village">
            📍 Village / গ্রাম <span className="text-destructive">*</span>
          </Label>
          <Select
            disabled={readOnly || loading}
            value={selectedVillageSelectValue}
            onValueChange={handleWarishVillageChange}
          >
            <SelectTrigger id="ap-village">
              <SelectValue
                placeholder={
                  loading
                    ? "Loading master villages..."
                    : "Select village / গ্রাম নির্বাচন করুন"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableVillages.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Bagula II Gram Panchayat master village list only.
          </p>
          {fe.village && <p className="text-xs text-destructive">{fe.village}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="ap-po">
              📮 Post Office / ডাকঘর <span className="text-destructive">*</span>
            </Label>
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Auto-filled
            </span>
          </div>
          {availablePostOffices.length > 1 ? (
            <Select
              disabled={readOnly}
              value={value.postOffice}
              onValueChange={handleWarishPostOfficeChange}
            >
              <SelectTrigger id="ap-po">
                <SelectValue placeholder="Select mapped post office" />
              </SelectTrigger>
              <SelectContent>
                {availablePostOffices.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="ap-po"
              readOnly
              value={value.postOffice}
              placeholder={
                value.village
                  ? "Resolved from village mapping"
                  : "Select village first / প্রথমে গ্রাম নির্বাচন করুন"
              }
              className="bg-muted/60 cursor-not-allowed font-medium"
            />
          )}
          <p className="text-[11px] text-muted-foreground">
            Filled automatically from the selected village mapping.
          </p>
          {fe.postOffice && <p className="text-xs text-destructive">{fe.postOffice}</p>}
        </div>

        {/* Optional Address Fields */}
        <div className="space-y-1.5">
          <Label htmlFor="ap-ps">Police Station / থানা (Optional)</Label>
          <Input
            id="ap-ps"
            disabled={readOnly}
            value={value.policeStation}
            onChange={(e) => set({ policeStation: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ap-block">Block / ব্লক (Optional)</Label>
          <Input
            id="ap-block"
            disabled={readOnly}
            value={value.block}
            onChange={(e) => set({ block: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ap-district">District / জেলা (Optional)</Label>
          <Input
            id="ap-district"
            disabled={readOnly}
            value={value.district}
            onChange={(e) => set({ district: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ap-pin">PIN / পিন কোড (Optional)</Label>
          <Input
            id="ap-pin"
            disabled={readOnly}
            inputMode="numeric"
            maxLength={6}
            value={value.pin}
            onChange={(e) =>
              set({ pin: e.target.value.replace(/\D/g, "").slice(0, 6) })
            }
          />
        </div>
      </div>

      {/* 5. MOBILE (REQUIRED) & OPTIONAL EMAIL / EPIC / AADHAAR LAST 4 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ap-mobile">
            📱 Mobile (10 digits) / মোবাইল নম্বর{" "}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ap-mobile"
            disabled={readOnly}
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 9832104567"
            value={value.mobile}
            onChange={(e) =>
              set({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })
            }
          />
          {fe.mobile && <p className="text-xs text-destructive">{fe.mobile}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ap-email">📧 Email / ইমেইল (Optional)</Label>
          <Input
            id="ap-email"
            disabled={readOnly}
            type="email"
            placeholder="name@example.com"
            value={value.email}
            onChange={(e) => set({ email: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ap-epic">
            🪪 Voter ID (EPIC) No. / ভোটার কার্ড নম্বর (Optional)
          </Label>
          <Input
            id="ap-epic"
            disabled={readOnly}
            value={value.epicNo}
            onChange={(e) => set({ epicNo: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ap-aadhaar">
            Aadhaar — last 4 digits only / আধারের শেষ ৪ সংখ্যা (Optional)
          </Label>
          <Input
            id="ap-aadhaar"
            disabled={readOnly}
            inputMode="numeric"
            maxLength={4}
            placeholder="XXXX"
            value={value.aadhaarLast4}
            onChange={(e) =>
              set({ aadhaarLast4: e.target.value.replace(/\D/g, "").slice(0, 4) })
            }
          />
          <p className="text-xs text-muted-foreground">
            Full Aadhaar numbers are never stored. / সম্পূর্ণ আধার নম্বর সংরক্ষণ করা হয় না।
          </p>
        </div>
      </div>
    </div>
  );
}
