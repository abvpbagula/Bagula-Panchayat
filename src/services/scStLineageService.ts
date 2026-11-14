/**
 * SC/ST PATERNAL LINEAGE VERIFICATION & SANSAD DECLARATION SERVICE
 * 
 * Manages recursive family tree persistence, immutable member declarations with versioning,
 * role-scoped filtering (Sansad Member vs Office Admin vs Public), and sanitized verification.
 */

import {
  ScStLineageCase,
  LineageTreeNode,
  MemberDeclarationRecord,
  ApplicantInfo,
  ExistingCertificateHolderInfo,
} from "@/types/scStLineageTypes";
import { ELECTED_REPRESENTATIVES_DATA } from "@/lib/electedRepresentativesData";

const STORAGE_KEY = "b2gp_scst_lineage_cases_v1";

// Helper to compute a secure SHA-256-like hex digest for verification
export async function computeDeclarationHash(payload: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(payload + "|BAGULA2GP|1994ACT");
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().slice(0, 24);
  } catch {
    return "B2GP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

// Default Seed Case representing real Bagula II GP geography
const DEFAULT_SEED_CASE: ScStLineageCase = {
  caseId: "B2GP-SCS-2026-00142",
  trackingId: "TRK-LIN-78219",
  createdAt: "2026-09-18T10:15:00.000Z",
  updatedAt: "2026-09-22T14:30:00.000Z",
  status: "Member_Verified",
  applicant: {
    fullName: "BIKASH BISWAS",
    gender: "Male",
    dateOfBirth: "1998-05-14",
    aadhaarNumberMasked: "XXXXXXXX7812",
    mobileNumber: "9832XXXX90",
    fatherName: "SUBODH BISWAS",
    motherName: "SULATA BISWAS",
    villagePara: "Stationpara (Ward 04)",
    postOffice: "Bagula",
    policeStation: "Hanskhali",
    district: "Nadia",
    pinCode: "741502",
    gramSansadWardNo: 4,
    targetSubCaste: "Namasudra (SC)",
  },
  existingCertificateHolder: {
    holderName: "AMAL BISWAS",
    relationshipToApplicant: "Paternal Uncle (কাকামশাই)",
    relationshipCode: "PAT_UNCLE_YOUNGER",
    casteCategory: "SC",
    subCaste: "Namasudra",
    certificateNumber: "WB/NAD/SC/2004/008741",
    issueDate: "2004-11-20",
    issuingAuthority: "Sub-Divisional Officer, Ranaghat, Nadia",
    holderVillage: "Stationpara, Bagula II GP",
    isLiving: true,
    proofDocumentAttached: true,
    proofDocumentName: "Original SC Certificate No. WB/NAD/SC/2004/008741",
  },
  treeNodes: [
    {
      id: "node_ancestor_root",
      parentId: null,
      fullName: "LATE HARIDAS BISWAS",
      relationshipToApplicant: "Paternal Grandfather (পিতামহ)",
      relationshipCode: "PAT_GRANDFATHER",
      generationLevel: 2,
      gender: "Male",
      approxDobOrAge: "1932 (Deceased 2002)",
      villagePara: "Stationpara, Bagula",
      status: "Deceased",
      isCertificateHolder: false,
      supportingDocRef: "Land CS Khatian No. 142 (Stationpara Mouza) & Voter List 1971",
      verificationStatus: "Verified by Records",
      remarks: "Common root paternal ancestor of Applicant's Father and Paternal Uncle",
    },
    {
      id: "node_father",
      parentId: "node_ancestor_root",
      fullName: "SUBODH BISWAS",
      relationshipToApplicant: "Father (পিতা)",
      relationshipCode: "FATHER",
      generationLevel: 1,
      gender: "Male",
      approxDobOrAge: "1966 (59 Yrs)",
      villagePara: "Stationpara, Bagula",
      status: "Living",
      isCertificateHolder: false,
      supportingDocRef: "Aadhaar Card, Voter List 2025 (Part 24, Sl 312)",
      verificationStatus: "Verified by Records",
      remarks: "Son of Late Haridas Biswas. Biological father of Applicant.",
    },
    {
      id: "node_uncle_holder",
      parentId: "node_ancestor_root",
      fullName: "AMAL BISWAS",
      relationshipToApplicant: "Paternal Uncle (কাকামশাই)",
      relationshipCode: "PAT_UNCLE_YOUNGER",
      generationLevel: 1,
      gender: "Male",
      approxDobOrAge: "1971 (54 Yrs)",
      villagePara: "Stationpara, Bagula",
      status: "Living",
      isCertificateHolder: true,
      casteCertDetails: {
        certNo: "WB/NAD/SC/2004/008741",
        subCaste: "Namasudra",
        issueDate: "2004-11-20",
        issuingAuthority: "SDO Ranaghat, Nadia",
        state: "West Bengal",
      },
      supportingDocRef: "Govt SC Certificate & EPIC No. WBE1289012",
      verificationStatus: "Verified by Records",
      remarks: "Direct younger biological brother of Subodh Biswas; shares common father Late Haridas Biswas.",
    },
    {
      id: "node_applicant",
      parentId: "node_father",
      fullName: "BIKASH BISWAS",
      relationshipToApplicant: "Self / Applicant (আবেদনকারী)",
      relationshipCode: "SELF",
      generationLevel: 0,
      gender: "Male",
      approxDobOrAge: "1998 (27 Yrs)",
      villagePara: "Stationpara, Bagula",
      status: "Living",
      isCertificateHolder: false,
      isApplicant: true,
      supportingDocRef: "Madhyamik Admit Card, Aadhaar, Bagula College ID",
      verificationStatus: "Verified by Field Inquiry",
      remarks: "Applicant claiming Namasudra (SC) through direct agnatic paternal lineage of Amal Biswas.",
    },
  ],
  rootAncestorNodeId: "node_ancestor_root",
  applicantNodeId: "node_applicant",
  certificateHolderNodeId: "node_uncle_holder",
  supportingDocuments: [
    {
      docType: "EXISTING_SC_CERTIFICATE",
      docName: "Original SC Certificate copy of Amal Biswas (Uncle)",
      docNumber: "WB/NAD/SC/2004/008741",
      attached: true,
      remarks: "Verified authentic from SDO Ranaghat legacy register",
    },
    {
      docType: "LAND_RECORD_CS_KHATIAN",
      docName: "CS Khatian No. 142 / RS Record showing Late Haridas Biswas lineage",
      docNumber: "Khatian 142, Mouza Bagula",
      attached: true,
      remarks: "Confirms paternal landholding link",
    },
    {
      docType: "VOTER_LIST_EXTRACT",
      docName: "1971 & 2025 Electoral Roll Extract (Ward 04)",
      attached: true,
      remarks: "Establishes joint residence of Subodh and Amal Biswas",
    },
    {
      docType: "MADHYAMIK_ADMIT",
      docName: "Madhyamik Admit Card of Bikash Biswas showing Father's Name",
      attached: true,
      remarks: "Links Applicant to Subodh Biswas",
    },
  ],
  currentDeclaration: {
    declarationId: "DECL-2026-004-V1",
    version: "1.0",
    timestamp: "2026-09-22T14:30:00.000Z",
    memberId: "MEM-WARD-04",
    memberName: "Sandhya Adhikari (Mondal)",
    memberNameBn: "সন্ধ্যা অধিকারী (মণ্ডল)",
    wardNumber: 4,
    sansadNoRoman: "IV",
    designation: "Elected Gram Sansad Member, Bagula II Gram Panchayat",
    boothPartNos: "Part 24",
    declarationTextEn: "I have examined the submitted lineage information and supporting records and declare that the above paternal relationship information is based on the records/evidence placed before me.",
    declarationTextBn: "আমি দাখিলকৃত বংশতালিকা ও সহযোগী নথিপত্র পরীক্ষা ও স্থানীয়ভাবে অনুসন্ধানপূর্বক ঘোষণা করিতেছি যে, উপরোক্ত পৈতৃক রক্তের সম্পর্ক এবং বংশলতিকার তথ্য আমার নিকট উপস্থাপিত প্রমাণ ও তথ্যাবলীর ভিত্তিতে সঠিক।",
    fieldInquiryConducted: true,
    inquiryDate: "2026-09-21",
    localWitnessNames: ["Prabir Sarkar (Stationpara)", "Nirmal Pramanik (Ward 04)"],
    memberObservations: "Local verification conducted at Stationpara. It is confirmed that Bikash Biswas is the biological son of Subodh Biswas, and Subodh Biswas & Amal Biswas are biological brothers born of Late Haridas Biswas. Amal Biswas holds authentic SC Certificate.",
    digitalSignatureHash: "DECL-SIG-7F3A-8B91-C450-BAGULA2",
    verificationHash: "B2GP/SCS-LIN/2026/00142/V1",
    hasOfficialSeal: true,
    isImmutableLocked: true,
  },
  declarationHistory: [],
  mergedPdfBundleReady: true,
  bundleMetadata: {
    estimatedSizeKb: 1420,
    recommendedPortal: "castecertificatewb.gov.in (OSCAR) / WBPMS",
    preparedAt: "2026-09-22T15:00:00.000Z",
  },
};

/**
 * Service Implementation
 */
export const scStLineageService = {
  // Load all cases from storage
  getAllCases(): ScStLineageCase[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_SEED_CASE]));
        return [DEFAULT_SEED_CASE];
      }
      const parsed: ScStLineageCase[] = JSON.parse(raw);
      // Ensure seed case exists if list is empty
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_SEED_CASE]));
        return [DEFAULT_SEED_CASE];
      }
      return parsed;
    } catch {
      return [DEFAULT_SEED_CASE];
    }
  },

  // Save all cases
  saveCases(cases: ScStLineageCase[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  },

  // Get case by Case ID or Tracking ID
  getCaseById(id: string): ScStLineageCase | null {
    const cases = this.getAllCases();
    const clean = id.trim().toUpperCase();
    return (
      cases.find(
        (c) =>
          c.caseId.toUpperCase() === clean ||
          c.trackingId.toUpperCase() === clean ||
          c.currentDeclaration?.verificationHash.toUpperCase() === clean
      ) || null
    );
  },

  // Role-Scoped Filter: Gram Sansad Member (only cases for their assigned Ward/Sansad)
  getCasesForSansadMember(wardNumber: number): ScStLineageCase[] {
    const cases = this.getAllCases();
    return cases.filter((c) => c.applicant.gramSansadWardNo === wardNumber);
  },

  // Role-Scoped Filter: Office Admin (all cases)
  getAllAdministrativeCases(): ScStLineageCase[] {
    return this.getAllCases();
  },

  // Create or Update Draft Case
  saveCaseDraft(caseData: ScStLineageCase): ScStLineageCase {
    const cases = this.getAllCases();
    const idx = cases.findIndex((c) => c.caseId === caseData.caseId);
    
    const updated = {
      ...caseData,
      updatedAt: new Date().toISOString(),
    };

    if (idx >= 0) {
      cases[idx] = updated;
    } else {
      cases.unshift(updated);
    }

    this.saveCases(cases);
    return updated;
  },

  // Gram Sansad Member Endorsement & Declaration (Immutable with Versioning)
  async endorseMemberDeclaration(
    caseId: string,
    declarationData: {
      wardNumber: number;
      memberObservations: string;
      fieldInquiryConducted: boolean;
      inquiryDate?: string;
      localWitnessNames?: string[];
    }
  ): Promise<ScStLineageCase> {
    const existing = this.getCaseById(caseId);
    if (!existing) {
      throw new Error(`Case ${caseId} not found.`);
    }

    // Look up representative info for this Ward from master data
    const rep = ELECTED_REPRESENTATIVES_DATA.find((r) => r.wardNumber === declarationData.wardNumber) || {
      name: "Gram Sansad Member",
      nameBn: "গ্রাম সংসদ সদস্য",
      wardNumber: declarationData.wardNumber,
      sansadNo: `Ward-${declarationData.wardNumber}`,
      partNo: `Part ${20 + declarationData.wardNumber}`,
    };

    // Calculate version
    let nextVersion = "1.0";
    const history = existing.declarationHistory || [];
    if (existing.currentDeclaration) {
      history.push(existing.currentDeclaration);
      const currVerNum = parseFloat(existing.currentDeclaration.version) || 1.0;
      nextVersion = (currVerNum + 0.1).toFixed(1);
    }

    const payload = `${caseId}|${rep.wardNumber}|${existing.applicant.fullName}|${existing.existingCertificateHolder.certificateNumber}|${Date.now()}`;
    const hash = await computeDeclarationHash(payload);
    const verificationHash = `B2GP/SCS-LIN/${new Date().getFullYear()}/${caseId.slice(-5)}/V${nextVersion.replace(".", "")}`;

    const newDeclaration: MemberDeclarationRecord = {
      declarationId: `DECL-${Date.now()}-${rep.wardNumber}`,
      version: nextVersion,
      timestamp: new Date().toISOString(),
      memberId: `MEM-WARD-${rep.wardNumber}`,
      memberName: rep.name,
      memberNameBn: rep.nameBn,
      wardNumber: rep.wardNumber,
      sansadNoRoman: rep.sansadNo,
      designation: "Elected Gram Sansad Member, Bagula II Gram Panchayat",
      boothPartNos: rep.partNo,
      declarationTextEn:
        "I have examined the submitted lineage information and supporting records and declare that the above paternal relationship information is based on the records/evidence placed before me.",
      declarationTextBn:
        "আমি দাখিলকৃত বংশতালিকা ও সহযোগী নথিপত্র পরীক্ষা ও স্থানীয়ভাবে অনুসন্ধানপূর্বক ঘোষণা করিতেছি যে, উপরোক্ত পৈতৃক রক্তের সম্পর্ক এবং বংশলতিকার তথ্য আমার নিকট উপস্থাপিত প্রমাণ ও তথ্যাবলীর ভিত্তিতে সঠিক।",
      fieldInquiryConducted: declarationData.fieldInquiryConducted,
      inquiryDate: declarationData.inquiryDate || new Date().toISOString().split("T")[0],
      localWitnessNames: declarationData.localWitnessNames || [],
      memberObservations: declarationData.memberObservations,
      digitalSignatureHash: `DECL-SIG-${hash.slice(0, 16)}`,
      verificationHash: verificationHash,
      hasOfficialSeal: true,
      isImmutableLocked: true,
    };

    existing.currentDeclaration = newDeclaration;
    existing.declarationHistory = history;
    existing.status = "Member_Verified";
    existing.updatedAt = new Date().toISOString();
    existing.mergedPdfBundleReady = true;

    this.saveCaseDraft(existing);
    return existing;
  },

  // Public Verification (Strictly Sanitized: Zero PII leak)
  getPublicVerification(lookupId: string): {
    found: boolean;
    verificationId?: string;
    caseId?: string;
    documentTitleEn?: string;
    documentTitleBn?: string;
    status?: string;
    applicantNameMasked?: string;
    targetSubCaste?: string;
    gramSansadWard?: string;
    endorsingMemberName?: string;
    declarationDate?: string;
    version?: string;
    isImmutableLocked?: boolean;
    statutoryDisclaimerEn?: string;
    statutoryDisclaimerBn?: string;
  } {
    const target = this.getCaseById(lookupId);
    if (!target || !target.currentDeclaration) {
      return { found: false };
    }

    const nameParts = target.applicant.fullName.trim().split(" ");
    const masked = nameParts
      .map((p) => (p.length <= 2 ? p : `${p[0]}${"*".repeat(Math.min(p.length - 2, 4))}${p[p.length - 1]}`))
      .join(" ");

    return {
      found: true,
      verificationId: target.currentDeclaration.verificationHash,
      caseId: target.caseId,
      documentTitleEn: "Gram Sansad Paternal Lineage & Caste Relationship Declaration",
      documentTitleBn: "গ্রাম সংসদ পৈতৃক বংশতালিকা ও জাতিগত সম্পর্ক ঘোষণা / প্রত্যয়ন",
      status: "Authenticated & Sealed",
      applicantNameMasked: masked,
      targetSubCaste: target.applicant.targetSubCaste,
      gramSansadWard: `Ward No. ${target.applicant.gramSansadWardNo} (Sansad ${target.currentDeclaration.sansadNoRoman})`,
      endorsingMemberName: target.currentDeclaration.memberName,
      declarationDate: new Date(target.currentDeclaration.timestamp).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      version: target.currentDeclaration.version,
      isImmutableLocked: true,
      statutoryDisclaimerEn:
        "IMPORTANT LEGAL NOTICE: This verification confirms that an authentic local Gram Sansad Paternal Vamshabriksha & Relationship Declaration exists in the records of Bagula II Gram Panchayat, Nadia. This document serves as supporting genealogical evidence for online application. Final decision and issuance of the statutory Scheduled Caste / Scheduled Tribe Certificate rests exclusively with the Competent Authority (SDO / BDO / DWO) under the West Bengal SC/ST (Identification) Act, 1994.",
      statutoryDisclaimerBn:
        "আইনি সতর্কবার্তা: এই অনলাইন যাচাই নিশ্চিত করে যে বগুলা ২ নং গ্রাম পঞ্চায়েতের সংশ্লিষ্ট গ্রাম সংসদের পৈতৃক বংশতালিকা ও সম্পর্ক প্রত্যয়ন নথিটি সঠিক। এটি সরকারি কাস্ট সার্টিফিকেট আবেদনের সহায়ক বংশলতিকা প্রমাণ হিসেবে গণ্য। মূল সংবিধিবদ্ধ তফশিলি জাতি বা উপজাতি শংসাপত্র প্রদানের চূড়ান্ত সিদ্ধান্ত ও এখতিয়ার পশ্চিমবঙ্গ তফশিলি জাতি ও উপজাতি (শনাক্তকরণ) আইন ১৯৯৪ অনুযায়ী কেবলমাত্র উপযুক্ত মহকুমা শাসক (SDO) বা বিডিও-এর এক্তিয়ারভুক্ত।",
    };
  },
};
