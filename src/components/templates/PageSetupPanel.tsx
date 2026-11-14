import React from "react";
import {
  PageSetup,
  PagePreset,
  PageOrientation,
  ScaleMode,
  PAGE_PRESETS,
  getEffectivePageDimensions,
  validatePageSetup,
} from "@/types/certificateTemplate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Maximize2,
  Minimize2,
  RotateCw,
  Sliders,
  Check,
  AlertTriangle,
  Link2,
  Unlink2,
} from "lucide-react";

interface PageSetupPanelProps {
  pageSetup: PageSetup;
  onChange: (updated: PageSetup) => void;
  onFitToPage?: () => void;
  disabled?: boolean;
}

export const PageSetupPanel: React.FC<PageSetupPanelProps> = ({
  pageSetup,
  onChange,
  onFitToPage,
  disabled = false,
}) => {
  const { widthMm, heightMm, printableWidthMm, printableHeightMm } = getEffectivePageDimensions(pageSetup);
  const validationErrors = validatePageSetup(pageSetup);

  const handlePresetChange = (preset: PagePreset) => {
    if (preset === "Custom") {
      onChange({
        ...pageSetup,
        preset: "Custom",
      });
    } else {
      const p = PAGE_PRESETS[preset];
      onChange({
        ...pageSetup,
        preset,
        width_mm: p.width,
        height_mm: p.height,
      });
    }
  };

  const handleOrientationChange = (orientation: PageOrientation) => {
    onChange({
      ...pageSetup,
      orientation,
    });
  };

  const handleMarginChange = (field: "margin_top_mm" | "margin_bottom_mm" | "margin_left_mm" | "margin_right_mm", value: number) => {
    const clamped = Math.max(5, Math.min(60, Number(value) || 5));
    if (pageSetup.same_margins) {
      onChange({
        ...pageSetup,
        margin_top_mm: clamped,
        margin_bottom_mm: clamped,
        margin_left_mm: clamped,
        margin_right_mm: clamped,
      });
    } else {
      onChange({
        ...pageSetup,
        [field]: clamped,
      });
    }
  };

  const handleScaleModeChange = (mode: ScaleMode) => {
    onChange({
      ...pageSetup,
      scale_mode: mode,
      scale_percent: mode === "original" ? 100 : pageSetup.scale_percent,
    });
  };

  return (
    <div className="bg-card text-card-foreground border rounded-xl p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base tracking-tight">PAGE SETUP</h3>
        </div>
        <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
          {widthMm} × {heightMm} mm
        </span>
      </div>

      {/* Validation warning if invalid */}
      {validationErrors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs p-3 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            {validationErrors.map((err, i) => (
              <p key={i}>{err}</p>
            ))}
          </div>
        </div>
      )}

      {/* Section 1: Paper Size */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>1. Paper Size</span>
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {(["A4", "A5", "A3", "Letter", "Legal", "Custom"] as PagePreset[]).map((p) => {
            const isSelected = pageSetup.preset === p;
            return (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => handlePresetChange(p)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                    : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="font-semibold">{p}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  {p !== "Custom" ? `${PAGE_PRESETS[p].width}×${PAGE_PRESETS[p].height}` : "Variable"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom dimensions in mm */}
        {pageSetup.preset === "Custom" && (
          <div className="grid grid-cols-2 gap-3 pt-2 bg-muted/40 p-3 rounded-lg border border-dashed">
            <div>
              <Label className="text-xs text-muted-foreground">Width (mm)</Label>
              <div className="flex items-center gap-1.5 mt-1">
                <Input
                  type="number"
                  min={100}
                  max={500}
                  value={pageSetup.width_mm}
                  onChange={(e) => onChange({ ...pageSetup, width_mm: Number(e.target.value) || 210 })}
                  className="h-8 text-xs font-mono"
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">mm</span>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Height (mm)</Label>
              <div className="flex items-center gap-1.5 mt-1">
                <Input
                  type="number"
                  min={100}
                  max={500}
                  value={pageSetup.height_mm}
                  onChange={(e) => onChange({ ...pageSetup, height_mm: Number(e.target.value) || 297 })}
                  className="h-8 text-xs font-mono"
                  disabled={disabled}
                />
                <span className="text-xs text-muted-foreground">mm</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Orientation */}
      <div className="space-y-3">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <span>2. Orientation</span>
        </Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOrientationChange("portrait")}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${
              pageSetup.orientation === "portrait"
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary font-bold"
                : "border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            <div className="w-4 h-6 border-2 border-current rounded-sm flex items-center justify-center text-[7px]">P</div>
            <span>Portrait</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => handleOrientationChange("landscape")}
            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${
              pageSetup.orientation === "landscape"
                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary font-bold"
                : "border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            <div className="w-6 h-4 border-2 border-current rounded-sm flex items-center justify-center text-[7px]">L</div>
            <span>Landscape</span>
          </button>
        </div>
      </div>

      {/* Section 3: Margins */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            3. Margins (mm)
          </Label>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <Checkbox
              checked={pageSetup.same_margins}
              onCheckedChange={(c) => onChange({ ...pageSetup, same_margins: Boolean(c) })}
              disabled={disabled}
            />
            {pageSetup.same_margins ? (
              <span className="flex items-center gap-1 text-primary font-medium">
                <Link2 className="w-3.5 h-3.5" /> Same margins
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Unlink2 className="w-3.5 h-3.5" /> Independent
              </span>
            )}
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-muted-foreground">Top</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={5}
                max={60}
                value={pageSetup.margin_top_mm}
                onChange={(e) => handleMarginChange("margin_top_mm", Number(e.target.value))}
                className="h-8 text-xs font-mono"
                disabled={disabled}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Bottom</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={5}
                max={60}
                value={pageSetup.margin_bottom_mm}
                onChange={(e) => handleMarginChange("margin_bottom_mm", Number(e.target.value))}
                className="h-8 text-xs font-mono"
                disabled={disabled}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Left</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={5}
                max={60}
                value={pageSetup.margin_left_mm}
                onChange={(e) => handleMarginChange("margin_left_mm", Number(e.target.value))}
                className="h-8 text-xs font-mono"
                disabled={disabled}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Right</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={5}
                max={60}
                value={pageSetup.margin_right_mm}
                onChange={(e) => handleMarginChange("margin_right_mm", Number(e.target.value))}
                className="h-8 text-xs font-mono"
                disabled={disabled}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
          </div>
        </div>

        {/* Header & Footer Distance */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div>
            <Label className="text-[11px] text-muted-foreground">Header Distance</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={0}
                max={50}
                value={pageSetup.header_distance_mm}
                onChange={(e) => onChange({ ...pageSetup, header_distance_mm: Math.max(0, Number(e.target.value) || 0) })}
                className="h-8 text-xs font-mono"
                disabled={disabled}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">Footer Distance</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                type="number"
                min={0}
                max={50}
                value={pageSetup.footer_distance_mm}
                onChange={(e) => onChange({ ...pageSetup, footer_distance_mm: Math.max(0, Number(e.target.value) || 0) })}
                className="h-8 text-xs font-mono"
                disabled={disabled}
              />
              <span className="text-[11px] text-muted-foreground">mm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Scale & Printable Area */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
          <span>4. Scaling & Fit</span>
          <span className="text-[10px] font-normal text-muted-foreground">
            Printable: {printableWidthMm.toFixed(0)} × {printableHeightMm.toFixed(0)} mm
          </span>
        </Label>

        <div className="grid grid-cols-3 gap-2">
          {(["fit_page", "original", "custom"] as ScaleMode[]).map((mode) => {
            const isSelected = pageSetup.scale_mode === mode;
            const labels: Record<ScaleMode, string> = {
              fit_page: "Fit to Page",
              original: "100%",
              custom: "Custom",
            };
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() => handleScaleModeChange(mode)}
                className={`py-2 px-2 rounded-lg border text-xs font-medium transition text-center ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {pageSetup.scale_mode === "custom" && (
          <div className="flex items-center gap-2 pt-1">
            <Label className="text-xs text-muted-foreground shrink-0">Scale %:</Label>
            <Input
              type="number"
              min={50}
              max={150}
              value={pageSetup.scale_percent}
              onChange={(e) => onChange({ ...pageSetup, scale_percent: Math.max(50, Math.min(150, Number(e.target.value) || 100)) })}
              className="h-8 text-xs font-mono w-24"
              disabled={disabled}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        )}

        {onFitToPage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onFitToPage}
            disabled={disabled}
            className="w-full text-xs gap-1.5 h-8 mt-1"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Auto-Calculate Fit to Page
          </Button>
        )}
      </div>
    </div>
  );
};
