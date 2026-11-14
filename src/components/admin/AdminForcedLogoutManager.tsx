import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Power,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Eye,
  KeyRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type ForcedLogoutSettings,
  type AccountSessionRule,
  type RoleSessionPolicy,
  DEFAULT_FORCED_LOGOUT_SETTINGS,
  loadForcedLogoutSettings,
  saveForcedLogoutSettings,
} from "@/lib/sessionSecurityService";

export const AdminForcedLogoutManager: React.FC = () => {
  const [settings, setSettings] = useState<ForcedLogoutSettings>(DEFAULT_FORCED_LOGOUT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");

  // Rule Modal state
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AccountSessionRule | null>(null);
  const [ruleForm, setRuleForm] = useState<{
    label: string;
    targetType: "single_email" | "bulk_emails" | "role";
    targetValue: string;
    exemptFromForcedLogout: boolean;
    forcedLogoutEnabled: boolean;
    timeoutMinutes: number;
    warningSeconds: number;
    customWarningTitle: string;
    customWarningMessage: string;
    customDisclaimerMessage: string;
  }>({
    label: "",
    targetType: "single_email",
    targetValue: "",
    exemptFromForcedLogout: false,
    forcedLogoutEnabled: true,
    timeoutMinutes: 15,
    warningSeconds: 60,
    customWarningTitle: "",
    customWarningMessage: "",
    customDisclaimerMessage: "",
  });

  // Preview warning modal test
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.email) {
          setCurrentUserEmail(userData.user.email);
        }
        const data = await loadForcedLogoutSettings();
        setSettings(data);
      } catch (err: any) {
        toast.error("Could not load session settings: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveForcedLogoutSettings(settings, currentUserEmail);
      if (res.success) {
        toast.success("Forced logout and session security rules successfully updated.");
      } else {
        toast.error(res.error || "Failed to persist session rules.");
      }
    } catch (err: any) {
      toast.error("Save error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm("Reset all session timeout and forced logout settings to standard compliance defaults (3-minute timeout)?")) {
      setSettings(DEFAULT_FORCED_LOGOUT_SETTINGS);
      toast.info("Settings reset to defaults. Click 'Save Session Rules' to persist.");
    }
  };

  // Helper to update role policies
  const updateRolePolicy = (role: keyof typeof settings.rolePolicies, updates: Partial<RoleSessionPolicy>) => {
    setSettings((prev) => ({
      ...prev,
      rolePolicies: {
        ...prev.rolePolicies,
        [role]: {
          ...prev.rolePolicies[role],
          ...updates,
        },
      },
    }));
  };

  // Open modal for new rule
  const handleOpenAddRule = (presetEmail?: string) => {
    setEditingRule(null);
    setRuleForm({
      label: presetEmail ? `Super Admin Self-Exemption (${presetEmail})` : "",
      targetType: "single_email",
      targetValue: presetEmail || "",
      exemptFromForcedLogout: Boolean(presetEmail),
      forcedLogoutEnabled: !presetEmail,
      timeoutMinutes: 30,
      warningSeconds: 60,
      customWarningTitle: "",
      customWarningMessage: "",
      customDisclaimerMessage: "",
    });
    setRuleModalOpen(true);
  };

  // Open modal for editing existing rule
  const handleOpenEditRule = (rule: AccountSessionRule) => {
    setEditingRule(rule);
    setRuleForm({
      label: rule.label,
      targetType: rule.targetType,
      targetValue: rule.targetValue,
      exemptFromForcedLogout: rule.exemptFromForcedLogout,
      forcedLogoutEnabled: rule.forcedLogoutEnabled,
      timeoutMinutes: rule.timeoutMinutes,
      warningSeconds: rule.warningSeconds,
      customWarningTitle: rule.customWarningTitle || "",
      customWarningMessage: rule.customWarningMessage || "",
      customDisclaimerMessage: rule.customDisclaimerMessage || "",
    });
    setRuleModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!ruleForm.label.trim()) {
      toast.error("Please provide a descriptive rule label.");
      return;
    }
    if (!ruleForm.targetValue.trim()) {
      toast.error("Please provide the target email(s) or role.");
      return;
    }

    const newRule: AccountSessionRule = {
      id: editingRule ? editingRule.id : `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: ruleForm.label.trim(),
      targetType: ruleForm.targetType,
      targetValue: ruleForm.targetValue.trim(),
      exemptFromForcedLogout: ruleForm.exemptFromForcedLogout,
      forcedLogoutEnabled: ruleForm.exemptFromForcedLogout ? false : ruleForm.forcedLogoutEnabled,
      timeoutMinutes: Math.max(1, Number(ruleForm.timeoutMinutes) || 15),
      warningSeconds: Math.max(10, Number(ruleForm.warningSeconds) || 60),
      customWarningTitle: ruleForm.customWarningTitle.trim() || undefined,
      customWarningMessage: ruleForm.customWarningMessage.trim() || undefined,
      customDisclaimerMessage: ruleForm.customDisclaimerMessage.trim() || undefined,
      createdAt: editingRule ? editingRule.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSettings((prev) => {
      const existing = prev.accountRules || [];
      const updated = editingRule
        ? existing.map((r) => (r.id === editingRule.id ? newRule : r))
        : [...existing, newRule];
      return { ...prev, accountRules: updated };
    });

    setRuleModalOpen(false);
    toast.success(editingRule ? "Account rule updated." : "Account rule added. Don't forget to save changes!");
  };

  const handleDeleteRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      accountRules: (prev.accountRules || []).filter((r) => r.id !== id),
    }));
    toast.info("Account rule removed.");
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground space-y-2">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading authoritative session security and forced logout policies…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview & Global Master Switch Card */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Session Forced Logout & Inactivity Governance
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Configure automatic session termination, inactivity thresholds, custom warning dialogs, and individual account exemptions.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant={settings.globalForcedLogoutEnabled ? "default" : "secondary"}
                className={`text-xs px-2.5 py-1 ${
                  settings.globalForcedLogoutEnabled
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {settings.globalForcedLogoutEnabled ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Enforced Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Power className="h-3.5 w-3.5" /> Globally Disabled
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-0">
          {/* Master Toggle Banner */}
          <div
            className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              settings.globalForcedLogoutEnabled
                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30"
                : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500/30"
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Power
                  className={`h-4 w-4 ${
                    settings.globalForcedLogoutEnabled ? "text-emerald-600" : "text-amber-600"
                  }`}
                />
                <span>Master Forced Logout Enforcement</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.globalForcedLogoutEnabled
                  ? "When enabled, user sessions without keyboard/mouse activity will automatically terminate after the configured threshold."
                  : "FORCED LOGOUT DISABLED: Active sessions will remain logged in indefinitely until manual sign out. (Not recommended for public office computers)."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold">
                {settings.globalForcedLogoutEnabled ? "Enforced" : "Bypassed / Disabled"}
              </span>
              <Switch
                id="global-logout-switch"
                checked={settings.globalForcedLogoutEnabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, globalForcedLogoutEnabled: checked }))
                }
              />
            </div>
          </div>

          {/* Global Default Inactivity Time Limit & Warning Window */}
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2 border rounded-xl p-3.5 bg-card/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="default-timeout" className="text-xs font-semibold">
                  Default Inactivity Time Limit (Minutes)
                </Label>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {settings.defaultTimeoutMinutes} min ({settings.defaultTimeoutMinutes * 60}s)
                </Badge>
              </div>
              <Input
                id="default-timeout"
                type="number"
                min={1}
                max={480}
                value={settings.defaultTimeoutMinutes}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultTimeoutMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
                className="text-xs h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Official standard: <strong>3 minutes</strong> for high security, or 15–30 minutes for normal work.
              </p>
            </div>

            <div className="space-y-2 border rounded-xl p-3.5 bg-card/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="default-warning" className="text-xs font-semibold">
                  Warning Countdown Window (Seconds)
                </Label>
                <Badge variant="outline" className="font-mono text-[11px]">
                  {settings.defaultWarningSeconds} sec
                </Badge>
              </div>
              <Input
                id="default-warning"
                type="number"
                min={10}
                max={300}
                value={settings.defaultWarningSeconds}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    defaultWarningSeconds: Math.max(10, parseInt(e.target.value, 10) || 10),
                  }))
                }
                className="text-xs h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                Seconds before forced logout when the countdown dialogue appears (standard: <strong>60 seconds</strong>).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Access Policies ("all kinds of access") */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Role-Based Access Rules & Limits
          </CardTitle>
          <CardDescription className="text-xs">
            Set individual inactivity timers and forced logout toggles for each portal access tier.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="grid md:grid-cols-2 gap-3">
            {/* Super Admin Tier */}
            <div className="border rounded-xl p-3.5 bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-xs">
                    SA
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Super Admin Access</h3>
                    <p className="text-[10px] text-muted-foreground">System supervisors and supreme controllers</p>
                  </div>
                </div>
                <Switch
                  checked={settings.rolePolicies.super_admin.forcedLogoutEnabled}
                  onCheckedChange={(val) => updateRolePolicy("super_admin", { forcedLogoutEnabled: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <Label className="text-[11px]">Timeout (Mins)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.rolePolicies.super_admin.timeoutMinutes}
                    onChange={(e) =>
                      updateRolePolicy("super_admin", {
                        timeoutMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Warning (Secs)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.rolePolicies.super_admin.warningSeconds}
                    onChange={(e) =>
                      updateRolePolicy("super_admin", {
                        warningSeconds: Math.max(10, parseInt(e.target.value, 10) || 10),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="text-[11px] text-muted-foreground">Completely Exempt Super Admins</span>
                <Switch
                  checked={settings.rolePolicies.super_admin.exempt}
                  onCheckedChange={(val) => updateRolePolicy("super_admin", { exempt: val })}
                />
              </div>
            </div>

            {/* Admin Staff Tier */}
            <div className="border rounded-xl p-3.5 bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                    AD
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Admin & Panchayat Officials</h3>
                    <p className="text-[10px] text-muted-foreground">Pradhan, Nirman Sahayak, and Executive</p>
                  </div>
                </div>
                <Switch
                  checked={settings.rolePolicies.admin.forcedLogoutEnabled}
                  onCheckedChange={(val) => updateRolePolicy("admin", { forcedLogoutEnabled: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <Label className="text-[11px]">Timeout (Mins)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.rolePolicies.admin.timeoutMinutes}
                    onChange={(e) =>
                      updateRolePolicy("admin", {
                        timeoutMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Warning (Secs)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.rolePolicies.admin.warningSeconds}
                    onChange={(e) =>
                      updateRolePolicy("admin", {
                        warningSeconds: Math.max(10, parseInt(e.target.value, 10) || 10),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="text-[11px] text-muted-foreground">Completely Exempt Admins</span>
                <Switch
                  checked={settings.rolePolicies.admin.exempt}
                  onCheckedChange={(val) => updateRolePolicy("admin", { exempt: val })}
                />
              </div>
            </div>

            {/* DEO Staff Tier */}
            <div className="border rounded-xl p-3.5 bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs">
                    DEO
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Data Entry Operators (DEO)</h3>
                    <p className="text-[10px] text-muted-foreground">Counter staff and digitization operators</p>
                  </div>
                </div>
                <Switch
                  checked={settings.rolePolicies.deo.forcedLogoutEnabled}
                  onCheckedChange={(val) => updateRolePolicy("deo", { forcedLogoutEnabled: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <Label className="text-[11px]">Timeout (Mins)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.rolePolicies.deo.timeoutMinutes}
                    onChange={(e) =>
                      updateRolePolicy("deo", {
                        timeoutMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Warning (Secs)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.rolePolicies.deo.warningSeconds}
                    onChange={(e) =>
                      updateRolePolicy("deo", {
                        warningSeconds: Math.max(10, parseInt(e.target.value, 10) || 10),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="text-[11px] text-muted-foreground">Completely Exempt DEOs</span>
                <Switch
                  checked={settings.rolePolicies.deo.exempt}
                  onCheckedChange={(val) => updateRolePolicy("deo", { exempt: val })}
                />
              </div>
            </div>

            {/* Citizen Public Tier */}
            <div className="border rounded-xl p-3.5 bg-card/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    CT
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Public Citizens</h3>
                    <p className="text-[10px] text-muted-foreground">Citizen portal users and certificate applicants</p>
                  </div>
                </div>
                <Switch
                  checked={settings.rolePolicies.citizen.forcedLogoutEnabled}
                  onCheckedChange={(val) => updateRolePolicy("citizen", { forcedLogoutEnabled: val })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <Label className="text-[11px]">Timeout (Mins)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={settings.rolePolicies.citizen.timeoutMinutes}
                    onChange={(e) =>
                      updateRolePolicy("citizen", {
                        timeoutMinutes: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Warning (Secs)</Label>
                  <Input
                    type="number"
                    min={10}
                    value={settings.rolePolicies.citizen.warningSeconds}
                    onChange={(e) =>
                      updateRolePolicy("citizen", {
                        warningSeconds: Math.max(10, parseInt(e.target.value, 10) || 10),
                      })
                    }
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span className="text-[11px] text-muted-foreground">Completely Exempt Citizens</span>
                <Switch
                  checked={settings.rolePolicies.citizen.exempt}
                  onCheckedChange={(val) => updateRolePolicy("citizen", { exempt: val })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual & Bulk Account Exceptions ("individual rules for alternative or bulk account including himself") */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                Individual & Bulk Account Rules (Including Himself)
              </CardTitle>
              <CardDescription className="text-xs">
                Override timeouts or grant permanent exemptions for specific email accounts (e.g. Super Admin personal laptop, kiosks, or bulk operator lists).
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {currentUserEmail && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenAddRule(currentUserEmail)}
                  className="text-xs rounded-xl border-primary/40 text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                  Exempt Myself ({currentUserEmail})
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => handleOpenAddRule()}
                className="text-xs rounded-xl"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Account Rule
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {(settings.accountRules || []).length === 0 ? (
            <div className="border border-dashed rounded-xl p-6 text-center text-xs text-muted-foreground space-y-2">
              <Users className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="font-medium text-foreground">No individual or bulk account rules configured.</p>
              <p className="text-[11px]">
                Accounts without custom rules will automatically inherit the standard role policies defined above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground">
                    <th className="py-2.5 px-3 font-semibold">Rule Label</th>
                    <th className="py-2.5 px-3 font-semibold">Target Type</th>
                    <th className="py-2.5 px-3 font-semibold">Target Account(s)</th>
                    <th className="py-2.5 px-3 font-semibold">Enforcement Mode</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Timeout</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {settings.accountRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        {rule.label}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {rule.targetType.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                        {rule.targetValue}
                      </td>
                      <td className="py-2.5 px-3">
                        {rule.exemptFromForcedLogout ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Never Log Out (Exempt)
                          </Badge>
                        ) : rule.forcedLogoutEnabled ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-500/40 text-[10px]">
                            Custom Timeout
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Disabled
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                        {rule.exemptFromForcedLogout ? "∞" : `${rule.timeoutMinutes}m (${rule.warningSeconds}s warn)`}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEditRule(rule)}
                            title="Edit Rule"
                          >
                            <Edit3 size={13} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteRule(rule.id)}
                            title="Delete Rule"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Message & Dialog Customization ("The warning appear message") */}
      <Card className="border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-primary" />
                Warning Appear Message & Disclaimer Customization
              </CardTitle>
              <CardDescription className="text-xs">
                Customize the modal text and Bengali translation displayed to users before forced termination.
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className="text-xs rounded-xl"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Warning Modal
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="warning-title" className="text-xs font-semibold">
                Warning Modal Title
              </Label>
              <Input
                id="warning-title"
                value={settings.warningModalTitle}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, warningModalTitle: e.target.value }))
                }
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="warning-msg-bn" className="text-xs font-semibold">
                Warning Notification (বাংলা)
              </Label>
              <Input
                id="warning-msg-bn"
                value={settings.warningModalMessageBn}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, warningModalMessageBn: e.target.value }))
                }
                className="text-xs h-9 font-bengali"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="warning-msg" className="text-xs font-semibold">
              Warning Dialog Body Message (English)
            </Label>
            <Textarea
              id="warning-msg"
              rows={2}
              value={settings.warningModalMessage}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, warningModalMessage: e.target.value }))
              }
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="post-logout" className="text-xs font-semibold">
              Post-Logout Login Screen Disclaimer (English)
            </Label>
            <Textarea
              id="post-logout"
              rows={2}
              value={settings.postLogoutDisclaimer}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, postLogoutDisclaimer: e.target.value }))
              }
              className="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Global Actions Bottom Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>
            Last updated:{" "}
            <strong className="text-foreground font-mono">
              {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : "System Standard"}
            </strong>{" "}
            by {settings.lastUpdatedBy || "super_admin"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetDefaults}
            disabled={saving}
            className="text-xs rounded-xl"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Defaults
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="text-xs rounded-xl font-bold bg-primary text-primary-foreground"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {saving ? "Saving Policy…" : "Save Session Rules"}
          </Button>
        </div>
      </div>

      {/* Account Rule Creation/Editing Modal */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              {editingRule ? "Edit Account Rule" : "Add Individual / Bulk Account Rule"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define custom timeouts or exemptions for specific administrators, DEOs, or kiosks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Rule Label / Purpose *</Label>
              <Input
                placeholder="e.g. Super Admin Nitish (Personal Laptop) or Kiosk-1"
                value={ruleForm.label}
                onChange={(e) => setRuleForm({ ...ruleForm, label: e.target.value })}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Type</Label>
                <Select
                  value={ruleForm.targetType}
                  onValueChange={(val: any) => setRuleForm({ ...ruleForm, targetType: val })}
                >
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_email">Single Email</SelectItem>
                    <SelectItem value="bulk_emails">Bulk Emails (List)</SelectItem>
                    <SelectItem value="role">Specific Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Target Value *</Label>
                <Input
                  placeholder={
                    ruleForm.targetType === "bulk_emails"
                      ? "email1@x.com, email2@x.com"
                      : ruleForm.targetType === "role"
                      ? "deo / admin / super_admin"
                      : "user@example.com"
                  }
                  value={ruleForm.targetValue}
                  onChange={(e) => setRuleForm({ ...ruleForm, targetValue: e.target.value })}
                  className="text-xs h-9 font-mono"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl border bg-card/60 flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">Completely Exempt from Forced Logout</Label>
                <p className="text-[11px] text-muted-foreground">
                  Account will NEVER be automatically signed out due to inactivity.
                </p>
              </div>
              <Switch
                checked={ruleForm.exemptFromForcedLogout}
                onCheckedChange={(val) => setRuleForm({ ...ruleForm, exemptFromForcedLogout: val })}
              />
            </div>

            {!ruleForm.exemptFromForcedLogout && (
              <div className="space-y-3 p-3 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Forced Logout Enabled</Label>
                  <Switch
                    checked={ruleForm.forcedLogoutEnabled}
                    onCheckedChange={(val) => setRuleForm({ ...ruleForm, forcedLogoutEnabled: val })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Timeout (Minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={ruleForm.timeoutMinutes}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, timeoutMinutes: parseInt(e.target.value, 10) || 15 })
                      }
                      className="text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Warning (Seconds)</Label>
                    <Input
                      type="number"
                      min={10}
                      max={300}
                      value={ruleForm.warningSeconds}
                      onChange={(e) =>
                        setRuleForm({ ...ruleForm, warningSeconds: parseInt(e.target.value, 10) || 60 })
                      }
                      className="text-xs h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="text-[11px]">Custom Warning Message (Optional)</Label>
                  <Input
                    placeholder="Leave blank to use default warning message"
                    value={ruleForm.customWarningMessage}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, customWarningMessage: e.target.value })
                    }
                    className="text-xs h-8"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs rounded-xl"
              onClick={() => setRuleModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs rounded-xl font-semibold"
              onClick={handleSaveRule}
            >
              {editingRule ? "Update Rule" : "Add Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Modal Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md border-destructive/20 bg-background/95 backdrop-blur-md shadow-2xl rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  {settings.warningModalTitle}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Security Compliance · Bagula 2 No Gram Panchayat
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-sm text-foreground">
              <p>{settings.warningModalMessage}</p>
              {settings.warningModalMessageBn && (
                <p className="text-xs text-primary font-bengali bg-primary/5 p-2 rounded-lg">
                  {settings.warningModalMessageBn}
                </p>
              )}

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-2xl font-mono">
                  <Clock className="w-5 h-5 animate-pulse" />
                  <span>0:59</span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                  seconds remaining until forced sign out
                </p>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(false)}
              className="w-full sm:w-auto text-xs"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
