import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  type AppearanceBrandingConfig,
  DEFAULT_APPEARANCE_BRANDING,
  loadAppearanceBranding,
  saveAppearanceBranding,
} from "@/lib/governanceCenterService";
import {
  type PartyTheme,
  applyPartyTheme,
} from "@/lib/appSettings";
import { Palette, CheckCircle2, RotateCcw, Save, Sparkles, Building2, Type } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const AppearanceBrandingSection: React.FC = () => {
  const authz = useAuthz();
  const [config, setConfig] = useState<AppearanceBrandingConfig>(DEFAULT_APPEARANCE_BRANDING);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppearanceBranding().then((loaded) => {
      setConfig(loaded);
      setLoading(false);
    });
  }, []);

  const handleThemeChange = (theme: PartyTheme) => {
    setConfig((prev) => {
      const next = { ...prev, partyTheme: theme };
      applyPartyTheme(theme);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveAppearanceBranding(config, authz.email);
    setSaving(false);
    if (res.success) {
      toast.success("Appearance and branding updated and broadcast to all portal views.");
    } else {
      toast.error(res.error || "Failed to save appearance settings");
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_APPEARANCE_BRANDING);
    applyPartyTheme(DEFAULT_APPEARANCE_BRANDING.partyTheme);
    toast.info("Reset to official default branding.");
  };

  const partyThemes: { id: PartyTheme; name: string; desc: string; badge: string; border: string; bg: string }[] = [
    {
      id: "default",
      name: "Government Official (Tricolor / Navy)",
      desc: "Neutral constitutional national tricolor top ribbon with deep navy header.",
      badge: "Official Default",
      border: "border-slate-400",
      bg: "bg-slate-900",
    },
    {
      id: "bjp",
      name: "BJP Profile (Saffron & Gold)",
      desc: "Deep saffron warm tone with golden accents and high contrast text.",
      badge: "Saffron Profile",
      border: "border-orange-500",
      bg: "bg-orange-600",
    },
    {
      id: "tmc",
      name: "TMC Profile (Emerald & Green)",
      desc: "Rich green grass tones with clean white typography and crisp badges.",
      badge: "Green Profile",
      border: "border-emerald-600",
      bg: "bg-emerald-700",
    },
    {
      id: "cpim",
      name: "CPIM Profile (Crimson & Red)",
      desc: "Bold red accent theme with high-visibility white markings.",
      badge: "Red Profile",
      border: "border-red-600",
      bg: "bg-red-700",
    },
    {
      id: "congress",
      name: "Congress Profile (Tricolor & Blue)",
      desc: "Cyan/Royal blue government palette with balanced neutral background.",
      badge: "Blue Profile",
      border: "border-blue-600",
      bg: "bg-blue-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Live Preview Header Card */}
      <Card className="shadow-xs border overflow-hidden">
        <div className="gov-tricolor-top" />
        <div className="gov-gradient-header text-primary-foreground p-5">
          <div className="text-center space-y-1">
            <p className="text-[10px] sm:text-xs opacity-80 tracking-widest uppercase font-semibold">
              Live Portal Branding Preview
            </p>
            <h2 className="text-xl sm:text-2xl font-bold font-heading tracking-wide uppercase">
              {config.gpNameEn || "BAGULA II GRAM PANCHAYAT"}
            </h2>
            <p className="text-sm font-bengali opacity-95">
              {config.gpNameBn || "বগুলা ২ নং গ্রাম পঞ্চায়েত"}
            </p>
            <p className="text-xs opacity-75 max-w-xl mx-auto">
              ({config.hierarchyEn || "Under Hanskhali Panchayat Samity, Nadia"})
            </p>
          </div>
        </div>
        <div className="bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground flex items-center justify-between border-t">
          <span>Active Theme: <strong className="text-foreground uppercase">{config.partyTheme}</strong></span>
          <span>Density: <strong className="text-foreground uppercase">{config.layoutDensity}</strong></span>
        </div>
      </Card>

      {/* Panchayat Names & Jurisdictional Branding */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Gram Panchayat Nomenclature & Titles</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Bilingual naming rendered on the top header, certificate headings, and official communications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Gram Panchayat Name (English)</Label>
              <Input
                value={config.gpNameEn}
                onChange={(e) => setConfig({ ...config, gpNameEn: e.target.value })}
                placeholder="Bagula 2 No. Gram Panchayat"
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Standard title used on official English certificates and header.</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Gram Panchayat Name (Bengali - বাংলা)</Label>
              <Input
                value={config.gpNameBn}
                onChange={(e) => setConfig({ ...config, gpNameBn: e.target.value })}
                placeholder="বগুলা ২ নং গ্রাম পঞ্চায়েত"
                className="text-xs font-bengali"
              />
              <p className="text-[10px] text-muted-foreground">Official Bengali text for regional notifications and forms.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Hierarchical Subtitle (English)</Label>
              <Input
                value={config.hierarchyEn}
                onChange={(e) => setConfig({ ...config, hierarchyEn: e.target.value })}
                placeholder="Under Hanskhali Panchayat Samity, Nadia District"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Hierarchical Subtitle (Bengali)</Label>
              <Input
                value={config.hierarchyBn}
                onChange={(e) => setConfig({ ...config, hierarchyBn: e.target.value })}
                placeholder="হাঁসখালি পঞ্চায়েত সমিতি, নদীয়া জেলা"
                className="text-xs font-bengali"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Footer Mandatory Branding Text</Label>
            <Input
              value={config.footerBrandingText}
              onChange={(e) => setConfig({ ...config, footerBrandingText: e.target.value })}
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Party Themes / Color Schemes */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span>Political & Visual Theme Profile</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Instantly applies the elected Gram Panchayat visual theme across all citizen and administrative screens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={config.partyTheme}
            onValueChange={(val) => handleThemeChange(val as PartyTheme)}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {partyThemes.map((t) => {
              const isSelected = config.partyTheme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`cursor-pointer rounded-lg border-2 p-3.5 transition-all relative ${
                    isSelected ? `${t.border} bg-accent/40 shadow-xs` : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full ${t.bg} shrink-0`} />
                      <div className="font-semibold text-xs text-foreground">{t.name}</div>
                    </div>
                    <RadioGroupItem value={t.id} id={`theme-${t.id}`} className="mt-0.5" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                    {t.desc}
                  </p>
                  <Badge variant="outline" className="mt-2.5 text-[9px] font-mono">
                    {t.badge}
                  </Badge>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Density & Typography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-xs border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <span>Layout Density</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Controls padding and compact spacing in forms and tables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <RadioGroup
              value={config.layoutDensity}
              onValueChange={(val: any) => setConfig({ ...config, layoutDensity: val })}
              className="space-y-2"
            >
              <div className="flex items-center justify-between p-2.5 rounded-md border text-xs">
                <div>
                  <div className="font-medium text-foreground">Standard (Balanced)</div>
                  <div className="text-[11px] text-muted-foreground">Optimal balance of whitespace and readability.</div>
                </div>
                <RadioGroupItem value="standard" id="density-std" />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md border text-xs">
                <div>
                  <div className="font-medium text-foreground">Compact (Dense)</div>
                  <div className="text-[11px] text-muted-foreground">Tight padding, suited for high-speed DEO data entry.</div>
                </div>
                <RadioGroupItem value="compact" id="density-compact" />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md border text-xs">
                <div>
                  <div className="font-medium text-foreground">Spacious (Accessible)</div>
                  <div className="text-[11px] text-muted-foreground">Generous margins for touchscreens and elderly citizens.</div>
                </div>
                <RadioGroupItem value="spacious" id="density-spacious" />
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card className="shadow-xs border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Official Emblem / Seal</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Authority emblem featured in portal mastheads and certificate headers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <RadioGroup
              value={config.emblemType}
              onValueChange={(val: any) => setConfig({ ...config, emblemType: val })}
              className="space-y-2"
            >
              <div className="flex items-center justify-between p-2.5 rounded-md border text-xs">
                <div>
                  <div className="font-medium text-foreground">State Emblem of India (Ashoka Lion Capital)</div>
                  <div className="text-[11px] text-muted-foreground">Satyameva Jayate official government crest.</div>
                </div>
                <RadioGroupItem value="ashoka" id="emblem-ashoka" />
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-md border text-xs">
                <div>
                  <div className="font-medium text-foreground">Biswa Bangla Emblem (Govt. of West Bengal)</div>
                  <div className="text-[11px] text-muted-foreground">Department of Panchayats & Rural Development mark.</div>
                </div>
                <RadioGroupItem value="biswa_bangla" id="emblem-wb" />
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Appearance Settings"}
        </Button>
      </div>
    </div>
  );
};
