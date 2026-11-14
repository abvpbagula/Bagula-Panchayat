import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  type FeatureFlagsConfig,
  DEFAULT_FEATURE_FLAGS,
  loadFeatureFlagsConfig,
  saveFeatureFlagsConfig,
} from "@/lib/governanceCenterService";
import { ToggleLeft, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const FeatureAvailabilitySection: React.FC = () => {
  const authz = useAuthz();
  const [flags, setFlags] = useState<FeatureFlagsConfig>(DEFAULT_FEATURE_FLAGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFeatureFlagsConfig().then((loaded) => setFlags(loaded));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveFeatureFlagsConfig(flags, authz.email);
    setSaving(false);
    if (res.success) {
      toast.success("Feature flags and operational switches updated across runtime.");
    } else {
      toast.error(res.error || "Failed to save feature flags");
    }
  };

  const handleReset = () => {
    setFlags(DEFAULT_FEATURE_FLAGS);
    toast.info("Reset feature flags to default state.");
  };

  return (
    <div className="space-y-6">
      {flags.maintenanceMode && (
        <Card className="shadow-xs border border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3 text-xs text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <div className="font-bold">SYSTEM IN MAINTENANCE MODE</div>
              <p className="text-[11px] opacity-90 mt-0.5">
                Cyber Cafe public application submission is paused during system updates. Only Super Admins can access internal queues.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ToggleLeft className="h-4 w-4 text-primary" />
            <span>Operational Feature Flags</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Toggle functional Cyber Cafe and office intake modules without service restarts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Cyber Cafe Online Application Intake</div>
              <div className="text-[11px] text-muted-foreground">
                Allows Cyber Cafe desks to prepare and submit Warish, Dependent, and Linkage applications.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={flags.citizenOnlineApply}
                onCheckedChange={(c) => setFlags({ ...flags, citizenOnlineApply: c })}
              />
              <span className="text-xs font-medium w-12">{flags.citizenOnlineApply ? "Active" : "Paused"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">DEO Counter Data Entry</div>
              <div className="text-[11px] text-muted-foreground">
                Allows authenticated Data Entry Operators (DEO) to record counter applications.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={flags.deoApplicationEntry}
                onCheckedChange={(c) => setFlags({ ...flags, deoApplicationEntry: c })}
              />
              <span className="text-xs font-medium w-12">{flags.deoApplicationEntry ? "Active" : "Paused"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Legacy Birth Record Digitization</div>
              <div className="text-[11px] text-muted-foreground">
                Allows DEOs and Cyber Cafe intake forms to record historical birth entries into the searchable index.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={flags.birthDigitizationIntake}
                onCheckedChange={(c) => setFlags({ ...flags, birthDigitizationIntake: c })}
              />
              <span className="text-xs font-medium w-12">{flags.birthDigitizationIntake ? "Active" : "Paused"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Public QR Verification Engine</div>
              <div className="text-[11px] text-muted-foreground">
                Allows banks, courts, and applicants to scan QR codes and verify issued certificate validity.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={flags.qrVerification}
                onCheckedChange={(c) => setFlags({ ...flags, qrVerification: c })}
              />
              <span className="text-xs font-medium w-12">{flags.qrVerification ? "Active" : "Paused"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/40 bg-destructive/5">
            <div>
              <div className="font-semibold text-destructive">Emergency Maintenance Mode</div>
              <div className="text-[11px] text-muted-foreground">
                Restricts access to Super Admins only; displays maintenance notice on public pages.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={Boolean(flags.maintenanceMode)}
                onCheckedChange={(c) => setFlags({ ...flags, maintenanceMode: c })}
              />
              <span className="text-xs font-medium w-12 text-destructive">{flags.maintenanceMode ? "Active" : "Off"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5 min-h-[40px]">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5 min-h-[40px]">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Feature Flags"}
        </Button>
      </div>
    </div>
  );
};
