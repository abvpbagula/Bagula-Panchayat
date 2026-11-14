import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type CertificateTemplateConfig,
  type CertificateKind,
} from "@/core/certificateTemplateTypes";
import {
  getActiveTemplate,
  saveTemplateDraft,
} from "@/core/certificateTemplateService";
import { PageSetupPanel } from "@/components/admin/PageSetupPanel";
import { SlidersHorizontal, Save, RotateCcw, Printer, Sparkles, ShieldCheck } from "lucide-react";
import { useAuthz } from "@/lib/permissions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const PrintPageSetupSection: React.FC = () => {
  const authz = useAuthz();
  const [selectedKind, setSelectedKind] = useState<CertificateKind>("warish");
  const [template, setTemplate] = useState<CertificateTemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchActive = async (kind: CertificateKind) => {
    setLoading(true);
    try {
      const active = await getActiveTemplate(kind);
      setTemplate(active);
    } catch (err: any) {
      toast.error("Failed to load active template: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive(selectedKind);
  }, [selectedKind]);

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      await saveTemplateDraft(template, authz.email || "super_admin");
      toast.success(`Page setup and millimeter print geometry saved for ${selectedKind.toUpperCase()}.`);
    } catch (err: any) {
      toast.error("Failed to save print setup: " + err?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xs border border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start justify-between gap-4 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              <span>Millimeter-Accurate Physical Print Setup</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Standard Indian Gram Panchayat stationery defaults to ISO A4 (210mm × 297mm) in Portrait orientation.
              Fine-tune margins, orientation, header offset, and watermark density. These settings govern all newly generated official PDFs.
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !template}
            className="text-xs gap-1.5 shrink-0"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Geometry"}
          </Button>
        </CardContent>
      </Card>

      {/* Kind Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">Select Certificate Category:</span>
          <Select value={selectedKind} onValueChange={(val: any) => setSelectedKind(val)}>
            <SelectTrigger className="h-8 text-xs w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="warish">Warish Certificate (উত্তরাধিকার)</SelectItem>
              <SelectItem value="dependent">Dependent Certificate (নির্ভরশীল)</SelectItem>
              <SelectItem value="linkage">Linkage Certificate (লিঙ্কেজ)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {template && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{template.name}</Badge>
            <Badge variant="secondary" className="font-mono text-xs">v{template.version}</Badge>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-muted-foreground">
          Loading certificate millimeter geometry...
        </div>
      ) : template ? (
        <PageSetupPanel
          config={template}
          onChange={(updated) => setTemplate(updated)}
          canEdit={true}
        />
      ) : null}
    </div>
  );
};
