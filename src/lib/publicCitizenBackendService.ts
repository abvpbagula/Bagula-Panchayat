import { supabase } from "@/integrations/supabase/client";
import { CitizenTrackerSubmission, TrackerStatus } from "@/types/trackerTypes";
import { sanitizeInputText, sanitizeObjectStrings } from "@/lib/securityHardening";

export interface PublicServiceApplicationSubmission {
  serviceCode: "BIRTH_DIGITIZATION" | "DELAYED_REGISTRATION" | "WARISH_A4" | "DEPENDENT_A4";
  serviceTitle: string;
  serviceTitleBn: string;
  applicantName: string;
  subjectOrDeceasedName?: string;
  mobileNumber?: string;
  wardNumber?: string;
  village?: string;
  payload?: Record<string, unknown>;
}

export interface PublicServiceApplicationRecord {
  id: string;
  reference_id: string;
  service_code: string;
  service_title: string;
  service_title_bn: string;
  service_label: string;
  service_label_bn: string;
  applicant_name: string;
  subject_or_deceased_name: string | null;
  mobile_number: string | null;
  ward_number: string;
  village: string;
  sansad_or_village: string;
  status: string;
  current_stage: string;
  current_stage_label: string;
  current_stage_label_bn: string;
  payload: Record<string, unknown>;
  created_at: string;
  submitted_at: string;
  updated_at: string;
}

const LOCAL_TRACKER_REPORTS_KEY = "b2gp_user_tracker_reports";
const LOCAL_PUBLIC_APPS_KEY = "b2gp_public_service_applications_v1";

function getLocalPublicApps(): PublicServiceApplicationRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_PUBLIC_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalPublicApp(record: PublicServiceApplicationRecord): void {
  try {
    const existing = getLocalPublicApps();
    const updated = [record, ...existing.filter((r) => r.reference_id !== record.reference_id)].slice(0, 100);
    localStorage.setItem(LOCAL_PUBLIC_APPS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export function generateOfficialReferenceId(serviceCode: string): string {
  const prefixMap: Record<string, string> = {
    BIRTH_DIGITIZATION: "B2GP-2026-BRTH",
    DELAYED_REGISTRATION: "B2GP-2026-DLYD",
    WARISH_A4: "B2GP-2026-WAR",
    DEPENDENT_A4: "B2GP-2026-DEP",
  };
  const prefix = prefixMap[serviceCode] || "B2GP-2026-APP";
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomDigits}`;
}

export async function submitPublicServiceApplication(
  input: PublicServiceApplicationSubmission
): Promise<{ referenceId: string; persistedToSupabase: boolean; record: PublicServiceApplicationRecord }> {
  const referenceId = generateOfficialReferenceId(input.serviceCode);
  const nowIso = new Date().toISOString();

  const safeTitle = sanitizeInputText(input.serviceTitle, 160);
  const safeTitleBn = sanitizeInputText(input.serviceTitleBn, 160);
  const safeApplicant = sanitizeInputText(input.applicantName, 140);
  const safeSubject = input.subjectOrDeceasedName ? sanitizeInputText(input.subjectOrDeceasedName, 140) : null;
  const safeMobile = input.mobileNumber ? sanitizeInputText(input.mobileNumber, 20) : null;
  const safeWard = sanitizeInputText(input.wardNumber || "Sansad Ward #04 (Stationpara)", 100);
  const safeVillage = sanitizeInputText(input.village || "Bagula", 100);
  const safePayload = sanitizeObjectStrings(input.payload || {});

  const record: PublicServiceApplicationRecord = {
    id: `app-${Date.now()}`,
    reference_id: referenceId,
    service_code: input.serviceCode,
    service_title: safeTitle,
    service_title_bn: safeTitleBn,
    service_label: safeTitle,
    service_label_bn: safeTitleBn,
    applicant_name: safeApplicant,
    subject_or_deceased_name: safeSubject,
    mobile_number: safeMobile,
    ward_number: safeWard,
    village: safeVillage,
    sansad_or_village: `${safeVillage} · ${safeWard}`,
    status: "Registered · Under Statutory Inquiry",
    current_stage: "Gram Sansad & Sub-Registrar Desk Verification",
    current_stage_label: "Gram Sansad & Sub-Registrar Desk Verification",
    current_stage_label_bn: "গ্রাম সংসদ ও নিবন্ধক ডেস্ক যাচাই প্রক্রিয়াধীন",
    payload: safePayload,
    created_at: nowIso,
    submitted_at: nowIso,
    updated_at: nowIso,
  };

  // Always save to local storage immediately for zero-latency resolution
  saveLocalPublicApp(record);

  let persistedToSupabase = false;
  try {
    const { data, error } = await supabase
      .from("public_service_applications" as any)
      .insert({
        reference_id: record.reference_id,
        service_code: record.service_code,
        service_title: record.service_title,
        service_title_bn: record.service_title_bn,
        applicant_name: record.applicant_name,
        subject_or_deceased_name: record.subject_or_deceased_name,
        mobile_number: record.mobile_number,
        ward_number: record.ward_number,
        village: record.village,
        status: record.status,
        current_stage: record.current_stage,
        payload: record.payload,
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      persistedToSupabase = true;
    }
  } catch {
    // Local fallback already stored
  }

  return { referenceId, persistedToSupabase, record };
}

export async function lookupPublicServiceApplication(
  referenceQuery: string
): Promise<PublicServiceApplicationRecord | null> {
  const cleaned = referenceQuery.trim().toUpperCase();
  if (!cleaned) return null;

  // 1. Check Supabase public_service_applications table
  try {
    const { data, error } = await supabase
      .from("public_service_applications" as any)
      .select("*")
      .ilike("reference_id", cleaned)
      .maybeSingle();

    if (!error && data) {
      const row = data as any;
      return {
        ...row,
        service_label: row.service_label || row.service_title || "Panchayat Citizen Application",
        service_label_bn: row.service_label_bn || row.service_title_bn || "নাগরিক পরিষেবা আবেদন",
        sansad_or_village: row.sansad_or_village || `${row.village || "Bagula"} · ${row.ward_number || ""}`,
        current_stage_label: row.current_stage_label || row.current_stage || "Under Scrutiny",
        current_stage_label_bn: row.current_stage_label_bn || "যাচাই প্রক্রিয়াধীন",
        submitted_at: row.submitted_at || row.created_at || new Date().toISOString(),
      } as PublicServiceApplicationRecord;
    }
  } catch {
    // Fallback to local cache
  }

  // 2. Check local cache
  const localApps = getLocalPublicApps();
  const matched = localApps.find(
    (a) => a.reference_id.toUpperCase() === cleaned || a.reference_id.toUpperCase().includes(cleaned)
  );
  return matched || null;
}

export async function fetchPublicTrackerReports(): Promise<CitizenTrackerSubmission[]> {
  let localList: CitizenTrackerSubmission[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_TRACKER_REPORTS_KEY);
    if (raw) localList = JSON.parse(raw);
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from("public_tracker_reports" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && Array.isArray(data)) {
      const dbReports: CitizenTrackerSubmission[] = data.map((row: any) => ({
        id: row.id,
        initiativeId: sanitizeInputText(row.initiative_id, 80),
        citizenName: sanitizeInputText(row.citizen_name, 120),
        wardNumber: sanitizeInputText(row.ward_number || "Local Ward", 80),
        claimStatus: (row.claim_status as TrackerStatus) || "in_progress",
        details: sanitizeInputText(row.details, 2000),
        submittedAt: row.created_at,
      }));

      const mergedMap = new Map<string, CitizenTrackerSubmission>();
      for (const item of [...dbReports, ...localList]) {
        mergedMap.set(item.id, item);
      }
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    }
  } catch {
    // fallback
  }

  return localList;
}

export async function submitPublicTrackerReport(input: {
  initiativeId: string;
  citizenName: string;
  wardNumber: string;
  claimStatus: TrackerStatus;
  details: string;
}): Promise<{ submission: CitizenTrackerSubmission; persistedToSupabase: boolean }> {
  const newReport: CitizenTrackerSubmission = {
    id: `report-${Date.now()}`,
    initiativeId: sanitizeInputText(input.initiativeId, 80),
    citizenName: sanitizeInputText(input.citizenName, 120),
    wardNumber: sanitizeInputText(input.wardNumber || "Local Ward", 80),
    claimStatus: input.claimStatus,
    details: sanitizeInputText(input.details, 2000),
    submittedAt: new Date().toISOString(),
  };

  let persistedToSupabase = false;
  try {
    const { data, error } = await supabase
      .from("public_tracker_reports" as any)
      .insert({
        initiative_id: newReport.initiativeId,
        citizen_name: newReport.citizenName,
        ward_number: newReport.wardNumber,
        claim_status: newReport.claimStatus,
        details: newReport.details,
      })
      .select("*")
      .maybeSingle();

    if (!error && data) {
      newReport.id = (data as any).id || newReport.id;
      persistedToSupabase = true;
    }
  } catch {
    // fallback
  }

  try {
    const raw = localStorage.getItem(LOCAL_TRACKER_REPORTS_KEY);
    const existing: CitizenTrackerSubmission[] = raw ? JSON.parse(raw) : [];
    const updated = [newReport, ...existing].slice(0, 50);
    localStorage.setItem(LOCAL_TRACKER_REPORTS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  return { submission: newReport, persistedToSupabase };
}
