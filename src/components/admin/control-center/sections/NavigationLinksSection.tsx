import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  type NavigationLinkItem,
  DEFAULT_NAVIGATION_LINKS,
  loadNavigationLinksConfig,
  saveNavigationLinksConfig,
} from "@/lib/governanceCenterService";
import { validateRedirectDestination } from "@/lib/redirectSafety";
import { Compass, Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, Save, RotateCcw } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const NavigationLinksSection: React.FC = () => {
  const authz = useAuthz();
  const [links, setLinks] = useState<NavigationLinkItem[]>(DEFAULT_NAVIGATION_LINKS);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLink, setNewLink] = useState<Partial<NavigationLinkItem>>({
    labelEn: "",
    labelBn: "",
    path: "/",
    section: "header_main",
    isExternal: false,
    enabled: true,
  });

  useEffect(() => {
    loadNavigationLinksConfig().then((loaded) => setLinks(loaded));
  }, []);

  const handleToggle = (id: string, enabled: boolean) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, enabled } : l)));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= links.length) return;
    const copy = [...links];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    // Reassign order
    copy.forEach((l, i) => { l.order = i + 1; });
    setLinks(copy);
  };

  const handleDelete = (id: string) => {
    if (links.length <= 1) {
      toast.error("At least one navigation link must remain active.");
      return;
    }
    setLinks((prev) => prev.filter((l) => l.id !== id));
    toast.info("Navigation link removed.");
  };

  const handleAddLink = () => {
    if (!newLink.labelEn?.trim() || !newLink.path?.trim()) {
      toast.error("Link label and destination path are required.");
      return;
    }

    const val = validateRedirectDestination(newLink.path);
    if (!val.isSafe) {
      toast.error(val.errorMessage || "Unsafe URL format rejected.");
      return;
    }

    const item: NavigationLinkItem = {
      id: `nav-${Date.now()}`,
      labelEn: (newLink.labelEn ?? "").trim(),
      labelBn: ((newLink.labelBn || newLink.labelEn) ?? "").trim(),
      path: (newLink.path ?? "").trim(),
      section: (newLink.section as any) || "header_main",
      isExternal: Boolean((newLink.path || "").startsWith("http")),
      enabled: true,
      order: links.length + 1,
    };

    setLinks((prev) => [...prev, item]);
    setDialogOpen(false);
    setNewLink({ labelEn: "", labelBn: "", path: "/", section: "header_main", isExternal: false, enabled: true });
    toast.success("New navigation link added.");
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveNavigationLinksConfig(links, authz.email);
    setSaving(false);
    if (res.success) {
      toast.success("Navigation links catalog saved and updated across headers & footers.");
    } else {
      toast.error(res.error || "Failed to save navigation links");
    }
  };

  const handleReset = () => {
    setLinks(DEFAULT_NAVIGATION_LINKS);
    toast.info("Reset to default navigation links.");
  };

  const filtered = filterSection === "all" ? links : links.filter((l) => l.section === filterSection);

  const sectionLabels: Record<string, string> = {
    header_main: "Header Top Menu",
    header_services: "Header Services Dropdown",
    footer_quick: "Footer Quick Links",
    footer_govt: "Footer External Govt Portals",
    footer_legal: "Footer Legal & Info",
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Compass className="h-4 w-4 text-primary" />
                <span>Navigation & Links Registry</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage header and footer navigation items with strict URL safety validation.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="text-xs h-8 w-44">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections ({links.length})</SelectItem>
                  <SelectItem value="header_main">Header Main Menu</SelectItem>
                  <SelectItem value="header_services">Header Services</SelectItem>
                  <SelectItem value="footer_govt">Footer Govt Portals</SelectItem>
                  <SelectItem value="footer_quick">Footer Quick Links</SelectItem>
                </SelectContent>
              </Select>

              <Button size="sm" onClick={() => setDialogOpen(true)} className="text-xs h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> Add Link
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border bg-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.labelEn}</span>
                    <span className="font-bengali text-muted-foreground text-[11px]">({item.labelBn})</span>
                    <Badge variant="outline" className="text-[9px] font-mono">
                      {sectionLabels[item.section] || item.section}
                    </Badge>
                    {item.isExternal && (
                      <Badge variant="secondary" className="text-[9px] gap-1">
                        <ExternalLink className="h-2.5 w-2.5" /> External
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">
                    {item.path}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-1 mr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMove(idx, "up")}
                      disabled={idx === 0}
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleMove(idx, "down")}
                      disabled={idx === filtered.length - 1}
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5 mr-2">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(c) => handleToggle(item.id, c)}
                    />
                    <span className="text-[11px] w-12">{item.enabled ? "Active" : "Hidden"}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(item.id)}
                    title="Delete link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Add Navigation Link</DialogTitle>
            <DialogDescription className="text-xs">
              Configure a safe internal route or authorized external government portal link.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs py-2">
            <div className="space-y-1">
              <Label className="text-xs">Label (English)</Label>
              <Input
                value={newLink.labelEn}
                onChange={(e) => setNewLink({ ...newLink, labelEn: e.target.value })}
                placeholder="e.g. Cyber Cafe Forms"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Label (Bengali - বাংলা)</Label>
              <Input
                value={newLink.labelBn}
                onChange={(e) => setNewLink({ ...newLink, labelBn: e.target.value })}
                placeholder="e.g. সাইবার ক্যাফে ফর্ম"
                className="text-xs font-bengali"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Destination URL or Internal Path</Label>
              <Input
                value={newLink.path}
                onChange={(e) => setNewLink({ ...newLink, path: e.target.value })}
                placeholder="e.g. /cyber-cafe or https://example.gov.in"
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">Must begin with "/" for internal pages or "https://" for external.</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Target Location</Label>
              <Select
                value={newLink.section}
                onValueChange={(val: any) => setNewLink({ ...newLink, section: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header_main">Header Main Menu</SelectItem>
                  <SelectItem value="header_services">Header Services Dropdown</SelectItem>
                  <SelectItem value="footer_govt">Footer External Government Portals</SelectItem>
                  <SelectItem value="footer_quick">Footer Quick Links</SelectItem>
                  <SelectItem value="footer_legal">Footer Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddLink} className="text-xs">
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Navigation Settings"}
        </Button>
      </div>
    </div>
  );
};
