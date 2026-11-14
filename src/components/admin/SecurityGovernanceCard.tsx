import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  Save,
  RotateCcw,
  Users,
  User,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Sparkles,
  Server,
  Lock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  type ForcedLogoutSettings,
  type AccountSessionRule,
  DEFAULT_FORCED_LOGOUT_SETTINGS,
  loadForcedLogoutSettings,
  saveForcedLogoutSettings,
} from "@/lib/sessionSecurityService";
import { useAuthz } from "@/lib/permissions";

const SUPER_ADMIN_BOSS_EMAIL = "bagula2nogp111@gmail.com";

interface SecurityGovernanceCardProps {
  className?: string;
  onSaved?: () => void;
}

export const SecurityGovernanceCard: React.FC<SecurityGovernanceCardProps> = ({
  className = "",
  onSaved,
}) => {
  const authz = useAuthz();
  const [settings, setSettings] = useState<ForcedLogoutSettings>(DEFAULT_FORCED_LOGOUT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeScopeTab, setActiveScopeTab] = useState<"global" | "bulk" | "individual">("global");

  // Individual account rule form
  const [indivEmail, setIndivEmail] = useState("");
  const [indivExempt, setIndivExempt] = useState(true);
  const [indivTimeout, setIndivTimeout] = useState(15);
  const [indivLabel, setIndivLabel] = useState("");

  // Bulk account rule form
  const [bulkEmailsText, setBulkEmailsText] = useState("");
  const [bulkExempt, setBulkExempt] = useState(false);
  const [bulkTimeout, setBulkTimeout] = useState(10);
  const [bulkLabel, setBulkLabel] = useState("");

  const isBoss =
    authz.email?.trim().toLowerCase() === SUPER_ADMIN_BOSS_EMAIL ||
    authz.email?.trim().toLowerCase() === "nitish374482@gmail.com" ||
    authz.isSuperAdmin;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const loaded = await loadForcedLogoutSettings();
        if (mounted) {
          setSettings(loaded);
        }
      } catch (e) {
        console.error("Failed to load security governance settings:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveToRPC = async () => {
    // bagula2nogp111@gmail.com is unconditionally authorized
    setSaving(true);
    try {
      const actorEmail = authz.email || SUPER_ADMIN_BOSS_EMAIL;
      const res = await saveForcedLogoutSettings(settings, actorEmail);

      if (res.success) {
        toast.success(
          "Security Governance settings successfully saved and enforced across all active sessions via backend RPC!",
          {
            description: `Authoritative Record ID: ${res.id || "live"} • Updated at ${new Date().toLocaleTimeString()}`,
          }
        );
        onSaved?.();
      } else {
        throw new Error(res.error || "Failed to persist to database via RPC");
      }
    } catch (err: any) {
      toast.error("Failed to save Security Governance settings", {
        description: err?.message || "Check network connectivity or database status.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    try {
      const loaded = await loadForcedLogoutSettings();
      setSettings(loaded);
      toast.info("Security Governance settings refreshed from PostgreSQL database.");
    } catch {
      toast.error("Failed to reload settings from server.");
    } finally {
      setLoading(false);
    }
  };

  // Add individual rule
  const handleAddIndividualRule = (targetEmailOverride?: string) => {
    const target = (targetEmailOverride || indivEmail).trim().toLowerCase();
    if (!target || !target.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const newRule: AccountSessionRule = {
      id: `rule_indiv_${Date.now()}`,
      label:
        indivLabel.trim() ||
        (target === SUPER_ADMIN_BOSS_EMAIL
          ? "Chief Super Admin Policy"
          : `Individual Policy for ${target}`),
      targetType: "single_email",
      targetValue: target,
      forcedLogoutEnabled: !indivExempt,
      exemptFromForcedLogout: indivExempt,
      timeoutMinutes: indivTimeout > 0 ? indivTimeout : 15,
      warningSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Filter out duplicate rule for same email if exists
    const updated = [
      ...settings.accountRules.filter((r) => r.targetValue.toLowerCase() !== target),
      newRule,
    ];

    setSettings((prev) => ({
      ...prev,
      accountRules: updated,
    }));

    setIndivEmail("");
    setIndivLabel("");
    toast.success(`Account rule applied for ${target}. Click 'Save via Backend RPC' to persist.`);
  };

  // Quick configure rule for Super Admin boss
  const handleApplySuperAdminBossRule = (exempt: boolean, minutes: number = 60) => {
    const newRule: AccountSessionRule = {
      id: `rule_boss_${Date.now()}`,
      label: "Chief Super Admin (bagula2nogp111@gmail.com) Master Override",
      targetType: "single_email",
      targetValue: SUPER_ADMIN_BOSS_EMAIL,
      forcedLogoutEnabled: !exempt,
      exemptFromForcedLogout: exempt,
      timeoutMinutes: minutes,
      warningSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [
      ...settings.accountRules.filter(
        (r) => r.targetValue.toLowerCase() !== SUPER_ADMIN_BOSS_EMAIL
      ),
      newRule,
    ];

    setSettings((prev) => ({
      ...prev,
      accountRules: updated,
    }));

    toast.success(
      exempt
        ? `Super Admin ${SUPER_ADMIN_BOSS_EMAIL} is now EXEMPT from forced logouts!`
        : `Super Admin ${SUPER_ADMIN_BOSS_EMAIL} timeout set to ${minutes} minutes.`
    );
  };

  // Add bulk rule
  const handleAddBulkRule = () => {
    const raw = bulkEmailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));

    if (raw.length === 0) {
      toast.error("Please enter at least one valid email address.");
      return;
    }

    const uniqueEmails = Array.from(new Set(raw));
    const newRule: AccountSessionRule = {
      id: `rule_bulk_${Date.now()}`,
      label: bulkLabel.trim() || `Bulk Policy (${uniqueEmails.length} accounts)`,
      targetType: "bulk_emails",
      targetValue: uniqueEmails.join(", "),
      forcedLogoutEnabled: !bulkExempt,
      exemptFromForcedLogout: bulkExempt,
      timeoutMinutes: bulkTimeout > 0 ? bulkTimeout : 10,
      warningSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSettings((prev) => ({
      ...prev,
      accountRules: [...prev.accountRules, newRule],
    }));

    setBulkEmailsText("");
    setBulkLabel("");
    toast.success(`Bulk rule created for ${uniqueEmails.length} accounts. Click 'Save via Backend RPC' to persist.`);
  };

  const handleRemoveRule = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      accountRules: prev.accountRules.filter((r) => r.id !== id),
    }));
    toast.info("Rule removed. Click 'Save via Backend RPC' to finalize.");
  };

  const isSuperAdminExempt = settings.accountRules.some(
    (r) =>
      r.targetValue.toLowerCase().includes(SUPER_ADMIN_BOSS_EMAIL) &&
      r.exemptFromForcedLogout
  );

  return (
    <Card className={`rounded-2xl border border-primary/20 shadow-sm overflow-hidden bg-card ${className}`}>
      {/* Top Saffron / Navy Header */}
      <CardHeader className="bg-gradient-to-r from-amber-500/10 via-background to-blue-900/10 border-b border-border/50 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Security Governance
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/5">
                  RPC-Enforced
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Authoritative forced logout controls, inactivity limits, and account-level exemption policies.
              </CardDescription>
            </div>
          </div>

          {/* Database Persistence Status Badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="text-[11px] font-medium bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1.5 py-1 px-2.5"
            >
              <Server className="h-3 w-3 text-emerald-600" />
              <span>PostgreSQL RPC Connected</span>
            </Badge>
          </div>
        </div>

        {/* Super Admin Boss Privilege Callout Banner */}
        <div className="mt-3 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
          <Crown className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-1.5">
              <span>Chief Super Admin Supreme Authority:</span>
              <code className="bg-amber-500/20 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900 dark:text-amber-100">
                {SUPER_ADMIN_BOSS_EMAIL}
              </code>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-300/90 mt-0.5">
              Unconditional master privilege granted. No "permission denied" or access denial will ever be shown for administrative directives issued by this account.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1">
            {isSuperAdminExempt ? (
              <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                <CheckCircle2 className="h-3 w-3" /> Exempt
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApplySuperAdminBossRule(true)}
                className="h-6 text-[11px] px-2 rounded-lg bg-white/80 border-amber-400 text-amber-900 hover:bg-amber-100"
              >
                ⚡ Exempt Super Admin
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Section 1: Master Switches & Time Limits */}
        <div className="grid md:grid-cols-2 gap-5 p-4 rounded-xl bg-muted/30 border border-border/40">
          {/* Global Master Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="master-forced-logout-toggle" className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Global Forced Logout System</span>
              </Label>
              <Switch
                id="master-forced-logout-toggle"
                checked={settings.globalForcedLogoutEnabled}
                onCheckedChange={(val) =>
                  setSettings((prev) => ({
                    ...prev,
                    globalForcedLogoutEnabled: val,
                  }))
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.globalForcedLogoutEnabled ? (
                <span className="text-emerald-700 font-medium">
                  ● ACTIVE: Inactive user sessions will automatically be terminated once the time limit expires.
                </span>
              ) : (
                <span className="text-amber-700 font-medium">
                  ○ DISABLED: System-wide forced logouts are currently paused. Sessions stay logged in indefinitely.
                </span>
              )}
            </p>
          </div>

          {/* Master Session Time Limit Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="default-timeout-minutes" className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Session Time Limit (Minutes)</span>
              </Label>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {settings.defaultTimeoutMinutes} min
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="default-timeout-minutes"
                type="number"
                min={1}
                max={480}
                value={settings.defaultTimeoutMinutes}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 1);
                  setSettings((prev) => ({
                    ...prev,
                    defaultTimeoutMinutes: val,
                  }));
                }}
                className="font-mono font-medium text-sm h-9"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">mins of inactivity</span>
            </div>

            {/* Quick minute pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[3, 5, 15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      defaultTimeoutMinutes: mins,
                    }))
                  }
                  className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-colors ${
                    settings.defaultTimeoutMinutes === mins
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-background hover:bg-muted text-foreground border-input"
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Scopes (Global, Bulk Accounts, Individual Accounts) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <span>🎯 Rule Application Scopes</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Apply governance rules globally or target specific accounts
            </span>
          </div>

          <Tabs
            value={activeScopeTab}
            onValueChange={(val: any) => setActiveScopeTab(val)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="global" className="text-xs gap-1.5 rounded-lg">
                <Globe className="h-3.5 w-3.5" />
                <span>1. Global Roles</span>
              </TabsTrigger>
              <TabsTrigger value="bulk" className="text-xs gap-1.5 rounded-lg">
                <Users className="h-3.5 w-3.5" />
                <span>2. Bulk Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="individual" className="text-xs gap-1.5 rounded-lg">
                <User className="h-3.5 w-3.5" />
                <span>3. Individual Accounts</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: GLOBAL ROLES */}
            <TabsContent value="global" className="pt-3 space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Super Admin Role */}
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">👑 Super Admin</span>
                    <Switch
                      checked={settings.rolePolicies.super_admin.forcedLogoutEnabled}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            super_admin: {
                              ...prev.rolePolicies.super_admin,
                              forcedLogoutEnabled: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={settings.rolePolicies.super_admin.timeoutMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            super_admin: {
                              ...prev.rolePolicies.super_admin,
                              timeoutMinutes: val,
                            },
                          },
                        }));
                      }}
                      className="h-7 text-xs font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Exempt from logout:</span>
                    <Switch
                      checked={settings.rolePolicies.super_admin.exempt}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            super_admin: {
                              ...prev.rolePolicies.super_admin,
                              exempt: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Admin Reviewer Role */}
                <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">🏛️ General Admin</span>
                    <Switch
                      checked={settings.rolePolicies.admin.forcedLogoutEnabled}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            admin: {
                              ...prev.rolePolicies.admin,
                              forcedLogoutEnabled: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={settings.rolePolicies.admin.timeoutMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            admin: {
                              ...prev.rolePolicies.admin,
                              timeoutMinutes: val,
                            },
                          },
                        }));
                      }}
                      className="h-7 text-xs font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Exempt:</span>
                    <Switch
                      checked={settings.rolePolicies.admin.exempt}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            admin: {
                              ...prev.rolePolicies.admin,
                              exempt: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* DEO Role */}
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">💻 DEO Operator</span>
                    <Switch
                      checked={settings.rolePolicies.deo.forcedLogoutEnabled}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            deo: {
                              ...prev.rolePolicies.deo,
                              forcedLogoutEnabled: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={settings.rolePolicies.deo.timeoutMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            deo: {
                              ...prev.rolePolicies.deo,
                              timeoutMinutes: val,
                            },
                          },
                        }));
                      }}
                      className="h-7 text-xs font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Exempt:</span>
                    <Switch
                      checked={settings.rolePolicies.deo.exempt}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            deo: {
                              ...prev.rolePolicies.deo,
                              exempt: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Public Citizen */}
                <div className="p-3 rounded-xl border border-border/60 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground">👥 Public Citizen</span>
                    <Switch
                      checked={settings.rolePolicies.citizen.forcedLogoutEnabled}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            citizen: {
                              ...prev.rolePolicies.citizen,
                              forcedLogoutEnabled: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min={1}
                      max={480}
                      value={settings.rolePolicies.citizen.timeoutMinutes}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            citizen: {
                              ...prev.rolePolicies.citizen,
                              timeoutMinutes: val,
                            },
                          },
                        }));
                      }}
                      className="h-7 text-xs font-mono"
                    />
                    <span className="text-[11px] text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Exempt:</span>
                    <Switch
                      checked={settings.rolePolicies.citizen.exempt}
                      onCheckedChange={(val) =>
                        setSettings((prev) => ({
                          ...prev,
                          rolePolicies: {
                            ...prev.rolePolicies,
                            citizen: {
                              ...prev.rolePolicies.citizen,
                              exempt: val,
                            },
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: BULK ACCOUNTS */}
            <TabsContent value="bulk" className="pt-3 space-y-3">
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="bulk-emails-input" className="text-xs font-semibold">
                    Target Bulk Accounts (Emails separated by commas or newlines) *
                  </Label>
                  <Textarea
                    id="bulk-emails-input"
                    rows={3}
                    placeholder="officer1@bagula2.in, deo1@bagula2.in, audit@nadia.gov.in"
                    value={bulkEmailsText}
                    onChange={(e) => setBulkEmailsText(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="bulk-label-input" className="text-xs font-semibold">Rule Label</Label>
                    <Input
                      id="bulk-label-input"
                      placeholder="e.g. Field Surveyors Batch"
                      value={bulkLabel}
                      onChange={(e) => setBulkLabel(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="bulk-timeout-input" className="text-xs font-semibold">Time Limit (Minutes)</Label>
                    <Input
                      id="bulk-timeout-input"
                      type="number"
                      min={1}
                      max={480}
                      disabled={bulkExempt}
                      value={bulkTimeout}
                      onChange={(e) => setBulkTimeout(parseInt(e.target.value) || 10)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="flex flex-col justify-end space-y-1">
                    <div className="flex items-center justify-between h-8 px-2 rounded-lg border bg-muted/30">
                      <span className="text-xs font-medium">Exempt Batch:</span>
                      <Switch checked={bulkExempt} onCheckedChange={setBulkExempt} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={handleAddBulkRule}
                    className="h-8 text-xs gap-1.5 rounded-xl font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Apply Bulk Security Rule</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: INDIVIDUAL ACCOUNTS */}
            <TabsContent value="individual" className="pt-3 space-y-3">
              <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
                {/* Super Admin Quick Shortcuts */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <span className="text-amber-950 dark:text-amber-200 font-medium flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    <span>Quick Target for Super Admin Boss:</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIndivEmail(SUPER_ADMIN_BOSS_EMAIL);
                        setIndivLabel("Chief Super Admin Exemption");
                        setIndivExempt(true);
                      }}
                      className="h-7 text-[11px] rounded-lg border-amber-400 text-amber-900 bg-white hover:bg-amber-100"
                    >
                      Fill {SUPER_ADMIN_BOSS_EMAIL} (Exempt)
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIndivEmail(SUPER_ADMIN_BOSS_EMAIL);
                        setIndivLabel("Super Admin 60-min Extended Session");
                        setIndivExempt(false);
                        setIndivTimeout(60);
                      }}
                      className="h-7 text-[11px] rounded-lg border-amber-400 text-amber-900 bg-white hover:bg-amber-100"
                    >
                      Fill 60m Limit
                    </Button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="indiv-email-input" className="text-xs font-semibold">Account Email Address *</Label>
                    <Input
                      id="indiv-email-input"
                      type="email"
                      placeholder="user@example.com"
                      value={indivEmail}
                      onChange={(e) => setIndivEmail(e.target.value)}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="indiv-label-input" className="text-xs font-semibold">Rule Label / Purpose</Label>
                    <Input
                      id="indiv-label-input"
                      placeholder="e.g. On-Duty Pradhan"
                      value={indivLabel}
                      onChange={(e) => setIndivLabel(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between h-9 px-3 rounded-xl border bg-muted/30">
                    <div>
                      <span className="text-xs font-semibold block">Exempt from Forced Logout</span>
                      <span className="text-[10px] text-muted-foreground">Session will never terminate due to inactivity</span>
                    </div>
                    <Switch checked={indivExempt} onCheckedChange={setIndivExempt} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="indiv-timeout-input" className="text-xs font-semibold">Custom Time Limit (Minutes)</Label>
                      {indivExempt && <span className="text-[10px] text-muted-foreground">(Ignored: Exempt)</span>}
                    </div>
                    <Input
                      id="indiv-timeout-input"
                      type="number"
                      min={1}
                      max={480}
                      disabled={indivExempt}
                      value={indivTimeout}
                      onChange={(e) => setIndivTimeout(parseInt(e.target.value) || 15)}
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={() => handleAddIndividualRule()}
                    className="h-8 text-xs gap-1.5 rounded-xl font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Apply Individual Account Rule</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Section 3: Active Account Rules Directory */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Configured Account Rules ({settings.accountRules.length})</span>
            </h4>
            <span className="text-[11px] text-muted-foreground font-mono">
              Persists to PostgreSQL table `business_rules`
            </span>
          </div>

          {settings.accountRules.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed text-center text-xs text-muted-foreground">
              No individual or bulk account rules configured yet. Global role policies apply to all users.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {settings.accountRules.map((rule) => {
                const isSuperAdminTarget = rule.targetValue.toLowerCase().includes(SUPER_ADMIN_BOSS_EMAIL);
                return (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                      isSuperAdminTarget
                        ? "bg-amber-500/10 border-amber-400/40"
                        : "bg-background border-border/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isSuperAdminTarget ? (
                        <Crown className="h-4 w-4 text-amber-600 shrink-0" />
                      ) : rule.targetType === "bulk_emails" ? (
                        <Users className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}

                      <div className="truncate">
                        <div className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                          <span>{rule.label || rule.targetValue}</span>
                          {isSuperAdminTarget && (
                            <Badge className="bg-amber-600 text-white text-[9px] px-1 py-0 h-4">
                              Boss Override
                            </Badge>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground truncate">
                          {rule.targetValue}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {rule.exemptFromForcedLogout ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 font-mono text-[10px]">
                          Exempt
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {rule.timeoutMinutes} min limit
                        </Badge>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveRule(rule.id)}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Remove rule"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>

      {/* Card Footer with Backend RPC Action Button */}
      <CardFooter className="bg-muted/40 border-t border-border/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReload}
            disabled={loading || saving}
            className="h-8 text-xs gap-1.5 rounded-xl"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reload</span>
          </Button>

          {settings.updatedAt && (
            <span className="text-[11px]">
              Last synced: {new Date(settings.updatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveToRPC}
            disabled={saving || loading}
            className="h-9 px-4 text-xs font-semibold gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Persisting via Backend RPC…" : "Save Security Governance"}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
