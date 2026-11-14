-- Migration: 20270918000000_certificate_page_setup_and_templates.sql
-- Description: Microsoft Word-style Page Setup, Margins, Orientation, and Certificate Template Versioning

-- 1. Create certificate_templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_kind text NOT NULL CHECK (service_kind IN ('warish', 'dependent', 'linkage')),
  name text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'active', 'retired')),
  page_setup jsonb NOT NULL,
  element_styles jsonb NOT NULL,
  template_asset_url text,
  template_asset_name text,
  revision integer NOT NULL DEFAULT 1,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  activated_by text,
  CONSTRAINT uq_service_kind_version UNIQUE (service_kind, version)
);

-- Index for quick lookup of active templates
CREATE INDEX IF NOT EXISTS idx_cert_templates_active 
  ON public.certificate_templates (service_kind, status) 
  WHERE status = 'active';

-- 2. Create certificate_template_audit_logs table
CREATE TABLE IF NOT EXISTS public.certificate_template_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.certificate_templates(id) ON DELETE SET NULL,
  service_kind text NOT NULL,
  action text NOT NULL,
  actor_email text,
  actor_role text,
  previous_version integer,
  new_version integer NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cert_template_audit_kind 
  ON public.certificate_template_audit_logs (service_kind, created_at DESC);

-- 3. Grants & RLS Policies
GRANT SELECT ON public.certificate_templates TO anon, authenticated;
GRANT ALL ON public.certificate_templates TO service_role;
GRANT SELECT ON public.certificate_template_audit_logs TO authenticated;
GRANT ALL ON public.certificate_template_audit_logs TO service_role;

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_template_audit_logs ENABLE ROW LEVEL SECURITY;

-- Reading templates is allowed for all authenticated office users and public verification rendering
CREATE POLICY "cert_templates_read_all" ON public.certificate_templates
  FOR SELECT USING (true);

-- Modifying templates requires office role: Super Admin has full governance; Admin/DEO requires designated authorization
CREATE POLICY "cert_templates_super_admin_manage" ON public.certificate_templates
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'deo')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'deo')
  );

CREATE POLICY "cert_template_audit_read" ON public.certificate_template_audit_logs
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'deo')
  );

CREATE POLICY "cert_template_audit_insert" ON public.certificate_template_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. Initial Seed: Standard Official Layout (Version 1, Active) for Warish, Dependent, and Linkage
INSERT INTO public.certificate_templates (
  service_kind, name, version, status, page_setup, element_styles, revision, created_by, activated_at
) VALUES 
(
  'warish',
  'Standard Official Warish Template',
  1,
  'active',
  '{"preset":"A4","width_mm":210,"height_mm":297,"orientation":"portrait","margin_top_mm":20,"margin_bottom_mm":20,"margin_left_mm":18,"margin_right_mm":18,"same_margins":false,"header_distance_mm":10,"footer_distance_mm":10,"scale_mode":"fit_page","scale_percent":100}'::jsonb,
  '{"font_family":"''Times New Roman'', Georgia, serif","title_font_size_pt":20,"body_font_size_pt":12,"line_height":1.6,"watermark_text":"বগুলা ২ নং গ্রাম পঞ্চায়েত","watermark_opacity":0.04,"watermark_enabled":true,"show_header_emblem":true,"show_tricolor_bar":true,"show_rulers":true,"snap_to_guides":true,"prodhan_title":"Prodhan","prodhan_name":"Smt. Susmita Biswas Barman","upa_prodhan_title":"Upa-Prodhan","upa_prodhan_name":"Sri Manaranjan Bhowmick","panchayat_name":"BAGULA II GRAM PANCHAYAT","panchayat_samity":"UNDER HANSKHALI PANCHAYAT SAMITY","office_address":"Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Block: Hanskhali, Dist.: Nadia, West Bengal","office_email":"bagula2nogp111@gmail.com","qr_code_enabled":true}'::jsonb,
  1,
  'system_bootstrap',
  now()
),
(
  'dependent',
  'Standard Official Dependent Template',
  1,
  'active',
  '{"preset":"A4","width_mm":210,"height_mm":297,"orientation":"portrait","margin_top_mm":20,"margin_bottom_mm":20,"margin_left_mm":18,"margin_right_mm":18,"same_margins":false,"header_distance_mm":10,"footer_distance_mm":10,"scale_mode":"fit_page","scale_percent":100}'::jsonb,
  '{"font_family":"''Times New Roman'', Georgia, serif","title_font_size_pt":20,"body_font_size_pt":12,"line_height":1.6,"watermark_text":"বগুলা ২ নং গ্রাম পঞ্চায়েত","watermark_opacity":0.04,"watermark_enabled":true,"show_header_emblem":true,"show_tricolor_bar":true,"show_rulers":true,"snap_to_guides":true,"prodhan_title":"Prodhan","prodhan_name":"Smt. Susmita Biswas Barman","upa_prodhan_title":"Upa-Prodhan","upa_prodhan_name":"Sri Manaranjan Bhowmick","panchayat_name":"BAGULA II GRAM PANCHAYAT","panchayat_samity":"UNDER HANSKHALI PANCHAYAT SAMITY","office_address":"Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Block: Hanskhali, Dist.: Nadia, West Bengal","office_email":"bagula2nogp111@gmail.com","qr_code_enabled":true}'::jsonb,
  1,
  'system_bootstrap',
  now()
),
(
  'linkage',
  'Standard Official Linkage Template',
  1,
  'active',
  '{"preset":"A4","width_mm":210,"height_mm":297,"orientation":"portrait","margin_top_mm":20,"margin_bottom_mm":20,"margin_left_mm":18,"margin_right_mm":18,"same_margins":false,"header_distance_mm":10,"footer_distance_mm":10,"scale_mode":"fit_page","scale_percent":100}'::jsonb,
  '{"font_family":"''Times New Roman'', Georgia, serif","title_font_size_pt":20,"body_font_size_pt":12,"line_height":1.6,"watermark_text":"বগুলা ২ নং গ্রাম পঞ্চায়েত","watermark_opacity":0.04,"watermark_enabled":true,"show_header_emblem":true,"show_tricolor_bar":true,"show_rulers":true,"snap_to_guides":true,"prodhan_title":"Prodhan","prodhan_name":"Smt. Susmita Biswas Barman","upa_prodhan_title":"Upa-Prodhan","upa_prodhan_name":"Sri Manaranjan Bhowmick","panchayat_name":"BAGULA II GRAM PANCHAYAT","panchayat_samity":"UNDER HANSKHALI PANCHAYAT SAMITY","office_address":"Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Block: Hanskhali, Dist.: Nadia, West Bengal","office_email":"bagula2nogp111@gmail.com","qr_code_enabled":true}'::jsonb,
  1,
  'system_bootstrap',
  now()
)
ON CONFLICT (service_kind, version) DO NOTHING;
