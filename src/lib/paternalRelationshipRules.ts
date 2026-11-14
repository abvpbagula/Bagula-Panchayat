/**
 * PATERNAL RELATIONSHIP RULE ENGINE & MASTER DATA
 * West Bengal Scheduled Castes and Scheduled Tribes (Identification) Act, 1994
 * Directorate of Backward Classes Welfare / castecertificatewb.gov.in
 * 
 * Configurable master data defining admissibility of blood relationships for paternal linkage.
 */

import { PaternalRelationshipRule } from "@/types/scStLineageTypes";

export const PATERNAL_RELATIONSHIP_RULES: PaternalRelationshipRule[] = [
  // --- DIRECT PATERNAL ASCENDANTS (PRIMARY LINEAGE) ---
  {
    code: "FATHER",
    labelEn: "Father (পিতা)",
    labelBn: "পিতা",
    category: "paternal",
    status: "eligible",
    generationalOffset: 1,
    defaultGender: "Male",
    ruleExplanationEn: "Direct 1st-degree paternal biological parent. Prime direct legal source of paternal caste transmission under WB SC/ST Identification Act 1994.",
    ruleExplanationBn: "প্রথম প্রজন্মের প্রত্যক্ষ পৈতৃক পিতা। পশ্চিমবঙ্গ তফশিলি জাতি ও উপজাতি (শনাক্তকরণ) আইন ১৯৯৪ অনুযায়ী পৈতৃক জাতি নির্ণয়ের মূল আইনগত ভিত্তি।",
    statutoryReference: "Section 5, WB SC/ST (Identification) Act, 1994",
  },
  {
    code: "PAT_GRANDFATHER",
    labelEn: "Paternal Grandfather (পিতামহ / ঠাকুরদা)",
    labelBn: "পিতামহ (ঠাকুরদা)",
    category: "paternal",
    status: "eligible",
    generationalOffset: 2,
    defaultGender: "Male",
    ruleExplanationEn: "Direct 2nd-degree paternal ancestor (Father's Father). Admissible with linkage via Applicant's Father in family tree.",
    ruleExplanationBn: "দ্বিতীয় প্রজন্মের প্রত্যক্ষ পৈতৃক পূর্বপুরুষ (পিতার পিতা)। বংশলতিকায় আবেদনকারীর পিতার মাধ্যমে সংযোগ সাপেক্ষে গ্রহণযোগ্য।",
    statutoryReference: "Rule 3, WB SC/ST (Identification) Rules, 1995",
  },
  {
    code: "PAT_GREAT_GRANDFATHER",
    labelEn: "Paternal Great-Grandfather (প্রপিতামহ)",
    labelBn: "প্রপিতামহ",
    category: "paternal",
    status: "eligible",
    generationalOffset: 3,
    defaultGender: "Male",
    ruleExplanationEn: "Direct 3rd-degree paternal ancestor (Paternal Grandfather's Father). Admissible with continuous genealogical chain in Vamshabriksha.",
    ruleExplanationBn: "তৃতীয় প্রজন্মের প্রত্যক্ষ পৈতৃক পূর্বপুরুষ (ঠাকুরদার পিতা)। বংশতালিকায় ধারাবাহিক পূর্বপুরুষ সংযোগ সাপেক্ষে গ্রহণযোগ্য।",
    statutoryReference: "BCWD Circular No. 248-BCW/MR-38/2006",
  },
  {
    code: "PAT_GREAT_GREAT_GRANDFATHER",
    labelEn: "Paternal Great-Great-Grandfather (বৃদ্ধ প্রপিতামহ)",
    labelBn: "বৃদ্ধ প্রপিতামহ",
    category: "paternal",
    status: "eligible",
    generationalOffset: 4,
    defaultGender: "Male",
    ruleExplanationEn: "Direct 4th-degree paternal root ancestor. Used when old CS/RS Khatians or Pre-1971 records stem from original land-holder.",
    ruleExplanationBn: "চতুর্থ প্রজন্মের পৈতৃক মূল পূর্বপুরুষ। সিএস/আরএস খতিয়ান বা ১৯৭১ পূর্ববর্তী প্রাচীন নথির মাধ্যমে প্রমাণ সাপেক্ষে গ্রহণযোগ্য।",
    statutoryReference: "Land & Land Reforms Dept. Co-linkage Guidelines",
  },

  // --- COLLATERAL PATERNAL RELATIVES ---
  {
    code: "PAT_UNCLE_ELDER",
    labelEn: "Paternal Elder Uncle (জ্যাঠামশাই / জ্যাঠা)",
    labelBn: "জ্যাঠামশাই (পিতার অগ্রজ ভ্রাতা)",
    category: "paternal",
    status: "eligible",
    generationalOffset: 1,
    defaultGender: "Male",
    ruleExplanationEn: "Biological brother of Applicant's Father (Elder). Shares common Paternal Grandfather. Fully admissible if paternal lineage is authenticated.",
    ruleExplanationBn: "আবেদনকারীর পিতার সহোদর অগ্রজ ভ্রাতা (একই পিতামহের সন্তান)। পৈতৃক বংশলতিকা প্রতিপন্ন হলে আইনত গ্রাহ্য।",
    statutoryReference: "BCWD Standard Guidelines for Caste Certificate Verification",
  },
  {
    code: "PAT_UNCLE_YOUNGER",
    labelEn: "Paternal Younger Uncle (কাকামশাই / খুড়ো)",
    labelBn: "কাকামশাই (পিতার অনুজ ভ্রাতা)",
    category: "paternal",
    status: "eligible",
    generationalOffset: 1,
    defaultGender: "Male",
    ruleExplanationEn: "Biological brother of Applicant's Father (Younger). Shares common Paternal Grandfather. Admissible through common ancestor node in Vamshabriksha.",
    ruleExplanationBn: "আবেদনকারীর পিতার সহোদর কনিষ্ঠ ভ্রাতা (একই পিতামহের সন্তান)। সাধারণ পূর্বপুরুষের বংশলতিকা দ্বারা গ্রাহ্য।",
    statutoryReference: "BCWD Standard Guidelines for Caste Certificate Verification",
  },
  {
    code: "BROTHER_FULL",
    labelEn: "Full Brother (সহোদর ভাই / দাদা)",
    labelBn: "সহোদর ভাই / দাদা",
    category: "paternal",
    status: "eligible",
    generationalOffset: 0,
    defaultGender: "Male",
    ruleExplanationEn: "Applicant's biological full brother having the same biological father. Direct horizontal collateral linkage.",
    ruleExplanationBn: "একই পিতার সন্তান (সহোদর ভাই)। অনুভূমিক পৈতৃক রক্তের সম্পর্ক হিসেবে সরাসরি প্রযোজ্য।",
    statutoryReference: "castecertificatewb.gov.in FAQ Section 2(c)",
  },
  {
    code: "PAT_COUSIN_MALE",
    labelEn: "Paternal First Cousin (জ্যাঠতুতো / খুড়তুতো ভাই)",
    labelBn: "পৈতৃক খুড়তুতো / জ্যাঠতুতো ভাই",
    category: "paternal",
    status: "eligible",
    generationalOffset: 0,
    defaultGender: "Male",
    ruleExplanationEn: "Son of Applicant's biological Paternal Uncle. Admissible when both trace blood lineage to the same common Paternal Grandfather in the family tree.",
    ruleExplanationBn: "কাকা বা জ্যাঠার পুত্র। বংশতালিকায় উভয়ের মূল সাধারণ পূর্বপুরুষ (পিতামহ) একই ব্যক্তি হলে প্রমাণ হিসেবে গণ্য।",
    statutoryReference: "Hon'ble High Court at Calcutta WP No. 1284/2012 ruling on agnatic lineage",
  },

  // --- MATERNAL RELATIVES (INELIGIBLE UNDER PATERNAL PATHWAY) ---
  {
    code: "MOTHER",
    labelEn: "Mother (মাতা)",
    labelBn: "মাতা",
    category: "maternal",
    status: "ineligible_maternal",
    generationalOffset: 1,
    defaultGender: "Female",
    ruleExplanationEn: "Under Section 5 of the West Bengal SC/ST (Identification) Act 1994, caste status is strictly derived from the biological father's lineage (agnatic/paternal). Mother's caste certificate cannot be used for paternal linkage.",
    ruleExplanationBn: "পশ্চিমবঙ্গ তফশিলি জাতি ও উপজাতি (শনাক্তকরণ) আইন ১৯৯৪-এর ধারা ৫ অনুযায়ী জাতিগত পরিচয় কঠোরভাবে পিতার পৈতৃক বংশানুক্রমে নির্ধারিত হয়। মাতার কাস্ট সার্টিফিকেট পৈতৃক লিঙ্কেজের প্রমাণ হিসেবে গ্রাহ্য নয়।",
    statutoryReference: "Section 5, WB SC/ST (Identification) Act, 1994",
  },
  {
    code: "MAT_GRANDFATHER",
    labelEn: "Maternal Grandfather (মাতামহ / দাদু)",
    labelBn: "মাতামহ (দাদু)",
    category: "maternal",
    status: "ineligible_maternal",
    generationalOffset: 2,
    defaultGender: "Male",
    ruleExplanationEn: "Mother's father belongs to the maternal uterine line. Not admissible under West Bengal paternal caste verification criteria.",
    ruleExplanationBn: "মাতার পিতা মাতুল বংশের অংশ। পশ্চিমবঙ্গ পৈতৃক জাতিগত সংযোগের আইনি বিধানে এটি গ্রহণযোগ্য নয়।",
    statutoryReference: "BCWD Circular 2011/C-9",
  },
  {
    code: "MAT_UNCLE",
    labelEn: "Maternal Uncle (মামামশাই / মামা)",
    labelBn: "মামামশাই (মামা)",
    category: "maternal",
    status: "ineligible_maternal",
    generationalOffset: 1,
    defaultGender: "Male",
    ruleExplanationEn: "Mother's brother is on the maternal side and does not establish paternal bloodline under state guidelines.",
    ruleExplanationBn: "মাতার সহোদর ভ্রাতা মাতৃকূলের আত্মীয়, যা পৈতৃক বংশলতিকার আইনি সীমার বাইরে।",
    statutoryReference: "castecertificatewb.gov.in Verification Manual",
  },

  // --- AFFINAL / IN-LAW RELATIVES (INELIGIBLE BY MARRIAGE) ---
  {
    code: "HUSBAND",
    labelEn: "Husband (স্বামী)",
    labelBn: "স্বামী",
    category: "affinal",
    status: "ineligible_affinal",
    generationalOffset: 0,
    defaultGender: "Male",
    ruleExplanationEn: "Supreme Court of India has held that caste is determined by birth and cannot be acquired by marriage (Valsamma Paul vs Cochin University, AIR 1996 SC 1011). Husband's caste cannot be claimed by wife.",
    ruleExplanationBn: "ভারতের মহামান্য সুপ্রিম কোর্টের সাংবিধানিক বেঞ্চের রায় অনুযায়ী জাতি জন্মসূত্রে নির্ধারিত হয় এবং বিবাহের মাধ্যমে জাতি পরিবর্তন বা গ্রহণ করা যায় না। স্বামীর জাতি স্ত্রীর প্রাপ্য নয়।",
    statutoryReference: "Supreme Court of India (AIR 1996 SC 1011)",
  },
  {
    code: "FATHER_IN_LAW",
    labelEn: "Father-in-law (শ্বশুরমশাই)",
    labelBn: "শ্বশুরমশাই",
    category: "affinal",
    status: "ineligible_affinal",
    generationalOffset: 1,
    defaultGender: "Male",
    ruleExplanationEn: "Affinal relationship acquired by marriage. Inadmissible for SC/ST paternal bloodline certificate.",
    ruleExplanationBn: "বৈবাহিক আত্মীয়তা। পৈতৃক রক্তের সম্পর্কের তফশিলি জাতি সনদের জন্য সম্পূর্ণ অগ্রাহ্য।",
    statutoryReference: "Supreme Court of India (AIR 1996 SC 1011)",
  },
];

/**
 * Validates a relationship against current configured master rules
 */
export function evaluatePaternalRelationship(relationshipCodeOrLabel: string): {
  isEligible: boolean;
  rule: PaternalRelationshipRule;
  warningCode?: "MATERNAL_INELIGIBLE" | "AFFINAL_INELIGIBLE" | "UNKNOWN";
  alertTitleEn: string;
  alertTitleBn: string;
  alertMessageEn: string;
  alertMessageBn: string;
} {
  const norm = relationshipCodeOrLabel.toUpperCase().trim();
  
  const matched = PATERNAL_RELATIONSHIP_RULES.find(
    (r) =>
      r.code.toUpperCase() === norm ||
      r.labelEn.toUpperCase().includes(norm) ||
      r.labelBn.toUpperCase().includes(norm)
  ) || PATERNAL_RELATIONSHIP_RULES[0]; // fallback to FATHER

  if (matched.status === "eligible") {
    return {
      isEligible: true,
      rule: matched,
      alertTitleEn: "Eligible Paternal Lineage Link",
      alertTitleBn: "বৈধ পৈতৃক রক্তের সম্পর্ক",
      alertMessageEn: matched.ruleExplanationEn,
      alertMessageBn: matched.ruleExplanationBn,
    };
  }

  if (matched.status === "ineligible_maternal") {
    return {
      isEligible: false,
      rule: matched,
      warningCode: "MATERNAL_INELIGIBLE",
      alertTitleEn: "Not Eligible for Paternal-Linkage Pathway (মাতৃকূলের সম্পর্ক পৈতৃক সনদে প্রযোজ্য নয়)",
      alertTitleBn: "মাতৃকূলের সম্পর্ক পৈতৃক জাতিগত সংযোগে আইনত গ্রহণযোগ্য নয়",
      alertMessageEn: `${matched.ruleExplanationEn} Note: This data will be retained for case observation, but the state SC/ST authority requires a paternal certificate holder.`,
      alertMessageBn: `${matched.ruleExplanationBn} (তথ্যটি সংরক্ষণে থাকবে, তবে সরকারি নিয়মে পিতার বংশের সার্টিফিকেটধারী প্রয়োজন)।`,
    };
  }

  // Affinal (by marriage)
  return {
    isEligible: false,
    rule: matched,
    warningCode: "AFFINAL_INELIGIBLE",
    alertTitleEn: "Inadmissible: Caste Cannot be Acquired by Marriage (বিবাহসূত্রে জাতি প্রাপ্তি অগ্রহণযোগ্য)",
    alertTitleBn: "বিবাহের মাধ্যমে জাতি অর্জন আইনত বাতিল (সুপ্রিম কোর্টের নির্দেশিকা)",
    alertMessageEn: matched.ruleExplanationEn,
    alertMessageBn: matched.ruleExplanationBn,
  };
}

/**
 * Filter list of relationships for dropdown selection
 */
export function getEligiblePaternalOptions() {
  return PATERNAL_RELATIONSHIP_RULES.filter((r) => r.status === "eligible");
}

export function getAllRelationshipOptions() {
  return PATERNAL_RELATIONSHIP_RULES;
}
