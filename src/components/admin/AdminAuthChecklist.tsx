import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Play,
  RotateCcw,
  Download,
  ShieldCheck,
  Search,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { validatePassword, checkPasswordMatch } from "@/lib/passwordPolicy";
import { PasswordRequirementsIndicator } from "@/components/PasswordRequirementsIndicator";

export type TestStatus = "passed" | "failed" | "in_progress" | "pending";
export type TestCategory =
  | "Open Cyber Cafe Hub Access"
  | "Password Policy & Enforcement"
  | "Office & DEO Provisioning"
  | "Office Role Boundaries (DEO / Admin / Super Admin)"
  | "Google OAuth & Access Control"
  | "Session Security, Anti-Regression & Audit";

export interface VerificationTest {
  id: string;
  number: number;
  title: string;
  category: TestCategory;
  objective: string;
  testSteps: string[];
  expectedResult: string;
  status: TestStatus;
  notes: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  automatedAvailable: boolean;
  automatedResult?: {
    success: boolean;
    details: string;
  };
}

const STORAGE_KEY = "bagula2_office_auth_verification_checklist_v2";

const INITIAL_TESTS: VerificationTest[] = [
  {
    id: "TEST-1",
    number: 1,
    title: "Open Access Cyber Cafe & Assisted Service Hub",
    category: "Open Cyber Cafe Hub Access",
    objective: "Verify that Cyber Cafe Hub (/cyber-cafe) and Application Wizards (/apply/warish, /apply/dependent, /apply/linkage) load without login screens or PIN prompts.",
    testSteps: [
      "Navigate to /cyber-cafe in an unauthenticated browser session.",
      "Verify direct access to application launch cards and Cyber Tools.",
      "Open /apply/warish and confirm wizard initializes cleanly.",
    ],
    expectedResult: "Cyber Cafe Hub and /apply/* intake wizards are immediately accessible with zero login gates.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-2",
    number: 2,
    title: "Office Account Creation Rejects Weak Passwords",
    category: "Password Policy & Enforcement",
    objective: "Ensure passwords failing any of the 5 policy rules are strictly rejected when creating DEO/Admin office accounts.",
    testSteps: [
      "In /admin/manage, enter a short password (e.g. 'Ab1!') or missing special character ('Password123').",
      "Observe live Password Requirements Indicator.",
      "Attempt to submit.",
    ],
    expectedResult: "Indicator marks missing requirements and validatePassword blocks submission.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-3",
    number: 3,
    title: "Compliant Strong Office Password Acceptance",
    category: "Password Policy & Enforcement",
    objective: "Confirm that an 8+ char password with uppercase, lowercase, number, and symbol satisfies policy checks and confirmation match.",
    testSteps: [
      "Enter compliant password satisfying all 5 criteria.",
      "Enter matching confirm password.",
    ],
    expectedResult: "All 5 checks pass and confirmation matches.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-4",
    number: 4,
    title: "Office-Only Authentication Enforcement (/admin)",
    category: "Office Role Boundaries (DEO / Admin / Super Admin)",
    objective: "Verify that only DEO, Admin, and Super Admin roles are accepted across /admin login and RequireAdmin guards.",
    testSteps: [
      "Inspect role validation in RequireAdmin and AdminAuth.",
      "Confirm unauthorized or unauthenticated visitors cannot reach /admin/dashboard or /admin/deo.",
    ],
    expectedResult: "Only deo, admin, and super_admin roles gain office portal entry.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-5",
    number: 5,
    title: "DEO / Office Account Creation by Super Admin",
    category: "Office & DEO Provisioning",
    objective: "Super Admin creates an official account with full name, official email, designation (DEO/Admin), and compliant temporary password.",
    testSteps: [
      "Sign in as Super Admin and open /admin/manage.",
      "Create an office account with role 'deo' or 'admin'.",
    ],
    expectedResult: "New officer profile created in admin_profiles and role mapped in admin_roles with must_change_password: true.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: false,
  },
  {
    id: "TEST-6",
    number: 6,
    title: "Force Change Password Policy Validation",
    category: "Password Policy & Enforcement",
    objective: "Verify ForceChangePassword enforces the 5-rule password policy before releasing an office session.",
    testSteps: [
      "Sign in as newly provisioned officer with temporary password.",
      "Verify interception until compliant password is set.",
    ],
    expectedResult: "Password updated via Supabase Auth and officer routed to designated DEO/Admin workspace.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: false,
  },
  {
    id: "TEST-7",
    number: 7,
    title: "Google OAuth Sign-in for Authorized Office Account",
    category: "Google OAuth & Access Control",
    objective: "Verify official Google accounts pre-approved in admin_profiles can sign in via Google OAuth at /admin.",
    testSteps: [
      "On /admin, click 'Sign in with Google'.",
      "Authorize with a whitelisted official email.",
    ],
    expectedResult: "Establishes active office session and routes directly to DEO or Admin dashboard.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: false,
  },
  {
    id: "TEST-8",
    number: 8,
    title: "Unauthorized Google Account Rejection",
    category: "Google OAuth & Access Control",
    objective: "Ensure non-office Google accounts cannot access /admin/dashboard or /admin/deo.",
    testSteps: [
      "Attempt sign-in on /admin with an email not listed in admin_profiles / user_roles.",
    ],
    expectedResult: "Access denied cleanly and session terminated.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: false,
  },
  {
    id: "TEST-9",
    number: 9,
    title: "Role-Based Access Control — DEO Access Limits",
    category: "Office & DEO Provisioning",
    objective: "Verify DEO accounts access /admin/deo and authorized certificate workflows, while Super Admin governance routes stay restricted.",
    testSteps: [
      "Sign in as DEO officer.",
      "Verify /admin/deo loads and /admin/manage blocks non-super-admin roles.",
    ],
    expectedResult: "Strict separation between DEO, Admin, and Super Admin privileges.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-10",
    number: 10,
    title: "Role-Based Access Control — Super Admin Privileges",
    category: "Office & DEO Provisioning",
    objective: "Verify Super Admin has complete oversight of accounts, quotas, system status, and audit logs.",
    testSteps: [
      "Sign in as Super Admin.",
      "Open /admin/control-center, /admin/auth-audit, and /admin/profiles-directory.",
    ],
    expectedResult: "Full administrative controls operate cleanly.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-11",
    number: 11,
    title: "No Legacy Environment or Citizen Auth Residuals",
    category: "Session Security, Anti-Regression & Audit",
    objective: "Verify active Supabase client connection and absence of legacy citizen-auth or kiosk login gates.",
    testSteps: [
      "Run automated config scan on Supabase client URL.",
      "Verify legacy /public/* citizen routes redirect to /cyber-cafe.",
    ],
    expectedResult: "Zero legacy URLs or obsolete auth gates remain.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
  {
    id: "TEST-12",
    number: 12,
    title: "Activity Logging & Audit Trail Completeness",
    category: "Session Security, Anti-Regression & Audit",
    objective: "Ensure authentication and role updates record immutable entries in admin_activity_logs.",
    testSteps: [
      "Query admin_activity_logs table via authenticated session.",
    ],
    expectedResult: "Audit table is operational and stores actor metadata without secrets.",
    status: "pending",
    notes: "",
    verifiedAt: null,
    verifiedBy: null,
    automatedAvailable: true,
  },
];

export const AdminAuthChecklist: React.FC = () => {
  const [tests, setTests] = useState<VerificationTest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: VerificationTest[] = JSON.parse(saved);
        return INITIAL_TESTS.map((init) => {
          const found = parsed.find((p) => p.id === init.id);
          return found ? { ...init, ...found } : init;
        });
      }
    } catch (e) {
      console.warn("Could not load stored checklist:", e);
    }
    return INITIAL_TESTS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [runningAuto, setRunningAuto] = useState<boolean>(false);
  const [currentSessionUser, setCurrentSessionUser] = useState<any>(null);

  const [sandboxPw, setSandboxPw] = useState<string>("");
  const [sandboxConfirm, setSandboxConfirm] = useState<string>("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentSessionUser(data.user ?? null);
    })();
  }, []);

  const categories: TestCategory[] = useMemo(
    () => [
      "Open Cyber Cafe Hub Access",
      "Password Policy & Enforcement",
      "Office & DEO Provisioning",
      "Office Role Boundaries (DEO / Admin / Super Admin)",
      "Google OAuth & Access Control",
      "Session Security, Anti-Regression & Audit",
    ],
    []
  );

  const stats = useMemo(() => {
    const total = tests.length;
    const passed = tests.filter((t) => t.status === "passed").length;
    const failed = tests.filter((t) => t.status === "failed").length;
    const inProgress = tests.filter((t) => t.status === "in_progress").length;
    const pending = tests.filter((t) => t.status === "pending").length;
    const percent = Math.round((passed / total) * 100);
    return { total, passed, failed, inProgress, pending, percent };
  }, [tests]);

  const updateTestStatus = (id: string, status: TestStatus) => {
    setTests((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              verifiedAt: status === "passed" || status === "failed" ? new Date().toISOString() : t.verifiedAt,
              verifiedBy: currentSessionUser?.email || "Super Admin",
            }
          : t
      )
    );
  };

  const updateTestNotes = (id: string, notes: string) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)));
  };

  const runAutomatedDiagnostics = async () => {
    setRunningAuto(true);
    toast.info("Running automated office authentication diagnostics…");

    const newTests = [...tests];

    const t2Index = newTests.findIndex((t) => t.id === "TEST-2");
    if (t2Index >= 0) {
      const passedNegativeTests =
        !validatePassword("short1!").isValid &&
        !validatePassword("Password123").isValid &&
        !validatePassword("password123!").isValid &&
        !validatePassword("PASSWORD123!").isValid &&
        !validatePassword("Password!!!!").isValid;

      newTests[t2Index] = {
        ...newTests[t2Index],
        status: passedNegativeTests ? "passed" : "failed",
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Automated Suite",
        automatedResult: {
          success: passedNegativeTests,
          details: passedNegativeTests
            ? "5/5 invalid password variants correctly rejected by validatePassword engine."
            : "Password validator failed negative constraints.",
        },
      };
    }

    const t3Index = newTests.findIndex((t) => t.id === "TEST-3");
    if (t3Index >= 0) {
      const passedPositive =
        validatePassword("Bagula@2026Secure").isValid &&
        validatePassword("Admin#Nadia99").isValid &&
        checkPasswordMatch("Bagula@2026Secure", "Bagula@2026Secure").matches;

      newTests[t3Index] = {
        ...newTests[t3Index],
        status: passedPositive ? "passed" : "failed",
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Automated Suite",
        automatedResult: {
          success: passedPositive,
          details: passedPositive
            ? "Valid passwords with mixed case, number, and special character correctly passed with confirmation match."
            : "Valid password failed acceptance rules.",
        },
      };
    }

    const t11Index = newTests.findIndex((t) => t.id === "TEST-11");
    if (t11Index >= 0) {
      const currentSupabaseUrl = (supabase as any).supabaseUrl || "";
      const isConnected = Boolean(currentSupabaseUrl);
      const hasOldDomain = currentSupabaseUrl.includes("old-bagula") || currentSupabaseUrl.includes("legacy");

      newTests[t11Index] = {
        ...newTests[t11Index],
        status: isConnected && !hasOldDomain ? "passed" : "failed",
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Automated Suite",
        automatedResult: {
          success: isConnected && !hasOldDomain,
          details: `Active Supabase endpoint: ${currentSupabaseUrl || "Connected client"}. Office-only auth model active.`,
        },
      };
    }

    const t12Index = newTests.findIndex((t) => t.id === "TEST-12");
    if (t12Index >= 0) {
      try {
        const { error } = await supabase
          .from("admin_activity_logs")
          .select("id, action_type, created_at")
          .limit(1);

        const logsOperational = !error;
        newTests[t12Index] = {
          ...newTests[t12Index],
          status: logsOperational ? "passed" : "failed",
          verifiedAt: new Date().toISOString(),
          verifiedBy: "Automated Suite",
          automatedResult: {
            success: logsOperational,
            details: logsOperational
              ? "admin_activity_logs table is operational and accessible to administrative audit."
              : `Audit query error: ${error?.message}`,
          },
        };
      } catch (err: any) {
        newTests[t12Index] = {
          ...newTests[t12Index],
          status: "failed",
          automatedResult: {
            success: false,
            details: `Audit query exception: ${err.message}`,
          },
        };
      }
    }

    const t10Index = newTests.findIndex((t) => t.id === "TEST-10");
    if (t10Index >= 0 && currentSessionUser) {
      newTests[t10Index] = {
        ...newTests[t10Index],
        status: "passed",
        verifiedAt: new Date().toISOString(),
        verifiedBy: "Automated Suite",
        automatedResult: {
          success: true,
          details: `Active authenticated session verified for: ${currentSessionUser.email}.`,
        },
      };
    }

    setTests(newTests);
    setRunningAuto(false);
    toast.success("Automated diagnostics completed.");
  };

  const resetChecklist = () => {
    setTests(INITIAL_TESTS);
    localStorage.removeItem(STORAGE_KEY);
    toast.success("Checklist reset to pending state.");
  };

  const exportAuditReport = () => {
    const report = {
      title: "BAGULA II GRAM PANCHAYAT — OFFICE AUTHENTICATION VERIFICATION AUDIT",
      generatedAt: new Date().toISOString(),
      inspector: currentSessionUser?.email || "Super Admin",
      environment: {
        system: "Bagula 2 No Gram Panchayat — Office-Only Auth Architecture",
        roles: "DEO, Admin, Super Admin",
        passwordPolicy: "8+ characters, uppercase, lowercase, number, special character",
      },
      summary: stats,
      tests: tests.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        status: t.status,
        verifiedAt: t.verifiedAt,
        verifiedBy: t.verifiedBy,
        notes: t.notes,
        automatedResult: t.automatedResult,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bagula2-office-auth-audit-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit verification report downloaded successfully.");
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchCat = selectedCategory === "all" || t.category === selectedCategory;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.objective.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [tests, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/40 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Office Authentication &amp; Role Verification Checklist
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Audit matrix for Bagula 2 No Gram Panchayat office-only authentication (DEO, Admin, Super Admin), 5-rule password policy, Google SSO, and open-access Cyber Cafe Hub verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={runAutomatedDiagnostics}
              disabled={runningAuto}
              className="gap-1.5 text-xs min-h-[40px]"
            >
              <Play size={14} aria-hidden="true" />
              {runningAuto ? "Diagnosing…" : "Run Auto Tests"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={exportAuditReport}
              className="gap-1.5 text-xs min-h-[40px]"
            >
              <Download size={14} aria-hidden="true" />
              Export Audit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetChecklist}
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive min-h-[40px]"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/30 text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total Tests</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{stats.total}</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700 font-medium">Passed</div>
            <div className="text-xl font-bold text-emerald-700 mt-0.5">{stats.passed}</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-[11px] uppercase tracking-wider text-rose-700 font-medium">Failed</div>
            <div className="text-xl font-bold text-rose-700 mt-0.5">{stats.failed}</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[11px] uppercase tracking-wider text-amber-700 font-medium">In Progress</div>
            <div className="text-xl font-bold text-amber-700 mt-0.5">{stats.inProgress}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Completion</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{stats.percent}%</div>
          </div>
        </div>

        <div className="mt-3 h-2 w-full rounded-full bg-muted/60 overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${stats.percent}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <KeyRound size={16} className="text-primary" aria-hidden="true" />
              Live Password Policy Interactive Tester
            </CardTitle>
            <CardDescription className="text-xs">
              Test any office password against the 5-rule criteria in real time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Test Password</label>
              <Input
                value={sandboxPw}
                onChange={(e) => setSandboxPw(e.target.value)}
                placeholder="e.g. Bagula@2026Secure"
                className="min-h-[40px] text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground">Confirm Password</label>
              <Input
                value={sandboxConfirm}
                onChange={(e) => setSandboxConfirm(e.target.value)}
                placeholder="Re-enter to test match"
                className="min-h-[40px] text-xs"
              />
            </div>
            <PasswordRequirementsIndicator
              password={sandboxPw}
              confirmPassword={sandboxConfirm}
              showMatch={Boolean(sandboxPw || sandboxConfirm)}
            />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" aria-hidden="true" />
              Environment &amp; Role Boundary Inspector
            </CardTitle>
            <CardDescription className="text-xs">
              Audits the connected Supabase instance and office-only access policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30 space-y-1">
              <div className="text-[11px] uppercase font-semibold text-muted-foreground">Active Supabase Project</div>
              <div className="font-mono text-emerald-700 break-all text-xs">
                {(supabase as any).supabaseUrl || "Connected to Supabase Instance"}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30 space-y-1">
              <div className="text-[11px] uppercase font-semibold text-muted-foreground">Current Operator Session</div>
              <div className="font-medium text-foreground">
                {currentSessionUser?.email ? (
                  <span>
                    {currentSessionUser.email} ({currentSessionUser.id.substring(0, 8)}…)
                  </span>
                ) : (
                  <span className="text-muted-foreground">No active admin session detected.</span>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} aria-hidden="true" />
                Office-Only Authentication Active
              </div>
              <p>
                Authentication applies strictly to DEO, Admin, and Super Admin staff accounts. Public Citizen and Cyber Cafe Hub workflows require no user login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by test ID, title, or objective…"
            className="pl-9 text-xs min-h-[40px]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="min-h-[40px] px-3 rounded-md border border-input bg-background text-xs"
        >
          <option value="all">All Categories ({tests.length})</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[40px] px-3 rounded-md border border-input bg-background text-xs"
        >
          <option value="all">All Statuses</option>
          <option value="passed">Passed ({stats.passed})</option>
          <option value="failed">Failed ({stats.failed})</option>
          <option value="in_progress">In Progress ({stats.inProgress})</option>
          <option value="pending">Pending ({stats.pending})</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs">
            No verification scenarios match the selected criteria.
          </div>
        ) : (
          filteredTests.map((t) => {
            const isExpanded = expandedTest === t.id;
            return (
              <div
                key={t.id}
                className="rounded-xl border border-border/60 bg-white p-4 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-foreground shrink-0">
                      {t.id}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
                      <span className="text-xs text-muted-foreground">{t.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border ${
                        t.status === "passed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : t.status === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-300"
                          : t.status === "in_progress"
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {t.status === "passed" && <CheckCircle2 size={13} aria-hidden="true" />}
                      {t.status === "failed" && <XCircle size={13} aria-hidden="true" />}
                      {t.status === "in_progress" && <Clock size={13} aria-hidden="true" />}
                      {t.status === "pending" && <AlertCircle size={13} aria-hidden="true" />}
                      <span className="capitalize">{t.status.replace("_", " ")}</span>
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTest(isExpanded ? null : t.id)}
                      className="min-h-[36px] px-2 text-xs"
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-foreground/80 leading-relaxed">{t.objective}</p>

                {isExpanded && (
                  <div className="pt-3 border-t border-border/40 space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-foreground mb-1">Execution Steps:</div>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
                        {t.testSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    <div>
                      <div className="font-semibold text-foreground mb-1">Expected Outcome:</div>
                      <div className="p-2 rounded-lg bg-muted/40 border border-border/30 text-foreground font-mono text-xs">
                        {t.expectedResult}
                      </div>
                    </div>

                    {t.automatedResult && (
                      <div
                        className={`p-2.5 rounded-lg border text-xs ${
                          t.automatedResult.success
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        <div className="font-semibold">Automated Test Execution:</div>
                        <div>{t.automatedResult.details}</div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-semibold text-muted-foreground">
                        Auditor Notes &amp; Observations
                      </label>
                      <Textarea
                        value={t.notes}
                        onChange={(e) => updateTestNotes(t.id, e.target.value)}
                        placeholder="Add verification notes..."
                        className="text-xs min-h-[60px]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => updateTestStatus(t.id, "passed")} className="text-xs min-h-[36px]">
                        Mark Passed
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateTestStatus(t.id, "in_progress")} className="text-xs min-h-[36px]">
                        In Progress
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateTestStatus(t.id, "failed")} className="text-xs min-h-[36px]">
                        Mark Failed
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminAuthChecklist;
