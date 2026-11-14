export type FamilyTreeLanguage = "bn" | "en";

export type FamilyTreePrintMode = "preprinted_pad" | "full_letterhead";

export interface FamilyNode {
  id: string;
  name: string;
  spouseName?: string;
  voterId?: string;
  relationLabel: string;
  children: FamilyNode[];
}

export interface FamilyTreeRecord {
  id: string;
  memo_no: string | null;
  applicant_name: string;
  head_name: string;
  head_voter_id: string | null;
  sansad_no: string | null;
  language: FamilyTreeLanguage;
  top_offset_mm: number;
  tree_data: FamilyNode;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyTreeDraftPayload {
  memo_no: string | null;
  applicant_name: string;
  head_name: string;
  head_voter_id: string | null;
  sansad_no: string | null;
  language: FamilyTreeLanguage;
  top_offset_mm: number;
  tree_data: FamilyNode;
}
