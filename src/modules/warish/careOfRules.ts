export type CareOfMode =
  | "auto_applicant_from_deceased"
  | "auto_deceased_from_applicant"
  | "manual";

export type DeceasedChildRelation = "" | "son" | "daughter";

export type AutoCareOfPrefix = "" | "S/O" | "D/O" | "H/O" | "W/O";

export interface CareOfRuleInput {
  relation: string;
  deceasedName: string;
  applicantName: string;
  deceasedChildRelation?: DeceasedChildRelation;
  manualApplicantCareOf?: string;
}

export interface CareOfRuleResult {
  mode: CareOfMode;
  prefix: AutoCareOfPrefix;
  applicantCareOf: string;
  isApplicantCareOfReadOnly: boolean;
  requiresDeceasedChildQuestion: boolean;
  deceasedCareOf: string;
  isDeceasedCareOfReadOnly: boolean;
}

export interface RelationChangeInput {
  nextRelation: string;
  deceasedName: string;
  applicantName: string;
}

export interface WarishApplicantValidationInput {
  prefix: string;
  name: string;
  applicantRelation: string;
  deceasedName: string;
  deceasedChildRelation?: DeceasedChildRelation;
  deceasedCareOf?: string;
  careOf?: string;
  village: string;
  postOffice: string;
  mobile: string;
}

export type WarishApplicantFieldErrorKey =
  | "prefix"
  | "name"
  | "applicantRelation"
  | "deceasedName"
  | "deceasedChildRelation"
  | "deceasedCareOf"
  | "careOf"
  | "village"
  | "postOffice"
  | "mobile";

export interface WarishApplicantValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors: Partial<Record<WarishApplicantFieldErrorKey, string>>;
}

export const WARISH_MOBILE_REGEX = /^[6-9][0-9]{9}$/;
const LATE_PREFIX_REGEX = /^(?:late\.?\s+)+/i;
const CARE_OF_PREFIX_SPLIT_REGEX = /^(S\/O|D\/O|H\/O|W\/O|C\/O)\s+(.+)$/i;

/**
 * Removes any leading "Late" / "Late." prefix and collapses repeated spaces.
 * Ensures "Late" is never duplicated (e.g. "Late Late Name") and never placed
 * before living applicants.
 */
export function stripLatePrefix(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim().replace(/\s+/g, " ");
  return trimmed.replace(LATE_PREFIX_REGEX, "").trim();
}

export function hasLeadingLatePrefix(value: string | null | undefined): boolean {
  return /^\s*late(?:\.|\b)/i.test(value ?? "");
}

/**
 * Shared Care-of formatter across Phase 1 (Applicant) and Phase 3 (Successors).
 * Supports both `formatCareOf(relation, parentName)` and `formatCareOf(parentName)`.
 * Returns `"Late <parentName>"` (or `""` when `parentName` is empty).
 * The relation (Wife/Son/Daughter) is shown in its own table column, not inside this text.
 */
export function formatCareOf(
  relationOrParentName: string | null | undefined,
  parentName?: string | null | undefined,
): string {
  const targetName =
    parentName !== undefined ? parentName : relationOrParentName;
  const cleanName = stripLatePrefix(targetName);
  return cleanName ? `Late ${cleanName}` : "";
}

function normalizeRelation(relation: string | null | undefined): string {
  return (relation ?? "").trim().toLowerCase();
}

export function getCareOfMode(relation: string | null | undefined): CareOfMode {
  const normalized = normalizeRelation(relation);
  if (
    normalized === "son" ||
    normalized === "daughter" ||
    normalized === "husband" ||
    normalized === "wife"
  ) {
    return "auto_applicant_from_deceased";
  }
  if (normalized === "father" || normalized === "mother") {
    return "auto_deceased_from_applicant";
  }
  return "manual";
}

/**
 * Pure Care-of computation for Warish Phase 1 (Applicant).
 *
 * Rules:
 * - Son, Daughter, Husband, Wife -> applicant care of = formatCareOf(relation, deceasedName) = "Late <deceased name>" (read-only)
 * - Father, Mother -> first ask "Is the deceased a son or a daughter?"; then the DECEASED's care of = applicant's name (no "Late" before the applicant, read-only). Applicant's own care of is typed manually.
 * - Brother, Sister, or any other relation -> care of typed manually.
 */
export function computeWarishCareOf(input: CareOfRuleInput): CareOfRuleResult {
  const normalized = normalizeRelation(input.relation);
  const mode = getCareOfMode(normalized);

  if (mode === "auto_applicant_from_deceased") {
    const prefixMap: Record<string, "S/O" | "D/O" | "H/O" | "W/O"> = {
      son: "S/O",
      daughter: "D/O",
      husband: "H/O",
      wife: "W/O",
    };
    const prefix = prefixMap[normalized];

    return {
      mode,
      prefix,
      applicantCareOf: formatCareOf(input.relation, input.deceasedName),
      isApplicantCareOfReadOnly: true,
      requiresDeceasedChildQuestion: false,
      deceasedCareOf: "",
      isDeceasedCareOfReadOnly: false,
    };
  }

  if (mode === "auto_deceased_from_applicant") {
    const prefix: "" | "S/O" | "D/O" =
      input.deceasedChildRelation === "son"
        ? "S/O"
        : input.deceasedChildRelation === "daughter"
          ? "D/O"
          : "";
    const cleanApplicant = stripLatePrefix(input.applicantName);

    return {
      mode,
      prefix,
      applicantCareOf: (input.manualApplicantCareOf ?? "").trimStart(),
      isApplicantCareOfReadOnly: false,
      requiresDeceasedChildQuestion: true,
      deceasedCareOf: prefix && cleanApplicant ? cleanApplicant : "",
      isDeceasedCareOfReadOnly: true,
    };
  }

  return {
    mode: "manual",
    prefix: "",
    applicantCareOf: input.manualApplicantCareOf ?? "",
    isApplicantCareOfReadOnly: false,
    requiresDeceasedChildQuestion: false,
    deceasedCareOf: "",
    isDeceasedCareOfReadOnly: false,
  };
}

/**
 * Recomputes Care-of state when the applicant's relation changes.
 * Clears manual Care-of and Father/Mother sub-selection so changing the relation
 * never leaves a stale value behind.
 */
export function applyWarishRelationChange(
  input: RelationChangeInput,
): CareOfRuleResult {
  return computeWarishCareOf({
    relation: input.nextRelation,
    deceasedName: input.deceasedName,
    applicantName: input.applicantName,
    deceasedChildRelation: "",
    manualApplicantCareOf: "",
  });
}

/**
 * Splits a Care-of string into `relationType` and `guardianName`
 * for backward compatibility with existing draft/preview serializers.
 */
export function splitCareOfString(careOf: string | null | undefined): {
  relationType: string;
  guardianName: string;
} {
  const trimmed = (careOf ?? "").trim();
  if (!trimmed) {
    return { relationType: "", guardianName: "" };
  }
  const match = trimmed.match(CARE_OF_PREFIX_SPLIT_REGEX);
  if (match) {
    return {
      relationType: match[1].toUpperCase(),
      guardianName: match[2].trim(),
    };
  }
  return {
    relationType: "",
    guardianName: trimmed,
  };
}

/**
 * Validates every required field for Phase 1 (Applicant) of a Warish application.
 */
export function validateWarishApplicantStep(
  input: WarishApplicantValidationInput,
): WarishApplicantValidationResult {
  const fieldErrors: Partial<Record<WarishApplicantFieldErrorKey, string>> = {};
  const errors: string[] = [];

  const pushError = (key: WarishApplicantFieldErrorKey, message: string) => {
    if (!fieldErrors[key]) {
      fieldErrors[key] = message;
      errors.push(message);
    }
  };

  const prefix = (input.prefix ?? "").trim();
  if (!prefix) {
    pushError("prefix", "Applicant prefix is required (আবেদনকারীর উপসর্গ নির্বাচন করুন).");
  } else if (hasLeadingLatePrefix(prefix)) {
    pushError("prefix", '"Late" cannot be used before a living applicant.');
  }

  const name = (input.name ?? "").trim();
  if (!name) {
    pushError("name", "Applicant name is required (আবেদনকারীর নাম আবশ্যক).");
  } else if (hasLeadingLatePrefix(name)) {
    pushError(
      "name",
      '"Late" appears only before the deceased person\'s name, never before the applicant.',
    );
  }

  const relation = (input.applicantRelation ?? "").trim();
  if (!relation) {
    pushError(
      "applicantRelation",
      "Relation to the deceased is required (মৃত ব্যক্তির সাথে সম্পর্ক নির্বাচন করুন).",
    );
  }

  const deceasedName = (input.deceasedName ?? "").trim();
  if (!deceasedName) {
    pushError(
      "deceasedName",
      "Name of the deceased is required (মৃত ব্যক্তির নাম আবশ্যক).",
    );
  }

  const rule = computeWarishCareOf({
    relation,
    deceasedName,
    applicantName: name,
    deceasedChildRelation: input.deceasedChildRelation,
    manualApplicantCareOf: input.careOf,
  });

  if (rule.requiresDeceasedChildQuestion) {
    if (!input.deceasedChildRelation) {
      pushError(
        "deceasedChildRelation",
        "Please specify whether the deceased is a son or a daughter (মৃত ব্যক্তি পুত্র না কন্যা তা নির্বাচন করুন).",
      );
    } else if (!rule.deceasedCareOf.trim() && name) {
      pushError(
        "deceasedCareOf",
        "Deceased's Care of could not be derived from the applicant name.",
      );
    }

    if (!(input.careOf ?? "").trim()) {
      pushError(
        "careOf",
        "Care of is required (আবেদনকারীর কেয়ার অফ / অভিভাবকের নাম আবশ্যক).",
      );
    } else if (hasLeadingLatePrefix(input.careOf)) {
      // Allowed if applicant's own father/husband is Late, so no error here
    }
  } else if (rule.mode === "auto_applicant_from_deceased") {
    if (!rule.applicantCareOf.trim()) {
      pushError(
        "careOf",
        "Care of is required (will auto-fill once Name of the deceased is entered).",
      );
    }
  } else if (!(input.careOf ?? "").trim()) {
    pushError(
      "careOf",
      "Care of is required (কেয়ার অফ / অভিভাবকের নাম আবশ্যক).",
    );
  }

  const village = (input.village ?? "").trim();
  if (!village || village === "Other") {
    pushError(
      "village",
      "Village must be selected from the master dropdown (মাস্টার তালিকা থেকে গ্রাম নির্বাচন করুন).",
    );
  }

  const postOffice = (input.postOffice ?? "").trim();
  if (!postOffice || postOffice === "Other") {
    pushError(
      "postOffice",
      "Post office is required and fills automatically from the selected village (ডাকঘর আবশ্যক).",
    );
  }

  const mobile = (input.mobile ?? "").trim();
  if (!mobile) {
    pushError("mobile", "Mobile number is required (মোবাইল নম্বর আবশ্যক).");
  } else if (!WARISH_MOBILE_REGEX.test(mobile)) {
    pushError(
      "mobile",
      "Mobile number must be 10 digits starting with 6, 7, 8, or 9 (বৈধ ১০ সংখ্যার মোবাইল নম্বর দিন).",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    fieldErrors,
  };
}
