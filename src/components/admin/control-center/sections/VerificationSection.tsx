import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type VerificationSettingsConfig,
  DEFAULT_VERIFICATION_SETTINGS,
  loadVerificationSettingsConfig,
  saveVerificationSettingsConfig,
} from "@/lib/governanceCenterService";
import { QrCode, ShieldCheck, Eye, EyeOff, Save, RotateCcw, CheckCircle2, Lock } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const VerificationSection: React.FC = () => {
  const authz = useAuthz();
  const [config, setConfig] = useState<VerificationSettingsConfig>(DEFAULT_VERIFICATION_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVerificationSettingsConfig().then((loaded) => setConfig(loaded));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveVerificationSettingsConfig(config, authz.email);
    setSaving(false);
    if (res.success) {
      toast.success("Public verification policies and privacy masking updated.");
    } else {
      toast.error(res.error || "Failed to save verification settings");
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_VERIFICATION_SETTINGS);
    toast.info("Reset to default verification policy.");
  };

  return (
    <div className="space-y-6">
      {/* Privacy Protection Notice */}
      <Card className="shadow-xs border border-emerald-500/30 bg-emerald-50/10">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Statutory Anti-Tamper & PII Masking Architecture
            </div>
            <p className="text-muted-foreground leading-relaxed">
              When external authorities (Banks, Land Revenue BL&LRO, Courts, Passport Offices) scan a Bagula 2 No Gram Panchayat QR code, the public verification screen validates the cryptographic signature while strictly redacting sensitive personal identifiers (Aadhaar & phone) to uphold citizen privacy rights.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Live Verification Scan Simulation Preview */}
      <Card className="shadow-xs border bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live Public QR Verification Simulation
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-300">
              Authenticated Match
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 text-xs">
          <div className="p-4 rounded-lg border bg-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">OFFICIAL CERTIFICATE VERIFIED</div>
                <div className="text-[11px] text-muted-foreground">
                  Issued under the statutory seal of Bagula 2 No Gram Panchayat
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t pt-3 text-[11px]">
              <div>
                <div className="text-muted-foreground">Memo Number</div>
                <div className="font-mono font-semibold text-foreground">B2/WAR/2026/0891</div>
              </div>
              <div>
                <div className="text-muted-foreground">Certificate Holder</div>
                <div className="font-semibold text-foreground">ANITA DEBNATH</div>
              </div>
              <div>
                <div className="text-muted-foreground">Citizen Mobile</div>
                <div className="font-mono font-semibold text-foreground">
                  {config.maskCitizenPhone ? "******8492" : "9832148492"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Aadhaar Last 4</div>
                <div className="font-mono font-semibold text-foreground">
                  {config.maskAadhaar ? "XXXX-XXXX-9142" : "4829-1029-9142"}
                </div>
              </div>
            </div>

            {config.showSignatoryName && (
              <div className="border-t pt-2 text-[10px] text-muted-foreground flex items-center justify-between">
                <span>Signatory: Pradhan / Executive Secretary, Bagula 2 No Gram Panchayat</span>
                <span>Watermark: {config.watermarkText}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Privacy Switches */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary" />
            <span>Public QR Verification Display Rules</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Configure masking and verification fields shown on the public lookup page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Mask Citizen Mobile Number (e.g. ******1234)</div>
              <div className="text-[11px] text-muted-foreground">Protects citizen contact privacy from unauthorized lookup scraping.</div>
            </div>
            <Switch
              checked={config.maskCitizenPhone}
              onCheckedChange={(c) => setConfig({ ...config, maskCitizenPhone: c })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Mask Aadhaar Number (XXXX-XXXX-1234)</div>
              <div className="text-[11px] text-muted-foreground">Statutory compliance with UIDAI citizen privacy mandates.</div>
            </div>
            <Switch
              checked={config.maskAadhaar}
              onCheckedChange={(c) => setConfig({ ...config, maskAadhaar: c })}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Show Official Signatory Name on Public Result</div>
              <div className="text-[11px] text-muted-foreground">Displays the name and designation of the issuing Panchayat officer.</div>
            </div>
            <Switch
              checked={config.showSignatoryName}
              onCheckedChange={(c) => setConfig({ ...config, showSignatoryName: c })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Certificate Watermark Text</Label>
              <Input
                value={config.watermarkText}
                onChange={(e) => setConfig({ ...config, watermarkText: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Public Verification Rate Limit (Scans / Min / IP)</Label>
              <Input
                type="number"
                value={config.rateLimitScansPerMin}
                onChange={(e) => setConfig({ ...config, rateLimitScansPerMin: Number(e.target.value) || 30 })}
                className="text-xs"
                min={5}
                max={120}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Verification Policies"}
        </Button>
      </div>
    </div>
  );
};
