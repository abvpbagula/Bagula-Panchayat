import React, { useEffect, useState, useRef } from "react";
import { useAuthz } from "@/lib/permissions";
import {
  CertificateKind,
  CertificateTemplateConfig,
  DEFAULT_TEMPLATE_CONFIGS,
} from "@/core/certificateTemplateTypes";
import {
  getActiveTemplate,
  getTemplatesByKind,
  saveTemplateDraft,
  activateTemplateVersion,
  validatePageSetup,
} from "@/core/certificateTemplateService";
import { generateCertificatePdf, injectPrintPageStyles } from "@/core/certificatePrintEngine";
import { CertificateLivePreview } from "@/components/admin/CertificateLivePreview";
import { PageSetupPanel } from "@/components/admin/PageSetupPanel";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  CheckCircle2,
  FileDown,
  RotateCcw,
  History,
  ShieldAlert,
  Printer,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function CertificateTemplateDesigner() {
  const authz = useAuthz();
  const [activeKind, setActiveKind] = useState<CertificateKind>("warish");
  const [config, setConfig] = useState<CertificateTemplateConfig>(DEFAULT_TEMPLATE_CONFIGS.warish);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [versionHistory, setVersionHistory] = useState<CertificateTemplateConfig[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const certContainerRef = useRef<HTMLDivElement>(null);

  // Role permissions:
  // Citizens have no access.
  // DEO can only edit certificates matching their serviceScope.
  // Super Admin can edit and activate all 3.
  const isSuperAdmin = authz.isSuperAdmin;
  const isDeo = authz.isDeo;

  const canAccessKind = (kind: CertificateKind): boolean => {
    if (isSuperAdmin) return true;
    if (isDeo) {
      if (!authz.serviceScope || authz.serviceScope.includes("all")) return true;
      return authz.serviceScope.includes(kind);
    }
    return false;
  };

  const canEdit = isSuperAdmin || (isDeo && canAccessKind(activeKind));
  const canActivate = isSuperAdmin; // Only Super Admin has authority to push to production

  // Load active template on tab change
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const tpl = await getActiveTemplate(activeKind);
        const history = await getTemplatesByKind(activeKind);
        if (active) {
          setConfig(tpl);
          setVersionHistory(history);
          setIsDirty(false);
          setValidationErrors(validatePageSetup(tpl));
        }
      } catch (err) {
        console.error("Error loading template:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeKind]);

  const handleConfigChange = (updated: CertificateTemplateConfig) => {
    setConfig(updated);
    setIsDirty(true);
    setValidationErrors(validatePageSetup(updated));
  };

  // Save Draft
  const handleSaveDraft = async () => {
    const errs = validatePageSetup(config);
    if (errs.length > 0) {
      toast.error(`Validation error: ${errs[0]}`);
      return;
    }

    setSaving(true);
    const actorName = authz.email || (isSuperAdmin ? "Super Admin" : "DEO Operator");
    const res = await saveTemplateDraft(config, actorName);
    setSaving(false);

    if (res.success && res.config) {
      setConfig(res.config);
      setIsDirty(false);
      toast.success(`Draft saved successfully (v${res.config.version})`);
      // Refresh history
      getTemplatesByKind(activeKind).then(setVersionHistory);
    } else {
      toast.error(res.error || "Failed to save draft");
    }
  };

  // Activate Version
  const handleActivateConfirm = async () => {
    setShowActivateConfirm(false);
    const errs = validatePageSetup(config);
    if (errs.length > 0) {
      toast.error(`Cannot activate: ${errs[0]}`);
      return;
    }

    setSaving(true);
    const actorName = authz.email || "Super Admin";
    const res = await activateTemplateVersion(config, actorName);
    setSaving(false);

    if (res.success && res.config) {
      setConfig(res.config);
      setIsDirty(false);
      toast.success(`Template v${res.config.version} is now LIVE for all newly issued ${activeKind} certificates!`);
      getTemplatesByKind(activeKind).then(setVersionHistory);
    } else {
      toast.error(res.error || "Failed to activate template");
    }
  };

  // Test Print via Browser Print
  const handleTestBrowserPrint = () => {
    const cleanup = injectPrintPageStyles(config);
    window.print();
    setTimeout(cleanup, 1000);
  };

  // Test PDF Export using jsPDF engine
  const handleTestPdfExport = async () => {
    try {
      toast.info("Generating test certificate PDF with current page setup...");
      const el = document.getElementById("certificate-page-canvas");
      if (!el) throw new Error("Preview canvas not found");
      await generateCertificatePdf(
        el,
        config,
        `Template_Test_${activeKind}_v${config.version}_${config.pageSizePreset}.pdf`
      );
      toast.success("Test PDF downloaded!");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    }
  };

  // Reset to default
  const handleReset = () => {
    if (confirm("Reset layout to standard official Bagula-II A4 settings?")) {
      const def = { ...DEFAULT_TEMPLATE_CONFIGS[activeKind] };
      setConfig(def);
      setIsDirty(true);
      setValidationErrors([]);
      toast.info("Reset to default A4 settings.");
    }
  };

  // Check Citizen or Unauthenticated
  if (authz.loading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-slate-600 gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading Certificate Page Setup Engine...</span>
      </div>
    );
  }

  if (!authz.role || (!isSuperAdmin && !isDeo)) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4 text-center">
        <ShieldAlert size={48} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          Certificate template management and page setup design are reserved exclusively for authorized Gram Panchayat
          administrative personnel.
        </p>
        <BackButton fallbackUrl="/admin/certificate-templates" label="Back to Templates" />
      </div>
    );
  }

  const kindOptions: { key: CertificateKind; label: string; icon: string }[] = [
    { key: "warish", label: "Warish Certificate", icon: "📜" },
    { key: "dependent", label: "Dependent Certificate", icon: "👨‍👩‍👧‍👦" },
    { key: "linkage", label: "Family Linkage Certificate", icon: "🔗" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <BackButton fallbackUrl="/admin/certificate-templates" label="Back to Templates" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900">
                Official Certificate Page Setup & Template Designer
              </h1>
              {config.isActive ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px]">
                  LIVE IN PRODUCTION (v{config.version})
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-400 bg-amber-50 font-mono text-[10px]">
                  DRAFT (v{config.version})
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Microsoft Word-style physical page dimensions, margins, and safe layout engine.
            </p>
          </div>
        </div>

        {/* Certificate Kind Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {kindOptions.map((k) => {
            const hasAccess = canAccessKind(k.key);
            const isSelected = activeKind === k.key;
            return (
              <button
                key={k.key}
                type="button"
                disabled={!hasAccess}
                onClick={() => setActiveKind(k.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : hasAccess
                    ? "text-slate-600 hover:text-slate-900"
                    : "text-slate-400 opacity-50 cursor-not-allowed"
                }`}
                title={!hasAccess ? "Your DEO account does not have scope for this service" : undefined}
              >
                <span>{k.icon}</span>
                <span>{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="text-xs gap-1.5 h-8 text-slate-700"
          >
            <History size={14} />
            <span className="hidden md:inline">Versions ({versionHistory.length})</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestPdfExport}
            className="text-xs gap-1.5 h-8 text-slate-700 border-slate-300"
            title="Download test certificate PDF with current page setup"
          >
            <FileDown size={14} />
            <span className="hidden sm:inline">Test PDF</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestBrowserPrint}
            className="text-xs gap-1.5 h-8 text-slate-700 border-slate-300"
            title="Open browser print dialog with @page setup"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print Preview</span>
          </Button>

          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={handleSaveDraft}
              className="text-xs gap-1.5 h-8 font-semibold text-slate-800"
            >
              <Save size={14} />
              <span>Save Draft</span>
            </Button>
          )}

          {canActivate && (
            <Button
              type="button"
              size="sm"
              disabled={saving || validationErrors.length > 0}
              onClick={() => setShowActivateConfirm(true)}
              className="text-xs gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <CheckCircle2 size={14} />
              <span>Activate Layout</span>
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs p-2 h-8 text-slate-500 hover:text-slate-800"
            title="Reset to safe default settings"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </header>

      {/* Validation banner if errors exist */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-1.5 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" />
          <span>{validationErrors.join(" ")}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center: Live Document Canvas */}
        <main className="flex-1 overflow-hidden relative">
          <CertificateLivePreview
            config={config}
            sampleKind={activeKind}
            onFitToPage={() => {
              handleConfigChange({
                ...config,
                scaleMode: "fit",
                elementsConfig: {
                  ...config.elementsConfig,
                  body: {
                    ...config.elementsConfig.body,
                    fontSize: Math.max(9, config.elementsConfig.body.fontSize - 0.5),
                    lineHeight: Math.max(1.3, Number((config.elementsConfig.body.lineHeight - 0.1).toFixed(1))),
                  },
                },
              });
              toast.info("Adjusted text density to fit printable area.");
            }}
          />
        </main>

        {/* Right: MS Word-like Page Setup Panel */}
        <aside className="w-80 md:w-96 shrink-0 h-full border-l border-slate-300 shadow-lg">
          <PageSetupPanel
            config={config}
            onChange={handleConfigChange}
            canEdit={canEdit}
          />
        </aside>
      </div>

      {/* Activation Confirmation Dialog */}
      <Dialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="text-emerald-600" size={20} />
              Activate Certificate Layout Version
            </DialogTitle>
            <DialogDescription className="text-slate-600 text-xs leading-relaxed pt-2">
              You are about to activate this layout for all <strong>newly generated {activeKind} certificates</strong>.
              <br /><br />
              <strong>Historical Immutability Guarantee:</strong> Any certificates that were previously issued and approved
              will retain their original layout snapshots and will not be altered.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
            <div>Paper Size: <strong>{config.pageSizePreset.toUpperCase()} ({config.pageWidthMm} × {config.pageHeightMm} mm)</strong></div>
            <div>Orientation: <strong>{config.orientation}</strong></div>
            <div>Margins: <strong>T:{config.marginTopMm} B:{config.marginBottomMm} L:{config.marginLeftMm} R:{config.marginRightMm} mm</strong></div>
            <div>Scale: <strong>{config.scaleMode} ({config.scalePercent}%)</strong></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowActivateConfirm(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleActivateConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Confirm & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <History size={20} className="text-primary" />
              Template Version History — {activeKind.toUpperCase()}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Inspect previous versions and drafts. All historical revisions maintain audit logs.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {versionHistory.map((item) => (
              <div
                key={item.id || item.version}
                className={`p-3 rounded-lg border flex items-center justify-between transition ${
                  item.version === config.version
                    ? "bg-primary/5 border-primary"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Version {item.version}</span>
                    {item.isActive ? (
                      <Badge className="bg-emerald-600 text-white text-[9px]">ACTIVE PRODUCTION</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500 text-[9px] capitalize">{item.status}</Badge>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.pageSizePreset.toUpperCase()} · {item.orientation} · Margins: {item.marginTopMm}/{item.marginBottomMm}/{item.marginLeftMm}/{item.marginRightMm} mm
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Created by {item.createdByName || "Super Admin"} · {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("en-IN") : "Standard"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={() => {
                      setConfig(item);
                      setIsDirty(false);
                      setShowHistoryModal(false);
                      toast.info(`Loaded layout v${item.version} into designer.`);
                    }}
                  >
                    Load into Canvas
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button size="sm" variant="outline" onClick={() => setShowHistoryModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
