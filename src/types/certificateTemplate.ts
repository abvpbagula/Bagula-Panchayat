/**
 * Bagula II Gram Panchayat — Certificate Template Designer & Page Setup Types
 * Microsoft Word-style Page Setup (Paper, Orientation, Margins, Scale, Layout)
 */

export type CertificateServiceKind = "warish" | "dependent" | "linkage";

export type PagePreset = "A4" | "A5" | "A3" | "Letter" | "Legal" | "Custom";

export type PageOrientation = "portrait" | "landscape";

export type ScaleMode = "original" | "fit_page" | "custom";

export type TemplateStatus = "draft" | "approved" | "active" | "retired";

export interface PageSetup {
  preset: PagePreset;
  /** Width in mm when custom or reference */
  width_mm: number;
  /** Height in mm when custom or reference */
  height_mm: number;
  orientation: PageOrientation;
  margin_top_mm: number;
  margin_bottom_mm: number;
  margin_left_mm: number;
  margin_right_mm: number;
  same_margins: boolean;
  header_distance_mm: number;
  footer_distance_mm: number;
  scale_mode: ScaleMode;
  scale_percent: number;
}

export interface ElementStyles {
  font_family: string;
  title_font_size_pt: number;
  body_font_size_pt: number;
  line_height: number;
  watermark_text: string;
  watermark_opacity: number;
  watermark_enabled: boolean;
  show_header_emblem: boolean;
  show_tricolor_bar: boolean;
  show_rulers: boolean;
  snap_to_guides: boolean;
  prodhan_title: string;
  prodhan_name: string;
  upa_prodhan_title: string;
  upa_prodhan_name: string;
  panchayat_name: string;
  panchayat_samity: string;
  office_address: string;
  office_email: string;
  qr_code_enabled: boolean;
}

export interface CertificateTemplate {
  id: string;
  service_kind: CertificateServiceKind;
  name: string;
  version: number;
  status: TemplateStatus;
  page_setup: PageSetup;
  element_styles: ElementStyles;
  template_asset_url?: string | null;
  template_asset_name?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
  activated_at?: string | null;
  activated_by?: string | null;
  revision: number;
}

export interface CertificateTemplateAuditLog {
  id: string;
  template_id: string;
  service_kind: CertificateServiceKind;
  action: string;
  actor_email: string | null;
  actor_role: string | null;
  previous_version: number | null;
  new_version: number;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface PlaceholderDefinition {
  placeholder: string;
  label: string;
  description: string;
  example: string;
}

/** Standard ISO and North American paper presets in mm (Width x Height in Portrait) */
export const PAGE_PRESETS: Record<Exclude<PagePreset, "Custom">, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: "A4 (210 × 297 mm)" },
  A5: { width: 148, height: 210, label: "A5 (148 × 210 mm)" },
  A3: { width: 297, height: 420, label: "A3 (297 × 420 mm)" },
  Letter: { width: 215.9, height: 279.4, label: "Letter (215.9 × 279.4 mm)" },
  Legal: { width: 215.9, height: 355.6, label: "Legal (215.9 × 355.6 mm)" },
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  preset: "A4",
  width_mm: 210,
  height_mm: 297,
  orientation: "portrait",
  margin_top_mm: 20,
  margin_bottom_mm: 20,
  margin_left_mm: 18,
  margin_right_mm: 18,
  same_margins: false,
  header_distance_mm: 10,
  footer_distance_mm: 10,
  scale_mode: "fit_page",
  scale_percent: 100,
};

export const DEFAULT_ELEMENT_STYLES: ElementStyles = {
  font_family: "'Times New Roman', Georgia, serif",
  title_font_size_pt: 20,
  body_font_size_pt: 12,
  line_height: 1.6,
  watermark_text: "বগুলা ২ নং গ্রাম পঞ্চায়েত",
  watermark_opacity: 0.04,
  watermark_enabled: true,
  show_header_emblem: true,
  show_tricolor_bar: true,
  show_rulers: true,
  snap_to_guides: true,
  prodhan_title: "Prodhan",
  prodhan_name: "Smt. Susmita Biswas Barman",
  upa_prodhan_title: "Upa-Prodhan",
  upa_prodhan_name: "Sri Manaranjan Bhowmick",
  panchayat_name: "BAGULA II GRAM PANCHAYAT",
  panchayat_samity: "UNDER HANSKHALI PANCHAYAT SAMITY",
  office_address: "Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Block: Hanskhali, Dist.: Nadia, West Bengal",
  office_email: "bagula2nogp111@gmail.com",
  qr_code_enabled: true,
};

/** Approved data bindings for official templates — prevents arbitrary code injection */
export const APPROVED_PLACEHOLDERS: PlaceholderDefinition[] = [
  { placeholder: "{{certificate_reference_id}}", label: "Verification ID", description: "Authoritative unique verification number", example: "BGL-II/WAR/A7K93F/2026" },
  { placeholder: "{{memo_no}}", label: "Memo Number", description: "Official dispatched dispatch memo number", example: "142/BGL-II/2026" },
  { placeholder: "{{issue_date}}", label: "Issue Date", description: "Date on which the certificate was issued", example: "18/09/2026" },
  { placeholder: "{{applicant_name}}", label: "Applicant Name", description: "Full legal name of the applicant", example: "Shri Debasish Roy" },
  { placeholder: "{{father_name}}", label: "Father / Husband Name", description: "Care of or relation parent name", example: "Late Nityananda Biswas" },
  { placeholder: "{{deceased_name}}", label: "Deceased Name", description: "Name of the deceased person (for Warish)", example: "Late Samir Biswas" },
  { placeholder: "{{village}}", label: "Village / Para", description: "Official revenue village", example: "Stationpara" },
  { placeholder: "{{post_office}}", label: "Post Office", description: "Postal jurisdiction", example: "Bagula" },
  { placeholder: "{{district}}", label: "District", description: "District administration", example: "Nadia" },
  { placeholder: "{{pin}}", label: "PIN Code", description: "Postal index number", example: "741502" },
  { placeholder: "{{service_name}}", label: "Service Name", description: "Certificate title in full", example: "Warish Certificate" },
  { placeholder: "{{panchayat_name}}", label: "Gram Panchayat", description: "Office administrative jurisdiction", example: "BAGULA II GRAM PANCHAYAT" },
  { placeholder: "{{prodhan_name}}", label: "Prodhan Name", description: "Elected Pradhan representative", example: "Smt. Susmita Biswas Barman" },
  { placeholder: "{{upa_prodhan_name}}", label: "Upa-Prodhan Name", description: "Elected Upa-Pradhan representative", example: "Sri Manaranjan Bhowmick" },
  { placeholder: "{{verification_url}}", label: "Verification URL", description: "Direct link to citizen verification page", example: "https://bagula2gp.lovable.app/verify?id=..." },
];

/**
 * Calculates physical page dimensions and printable area based on preset, orientation, and margins.
 */
export function getEffectivePageDimensions(setup: PageSetup): {
  widthMm: number;
  heightMm: number;
  printableWidthMm: number;
  printableHeightMm: number;
  isLandscape: boolean;
} {
  const isLandscape = setup.orientation === "landscape";
  let baseWidth: number;
  let baseHeight: number;

  if (setup.preset === "Custom") {
    baseWidth = Math.max(100, Math.min(500, Number(setup.width_mm) || 210));
    baseHeight = Math.max(100, Math.min(500, Number(setup.height_mm) || 297));
  } else {
    const preset = PAGE_PRESETS[setup.preset] || PAGE_PRESETS.A4;
    baseWidth = preset.width;
    baseHeight = preset.height;
  }

  const widthMm = isLandscape ? Math.max(baseWidth, baseHeight) : Math.min(baseWidth, baseHeight);
  const heightMm = isLandscape ? Math.min(baseWidth, baseHeight) : Math.max(baseWidth, baseHeight);

  const printableWidthMm = Math.max(20, widthMm - (Number(setup.margin_left_mm) || 0) - (Number(setup.margin_right_mm) || 0));
  const printableHeightMm = Math.max(20, heightMm - (Number(setup.margin_top_mm) || 0) - (Number(setup.margin_bottom_mm) || 0));

  return {
    widthMm,
    heightMm,
    printableWidthMm,
    printableHeightMm,
    isLandscape,
  };
}

/**
 * Validates Page Setup values to ensure safe physical print constraints.
 */
export function validatePageSetup(setup: PageSetup): string[] {
  const errors: string[] = [];

  if (setup.preset === "Custom") {
    if (!setup.width_mm || setup.width_mm < 100 || setup.width_mm > 500) {
      errors.push("Custom width must be between 100 mm and 500 mm.");
    }
    if (!setup.height_mm || setup.height_mm < 100 || setup.height_mm > 500) {
      errors.push("Custom height must be between 100 mm and 500 mm.");
    }
  }

  const { widthMm, heightMm } = getEffectivePageDimensions(setup);

  if (setup.margin_top_mm < 5 || setup.margin_top_mm > 60) {
    errors.push("Top margin must be between 5 mm and 60 mm.");
  }
  if (setup.margin_bottom_mm < 5 || setup.margin_bottom_mm > 60) {
    errors.push("Bottom margin must be between 5 mm and 60 mm.");
  }
  if (setup.margin_left_mm < 5 || setup.margin_left_mm > 60) {
    errors.push("Left margin must be between 5 mm and 60 mm.");
  }
  if (setup.margin_right_mm < 5 || setup.margin_right_mm > 60) {
    errors.push("Right margin must be between 5 mm and 60 mm.");
  }

  if (setup.margin_left_mm + setup.margin_right_mm >= widthMm - 30) {
    errors.push("Horizontal margins are too large for the selected page width.");
  }
  if (setup.margin_top_mm + setup.margin_bottom_mm >= heightMm - 40) {
    errors.push("Vertical margins are too large for the selected page height.");
  }

  return errors;
}

/**
 * Replaces approved placeholders safely with actual certificate data.
 */
export function substitutePlaceholders(templateText: string, data: Record<string, string | number | undefined | null>): string {
  if (!templateText) return "";
  let result = templateText;
  for (const def of APPROVED_PLACEHOLDERS) {
    const key = def.placeholder.slice(2, -2);
    const val = data[key];
    const replacement = val !== undefined && val !== null ? String(val) : "";
    result = result.split(def.placeholder).join(replacement);
  }
  return result;
}
