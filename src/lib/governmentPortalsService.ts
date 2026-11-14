export interface GovernmentPortal {
  id: string;
  name: string;
  nameBn: string;
  url: string;
  category: "state" | "central" | "land_revenue" | "identity" | "welfare";
  categoryLabel: string;
  categoryLabelBn: string;
  desc: string;
  descBn: string;
  tag: string;
  icon: string;
  department: string;
  verified: boolean;
}

export const OFFICIAL_GOVERNMENT_DIRECTORY: GovernmentPortal[] = [
  {
    id: "banglarbhumi",
    name: "Banglarbhumi (LR & LRR)",
    nameBn: "বাংলারভূমি (জমির খতিয়ান ও দাগের তথ্য)",
    url: "https://banglarbhumi.gov.in/BanglarBhumi/Home.action",
    category: "land_revenue",
    categoryLabel: "Land & Revenue",
    categoryLabelBn: "জমি ও রাজস্ব",
    desc: "Khatian & Plot info, Mutation Application, Mouza Map, Land Conversion.",
    descBn: "জমির রেকর্ড, মিউটেশন আবেদন, মৌজা ম্যাপ ও দাগের তথ্য যাচাই।",
    tag: "Land Records",
    icon: "🗺️",
    department: "Land and Land Reforms Department, WB",
    verified: true,
  },
  {
    id: "swasthya-sathi",
    name: "Swasthya Sathi Portal",
    nameBn: "স্বাস্থ্য সাথী পোর্টাল",
    url: "https://swasthyasathi.gov.in/",
    category: "welfare",
    categoryLabel: "Welfare & Health",
    categoryLabelBn: "স্বাস্থ্য ও কল্যাণ",
    desc: "Check eligibility, card registration, family members, hospital network.",
    descBn: "কার্ডে পরিবারের সদস্যের নাম ও হাসপাতাল তালিকা যাচাই।",
    tag: "Health Assurance",
    icon: "🏥",
    department: "Health & Family Welfare Department, WB",
    verified: true,
  },
  {
    id: "janma-mrityu",
    name: "Janma-Mrityu Tathya (CRS)",
    nameBn: "জন্ম-মৃত্যু তথ্য (ওয়েস্ট বেঙ্গল সিভিল রেজিস্ট্রেশন)",
    url: "https://janma-mrityutathya.wb.gov.in/",
    category: "state",
    categoryLabel: "Citizen Certificates",
    categoryLabelBn: "নাগরিক শংসাপত্র",
    desc: "Official birth & death registration, delayed orders, digital certificate download.",
    descBn: "অনলাইন জন্ম ও মৃত্যু নিবন্ধন এবং শংসাপত্র ডাউনলোড।",
    tag: "Birth & Death",
    icon: "👶",
    department: "Directorate of Health Services, WB",
    verified: true,
  },
  {
    id: "krishak-bandhu",
    name: "Krishak Bandhu Portal",
    nameBn: "কৃষক বন্ধু পোর্টাল",
    url: "https://krishakbandhu.wb.gov.in/",
    category: "welfare",
    categoryLabel: "Welfare & Health",
    categoryLabelBn: "স্বাস্থ্য ও কল্যাণ",
    desc: "Direct financial assistance to farmers, death benefit claim, scheme search via Voter ID.",
    descBn: "কৃষক আর্থিক সহায়তা ও ভোটার আইডি দিয়ে স্থিতি যাচাই।",
    tag: "Farmer Welfare",
    icon: "🌾",
    department: "Department of Agriculture, WB",
    verified: true,
  },
  {
    id: "ration-food",
    name: "WB Food & Supplies Department",
    nameBn: "খাদ্য ও সরবরাহ দপ্তর (ডিজিটাল রেশন কার্ড)",
    url: "https://food.wb.gov.in/",
    category: "state",
    categoryLabel: "Citizen Certificates",
    categoryLabelBn: "নাগরিক শংসাপত্র",
    desc: "Ration card e-KYC, Link Aadhaar with Ration Card, Check Status, NFSA Quota.",
    descBn: "রেশন কার্ড স্ট্যাটাস, আধার লিংক ও ই-রেশন কার্ড ডাউনলোড।",
    tag: "Digital Ration",
    icon: "🍚",
    department: "Food and Supplies Department, WB",
    verified: true,
  },
  {
    id: "uidai-aadhaar",
    name: "UIDAI MyAadhaar Portal",
    nameBn: "ইউআইডিএআই মাই আধার পোর্টাল",
    url: "https://myaadhaar.uidai.gov.in/",
    category: "identity",
    categoryLabel: "Identity & National ID",
    categoryLabelBn: "জাতীয় পরিচয়পত্র",
    desc: "Download e-Aadhaar, Document Update, Check Bank Seeding, Verify Status.",
    descBn: "ই-আধার ডাউনলোড, তথ্য আপডেট ও স্থিতি যাচাই।",
    tag: "National ID",
    icon: "🪪",
    department: "Unique Identification Authority of India (UIDAI)",
    verified: true,
  },
  {
    id: "voter-services",
    name: "Voter Services Portal (ECI)",
    nameBn: "ভোটার সার্ভিস পোর্টাল (নির্বাচন কমিশন)",
    url: "https://voters.eci.gov.in/",
    category: "identity",
    categoryLabel: "Identity & National ID",
    categoryLabelBn: "জাতীয় পরিচয়পত্র",
    desc: "Form 6 (New Voter), Form 8 (Correction), Download e-EPIC, Track Application.",
    descBn: "নতুন ভোটার আবেদন, নাম সংশোধন ও ডিজিটাল ভোটার কার্ড।",
    tag: "Election Commission",
    icon: "🗳️",
    department: "Election Commission of India",
    verified: true,
  },
  {
    id: "incometax-pan",
    name: "Income Tax e-Filing & Instant e-PAN",
    nameBn: "ইনকাম ট্যাক্স পোর্টাল ও ইনস্ট্যান্ট ই-প্যান",
    url: "https://www.incometax.gov.in/iec/foportal/",
    category: "identity",
    categoryLabel: "Identity & National ID",
    categoryLabelBn: "জাতীয় পরিচয়পত্র",
    desc: "Instant PAN via Aadhaar, Link PAN-Aadhaar, Verify PAN, ITR filing.",
    descBn: "ইনস্ট্যান্ট প্যান কার্ড তৈরি ও আধার লিংক যাচাই।",
    tag: "Income Tax",
    icon: "💳",
    department: "Central Board of Direct Taxes, Govt of India",
    verified: true,
  },
  {
    id: "oasis-scholarship",
    name: "OASIS Scholarship Portal",
    nameBn: "ওয়েসিস স্কলারশিপ (SC/ST/OBC)",
    url: "https://oasis.gov.in/",
    category: "welfare",
    categoryLabel: "Welfare & Health",
    categoryLabelBn: "স্বাস্থ্য ও কল্যাণ",
    desc: "Pre-matric & Post-matric scholarships for SC, ST, and OBC students in West Bengal.",
    descBn: "তফসিলি জাতি ও উপজাতি শিক্ষার্থীদের শিক্ষাবৃত্তি পোর্টাল।",
    tag: "Scholarship",
    icon: "🎓",
    department: "Backward Classes Welfare Department, WB",
    verified: true,
  },
  {
    id: "edistrict-wb",
    name: "e-District West Bengal",
    nameBn: "ই-ডিস্ট্রিক্ট পশ্চিমবঙ্গ পোর্টাল",
    url: "https://edistrict.wb.gov.in/",
    category: "state",
    categoryLabel: "Citizen Certificates",
    categoryLabelBn: "নাগরিক শংসাপত্র",
    desc: "Domicile certificate, Income certificate, SC/ST/OBC certificate, Legal Heir verification.",
    descBn: "বাসিন্দা, আয় ও জাতিগত শংসাপত্রের সরকারি আবেদন।",
    tag: "District Services",
    icon: "📜",
    department: "Department of Personnel & Administrative Reforms, WB",
    verified: true,
  },
  {
    id: "parivahan",
    name: "Parivahan Sewa (Sarathi / Vahan)",
    nameBn: "পরিবহন সেবা (ড্রাইভিং লাইসেন্স ও গাড়ি রেজিস্ট্রেশন)",
    url: "https://parivahan.gov.in/parivahan/",
    category: "central",
    categoryLabel: "Transport & Central",
    categoryLabelBn: "পরিবহন ও কেন্দ্র",
    desc: "Learner's License, Driving License Renewal, Vehicle RC Status, Road Tax.",
    descBn: "ড্রাইভিং লাইসেন্স আবেদন ও গাড়ির ব্লু বুক/আরসি স্থিতি।",
    tag: "Transport",
    icon: "🚗",
    department: "Ministry of Road Transport and Highways, Govt of India",
    verified: true,
  },
  {
    id: "digilocker",
    name: "DigiLocker India",
    nameBn: "ডিজিলকার ইন্ডিয়া (ডিজিটাল নথি)",
    url: "https://www.digilocker.gov.in/",
    category: "central",
    categoryLabel: "Transport & Central",
    categoryLabelBn: "পরিবহন ও কেন্দ্র",
    desc: "Legally valid digital repository for Aadhaar, Marksheets, Driving License, Ration card.",
    descBn: "ভারত সরকারের সমস্ত শংসাপত্রের অফিসিয়াল ডিজিটাল ক্লাউড।",
    tag: "Digital Locker",
    icon: "🔐",
    department: "Ministry of Electronics and Information Technology (MeitY)",
    verified: true,
  },
  {
    id: "prd-tax-portal",
    name: "WBPRD Rural Property Tax",
    nameBn: "পশ্চিমবঙ্গ পঞ্চায়েত কর পোর্টাল (PRD Tax)",
    url: "https://prdtax.wb.gov.in/",
    category: "land_revenue",
    categoryLabel: "Land & Revenue",
    categoryLabelBn: "জমি ও রাজস্ব",
    desc: "Pay household panchayat property tax online, verify assessment and download receipt.",
    descBn: "গ্রাম পঞ্চায়েত গৃহকর ও কর রশিদ অনুসন্ধান।",
    tag: "Panchayat Tax",
    icon: "🏠",
    department: "Panchayat & Rural Development Department, WB",
    verified: true,
  },
  {
    id: "pm-kisan",
    name: "PM-Kisan Samman Nidhi",
    nameBn: "প্রধানমন্ত্রী কিষাণ সম্মান নিধি",
    url: "https://pmkisan.gov.in/",
    category: "central",
    categoryLabel: "Transport & Central",
    categoryLabelBn: "পরিবহন ও কেন্দ্র",
    desc: "Check installment status, e-KYC OTP authentication, New Farmer registration.",
    descBn: "কিস্তির স্ট্যাটাস ও ওটিপি ই-কেওয়াইসি।",
    tag: "Farmer Benefit",
    icon: "🌱",
    department: "Ministry of Agriculture and Farmers Welfare, Govt of India",
    verified: true,
  },
];

export interface FetchGovernmentPortalsOptions {
  category?: string;
  searchQuery?: string;
  forceError?: boolean;
}

/**
 * Dynamically fetches government links with realistic simulated API latency,
 * complete with Loading, Success, Empty, and Error states.
 */
export async function fetchGovernmentPortalsDynamically(
  options: FetchGovernmentPortalsOptions = {}
): Promise<GovernmentPortal[]> {
  const { category = "all", searchQuery = "", forceError = false } = options;

  // Realistic network simulation: 350ms to 600ms
  await new Promise((resolve) => setTimeout(resolve, 400));

  if (forceError) {
    throw new Error("Unable to establish secure handshake with State Data Center. Please check your network and retry.");
  }

  const query = searchQuery.trim().toLowerCase();

  return OFFICIAL_GOVERNMENT_DIRECTORY.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    if (!matchesCategory) return false;

    if (!query) return true;

    return (
      item.name.toLowerCase().includes(query) ||
      item.nameBn.toLowerCase().includes(query) ||
      item.desc.toLowerCase().includes(query) ||
      item.tag.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query)
    );
  });
}
