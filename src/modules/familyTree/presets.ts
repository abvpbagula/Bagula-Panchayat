import { FamilyTreeLanguage } from "./types";

export interface RelationPreset {
  key: string;
  bn: string;
  en: string;
}

export const FAMILY_RELATION_PRESETS: RelationPreset[] = [
  { key: "head", bn: "পরিবারের প্রধান", en: "Head of Family" },
  { key: "eldest_son", bn: "বড় ছেলে", en: "Eldest Son" },
  { key: "second_son", bn: "মেজো ছেলে", en: "Second Son" },
  { key: "third_son", bn: "সেজো ছেলে", en: "Third Son" },
  { key: "youngest_son", bn: "ছোট ছেলে", en: "Youngest Son" },
  { key: "son", bn: "ছেলে", en: "Son" },
  { key: "daughter", bn: "কন্যা", en: "Daughter" },
  { key: "grandson", bn: "নাতি", en: "Grandson" },
  { key: "granddaughter", bn: "নাতনি", en: "Granddaughter" },
  { key: "wife", bn: "স্ত্রী", en: "Wife" },
  { key: "husband", bn: "স্বামী", en: "Husband" },
  { key: "brother", bn: "ভাই", en: "Brother" },
];

export const CHILD_ADD_PRESETS: RelationPreset[] = FAMILY_RELATION_PRESETS.filter(
  (preset) => preset.key !== "head"
);

export function getPresetLabel(preset: RelationPreset, language: FamilyTreeLanguage): string {
  return language === "bn" ? preset.bn : preset.en;
}

export function translateKnownRelationLabel(
  currentLabel: string,
  targetLanguage: FamilyTreeLanguage
): string {
  const trimmed = currentLabel.trim();
  const matched = FAMILY_RELATION_PRESETS.find(
    (p) => p.bn === trimmed || p.en.toLowerCase() === trimmed.toLowerCase()
  );
  if (!matched) return currentLabel;
  return getPresetLabel(matched, targetLanguage);
}

export const FAMILY_TREE_PRINT_COPY: Record<
  FamilyTreeLanguage,
  {
    govHeader: string;
    gpName: string;
    gpAddress: string;
    certTitle: string;
    certSubtitle: string;
    memoLabel: string;
    dateLabel: string;
    applicantLabel: string;
    headLabel: string;
    headVoterLabel: string;
    sansadLabel: string;
    spousePrefix: string;
    voterPrefix: string;
    declarationText: string;
    signatoryLeft: string;
    signatoryRight: string;
    officeSubtext: string;
    totalMembersLabel: string;
    generationsLabel: string;
  }
> = {
  bn: {
    govHeader: "পশ্চিমবঙ্গ সরকার · নদিয়া জেলা · হাঁসখালী ব্লক",
    gpName: "বগুলা ২ নং গ্রাম পঞ্চায়েত কার্যালয়",
    gpAddress: "ডাকঘর: বগুলা, থানা: হাঁসখালী, জেলা: নদিয়া, পিন: ৭৪১৫০২",
    certTitle: "বংশতালিকা / বংশলতিকা",
    certSubtitle: "পারিবারিক বংশানুক্রমিক সম্পর্ক ও ভোটার পরিচয়পত্র ভিত্তিক প্রত্যয়ন",
    memoLabel: "স্মারক নং",
    dateLabel: "তারিখ",
    applicantLabel: "আবেদনকারীর নাম",
    headLabel: "পরিবারের প্রধান",
    headVoterLabel: "ভোটার কার্ড নং",
    sansadLabel: "সংসদ / ওয়ার্ড নং",
    spousePrefix: "স্ত্রী/স্বামী",
    voterPrefix: "ভোটার",
    declarationText:
      "উপস্থাপিত নথিপত্র, ভোটার তালিকা ও স্থানীয় তথ্যের ভিত্তিতে উপরোক্ত পারিবারিক বংশতালিকাটি (বংশলতিকা) বগুলা ২ নং গ্রাম পঞ্চায়েতের নথিতে লিপিবদ্ধ ও প্রত্যয়িত করা হইল।",
    signatoryLeft: "তথ্য যাচাইকারী / গ্রাম সংসদ সদস্য",
    signatoryRight: "প্রধান / কার্যনির্বাহী সহায়ক",
    officeSubtext: "বগুলা ২ নং গ্রাম পঞ্চায়েত, হাঁসখালী, নদিয়া",
    totalMembersLabel: "মোট সদস্য",
    generationsLabel: "প্রজন্ম স্তর",
  },
  en: {
    govHeader: "Government of West Bengal · Nadia District · Hanskhali Block",
    gpName: "Office of the Bagula II Gram Panchayat",
    gpAddress: "P.O. Bagula, P.S. Hanskhali, Dist: Nadia, West Bengal, PIN: 741502",
    certTitle: "Certified Family Tree (Vamshabriksha)",
    certSubtitle: "Genealogical Lineage & Electoral Record Attestation",
    memoLabel: "Memo No.",
    dateLabel: "Date",
    applicantLabel: "Applicant Name",
    headLabel: "Head of Family",
    headVoterLabel: "Head Voter ID",
    sansadLabel: "Sansad / Ward No.",
    spousePrefix: "Spouse",
    voterPrefix: "EPIC",
    declarationText:
      "Based on the supporting records, electoral roll entries, and local verification placed before this office, the above genealogical family tree is hereby certified for administrative record purposes.",
    signatoryLeft: "Verifying Officer / Gram Sansad Member",
    signatoryRight: "Prodhan / Executive Assistant",
    officeSubtext: "Bagula II Gram Panchayat, Hanskhali, Nadia",
    totalMembersLabel: "Total Members",
    generationsLabel: "Generations",
  },
};
