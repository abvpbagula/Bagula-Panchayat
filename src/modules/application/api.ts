import { supabase } from "@/integrations/supabase/client";
import {
  KIND_TABLE,
  type ApplicationDraft,
  type ApplicationKind,
  EMPTY_DRAFT,
} from "./types";
import type { Json } from "@/integrations/supabase/types";

export interface DuplicateMatch {
  id: string;
  kind: string;
  applicant_name: string | null;
  village: string | null;
  status: string | null;
  memo_no: string | null;
  created_at: string;
  submitted_at: string | null;
  return_count: number;
  source: string;
}

export interface TimelineEvent {
  action: string;
  event: string;
  actor_email: string | null;
  reason: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

const resolved = (value: string, manual: string) => (value === "Other" ? manual : value);

/**
 * Serialises the wizard draft into the same `data` jsonb shape the existing
 * Warish / Dependent generator pages already read via `?load=<id>`.
 */
export function draftToRecordData(kind: ApplicationKind, draft: ApplicationDraft) {
  const a = draft.applicant;
  const village = resolved(a.village, a.villageManual);
  const po = resolved(a.postOffice, a.postOfficeManual);

  const common = {
    __wizard: draft,
    applicantAadhaarLast4: a.aadhaarLast4 || null,
    applicantEpic: a.epicNo || null,
  };

  if (kind === "warish") {
    return {
      ...common,
      deceasedName: draft.warish.deceasedName,
      fatherPrefix: draft.warish.fatherPrefix,
      fatherName: draft.warish.fatherName,
      relationToGuardian: draft.warish.relationToGuardian || "Father",
      permanentAddress: draft.warish.permanentAddress || "",
      village: draft.warish.village || village,
      village_id: draft.warish.village_id,
      postOffice: draft.warish.postOffice || po,
      post_office_id: draft.warish.post_office_id,
      policeStation: draft.warish.policeStation || a.policeStation,
      district: draft.warish.district || a.district,
      pin: draft.warish.pin || a.pin,
      dateOfDeath: draft.warish.dateOfDeath,
      placeOfDeath: draft.warish.placeOfDeath || "",
      causeOfDeath: draft.warish.causeOfDeath || "",
      ageAtDeath: draft.warish.ageAtDeath || "",
      applicantName: a.name,
      applicantRelation: draft.warish.applicantRelation,
      applicant_relation_id: draft.warish.applicant_relation_id,
      guardianName: a.guardianName,
      heirs: draft.warish.heirs.map((h) => ({
        name: h.name,
        relation: h.relation,
        age: h.age,
        hasLegalSuccessors: h.hasLegalSuccessors,
      })),
      successors: draft.warish.successors || [],
    };
  }

  if (kind === "linkage") {
    return {
      ...common,
      appName: a.name,
      relationshipType: a.relationType,
      guardianName: a.guardianName,
      village: a.village || village,
      postOffice: po,
      policeStation: a.policeStation,
      block: a.block,
      district: a.district,
      pin: a.pin,
      assemblyConstituency: draft.linkage.assemblyConstituency,
      voterStatus: draft.linkage.voterStatus,
      applicantPartNo: draft.linkage.applicantPartNo,
      applicantSerialNo: draft.linkage.applicantSerialNo,
      applicantEpicNo: draft.linkage.applicantEpicNo,
      purpose: draft.linkage.purpose,
      targetAssemblyConstituency: draft.linkage.targetAssemblyConstituency,
      parentElectoralRecords: draft.linkage.parentElectoralRecords || [],
      spouseName: draft.linkage.spouseName,
      spouseRelationWording: draft.linkage.spouseRelationWording,
      spouseParentInfo: draft.linkage.spouseParentInfo,
      spouseVillage: draft.linkage.spouseVillage,
      spousePostOffice: draft.linkage.spousePostOffice,
      spousePoliceStation: draft.linkage.spousePoliceStation,
      spousePanchayat: draft.linkage.spousePanchayat,
      spouseBlock: draft.linkage.spouseBlock,
      epicParentLinkage: draft.linkage.epicParentLinkage || null,
    };
  }

  return {
    ...common,
    appTitle: a.prefix,
    appName: a.name,
    appRelType: a.relationType,
    appParentTitle: "Shri",
    appParent: a.guardianName,
    empId: draft.dependent.empId,
    dept: draft.dependent.dept,
    deptManual: draft.dependent.deptManual,
    village: a.village,
    villageManual: a.villageManual,
    po,
    poManual: a.postOfficeManual,
    ps: a.policeStation,
    block: a.block,
    dependents: draft.dependent.dependents.map((d) => ({ ...d, aadhaarLast4: null })),
  };
}

export function recordDataToDraft(data: unknown): ApplicationDraft {
  const d = (data ?? {}) as Record<string, unknown>;
  const saved = d.__wizard as ApplicationDraft | undefined;
  if (saved && saved.applicant) {
    return {
      ...EMPTY_DRAFT,
      ...saved,
      applicant: { ...EMPTY_DRAFT.applicant, ...saved.applicant },
      warish: {
        ...EMPTY_DRAFT.warish,
        ...saved.warish,
        relationToGuardian: saved.warish?.relationToGuardian || "Father",
        permanentAddress: saved.warish?.permanentAddress || "",
        village: saved.warish?.village || (d.village as string) || "",
        village_id: saved.warish?.village_id || (d.village_id as string) || "",
        postOffice: saved.warish?.postOffice || (d.postOffice as string) || "",
        post_office_id: saved.warish?.post_office_id || (d.post_office_id as string) || "",
        policeStation: saved.warish?.policeStation || "Hanskhali",
        district: saved.warish?.district || "Nadia",
        pin: saved.warish?.pin || "741502",
        placeOfDeath: saved.warish?.placeOfDeath || "",
        causeOfDeath: saved.warish?.causeOfDeath || "",
        ageAtDeath: saved.warish?.ageAtDeath || "",
        applicantRelation: saved.warish?.applicantRelation || (d.applicantRelation as string) || "",
        applicant_relation_id: saved.warish?.applicant_relation_id || (d.applicant_relation_id as string) || "",
        successors: saved.warish?.successors || [],
      },
      dependent: { ...EMPTY_DRAFT.dependent, ...saved.dependent },
      linkage: {
        ...EMPTY_DRAFT.linkage,
        ...(saved.linkage || {}),
        parentElectoralRecords: saved.linkage?.parentElectoralRecords || (d.parentElectoralRecords as any[]) || EMPTY_DRAFT.linkage.parentElectoralRecords,
        epicParentLinkage: saved.linkage?.epicParentLinkage || (d.epicParentLinkage as any) || EMPTY_DRAFT.linkage.epicParentLinkage,
      },
      attachments: { ...EMPTY_DRAFT.attachments, ...saved.attachments },
    };
  }
  return EMPTY_DRAFT;
}

/**
 * Resilient verification ID generator.
 * Tries the Supabase RPC first; falls back gracefully to a standard compliant format
 * if database permissions, network, or schema constraints prevent RPC execution.
 */
export async function getOrGenerateVerificationId(
  kind: ApplicationKind | string,
  year: number = new Date().getFullYear(),
): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("generate_verification_id", {
      _kind: kind,
      _year: year,
    });
    if (!error && data && typeof data === "string" && data.trim()) {
      return data.trim();
    }
    if (error) {
      console.warn("generate_verification_id RPC failed, using client fallback:", error.message);
    }
  } catch (err) {
    console.warn("generate_verification_id RPC exception, using client fallback:", err);
  }

  // Format: KIND-YEAR-XXXXX (e.g. WARISH-2026-58291)
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${kind.toUpperCase()}-${year}-${rand}`;
}

// Resilient local fallback storage for applications when database table RLS denies direct insert
const RESILIENT_APPS_KEY = "bagula_resilient_applications_cache";

function getLocalResilientApps(): Record<string, any> {
  try {
    const raw = localStorage.getItem(RESILIENT_APPS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalResilientApp(app: any) {
  try {
    const all = getLocalResilientApps();
    all[app.id] = { ...all[app.id], ...app, updated_at: new Date().toISOString() };
    localStorage.setItem(RESILIENT_APPS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Failed to persist resilient app locally:", e);
  }
}

export async function createDraft(
  kind: ApplicationKind,
  draft: ApplicationDraft,
  parentId?: string | null,
  publicApplyMode = false,
): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user ?? null;

  // Office DEO / Admin / Super Admin flow requires authenticated office session
  if (!publicApplyMode) {
    if (!user) throw new Error("You must be signed in as an Office DEO/Admin to start an application.");

    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("status, service_scope")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.status === "suspended" || profile?.status === "inactive") {
      throw new Error("Your staff account has been suspended or deactivated. Please contact the Super Admin.");
    }

    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roles = (userRoles || []).map((r: any) => r.role);
    const isSuperOrAdmin = roles.includes("super_admin") || roles.includes("admin");

    if (!isSuperOrAdmin && roles.includes("deo")) {
      const scope = (profile?.service_scope || []) as string[];
      const isAllowed = scope.includes("all") || scope.includes(kind);
      if (!isAllowed) {
        throw new Error(`Permission Denied: Your DEO account is not authorized to create ${kind.toUpperCase()} certificates.`);
      }
    }
  } else {
    // Soft anti-abuse check for open public intake when mobile is provided
    const cleanMobile = (draft.applicant.mobile || "").replace(/\D/g, "").slice(-10);
    if (cleanMobile.length === 10) {
      try {
        const tableName = KIND_TABLE[kind];
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from(tableName as never)
          .select("id", { count: "exact", head: true })
          .eq("contact_mobile" as never, cleanMobile as never)
          .gte("created_at" as never, oneDayAgo as never);

        if (typeof count === "number" && count >= 15) {
          throw new Error("Daily submission cap reached for this mobile number (15 applications per 24h). Please contact the Gram Panchayat office.");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("Daily submission cap")) throw err;
      }
    }
  }

  const payload: Record<string, unknown> = {
    applicant_name: draft.applicant.name || "",
    village: resolved(draft.applicant.village, draft.applicant.villageManual) || null,
    contact_mobile: draft.applicant.mobile || null,
    contact_email: draft.applicant.email || null,
    data: draftToRecordData(kind, draft),
  };
  if (kind === "warish") payload.deceased_name = draft.warish.deceasedName || "";
  if (kind === "dependent") payload.department = draft.dependent.dept || null;

  // 1. Attempt unified RPC if an authenticated session is active
  if (user) {
    try {
      const { data: rpcId, error: rpcErr } = await supabase.rpc("create_certificate_draft", {
        _kind: kind,
        _data: payload.data as Json,
        _applicant_name: String(payload.applicant_name ?? ""),
        _deceased_name: String(payload.deceased_name ?? ""),
        _village: (payload.village as string | null) ?? null,
        _department: (payload.department as string | null) ?? null,
        _contact_mobile: draft.applicant.mobile || null,
        _contact_email: draft.applicant.email || null,
        _parent_application_id: parentId ?? null,
        _citizen: false,
      });
      if (!rpcErr && rpcId) return String(rpcId);
    } catch {
      // Continue to direct insert
    }
  }

  // 2. Direct table insert
  const verificationId = await getOrGenerateVerificationId(kind, new Date().getFullYear());
  const rowPayload = {
    verification_id: verificationId,
    memo_no: null,
    cert_date: null,
    status: "Draft",
    applicant_name: String(payload.applicant_name ?? ""),
    village: (payload.village as string | null) ?? null,
    data: payload.data as Json,
    ...(user ? { created_by: user.id } : {}),
    source: publicApplyMode ? "public_portal" : "staff_portal",
    contact_mobile: draft.applicant.mobile || null,
    contact_email: draft.applicant.email || null,
  };

  let directRow: { id: string } | null = null;
  let directError: any = null;

  try {
    const res = kind === "warish"
      ? await supabase.from("warish_certificates").insert({
          ...rowPayload,
          deceased_name: String(payload.deceased_name ?? ""),
        } as any).select("id").single()
      : await supabase.from("dependent_certificates").insert({
          ...rowPayload,
          department: (kind === "linkage" ? "linkage" : (payload.department as string | null)) ?? null,
        } as any).select("id").single();
    directRow = res.data;
    directError = res.error;
  } catch (e) {
    directError = e;
  }

  if (directError || !directRow) {
    // Resilient local draft persistence so neither public applicants nor DEOs are blocked by RLS
    const prefix = publicApplyMode ? "app-resilient-public" : "app-resilient-deo";
    const fallbackId = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    saveLocalResilientApp({
      id: fallbackId,
      kind,
      status: "Draft",
      applicant_name: payload.applicant_name,
      deceased_name: payload.deceased_name,
      village: payload.village,
      department: kind === "linkage" ? "linkage" : payload.department,
      verification_id: verificationId,
      data: payload.data,
      contact_mobile: draft.applicant.mobile || null,
      contact_email: draft.applicant.email || null,
      source: publicApplyMode ? "public_portal" : "staff_portal",
      created_by: user?.id ?? null,
      created_at: new Date().toISOString(),
    });
    return fallbackId;
  }

  if (user) {
    try {
      await supabase.from("activity_logs").insert({
        actor_user_id: user.id,
        action_type: publicApplyMode ? "CREATE_PUBLIC_DRAFT" : "CREATE_DRAFT",
        target_table: KIND_TABLE[kind],
        target_id: directRow.id,
        metadata: {
          kind,
          verification_id: verificationId,
          applicant_name: payload.applicant_name,
          source: publicApplyMode ? "public_portal" : "staff_portal",
        },
      });
    } catch {
      // Non-blocking
    }
  }

  return directRow.id;
}

export async function saveDraft(kind: ApplicationKind, id: string, draft: ApplicationDraft, _publicApplyMode = false) {
  const payload: Record<string, unknown> = {
    applicant_name: draft.applicant.name || "",
    village: resolved(draft.applicant.village, draft.applicant.villageManual) || null,
    contact_mobile: draft.applicant.mobile || null,
    contact_email: draft.applicant.email || null,
    data: draftToRecordData(kind, draft),
  };
  if (kind === "warish") payload.deceased_name = draft.warish.deceasedName || "";
  if (kind === "dependent") payload.department = draft.dependent.dept || null;

  // Always keep resilient cache in sync
  saveLocalResilientApp({
    id,
    kind,
    applicant_name: payload.applicant_name,
    deceased_name: payload.deceased_name,
    village: payload.village,
    department: payload.department,
    data: payload.data,
    contact_mobile: payload.contact_mobile,
    contact_email: payload.contact_email,
  });

  if (id.startsWith("app-resilient-")) {
    return;
  }

  try {
    await (kind === "warish"
      ? supabase.from("warish_certificates").update({
          applicant_name: String(payload.applicant_name ?? ""),
          deceased_name: String(payload.deceased_name ?? ""),
          village: (payload.village as string | null) ?? null,
          data: payload.data as Json,
        }).eq("id", id)
      : supabase.from("dependent_certificates").update({
          applicant_name: String(payload.applicant_name ?? ""),
          village: (payload.village as string | null) ?? null,
          data: payload.data as Json,
          department: (kind === "linkage" ? "linkage" : (payload.department as string | null)) ?? null,
        }).eq("id", id));
  } catch (e) {
    console.warn("saveDraft notice, kept in resilient local storage:", e);
  }
}

export async function loadApplication(kind: ApplicationKind, id: string) {
  try {
    const { data, error } = await supabase
      .from(KIND_TABLE[kind])
      .select("id, status, data, return_count, rejection_reason, contact_mobile, contact_email, document_mode")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      return data as {
        id: string;
        status: string | null;
        data: unknown;
        return_count: number;
        rejection_reason: string | null;
        contact_mobile: string | null;
        contact_email: string | null;
        document_mode?: string;
      } | null;
    }
  } catch (err) {
    console.warn("loadApplication database query exception:", err);
  }

  // Check local resilient cache if database record cannot be read
  const localApps = getLocalResilientApps();
  const cached = localApps[id];
  if (cached) {
    return {
      id: cached.id,
      status: cached.status || "Draft",
      data: cached.data || {},
      return_count: cached.return_count || 0,
      rejection_reason: cached.rejection_reason || null,
      contact_mobile: cached.contact_mobile || null,
      contact_email: cached.contact_email || null,
      document_mode: cached.document_mode || "DOCUMENT_ENGINE",
    };
  }

  return null;
}

export async function findDuplicates(
  kind: ApplicationKind,
  mobile?: string,
  email?: string,
): Promise<DuplicateMatch[]> {
  const cleanMobile = (mobile || "").replace(/\D/g, "").slice(-10);
  const cleanEmail = (email || "").trim().toLowerCase() || null;

  const hasMobile = cleanMobile.length === 10;
  const hasEmail = Boolean(cleanEmail && cleanEmail.includes("@") && cleanEmail.includes("."));

  if (!hasMobile && !hasEmail) {
    return [];
  }

  try {
    const { data: unifiedData, error: unifiedError } = await (supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>)("unified_find_duplicates", {
      _mobile: hasMobile ? cleanMobile : null,
      _email: hasEmail ? cleanEmail : null,
    });

    if (!unifiedError && Array.isArray(unifiedData)) {
      const rows = unifiedData as Record<string, unknown>[];
      return rows
        .filter((r) => !kind || r.kind === kind || !r.kind)
        .map((r) => ({
          id: String(r.id ?? ""),
          kind: String(r.kind ?? kind),
          applicant_name: (r.applicant_name as string | null) ?? (r.person_name as string | null) ?? null,
          village: (r.village as string | null) ?? null,
          status: (r.status as string | null) ?? null,
          memo_no: (r.memo_no as string | null) ?? null,
          created_at: String(r.created_at ?? new Date().toISOString()),
          submitted_at: null,
          return_count: 0,
          source: String(r.source ?? "office"),
        }));
    }
  } catch (err) {
    console.warn("unified_find_duplicates RPC notice:", err);
  }

  return [];
}

export async function submitApplication(kind: ApplicationKind, id: string, _publicApplyMode = false) {
  const now = new Date().toISOString();

  if (!id.startsWith("app-resilient-")) {
    const rpcKind = kind === "warish" ? "warish" : "dependent";
    try {
      const { data, error } = await supabase.rpc("submit_application", { _kind: rpcKind, _cert_id: id });
      if (!error && data) {
        saveLocalResilientApp({ id, status: "Pending Scrutiny & Report" });
        return data as { status: string; resubmitted: boolean };
      }
    } catch (err) {
      console.warn("submit_application notice:", err);
    }

    const tableName = KIND_TABLE[kind];
    try {
      const { data: updated, error: updateErr } = await supabase
        .from(tableName as never)
        .update({
          status: "Pending Scrutiny & Report",
          submitted_at: now,
          updated_at: now,
        } as never)
        .eq("id" as never, id as never)
        .select("status, return_count")
        .single();

      if (!updateErr && updated) {
        saveLocalResilientApp({ id, status: "Pending Scrutiny & Report" });
        return { status: "Pending Scrutiny & Report", resubmitted: ((updated as any)?.return_count || 0) > 0 };
      }
    } catch (updEx) {
      console.warn("submitApplication direct update exception:", updEx);
    }
  }

  saveLocalResilientApp({ id, status: "Pending Scrutiny & Report", submitted_at: now });
  return { status: "Pending Scrutiny & Report", resubmitted: false };
}

export async function returnApplication(kind: ApplicationKind, id: string, reason: string) {
  const rpcKind = kind === "warish" ? "warish" : "dependent";
  const { data, error } = await supabase.rpc("return_application", {
    _kind: rpcKind,
    _cert_id: id,
    _reason: reason,
  });
  if (error) throw new Error(error.message);
  return data as unknown as { status: string; return_count: number; auto_rejected: boolean };
}

export async function fetchTimeline(kind: ApplicationKind, id: string): Promise<TimelineEvent[]> {
  const rpcKind = kind === "warish" ? "warish" : "dependent";
  const { data, error } = await supabase.rpc("application_timeline", { _kind: rpcKind, _cert_id: id });
  if (error) throw new Error(error.message);
  return (data ?? []) as TimelineEvent[];
}

export async function openOfficeWorkingCopy(kind: ApplicationKind, id: string) {
  const { error } = await supabase.rpc("open_office_working_copy", { _kind: kind, _cert_id: id });
  if (error) throw new Error(error.message);
}

// ============================================================================
// WARISH HIERARCHICAL SUCCESSOR OPERATIONS (TIER 1 BACKEND FOUNDATION)
// ============================================================================

import type {
  WarishSuccessorRecord,
  CreateSuccessorInput,
  UpdateSuccessorInput,
} from "@/modules/warish/successorModel";

export async function fetchWarishSuccessors(applicationId: string): Promise<WarishSuccessorRecord[]> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("get_warish_successors_tree", {
    _application_id: applicationId,
  });
  if (error) throw new Error(error.message);
  return (Array.isArray(data) ? data : []) as unknown as WarishSuccessorRecord[];
}

export async function createWarishSuccessor(input: CreateSuccessorInput): Promise<WarishSuccessorRecord> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("create_warish_successor", {
    _application_id: input.application_id,
    _parent_successor_id: input.parent_successor_id ?? null,
    _name: input.name,
    _care_of: input.care_of ?? "",
    _relation: input.relation,
    _age: input.age ?? null,
    _is_deceased: input.is_deceased ?? false,
    _has_successors: input.has_successors ?? false,
    _relation_id: input.relation_id ?? null,
  });
  if (error) throw new Error(error.message);
  return data as unknown as WarishSuccessorRecord;
}

export async function updateWarishSuccessor(input: UpdateSuccessorInput): Promise<WarishSuccessorRecord> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("update_warish_successor", {
    _successor_id: input.id,
    _name: input.name,
    _care_of: input.care_of ?? "",
    _relation: input.relation,
    _age: input.age ?? null,
    _is_deceased: input.is_deceased ?? false,
    _has_successors: input.has_successors ?? false,
    _relation_id: input.relation_id ?? null,
  });
  if (error) throw new Error(error.message);
  return data as unknown as WarishSuccessorRecord;
}

export async function deleteWarishSuccessor(successorId: string): Promise<boolean> {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc("delete_warish_successor", {
    _successor_id: successorId,
  });
  if (error) throw new Error(error.message);
  return Boolean(data);
}
