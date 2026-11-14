import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { normalizeFamilyTree } from "./treeOperations";
import { FamilyTreeDraftPayload, FamilyTreeLanguage, FamilyTreeRecord } from "./types";

function sanitizeSearchTerm(input: string): string {
  // Strip PostgREST `.or()` delimiter characters to prevent filter injection
  return input.trim().replace(/[,()*%]/g, " ").replace(/\s+/g, " ");
}

function mapRowToRecord(row: Record<string, unknown>): FamilyTreeRecord {
  const lang: FamilyTreeLanguage = row.language === "en" ? "en" : "bn";
  const offset =
    typeof row.top_offset_mm === "number"
      ? Math.min(80, Math.max(0, Math.round(row.top_offset_mm)))
      : 0;

  return {
    id: String(row.id),
    memo_no: typeof row.memo_no === "string" ? row.memo_no : null,
    applicant_name: typeof row.applicant_name === "string" ? row.applicant_name : "",
    head_name: typeof row.head_name === "string" ? row.head_name : "",
    head_voter_id: typeof row.head_voter_id === "string" ? row.head_voter_id : null,
    sansad_no: typeof row.sansad_no === "string" ? row.sansad_no : null,
    language: lang,
    top_offset_mm: offset,
    tree_data: normalizeFamilyTree(row.tree_data, typeof row.head_name === "string" ? row.head_name : ""),
    created_by: typeof row.created_by === "string" ? row.created_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : new Date().toISOString(),
  };
}

export function assertSupabaseAvailable(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase backend keys are not configured. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to persist family tree records."
    );
  }
}

export async function searchFamilyTrees(searchQuery = ""): Promise<FamilyTreeRecord[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  let query = supabase
    .from("family_trees")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);

  const clean = sanitizeSearchTerm(searchQuery);
  if (clean.length > 0) {
    const pattern = `%${clean}%`;
    query = query.or(
      `head_voter_id.ilike.${pattern},head_name.ilike.${pattern},memo_no.ilike.${pattern},applicant_name.ilike.${pattern}`
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load saved family tree records.");
  }

  return (data ?? []).map((row) => mapRowToRecord(row as unknown as Record<string, unknown>));
}

export async function getFamilyTreeById(id: string): Promise<FamilyTreeRecord | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from("family_trees")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Failed to fetch family tree record.");
  }

  return data ? mapRowToRecord(data as unknown as Record<string, unknown>) : null;
}

export async function createFamilyTree(payload: FamilyTreeDraftPayload): Promise<FamilyTreeRecord> {
  assertSupabaseAvailable();

  const { data: userData } = await supabase.auth.getUser();
  const clampedOffset = Math.min(80, Math.max(0, Math.round(payload.top_offset_mm)));

  const { data, error } = await supabase
    .from("family_trees")
    .insert({
      memo_no: payload.memo_no?.trim() || null,
      applicant_name: payload.applicant_name.trim(),
      head_name: payload.head_name.trim(),
      head_voter_id: payload.head_voter_id?.trim().toUpperCase() || null,
      sansad_no: payload.sansad_no?.trim() || null,
      language: payload.language,
      top_offset_mm: clampedOffset,
      tree_data: payload.tree_data as unknown as Json,
      created_by: userData.user?.id ?? null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to save family tree record to Supabase.");
  }

  return mapRowToRecord(data as unknown as Record<string, unknown>);
}

export async function updateFamilyTree(
  id: string,
  payload: FamilyTreeDraftPayload
): Promise<FamilyTreeRecord> {
  assertSupabaseAvailable();

  const clampedOffset = Math.min(80, Math.max(0, Math.round(payload.top_offset_mm)));

  const { data, error } = await supabase
    .from("family_trees")
    .update({
      memo_no: payload.memo_no?.trim() || null,
      applicant_name: payload.applicant_name.trim(),
      head_name: payload.head_name.trim(),
      head_voter_id: payload.head_voter_id?.trim().toUpperCase() || null,
      sansad_no: payload.sansad_no?.trim() || null,
      language: payload.language,
      top_offset_mm: clampedOffset,
      tree_data: payload.tree_data as unknown as Json,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update family tree record.");
  }

  return mapRowToRecord(data as unknown as Record<string, unknown>);
}

export async function deleteFamilyTree(id: string): Promise<void> {
  assertSupabaseAvailable();

  const { error } = await supabase.from("family_trees").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "Failed to delete family tree record.");
  }
}
