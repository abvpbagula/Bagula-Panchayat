import { supabase } from "@/integrations/supabase/client";

export type NoticeCategory =
  | "general"
  | "birth_death"
  | "tenders"
  | "meetings"
  | "schemes"
  | "tax"
  | "emergency";

export type NoticePriority = "urgent" | "high" | "normal" | "low";

export interface GpDepartmentInfo {
  id: string;
  name: string;
  name_bn: string;
  code: string;
  desk: string;
  colorClass: string;
}

export interface Notice {
  id: string;
  notice_no?: string | null;
  title: string;
  category: NoticeCategory | string;
  department?: string | null;
  department_bn?: string | null;
  content: string;
  published_at: string;
  effective_date: string;
  expiry_date?: string | null;
  is_pinned: boolean;
  is_published: boolean;
  priority: NoticePriority;
  target_audience: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size_bytes?: number | null;
  created_by?: string | null;
  created_by_name?: string | null;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const GP_DEPARTMENTS: Record<string, GpDepartmentInfo> = {
  civil_registration: {
    id: "civil_registration",
    name: "Civil Registration & Vital Statistics Department",
    name_bn: "নাগরিক ও জন্ম-মৃত্যু নিবন্ধন বিভাগ",
    code: "GP-CRVS",
    desk: "Counter #2 (Sub-Registrar Desk)",
    colorClass: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200",
  },
  warish_succession: {
    id: "warish_succession",
    name: "Succession, Legal Heir & Citizen Welfare Department",
    name_bn: "ওয়ারিশান, উত্তরাধিকার ও নাগরিক পরিষেবা শাখা",
    code: "GP-WARISH",
    desk: "Counter #1 (Warish & Mutation Desk)",
    colorClass: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200",
  },
  revenue_tax: {
    id: "revenue_tax",
    name: "Revenue, Assessment & Property Tax Department (PRD Tax)",
    name_bn: "রাজস্ব, কর নির্ধারণ ও পঞ্চায়েত তহবিল শাখা",
    code: "GP-REV",
    desk: "Counter #3 (Revenue & Tax Desk)",
    colorClass: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200",
  },
  engineering_nirman: {
    id: "engineering_nirman",
    name: "Rural Infrastructure & Engineering (Nirman) Department",
    name_bn: "পূর্ত, নির্মাণ ও গ্রামীণ পরিকাঠামো শাখা",
    code: "GP-NIRMAN",
    desk: "Engineering Section (Nirman Sahayak)",
    colorClass: "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200",
  },
  social_welfare_nrega: {
    id: "social_welfare_nrega",
    name: "Social Welfare, 100 Days & Rural Employment Department",
    name_bn: "সমাজকল্যাণ ও ১০০ দিনের কাজ শাখা (MGNREGA)",
    code: "GP-MGNREGA",
    desk: "Welfare & GRS Section",
    colorClass: "bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950 dark:text-teal-200",
  },
  administration: {
    id: "administration",
    name: "Executive Secretariat & General Administration Department",
    name_bn: "সাধারণ প্রশাসন ও কার্যনির্বাহী সচিবালয়",
    code: "GP-ADMIN",
    desk: "Executive Assistant & Pradhan Chamber",
    colorClass: "bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200",
  },
};

export function getNoticeGpDepartment(notice?: {
  department?: string | null;
  department_bn?: string | null;
  category?: string | null;
  created_by_name?: string | null;
  title?: string | null;
}): GpDepartmentInfo {
  if (!notice) return GP_DEPARTMENTS.administration;

  if (notice.department) {
    const match = Object.values(GP_DEPARTMENTS).find(
      (d) => d.name.toLowerCase() === notice.department?.toLowerCase() || d.id === notice.department
    );
    if (match) return match;
    return {
      id: "custom",
      name: notice.department,
      name_bn: notice.department_bn || notice.department,
      code: "GP-DEPT",
      desk: "Bagula II GP Office Desk",
      colorClass: "bg-slate-100 text-slate-800 border-slate-300",
    };
  }

  const cat = (notice.category || "").toLowerCase();
  const issuer = (notice.created_by_name || "").toLowerCase();
  const title = (notice.title || "").toLowerCase();

  if (cat === "birth_death" || title.includes("birth") || title.includes("death") || issuer.includes("sub-registrar")) {
    return GP_DEPARTMENTS.civil_registration;
  }
  if (title.includes("warish") || title.includes("succession") || title.includes("dependent") || title.includes("heir")) {
    return GP_DEPARTMENTS.warish_succession;
  }
  if (cat === "tax" || title.includes("tax") || title.includes("holding") || issuer.includes("tax collector")) {
    return GP_DEPARTMENTS.revenue_tax;
  }
  if (cat === "tenders" || title.includes("trade") || title.includes("tender") || title.includes("road") || issuer.includes("nirman")) {
    return GP_DEPARTMENTS.engineering_nirman;
  }
  if (cat === "schemes" || title.includes("nrega") || title.includes("100 days") || issuer.includes("grs")) {
    return GP_DEPARTMENTS.social_welfare_nrega;
  }
  return GP_DEPARTMENTS.administration;
}

const LOCAL_NOTICES_KEY = "bagula2_notices_cache";

export const DEFAULT_NOTICES: Notice[] = [
  {
    id: "notice-default-1",
    notice_no: "B-II/GP/BIRTH/2026/04",
    title: "Special Schedule for Birth & Death Certificate Digitalization at Bagula II GP Office",
    category: "birth_death",
    department: "Civil Registration & Vital Statistics Department",
    department_bn: "নাগরিক ও জন্ম-মৃত্যু নিবন্ধন বিভাগ",
    content:
      "Applications for offline legacy Birth & Death Certificate digitization will be received exclusively on the 1st Tuesday and 1st Wednesday of every month. Maximum processing quota is 100 applications per day (total 300 applications per monthly cycle). Citizens are advised to bring original hospital discharge certificates, immunization cards, child/parent Aadhaar, and parent EPIC (Voter ID) cards.",
    is_pinned: true,
    is_published: true,
    priority: "urgent",
    target_audience: "citizens",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    created_by_name: "Executive Assistant & Sub-Registrar, Bagula-II GP",
  },
  {
    id: "notice-default-2",
    notice_no: "B-II/GP/GS/2026/18",
    title: "Annual Gram Sansad & Gram Sabha General Assembly Meeting 2026",
    category: "meetings",
    department: "Executive Secretariat & General Administration Department",
    department_bn: "সাধারণ প্রশাসন ও কার্যনির্বাহী সচিবালয়",
    content:
      "All adult residents, booth representatives, and self-help group coordinators of Bagula II Gram Panchayat are cordially invited to attend the Annual Gram Sansad deliberations regarding village road repairs, drainage planning, drinking water tap connections under Jal Jeevan Mission, and MGNREGA annual labor budget approval.",
    is_pinned: true,
    is_published: true,
    priority: "high",
    target_audience: "all",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    created_by_name: "Pradhan, Bagula-II GP",
  },
  {
    id: "notice-default-3",
    notice_no: "B-II/GP/TAX/2026/22",
    title: "Panchayat Property & Holding Tax (PRD Tax) Assessment & Collection Camp",
    category: "tax",
    department: "Revenue, Assessment & Property Tax Department (PRD Tax)",
    department_bn: "রাজস্ব, কর নির্ধারণ ও পঞ্চায়েত তহবিল শাখা",
    content:
      "Citizens can now clear their pending Panchayati Raj Property & Holding Taxes online via the PRD Tax gateway or directly at the Gram Panchayat revenue collection desk. Instant computerized QR-verifiable payment receipts are issued upon clearance.",
    is_pinned: false,
    is_published: true,
    priority: "normal",
    target_audience: "citizens",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    created_by_name: "Tax Collector, Bagula-II GP",
  },
  {
    id: "notice-default-4",
    notice_no: "B-II/GP/TRADE/2026/31",
    title: "Commercial Trade License (Pro-Prampatra) Renewal & Fresh Registration Notice",
    category: "general",
    department: "Rural Infrastructure & Engineering (Nirman) Department",
    department_bn: "পূর্ত, নির্মাণ ও গ্রামীণ পরিকাঠামো শাখা",
    content:
      "All commercial shops, wholesale dealerships, and service centers operating within Bagula II Gram Panchayat limits are required to register or renew their trade licenses (Pro-Prampatra) through the West Bengal Panchayat Management System (WBPMS). Free assistance kiosk is active on all working days.",
    is_pinned: false,
    is_published: true,
    priority: "normal",
    target_audience: "business",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    created_by_name: "Nirman Sahayak, Bagula-II GP",
  },
  {
    id: "notice-default-5",
    notice_no: "B-II/GP/NREGA/2026/12",
    title: "MGNREGA 100 Days Work Social Audit & Aadhaar-Based Payment (ABPS) Drive",
    category: "schemes",
    department: "Social Welfare, 100 Days & Rural Employment Department",
    department_bn: "সমাজকল্যাণ ও ১০০ দিনের কাজ শাখা (MGNREGA)",
    content:
      "Special verification of MGNREGA Job Card holders and DBT bank account seeding is ongoing across all 30 election booths. Registered workers are requested to verify their bank details and active status with their respective ward representatives.",
    is_pinned: false,
    is_published: true,
    priority: "normal",
    target_audience: "farmers",
    effective_date: new Date().toISOString().slice(0, 10),
    published_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    created_by_name: "Gram Rozgar Sahayak (GRS), Bagula-II GP",
  },
];

function getStoredLocalNotices(): Notice[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTICES_KEY);
    if (!raw) return DEFAULT_NOTICES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // fallback
  }
  return DEFAULT_NOTICES;
}

function saveLocalNotices(notices: Notice[]) {
  try {
    localStorage.setItem(LOCAL_NOTICES_KEY, JSON.stringify(notices));
  } catch {
    // ignore
  }
}

/**
 * Fetch all active, published notices for public viewing.
 */
export async function getActiveNotices(category?: string): Promise<Notice[]> {
  try {
    // 1. Try dedicated public.notices table
    const query = supabase
      .from("notices" as any)
      .select("*")
      .eq("is_published", true)
      .is("archived_at", null)
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (category && category !== "all") {
      query.eq("category", category);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data) && data.length > 0) {
      const nowMs = Date.now();
      const filtered = (data as Notice[]).filter((n) => {
        if (!n.expiry_date) return true;
        return new Date(n.expiry_date).getTime() > nowMs;
      });
      if (filtered.length > 0) {
        saveLocalNotices(filtered);
        return filtered;
      }
    }
  } catch (err) {
    console.warn("Supabase notices query exception, falling back:", err);
  }

  // 2. Fallback to local storage or defaults
  const localList = getStoredLocalNotices();
  let filtered = localList.filter((n) => n.is_published && !n.archived_at);
  if (category && category !== "all") {
    filtered = filtered.filter((n) => n.category === category);
  }
  return filtered.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    if (a.priority === "urgent" && b.priority !== "urgent") return -1;
    if (b.priority === "urgent" && a.priority !== "urgent") return 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
}

/**
 * Fetch all notices (including unpinned, drafts, and archived) for admin management.
 */
export async function getAllAdminNotices(): Promise<Notice[]> {
  try {
    const { data, error } = await supabase
      .from("notices" as any)
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false });

    if (!error && Array.isArray(data) && data.length > 0) {
      saveLocalNotices(data as Notice[]);
      return data as Notice[];
    }
  } catch (err) {
    console.warn("Admin notices query exception:", err);
  }

  return getStoredLocalNotices();
}

/**
 * Save or update notice.
 */
export async function saveNotice(
  payload: Partial<Notice> & { title: string; content: string }
): Promise<{ success: boolean; data?: Notice; error?: string }> {
  try {
    // 1. Try Supabase RPC or direct insert
    if (payload.id && !payload.id.startsWith("notice-default-")) {
      const { data, error } = await supabase
        .from("notices" as any)
        .update({
          title: (payload.title ?? "").trim(),
          notice_no: payload.notice_no?.trim() || null,
          category: payload.category || "general",
          content: (payload.content ?? "").trim(),
          is_pinned: !!payload.is_pinned,
          is_published: payload.is_published !== false,
          priority: payload.priority || "normal",
          attachment_url: payload.attachment_url || null,
          attachment_name: payload.attachment_name || null,
          expiry_date: payload.expiry_date || null,
          target_audience: payload.target_audience || "all",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id)
        .select()
        .single();

      if (!error && data) {
        syncLocalNotice(data as Notice);
        return { success: true, data: data as Notice };
      }
    } else {
      const { data, error } = await supabase
        .from("notices" as any)
        .insert({
          title: (payload.title ?? "").trim(),
          notice_no: payload.notice_no?.trim() || null,
          category: payload.category || "general",
          content: (payload.content ?? "").trim(),
          is_pinned: !!payload.is_pinned,
          is_published: payload.is_published !== false,
          priority: payload.priority || "normal",
          attachment_url: payload.attachment_url || null,
          attachment_name: payload.attachment_name || null,
          expiry_date: payload.expiry_date || null,
          target_audience: payload.target_audience || "all",
        })
        .select()
        .single();

      if (!error && data) {
        syncLocalNotice(data as Notice);
        return { success: true, data: data as Notice };
      }
    }
  } catch (err) {
    console.warn("Supabase saveNotice exception, persisting locally:", err);
  }

  // Local fallback persistence
  const localList = getStoredLocalNotices();
  const now = new Date().toISOString();
  let savedItem: Notice;

  if (payload.id) {
    const idx = localList.findIndex((n) => n.id === payload.id);
    if (idx >= 0) {
      localList[idx] = {
        ...localList[idx],
        ...payload,
        updated_at: now,
      };
      savedItem = localList[idx];
    } else {
      savedItem = {
        id: payload.id,
        title: payload.title,
        content: payload.content,
        category: payload.category || "general",
        is_pinned: !!payload.is_pinned,
        is_published: payload.is_published !== false,
        priority: payload.priority || "normal",
        target_audience: payload.target_audience || "all",
        published_at: now,
        effective_date: now.slice(0, 10),
        created_at: now,
        updated_at: now,
        ...payload,
      };
      localList.unshift(savedItem);
    }
  } else {
    savedItem = {
      id: `notice-local-${Date.now()}`,
      title: payload.title,
      notice_no: payload.notice_no || `B-II/GP/NOTICE/${new Date().getFullYear()}/${Math.floor(10 + Math.random() * 90)}`,
      category: payload.category || "general",
      content: payload.content,
      is_pinned: !!payload.is_pinned,
      is_published: payload.is_published !== false,
      priority: payload.priority || "normal",
      target_audience: payload.target_audience || "all",
      attachment_url: payload.attachment_url || null,
      attachment_name: payload.attachment_name || null,
      expiry_date: payload.expiry_date || null,
      published_at: now,
      effective_date: now.slice(0, 10),
      created_at: now,
      updated_at: now,
      created_by_name: "Gram Panchayat Admin",
    };
    localList.unshift(savedItem);
  }

  saveLocalNotices(localList);
  return { success: true, data: savedItem };
}

function syncLocalNotice(notice: Notice) {
  const local = getStoredLocalNotices();
  const idx = local.findIndex((n) => n.id === notice.id);
  if (idx >= 0) {
    local[idx] = notice;
  } else {
    local.unshift(notice);
  }
  saveLocalNotices(local);
}

/**
 * Toggle pin status.
 */
export async function togglePinNotice(id: string, isPinned: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notices" as any)
      .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("togglePinNotice fallback to local:", err);
  }

  const local = getStoredLocalNotices();
  const item = local.find((n) => n.id === id);
  if (item) {
    item.is_pinned = isPinned;
    item.updated_at = new Date().toISOString();
    saveLocalNotices(local);
  }
  return true;
}

/**
 * Toggle publish status.
 */
export async function togglePublishNotice(id: string, isPublished: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notices" as any)
      .update({ is_published: isPublished, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("togglePublishNotice fallback to local:", err);
  }

  const local = getStoredLocalNotices();
  const item = local.find((n) => n.id === id);
  if (item) {
    item.is_published = isPublished;
    item.updated_at = new Date().toISOString();
    saveLocalNotices(local);
  }
  return true;
}

/**
 * Archive notice.
 */
export async function archiveNotice(id: string): Promise<boolean> {
  const now = new Date().toISOString();
  try {
    const { error } = await supabase
      .from("notices" as any)
      .update({ archived_at: now, updated_at: now })
      .eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("archiveNotice fallback to local:", err);
  }

  const local = getStoredLocalNotices();
  const item = local.find((n) => n.id === id);
  if (item) {
    item.archived_at = now;
    saveLocalNotices(local);
  }
  return true;
}

/**
 * Restore archived notice.
 */
export async function restoreNotice(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notices" as any)
      .update({ archived_at: null, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("restoreNotice fallback to local:", err);
  }

  const local = getStoredLocalNotices();
  const item = local.find((n) => n.id === id);
  if (item) {
    item.archived_at = null;
    saveLocalNotices(local);
  }
  return true;
}

/**
 * Delete notice permanently.
 */
export async function deleteNotice(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notices" as any)
      .delete()
      .eq("id", id);
    if (!error) return true;
  } catch (err) {
    console.warn("deleteNotice fallback to local:", err);
  }

  const local = getStoredLocalNotices().filter((n) => n.id !== id);
  saveLocalNotices(local);
  return true;
}
