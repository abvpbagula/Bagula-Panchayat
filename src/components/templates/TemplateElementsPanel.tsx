import React, { useState } from "react";
import {
  CertificateTemplate,
  ElementStyles,
  APPROVED_PLACEHOLDERS,
} from "@/types/certificateTemplate";
import { uploadTemplateAsset } from "@/lib/certificateTemplateService";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Type,
  UploadCloud,
  FileImage,
  Copy,
  Check,
  Shield,
  Palette,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

interface TemplateElementsPanelProps {
  template: CertificateTemplate;
  onChange: (updatedStyles: ElementStyles, assetUrl?: string | null, assetName?: string | null) => void;
  actorEmail: string | null;
  disabled?: boolean;
}

export const TemplateElementsPanel: React.FC<TemplateElementsPanelProps> = ({
  template,
  onChange,
  actorEmail,
  disabled = false,
}) => {
  const styles = template.element_styles;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleStyleChange = <K extends keyof ElementStyles>(key: K, value: ElementStyles[K]) => {
    onChange({
      ...styles,
      [key]: value,
    });
  };

  const handleCopyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    setCopiedKey(placeholder);
    toast.success(`Copied placeholder: ${placeholder}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadTemplateAsset(file, template.service_kind, template.version, actorEmail);
      if (res.success && res.url) {
        onChange(styles, res.url, res.name || file.name);
        toast.success("Template background asset uploaded successfully.");
      } else {
        toast.error(res.error || "Failed to upload template asset.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Asset upload error.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAsset = () => {
    onChange(styles, null, null);
    toast.info("Removed background template asset.");
  };

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-sm space-y-6">
      <div className="flex items-center gap-2 border-b pb-3">
        <SlidersHorizontal className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-base tracking-tight">DOCUMENT ELEMENTS & STYLES</h3>
      </div>

      {/* Typography & Sizing */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Type className="w-4 h-4" />
          <span>Typography & Text Scaling</span>
        </Label>

        <div>
          <Label className="text-xs text-muted-foreground">Font Family</Label>
          <select
            value={styles.font_family}
            onChange={(e) => handleStyleChange("font_family", e.target.value)}
            disabled={disabled}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs mt-1"
          >
            <option value="'Times New Roman', Georgia, serif">Official Serif (Times New Roman)</option>
            <option value="Georgia, serif">Classic Serif (Georgia)</option>
            <option value="Arial, Helvetica, sans-serif">Modern Sans (Arial)</option>
            <option value="'Calibri', 'Segoe UI', sans-serif">Clean Sans (Calibri)</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <Label className="text-[11px] text-muted-foreground">Title Font (pt)</Label>
            <Input
              type="number"
              min={14}
              max={32}
              value={styles.title_font_size_pt}
              onChange={(e) => handleStyleChange("title_font_size_pt", Number(e.target.value) || 20)}
              className="h-8 text-xs font-mono mt-1"
              disabled={disabled}
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Body Font (pt)</Label>
            <Input
              type="number"
              min={9}
              max={18}
              value={styles.body_font_size_pt}
              onChange={(e) => handleStyleChange("body_font_size_pt", Number(e.target.value) || 12)}
              className="h-8 text-xs font-mono mt-1"
              disabled={disabled}
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Line Height</Label>
            <Input
              type="number"
              step={0.1}
              min={1.2}
              max={2.4}
              value={styles.line_height}
              onChange={(e) => handleStyleChange("line_height", Number(e.target.value) || 1.6)}
              className="h-8 text-xs font-mono mt-1"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Watermark Configuration */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            <span>Watermark</span>
          </Label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <Checkbox
              checked={styles.watermark_enabled}
              onCheckedChange={(c) => handleStyleChange("watermark_enabled", Boolean(c))}
              disabled={disabled}
            />
            <span>Enable</span>
          </label>
        </div>

        {styles.watermark_enabled && (
          <div className="space-y-2.5 bg-muted/40 p-3 rounded-lg border">
            <div>
              <Label className="text-[11px] text-muted-foreground">Watermark Text</Label>
              <Input
                value={styles.watermark_text}
                onChange={(e) => handleStyleChange("watermark_text", e.target.value)}
                className="h-8 text-xs mt-1"
                disabled={disabled}
              />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Opacity</span>
                <span className="font-mono">{Math.round(styles.watermark_opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.2}
                step={0.01}
                value={styles.watermark_opacity}
                onChange={(e) => handleStyleChange("watermark_opacity", Number(e.target.value))}
                className="w-full accent-primary mt-1"
                disabled={disabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* Official Signatures & Header Representation */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-4 h-4" />
          <span>Office Header & Authority Signatures</span>
        </Label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={styles.show_header_emblem}
              onCheckedChange={(c) => handleStyleChange("show_header_emblem", Boolean(c))}
              disabled={disabled}
            />
            <span>Office Emblem</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={styles.show_tricolor_bar}
              onCheckedChange={(c) => handleStyleChange("show_tricolor_bar", Boolean(c))}
              disabled={disabled}
            />
            <span>Tricolor Header Bar</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
            <Checkbox
              checked={styles.qr_code_enabled}
              onCheckedChange={(c) => handleStyleChange("qr_code_enabled", Boolean(c))}
              disabled={disabled}
            />
            <span>QR Verification Badge</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div>
            <Label className="text-[11px] text-muted-foreground">Prodhan Name</Label>
            <Input
              value={styles.prodhan_name}
              onChange={(e) => handleStyleChange("prodhan_name", e.target.value)}
              className="h-8 text-xs mt-1"
              disabled={disabled}
            />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Upa-Prodhan Name</Label>
            <Input
              value={styles.upa_prodhan_name}
              onChange={(e) => handleStyleChange("upa_prodhan_name", e.target.value)}
              className="h-8 text-xs mt-1"
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Upload Official Background / Letterhead */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileImage className="w-4 h-4" />
          <span>Template Asset / Letterhead Background</span>
        </Label>
        <p className="text-[11px] text-muted-foreground">
          Upload official pre-printed letterhead, border artwork, or emblem (PNG/JPG/WebP/PDF, max 5MB).
        </p>

        {template.template_asset_url ? (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-2.5 rounded-lg text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileImage className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate font-medium">{template.template_asset_name || "Official_Template_Asset"}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveAsset}
              disabled={disabled}
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              title="Remove Asset"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 p-4 rounded-xl cursor-pointer transition bg-muted/20 hover:bg-muted/40">
            <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />
            <span className="text-xs font-semibold">{isUploading ? "Uploading asset..." : "Click to upload template asset"}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WebP or PDF (Max 5MB)</span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
              className="hidden"
              onChange={handleAssetUpload}
              disabled={disabled || isUploading}
            />
          </label>
        )}
      </div>

      {/* Safe Data Binding Reference helper */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>Safe Data Bindings (Placeholders)</span>
        </Label>
        <p className="text-[11px] text-muted-foreground">
          Click any placeholder below to copy and safely bind real certificate attributes without code injection.
        </p>

        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
          {APPROVED_PLACEHOLDERS.map((item) => {
            const isCopied = copiedKey === item.placeholder;
            return (
              <div
                key={item.placeholder}
                onClick={() => handleCopyPlaceholder(item.placeholder)}
                className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/60 cursor-pointer transition group"
              >
                <div className="truncate pr-2">
                  <span className="font-mono text-primary font-semibold text-[11px] block truncate">
                    {item.placeholder}
                  </span>
                  <span className="text-[10px] text-muted-foreground block truncate">
                    {item.label} (e.g. {item.example})
                  </span>
                </div>
                <div className="shrink-0 text-muted-foreground group-hover:text-foreground">
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
