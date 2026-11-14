import { supabase } from "@/integrations/supabase/client";
import { saveBusinessRule, loadBusinessRule } from "@/lib/businessRulesService";
import { logActivity } from "@/lib/activityLog";
import { type PartyTheme, applyPartyTheme, SETTINGS_CHANGE_EVENT } from "@/lib/appSettings";
import { validateRedirectDestination } from "@/lib/redirectSafety";

/* ------------------------------------------------------------------ */
/* 1. Appearance & Branding Configuration                             */
/* ------------------------------------------------------------------ */

export interface AppearanceBrandingConfig {
  gpNameEn: string;
  gpNameBn: string;
  hierarchyEn: string;
  hierarchyBn: string;
  portalTitle: string;
  portalSubtitle: string;
  partyTheme: PartyTheme;
  layoutDensity: "standard" | "compact" | "spacious";
  fontFamily: "sans" | "formal" | "system";
  footerBrandingText: string;
  emblemType: "ashoka" | "biswa_bangla" | "custom";
  emblemUrl?: string;
  showGovTricolor: boolean;
}

export const DEFAULT_APPEARANCE_BRANDING: AppearanceBrandingConfig = {
  gpNameEn: "Bagula 2 No. Gram Panchayat",
  gpNameBn: "বগুলা ২ নং গ্রাম পঞ্চায়েত",
  hierarchyEn: "Under Hanskhali Panchayat Samity, Nadia District, West Bengal",
  hierarchyBn: "হাঁসখালি পঞ্চায়েত সমিতি, নদীয়া জেলা, পশ্চিমবঙ্গ",
  portalTitle: "BAGULA II GRAM PANCHAYAT — CYBER CAFE & SERVICE PORTAL",
  portalSubtitle: "Government of West Bengal — Department of Panchayats & Rural Development",
  partyTheme: "default",
  layoutDensity: "standard",
  fontFamily: "sans",
  footerBrandingText: "Cyber Cafe & Digital Administrative Platform — Bagula 2 No Gram Panchayat. All rights reserved.",
  emblemType: "ashoka",
  showGovTricolor: true,
};

/* ------------------------------------------------------------------ */
/* 2. Public Website Configuration                                    */
/* ------------------------------------------------------------------ */

export interface PublicWebsiteConfig {
  heroTitleEn: string;
  heroTitleBn: string;
  heroSubtitleEn: string;
  heroSubtitleBn: string;
  ctaPrimaryLabelEn: string;
  ctaPrimaryLabelBn: string;
  ctaPrimaryPath: string;
  ctaSecondaryLabelEn: string;
  ctaSecondaryLabelBn: string;
  ctaSecondaryPath: string;
  showNoticeBoard: boolean;
  showVerificationCard: boolean;
  showServiceCards: boolean;
  showWorkflowGuide: boolean;
  showFaqSection: boolean;
  emergencyBannerActive: boolean;
  emergencyBannerTextEn: string;
  emergencyBannerTextBn: string;
  emergencySeverity: "info" | "warning" | "critical";
}

export const DEFAULT_PUBLIC_WEBSITE: PublicWebsiteConfig = {
  heroTitleEn: "Welcome to Bagula 2 No Gram Panchayat Cyber Cafe & Service Portal",
  heroTitleBn: "বগুলা ২ নং গ্রাম পঞ্চায়েতের সাইবার ক্যাফে ও পরিষেবা পোর্টালে স্বাগতম",
  heroSubtitleEn: "Transparent, accountable, and paperless public service delivery under Hanskhali Block, Nadia.",
  heroSubtitleBn: "স্বচ্ছ, প্রযুক্তিবান্ধব ও সহজলভ্য ডিজিটাল প্রশাসনিক সেবা ব্যবস্থা।",
  ctaPrimaryLabelEn: "Open Cyber Cafe Hub",
  ctaPrimaryLabelBn: "সাইবার ক্যাফে হাব খুলুন",
  ctaPrimaryPath: "/cyber-cafe",
  ctaSecondaryLabelEn: "Verify QR Certificate",
  ctaSecondaryLabelBn: "কিউআর সার্টিফিকেট যাচাই",
  ctaSecondaryPath: "/verify",
  showNoticeBoard: true,
  showVerificationCard: true,
  showServiceCards: true,
  showWorkflowGuide: true,
  showFaqSection: true,
  emergencyBannerActive: false,
  emergencyBannerTextEn: "Physical inquiry counters are open from 10:30 AM to 4:30 PM on official working days.",
  emergencyBannerTextBn: "কাজের দিনগুলিতে সকাল ১০:৩০ থেকে বিকাল ৪:৩০ পর্যন্ত নাগরিক অনুসন্ধান কাউন্টার খোলা থাকে।",
  emergencySeverity: "info",
};

/* ------------------------------------------------------------------ */
/* 3. Navigation & Links Configuration                                */
/* ------------------------------------------------------------------ */

export interface NavigationLinkItem {
  id: string;
  labelEn: string;
  labelBn: string;
  path: string;
  section: "header_main" | "header_services" | "footer_quick" | "footer_govt" | "footer_legal";
  isExternal: boolean;
  enabled: boolean;
  order: number;
}

export const DEFAULT_NAVIGATION_LINKS: NavigationLinkItem[] = [
  { id: "nav-home", labelEn: "Home", labelBn: "প্রধান পাতা", path: "/", section: "header_main", isExternal: false, enabled: true, order: 1 },
  { id: "nav-cyber", labelEn: "Cyber Cafe Hub", labelBn: "সাইবার ক্যাফে হাব", path: "/cyber-cafe", section: "header_main", isExternal: false, enabled: true, order: 2 },
  { id: "nav-verify", labelEn: "Verify Certificate", labelBn: "সার্টিফিকেট যাচাই", path: "/verify", section: "header_main", isExternal: false, enabled: true, order: 3 },
  { id: "nav-representatives", labelEn: "Elected Members", labelBn: "জনপ্রতিনিধিগণ", path: "/elected-representatives", section: "header_main", isExternal: false, enabled: true, order: 4 },
  { id: "nav-admin", labelEn: "Office Login", labelBn: "অফিসিয়াল লগইন", path: "/admin", section: "header_main", isExternal: false, enabled: true, order: 5 },

  // Services dropdown
  { id: "srv-warish", labelEn: "Warish Application Form", labelBn: "ওয়ারিশ আবেদন ফর্ম", path: "/warish-application-form", section: "header_services", isExternal: false, enabled: true, order: 1 },
  { id: "srv-dependent", labelEn: "Dependent Certificate", labelBn: "নির্ভরশীল শংসাপত্র", path: "/dependent-certificate", section: "header_services", isExternal: false, enabled: true, order: 2 },
  { id: "srv-birth-form", labelEn: "Birth Digitization Form", labelBn: "জন্ম ডিজিটালাইজেশন ফর্ম", path: "/birth-digitization-form", section: "header_services", isExternal: false, enabled: true, order: 3 },
  { id: "srv-wbpms", labelEn: "WBPMS Certificates Info", labelBn: "ডব্লিউবিপিএমএস তথ্য", path: "/wbpms-info", section: "header_services", isExternal: false, enabled: true, order: 4 },

  // Footer government portals
  { id: "ext-wbpms", labelEn: "WBPMS Portal", labelBn: "ডব্লিউবিপিএমএস পোর্টাল", path: "https://wbpms.gov.in", section: "footer_govt", isExternal: true, enabled: true, order: 1 },
  { id: "ext-crs", labelEn: "Janma-Mrityu Tathya (CRS)", labelBn: "জন্ম-মৃত্যু তথ্য (সিআরএস)", path: "https://janma-mrityutathya.wb.gov.in", section: "footer_govt", isExternal: true, enabled: true, order: 2 },
  { id: "ext-nadia", labelEn: "District Nadia Official", labelBn: "নদীয়া জেলা পোর্টাল", path: "https://nadia.nic.in", section: "footer_govt", isExternal: true, enabled: true, order: 3 },
  { id: "ext-egiye", labelEn: "Egiye Bangla", labelBn: "এগিয়ে বাংলা", path: "https://wb.gov.in", section: "footer_govt", isExternal: true, enabled: true, order: 4 },

  // Footer legal
  { id: "nav-faq", labelEn: "Cyber Cafe FAQs", labelBn: "প্রশ্নোত্তর", path: "/faq", section: "footer_quick", isExternal: false, enabled: true, order: 1 },
];

/* ------------------------------------------------------------------ */
/* 4. Services Catalog Configuration                                  */
/* ------------------------------------------------------------------ */

export interface ServiceCatalogItem {
  id: string; // "warish" | "dependent" | "linkage" | "birth_digitization"
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  status: "active" | "maintenance" | "disabled";
  citizenIntakeEnabled: boolean;
  deoIntakeEnabled: boolean;
  feeRupees: number;
  urgentFeeRupees: number;
  validityMonths: number; // 0 = lifetime
  icon: string;
  requiredDocuments: string[];
}

export const DEFAULT_SERVICES_CATALOG: ServiceCatalogItem[] = [
  {
    id: "warish",
    nameEn: "Warish (Legal Heir) Certificate",
    nameBn: "ওয়ারিশান শংসাপত্র (উত্তরাধিকারী)",
    descriptionEn: "Official certification of surviving legal heirs following the demise of an ancestor or landholder in Bagula 2 No Gram Panchayat jurisdiction.",
    descriptionBn: "বগুলা ২ নং গ্রাম পঞ্চায়েত এলাকার বাসিন্দাদের বৈধ উত্তরাধিকারী সনাক্তকরণ ও শংসাপত্র প্রদান।",
    status: "active",
    citizenIntakeEnabled: true,
    deoIntakeEnabled: true,
    feeRupees: 0,
    urgentFeeRupees: 100,
    validityMonths: 0, // Lifetime
    icon: "ScrollText",
    requiredDocuments: [
      "Death Certificate of the Deceased",
      "Aadhaar Card of Applicant & all Heirs",
      "Land Tax (Khajana) receipt or Residential proof",
      "Sansad Ward Member physical inquiry report",
    ],
  },
  {
    id: "dependent",
    nameEn: "Dependent Certificate",
    nameBn: "পারিবারিক নির্ভরশীল শংসাপত্র",
    descriptionEn: "Proof of financial and familial dependency for employment, pension, government schemes, and compassionate appointments.",
    descriptionBn: "চাকরি, পেনশন ও সরকারি প্রকল্পে পরিবারের নির্ভরশীলতা প্রমাণের অফিসিয়াল শংসাপত্র।",
    status: "active",
    citizenIntakeEnabled: true,
    deoIntakeEnabled: true,
    feeRupees: 0,
    urgentFeeRupees: 50,
    validityMonths: 6, // 6 months standard
    icon: "Users",
    requiredDocuments: [
      "Aadhaar Card of Principal & Dependents",
      "Income proof / BPL Card / Ration Card",
      "Local Ward Member recommendation certificate",
    ],
  },
  {
    id: "linkage",
    nameEn: "Family Linkage Certificate",
    nameBn: "পারিবারিক লিঙ্কেজ শংসাপত্র",
    descriptionEn: "Genealogical link confirmation connecting applicant to ancestral land records, electoral registers, and family trees.",
    descriptionBn: "বংশতালিকা ও পূর্বপুরুষের সাথে জমির রেকর্ড ও ভোটার তালিকার যোগসূত্র শংসাপত্র।",
    status: "active",
    citizenIntakeEnabled: true,
    deoIntakeEnabled: true,
    feeRupees: 0,
    urgentFeeRupees: 50,
    validityMonths: 0,
    icon: "FileSpreadsheet",
    requiredDocuments: [
      "Legacy Electoral Roll records (1971 / 1966 / 1951)",
      "Ancestral Land Records (ROR / Parcha)",
      "Aadhaar Cards of Applicant & Parents",
    ],
  },
  {
    id: "birth_digitization",
    nameEn: "Legacy Birth Record Digitization",
    nameBn: "পুরাতন জন্ম রেজিস্টার ডিজিটাইজেশন",
    descriptionEn: "Digital entry, counter verification, and computerization of legacy physical birth records issued prior to 2020.",
    descriptionBn: "২০২০ সালের পূর্ববর্তী হাতে লেখা পুরাতন জন্ম রেকর্ড যাচাই ও ডিজিটালাইজেশন।",
    status: "active",
    citizenIntakeEnabled: true,
    deoIntakeEnabled: true,
    feeRupees: 0,
    urgentFeeRupees: 0,
    validityMonths: 0,
    icon: "FileText",
    requiredDocuments: [
      "Original Physical Birth Certificate issued by Bagula 2 No Gram Panchayat",
      "Hospital Discharge Certificate or Doctor's memo",
      "Parents' Aadhaar & Voter ID Cards",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* 5. Feature Availability Flags                                      */
/* ------------------------------------------------------------------ */

export interface FeatureFlagsConfig {
  maintenanceMode?: boolean;
  citizenRegistration: boolean;
  citizenOnlineApply: boolean;
  deoApplicationEntry: boolean;
  documentUpload: boolean;
  qrVerification: boolean;
  birthDigitizationIntake: boolean;
  emergencyNoticeBanner: boolean;
  strictVillageEnforcement: boolean;
  auditLoggingEnforced: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlagsConfig = {
  maintenanceMode: false,
  citizenRegistration: true,
  citizenOnlineApply: true,
  deoApplicationEntry: true,
  documentUpload: true,
  qrVerification: true,
  birthDigitizationIntake: true,
  emergencyNoticeBanner: false,
  strictVillageEnforcement: false,
  auditLoggingEnforced: true,
};

/* ------------------------------------------------------------------ */
/* 6. Verification Presentation Settings                              */
/* ------------------------------------------------------------------ */

export interface VerificationSettingsConfig {
  showWatermarkQr: boolean;
  maskMobileInVerification: boolean; // Always masks: e.g. ******1234
  maskAadhaarInVerification: boolean; // Always masks: **** **** 1234
  enableDirectPdfDownload: boolean;
  requireCaptchaForVerification: boolean;
  memoPrefix: string;
  verificationDisclaimerEn: string;
  verificationDisclaimerBn: string;
}

export const DEFAULT_VERIFICATION_SETTINGS: VerificationSettingsConfig = {
  showWatermarkQr: true,
  maskMobileInVerification: true,
  maskAadhaarInVerification: true,
  enableDirectPdfDownload: true,
  requireCaptchaForVerification: false,
  memoPrefix: "/BGL-II/",
  verificationDisclaimerEn: "This is an official verification record generated directly from the Bagula 2 No Gram Panchayat administrative database. Tampering with or forging this record is punishable under the Indian Penal Code.",
  verificationDisclaimerBn: "এটি বগুলা ২ নং গ্রাম পঞ্চায়েতের অনুমোদিত ডাটাবেজ থেকে সরাসরি যাচাইকৃত রেকর্ড। এতে কোনো রূপ পরিবর্তন বা জালিয়াতি আইনত দণ্ডনীয় অপরাধ।",
};

/* ------------------------------------------------------------------ */
/* Storage Keys & Persistence Logic                                   */
/* ------------------------------------------------------------------ */

export const DB_KEY_APPEARANCE_BRANDING = "appearance_branding_config";
export const DB_KEY_PUBLIC_WEBSITE = "public_website_config";
export const DB_KEY_NAVIGATION_LINKS = "navigation_links_config";
export const DB_KEY_SERVICES_CATALOG = "services_catalog_config";
export const DB_KEY_FEATURE_FLAGS = "feature_flags_config";
export const DB_KEY_VERIFICATION_SETTINGS = "verification_settings_config";

const LOCAL_KEY_BRANDING = "bg2_cache_appearance_branding";
const LOCAL_KEY_WEBSITE = "bg2_cache_public_website";
const LOCAL_KEY_NAV = "bg2_cache_navigation_links";
const LOCAL_KEY_SERVICES = "bg2_cache_services_catalog";
const LOCAL_KEY_FEATURES = "bg2_cache_feature_flags";
const LOCAL_KEY_VERIFICATION = "bg2_cache_verification_settings";

/* Synchronous Cached Getters */

export function getCachedAppearanceBranding(): AppearanceBrandingConfig {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY_BRANDING) : null;
    if (raw) return { ...DEFAULT_APPEARANCE_BRANDING, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("Failed reading cached appearance branding:", err);
  }
  return DEFAULT_APPEARANCE_BRANDING;
}

export function getCachedPublicWebsite(): PublicWebsiteConfig {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY_WEBSITE) : null;
    if (raw) return { ...DEFAULT_PUBLIC_WEBSITE, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("Failed reading cached public website config:", err);
  }
  return DEFAULT_PUBLIC_WEBSITE;
}

export function getCachedNavigationLinks(): NavigationLinkItem[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY_NAV) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed reading cached navigation links:", err);
  }
  return DEFAULT_NAVIGATION_LINKS;
}

export function getCachedServicesCatalog(): ServiceCatalogItem[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY_SERVICES) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Failed reading cached services catalog:", err);
  }
  return DEFAULT_SERVICES_CATALOG;
}

export function getCachedFeatureFlags(): FeatureFlagsConfig {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY_FEATURES) : null;
    if (raw) return { ...DEFAULT_FEATURE_FLAGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("Failed reading cached feature flags:", err);
  }
  return DEFAULT_FEATURE_FLAGS;
}

export function getCachedVerificationSettings(): VerificationSettingsConfig {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(LOCAL_KEY_VERIFICATION) : null;
    if (raw) return { ...DEFAULT_VERIFICATION_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn("Failed reading cached verification settings:", err);
  }
  return DEFAULT_VERIFICATION_SETTINGS;
}

/* Database Loaders & Savers with Server-Side Validation & Audit */

export async function loadAppearanceBranding(): Promise<AppearanceBrandingConfig> {
  const data = await loadBusinessRule<AppearanceBrandingConfig>(
    DB_KEY_APPEARANCE_BRANDING,
    getCachedAppearanceBranding()
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY_BRANDING, JSON.stringify(data));
    applyPartyTheme(data.partyTheme);
  }
  return data;
}

export async function saveAppearanceBranding(
  config: AppearanceBrandingConfig,
  actorEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY_BRANDING, JSON.stringify(config));
      applyPartyTheme(config.partyTheme);
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { type: "appearance_branding", config } })
      );
    }

    const res = await saveBusinessRule(
      DB_KEY_APPEARANCE_BRANDING,
      config as unknown as Record<string, unknown>,
      "Official Gram Panchayat appearance, typography, party themes, and branding",
      actorEmail
    );

    if (!res.success) {
      return { success: false, error: res.error || "Failed to save appearance branding to database" };
    }

    await logActivity({
      action_type: "governance.appearance_update",
      target_table: "business_rules",
      target_id: DB_KEY_APPEARANCE_BRANDING,
      metadata: { actor: actorEmail, theme: config.partyTheme, gpNameEn: config.gpNameEn },
    }).catch(() => null);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist appearance branding" };
  }
}

export async function loadPublicWebsiteConfig(): Promise<PublicWebsiteConfig> {
  const data = await loadBusinessRule<PublicWebsiteConfig>(
    DB_KEY_PUBLIC_WEBSITE,
    getCachedPublicWebsite()
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY_WEBSITE, JSON.stringify(data));
  }
  return data;
}

export async function savePublicWebsiteConfig(
  config: PublicWebsiteConfig,
  actorEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY_WEBSITE, JSON.stringify(config));
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { type: "public_website", config } })
      );
    }

    const res = await saveBusinessRule(
      DB_KEY_PUBLIC_WEBSITE,
      config as unknown as Record<string, unknown>,
      "Public website hero, notices, cards, emergency banner and layout settings",
      actorEmail
    );

    if (!res.success) {
      return { success: false, error: res.error || "Failed to save public website config" };
    }

    await logActivity({
      action_type: "governance.public_website_update",
      target_table: "business_rules",
      target_id: DB_KEY_PUBLIC_WEBSITE,
      metadata: { actor: actorEmail, emergencyBannerActive: config.emergencyBannerActive },
    }).catch(() => null);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist public website config" };
  }
}

export async function loadNavigationLinksConfig(): Promise<NavigationLinkItem[]> {
  const wrapped = await loadBusinessRule<{ items: NavigationLinkItem[] }>(
    DB_KEY_NAVIGATION_LINKS,
    { items: getCachedNavigationLinks() }
  );
  const items = wrapped?.items || DEFAULT_NAVIGATION_LINKS;
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY_NAV, JSON.stringify(items));
  }
  return items;
}

export async function saveNavigationLinksConfig(
  items: NavigationLinkItem[],
  actorEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate each URL safety
    for (const item of items) {
      const val = validateRedirectDestination(item.path);
      if (!val.isSafe) {
        return { success: false, error: `Invalid navigation link (${item.labelEn}): ${val.errorMessage || "Unsafe URL format"}` };
      }
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY_NAV, JSON.stringify(items));
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { type: "navigation_links", items } })
      );
    }

    const res = await saveBusinessRule(
      DB_KEY_NAVIGATION_LINKS,
      { items } as unknown as Record<string, unknown>,
      "Header and footer navigation links catalog and external redirects",
      actorEmail
    );

    if (!res.success) {
      return { success: false, error: res.error || "Failed to save navigation links" };
    }

    await logActivity({
      action_type: "governance.navigation_links_update",
      target_table: "business_rules",
      target_id: DB_KEY_NAVIGATION_LINKS,
      metadata: { actor: actorEmail, totalLinks: items.length },
    }).catch(() => null);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist navigation links" };
  }
}

export async function loadServicesCatalogConfig(): Promise<ServiceCatalogItem[]> {
  const wrapped = await loadBusinessRule<{ services: ServiceCatalogItem[] }>(
    DB_KEY_SERVICES_CATALOG,
    { services: getCachedServicesCatalog() }
  );
  const services = wrapped?.services || DEFAULT_SERVICES_CATALOG;
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY_SERVICES, JSON.stringify(services));
  }
  return services;
}

export async function saveServicesCatalogConfig(
  services: ServiceCatalogItem[],
  actorEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY_SERVICES, JSON.stringify(services));
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { type: "services_catalog", services } })
      );
    }

    const res = await saveBusinessRule(
      DB_KEY_SERVICES_CATALOG,
      { services } as unknown as Record<string, unknown>,
      "Panchayat citizen services catalog: status, fees, intake availability, and document requirements",
      actorEmail
    );

    if (!res.success) {
      return { success: false, error: res.error || "Failed to save services catalog" };
    }

    await logActivity({
      action_type: "governance.services_catalog_update",
      target_table: "business_rules",
      target_id: DB_KEY_SERVICES_CATALOG,
      metadata: { actor: actorEmail, totalServices: services.length },
    }).catch(() => null);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist services catalog" };
  }
}

export async function loadFeatureFlagsConfig(): Promise<FeatureFlagsConfig> {
  const data = await loadBusinessRule<FeatureFlagsConfig>(
    DB_KEY_FEATURE_FLAGS,
    getCachedFeatureFlags()
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY_FEATURES, JSON.stringify(data));
  }
  return data;
}

export async function saveFeatureFlagsConfig(
  flags: FeatureFlagsConfig,
  actorEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY_FEATURES, JSON.stringify(flags));
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { type: "feature_flags", flags } })
      );
    }

    const res = await saveBusinessRule(
      DB_KEY_FEATURE_FLAGS,
      flags as unknown as Record<string, unknown>,
      "System-wide feature availability flags for citizen, DEO, and verification portals",
      actorEmail
    );

    if (!res.success) {
      return { success: false, error: res.error || "Failed to save feature flags" };
    }

    await logActivity({
      action_type: "governance.feature_flags_update",
      target_table: "business_rules",
      target_id: DB_KEY_FEATURE_FLAGS,
      metadata: { actor: actorEmail, flags },
    }).catch(() => null);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist feature flags" };
  }
}

export async function loadVerificationSettingsConfig(): Promise<VerificationSettingsConfig> {
  const data = await loadBusinessRule<VerificationSettingsConfig>(
    DB_KEY_VERIFICATION_SETTINGS,
    getCachedVerificationSettings()
  );
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_KEY_VERIFICATION, JSON.stringify(data));
  }
  return data;
}

export async function saveVerificationSettingsConfig(
  config: VerificationSettingsConfig,
  actorEmail?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_KEY_VERIFICATION, JSON.stringify(config));
      window.dispatchEvent(
        new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: { type: "verification_settings", config } })
      );
    }

    const res = await saveBusinessRule(
      DB_KEY_VERIFICATION_SETTINGS,
      config as unknown as Record<string, unknown>,
      "Public QR and Memo verification settings, masking policies, and legal disclaimers",
      actorEmail
    );

    if (!res.success) {
      return { success: false, error: res.error || "Failed to save verification settings" };
    }

    await logActivity({
      action_type: "governance.verification_settings_update",
      target_table: "business_rules",
      target_id: DB_KEY_VERIFICATION_SETTINGS,
      metadata: { actor: actorEmail, maskMobile: config.maskMobileInVerification },
    }).catch(() => null);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to persist verification settings" };
  }
}

/* ------------------------------------------------------------------ */
/* Master System Backup & Export for Governance                        */
/* ------------------------------------------------------------------ */

export async function exportCompleteSystemGovernanceSnapshot(): Promise<Record<string, unknown>> {
  const [appearance, website, navigation, services, features, verification] = await Promise.all([
    loadAppearanceBranding(),
    loadPublicWebsiteConfig(),
    loadNavigationLinksConfig(),
    loadServicesCatalogConfig(),
    loadFeatureFlagsConfig(),
    loadVerificationSettingsConfig(),
  ]);

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      jurisdiction: "Bagula 2 No. Gram Panchayat",
      block: "Hanskhali",
      district: "Nadia",
      state: "West Bengal",
      schemaVersion: "2027.1.0",
    },
    appearanceBranding: appearance,
    publicWebsite: website,
    navigationLinks: navigation,
    servicesCatalog: services,
    featureFlags: features,
    verificationSettings: verification,
  };
}
