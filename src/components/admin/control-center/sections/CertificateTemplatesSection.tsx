import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  type CertificateKind,
  type CertificateTemplateConfig,
} from "@/core/certificateTemplateTypes";
import {
  getActiveTemplate,
  getTemplatesByKind,
  activateTemplateVersion,
} from "@/core/certificateTemplateService";
import { toast } from "sonner";
import {
  FileCheck2,
  SlidersHorizontal,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const CertificateTemplatesSection: React.FC = () => {
  const authz = useAuthz();
  const [activeTemplates, setActiveTemplates] = useState<{
    warish?: CertificateTemplateConfig;
    dependent?: CertificateTemplateConfig;
    linkage?: CertificateTemplateConfig;
  }>({});
  const [allTemplates, setAllTemplates] = useState<CertificateTemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [wActive, dActive, lActive, wList, dList, lList] = await Promise.all([
        getActiveTemplate("warish"),
        getActiveTemplate("dependent"),
        getActiveTemplate("linkage"),
        getTemplatesByKind("warish"),
        getTemplatesByKind("dependent"),
        getTemplatesByKind("linkage"),
      ]);

      setActiveTemplates({
        warish: wActive,
        dependent: dActive,
        linkage: lActive,
      });

      setAllTemplates([...wList, ...dList, ...lList]);
    } catch (err: any) {
      toast.error("Failed to load certificate templates: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSetActive = async (id: string, kind: CertificateKind, name: string) => {
    try {
      await activateTemplateVersion(id, kind, authz.email || "super_admin");
      toast.success(`Template "${name}" is now set as active for newly issued certificates.`);
      fetchTemplates();
    } catch (err: any) {
      toast.error("Failed to activate template: " + err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance & Immutability Notice Card */}
      <Card className="shadow-xs border border-emerald-500/30 bg-emerald-50/10">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Certificate Immutability & Archival Governance Rule
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Every certificate issued by Bagula 2 No Gram Panchayat is permanently bound to the exact
              <strong className="text-foreground"> config_snapshot</strong> of the template at the moment of official issuance.
              Modifying an active template alters future certificates only; historical records remain immutable and tamper-proof.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Certificate Presets Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Warish */}
        <Card className="shadow-xs border">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Warish Certificate</span>
              <Badge variant="default" className="text-[9px] font-mono bg-emerald-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs space-y-1.5">
            <div className="font-medium text-foreground truncate">
              {activeTemplates.warish?.name || "Standard Statutory Warish"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Preset: {activeTemplates.warish?.pageSizePreset?.toUpperCase() || "A4"} (
              {activeTemplates.warish?.pageWidthMm || 210} × {activeTemplates.warish?.pageHeightMm || 297} mm)
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Margins: T:{activeTemplates.warish?.marginTopMm}mm B:{activeTemplates.warish?.marginBottomMm}mm L:{activeTemplates.warish?.marginLeftMm}mm R:{activeTemplates.warish?.marginRightMm}mm
            </div>
          </CardContent>
        </Card>

        {/* Dependent */}
        <Card className="shadow-xs border">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Dependent Certificate</span>
              <Badge variant="default" className="text-[9px] font-mono bg-emerald-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs space-y-1.5">
            <div className="font-medium text-foreground truncate">
              {activeTemplates.dependent?.name || "Statutory Family Dependency"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Preset: {activeTemplates.dependent?.pageSizePreset?.toUpperCase() || "A4"} (
              {activeTemplates.dependent?.pageWidthMm || 210} × {activeTemplates.dependent?.pageHeightMm || 297} mm)
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Margins: T:{activeTemplates.dependent?.marginTopMm}mm B:{activeTemplates.dependent?.marginBottomMm}mm L:{activeTemplates.dependent?.marginLeftMm}mm R:{activeTemplates.dependent?.marginRightMm}mm
            </div>
          </CardContent>
        </Card>

        {/* Linkage */}
        <Card className="shadow-xs border">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Linkage Certificate</span>
              <Badge variant="default" className="text-[9px] font-mono bg-emerald-600">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-xs space-y-1.5">
            <div className="font-medium text-foreground truncate">
              {activeTemplates.linkage?.name || "Electoral Lineage Linkage"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Preset: {activeTemplates.linkage?.pageSizePreset?.toUpperCase() || "A4"} (
              {activeTemplates.linkage?.pageWidthMm || 210} × {activeTemplates.linkage?.pageHeightMm || 297} mm)
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Margins: T:{activeTemplates.linkage?.marginTopMm}mm B:{activeTemplates.linkage?.marginBottomMm}mm L:{activeTemplates.linkage?.marginLeftMm}mm R:{activeTemplates.linkage?.marginRightMm}mm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Version Directory */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <span>Registered Template Versions ({allTemplates.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              All stored certificate layout variations with version numbers and activation states.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchTemplates} className="text-xs h-8 gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Link to="/admin/templates">
              <Button variant="default" size="sm" className="text-xs h-8 gap-1">
                Visual Designer <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading templates...
            </div>
          ) : allTemplates.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No template revisions recorded in database.
            </div>
          ) : (
            <div className="space-y-3">
              {allTemplates.map((t) => (
                <div
                  key={t.id || t.name}
                  className="p-3 rounded-lg border bg-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{t.name}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {t.serviceKind}
                      </Badge>
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        v{t.version}
                      </Badge>
                      {t.isActive && (
                        <Badge variant="default" className="text-[9px] bg-emerald-600 font-mono">
                          ACTIVE
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Size: {t.pageSizePreset?.toUpperCase()} ({t.pageWidthMm} × {t.pageHeightMm} mm) | Orientation: {t.orientation}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link to="/admin/templates">
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                        <Eye className="h-3 w-3" /> Inspect
                      </Button>
                    </Link>
                    {!t.isActive && t.id && (
                      <Button
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => handleSetActive(t.id!, t.serviceKind, t.name)}
                      >
                        Set as Active
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
