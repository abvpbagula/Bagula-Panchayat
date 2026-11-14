import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { loadBusinessRule, saveBusinessRule } from "@/lib/businessRulesService";
import { FileText, ShieldCheck, HardDrive, CheckCircle2, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

interface DocumentConstraintConfig {
  maxGlobalSizeBytes: number;
  allowedExtensions: string[];
  documents: {
    id: string;
    label: string;
    maxSizeBytes: number;
    mandatory: boolean;
    allowedFormats: string[];
  }[];
}

const DEFAULT_DOC_CONSTRAINTS: DocumentConstraintConfig = {
  maxGlobalSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
  documents: [
    { id: "aadhaar", label: "Aadhaar Card of Applicant", maxSizeBytes: 2 * 1024 * 1024, mandatory: true, allowedFormats: ["pdf", "jpg", "jpeg"] },
    { id: "death_cert", label: "Deceased Death Certificate", maxSizeBytes: 2 * 1024 * 1024, mandatory: true, allowedFormats: ["pdf", "jpg", "jpeg"] },
    { id: "epic", label: "Voter ID / EPIC Card", maxSizeBytes: 2 * 1024 * 1024, mandatory: true, allowedFormats: ["pdf", "jpg", "jpeg"] },
    { id: "land_deed", label: "Land Record (Parcha / Khatian)", maxSizeBytes: 5 * 1024 * 1024, mandatory: false, allowedFormats: ["pdf"] },
    { id: "affidavit", label: "Registered Legal Heir Affidavit", maxSizeBytes: 3 * 1024 * 1024, mandatory: true, allowedFormats: ["pdf"] },
    { id: "ration", label: "Digital Ration Card", maxSizeBytes: 2 * 1024 * 1024, mandatory: false, allowedFormats: ["pdf", "jpg", "jpeg"] },
  ],
};

export const DocumentsSection: React.FC = () => {
  const authz = useAuthz();
  const [config, setConfig] = useState<DocumentConstraintConfig>(DEFAULT_DOC_CONSTRAINTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusinessRule<DocumentConstraintConfig>("document_upload_constraints", DEFAULT_DOC_CONSTRAINTS).then((data) => {
      setConfig({ ...DEFAULT_DOC_CONSTRAINTS, ...data });
    });
  }, []);

  const handleToggleDocMandatory = (id: string, mandatory: boolean) => {
    setConfig((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, mandatory } : d)),
    }));
  };

  const handleUpdateDocSize = (id: string, mb: number) => {
    setConfig((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, maxSizeBytes: mb * 1024 * 1024 } : d)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveBusinessRule(
      "document_upload_constraints",
      config,
      "Official document upload restrictions, extensions, and max file sizes"
    );
    setSaving(false);
    if (res.success) {
      toast.success("Document upload constraints and file size rules updated.");
    } else {
      toast.error(res.error || "Failed to save document constraints");
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_DOC_CONSTRAINTS);
    toast.info("Reset to standard document upload restrictions.");
  };

  return (
    <div className="space-y-6">
      {/* Storage Security Architecture Card */}
      <Card className="shadow-xs border border-blue-400/30 bg-blue-50/10">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Storage Bucket Isolation & Confidentiality
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All citizen supporting proofs are held in private Supabase storage buckets protected by row-level access control.
              Only the authenticated applicant citizen and authorized Panchayat verifying officers can retrieve uploaded PDFs or image scans.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Global File Restrictions */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-primary" />
            <span>Global Upload Policies</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Overall ceiling limits to prevent server buffer exhaustion and storage bloat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Global Maximum File Size (MB)</Label>
              <Input
                type="number"
                value={config.maxGlobalSizeBytes / (1024 * 1024)}
                onChange={(e) => setConfig({ ...config, maxGlobalSizeBytes: (Number(e.target.value) || 5) * 1024 * 1024 })}
                className="text-xs"
                min={1}
                max={25}
              />
              <p className="text-[10px] text-muted-foreground">Applies as a hard cutoff before payload enters the upload stream.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Authorized MIME / File Formats</Label>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {["pdf", "jpg", "jpeg", "png"].map((ext) => (
                  <Badge key={ext} variant="secondary" className="text-xs font-mono uppercase">
                    .{ext}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">Executable or archive formats (.exe, .zip, .bat) are blocked unconditionally.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Document Checklist */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Document Types & Verification Requirements</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Specify mandatory status and maximum size thresholds per document category.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {config.documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg border bg-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{doc.label}</span>
                    <Badge variant={doc.mandatory ? "default" : "outline"} className="text-[9px]">
                      {doc.mandatory ? "Mandatory" : "Optional"}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    Allowed: {doc.allowedFormats.join(", ").toUpperCase()} | Max: {doc.maxSizeBytes / (1024 * 1024)} MB
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px]">Size (MB):</Label>
                    <Input
                      type="number"
                      value={doc.maxSizeBytes / (1024 * 1024)}
                      onChange={(e) => handleUpdateDocSize(doc.id, Number(e.target.value) || 2)}
                      className="w-16 h-7 text-xs"
                      min={1}
                      max={15}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={doc.mandatory}
                      onCheckedChange={(c) => handleToggleDocMandatory(doc.id, c)}
                    />
                    <span className="text-[11px] w-16">{doc.mandatory ? "Required" : "Optional"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Upload Constraints"}
        </Button>
      </div>
    </div>
  );
};
