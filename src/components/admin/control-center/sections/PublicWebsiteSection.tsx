import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  type PublicWebsiteConfig,
  DEFAULT_PUBLIC_WEBSITE,
  loadPublicWebsiteConfig,
  savePublicWebsiteConfig,
} from "@/lib/governanceCenterService";
import { Globe, AlertTriangle, Save, RotateCcw, LayoutTemplate, Layers } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const PublicWebsiteSection: React.FC = () => {
  const authz = useAuthz();
  const [config, setConfig] = useState<PublicWebsiteConfig>(DEFAULT_PUBLIC_WEBSITE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPublicWebsiteConfig().then((loaded) => setConfig(loaded));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await savePublicWebsiteConfig(config, authz.email);
    setSaving(false);
    if (res.success) {
      toast.success("Public website settings saved and published to citizen portal.");
    } else {
      toast.error(res.error || "Failed to save public website settings");
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_PUBLIC_WEBSITE);
    toast.info("Reset to default public website configuration.");
  };

  return (
    <div className="space-y-6">
      {/* Emergency Notice Configuration */}
      <Card className="shadow-xs border border-amber-300/40 bg-amber-50/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <span>Emergency Announcement Ribbon</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Switch
                checked={config.emergencyBannerActive}
                onCheckedChange={(c) => setConfig({ ...config, emergencyBannerActive: c })}
              />
              <span className="text-xs font-medium">
                {config.emergencyBannerActive ? "Active" : "Disabled"}
              </span>
            </div>
          </div>
          <CardDescription className="text-xs">
            High-priority broadcast banner pinned to the top of all citizen portal pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">Announcement Text (English)</Label>
              <Input
                value={config.emergencyBannerTextEn}
                onChange={(e) => setConfig({ ...config, emergencyBannerTextEn: e.target.value })}
                placeholder="Physical inquiry counters are open..."
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Severity Level</Label>
              <Select
                value={config.emergencySeverity}
                onValueChange={(val: any) => setConfig({ ...config, emergencySeverity: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informational (Blue)</SelectItem>
                  <SelectItem value="warning">Notice / Maintenance (Amber)</SelectItem>
                  <SelectItem value="critical">Urgent / Closure (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Announcement Text (Bengali - বাংলা)</Label>
            <Input
              value={config.emergencyBannerTextBn}
              onChange={(e) => setConfig({ ...config, emergencyBannerTextBn: e.target.value })}
              placeholder="কাজের দিনগুলিতে সকাল ১০:৩০ থেকে..."
              className="text-xs font-bengali"
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero Content */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>Hero Welcome & Primary Call To Action</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Headlines and key action buttons displayed to citizens arriving at the public portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Hero Headline (English)</Label>
              <Input
                value={config.heroTitleEn}
                onChange={(e) => setConfig({ ...config, heroTitleEn: e.target.value })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hero Headline (Bengali)</Label>
              <Input
                value={config.heroTitleBn}
                onChange={(e) => setConfig({ ...config, heroTitleBn: e.target.value })}
                className="text-xs font-bengali"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Hero Subtitle (English)</Label>
              <Textarea
                value={config.heroSubtitleEn}
                onChange={(e) => setConfig({ ...config, heroSubtitleEn: e.target.value })}
                className="text-xs h-16"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hero Subtitle (Bengali)</Label>
              <Textarea
                value={config.heroSubtitleBn}
                onChange={(e) => setConfig({ ...config, heroSubtitleBn: e.target.value })}
                className="text-xs h-16 font-bengali"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3">
            <div className="space-y-3">
              <div className="font-semibold text-foreground">Primary Action Button (Apply)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Label (EN)</Label>
                  <Input
                    value={config.ctaPrimaryLabelEn}
                    onChange={(e) => setConfig({ ...config, ctaPrimaryLabelEn: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Destination Path</Label>
                  <Input
                    value={config.ctaPrimaryPath}
                    onChange={(e) => setConfig({ ...config, ctaPrimaryPath: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-semibold text-foreground">Secondary Action Button (Verify)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">Label (EN)</Label>
                  <Input
                    value={config.ctaSecondaryLabelEn}
                    onChange={(e) => setConfig({ ...config, ctaSecondaryLabelEn: e.target.value })}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Destination Path</Label>
                  <Input
                    value={config.ctaSecondaryPath}
                    onChange={(e) => setConfig({ ...config, ctaSecondaryPath: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portal Section Toggles */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            <span>Public Portal Section Toggles</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Turn homepage functional modules on or off without altering code.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border text-xs">
              <div>
                <div className="font-medium text-foreground">Notice Board Module</div>
                <div className="text-[11px] text-muted-foreground">Recent announcements and pinned orders.</div>
              </div>
              <Switch
                checked={config.showNoticeBoard}
                onCheckedChange={(c) => setConfig({ ...config, showNoticeBoard: c })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border text-xs">
              <div>
                <div className="font-medium text-foreground">QR Verification Card</div>
                <div className="text-[11px] text-muted-foreground">Instant certificate and memo lookup widget.</div>
              </div>
              <Switch
                checked={config.showVerificationCard}
                onCheckedChange={(c) => setConfig({ ...config, showVerificationCard: c })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border text-xs">
              <div>
                <div className="font-medium text-foreground">Services Catalog Cards</div>
                <div className="text-[11px] text-muted-foreground">Warish, Dependent, and Linkage overview.</div>
              </div>
              <Switch
                checked={config.showServiceCards}
                onCheckedChange={(c) => setConfig({ ...config, showServiceCards: c })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border text-xs">
              <div>
                <div className="font-medium text-foreground">10-Step Workflow Guide</div>
                <div className="text-[11px] text-muted-foreground">Standard citizen application lifecycle steps.</div>
              </div>
              <Switch
                checked={config.showWorkflowGuide}
                onCheckedChange={(c) => setConfig({ ...config, showWorkflowGuide: c })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border text-xs sm:col-span-2">
              <div>
                <div className="font-medium text-foreground">Citizen FAQs Accordion</div>
                <div className="text-[11px] text-muted-foreground">Frequently asked questions regarding processing and enquiry.</div>
              </div>
              <Switch
                checked={config.showFaqSection}
                onCheckedChange={(c) => setConfig({ ...config, showFaqSection: c })}
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
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Public Website Settings"}
        </Button>
      </div>
    </div>
  );
};
