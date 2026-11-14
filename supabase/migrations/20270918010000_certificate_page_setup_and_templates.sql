-- ==============================================================================
-- Migration: 20270918010000_certificate_page_setup_and_templates.sql
-- Description: Microsoft Word-like Page Setup & Certificate Template Designer
--              Supports Page Size, Margins (mm), Orientation, Header/Footer spacing,
--              Element positioning, Versioning, Immutability, and RBAC governance.
-- ==============================================================================

-- 1. Create table public.certificate_templates
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_kind text NOT NULL CHECK (service_kind IN ('warish', 'dependent', 'linkage')),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'review', 'approved', 'active', 'retired')),
  is_active boolean NOT NULL DEFAULT true,
  page_size_preset text NOT NULL DEFAULT 'a4' CHECK (page_size_preset IN ('a4', 'a5', 'a3', 'letter', 'legal', 'custom')),
  page_width_mm numeric(8,2) NOT NULL DEFAULT 210.00,
  page_height_mm numeric(8,2) NOT NULL DEFAULT 297.00,
  orientation text NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
  margin_top_mm numeric(8,2) NOT NULL DEFAULT 20.00,
  margin_bottom_mm numeric(8,2) NOT NULL DEFAULT 20.00,
  margin_left_mm numeric(8,2) NOT NULL DEFAULT 18.00,
  margin_right_mm numeric(8,2) NOT NULL DEFAULT 18.00,
  margins_linked boolean NOT NULL DEFAULT false,
  header_distance_mm numeric(8,2) NOT NULL DEFAULT 12.00,
  footer_distance_mm numeric(8,2) NOT NULL DEFAULT 12.00,
  scale_mode text NOT NULL DEFAULT 'fit' CHECK (scale_mode IN ('actual', 'fit', 'custom')),
  scale_percent numeric(5,2) NOT NULL DEFAULT 100.00,
  elements_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_asset_url text,
  template_asset_name text,
  revision_number integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text DEFAULT 'Super Admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name text DEFAULT 'Super Admin',
  updated_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz DEFAULT now(),
  activated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  retired_at timestamptz,
  CONSTRAINT uq_cert_template_kind_version UNIQUE (service_kind, version)
);

-- 2. Indexes for efficient lookup of active template per certificate kind
CREATE INDEX IF NOT EXISTS idx_cert_templates_kind_active
  ON public.certificate_templates (service_kind, is_active);

CREATE INDEX IF NOT EXISTS idx_cert_templates_status
  ON public.certificate_templates (service_kind, status);

-- 3. Row Level Security
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.certificate_templates TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.certificate_templates TO authenticated;
GRANT ALL ON public.certificate_templates TO service_role;

-- 4. Policies
-- Public & Authenticated Read: Everyone can read active templates to render or verify certificates
DROP POLICY IF EXISTS "cert_templates_public_read" ON public.certificate_templates;
CREATE POLICY "cert_templates_public_read"
  ON public.certificate_templates
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'deo')
  );

-- Super Admin has full write authority
DROP POLICY IF EXISTS "cert_templates_super_admin_write" ON public.certificate_templates;
CREATE POLICY "cert_templates_super_admin_write"
  ON public.certificate_templates
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
        AND lower(email) IN ('bagula2nogp111@gmail.com', 'nitish374482@gmail.com')
    )
  );

-- 5. Seed default active templates for Warish, Dependent, and Linkage certificates
INSERT INTO public.certificate_templates (
  service_kind, name, version, status, is_active,
  page_size_preset, page_width_mm, page_height_mm, orientation,
  margin_top_mm, margin_bottom_mm, margin_left_mm, margin_right_mm,
  header_distance_mm, footer_distance_mm, scale_mode, scale_percent,
  elements_config, activated_at
)
VALUES
(
  'warish', 'Standard Official Warish Certificate', 1, 'active', true,
  'a4', 210.00, 297.00, 'portrait',
  18.00, 18.00, 16.00, 16.00,
  10.00, 10.00, 'fit', 100.00,
  '{
    "header": { "showEmblem": true, "showTricolor": true, "fontSize": 22, "subTitleSize": 12 },
    "title": { "fontSize": 18, "color": "#1A237E", "underline": true },
    "body": { "fontSize": 12, "lineHeight": 1.6 },
    "table": { "fontSize": 11, "cellPaddingMm": 2 },
    "signatures": { "showWardMember": true, "showProdhan": true, "showUpaProdhan": true, "showSealBox": true },
    "watermark": { "enabled": true, "text": "BAGULA II GRAM PANCHAYAT", "opacity": 0.07 },
    "footer": { "showQrCode": true, "showVerificationMemo": true, "fontSize": 10 }
  }'::jsonb,
  now()
),
(
  'dependent', 'Standard Official Dependent Certificate', 1, 'active', true,
  'a4', 210.00, 297.00, 'portrait',
  18.00, 18.00, 16.00, 16.00,
  10.00, 10.00, 'fit', 100.00,
  '{
    "header": { "showEmblem": true, "showTricolor": true, "fontSize": 22, "subTitleSize": 12 },
    "title": { "fontSize": 18, "color": "#1A237E", "underline": true },
    "body": { "fontSize": 12, "lineHeight": 1.6 },
    "table": { "fontSize": 11, "cellPaddingMm": 2 },
    "signatures": { "showWardMember": true, "showProdhan": true, "showUpaProdhan": true, "showSealBox": true },
    "watermark": { "enabled": true, "text": "BAGULA II GRAM PANCHAYAT", "opacity": 0.07 },
    "footer": { "showQrCode": true, "showVerificationMemo": true, "fontSize": 10 }
  }'::jsonb,
  now()
),
(
  'linkage', 'Standard Official Family Linkage Certificate', 1, 'active', true,
  'a4', 210.00, 297.00, 'portrait',
  18.00, 18.00, 16.00, 16.00,
  10.00, 10.00, 'fit', 100.00,
  '{
    "header": { "showEmblem": true, "showTricolor": true, "fontSize": 22, "subTitleSize": 12 },
    "title": { "fontSize": 18, "color": "#1A237E", "underline": true },
    "body": { "fontSize": 12, "lineHeight": 1.6 },
    "table": { "fontSize": 11, "cellPaddingMm": 2 },
    "signatures": { "showWardMember": true, "showProdhan": true, "showUpaProdhan": true, "showSealBox": true },
    "watermark": { "enabled": true, "text": "BAGULA II GRAM PANCHAYAT", "opacity": 0.07 },
    "footer": { "showQrCode": true, "showVerificationMemo": true, "fontSize": 10 }
  }'::jsonb,
  now()
)
ON CONFLICT (service_kind, version) DO NOTHING;
