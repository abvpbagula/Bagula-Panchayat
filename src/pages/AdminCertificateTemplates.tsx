import React, { useState, useEffect, useRef } from "react";
import { useAuthz } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CertificateKind,
  CertificateTemplateConfig,
  DEFAULT_TEMPLATE_CONFIGS,
  PAGE_PRESET_DIMENSIONS,
  PageSizePreset,
} from "@/core/certificateTemplateTypes";
import {
  getActiveTemplate,
  getTemplatesByKind,
  saveTemplateDraft,
  activateTemplateVersion,
  validatePageSetup,
  resetToPreset,
} from "@/core/certificateTemplateService";
import {
  generateCertificatePdf,
  injectPrintPageStyles,
} from "@/core/certificatePrintEngine";
import { MillimeterRuler } from "@/components/admin/MillimeterRuler";
import { CertificateLivePreview } from "@/components/admin/CertificateLivePreview";
import { BackButton } from "@/components/BackButton";
import {
  FileText,
  Sliders,
  Type,
  Upload,
  CheckCircle2,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  History,
  Link2,
  Unlink,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function AdminCertificateTemplates() {
  const authz = useAuthz();
  const [selectedKind, setSelectedKind] = useState<CertificateKind>("warish");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);

  // Template configuration state
  const [config, setConfig] = useState<CertificateTemplateConfig>(
    DEFAULT_TEMPLATE_CONFIGS.warish
  );
  const [originalConfig, setOriginalConfig] = useState<CertificateTemplateConfig>(
    DEFAULT_TEMPLATE_CONFIGS.warish
  );
  const [versions, setVersions] = useState<CertificateTemplateConfig[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<"page" | "elements" | "upload" | "versions">("page");
  const [zoomScale, setZoomScale] = useState<number>(0.75);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Check DEO service scope
  const isSuperAdmin = authz.isSuperAdmin;
  const deoAllowed =
    isSuperAdmin ||
    !authz.isDeo ||
    (authz.serviceScope &&
      (authz.serviceScope.includes("all") || authz.serviceScope.includes(selectedKind)));

  // Load active template and version list for selected certificate kind
  const loadData = async (kind: CertificateKind) => {
    setLoading(true);
    try {
      const active = await getActiveTemplate(kind);
      setConfig(active);
      setOriginalConfig(JSON.parse(JSON.stringify(active)));

      const allVersions = await getTemplatesByKind(kind);
      setVersions(allVersions);
    } catch (err) {
      console.error("Failed to load template data:", err);
      toast.error("Failed to load template configuration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedKind);
  }, [selectedKind]);

  const hasUnsavedChanges =
    JSON.stringify(config) !== JSON.stringify(originalConfig);

  // Handlers for Page Setup
  const handlePresetChange = (preset: PageSizePreset) => {
    const updated = resetToPreset(preset, config.orientation);
    setConfig((prev) => ({
      ...prev,
      pageSizePreset: updated.pageSizePreset,
      pageWidthMm: updated.pageWidthMm,
      pageHeightMm: updated.pageHeightMm,
    }));
  };

  const handleOrientationToggle = (newOrientation: "portrait" | "landscape") => {
    if (config.orientation === newOrientation) return;
    // Swap width and height
    setConfig((prev) => ({
      ...prev,
      orientation: newOrientation,
      pageWidthMm: prev.pageHeightMm,
      pageHeightMm: prev.pageWidthMm,
    }));
  };

  const handleMarginChange = (
    field: "marginTopMm" | "marginBottomMm" | "marginLeftMm" | "marginRightMm",
    value: number
  ) => {
    const clamped = Math.max(0, Math.min(100, value));
    if (config.marginsLinked) {
      setConfig((prev) => ({
        ...prev,
        marginTopMm: clamped,
        marginBottomMm: clamped,
        marginLeftMm: clamped,
        marginRightMm: clamped,
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        [field]: clamped,
      }));
    }
  };

  // "Fit to Page" automated solver: tightens margins and font size so certificate fits onto 1 page
  const handleAutoFitToPage = () => {
    setConfig((prev) => ({
      ...prev,
      scaleMode: "fit",
      marginTopMm: Math.max(12, prev.marginTopMm - 3),
      marginBottomMm: Math.max(12, prev.marginBottomMm - 3),
      marginLeftMm: Math.max(12, prev.marginLeftMm - 2),
      marginRightMm: Math.max(12, prev.marginRightMm - 2),
      headerDistanceMm: Math.max(6, prev.headerDistanceMm - 2),
      footerDistanceMm: Math.max(6, prev.footerDistanceMm - 2),
      elementsConfig: {
        ...prev.elementsConfig,
        body: {
          ...prev.elementsConfig.body,
          fontSize: Math.max(10.5, prev.elementsConfig.body.fontSize - 0.5),
          lineHeight: Math.max(1.35, prev.elementsConfig.body.lineHeight - 0.1),
        },
        table: {
          ...prev.elementsConfig.table,
          fontSize: Math.max(9.5, prev.elementsConfig.table.fontSize - 0.5),
          cellPaddingMm: Math.max(1.2, prev.elementsConfig.table.cellPaddingMm - 0.5),
        },
      },
    }));
    toast.success("Page margins and typography adjusted to fit printable bounds.");
  };

  // Save Draft
  const handleSaveDraft = async () => {
    const errors = validatePageSetup(config);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setSaving(true);
    const actor = authz.profile?.display_name || (isSuperAdmin ? "Super Admin" : "DEO");
    const res = await saveTemplateDraft(config, actor);
    setSaving(false);

    if (res.success && res.config) {
      setConfig(res.config);
      setOriginalConfig(JSON.parse(JSON.stringify(res.config)));
      toast.success(res.error || `Draft saved as Version ${res.config.version}`);
      const updatedList = await getTemplatesByKind(selectedKind);
      setVersions(updatedList);
    } else {
      toast.error(res.error || "Failed to save draft.");
    }
  };

  // Activate Version (Super Admin only)
  const handleActivate = async () => {
    if (!isSuperAdmin) {
      toast.error("Only Super Admin has authority to activate certificate templates.");
      return;
    }

    const errors = validatePageSetup(config);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    const confirmed = window.confirm(
      `Activate Version ${config.version} for ${config.serviceKind.toUpperCase()} Certificate?\n\nNew certificates will use this page layout. All previously issued certificates remain immutable.`
    );
    if (!confirmed) return;

    setActivating(true);
    const actor = authz.profile?.display_name || "Super Admin";
    const res = await activateTemplateVersion(config, actor);
    setActivating(false);

    if (res.success && res.config) {
      setConfig(res.config);
      setOriginalConfig(JSON.parse(JSON.stringify(res.config)));
      toast.success(`Version ${res.config.version} is now LIVE in production!`);
      const updatedList = await getTemplatesByKind(selectedKind);
      setVersions(updatedList);
    } else {
      toast.error(res.error || "Failed to activate version.");
    }
  };

  // Test PDF generation with current page setup
  const handlePreviewPdf = async () => {
    setGeneratingPdf(true);
    try {
      const sheet = previewContainerRef.current?.querySelector(
        ".certificate-paper-sheet"
      ) as HTMLElement | null;
      if (!sheet) throw new Error("Preview canvas not ready");

      const filename = `Test_Layout_${config.serviceKind}_v${config.version}.pdf`;
      await generateCertificatePdf(sheet, config, filename);
      toast.success(`Generated PDF matching ${config.pageWidthMm}×${config.pageHeightMm}mm page setup.`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate test PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Browser print test with injected @page setup
  const handlePrintTest = () => {
    const cleanup = injectPrintPageStyles(config);
    window.print();
    setTimeout(cleanup, 2000);
  };

  // Asset upload handler
  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    const validMimes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
    if (!validMimes.includes(file.type)) {
      toast.error("Invalid file format. Please upload PNG, JPG, or SVG image.");
      return;
    }

    // Validate size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast.error("File size exceeds 4MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setConfig((prev) => ({
        ...prev,
        templateAssetUrl: base64,
        templateAssetName: file.name,
      }));
      toast.success(`Uploaded "${file.name}" as official background asset.`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Admin Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/admin/dashboard" label="Dashboard" />
            <div className="border-l border-slate-300 pl-3">
              <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Certificate Page Setup & Template Designer
              </h1>
              <p className="text-xs text-slate-500">
                Configure physical print paper (mm), orientation, margins, and typography
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {hasUnsavedChanges && (
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full animate-pulse flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Unsaved Changes
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintTest}
              className="text-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              Print Test
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewPdf}
              disabled={generatingPdf}
              className="text-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-slate-600" />
              {generatingPdf ? "Generating..." : "Download PDF"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveDraft}
              disabled={saving || !deoAllowed}
              className="text-xs flex items-center gap-1.5"
            >
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            {isSuperAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={handleActivate}
                disabled={activating}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {activating ? "Activating..." : "Activate Version"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Kind Selector Tabs */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setSelectedKind("warish")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedKind === "warish"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Warish Certificate
            </button>
            <button
              onClick={() => setSelectedKind("dependent")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedKind === "dependent"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Dependent Certificate
            </button>
            <button
              onClick={() => setSelectedKind("linkage")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                selectedKind === "linkage"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Family Linkage Certificate
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">
              Active: <span className="font-mono text-emerald-700">v{config.version}</span> ({config.status.toUpperCase()})
            </span>
            <span>•</span>
            <span>Paper: {config.pageWidthMm}×{config.pageHeightMm} mm</span>
            <span>•</span>
            <span className="capitalize">{config.orientation}</span>
          </div>
        </div>
      </div>

      {/* Main Work Area: Left Control Panel + Right Live Document Canvas */}
      <div className="max-w-7xl mx-auto w-full p-4 flex-1 flex flex-col lg:flex-row gap-6">
        {/* Left Side: Microsoft Word-Style Setup Ribbons */}
        <div className="w-full lg:w-[420px] flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab("page")}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "page"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Page Setup
              </button>
              <button
                onClick={() => setActiveTab("elements")}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "elements"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                Typography
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "upload"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Asset
              </button>
              <button
                onClick={() => setActiveTab("versions")}
                className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
                  activeTab === "versions"
                    ? "border-emerald-600 text-emerald-800 bg-white"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>
            </div>

            <div className="p-4 space-y-5 text-sm">
              {/* PAGE SETUP TAB (Word-Like) */}
              {activeTab === "page" && (
                <div className="space-y-4">
                  {/* Paper Preset */}
                  <div>
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Paper Size
                    </Label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {(["a4", "a5", "letter", "legal", "a3", "custom"] as PageSizePreset[]).map(
                        (p) => (
                          <button
                            key={p}
                            onClick={() => handlePresetChange(p)}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded border text-center transition ${
                              config.pageSizePreset === p
                                ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {p.toUpperCase()}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Physical Dimensions in Millimeters */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div>
                      <Label className="text-[11px] text-slate-500 font-medium">Width (mm)</Label>
                      <Input
                        type="number"
                        min="50"
                        max="600"
                        value={config.pageWidthMm}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            pageSizePreset: "custom",
                            pageWidthMm: Number(e.target.value),
                          }))
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500 font-medium">Height (mm)</Label>
                      <Input
                        type="number"
                        min="50"
                        max="800"
                        value={config.pageHeightMm}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            pageSizePreset: "custom",
                            pageHeightMm: Number(e.target.value),
                          }))
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Orientation */}
                  <div>
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Orientation
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <button
                        onClick={() => handleOrientationToggle("portrait")}
                        className={`py-2 px-3 text-xs font-medium rounded border flex items-center justify-center gap-2 transition ${
                          config.orientation === "portrait"
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-3.5 h-5 border-2 border-current rounded-xs" />
                        Portrait
                      </button>
                      <button
                        onClick={() => handleOrientationToggle("landscape")}
                        className={`py-2 px-3 text-xs font-medium rounded border flex items-center justify-center gap-2 transition ${
                          config.orientation === "landscape"
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="w-5 h-3.5 border-2 border-current rounded-xs" />
                        Landscape
                      </button>
                    </div>
                  </div>

                  {/* Margins in Millimeters */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Margins (mm)
                      </Label>
                      <button
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            marginsLinked: !prev.marginsLinked,
                          }))
                        }
                        className={`text-xs flex items-center gap-1 font-medium transition ${
                          config.marginsLinked ? "text-emerald-700" : "text-slate-400"
                        }`}
                        title="Link margins so changing one updates all 4"
                      >
                        {config.marginsLinked ? (
                          <>
                            <Link2 className="h-3 w-3" /> Same Margins
                          </>
                        ) : (
                          <>
                            <Unlink className="h-3 w-3" /> Independent
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 mt-2">
                      <div>
                        <Label className="text-[11px] text-slate-500">Top (mm)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="80"
                          value={config.marginTopMm}
                          onChange={(e) =>
                            handleMarginChange("marginTopMm", Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Bottom (mm)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="80"
                          value={config.marginBottomMm}
                          onChange={(e) =>
                            handleMarginChange("marginBottomMm", Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Left (mm)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="80"
                          value={config.marginLeftMm}
                          onChange={(e) =>
                            handleMarginChange("marginLeftMm", Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Right (mm)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="80"
                          value={config.marginRightMm}
                          onChange={(e) =>
                            handleMarginChange("marginRightMm", Number(e.target.value))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Header & Footer Distance */}
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div>
                      <Label className="text-[11px] text-slate-500 font-medium">Header Gap (mm)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={config.headerDistanceMm}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            headerDistanceMm: Number(e.target.value),
                          }))
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-slate-500 font-medium">Footer Gap (mm)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={config.footerDistanceMm}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            footerDistanceMm: Number(e.target.value),
                          }))
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Quick Fit to Page button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFitToPage}
                    className="w-full text-xs font-medium flex items-center justify-center gap-1.5 border-amber-300 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    Auto-Fit to Printable Bounds
                  </Button>
                </div>
              )}

              {/* TYPOGRAPHY & ELEMENTS TAB */}
              {activeTab === "elements" && (
                <div className="space-y-4">
                  {/* Header Options */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Header & Title
                    </Label>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-600">Show Tricolor Flag Bar</span>
                      <Switch
                        checked={config.elementsConfig.header.showTricolor}
                        onCheckedChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            elementsConfig: {
                              ...prev.elementsConfig,
                              header: {
                                ...prev.elementsConfig.header,
                                showTricolor: val,
                              },
                            },
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-[11px] text-slate-500">Header Size (px)</Label>
                        <Input
                          type="number"
                          min="14"
                          max="32"
                          value={config.elementsConfig.header.fontSize}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              elementsConfig: {
                                ...prev.elementsConfig,
                                header: {
                                  ...prev.elementsConfig.header,
                                  fontSize: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Title Size (px)</Label>
                        <Input
                          type="number"
                          min="14"
                          max="28"
                          value={config.elementsConfig.title.fontSize}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              elementsConfig: {
                                ...prev.elementsConfig,
                                title: {
                                  ...prev.elementsConfig.title,
                                  fontSize: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Body & Table */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Body & Table Styling
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px] text-slate-500">Body Font Size (px)</Label>
                        <Input
                          type="number"
                          min="9"
                          max="16"
                          step="0.5"
                          value={config.elementsConfig.body.fontSize}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              elementsConfig: {
                                ...prev.elementsConfig,
                                body: {
                                  ...prev.elementsConfig.body,
                                  fontSize: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Line Height</Label>
                        <Input
                          type="number"
                          min="1.2"
                          max="2.0"
                          step="0.1"
                          value={config.elementsConfig.body.lineHeight}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              elementsConfig: {
                                ...prev.elementsConfig,
                                body: {
                                  ...prev.elementsConfig.body,
                                  lineHeight: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <Label className="text-[11px] text-slate-500">Table Font Size (px)</Label>
                        <Input
                          type="number"
                          min="8"
                          max="14"
                          value={config.elementsConfig.table.fontSize}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              elementsConfig: {
                                ...prev.elementsConfig,
                                table: {
                                  ...prev.elementsConfig.table,
                                  fontSize: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Cell Padding (mm)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={config.elementsConfig.table.cellPaddingMm}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              elementsConfig: {
                                ...prev.elementsConfig,
                                table: {
                                  ...prev.elementsConfig.table,
                                  cellPaddingMm: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Signatures & Seal
                    </Label>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-600">Ward Member Endorsement</span>
                      <Switch
                        checked={config.elementsConfig.signatures.showWardMember}
                        onCheckedChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            elementsConfig: {
                              ...prev.elementsConfig,
                              signatures: {
                                ...prev.elementsConfig.signatures,
                                showWardMember: val,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs text-slate-600">Official Seal Box</span>
                      <Switch
                        checked={config.elementsConfig.signatures.showSealBox}
                        onCheckedChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            elementsConfig: {
                              ...prev.elementsConfig,
                              signatures: {
                                ...prev.elementsConfig.signatures,
                                showSealBox: val,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Watermark */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Security Watermark
                      </Label>
                      <Switch
                        checked={config.elementsConfig.watermark.enabled}
                        onCheckedChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            elementsConfig: {
                              ...prev.elementsConfig,
                              watermark: {
                                ...prev.elementsConfig.watermark,
                                enabled: val,
                              },
                            },
                          }))
                        }
                      />
                    </div>
                    {config.elementsConfig.watermark.enabled && (
                      <div className="space-y-2 mt-2 bg-slate-50 p-2 rounded">
                        <div>
                          <Label className="text-[11px] text-slate-500">Watermark Text</Label>
                          <Input
                            type="text"
                            value={config.elementsConfig.watermark.text}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                elementsConfig: {
                                  ...prev.elementsConfig,
                                  watermark: {
                                    ...prev.elementsConfig.watermark,
                                    text: e.target.value,
                                  },
                                },
                              }))
                            }
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Opacity</span>
                            <span>{Math.round(config.elementsConfig.watermark.opacity * 100)}%</span>
                          </div>
                          <Slider
                            min={2}
                            max={25}
                            step={1}
                            value={[config.elementsConfig.watermark.opacity * 100]}
                            onValueChange={([val]) =>
                              setConfig((prev) => ({
                                ...prev,
                                elementsConfig: {
                                  ...prev.elementsConfig,
                                  watermark: {
                                    ...prev.elementsConfig.watermark,
                                    opacity: val / 100,
                                  },
                                },
                              }))
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ASSET UPLOAD TAB */}
              {activeTab === "upload" && (
                <div className="space-y-4">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Official Background / Letterhead Asset
                  </Label>
                  <p className="text-xs text-slate-500">
                    Upload an official crest, panchayat watermark, or letterhead border (PNG, JPG, or SVG). Files are verified for safety and rendered with high print fidelity.
                  </p>

                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center hover:bg-slate-50 transition cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleAssetUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <div className="text-xs font-semibold text-slate-700">
                      Click or drag image to upload
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">PNG, JPG, or SVG (Max 4MB)</div>
                  </div>

                  {config.templateAssetUrl && (
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={config.templateAssetUrl}
                          alt="Asset thumbnail"
                          className="w-10 h-10 object-contain border bg-white rounded p-0.5"
                        />
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate text-slate-800">
                            {config.templateAssetName || "Uploaded Asset"}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-medium">Active in layout</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            templateAssetUrl: null,
                            templateAssetName: null,
                          }))
                        }
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* VERSION HISTORY TAB */}
              {activeTab === "versions" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Version Register
                    </Label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {versions.length} versions
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {versions.map((ver) => (
                      <div
                        key={ver.id || `ver-${ver.version}`}
                        className={`p-2.5 rounded border text-xs flex items-center justify-between transition ${
                          ver.isActive
                            ? "bg-emerald-50/70 border-emerald-300"
                            : "bg-white border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="font-mono">v{ver.version}</span>
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-semibold ${
                                ver.isActive
                                  ? "bg-emerald-600 text-white"
                                  : ver.status === "draft"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {ver.status}
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 mt-0.5">
                            {ver.pageWidthMm}×{ver.pageHeightMm}mm • {ver.orientation} • By {ver.updatedByName || "Super Admin"}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfig(ver);
                            toast.info(`Loaded layout of Version ${ver.version}`);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900"
                        >
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Live Document Canvas */}
        <div className="flex-1 flex flex-col bg-slate-200/80 rounded-lg border border-slate-300/80 overflow-hidden shadow-inner">
          {/* Canvas Toolbar: Zoom & Ruler Toggles */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showRulers}
                  onChange={(e) => setShowRulers(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Millimeter Rulers</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Printable Guides</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs w-12 text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={() => setZoomScale(0.75)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600 ml-1"
                title="Reset Zoom (75%)"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Desk Area */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto p-6 flex flex-col items-center justify-start bg-slate-300/40 relative min-h-[580px]"
          >
            {/* Top Horizontal Millimeter Ruler */}
            {showRulers && (
              <div className="mb-1 flex items-center justify-center">
                <div style={{ marginLeft: "24px" }}>
                  <MillimeterRuler
                    lengthMm={config.pageWidthMm}
                    orientation="horizontal"
                    zoomFactor={3.779528 * zoomScale}
                    marginStartMm={config.marginLeftMm}
                    marginEndMm={config.marginRightMm}
                  />
                </div>
              </div>
            )}

            {/* Canvas Body with Vertical Left Ruler & Sheet */}
            <div className="flex items-start justify-center">
              {showRulers && (
                <div className="mr-1">
                  <MillimeterRuler
                    lengthMm={config.pageHeightMm}
                    orientation="vertical"
                    zoomFactor={3.779528 * zoomScale}
                    marginStartMm={config.marginTopMm}
                    marginEndMm={config.marginBottomMm}
                  />
                </div>
              )}

              {/* The Live Rendered Certificate Sheet */}
              <CertificateLivePreview
                config={config}
                showGuides={showGuides}
                zoomScale={zoomScale}
                onFitToPage={handleAutoFitToPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
