import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useAuthz } from "@/lib/permissions";
import {
  CertificateServiceKind,
  CertificateTemplate,
  PageSetup,
  ElementStyles,
  getEffectivePageDimensions,
} from "@/types/certificateTemplate";
import {
  getActiveTemplate,
  listTemplatesForService,
  saveDraftTemplate,
  activateTemplate,
  createNextVersion,
  getTemplateAuditLogs,
} from "@/lib/certificateTemplateService";
import { PageSetupPanel } from "@/components/templates/PageSetupPanel";
import { TemplateElementsPanel } from "@/components/templates/TemplateElementsPanel";
import { LivePagePreview } from "@/components/templates/LivePagePreview";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  SlidersHorizontal,
  Save,
  CheckCircle,
  RotateCcw,
  FilePlus,
  History,
  FileText,
  ShieldAlert,
  Download,
  Eye,
  AlertCircle,
} from "lucide-react";

export default function CertificateTemplateDesigner() {
  const authz = useAuthz();
  const [serviceKind, setServiceKind] = useState<CertificateServiceKind>("warish");
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [originalTemplate, setOriginalTemplate] = useState<CertificateTemplate | null>(null);
  const [allVersions, setAllVersions] = useState<CertificateTemplate[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"layout" | "elements">("layout");

  // Determine permissions
  const isSuperAdmin = authz.isSuperAdmin;
  const isDeo = authz.isDeo;
  const serviceScope = authz.serviceScope || [];
  const canEdit =
    isSuperAdmin ||
    (isDeo && (serviceScope.includes("all") || serviceScope.includes(serviceKind)));

  // Load template for selected service
  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const [activeTmpl, versions] = await Promise.all([
          getActiveTemplate(serviceKind),
          listTemplatesForService(serviceKind),
        ]);
        if (!active) return;
        setTemplate(activeTmpl);
        setOriginalTemplate(JSON.parse(JSON.stringify(activeTmpl)));
        setAllVersions(versions);
      } catch (e: any) {
        toast.error("Failed to load certificate template.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [serviceKind]);

  const handlePageSetupChange = (updatedSetup: PageSetup) => {
    if (!template) return;
    setTemplate({
      ...template,
      page_setup: updatedSetup,
    });
  };

  const handleElementsChange = (
    updatedStyles: ElementStyles,
    assetUrl?: string | null,
    assetName?: string | null
  ) => {
    if (!template) return;
    setTemplate({
      ...template,
      element_styles: updatedStyles,
      template_asset_url: assetUrl !== undefined ? assetUrl : template.template_asset_url,
      template_asset_name: assetName !== undefined ? assetName : template.template_asset_name,
    });
  };

  const handleAutoFitToPage = () => {
    if (!template) return;
    // Calculate optimal margins and scale for clean fit
    const { widthMm, heightMm } = getEffectivePageDimensions(template.page_setup);
    const compactMargin = Math.max(12, Math.min(template.page_setup.margin_top_mm, 15));
    setTemplate({
      ...template,
      page_setup: {
        ...template.page_setup,
        margin_top_mm: compactMargin,
        margin_bottom_mm: compactMargin,
        margin_left_mm: compactMargin,
        margin_right_mm: compactMargin,
        scale_mode: "fit_page",
        scale_percent: 100,
      },
      element_styles: {
        ...template.element_styles,
        line_height: 1.5,
        body_font_size_pt: Math.max(10, template.element_styles.body_font_size_pt - 1),
      },
    });
    toast.success("Applied Fit-to-Page margin & scaling parameters.");
  };

  const handleSaveDraft = async () => {
    if (!template) return;
    setIsSaving(true);
    try {
      const res = await saveDraftTemplate(template, authz.email, authz.role);
      if (res.success && res.template) {
        setTemplate(res.template);
        setOriginalTemplate(JSON.parse(JSON.stringify(res.template)));
        toast.success(`Saved Draft for ${template.name} (v${template.version})`);
        const versions = await listTemplatesForService(serviceKind);
        setAllVersions(versions);
      } else {
        toast.error(res.error || "Could not save template changes.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!template) return;
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can activate templates for official issuance.");
      return;
    }

    setIsSaving(true);
    try {
      // First save draft state
      const saveRes = await saveDraftTemplate(template, authz.email, authz.role);
      const targetId = saveRes.template?.id || template.id;

      const actRes = await activateTemplate(targetId, serviceKind, authz.email, authz.role);
      if (actRes.success && actRes.activeTemplate) {
        setTemplate(actRes.activeTemplate);
        setOriginalTemplate(JSON.parse(JSON.stringify(actRes.activeTemplate)));
        toast.success(`Activated Version ${actRes.activeTemplate.version} as official ${serviceKind.toUpperCase()} template!`);
        const versions = await listTemplatesForService(serviceKind);
        setAllVersions(versions);
      } else {
        toast.error(actRes.error || "Activation failed.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Activation error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewVersion = async () => {
    if (!template) return;
    setIsSaving(true);
    try {
      const res = await createNextVersion(serviceKind, template, authz.email, authz.role);
      if (res.success && res.newTemplate) {
        setTemplate(res.newTemplate);
        setOriginalTemplate(JSON.parse(JSON.stringify(res.newTemplate)));
        toast.success(`Created New Draft Template: Version ${res.newTemplate.version}`);
        const versions = await listTemplatesForService(serviceKind);
        setAllVersions(versions);
      } else {
        toast.error(res.error || "Failed to create next template version.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Version creation error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!originalTemplate) return;
    setTemplate(JSON.parse(JSON.stringify(originalTemplate)));
    toast.info("Reverted all unsaved modifications.");
  };

  const handleSelectVersion = (v: CertificateTemplate) => {
    setTemplate(v);
    setOriginalTemplate(JSON.parse(JSON.stringify(v)));
    setIsHistoryOpen(false);
    toast.info(`Loaded Version ${v.version} (${v.status}).`);
  };

  const handleOpenAuditLogs = async () => {
    setIsAuditOpen(true);
    const logs = await getTemplateAuditLogs(serviceKind);
    setAuditLogs(logs);
  };

  const hasUnsavedChanges =
    JSON.stringify(template) !== JSON.stringify(originalTemplate);

  if (isLoading || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">Loading Page Setup & Template Designer…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Certificate Templates & Page Setup — Bagula II GP</title>
        <meta name="description" content="Microsoft Word-style Print Page Setup, margins, orientation, and certificate designer." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        {/* Top Header Bar */}
        <header className="bg-card border-b px-4 py-3 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton fallbackUrl="/admin/dashboard" label="Dashboard" />
              <div className="h-5 w-px bg-border hidden sm:block" />
              <div>
                <h1 className="font-bold text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <span>Certificate Template & Print Page Setup</span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  MS Word-style page setup, physical mm margins, orientation & immutable version governance
                </p>
              </div>
            </div>

            {/* Service Kind Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted/70 p-1 rounded-lg border text-xs font-semibold">
                {(["warish", "dependent", "linkage"] as CertificateServiceKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (!confirm("You have unsaved changes in this template. Discard and switch?")) return;
                      }
                      setServiceKind(k);
                    }}
                    className={`px-3 py-1.5 rounded-md capitalize transition ${
                      serviceKind === k
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>

              {/* Version & Status Badge */}
              <div className="flex items-center gap-1.5 pl-2">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="flex items-center gap-1 text-xs border rounded-lg px-2.5 py-1.5 bg-background hover:bg-muted font-mono"
                  title="View Version History"
                >
                  <History className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-semibold">v{template.version}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-sans capitalize ${
                      template.status === "active"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold"
                        : template.status === "draft"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {template.status}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Action Toolbar */}
        <div className="bg-background border-b px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Unsaved modifications
                </span>
              )}
              {!canEdit && (
                <span className="flex items-center gap-1 text-muted-foreground bg-muted px-2.5 py-1 rounded">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Read-Only Mode (DEO scope restricted)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={!hasUnsavedChanges || isSaving}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewVersion}
                disabled={!canEdit || isSaving}
                className="h-8 text-xs gap-1.5"
              >
                <FilePlus className="w-3.5 h-3.5" />
                New Version
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenAuditLogs}
                className="h-8 text-xs gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                Audit Logs
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={!canEdit || isSaving || !hasUnsavedChanges}
                className="h-8 text-xs gap-1.5 font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "Saving…" : "Save Draft"}
              </Button>

              {isSuperAdmin && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleActivate}
                  disabled={isSaving || template.status === "active"}
                  className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {template.status === "active" ? "Active Version" : "Activate for Production"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Work Area: 3-pane on desktop, tabbed on mobile */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Controls Pane (Page Setup & Elements) */}
          <div className="lg:col-span-4 space-y-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as any)}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="layout" className="text-xs font-semibold gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Page Setup
                </TabsTrigger>
                <TabsTrigger value="elements" className="text-xs font-semibold gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Elements & Styles
                </TabsTrigger>
              </TabsList>

              <TabsContent value="layout" className="m-0">
                <PageSetupPanel
                  pageSetup={template.page_setup}
                  onChange={handlePageSetupChange}
                  onFitToPage={handleAutoFitToPage}
                  disabled={!canEdit}
                />
              </TabsContent>

              <TabsContent value="elements" className="m-0">
                <TemplateElementsPanel
                  template={template}
                  onChange={handleElementsChange}
                  actorEmail={authz.email}
                  disabled={!canEdit}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Preview Pane (Live Document Editor Canvas) */}
          <div className="lg:col-span-8 h-[calc(100vh-180px)] min-h-[640px] sticky top-28">
            <LivePagePreview
              template={template}
              showRulers={true}
              onFitToPage={handleAutoFitToPage}
            />
          </div>
        </div>

        {/* Version History Drawer / Modal */}
        <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <span>Template Version History — {serviceKind.toUpperCase()}</span>
              </DialogTitle>
              <DialogDescription>
                Historical templates remain permanently immutable. Previously issued certificates remain linked to their original issuance version.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {allVersions.map((v) => {
                const isSelected = v.id === template.id;
                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-mono">Version {v.version}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                            v.status === "active"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                              : v.status === "draft"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {v.status}
                        </span>
                        {isSelected && <span className="text-[11px] text-primary font-bold">(Currently Editing)</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {v.page_setup.preset} · {v.page_setup.orientation} · Margins: {v.page_setup.margin_top_mm}/{v.page_setup.margin_bottom_mm}/{v.page_setup.margin_left_mm}/{v.page_setup.margin_right_mm} mm
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        Updated: {new Date(v.updated_at).toLocaleString("en-IN")} by {v.updated_by || "System"}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleSelectVersion(v)}
                      className="text-xs font-semibold"
                    >
                      {isSelected ? "Active in Editor" : "Load Layout"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Audit Trail Modal */}
        <Dialog open={isAuditOpen} onOpenChange={setIsAuditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <span>Template Audit Logs — {serviceKind.toUpperCase()}</span>
              </DialogTitle>
              <DialogDescription>
                Full administrative audit trail of layout modifications, orientation adjustments, and activations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No audit records recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border bg-card text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-primary">{log.action}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <span>Actor: <strong>{log.actor_email || "System"}</strong></span>
                      <span>·</span>
                      <span>Role: <strong>{log.actor_role || "Office Admin"}</strong></span>
                      <span>·</span>
                      <span>Version: <strong>v{log.new_version}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
