import {
  LayoutDashboard,
  Palette,
  Globe,
  Compass,
  ScrollText,
  FileCheck2,
  SlidersHorizontal,
  Bell,
  KeyRound,
  Users,
  ShieldCheck,
  UserPlus,
  FileText,
  Mail,
  QrCode,
  ShieldAlert,
  Activity,
  Settings,
  ToggleLeft,
  Database,
  ExternalLink,
  Server,
  Clock,
  type LucideIcon,
} from "lucide-react";

export type ControlCenterSectionId =
  | "dashboard"
  | "appearance"
  | "website"
  | "navigation"
  | "services"
  | "templates"
  | "print-setup"
  | "notices"
  | "auth"
  | "users-roles"
  | "deo-scope"
  | "onboarding"
  | "documents"
  | "notifications"
  | "verification"
  | "security"
  | "master-data"
  | "session-security"
  | "audit-log"
  | "system-config"
  | "features"
  | "backups"
  | "integrations"
  | "environment";

export interface ControlCenterSectionDef {
  id: ControlCenterSectionId;
  label: string;
  bengaliLabel: string;
  category: "CONTROL CENTER" | "PUBLIC & BRANDING" | "SERVICES & TEMPLATES" | "IDENTITY & GOVERNANCE" | "OPERATIONS & VERIFICATION" | "SYSTEM & SECURITY";
  icon: LucideIcon;
  badge?: string;
  description: string;
}

export const CONTROL_CENTER_SECTIONS: ControlCenterSectionDef[] = [
  // 1. Control Center
  {
    id: "dashboard",
    label: "Governance Dashboard",
    bengaliLabel: "শাসন নিয়ন্ত্রণ ড্যাশবোর্ড",
    category: "CONTROL CENTER",
    icon: LayoutDashboard,
    description: "System-wide high-level metrics, pending supervisory queues, and fast-action switches.",
  },

  // 2. Public & Branding
  {
    id: "appearance",
    label: "Appearance & Branding",
    bengaliLabel: "চেহারা ও ব্র্যান্ডিং",
    category: "PUBLIC & BRANDING",
    icon: Palette,
    description: "Gram Panchayat bilingual titles, party themes (BJP/TMC/CPIM/Congress), typography, and density.",
  },
  {
    id: "website",
    label: "Public Website",
    bengaliLabel: "পাবলিক ওয়েবসাইট",
    category: "PUBLIC & BRANDING",
    icon: Globe,
    description: "Hero headlines, call-to-action destinations, emergency banners, and section visibility.",
  },
  {
    id: "navigation",
    label: "Navigation & Links",
    bengaliLabel: "ন্যাভিগেশন ও লিংক",
    category: "PUBLIC & BRANDING",
    icon: Compass,
    description: "Header and footer menu items, government portal redirects, and safe URL validation.",
  },
  {
    id: "notices",
    label: "Content & Notices",
    bengaliLabel: "বিজ্ঞপ্তি ও নির্দেশিকা",
    category: "PUBLIC & BRANDING",
    icon: Bell,
    description: "Publish, pin, and expire bilingual notices, legal disclaimers, and citizen guidelines.",
  },

  // 3. Services & Templates
  {
    id: "services",
    label: "Services Catalog",
    bengaliLabel: "পরিষেবা তালিকা",
    category: "SERVICES & TEMPLATES",
    icon: ScrollText,
    description: "Manage Warish, Dependent, Linkage, and Birth services, intake availability, and fees.",
  },
  {
    id: "templates",
    label: "Certificate Templates",
    bengaliLabel: "শংসাপত্র টেমপ্লেট",
    category: "SERVICES & TEMPLATES",
    icon: FileCheck2,
    description: "Active certificate layouts, visual designer, bindings, versioning, and immutable snapshots.",
  },
  {
    id: "print-setup",
    label: "Print & Page Setup",
    bengaliLabel: "প্রিন্ট ও পেজ সেটআপ",
    category: "SERVICES & TEMPLATES",
    icon: SlidersHorizontal,
    description: "Paper sizes (A4/A5/A3/Legal), millimeter margins, orientation, and live printing ruler.",
  },

  // 4. Identity & Governance
  {
    id: "auth",
    label: "Office Authentication Policy",
    bengaliLabel: "অফিস লগইন নিয়ন্ত্রণ",
    category: "IDENTITY & GOVERNANCE",
    icon: KeyRound,
    badge: "Office Only",
    description: "Authoritative Office Password, Email OTP, and Google SSO policies (DEO, Admin, Super Admin).",
  },
  {
    id: "users-roles",
    label: "Office Users & Roles",
    bengaliLabel: "ব্যবহারকারী ও পদমর্যাদা",
    category: "IDENTITY & GOVERNANCE",
    icon: Users,
    description: "Manage strictly DEO, Admin, and Super Admin accounts with full role governance.",
  },
  {
    id: "deo-scope",
    label: "DEO Service Scope",
    bengaliLabel: "ডিইও কাজের পরিধি ও কোটা",
    category: "IDENTITY & GOVERNANCE",
    icon: ShieldCheck,
    description: "Authorize specific certificate scopes (Warish/Dependent/Linkage) and daily draft limits.",
  },
  {
    id: "onboarding",
    label: "Official Onboarding",
    bengaliLabel: "নতুন কর্মী অনবোর্ডিং",
    category: "IDENTITY & GOVERNANCE",
    icon: UserPlus,
    description: "Issue temporary credentials, 3-hour expiry policy, designations, and account activations.",
  },

  // 5. Operations & Verification
  {
    id: "documents",
    label: "Documents & Constraints",
    bengaliLabel: "নথিপত্র ও ফাইল আপলোড",
    category: "OPERATIONS & VERIFICATION",
    icon: FileText,
    description: "Allowed file extensions, maximum KB limits per document type, and mandatory checklists.",
  },
  {
    id: "notifications",
    label: "Office Notifications",
    bengaliLabel: "অফিস বিজ্ঞপ্তি কেন্দ্র",
    category: "OPERATIONS & VERIFICATION",
    icon: Mail,
    description: "System alerts, returned application alerts, broadcast memos, and recipient targeting.",
  },
  {
    id: "verification",
    label: "Verification Presentation",
    bengaliLabel: "সার্টিফিকেট ভেরিফিকেশন নীতি",
    category: "OPERATIONS & VERIFICATION",
    icon: QrCode,
    description: "Public QR watermarks, masked phone protection (******1234), and anti-tamper controls.",
  },

  // 6. System & Security
  {
    id: "security",
    label: "Security Center",
    bengaliLabel: "নিরাপত্তা ও আরএলএস কেন্দ্র",
    category: "SYSTEM & SECURITY",
    icon: ShieldAlert,
    badge: "Hardened",
    description: "Row-Level Security status, auth protection, password policy, and backend RPC health matrix.",
  },
  {
    id: "master-data",
    label: "Master Data & Security Governance",
    bengaliLabel: "মাস্টার ডাটা ও নিরাপত্তা শাসন",
    category: "SYSTEM & SECURITY",
    icon: Database,
    badge: "RPC Active",
    description: "Security Governance configuration card, session forced logout rules, and master data registries.",
  },
  {
    id: "session-security",
    label: "Forced Logout & Session Rules",
    bengaliLabel: "সেশন ও ফোর্সড লগআউট নীতি",
    category: "SYSTEM & SECURITY",
    icon: Clock,
    badge: "Active",
    description: "Inactivity time limits, forced sign out toggles, individual account exemptions, and warning dialogues.",
  },
  {
    id: "audit-log",
    label: "Audit Log & Timeline",
    bengaliLabel: "অডিট ও কাজের ইতিহাস",
    category: "SYSTEM & SECURITY",
    icon: Activity,
    description: "Immutable historical log of administrative actions, actor emails, timestamps, and changes.",
  },
  {
    id: "system-config",
    label: "System Configuration",
    bengaliLabel: "পঞ্চায়েত অফিস তথ্য ও নিয়ম",
    category: "SYSTEM & SECURITY",
    icon: Settings,
    description: "Jurisdiction details, Pradhan & Secretary signatories, working hours, and memo prefixes.",
  },
  {
    id: "features",
    label: "Feature Availability",
    bengaliLabel: "ফিচার ফ্ল্যাগ নিয়ন্ত্রণ",
    category: "SYSTEM & SECURITY",
    icon: ToggleLeft,
    description: "Master toggles for public registration, online applications, uploads, and emergency modes.",
  },
  {
    id: "backups",
    label: "Backup & Recovery",
    bengaliLabel: "ব্যাকআপ ও দুর্যোগ পুনরুদ্ধার",
    category: "SYSTEM & SECURITY",
    icon: Database,
    description: "12-year statutory retention compliance, manual governance JSON exports, and recovery checks.",
  },
  {
    id: "integrations",
    label: "External Integrations",
    bengaliLabel: "বহিরাগত পোর্টাল সংযোগ",
    category: "SYSTEM & SECURITY",
    icon: ExternalLink,
    description: "WBPMS, CRS Janma-Mrityu Tathya, Google Identity Services, and storage bucket health.",
  },
  {
    id: "environment",
    label: "Environment & Deployment",
    bengaliLabel: "সার্ভার ও ডিপ্লয়মেন্ট স্থিতি",
    category: "SYSTEM & SECURITY",
    icon: Server,
    description: "Google Cloud Run container runtime, Port 3000 proxy, live database latency, and uptime.",
  },
];
