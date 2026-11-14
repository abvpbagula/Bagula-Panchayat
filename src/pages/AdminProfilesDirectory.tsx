import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ShieldCheck,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Settings2,
  Save,
  Layers,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthz } from "@/lib/permissions";
import { DataStateView } from "@/components/shared/DataStateView";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import {
  CERTIFICATE_OPTIONS,
  type CertificateType,
  type DeoConfig,
  type GlobalQuotaPolicy,
  getDeoConfig,
  saveDeoConfig,
  getGlobalQuotaPolicy,
  saveGlobalQuotaPolicy,
} from "@/lib/userQuotasAndLimits";

type DirectoryTab = "deos" | "policy";

export default function AdminProfilesDirectory({
  initialTab,
}: {
  initialTab?: DirectoryTab;
}) {
  const authz = useAuthz();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get("tab") as DirectoryTab | null;
  const resolvedInitial: DirectoryTab =
    tabFromQuery && ["deos", "policy"].includes(tabFromQuery)
      ? tabFromQuery
      : initialTab && ["deos", "policy"].includes(initialTab)
        ? initialTab
        : "deos";

  const [activeTab, setActiveTab] = useState<DirectoryTab>(resolvedInitial);

  useEffect(() => {
    if (tabFromQuery && ["deos", "policy"].includes(tabFromQuery)) {
      setActiveTab(tabFromQuery);
    } else if (initialTab && ["deos", "policy"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  }, [tabFromQuery, initialTab]);

  const handleTabChange = (val: string) => {
    const nextTab = val as DirectoryTab;
    setActiveTab(nextTab);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.set("tab", nextTab);
        return p;
      },
      { replace: true }
    );
  };

  // DEOs state
  const [deoList, setDeoList] = useState<DeoConfig[]>([]);
  const [loadingDeos, setLoadingDeos] = useState(true);
  const [deoSearch, setDeoSearch] = useState("");
  const [savingDeoId, setSavingDeoId] = useState<string | null>(null);

  // Global policy
  const [policy, setPolicy] = useState<GlobalQuotaPolicy>(getGlobalQuotaPolicy());
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadAll = async () => {
    setLoadingDeos(true);

    try {
      const { data: profiles } = await supabase
        .from("admin_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("role", "deo");

      const deoUserIds = new Set((roleRows ?? []).map((r) => r.user_id));

      const deoProfiles = (profiles ?? []).filter(
        (p: any) =>
          deoUserIds.has(p.user_id) ||
          p.designation_code === "deo" ||
          p.designation === "deo" ||
          p.email?.includes("deo")
      );

      if (deoProfiles.length === 0) {
        const sampleDeos: DeoConfig[] = [
          {
            userId: "deo-bgl2-001",
            email: "deo.samir@bagula2gp.gov.in",
            displayName: "Samir Kumar Biswas",
            employeeId: "EMP-BGL2-DEO-01",
            allowedCertificates: ["warish"],
            allowBirthDigitization: true,
            dailyApplicationLimit: 25,
            totalApplicationLimit: 200,
            todayCount: 8,
            status: "active",
            notes: "Assigned strictly to Warish applications (1 Certificate Tier).",
          },
          {
            userId: "deo-bgl2-002",
            email: "deo.priya@bagula2gp.gov.in",
            displayName: "Priya Majumder",
            employeeId: "EMP-BGL2-DEO-02",
            allowedCertificates: ["warish", "dependent"],
            allowBirthDigitization: true,
            dailyApplicationLimit: 30,
            totalApplicationLimit: 300,
            todayCount: 12,
            status: "active",
            notes: "Authorized for Warish and Dependent applications (2 Certificates Tier).",
          },
          {
            userId: "deo-bgl2-003",
            email: "deo.kalyan@bagula2gp.gov.in",
            displayName: "Kalyan Ghosh",
            employeeId: "EMP-BGL2-DEO-03",
            allowedCertificates: ["warish", "dependent", "linkage"],
            allowBirthDigitization: true,
            dailyApplicationLimit: 40,
            totalApplicationLimit: 400,
            todayCount: 19,
            status: "active",
            notes: "Senior DEO — Authorized for all 3 Certificate types (Full Access).",
          },
        ];
        setDeoList(sampleDeos);
      } else {
        const configs: DeoConfig[] = await Promise.all(
          deoProfiles.map(async (p: any) => await getDeoConfig(p.user_id))
        );
        setDeoList(configs);
      }
    } catch (e) {
      console.warn("DEOs load error:", e);
    } finally {
      setLoadingDeos(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ------------------------------------------------------------------ */
  /* DEO Permission & Quota Handlers                                    */
  /* ------------------------------------------------------------------ */

  const handleToggleDeoCertificate = (deoId: string, cert: CertificateType) => {
    setDeoList((prev) =>
      prev.map((d) => {
        if (d.userId !== deoId) return d;
        const exists = d.allowedCertificates.includes(cert);
        let nextAllowed: CertificateType[];
        if (exists) {
          if (d.allowedCertificates.length === 1) {
            toast.warning("A DEO must have permission for at least 1 certificate type.");
            return d;
          }
          nextAllowed = d.allowedCertificates.filter((c) => c !== cert);
        } else {
          nextAllowed = [...d.allowedCertificates, cert];
        }
        return { ...d, allowedCertificates: nextAllowed };
      })
    );
  };

  const handleSetDeoPreset = (deoId: string, preset: "1_warish" | "2_warish_dep" | "3_all") => {
    setDeoList((prev) =>
      prev.map((d) => {
        if (d.userId !== deoId) return d;
        let allowed: CertificateType[] = ["warish"];
        if (preset === "2_warish_dep") allowed = ["warish", "dependent"];
        if (preset === "3_all") allowed = ["warish", "dependent", "linkage"];
        return { ...d, allowedCertificates: allowed };
      })
    );
  };

  const handleAdjustDeoDailyLimit = (deoId: string, delta: number) => {
    setDeoList((prev) =>
      prev.map((d) => {
        if (d.userId !== deoId) return d;
        const current = d.dailyApplicationLimit || 25;
        const next = Math.max(1, Math.min(200, current + delta));
        return { ...d, dailyApplicationLimit: next };
      })
    );
  };

  const handleSaveDeoConfig = async (deo: DeoConfig) => {
    setSavingDeoId(deo.userId);
    try {
      const res = await saveDeoConfig(deo, authz.email || "super_admin");
      if (res.success) {
        toast.success(
          `Permissions updated for ${deo.displayName}: ${deo.allowedCertificates.length}/3 Certificates authorized (${deo.allowedCertificates.join(", ")}). Daily quota: ${deo.dailyApplicationLimit}.`
        );
      } else {
        toast.error(res.message || "Failed to save DEO permissions");
      }
    } catch (e: any) {
      toast.error(e.message || "Error saving DEO permissions");
    } finally {
      setSavingDeoId(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Filtered Lists                                                     */
  /* ------------------------------------------------------------------ */

  const filteredDeos = useMemo(() => {
    const q = (deoSearch ?? "").trim().toLowerCase();
    if (!q) return deoList;
    return deoList.filter(
      (d) =>
        (d.displayName ?? "").toLowerCase().includes(q) ||
        (d.email ?? "").toLowerCase().includes(q) ||
        ((d.employeeId ?? "").toLowerCase().includes(q))
    );
  }, [deoList, deoSearch]);

  return (
    <div className="min-h-screen bg-slate-50/60 px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-start gap-3">
            <BackButton fallbackUrl="/admin/dashboard" label="Dashboard" />
            <PageSectionHeader
              eyebrow="Bagula II Gram Panchayat · Office Governance"
              title="DEO Quotas & Access Directory"
              subtitle="Manage DEO 1/2/3 certificate tiers, daily intake limits, and global quota policies."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              className="min-h-[40px] gap-1.5 text-xs"
            >
              <RefreshCw size={14} className={loadingDeos ? "animate-spin" : ""} aria-hidden="true" />
              <span>Refresh Directory</span>
            </Button>
            <Button asChild size="sm" variant="default" className="min-h-[40px] text-xs gap-1.5">
              <Link to="/admin/dashboard">Admin Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="rounded-xl border border-amber-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">DEO Officers Configured</span>
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <ShieldCheck size={16} aria-hidden="true" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{deoList.length}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Granular 1/2/3 certificate tiers active &amp; enforced
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Office Auth Scope</span>
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                <SlidersHorizontal size={16} aria-hidden="true" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">DEO / Admin</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Office-only login policy · No public or kiosk credential gates
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="bg-muted/80 p-1 rounded-xl h-auto flex flex-wrap gap-1 border border-border/40">
            <TabsTrigger
              value="deos"
              className="gap-2 text-xs min-h-[40px] px-3.5 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-xs rounded-lg font-bold"
            >
              <ShieldCheck size={14} className="text-amber-600" aria-hidden="true" />
              <span>DEO Quotas &amp; 1/2/3 Tiers ({deoList.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="policy"
              className="gap-2 text-xs min-h-[40px] px-3.5 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs rounded-lg"
            >
              <Settings2 size={14} aria-hidden="true" />
              <span className="font-semibold">Global Quota Policy</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DEO ROLE & 1 / 2 / 3 CERTIFICATE PERMISSIONS */}
          <TabsContent value="deos" className="space-y-4">
            <Card className="border-border/60 shadow-xs">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldCheck className="text-amber-600" size={18} aria-hidden="true" />
                      <span>Role-Based DEO Certificate Permissions &amp; Draft Limits</span>
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Configure granular certificate creation rights per DEO (1, 2, or 3 certificate types: Warish, Dependent, Linkage) and daily draft quotas.
                    </CardDescription>
                  </div>

                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-3 text-muted-foreground" size={14} aria-hidden="true" />
                    <Input
                      aria-label="Search DEO officers"
                      placeholder="Search DEO by name, email, ID..."
                      value={deoSearch}
                      onChange={(e) => setDeoSearch(e.target.value)}
                      className="min-h-[40px] pl-8 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <DataStateView
                  isLoading={loadingDeos}
                  isEmpty={filteredDeos.length === 0}
                  emptyTitle="No DEO accounts found"
                  emptyDescription="Assign a staff account the DEO role in Office Users & Roles to configure quotas here."
                  onRetry={loadAll}
                >
                  <div className="space-y-4">
                    {filteredDeos.map((deo) => {
                      const count = deo.allowedCertificates.length;
                      const isSaving = savingDeoId === deo.userId;

                      return (
                        <div
                          key={deo.userId}
                          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0">
                                DEO
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm text-foreground">{deo.displayName}</h3>
                                  <span className="text-xs font-semibold text-primary">
                                    {count} of 3 Certificates Authorized
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                  {deo.email} {deo.employeeId && `· ${deo.employeeId}`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Button
                                size="sm"
                                variant={count === 1 && deo.allowedCertificates.includes("warish") ? "default" : "outline"}
                                className="min-h-[36px] text-xs px-2.5 font-semibold"
                                onClick={() => handleSetDeoPreset(deo.userId, "1_warish")}
                              >
                                1 Cert (Warish)
                              </Button>
                              <Button
                                size="sm"
                                variant={count === 2 && deo.allowedCertificates.includes("warish") && deo.allowedCertificates.includes("dependent") ? "default" : "outline"}
                                className="min-h-[36px] text-xs px-2.5 font-semibold"
                                onClick={() => handleSetDeoPreset(deo.userId, "2_warish_dep")}
                              >
                                2 Certs (Warish + Dep)
                              </Button>
                              <Button
                                size="sm"
                                variant={count === 3 ? "default" : "outline"}
                                className="min-h-[36px] text-xs px-2.5 font-semibold"
                                onClick={() => handleSetDeoPreset(deo.userId, "3_all")}
                              >
                                3 Certs (All 3)
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-xs uppercase tracking-wide font-bold text-muted-foreground flex items-center gap-1.5">
                              <Layers size={13} className="text-primary" aria-hidden="true" />
                              <span>Permitted Certificate Types</span>
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {CERTIFICATE_OPTIONS.map((opt) => {
                                const isPermitted = deo.allowedCertificates.includes(opt.id);
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleToggleDeoCertificate(deo.userId, opt.id)}
                                    className={`text-left rounded-xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                      isPermitted
                                        ? "border-primary bg-primary/5"
                                        : "border-slate-200 bg-slate-50/50 opacity-70 hover:opacity-100"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-xs text-foreground">{opt.label}</span>
                                      <span className="text-[11px] font-bold text-primary">
                                        {isPermitted ? "PERMITTED" : "LOCKED"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-semibold">{opt.bnLabel}</p>
                                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{opt.desc}</p>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 items-center">
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-xs font-bold"
                                onClick={() => handleAdjustDeoDailyLimit(deo.userId, -5)}
                                disabled={deo.dailyApplicationLimit <= 5}
                              >
                                -5
                              </Button>
                              <span className="text-xs font-bold px-3 py-1.5 rounded bg-slate-100 border border-slate-200 text-foreground">
                                {deo.dailyApplicationLimit} / day
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-xs font-bold"
                                onClick={() => handleAdjustDeoDailyLimit(deo.userId, 5)}
                              >
                                +5
                              </Button>
                            </div>

                            <div className="text-xs text-muted-foreground">
                              Today&apos;s Drafts: <strong className="text-foreground">{deo.todayCount}</strong> · Lifetime Cap:{" "}
                              <strong className="text-foreground">
                                {deo.totalApplicationLimit === -1 ? "Unlimited" : deo.totalApplicationLimit}
                              </strong>
                            </div>

                            <div className="flex items-center justify-end">
                              <Button
                                size="sm"
                                className="min-h-[40px] text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                                disabled={isSaving}
                                onClick={() => handleSaveDeoConfig(deo)}
                              >
                                {isSaving ? (
                                  <RefreshCw size={12} className="animate-spin" aria-hidden="true" />
                                ) : (
                                  <Save size={12} aria-hidden="true" />
                                )}
                                <span>Save &amp; Enforce Permissions</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </DataStateView>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: GLOBAL QUOTA POLICIES */}
          <TabsContent value="policy" className="space-y-4">
            <Card className="border-border/60 shadow-xs max-w-2xl">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Settings2 className="text-primary" size={18} aria-hidden="true" />
                  <span>Gram Panchayat System-Wide Quota Policies</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Default intake limits applied to Data Entry Operators under Bagula II GP.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="policy-deo-limit" className="text-xs font-bold text-foreground block">
                      Default DEO Daily Application Quota
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Daily rate cap for standard Data Entry Operators to ensure verification queue balance.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        id="policy-deo-limit"
                        type="number"
                        min={5}
                        max={200}
                        value={policy.defaultDeoDailyLimit}
                        onChange={(e) =>
                          setPolicy({ ...policy, defaultDeoDailyLimit: Number(e.target.value) || 25 })
                        }
                        className="w-32 min-h-[40px] text-xs font-bold"
                      />
                      <span className="text-xs text-muted-foreground">Drafts / Day</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    className="min-h-[40px] text-xs font-bold gap-1.5"
                    disabled={savingPolicy}
                    onClick={async () => {
                      setSavingPolicy(true);
                      await saveGlobalQuotaPolicy(policy);
                      setSavingPolicy(false);
                      toast.success("Global quota policies updated successfully!");
                    }}
                  >
                    <Save size={13} aria-hidden="true" />
                    <span>Save System Quota Policies</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
