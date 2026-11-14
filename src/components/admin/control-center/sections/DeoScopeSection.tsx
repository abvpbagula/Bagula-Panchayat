import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  type DeoConfig,
  type CertificateType,
  CERTIFICATE_OPTIONS,
  fetchFullDeoDirectory,
  saveDeoConfig,
} from "@/lib/userQuotasAndLimits";
import { ShieldCheck, Sliders, CheckCircle2, AlertCircle, Edit, RefreshCw } from "lucide-react";

export const DeoScopeSection: React.FC = () => {
  const [deos, setDeos] = useState<DeoConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeo, setSelectedDeo] = useState<DeoConfig | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDeos = async () => {
    setLoading(true);
    try {
      const data = await fetchFullDeoDirectory();
      setDeos(data);
    } catch (err: any) {
      toast.error("Failed to load DEO configurations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeos();
  }, []);

  const handleEditDeo = (deo: DeoConfig) => {
    setSelectedDeo({ ...deo });
    setDialogOpen(true);
  };

  const handleToggleCertificate = (certType: CertificateType) => {
    if (!selectedDeo) return;
    const exists = selectedDeo.allowedCertificates.includes(certType);
    let updated: CertificateType[];
    if (exists) {
      if (selectedDeo.allowedCertificates.length <= 1) {
        toast.error("At least one certificate type must remain assigned to the DEO.");
        return;
      }
      updated = selectedDeo.allowedCertificates.filter((c) => c !== certType);
    } else {
      updated = [...selectedDeo.allowedCertificates, certType];
    }
    setSelectedDeo({ ...selectedDeo, allowedCertificates: updated });
  };

  const handleSaveDeo = async () => {
    if (!selectedDeo) return;
    setSaving(true);
    try {
      const res = await saveDeoConfig(selectedDeo);
      if (res.success) {
        toast.success(`Updated DEO service scope for ${selectedDeo.displayName || selectedDeo.email}`);
        setDialogOpen(false);
        fetchDeos();
      } else {
        toast.error(res.message || "Failed to save DEO configuration");
      }
    } catch (err: any) {
      toast.error("Failed to save DEO: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Governance Scope Notice Card */}
      <Card className="shadow-xs border border-blue-400/30 bg-blue-50/10">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              DEO Least-Privilege Scope & Anti-Spam Quota Enforcement
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Data Entry Operators (DEOs) are assigned strict certificate authorization scopes (Warish, Dependent, Linkage) and daily intake quotas.
              If an intake request falls outside a DEO's authorized scope, the backend authoritatively fails closed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DEO List */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <span>Active DEO Operators & Scopes ({deos.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Manage authorized certificate pipelines, legacy birth record permissions, and draft thresholds.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDeos} className="text-xs h-8 gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="pt-0">
          {loading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              Loading operator configurations...
            </div>
          ) : deos.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No DEO accounts registered.
            </div>
          ) : (
            <div className="space-y-3">
              {deos.map((deo) => (
                <div
                  key={deo.userId}
                  className="p-3.5 rounded-lg border bg-card text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {deo.displayName || deo.email}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({deo.email})
                      </span>
                      <Badge
                        variant={deo.status === "active" ? "default" : "destructive"}
                        className="text-[9px] uppercase font-mono"
                      >
                        {deo.status}
                      </Badge>
                      {deo.allowBirthDigitization && (
                        <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-300">
                          Birth Digitizer
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="text-[11px] text-muted-foreground">Authorized Scopes:</span>
                      {deo.allowedCertificates.map((c) => (
                        <Badge key={c} variant="secondary" className="text-[10px] uppercase font-mono">
                          {c}
                        </Badge>
                      ))}
                    </div>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-4 pt-0.5">
                      <span>Daily Draft Limit: <strong className="text-foreground">{deo.dailyApplicationLimit}</strong></span>
                      <span>Total Draft Limit: <strong className="text-foreground">{deo.totalApplicationLimit === -1 ? "Unlimited" : deo.totalApplicationLimit}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1"
                      onClick={() => handleEditDeo(deo)}
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Scope & Limits
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit DEO Scope Dialog */}
      {selectedDeo && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Configure DEO Scope: {selectedDeo.displayName || selectedDeo.email}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Fine-tune authorized certificate modules and daily submission throttling.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs py-2">
              {/* Certificate Scopes */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Authorized Certificate Pipelines</Label>
                <div className="space-y-2">
                  {CERTIFICATE_OPTIONS.map((opt) => {
                    const isChecked = selectedDeo.allowedCertificates.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className="flex items-center justify-between p-2.5 rounded-md border bg-card"
                      >
                        <div>
                          <div className="font-medium text-foreground">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                        </div>
                        <Switch
                          checked={isChecked}
                          onCheckedChange={() => handleToggleCertificate(opt.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Birth Digitization */}
              <div className="flex items-center justify-between p-2.5 rounded-md border bg-card">
                <div>
                  <div className="font-medium text-foreground">Legacy Birth Record Digitization</div>
                  <div className="text-[10px] text-muted-foreground">Allows indexing pre-online legacy birth registers</div>
                </div>
                <Switch
                  checked={selectedDeo.allowBirthDigitization}
                  onCheckedChange={(c) => setSelectedDeo({ ...selectedDeo, allowBirthDigitization: c })}
                />
              </div>

              {/* Quotas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Daily Limit (Max 500)</Label>
                  <Input
                    type="number"
                    value={selectedDeo.dailyApplicationLimit}
                    onChange={(e) => setSelectedDeo({ ...selectedDeo, dailyApplicationLimit: Number(e.target.value) || 25 })}
                    className="text-xs"
                    min={1}
                    max={500}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Account Status</Label>
                  <Select
                    value={selectedDeo.status}
                    onValueChange={(val: any) => setSelectedDeo({ ...selectedDeo, status: val })}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="quota_paused">Quota Paused</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDeo} disabled={saving} className="text-xs">
                {saving ? "Saving..." : "Save Scope"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
