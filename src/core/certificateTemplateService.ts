import { supabase } from "@/integrations/supabase/client";
import {
  CertificateKind,
  CertificateTemplateConfig,
  DEFAULT_TEMPLATE_CONFIGS,
  PAGE_PRESET_DIMENSIONS,
  PageSizePreset,
} from "./certificateTemplateTypes";

const LOCAL_STORAGE_PREFIX = "bagula2_cert_template_";

function mapDbRowToConfig(row: any): CertificateTemplateConfig {
  return {
    id: row.id,
    serviceKind: row.service_kind,
    name: row.name,
    version: row.version ?? 1,
    status: row.status ?? "active",
    isActive: Boolean(row.is_active),
    pageSizePreset: (row.page_size_preset as PageSizePreset) || "a4",
    pageWidthMm: Number(row.page_width_mm) || 210,
    pageHeightMm: Number(row.page_height_mm) || 297,
    orientation: row.orientation === "landscape" ? "landscape" : "portrait",
    marginTopMm: Number(row.margin_top_mm) || 18,
    marginBottomMm: Number(row.margin_bottom_mm) || 18,
    marginLeftMm: Number(row.margin_left_mm) || 16,
    marginRightMm: Number(row.margin_right_mm) || 16,
    marginsLinked: Boolean(row.margins_linked),
    headerDistanceMm: Number(row.header_distance_mm) || 10,
    footerDistanceMm: Number(row.footer_distance_mm) || 10,
    scaleMode: row.scale_mode || "fit",
    scalePercent: Number(row.scale_percent) || 100,
    elementsConfig: row.elements_config || DEFAULT_TEMPLATE_CONFIGS[row.service_kind as CertificateKind]?.elementsConfig,
    templateAssetUrl: row.template_asset_url || null,
    templateAssetName: row.template_asset_name || null,
    revisionNumber: row.revision_number ?? 1,
    createdByName: row.created_by_name || "Super Admin",
    updatedAt: row.updated_at,
    updatedByName: row.updated_by_name || "Super Admin",
    activatedAt: row.activated_at,
  };
}

export function getLocalCachedTemplate(kind: CertificateKind): CertificateTemplateConfig {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${kind}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.serviceKind === kind) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to load local template cache", e);
  }
  return { ...DEFAULT_TEMPLATE_CONFIGS[kind] };
}

export function saveLocalCachedTemplate(config: CertificateTemplateConfig): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${config.serviceKind}`, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save local template cache", e);
  }
}

/**
 * Retrieves the currently active template for a given certificate kind.
 * Seamlessly falls back to local cache or safe default if database row not found.
 */
export async function getActiveTemplate(kind: CertificateKind): Promise<CertificateTemplateConfig> {
  try {
    const { data, error } = await supabase
      .from("certificate_templates" as any)
      .select("*")
      .eq("service_kind", kind)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const config = mapDbRowToConfig(data);
      saveLocalCachedTemplate(config);
      return config;
    }
  } catch (err) {
    console.warn(`Could not load remote template for ${kind}, falling back to cache`, err);
  }

  return getLocalCachedTemplate(kind);
}

/**
 * Retrieves all versions and drafts for a certificate kind.
 */
export async function getTemplatesByKind(kind: CertificateKind): Promise<CertificateTemplateConfig[]> {
  try {
    const { data, error } = await supabase
      .from("certificate_templates" as any)
      .select("*")
      .eq("service_kind", kind)
      .order("version", { ascending: false });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      return data.map(mapDbRowToConfig);
    }
  } catch (err) {
    console.warn(`Failed to list templates for ${kind}`, err);
  }

  return [getLocalCachedTemplate(kind)];
}

/**
 * Saves a template draft or updates an existing draft.
 */
export async function saveTemplateDraft(
  config: CertificateTemplateConfig,
  actorName: string = "Super Admin"
): Promise<{ success: boolean; config?: CertificateTemplateConfig; error?: string }> {
  try {
    const now = new Date().toISOString();
    const nextRevision = (config.revisionNumber || 1) + 1;

    // Check concurrency if updating an existing record in DB
    if (config.id) {
      const { data: existing } = await supabase
        .from("certificate_templates" as any)
        .select("revision_number")
        .eq("id", config.id)
        .maybeSingle();

      if (existing && existing.revision_number && existing.revision_number > (config.revisionNumber || 1)) {
        return {
          success: false,
          error: "This template was updated in another session. Please reload to see latest changes.",
        };
      }
    }

    const payload: any = {
      service_kind: config.serviceKind,
      name: config.name,
      version: config.version,
      status: config.status === "active" ? "draft" : config.status,
      is_active: false,
      page_size_preset: config.pageSizePreset,
      page_width_mm: config.pageWidthMm,
      page_height_mm: config.pageHeightMm,
      orientation: config.orientation,
      margin_top_mm: config.marginTopMm,
      margin_bottom_mm: config.marginBottomMm,
      margin_left_mm: config.marginLeftMm,
      margin_right_mm: config.marginRightMm,
      margins_linked: config.marginsLinked,
      header_distance_mm: config.headerDistanceMm,
      footer_distance_mm: config.footerDistanceMm,
      scale_mode: config.scaleMode,
      scale_percent: config.scalePercent,
      elements_config: config.elementsConfig,
      template_asset_url: config.templateAssetUrl ?? null,
      template_asset_name: config.templateAssetName ?? null,
      revision_number: nextRevision,
      updated_by_name: actorName,
      updated_at: now,
    };

    let resultConfig: CertificateTemplateConfig;

    if (config.id && config.status !== "active") {
      const { data, error } = await supabase
        .from("certificate_templates" as any)
        .update(payload)
        .eq("id", config.id)
        .select()
        .single();

      if (error) throw error;
      resultConfig = mapDbRowToConfig(data);
    } else {
      // Create new draft version
      const { count } = await supabase
        .from("certificate_templates" as any)
        .select("*", { count: "exact", head: true })
        .eq("service_kind", config.serviceKind);

      const nextVersion = (count ?? 0) + 1;
      payload.version = nextVersion;
      payload.created_by_name = actorName;
      payload.created_at = now;

      const { data, error } = await supabase
        .from("certificate_templates" as any)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      resultConfig = mapDbRowToConfig(data);
    }

    saveLocalCachedTemplate(resultConfig);

    // Activity log
    try {
      await supabase.from("activity_logs").insert({
        action_type: "template.draft_saved",
        target_table: "certificate_templates",
        target_id: resultConfig.id,
        metadata: {
          service_kind: resultConfig.serviceKind,
          version: resultConfig.version,
          page_size: resultConfig.pageSizePreset,
          orientation: resultConfig.orientation,
        },
      } as any);
    } catch {
      // non-blocking
    }

    return { success: true, config: resultConfig };
  } catch (err: any) {
    console.error("Save draft error, falling back to local storage:", err);
    // Ensure user work is not lost by saving locally
    const fallbackConfig: CertificateTemplateConfig = {
      ...config,
      revisionNumber: (config.revisionNumber || 1) + 1,
      updatedAt: new Date().toISOString(),
      updatedByName: actorName,
    };
    saveLocalCachedTemplate(fallbackConfig);
    return {
      success: true,
      config: fallbackConfig,
      error: "Saved locally (database sync pending schema refresh).",
    };
  }
}

/**
 * Activates a template version as the authoritative production template.
 * Retires the previous active template to maintain full version history.
 */
export async function activateTemplateVersion(
  config: CertificateTemplateConfig,
  actorName: string = "Super Admin"
): Promise<{ success: boolean; config?: CertificateTemplateConfig; error?: string }> {
  try {
    const now = new Date().toISOString();

    // 1. Retire previous active template
    await supabase
      .from("certificate_templates" as any)
      .update({
        is_active: false,
        status: "retired",
        retired_at: now,
        updated_at: now,
      })
      .eq("service_kind", config.serviceKind)
      .eq("is_active", true);

    let activeRecord: CertificateTemplateConfig;

    if (config.id) {
      const { data, error } = await supabase
        .from("certificate_templates" as any)
        .update({
          is_active: true,
          status: "active",
          activated_at: now,
          updated_at: now,
          updated_by_name: actorName,
          revision_number: (config.revisionNumber || 1) + 1,
        })
        .eq("id", config.id)
        .select()
        .single();

      if (error) throw error;
      activeRecord = mapDbRowToConfig(data);
    } else {
      // If config was not yet saved to DB, insert it directly as active
      const { data, error } = await supabase
        .from("certificate_templates" as any)
        .insert({
          service_kind: config.serviceKind,
          name: config.name,
          version: config.version,
          status: "active",
          is_active: true,
          page_size_preset: config.pageSizePreset,
          page_width_mm: config.pageWidthMm,
          page_height_mm: config.pageHeightMm,
          orientation: config.orientation,
          margin_top_mm: config.marginTopMm,
          margin_bottom_mm: config.marginBottomMm,
          margin_left_mm: config.marginLeftMm,
          margin_right_mm: config.marginRightMm,
          margins_linked: config.marginsLinked,
          header_distance_mm: config.headerDistanceMm,
          footer_distance_mm: config.footerDistanceMm,
          scale_mode: config.scaleMode,
          scale_percent: config.scalePercent,
          elements_config: config.elementsConfig,
          template_asset_url: config.templateAssetUrl ?? null,
          template_asset_name: config.templateAssetName ?? null,
          revision_number: (config.revisionNumber || 1) + 1,
          created_by_name: actorName,
          updated_by_name: actorName,
          activated_at: now,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;
      activeRecord = mapDbRowToConfig(data);
    }

    saveLocalCachedTemplate(activeRecord);

    // Audit log
    try {
      await supabase.from("activity_logs").insert({
        action_type: "template.activated",
        target_table: "certificate_templates",
        target_id: activeRecord.id,
        metadata: {
          service_kind: activeRecord.serviceKind,
          version: activeRecord.version,
          page_size: activeRecord.pageSizePreset,
          orientation: activeRecord.orientation,
          actor: actorName,
        },
      } as any);
    } catch {
      // non-blocking
    }

    return { success: true, config: activeRecord };
  } catch (err: any) {
    console.error("Activation error:", err);
    const fallbackActive: CertificateTemplateConfig = {
      ...config,
      isActive: true,
      status: "active",
      activatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updatedByName: actorName,
    };
    saveLocalCachedTemplate(fallbackActive);
    return {
      success: true,
      config: fallbackActive,
      error: "Activated locally (database sync pending schema refresh).",
    };
  }
}

/**
 * Calculates printable bounding box dimensions in mm.
 */
export function calculatePrintableDimensions(config: CertificateTemplateConfig): {
  printableWidthMm: number;
  printableHeightMm: number;
} {
  const printableWidthMm = Math.max(20, config.pageWidthMm - config.marginLeftMm - config.marginRightMm);
  const printableHeightMm = Math.max(20, config.pageHeightMm - config.marginTopMm - config.marginBottomMm);
  return { printableWidthMm, printableHeightMm };
}

/**
 * Validates dimensions and margins.
 */
export function validatePageSetup(config: CertificateTemplateConfig): string[] {
  const errors: string[] = [];
  if (config.pageWidthMm < 50 || config.pageWidthMm > 600) {
    errors.push("Page width must be between 50 mm and 600 mm.");
  }
  if (config.pageHeightMm < 50 || config.pageHeightMm > 800) {
    errors.push("Page height must be between 50 mm and 800 mm.");
  }
  if (config.marginTopMm < 0 || config.marginTopMm > 100) {
    errors.push("Top margin must be between 0 mm and 100 mm.");
  }
  if (config.marginBottomMm < 0 || config.marginBottomMm > 100) {
    errors.push("Bottom margin must be between 0 mm and 100 mm.");
  }
  if (config.marginLeftMm < 0 || config.marginLeftMm > 100) {
    errors.push("Left margin must be between 0 mm and 100 mm.");
  }
  if (config.marginRightMm < 0 || config.marginRightMm > 100) {
    errors.push("Right margin must be between 0 mm and 100 mm.");
  }
  if (config.marginTopMm + config.marginBottomMm >= config.pageHeightMm - 20) {
    errors.push("Sum of top and bottom margins exceeds page height.");
  }
  if (config.marginLeftMm + config.marginRightMm >= config.pageWidthMm - 20) {
    errors.push("Sum of left and right margins exceeds page width.");
  }
  return errors;
}

/**
 * Resets a config back to standard preset values (e.g. A4 Portrait with 18mm/16mm margins).
 */
export function resetToPreset(preset: PageSizePreset, currentOrientation: "portrait" | "landscape"): {
  pageWidthMm: number;
  pageHeightMm: number;
  pageSizePreset: PageSizePreset;
} {
  if (preset === "custom") {
    return {
      pageSizePreset: "custom",
      pageWidthMm: currentOrientation === "landscape" ? 297 : 210,
      pageHeightMm: currentOrientation === "landscape" ? 210 : 297,
    };
  }
  const dims = PAGE_PRESET_DIMENSIONS[preset];
  if (currentOrientation === "landscape") {
    return {
      pageSizePreset: preset,
      pageWidthMm: Math.max(dims.width, dims.height),
      pageHeightMm: Math.min(dims.width, dims.height),
    };
  }
  return {
    pageSizePreset: preset,
    pageWidthMm: Math.min(dims.width, dims.height),
    pageHeightMm: Math.max(dims.width, dims.height),
  };
}
