/**
 * SC/ST PATERNAL LINEAGE VERIFICATION & GRAM SANSAD DECLARATION MODULE
 * Types & Data Model
 * 
 * Based on West Bengal Scheduled Castes and Scheduled Tribes (Identification) Act, 1994
 * and castecertificatewb.gov.in official portal paternal-linkage evidence guidelines.
 */

export type LineageGender = "Male" | "Female" | "Other";
export type LivingStatus = "Living" | "Deceased";
export type NodeVerificationStatus = "Pending" | "Verified by Records" | "Verified by Field Inquiry";

export interface LineageTreeNode {
  id: string;
  parentId: string | null; // ID of the father/parent in the tree (null for root ancestor)
  fullName: string;
  fullNameBn?: string;
  relationshipToApplicant: string; // e.g., "Father", "Paternal Grandfather", "Paternal Uncle"
  relationshipCode: string; // Machine code e.g. "FATHER", "PAT_GF", "PAT_UNCLE"
  generationLevel: number; // 0 for applicant, 1 for father, 2 for grandfather, etc.
  gender: LineageGender;
  approxDobOrAge?: string; // e.g. "1962" or "64 Yrs"
  villagePara: string;
  status: LivingStatus;
  
  // Existing SC/ST Certificate linkage flag
  isCertificateHolder: boolean;
  casteCertDetails?: {
    certNo: string;
    subCaste: string; // e.g. "Namasudra", "Poundra", "Rajbanshi", "Santal"
    issueDate: string;
    issuingAuthority: string; // e.g. "SDO Ranaghat", "SDO Krishnanagar"
    state: string; // Usually "West Bengal"
  };

  // Applicant marker
  isApplicant?: boolean;

  // Evidence & Verification metadata
  supportingDocRef?: string; // e.g. "Voter Roll 1971, Part 28", "Aadhaar Card", "CS Khatian 142"
  verificationStatus: NodeVerificationStatus;
  remarks?: string;
}

export type RelationshipEligibilityStatus = "eligible" | "ineligible_maternal" | "ineligible_affinal" | "conditional";

export interface PaternalRelationshipRule {
  code: string;
  labelEn: string;
  labelBn: string;
  category: "paternal" | "maternal" | "affinal" | "other";
  status: RelationshipEligibilityStatus;
  generationalOffset: number; // +1 for father, +2 for grandfather, 0 for brother, etc.
  defaultGender: LineageGender;
  ruleExplanationEn: string;
  ruleExplanationBn: string;
  statutoryReference: string;
}

export interface ExistingCertificateHolderInfo {
  holderName: string;
  relationshipToApplicant: string;
  relationshipCode: string;
  casteCategory: "SC" | "ST";
  subCaste: string;
  certificateNumber: string;
  issueDate: string;
  issuingAuthority: string; // e.g. "SDO Ranaghat, Nadia"
  holderVillage: string;
  isLiving: boolean;
  proofDocumentAttached: boolean;
  proofDocumentName?: string;
  scannedCopyFileName?: string;
  scannedCopyDataUrl?: string;
}

export interface ApplicantInfo {
  fullName: string;
  gender: LineageGender;
  dateOfBirth: string;
  aadhaarNumberMasked?: string;
  mobileNumber?: string;
  fatherName: string;
  motherName: string;
  villagePara: string;
  postOffice: string;
  policeStation: string;
  district: string;
  pinCode: string;
  gramSansadWardNo: number; // 1 to 30 of Bagula II GP
  targetSubCaste: string; // Target sub-caste claiming e.g. "Namasudra (SC)"
}

export interface MemberDeclarationRecord {
  declarationId: string;
  version: string; // e.g. "1.0", "1.1"
  timestamp: string; // ISO datetime
  memberId: string; // Representative unique ID
  memberName: string;
  memberNameBn?: string;
  wardNumber: number; // 1 to 30
  sansadNoRoman: string; // e.g. "IV", "VII"
  designation: string; // "Elected Gram Sansad Member"
  boothPartNos: string; // e.g. "Parts 29 & 30"
  
  // Statutory Declaration Text
  declarationTextEn: string;
  declarationTextBn: string;

  // Verification findings & notes
  fieldInquiryConducted: boolean;
  inquiryDate?: string;
  localWitnessNames?: string[];
  memberObservations: string;

  // Digital acknowledgement & sealing
  digitalSignatureHash: string;
  verificationHash: string;
  ipAddressHash?: string;
  hasOfficialSeal: boolean;
  isImmutableLocked: boolean;
}

export interface ScStLineageCase {
  caseId: string; // e.g. "B2GP-SCS-2026-00142"
  trackingId: string; // e.g. "TRK-LIN-78219"
  createdAt: string;
  updatedAt: string;
  status: "Draft" | "Submitted" | "Member_Verified" | "Panchayat_Endorsed" | "Rejected";
  
  applicant: ApplicantInfo;
  existingCertificateHolder: ExistingCertificateHolderInfo;
  
  // Relational Recursive Family Tree
  treeNodes: LineageTreeNode[];
  rootAncestorNodeId: string;
  applicantNodeId: string;
  certificateHolderNodeId: string;

  // Supporting Evidence List
  supportingDocuments: {
    docType: string;
    docName: string;
    docNumber?: string;
    attached: boolean;
    remarks?: string;
  }[];

  // Gram Sansad Member Endorsement & Declaration (Versioned)
  currentDeclaration?: MemberDeclarationRecord;
  declarationHistory: MemberDeclarationRecord[];

  // Panchayat Office Endorsement (Pradhan / Executive Assistant counter-signing)
  panchayatOfficeEndorsement?: {
    endorsedDate: string;
    memoNumber: string;
    officerName: string;
    officerDesignation: "Prodhan" | "Executive Assistant" | "Secretary";
    officeSealApplied: boolean;
    remarks?: string;
  };

  // OSCAR & WBPMS Merge Preparation
  mergedPdfBundleReady: boolean;
  bundleMetadata?: {
    estimatedSizeKb: number;
    recommendedPortal: "castecertificatewb.gov.in (OSCAR) / WBPMS";
    preparedAt: string;
  };
}
