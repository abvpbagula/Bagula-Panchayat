-- ============================================================================
-- MIGRATION: 20270923000000_create_family_trees.sql
-- Purpose: Bilingual Family Tree (বংশতালিকা) records for Bagula 2 No. GP
--          with staff-only RLS policies and quick-lookup indexes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.family_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memo_no text,
  applicant_name text NOT NULL,
  head_name text NOT NULL,
  head_voter_id text,
  sansad_no text,
  language text NOT NULL DEFAULT 'bn' CHECK (language IN ('bn', 'en')),
  top_offset_mm integer NOT NULL DEFAULT 0 CHECK (top_offset_mm >= 0 AND top_offset_mm <= 80),
  tree_data jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lookup & search indexes
CREATE INDEX IF NOT EXISTS idx_family_trees_head_voter_id
  ON public.family_trees (head_voter_id);

CREATE INDEX IF NOT EXISTS idx_family_trees_head_name
  ON public.family_trees (head_name);

CREATE INDEX IF NOT EXISTS idx_family_trees_memo_no
  ON public.family_trees (memo_no);

CREATE INDEX IF NOT EXISTS idx_family_trees_updated_at
  ON public.family_trees (updated_at DESC);

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.trg_family_trees_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_family_trees_updated_at ON public.family_trees;
CREATE TRIGGER set_family_trees_updated_at
  BEFORE UPDATE ON public.family_trees
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_family_trees_set_updated_at();

-- Enable Row Level Security (staff-only access)
ALTER TABLE public.family_trees ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.family_trees FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.family_trees TO authenticated;
GRANT ALL ON TABLE public.family_trees TO service_role;

DROP POLICY IF EXISTS family_trees_staff_select ON public.family_trees;
CREATE POLICY family_trees_staff_select ON public.family_trees
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS family_trees_staff_insert ON public.family_trees;
CREATE POLICY family_trees_staff_insert ON public.family_trees
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS family_trees_staff_update ON public.family_trees;
CREATE POLICY family_trees_staff_update ON public.family_trees
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

DROP POLICY IF EXISTS family_trees_staff_delete ON public.family_trees;
CREATE POLICY family_trees_staff_delete ON public.family_trees
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'deo')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );

NOTIFY pgrst, 'reload schema';
