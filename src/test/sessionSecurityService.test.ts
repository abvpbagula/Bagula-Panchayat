import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  resolveUserSessionPolicy,
  loadForcedLogoutSettings,
  saveForcedLogoutSettings,
  DEFAULT_FORCED_LOGOUT_SETTINGS,
  type ForcedLogoutSettings,
  SESSION_STORAGE_CACHE_KEY,
} from "@/lib/sessionSecurityService";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { email: "nitish374482@gmail.com" } }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock("@/lib/activityLog", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("Session Security & Forced Logout Governance Service", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("resolves default policy when no custom overrides exist", () => {
    const policy = resolveUserSessionPolicy({
      userEmail: "standard_user@example.com",
      userRole: "admin",
      settings: DEFAULT_FORCED_LOGOUT_SETTINGS,
    });

    expect(policy.forcedLogoutEnabled).toBe(true);
    expect(policy.isExempt).toBe(false);
    expect(policy.timeoutMinutes).toBe(5); // Admin role default
    expect(policy.timeoutMs).toBe(5 * 60 * 1000);
    expect(policy.warningSeconds).toBe(60);
    expect(policy.warningTitle).toBe("Session Timeout Warning");
  });

  it("globally disables forced logout when master switch is turned off", () => {
    const settings: ForcedLogoutSettings = {
      ...DEFAULT_FORCED_LOGOUT_SETTINGS,
      globalForcedLogoutEnabled: false,
    };

    const policy = resolveUserSessionPolicy({
      userEmail: "any_admin@example.com",
      userRole: "admin",
      settings,
    });

    expect(policy.forcedLogoutEnabled).toBe(false);
    expect(policy.isExempt).toBe(true);
    expect(policy.matchedRuleType).toBe("global_disabled");
  });

  it("exempts Super Admin himself when an individual account rule is configured", () => {
    const superAdminEmail = "nitish374482@gmail.com";
    const settings: ForcedLogoutSettings = {
      ...DEFAULT_FORCED_LOGOUT_SETTINGS,
      accountRules: [
        {
          id: "rule_super_admin",
          label: "Super Admin Self Exemption",
          targetType: "single_email",
          targetValue: superAdminEmail,
          exemptFromForcedLogout: true,
          forcedLogoutEnabled: false,
          timeoutMinutes: 120,
          warningSeconds: 60,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    const policy = resolveUserSessionPolicy({
      userEmail: superAdminEmail,
      userRole: "super_admin",
      settings,
    });

    expect(policy.forcedLogoutEnabled).toBe(false);
    expect(policy.isExempt).toBe(true);
    expect(policy.matchedRuleName).toBe("Super Admin Self Exemption");
    expect(policy.matchedRuleType).toBe("account_override");
  });

  it("applies custom timeout to bulk accounts list", () => {
    const bulkEmails = "deo1@bagula2.in, deo2@bagula2.in, operator3@bagula2.in";
    const settings: ForcedLogoutSettings = {
      ...DEFAULT_FORCED_LOGOUT_SETTINGS,
      accountRules: [
        {
          id: "rule_bulk_deos",
          label: "Data Entry Shift Operators",
          targetType: "bulk_emails",
          targetValue: bulkEmails,
          exemptFromForcedLogout: false,
          forcedLogoutEnabled: true,
          timeoutMinutes: 45,
          warningSeconds: 120,
          customWarningMessage: "Special shift operator countdown notice.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    // Test first email in list
    const policy1 = resolveUserSessionPolicy({
      userEmail: "deo1@bagula2.in",
      userRole: "deo",
      settings,
    });
    expect(policy1.forcedLogoutEnabled).toBe(true);
    expect(policy1.timeoutMinutes).toBe(45);
    expect(policy1.timeoutMs).toBe(45 * 60 * 1000);
    expect(policy1.warningSeconds).toBe(120);
    expect(policy1.warningMessage).toBe("Special shift operator countdown notice.");

    // Test second email in list
    const policy2 = resolveUserSessionPolicy({
      userEmail: "deo2@bagula2.in",
      userRole: "deo",
      settings,
    });
    expect(policy2.timeoutMinutes).toBe(45);

    // Test unmatched email (should get role default)
    const policyOther = resolveUserSessionPolicy({
      userEmail: "other@bagula2.in",
      userRole: "deo",
      settings,
    });
    expect(policyOther.timeoutMinutes).toBe(3); // Standard DEO default
  });

  it("supports custom warning modal title and disclaimer messages", () => {
    const settings: ForcedLogoutSettings = {
      ...DEFAULT_FORCED_LOGOUT_SETTINGS,
      warningModalTitle: "Emergency Session Notice",
      warningModalMessage: "Official activity required within 60 seconds.",
      postLogoutDisclaimer: "Custom administrative expiration disclaimer.",
    };

    const policy = resolveUserSessionPolicy({
      userEmail: "staff@example.com",
      userRole: "admin",
      settings,
    });

    expect(policy.warningTitle).toBe("Emergency Session Notice");
    expect(policy.warningMessage).toBe("Official activity required within 60 seconds.");
    expect(policy.disclaimer).toBe("Custom administrative expiration disclaimer.");
  });

  it("persists settings into local cache and supports synchronous retrieval", async () => {
    const customSettings: ForcedLogoutSettings = {
      ...DEFAULT_FORCED_LOGOUT_SETTINGS,
      defaultTimeoutMinutes: 20,
      globalForcedLogoutEnabled: true,
    };

    await saveForcedLogoutSettings(customSettings, "nitish374482@gmail.com");

    const cached = JSON.parse(localStorage.getItem(SESSION_STORAGE_CACHE_KEY) || "{}");
    expect(cached.defaultTimeoutMinutes).toBe(20);
    expect(cached.lastUpdatedBy).toBe("nitish374482@gmail.com");
  });
});
