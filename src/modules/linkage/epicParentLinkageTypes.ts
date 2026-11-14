/**
 * Dedicated types for EPIC Parent Linkage Certificate workflow.
 * Exclusively designed for a married daughter to link her electoral records
 * with her biological father and/or biological mother for Electoral Roll enrolment.
 *
 * IMPORTANT: This module is strictly separated from SC/ST lineage, caste certificates,
 * and general genealogy trees.
 */

export type LinkageSelection = "father" | "mother" | "both";

export interface ParentElectoralDetails {
  fullName: string;
  epicNo: string;
  assemblyConstituency: string;
  partNo: string;
  serialNo: string;
  electoralRollYear: string;
  supportingDocName?: string;
  supportingDocRef?: string;
  supportingDocUrl?: string;
}

export type VerificationState = "pending" | "verified" | "correction_required";

export interface MemberVerificationDetails {
  verifiedAt?: string;
  verifyingMemberId?: number;
  verifyingMemberName?: string;
  designation?: string;
  wardNumber?: number;
  sansadNo?: string;
  memberAccountId?: string;
  signatureHash?: string;
  signatureTimestamp?: string;

  // Independent verification criteria
  fatherStatus?: VerificationState;
  fatherRemarks?: string;
  motherStatus?: VerificationState;
  motherRemarks?: string;
  evidenceStatus?: VerificationState;
  evidenceRemarks?: string;

  overallStatus?: VerificationState;
  memberDeclarationText?: string;
}

export interface IssuedCertificateSnapshot {
  issuedAt: string;
  certificateNumber: string;
  memoNo: string;
  verificationId: string;
  applicantFullName: string;
  husbandName: string;
  linkageSelection: LinkageSelection;
  fatherElectoral?: ParentElectoralDetails | null;
  motherElectoral?: ParentElectoralDetails | null;
  applicantFatherDeclarationAccepted?: boolean;
  applicantMotherDeclarationAccepted?: boolean;
  memberDeclarationText?: string;
  verifyingMemberName?: string;
  memberDesignation?: string;
  sansadNo?: string;
  wardNumber?: number;
  memberSignatureHash?: string;
  memberSignatureTimestamp?: string;
  supportingDocsSummary?: string[];
}

export interface EpicParentLinkageData {
  // Step 1: Married Daughter Applicant Details
  applicantFullName: string;
  fatherName: string;
  motherName: string;
  husbandName: string;
  presentAddress: string;
  villagePara: string;
  postOffice: string;
  policeStation: string;
  block: string;
  district: string;
  pin: string;
  sansadNo: string; // e.g. "Sansad 1", "Ward 3"
  applicantEpicNo?: string;
  mobile: string;
  email?: string;

  // Step 2: Linkage Selection
  linkageSelection: LinkageSelection;
  linkFather: boolean;
  linkMother: boolean;

  // Step 3: Father Electoral Details (if linkFather is true)
  fatherElectoral: ParentElectoralDetails;

  // Step 4: Mother Electoral Details (if linkMother is true)
  motherElectoral: ParentElectoralDetails;

  // Step 5: Applicant Relationship Declarations
  applicantFatherDeclarationAccepted: boolean;
  applicantMotherDeclarationAccepted: boolean;
  applicantDeclarationDate: string;

  // Supporting Evidence List
  supportingDocs: {
    id: string;
    label: string;
    provided: boolean;
    fileName?: string;
    fileUrl?: string;
    category?: string;
  }[];

  // Member Review & Verification (Elected Member Side)
  memberVerification?: MemberVerificationDetails;

  // Immutable snapshot preserved upon certificate issuance
  issuedCertificateSnapshot?: IssuedCertificateSnapshot;
}

export const EMPTY_PARENT_ELECTORAL: ParentElectoralDetails = {
  fullName: "",
  epicNo: "",
  assemblyConstituency: "89 - Ranaghat (S.C.) North East Assembly Constituency",
  partNo: "",
  serialNo: "",
  electoralRollYear: "Draft Electoral Roll 2025",
  supportingDocName: "",
  supportingDocRef: "",
};

export const DEFAULT_LINKAGE_SUPPORTING_DOCS = [
  {
    id: "doc-daughter-age",
    label: "Proof of Age of Married Daughter (Madhyamik Admit / Birth Certificate)",
    provided: true,
  },
  {
    id: "doc-marriage",
    label: "Proof of Marriage (Marriage Certificate / Husband GP Residential Proof)",
    provided: true,
  },
  {
    id: "doc-father-epic",
    label: "Biological Father's EPIC & Electoral Roll (2025 Draft) Extract",
    provided: false,
  },
  {
    id: "doc-mother-epic",
    label: "Biological Mother's EPIC & Electoral Roll (2025 Draft) Extract",
    provided: false,
  },
  {
    id: "doc-gp-tax",
    label: "Bagula II GP Latest Tax Receipt / Family Residential Record",
    provided: false,
  },
];

export const EMPTY_EPIC_PARENT_LINKAGE: EpicParentLinkageData = {
  applicantFullName: "",
  fatherName: "",
  motherName: "",
  husbandName: "",
  presentAddress: "",
  villagePara: "",
  postOffice: "Bagula",
  policeStation: "Hanskhali",
  block: "Hanskhali",
  district: "Nadia",
  pin: "741502",
  sansadNo: "Sansad I",
  applicantEpicNo: "",
  mobile: "",
  email: "",

  linkageSelection: "father",
  linkFather: true,
  linkMother: false,

  fatherElectoral: { ...EMPTY_PARENT_ELECTORAL },
  motherElectoral: { ...EMPTY_PARENT_ELECTORAL },

  applicantFatherDeclarationAccepted: false,
  applicantMotherDeclarationAccepted: false,
  applicantDeclarationDate: "",

  supportingDocs: DEFAULT_LINKAGE_SUPPORTING_DOCS,

  memberVerification: {
    fatherStatus: "pending",
    motherStatus: "pending",
    evidenceStatus: "pending",
    overallStatus: "pending",
  },
};
