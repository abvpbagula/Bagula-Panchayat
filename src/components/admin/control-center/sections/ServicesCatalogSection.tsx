import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  type ServiceCatalogItem,
  DEFAULT_SERVICES_CATALOG,
  loadServicesCatalogConfig,
  saveServicesCatalogConfig,
} from "@/lib/governanceCenterService";
import { ScrollText, Users, FileSpreadsheet, FileText, Save, RotateCcw, CheckCircle2 } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

export const ServicesCatalogSection: React.FC = () => {
  const authz = useAuthz();
  const [services, setServices] = useState<ServiceCatalogItem[]>(DEFAULT_SERVICES_CATALOG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadServicesCatalogConfig().then((loaded) => setServices(loaded));
  }, []);

  const updateService = (id: string, partial: Partial<ServiceCatalogItem>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...partial } : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await saveServicesCatalogConfig(services, authz.email);
    setSaving(false);
    if (res.success) {
      toast.success("Services catalog, fees, and intake availability rules saved.");
    } else {
      toast.error(res.error || "Failed to save services catalog");
    }
  };

  const handleReset = () => {
    setServices(DEFAULT_SERVICES_CATALOG);
    toast.info("Reset to default services catalog.");
  };

  const getIcon = (id: string) => {
    switch (id) {
      case "warish": return ScrollText;
      case "dependent": return Users;
      case "linkage": return FileSpreadsheet;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {services.map((srv) => {
          const Icon = getIcon(srv.id);
          return (
            <Card key={srv.id} className="shadow-xs border">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">{srv.nameEn}</CardTitle>
                        <Badge
                          variant={
                            srv.status === "active"
                              ? "default"
                              : srv.status === "maintenance"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-[10px] uppercase font-mono"
                        >
                          {srv.status}
                        </Badge>
                      </div>
                      <div className="text-xs font-bengali text-muted-foreground mt-0.5">
                        {srv.nameBn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Service Status</Label>
                      <Select
                        value={srv.status}
                        onValueChange={(val: any) => updateService(srv.id, { status: val })}
                      >
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active (Available)</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="disabled">Disabled (Offline)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <CardDescription className="text-xs mt-2">
                  {srv.descriptionEn}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0 text-xs">
                {/* Intake Toggles & Fees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">Citizen Intake</div>
                      <div className="text-[11px] text-muted-foreground">Online public application</div>
                    </div>
                    <Switch
                      checked={srv.citizenIntakeEnabled}
                      onCheckedChange={(c) => updateService(srv.id, { citizenIntakeEnabled: c })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">DEO Intake</div>
                      <div className="text-[11px] text-muted-foreground">Data Entry Operator entry</div>
                    </div>
                    <Switch
                      checked={srv.deoIntakeEnabled}
                      onCheckedChange={(c) => updateService(srv.id, { deoIntakeEnabled: c })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Standard Fee (₹)</Label>
                    <Input
                      type="number"
                      value={srv.feeRupees}
                      onChange={(e) => updateService(srv.id, { feeRupees: Number(e.target.value) || 0 })}
                      className="h-8 text-xs"
                      min={0}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Validity (Months, 0 = Lifetime)</Label>
                    <Input
                      type="number"
                      value={srv.validityMonths}
                      onChange={(e) => updateService(srv.id, { validityMonths: Number(e.target.value) || 0 })}
                      className="h-8 text-xs"
                      min={0}
                    />
                  </div>
                </div>

                {/* Document Requirements */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Mandatory Document Checklist for Citizens & DEOs</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {srv.requiredDocuments.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-md border bg-card text-[11px]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" size="sm" onClick={handleReset} className="text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save Services Catalog"}
        </Button>
      </div>
    </div>
  );
};
