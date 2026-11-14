import React, { useState } from "react";
import {
  CertificateTemplateConfig,
  PAGE_PRESET_DIMENSIONS,
  PageSizePreset,
  PageOrientation,
  ScaleMode,
} from "@/core/certificateTemplateTypes";
import { resetToPreset } from "@/core/certificateTemplateService";
import {
  FileText,
  Maximize2,
  Sliders,
  Type,
  Shield,
  Layers,
  Link2,
  Unlink2,
  RotateCw,
  Upload,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface PageSetupPanelProps {
  config: CertificateTemplateConfig;
  onChange: (updated: CertificateTemplateConfig) => void;
  canEdit: boolean;
}

export const PageSetupPanel: React.FC<PageSetupPanelProps> = ({
  config,
  onChange,
  canEdit,
}) => {
  const [activeTab, setActiveTab] = useState<"page" | "margins" | "typography" | "elements">("page");

  // Margin link toggle
  const handleMarginChange = (key: "marginTopMm" | "marginBottomMm" | "marginLeftMm" | "marginRightMm", val: number) => {
    const num = Math.max(0, Math.min(100, val));
    if (config.marginsLinked) {
      onChange({
        ...config,
        marginTopMm: num,
        marginBottomMm: num,
        marginLeftMm: num,
        marginRightMm: num,
      });
    } else {
      onChange({
        ...config,
        [key]: num,
      });
    }
  };

  // Orientation toggle
  const handleOrientationChange = (newOrientation: PageOrientation) => {
    if (newOrientation === config.orientation) return;
    const isLandscape = newOrientation === "landscape";
    let newW = config.pageWidthMm;
    let newH = config.pageHeightMm;

    // Invert width and height to match physical orientation
    if (isLandscape && config.pageWidthMm < config.pageHeightMm) {
      newW = config.pageHeightMm;
      newH = config.pageWidthMm;
    } else if (!isLandscape && config.pageWidthMm > config.pageHeightMm) {
      newW = config.pageHeightMm;
      newH = config.pageWidthMm;
    }

    onChange({
      ...config,
      orientation: newOrientation,
      pageWidthMm: newW,
      pageHeightMm: newH,
    });
  };

  // Preset selector
  const handlePresetSelect = (preset: PageSizePreset) => {
    const updated = resetToPreset(preset, config.orientation);
    onChange({
      ...config,
      pageSizePreset: updated.pageSizePreset,
      pageWidthMm: updated.pageWidthMm,
      pageHeightMm: updated.pageHeightMm,
    });
  };

  // Quick margin preset selector (like MS Word: Normal, Narrow, Moderate, Wide)
  const applyMarginPreset = (type: "normal" | "narrow" | "moderate" | "wide") => {
    if (type === "narrow") {
      onChange({
        ...config,
        marginTopMm: 12.7,
        marginBottomMm: 12.7,
        marginLeftMm: 12.7,
        marginRightMm: 12.7,
      });
    } else if (type === "moderate") {
      onChange({
        ...config,
        marginTopMm: 25.4,
        marginBottomMm: 25.4,
        marginLeftMm: 19.1,
        marginRightMm: 19.1,
      });
    } else if (type === "wide") {
      onChange({
        ...config,
        marginTopMm: 25.4,
        marginBottomMm: 25.4,
        marginLeftMm: 35.0,
        marginRightMm: 35.0,
      });
    } else {
      // Normal standard
      onChange({
        ...config,
        marginTopMm: 18.0,
        marginBottomMm: 18.0,
        marginLeftMm: 16.0,
        marginRightMm: 16.0,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 text-slate-800 select-none">
      {/* MS Word-like Header Bar */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-amber-400" />
          <span className="font-bold text-sm tracking-wide">Page Setup & Layout</span>
        </div>
        <span className="text-[11px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded">
          MS Word Engine
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("page")}
          className={`py-2 px-1 text-center transition flex flex-col items-center gap-1 ${
            activeTab === "page"
              ? "bg-white text-primary border-b-2 border-primary font-bold shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText size={14} />
          <span>Paper</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("margins")}
          className={`py-2 px-1 text-center transition flex flex-col items-center gap-1 ${
            activeTab === "margins"
              ? "bg-white text-primary border-b-2 border-primary font-bold shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Maximize2 size={14} />
          <span>Margins</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("typography")}
          className={`py-2 px-1 text-center transition flex flex-col items-center gap-1 ${
            activeTab === "typography"
              ? "bg-white text-primary border-b-2 border-primary font-bold shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Type size={14} />
          <span>Typography</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("elements")}
          className={`py-2 px-1 text-center transition flex flex-col items-center gap-1 ${
            activeTab === "elements"
              ? "bg-white text-primary border-b-2 border-primary font-bold shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers size={14} />
          <span>Elements</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        {/* ================= TAB 1: PAPER & ORIENTATION ================= */}
        {activeTab === "page" && (
          <div className="space-y-4">
            {/* Paper Size Preset */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Paper Size Preset
              </Label>
              <select
                disabled={!canEdit}
                value={config.pageSizePreset}
                onChange={(e) => handlePresetSelect(e.target.value as PageSizePreset)}
                className="w-full h-9 px-3 rounded-md border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              >
                <option value="a4">A4 (210 × 297 mm) — Official Standard</option>
                <option value="a5">A5 (148 × 210 mm) — Compact Register</option>
                <option value="a3">A3 (297 × 420 mm) — Large Schedule</option>
                <option value="letter">Letter (215.9 × 279.4 mm)</option>
                <option value="legal">Legal (215.9 × 355.6 mm)</option>
                <option value="custom">Custom Dimensions (Explicit mm)...</option>
              </select>
            </div>

            {/* Custom Dimensions if custom or fine-tuning */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <Label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                  Width (mm)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={config.pageWidthMm}
                    min={50}
                    max={600}
                    step={1}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        pageSizePreset: "custom",
                        pageWidthMm: Number(e.target.value) || 210,
                      })
                    }
                    className="h-8 pr-8 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-slate-600 font-semibold mb-1 block">
                  Height (mm)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={config.pageHeightMm}
                    min={50}
                    max={800}
                    step={1}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        pageSizePreset: "custom",
                        pageHeightMm: Number(e.target.value) || 297,
                      })
                    }
                    className="h-8 pr-8 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                </div>
              </div>
            </div>

            {/* Orientation */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                Physical Orientation
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleOrientationChange("portrait")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition ${
                    config.orientation === "portrait"
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-6 h-8 border-2 border-current rounded-sm mb-1.5 bg-current/10" />
                  <span>Portrait</span>
                  <span className="text-[10px] text-slate-500 font-normal">Tall (Standard)</span>
                </button>

                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleOrientationChange("landscape")}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition ${
                    config.orientation === "landscape"
                      ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="w-8 h-6 border-2 border-current rounded-sm mb-1.5 bg-current/10" />
                  <span>Landscape</span>
                  <span className="text-[10px] text-slate-500 font-normal">Wide Table Format</span>
                </button>
              </div>
            </div>

            {/* Scale / Print Fit Behavior */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Scale & Fit Mode
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {(["fit", "actual", "custom"] as ScaleMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => onChange({ ...config, scaleMode: mode })}
                    className={`py-1.5 px-2 rounded border text-xs font-medium capitalize transition ${
                      config.scaleMode === mode
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300"
                    }`}
                  >
                    {mode === "fit" ? "Fit to Page" : mode === "actual" ? "100% Actual" : "Custom %"}
                  </button>
                ))}
              </div>

              {config.scaleMode === "custom" && (
                <div className="mt-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span>Print Scale Percentage:</span>
                    <span className="font-mono text-primary">{config.scalePercent}%</span>
                  </div>
                  <Slider
                    disabled={!canEdit}
                    value={[config.scalePercent]}
                    min={50}
                    max={150}
                    step={1}
                    onValueChange={([val]) => onChange({ ...config, scalePercent: val })}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: MARGINS ================= */}
        {activeTab === "margins" && (
          <div className="space-y-4">
            {/* Quick Margin Presets */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Margin Presets
                </Label>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => onChange({ ...config, marginsLinked: !config.marginsLinked })}
                  className={`text-[11px] flex items-center gap-1 font-medium px-2 py-0.5 rounded transition ${
                    config.marginsLinked
                      ? "bg-primary/15 text-primary"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Link all margins to identical value"
                >
                  {config.marginsLinked ? <Link2 size={12} /> : <Unlink2 size={12} />}
                  <span>{config.marginsLinked ? "Linked (Same)" : "Independent"}</span>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-xs">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 px-1"
                  onClick={() => applyMarginPreset("normal")}
                >
                  Normal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 px-1"
                  onClick={() => applyMarginPreset("narrow")}
                >
                  Narrow
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 px-1"
                  onClick={() => applyMarginPreset("moderate")}
                >
                  Moderate
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="text-[11px] h-7 px-1"
                  onClick={() => applyMarginPreset("wide")}
                >
                  Wide
                </Button>
              </div>
            </div>

            {/* Margin Inputs in mm */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">Top Margin</Label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={config.marginTopMm}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => handleMarginChange("marginTopMm", Number(e.target.value) || 0)}
                    className="h-8 pr-8 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">Bottom Margin</Label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={config.marginBottomMm}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => handleMarginChange("marginBottomMm", Number(e.target.value) || 0)}
                    className="h-8 pr-8 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">Left Margin</Label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={config.marginLeftMm}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => handleMarginChange("marginLeftMm", Number(e.target.value) || 0)}
                    className="h-8 pr-8 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-600 block mb-1">Right Margin</Label>
                <div className="relative">
                  <Input
                    type="number"
                    disabled={!canEdit}
                    value={config.marginRightMm}
                    min={0}
                    max={100}
                    step={1}
                    onChange={(e) => handleMarginChange("marginRightMm", Number(e.target.value) || 0)}
                    className="h-8 pr-8 font-mono text-sm"
                  />
                  <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                </div>
              </div>
            </div>

            {/* Header & Footer Clearance Distance */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Header & Footer Clearance (mm)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">From Edge to Header</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      disabled={!canEdit}
                      value={config.headerDistanceMm}
                      min={0}
                      max={50}
                      onChange={(e) => onChange({ ...config, headerDistanceMm: Number(e.target.value) || 0 })}
                      className="h-8 pr-8 font-mono text-sm"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] text-slate-600 mb-1 block">From Edge to Footer</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      disabled={!canEdit}
                      value={config.footerDistanceMm}
                      min={0}
                      max={50}
                      onChange={(e) => onChange({ ...config, footerDistanceMm: Number(e.target.value) || 0 })}
                      className="h-8 pr-8 font-mono text-sm"
                    />
                    <span className="absolute right-2 top-1.5 text-xs text-slate-400">mm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TYPOGRAPHY & WATERMARK ================= */}
        {activeTab === "typography" && (
          <div className="space-y-4">
            {/* Body Font Size & Line Height */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Body Font Size:</span>
                <span className="font-mono text-primary">{config.elementsConfig.body.fontSize} pt</span>
              </div>
              <Slider
                disabled={!canEdit}
                value={[config.elementsConfig.body.fontSize]}
                min={9}
                max={16}
                step={0.5}
                onValueChange={([val]) =>
                  onChange({
                    ...config,
                    elementsConfig: {
                      ...config.elementsConfig,
                      body: { ...config.elementsConfig.body, fontSize: val },
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Body Line Height:</span>
                <span className="font-mono text-primary">{config.elementsConfig.body.lineHeight}</span>
              </div>
              <Slider
                disabled={!canEdit}
                value={[config.elementsConfig.body.lineHeight]}
                min={1.2}
                max={2.2}
                step={0.1}
                onValueChange={([val]) =>
                  onChange({
                    ...config,
                    elementsConfig: {
                      ...config.elementsConfig,
                      body: { ...config.elementsConfig.body, lineHeight: val },
                    },
                  })
                }
              />
            </div>

            {/* Title Styling */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Certificate Title
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  disabled={!canEdit}
                  placeholder="Official Title (e.g. WARISH CERTIFICATE)"
                  value={config.elementsConfig.title.customTitle || ""}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        title: { ...config.elementsConfig.title, customTitle: e.target.value },
                      },
                    })
                  }
                  className="h-8 text-xs"
                />
                <input
                  type="color"
                  disabled={!canEdit}
                  value={config.elementsConfig.title.color}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        title: { ...config.elementsConfig.title, color: e.target.value },
                      },
                    })
                  }
                  className="h-8 w-10 p-0 border rounded cursor-pointer"
                  title="Title Color"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Underline Title</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.title.underline}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        title: { ...config.elementsConfig.title, underline: checked },
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Watermark Configuration */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Official Watermark
                </Label>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.watermark.enabled}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        watermark: { ...config.elementsConfig.watermark, enabled: checked },
                      },
                    })
                  }
                />
              </div>

              {config.elementsConfig.watermark.enabled && (
                <>
                  <Input
                    disabled={!canEdit}
                    placeholder="Watermark Text"
                    value={config.elementsConfig.watermark.text}
                    onChange={(e) =>
                      onChange({
                        ...config,
                        elementsConfig: {
                          ...config.elementsConfig,
                          watermark: { ...config.elementsConfig.watermark, text: e.target.value },
                        },
                      })
                    }
                    className="h-8 text-xs font-mono"
                  />

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <span>Watermark Opacity:</span>
                      <span className="font-mono text-primary">
                        {Math.round(config.elementsConfig.watermark.opacity * 100)}%
                      </span>
                    </div>
                    <Slider
                      disabled={!canEdit}
                      value={[config.elementsConfig.watermark.opacity]}
                      min={0.02}
                      max={0.25}
                      step={0.01}
                      onValueChange={([val]) =>
                        onChange({
                          ...config,
                          elementsConfig: {
                            ...config.elementsConfig,
                            watermark: { ...config.elementsConfig.watermark, opacity: val },
                          },
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ELEMENTS TOGGLES ================= */}
        {activeTab === "elements" && (
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Header & Emblem
              </Label>
              <div className="flex items-center justify-between text-xs">
                <span>Display National Tricolor Ribbon</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.header.showTricolor}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        header: { ...config.elementsConfig.header, showTricolor: checked },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Display National Emblem / Seal</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.header.showEmblem}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        header: { ...config.elementsConfig.header, showEmblem: checked },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Signatures & Seals
              </Label>
              <div className="flex items-center justify-between text-xs">
                <span>Ward Member Signature Column</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.signatures.showWardMember}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        signatures: { ...config.elementsConfig.signatures, showWardMember: checked },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Official GP Seal Box</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.signatures.showSealBox}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        signatures: { ...config.elementsConfig.signatures, showSealBox: checked },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Prodhan Signature & Stamp</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.signatures.showProdhan}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        signatures: { ...config.elementsConfig.signatures, showProdhan: checked },
                      },
                    })
                  }
                />
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Footer & Verification
              </Label>
              <div className="flex items-center justify-between text-xs">
                <span>Official QR Code Verification</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.footer.showQrCode}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        footer: { ...config.elementsConfig.footer, showQrCode: checked },
                      },
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span>Digital Memo & Timestamp Tag</span>
                <Switch
                  disabled={!canEdit}
                  checked={config.elementsConfig.footer.showVerificationMemo}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...config,
                      elementsConfig: {
                        ...config.elementsConfig,
                        footer: { ...config.elementsConfig.footer, showVerificationMemo: checked },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
