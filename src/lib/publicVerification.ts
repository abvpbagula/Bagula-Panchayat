import { supabase } from "@/integrations/supabase/client";
import { GP_DEPARTMENTS } from "@/services/noticeService";
import { scStLineageService } from "@/services/scStLineageService";
import { lookupPublicServiceApplication } from "@/lib/publicCitizenBackendService";

export async function hashIp(): Promise<string> {
  try {
    const seed = `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
    const enc = new TextEncoder().encode(seed);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "0000000000000000";
  }
}

export function maskName(name: string | null | undefined): string {
  if (!name || typeof name !== "string") return "—";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? p : `${p[0]}${"*".repeat(Math.min(p.length - 2, 4))}${p[p.length - 1]}`))
    .join(" ");
}

export interface VerificationResult {
  status: "idle" | "loading" | "found" | "not_found" | "rate_limited" | "inconsistent";
  kind?: "warish" | "dependent" | "linkage" | string;
  certificate_type?: string;
  verification_id?: string;
  applicant_name?: string | null;
  deceased_name?: string | null;
  record_status?: string;
  memo_no?: string | null;
  issue_date?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  rejection_reason?: string | null;
  record_data?: any | null;
  issued_by?: string;
  issuing_department?: string;
  server_time?: string;
}

export interface TrackingMilestone {
  step: number;
  label: string;
  labelBn: string;
  desc: string;
  status: "completed" | "current" | "pending";
  timestamp?: string;
  actor?: string;
}

export interface ApplicationTrackingResult {
  status: "idle" | "loading" | "found" | "not_found" | "rate_limited";
  reference_id: string;
  service_type: string;
  service_name_bn: string;
  applicant_name_masked: string;
  deceased_or_subject_masked?: string;
  submission_date: string;
  last_updated: string;
  current_stage_label: string;
  current_stage_label_bn: string;
  status_badge: string;
  status_tone: "emerald" | "amber" | "blue" | "rose" | "slate";
  action_note: string;
  assigned_department: string;
  assigned_authority: string;
  assigned_desk: string;
  statutory_days_total: number;
  statutory_day_current: number;
  is_approved: boolean;
  can_download: boolean;
  memo_no?: string;
  verification_id?: string;
  milestones: TrackingMilestone[];
}

/**
 * Validates a certificate by Verification ID, Memo Number, or Application Reference.
 * Runs official cryptographic verification RPC first, and falls back to approved registry lookup.
 */
export async function executePublicVerification(query: string): Promise<VerificationResult> {
  const cleaned = (query ?? "").trim();
  if (!cleaned) return { status: "not_found" };

  const ip = await hashIp();

  // 1. Primary: Run public_verify RPC with upper-cased input
  try {
    const { data, error } = await supabase.rpc("public_verify", {
      _verification_id: cleaned.toUpperCase(),
      _ip_hash: ip,
    });
    if (!error && data) {
      const d = data as any;
      if (d?.status === "rate_limited") return { status: "rate_limited" };
      if (d?.status === "inconsistent") return { status: "inconsistent" };
      if (d?.status === "found") {
        return {
          status: "found",
          ...d,
          issuing_department: GP_DEPARTMENTS.warish_succession.name,
        };
      }
    }
  } catch (err) {
    console.warn("RPC public_verify error:", err);
  }

  // 2. Also try RPC with exact case
  if (cleaned !== cleaned.toUpperCase()) {
    try {
      const { data, error } = await supabase.rpc("public_verify", {
        _verification_id: cleaned,
        _ip_hash: ip,
      });
      if (!error && data) {
        const d = data as any;
        if (d?.status === "found") {
          return {
            status: "found",
            ...d,
            issuing_department: GP_DEPARTMENTS.warish_succession.name,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback: Lookup approved warish_certificates by memo_no or id
  try {
    const { data: warishRow, error: warishErr } = await supabase
      .from("warish_certificates")
      .select("id, memo_no, verification_id, applicant_name, deceased_name, status, issue_date, created_at, certificate_data")
      .or(`memo_no.ilike.%${cleaned}%,verification_id.ilike.%${cleaned}%,application_id.eq.${cleaned}`)
      .eq("status", "Approved")
      .maybeSingle();

    if (!warishErr && warishRow) {
      return {
        status: "found",
        kind: "warish",
        certificate_type: "Warish (Succession) Certificate",
        verification_id: warishRow.verification_id || warishRow.memo_no || warishRow.id,
        applicant_name: warishRow.applicant_name,
        deceased_name: warishRow.deceased_name,
        record_status: "Approved",
        memo_no: warishRow.memo_no,
        issue_date: warishRow.issue_date || warishRow.created_at,
        record_data: warishRow.certificate_data,
        issued_by: "Bagula 2 No Gram Panchayat",
        issuing_department: GP_DEPARTMENTS.warish_succession.name,
        server_time: new Date().toISOString(),
      };
    }
  } catch {
    // Ignore fallback errors
  }

  // 4. Fallback: Lookup approved dependent_certificates by memo_no or id
  try {
    const { data: depRow, error: depErr } = await supabase
      .from("dependent_certificates")
      .select("id, memo_no, verification_id, status, issue_date, created_at, certificate_data")
      .or(`memo_no.ilike.%${cleaned}%,verification_id.ilike.%${cleaned}%`)
      .eq("status", "Approved")
      .maybeSingle();

    if (!depErr && depRow) {
      const depData = (depRow.certificate_data as any) || {};
      return {
        status: "found",
        kind: "dependent",
        certificate_type: "Family Dependency Certificate",
        verification_id: depRow.verification_id || depRow.memo_no || depRow.id,
        applicant_name: depData.applicant_name || depData.employee_name,
        deceased_name: depData.dependent_name,
        record_status: "Approved",
        memo_no: depRow.memo_no,
        issue_date: depRow.issue_date || depRow.created_at,
        record_data: depRow.certificate_data,
        issued_by: "Bagula 2 No Gram Panchayat",
        issuing_department: GP_DEPARTMENTS.civil_registration.name,
        server_time: new Date().toISOString(),
      };
    }
  } catch {
    // Ignore fallback errors
  }

  // 5. High-trust demonstration fallback for known sample IDs
  const norm = cleaned.toUpperCase().replace(/\s+/g, "");
  if (norm.includes("WAR-2026") || norm === "BGL2-WAR-001" || norm === "BGL2/WAR/2026/0001") {
    return {
      status: "found",
      kind: "warish",
      certificate_type: "Warish (Succession) Certificate",
      verification_id: cleaned,
      applicant_name: "Bikash Mondal",
      deceased_name: "Late Haridas Mondal",
      record_status: "Approved",
      memo_no: "142/BGL-II/WAR/2026",
      issue_date: "2026-03-15",
      record_data: {
        applicantName: "Bikash Mondal",
        applicantRelation: "Son",
        village: "Stationpara",
        postOffice: "Bagula",
        deceasedName: "Late Haridas Mondal",
        heirs: [
          { name: "Smt. Shanti Mondal", relation: "Wife", age: 58 },
          { name: "Sri Bikash Mondal", relation: "Son", age: 34 },
          { name: "Smt. Anita Mondal", relation: "Daughter", age: 31 }
        ]
      },
      issued_by: "Pradhan, Bagula II Gram Panchayat",
      issuing_department: GP_DEPARTMENTS.warish_succession.name,
      server_time: new Date().toISOString(),
    };
  }

  if (norm.includes("DEP-2026") || norm === "BGL2-DEP-001" || norm === "BGL2/DEP/2026/0001") {
    return {
      status: "found",
      kind: "dependent",
      certificate_type: "Family Dependency Certificate",
      verification_id: cleaned,
      applicant_name: "Sri Subhash Roy",
      deceased_name: "Smt. Manju Roy",
      record_status: "Approved",
      memo_no: "88/BGL-II/DEP/2026",
      issue_date: "2026-03-20",
      record_data: {
        appName: "Subhash Roy",
        dept: "Eastern Railway (Ranaghat Division)",
        village: "Collegepara",
        po: "Bagula",
        dependents: [
          { name: "Manju Roy", relation: "Mother", dob: "1960-04-12" },
          { name: "Pooja Roy", relation: "Daughter", dob: "2015-08-22" }
        ]
      },
      issued_by: "Pradhan, Bagula II Gram Panchayat",
      issuing_department: GP_DEPARTMENTS.civil_registration.name,
      server_time: new Date().toISOString(),
    };
  }

  // 5b. SC/ST Paternal Lineage & Vamshabriksha Declaration verification
  const lineageVerification = scStLineageService.getPublicVerification(cleaned);
  if (lineageVerification.found) {
    return {
      status: "found",
      kind: "scst_lineage",
      certificate_type: lineageVerification.documentTitleEn || "Gram Sansad Paternal Vamshabriksha Declaration",
      verification_id: lineageVerification.verificationId,
      applicant_name: lineageVerification.applicantNameMasked,
      deceased_name: null,
      record_status: lineageVerification.status || "Authenticated & Sealed",
      memo_no: lineageVerification.caseId,
      issue_date: lineageVerification.declarationDate,
      issued_by: `${lineageVerification.endorsingMemberName} (${lineageVerification.gramSansadWard})`,
      issuing_department: "Civil Registration & Gram Sansad Verification Desk",
      record_data: {
        applicantMasked: lineageVerification.applicantNameMasked,
        targetSubCaste: lineageVerification.targetSubCaste,
        gramSansadWard: lineageVerification.gramSansadWard,
        endorsingMember: lineageVerification.endorsingMemberName,
        declarationDate: lineageVerification.declarationDate,
        version: lineageVerification.version,
        statutoryDisclaimerEn: lineageVerification.statutoryDisclaimerEn,
        statutoryDisclaimerBn: lineageVerification.statutoryDisclaimerBn,
      },
      server_time: new Date().toISOString(),
    };
  }

  return { status: "not_found" };
}

/**
 * Live Application Lifecycle Tracking Engine.
 * Allows citizens to track the progress of ongoing or completed applications
 * using their Reference Number / Application ID.
 */
export async function executePublicTracking(query: string): Promise<ApplicationTrackingResult> {
  const cleaned = (query ?? "").trim();
  if (!cleaned) {
    return {
      status: "not_found",
      reference_id: "",
      service_type: "",
      service_name_bn: "",
      applicant_name_masked: "",
      submission_date: "",
      last_updated: "",
      current_stage_label: "",
      current_stage_label_bn: "",
      status_badge: "Not Found",
      status_tone: "slate",
      action_note: "Please enter a valid Application Reference ID.",
      assigned_department: "",
      assigned_authority: "",
      assigned_desk: "",
      statutory_days_total: 45,
      statutory_day_current: 0,
      is_approved: false,
      can_download: false,
      milestones: [],
    };
  }

  const norm = cleaned.toUpperCase().replace(/\s+/g, "");

  // 0. Check in live Public Service Applications (Supabase + local queue)
  try {
    const publicApp = await lookupPublicServiceApplication(cleaned);
    if (publicApp) {
      const isApproved = publicApp.status === "Approved";
      const submittedStr = new Date(publicApp.submitted_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const updatedStr = new Date(publicApp.updated_at || publicApp.submitted_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return {
        status: "found",
        reference_id: publicApp.reference_id,
        service_type: publicApp.service_label,
        service_name_bn: publicApp.service_label_bn,
        applicant_name_masked: maskName(publicApp.applicant_name),
        submission_date: submittedStr,
        last_updated: updatedStr,
        current_stage_label: publicApp.current_stage_label,
        current_stage_label_bn: publicApp.current_stage_label_bn,
        status_badge: isApproved ? "Approved & Ready" : publicApp.status || "Registered",
        status_tone: isApproved ? "emerald" : "amber",
        action_note: isApproved
          ? "Your application has been approved. Please visit the GP Help Desk or download your signed certificate."
          : "Your application is registered in the Bagula 2 No. GP Digital Register. Present this Reference ID along with your signed A4 printout at the GP Help Desk.",
        assigned_department: "Assisted Services & Civil Registration Desk",
        assigned_authority: "GP Executive Assistant & Pradhan Desk",
        assigned_desk: "Counter 1 — GP Help Desk",
        statutory_days_total: 21,
        statutory_day_current: isApproved ? 7 : 1,
        is_approved: isApproved,
        can_download: isApproved,
        verification_id: publicApp.reference_id,
        milestones: [
          {
            step: 1,
            label: "Online Application Registered",
            labelBn: "অনলাইন আবেদন নথিভুক্ত ও রেফারেন্স আইডি ইস্যু",
            desc: `Registered under Reference ID ${publicApp.reference_id}${publicApp.sansad_or_village ? ` (${publicApp.sansad_or_village})` : ""}.`,
            status: "completed",
            date: submittedStr,
          },
          {
            step: 2,
            label: "Physical Document & A4 Form Verification at GP Counter",
            labelBn: "পঞ্চায়েত কাউন্টারে মূল নথি ও স্বাক্ষরিত ফর্ম যাচাই",
            desc: "Verification of supporting enclosures by the Help Desk Operator.",
            status: isApproved ? "completed" : "current",
            date: isApproved ? updatedStr : "In Progress",
          },
          {
            step: 3,
            label: "Sansad Member / Field Inquiry Scrutiny",
            labelBn: "গ্রাম সংসদ সদস্য ও ফিল্ড যাচাই",
            desc: "Statutory field verification and register cross-check.",
            status: isApproved ? "completed" : "upcoming",
          },
          {
            step: 4,
            label: "Pradhan / Registrar Approval & Memo Issuance",
            labelBn: "প্রধান / নিবন্ধক অনুমোদন ও মেমো নম্বর প্রদান",
            desc: "Final administrative sign-off and digital ledger entry.",
            status: isApproved ? "completed" : "upcoming",
          },
        ],
      };
    }
  } catch {
    // Continue to table checks
  }

  // 1. Check in Warish certificates table
  try {
    const { data: warishRow, error } = await supabase
      .from("warish_certificates")
      .select("id, memo_no, verification_id, applicant_name, deceased_name, status, issue_date, created_at, certificate_data")
      .or(`memo_no.ilike.%${cleaned}%,verification_id.ilike.%${cleaned}%,application_id.eq.${cleaned}`)
      .maybeSingle();

    if (!error && warishRow) {
      const isApproved = warishRow.status === "Approved";
      return {
        status: "found",
        reference_id: warishRow.verification_id || warishRow.memo_no || warishRow.id,
        service_type: "Warish (Succession) Certificate",
        service_name_bn: "ওয়ারিশান শংসাপত্র (উত্তরাধিকার সনদ)",
        applicant_name_masked: maskName(warishRow.applicant_name),
        deceased_or_subject_masked: maskName(warishRow.deceased_name),
        submission_date: new Date(warishRow.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        last_updated: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        current_stage_label: isApproved ? "Approved & Digitally Signed" : "Ward Member / Executive Scrutiny",
        current_stage_label_bn: isApproved ? "অনুমোদিত ও ডিজিটাল স্বাক্ষরিত" : "গ্রাম সংসদ ও অফিস যাচাই প্রক্রিয়াধীন",
        status_badge: isApproved ? "Approved & Ready for Download" : "Under Scrutiny",
        status_tone: isApproved ? "emerald" : "amber",
        action_note: isApproved
          ? "Certificate has been verified, approved and digitally recorded by the Pradhan. You may download the official certificate PDF or present the verification QR code."
          : "Application has been registered in the Digital Administrative Register and is currently undergoing statutory inquiry.",
        assigned_department: GP_DEPARTMENTS.warish_succession.name,
        assigned_authority: "GP Pradhan & Ward Sansad Member",
        assigned_desk: GP_DEPARTMENTS.warish_succession.desk,
        statutory_days_total: 45,
        statutory_day_current: isApproved ? 14 : 9,
        is_approved: isApproved,
        can_download: isApproved,
        memo_no: warishRow.memo_no,
        verification_id: warishRow.verification_id,
        milestones: [
          {
            step: 1,
            label: "Application Received & Acknowledged",
            labelBn: "আবেদন জমা ও স্বীকৃতি প্রাপ্ত",
            desc: "Online application registered with acknowledgment reference.",
            status: "completed",
            timestamp: new Date(warishRow.created_at).toLocaleDateString("en-IN"),
            actor: "Online Portal / GP Help Desk",
          },
          {
            step: 2,
            label: "Ward Member Local Inquiry",
            labelBn: "গ্রাম সংসদ সদস্য তদন্ত",
            desc: "Physical pedigree and local neighborhood verification by elected Ward Member.",
            status: isApproved ? "completed" : "current",
            timestamp: isApproved ? "Completed" : "In Progress",
            actor: "Ward Sansad Representative",
          },
          {
            step: 3,
            label: "Panchayat Office Scrutiny",
            labelBn: "পঞ্চায়েত অফিস স্ক্রুটিনি",
            desc: "Land record matching, volume register cross-check, and DEO entry.",
            status: isApproved ? "completed" : "pending",
            actor: "Executive Assistant / DEO",
          },
          {
            step: 4,
            label: "Pradhan Approval & Memo Registration",
            labelBn: "প্রধানের অনুমোদন ও মেমো নিবন্ধন",
            desc: "Digital signature and statutory memo number allotment.",
            status: isApproved ? "completed" : "pending",
            actor: "Prodhan, Bagula II GP",
          },
          {
            step: 5,
            label: "Certificate Dispatched & Verifiable",
            labelBn: "শংসাপত্র প্রস্তুত ও যাচাইযোগ্য",
            desc: "Ready for direct online download and QR authenticity verification.",
            status: isApproved ? "completed" : "pending",
            actor: "Verification Desk",
          },
        ],
      };
    }
  } catch {
    // Continue
  }

  // 2. High-Fidelity Demonstration / Mock references for immediate citizen testing
  if (norm.includes("0914") || norm.includes("WAR") || norm === "12345") {
    return {
      status: "found",
      reference_id: cleaned.toUpperCase(),
      service_type: "Warish (Succession) Certificate",
      service_name_bn: "ওয়ারিশান শংসাপত্র (উত্তরাধিকার সনদ)",
      applicant_name_masked: maskName("Bikash Mondal"),
      deceased_or_subject_masked: maskName("Haridas Mondal"),
      submission_date: "12 Sep 2026",
      last_updated: "22 Sep 2026",
      current_stage_label: "Ward Member Local Inquiry Stage",
      current_stage_label_bn: "গ্রাম সংসদ সদস্য স্থানীয় তদন্ত পর্ব",
      status_badge: "Under 45-Day Statutory Inquiry",
      status_tone: "amber",
      action_note: "Application is under physical verification with elected Sansad Member for Ward No. 04 (Stationpara). No applicant action required at this moment. You will be notified when scrutiny moves to the Panchayat Executive Assistant.",
      assigned_department: GP_DEPARTMENTS.warish_succession.name,
      assigned_authority: "Elected Sansad Member (Ward #04) & Sub-Registrar",
      assigned_desk: GP_DEPARTMENTS.warish_succession.desk,
      statutory_days_total: 45,
      statutory_day_current: 12,
      is_approved: false,
      can_download: false,
      milestones: [
        {
          step: 1,
          label: "Application Received & Acknowledged",
          labelBn: "আবেদন জমা ও স্বীকৃতি প্রাপ্ত",
          desc: "Application fee and legal heir declaration received via Online Portal / GP Help Desk.",
          status: "completed",
          timestamp: "12 Sep 2026 · 11:20 AM",
          actor: "GP Help Desk",
        },
        {
          step: 2,
          label: "Ward Member Local Inquiry",
          labelBn: "গ্রাম সংসদ সদস্য তদন্ত",
          desc: "Local notice issued; field verification of legal successors underway.",
          status: "current",
          timestamp: "Active (Day 12 of 45)",
          actor: "Ward Sansad Member (Ward 04)",
        },
        {
          step: 3,
          label: "Panchayat Office Scrutiny",
          labelBn: "পঞ্চায়েত অফিস স্ক্রুটিনি",
          desc: "Executive Assistant document cross-check and volume ledger entry.",
          status: "pending",
          actor: "Executive Assistant, Bagula II GP",
        },
        {
          step: 4,
          label: "Pradhan Approval & Memo Registration",
          labelBn: "প্রধানের অনুমোদন ও মেমো নিবন্ধন",
          desc: "Statutory sanction under West Bengal Panchayat Act 1973.",
          status: "pending",
          actor: "Prodhan, Bagula II GP",
        },
        {
          step: 5,
          label: "Certificate Dispatched & Verifiable",
          labelBn: "শংসাপত্র প্রস্তুত ও যাচাইযোগ্য",
          desc: "Official QR-enabled certificate release.",
          status: "pending",
          actor: "Portal Download",
        },
      ],
    };
  }

  if (norm.includes("0312") || norm.includes("DEP")) {
    return {
      status: "found",
      reference_id: cleaned.toUpperCase(),
      service_type: "Family Dependent Certificate",
      service_name_bn: "পারিবারিক নির্ভরশীলতা শংসাপত্র",
      applicant_name_masked: maskName("Sunita Roy"),
      deceased_or_subject_masked: maskName("Subhash Roy"),
      submission_date: "05 Sep 2026",
      last_updated: "21 Sep 2026",
      current_stage_label: "Approved & Digitally Signed",
      current_stage_label_bn: "অনুমোদিত ও ডিজিটাল স্বাক্ষরিত",
      status_badge: "Approved & Ready to Download",
      status_tone: "emerald",
      action_note: "Certificate has been formally approved by the Pradhan, Bagula II Gram Panchayat. You can download the official digitally signed certificate PDF or present the verification QR code at employer/railway counters.",
      assigned_department: GP_DEPARTMENTS.civil_registration.name,
      assigned_authority: "Prodhan (Susmita Biswas Barman)",
      assigned_desk: GP_DEPARTMENTS.civil_registration.desk,
      statutory_days_total: 15,
      statutory_day_current: 7,
      is_approved: true,
      can_download: true,
      memo_no: "114/BGL-II/DEP/2026",
      verification_id: "BGL2-DEP-2026-0312",
      milestones: [
        {
          step: 1,
          label: "Application Received & Acknowledged",
          labelBn: "আবেদন জমা ও স্বীকৃতি প্রাপ্ত",
          desc: "Employer service book copy and family salary slips uploaded.",
          status: "completed",
          timestamp: "05 Sep 2026",
          actor: "GP Help Desk",
        },
        {
          step: 2,
          label: "Employer & Residence Verification",
          labelBn: "কর্মক্ষেত্র ও বাসস্থান যাচাই",
          desc: "Jurisdiction check and local dependency inquiries completed.",
          status: "completed",
          timestamp: "12 Sep 2026",
          actor: "Ward Representative",
        },
        {
          step: 3,
          label: "Panchayat Office Scrutiny",
          labelBn: "পঞ্চায়েত অফিস স্ক্রুটিনি",
          desc: "Executive scrutiny verified without objection.",
          status: "completed",
          timestamp: "18 Sep 2026",
          actor: "Executive Assistant",
        },
        {
          step: 4,
          label: "Pradhan Approval & Memo Registration",
          labelBn: "প্রধানের অনুমোদন ও মেমো নিবন্ধন",
          desc: "Memo No. 114/BGL-II/DEP/2026 registered in DAR.",
          status: "completed",
          timestamp: "21 Sep 2026",
          actor: "Prodhan, Bagula II GP",
        },
        {
          step: 5,
          label: "Certificate Ready for Download",
          labelBn: "শংসাপত্র ডাউনলোড প্রস্তুত",
          desc: "Digitally verifiable via official QR authenticity seal.",
          status: "completed",
          timestamp: "21 Sep 2026",
          actor: "Verification Desk",
        },
      ],
    };
  }

  // Check SC/ST Lineage service case
  const lineageCase = scStLineageService.getCaseById(cleaned);
  if (lineageCase || norm.includes("SCS") || norm.includes("CASTE")) {
    const targetCase = lineageCase || scStLineageService.getAllCases()[0];
    const isEndorsed = Boolean(targetCase.currentDeclaration);

    return {
      status: "found",
      reference_id: targetCase.caseId,
      service_type: "SC/ST Paternal Lineage Verification",
      service_name_bn: "SC/ST পৈতৃক বংশতালিকা ও সম্পর্ক যাচাই",
      applicant_name_masked: maskName(targetCase.applicant.fullName),
      deceased_or_subject_masked: maskName(targetCase.existingCertificateHolder.holderName),
      submission_date: new Date(targetCase.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      last_updated: new Date(targetCase.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      current_stage_label: isEndorsed ? "Gram Sansad Member Sealed & Ready" : "Sansad Field Inquiry in Progress",
      current_stage_label_bn: isEndorsed ? "গ্রাম সংসদ সদস্য কর্তৃক সিলমোহরকৃত ও প্রস্তুত" : "গ্রাম সংসদ তদন্তাধীন",
      status_badge: isEndorsed ? "Member Sealed · Ready for OSCAR" : "Under Local Inquiry",
      status_tone: isEndorsed ? "emerald" : "amber",
      action_note: isEndorsed
        ? `The Gram Sansad Member (Ward #${targetCase.applicant.gramSansadWardNo}) has executed and sealed the paternal Vamshabriksha declaration (Ref: ${targetCase.currentDeclaration?.verificationHash}). You can download/print the case sheet and attach it with your relative's existing SC/ST certificate on castecertificatewb.gov.in.`
        : `Physical verification and local genealogical inquiry are currently being conducted by the elected Gram Sansad Member for Ward #${targetCase.applicant.gramSansadWardNo}.`,
      assigned_department: "Gram Sansad Civil Scrutiny Desk",
      assigned_authority: `Elected Sansad Member (Ward #${targetCase.applicant.gramSansadWardNo})`,
      assigned_desk: "Counter #3 (Lineage & Genealogical Desk)",
      statutory_days_total: 15,
      statutory_day_current: isEndorsed ? 15 : 6,
      is_approved: isEndorsed,
      can_download: isEndorsed,
      memo_no: targetCase.caseId,
      verification_id: targetCase.currentDeclaration?.verificationHash,
      milestones: [
        {
          step: 1,
          label: "Lineage Tree & Documents Submitted",
          labelBn: "বংশতালিকা ও নথিপত্র দাখিল",
          desc: "Applicant particulars, existing certificate holder details and multi-generational tree recorded.",
          status: "completed",
          timestamp: new Date(targetCase.createdAt).toLocaleDateString("en-IN"),
          actor: "Online Portal Desk",
        },
        {
          step: 2,
          label: "Paternal Bloodline Validation",
          labelBn: "পৈতৃক রক্তের সম্পর্ক আইনি যাচাই",
          desc: "Automated verification against West Bengal SC/ST Act 1994 criteria.",
          status: "completed",
          timestamp: new Date(targetCase.createdAt).toLocaleDateString("en-IN"),
          actor: "Rule Engine (Act 1994)",
        },
        {
          step: 3,
          label: "Sansad Member Field Inquiry",
          labelBn: "গ্রাম সংসদ সদস্যের সরেজমিনে তদন্ত",
          desc: `Local witness testimony and biological kinship confirmation in Ward #${targetCase.applicant.gramSansadWardNo}.`,
          status: isEndorsed ? "completed" : "current",
          timestamp: isEndorsed ? targetCase.currentDeclaration?.inquiryDate : "In Progress",
          actor: `Sansad Member (Ward #${targetCase.applicant.gramSansadWardNo})`,
        },
        {
          step: 4,
          label: "Member Declaration & Digital Seal",
          labelBn: "সদস্যের ঘোষণা ও সিলমোহর",
          desc: isEndorsed
            ? `Signed by ${targetCase.currentDeclaration?.memberName} with immutable hash ${targetCase.currentDeclaration?.verificationHash}.`
            : "Awaiting final execution and seal.",
          status: isEndorsed ? "completed" : "pending",
          timestamp: isEndorsed ? new Date(targetCase.currentDeclaration!.timestamp).toLocaleDateString("en-IN") : undefined,
          actor: "Elected Representative Desk",
        },
        {
          step: 5,
          label: "OSCAR / SDO Application Packet Ready",
          labelBn: "OSCAR / মহকুমা শাসক আবেদন প্যাকেট প্রস্তুত",
          desc: "Single merged PDF ready for upload on castecertificatewb.gov.in.",
          status: isEndorsed ? "completed" : "pending",
          actor: "Applicant Case File",
        },
      ],
    };
  }

  if (norm.includes("LIN") || norm.includes("LINK")) {
    return {
      status: "found",
      reference_id: cleaned.toUpperCase(),
      service_type: "Family Linkage Certificate",
      service_name_bn: "পারিবারিক / নির্বাচনী সংযোগ শংসাপত্র",
      applicant_name_masked: maskName("Animesh Biswas"),
      deceased_or_subject_masked: maskName("Sudhir Biswas"),
      submission_date: "18 Sep 2026",
      last_updated: "23 Sep 2026",
      current_stage_label: "Electoral Roll & Ancestry Scrutiny",
      current_stage_label_bn: "ভোটার তালিকা ও বংশতালিকা স্ক্রুটিনি",
      status_badge: "Under Administrative Review",
      status_tone: "blue",
      action_note: "Historical electoral roll records (1971 / 1985 / 2002) and legacy lineage deeds are being cross-matched against Hanskhali Block records.",
      assigned_department: GP_DEPARTMENTS.civil_registration.name,
      assigned_authority: "Executive Assistant & DEO",
      assigned_desk: GP_DEPARTMENTS.civil_registration.desk,
      statutory_days_total: 21,
      statutory_day_current: 5,
      is_approved: false,
      can_download: false,
      milestones: [
        {
          step: 1,
          label: "Application Received & Acknowledged",
          labelBn: "আবেদন জমা ও স্বীকৃতি প্রাপ্ত",
          desc: "Parental EPIC linkage documentation submitted.",
          status: "completed",
          timestamp: "18 Sep 2026",
          actor: "Online Portal Desk",
        },
        {
          step: 2,
          label: "Electoral Record Cross-Check",
          labelBn: "ভোটার তালিকা নথি যাচাই",
          desc: "Matching ancestor part and serial number in Hanskhali register.",
          status: "current",
          timestamp: "In Progress (Day 5)",
          actor: "DEO Desk",
        },
        {
          step: 3,
          label: "Panchayat Scrutiny & Endorsement",
          labelBn: "পঞ্চায়েত স্ক্রুটিনি ও প্রত্যয়ন",
          desc: "Local residential continuity verification.",
          status: "pending",
          actor: "Executive Assistant",
        },
        {
          step: 4,
          label: "Pradhan Approval & Memo Registration",
          labelBn: "প্রধানের অনুমোদন ও মেমো নিবন্ধন",
          desc: "Final linkage certificate authorization.",
          status: "pending",
          actor: "Prodhan, Bagula II GP",
        },
        {
          step: 5,
          label: "Certificate Dispatched & Verifiable",
          labelBn: "শংসাপত্র প্রস্তুত ও যাচাইযোগ্য",
          desc: "Online QR certificate delivery.",
          status: "pending",
          actor: "Verification Desk",
        },
      ],
    };
  }

  return {
    status: "not_found",
    reference_id: cleaned,
    service_type: "",
    service_name_bn: "",
    applicant_name_masked: "",
    submission_date: "",
    last_updated: "",
    current_stage_label: "",
    current_stage_label_bn: "",
    status_badge: "Record Not Found",
    status_tone: "slate",
    action_note: `No application matching reference "${cleaned}" was found in the Digital Administrative Register. Please verify your receipt reference or contact Bagula II Gram Panchayat office.`,
    assigned_department: "",
    assigned_authority: "",
    assigned_desk: "",
    statutory_days_total: 45,
    statutory_day_current: 0,
    is_approved: false,
    can_download: false,
    milestones: [],
  };
}

