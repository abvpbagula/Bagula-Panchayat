import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  type AdministrativeAuthoritySettings,
  getCachedAuthoritySettings,
  loadAllAppSettings,
  saveAuthoritySettings,
} from "@/lib/appSettings";
import { Building2, Phone, Mail, Clock, Save, ShieldCheck } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const SystemConfigSection: React.FC = () => {
  const authz = useAuthz();
  const [settings, setSettings] = useState<AdministrativeAuthoritySettings>(getCachedAuthoritySettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllAppSettings().then((all) => {
      if (all?.authoritySettings) {
        setSettings(all.authoritySettings);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const ok = await saveAuthoritySettings(settings, authz.email);
    setSaving(false);
    if (ok) {
      toast.success("Gram Panchayat office configuration and jurisdictional records saved.");
    } else {
      toast.error("Failed to save office configuration");
    }
  };

  return (
    <div className="space-y-6">
      {/* Office Details Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Gram Panchayat Secretariat & Location</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Constitutional office coordinates, postal address, and contact helpline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Gram Panchayat Name</Label>
              <Input
                value={settings.gramPanchayatName}
                onChange={(e) => setSettings({ ...settings, gramPanchayatName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Block & District Jurisdiction</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={settings.blockName}
                  onChange={(e) => setSettings({ ...settings, blockName: e.target.value })}
                  placeholder="Block Name"
                  className="text-xs"
                />
                <Input
                  value={settings.districtName}
                  onChange={(e) => setSettings({ ...settings, districtName: e.target.value })}
                  placeholder="District Name"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Official Contact Email</Label>
              <Input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Helpline Phone Number</Label>
              <Input
                value={settings.helplinePhone}
                onChange={(e) => setSettings({ ...settings, helplinePhone: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Postal PIN Code</Label>
              <Input
                value={settings.pinCode}
                onChange={(e) => setSettings({ ...settings, pinCode: e.target.value })}
                className="text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Police Station Jurisdiction</Label>
              <Input
                value={settings.policeStationName}
                onChange={(e) => setSettings({ ...settings, policeStationName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">State</Label>
              <Input
                value={settings.stateName}
                onChange={(e) => setSettings({ ...settings, stateName: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Official Signatories & Authorities */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Statutory Signatories & Officials</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Signatory designations and official names for legal certificate records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Elected Pradhan Name</Label>
              <Input
                value={settings.pradhanName}
                onChange={(e) => setSettings({ ...settings, pradhanName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Executive Assistant Designation / Name</Label>
              <Input
                value={settings.executiveAssistantName}
                onChange={(e) => setSettings({ ...settings, executiveAssistantName: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Secretary Designation / Name</Label>
              <Input
                value={settings.secretaryName}
                onChange={(e) => setSettings({ ...settings, secretaryName: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex items-center justify-end pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Office Configuration"}
        </Button>
      </div>
    </div>
  );
};
