import { supabase } from "@/integrations/supabase/client";
import { saveBusinessRule, loadBusinessRule, type SaveBusinessRuleResult } from "@/lib/businessRulesService";
import { logActivity } from "@/lib/activityLog";
import { isSuperAdminEmail } from "@/lib/permissions";

export type SessionAccessType = "all" | "super_admin" | "admin" | "deo" | "citizen";

export interface AccountSessionRule {
  id: string;
  label: string;
  targetType: "single_email" | "bulk_emails" | "role";
  targetValue: string; // e.g., "nitish374482@gmail.com" or comma-separated emails
  forcedLogoutEnabled: boolean;
  exemptFromForcedLogout: boolean;
  timeoutMinutes: number;
  warningSeconds: number;
  customWarningTitle?: string;
  customWarningMessage?: string;
  customDisclaimerMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleSessionPolicy {
  forcedLogoutEnabled: boolean;
  timeoutMinutes: number;
  warningSeconds: number;
  exempt: boolean;
}

export interface ForcedLogoutSettings {
  // Global Master Switch
  globalForcedLogoutEnabled: boolean;

  // Default Global Time Limit
  defaultTimeoutMinutes: number;
  defaultWarningSeconds: number;

  // Access Type Policies
  rolePolicies: {
    super_admin: RoleSessionPolicy;
    admin: RoleSessionPolicy;
    deo: RoleSessionPolicy;
    citizen: RoleSessionPolicy;
  };

  // Warning Dialog & Disclaimer Messages
  warningModalTitle: string;
  warningModalMessage: string;
  warningModalMessageBn: string;
  postLogoutDisclaimer: string;
  postLogoutDisclaimerBn: string;

  // Individual & Bulk Account Specific Rules (e.g. for super admin himself or alternative accounts)
  accountRules: AccountSessionRule[];

  lastUpdatedBy?: string;
  updatedAt?: string;
}

export const SESSION_FORCED_LOGOUT_RULE_KEY = "session_forced_logout_settings";
export const SESSION_STORAGE_CACHE_KEY = "bagula_session_forced_logout_cache";

export const DEFAULT_FORCED_LOGOUT_SETTINGS: ForcedLogoutSettings = {
  globalForcedLogoutEnabled: true,
  defaultTimeoutMinutes: 3,
  defaultWarningSeconds: 60,
  rolePolicies: {
    super_admin: {
      forcedLogoutEnabled: true,
      timeoutMinutes: 15,
      warningSeconds: 60,
      exempt: false,
    },
    admin: {
      forcedLogoutEnabled: true,
      timeoutMinutes: 5,
      warningSeconds: 60,
      exempt: false,
    },
    deo: {
      forcedLogoutEnabled: true,
      timeoutMinutes: 3,
      warningSeconds: 60,
      exempt: false,
    },
    citizen: {
      forcedLogoutEnabled: true,
      timeoutMinutes: 3,
      warningSeconds: 60,
      exempt: false,
    },
  },
  warningModalTitle: "Session Timeout Warning",
  warningModalMessage:
    "You have been inactive for over 2 minutes. For security compliance and protection of official records, your session will automatically terminate in:",
  warningModalMessageBn:
    "নিরাপত্তা রক্ষা ও সরকারী তথ্যের সুরক্ষার্থে নিষ্ক্রিয়তার কারণে আপনার অধিবেশন শীঘ্রই সমাপ্ত হবে:",
  postLogoutDisclaimer:
    "Your administrative session was automatically terminated due to 3 minutes of inactivity, in accordance with Gram Panchayat e-governance security compliance guidelines. Please log in again to continue.",
  postLogoutDisclaimerBn:
    "গ্রাম পঞ্চায়েত ই-গভর্ন্যান্স নিরাপত্তা নির্দেশিকা অনুযায়ী নিষ্ক্রিয়তার কারণে আপনার প্রশাসনিক সেশনটি বন্ধ করা হয়েছে। অনুগ্রহ করে আবার লগ ইন করুন।",
  accountRules: [],
};

/**
 * Reads cached session settings from localStorage synchronously.
 */
export function getCachedForcedLogoutSettings(): ForcedLogoutSettings {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_FORCED_LOGOUT_SETTINGS,
        ...parsed,
        rolePolicies: {
          ...DEFAULT_FORCED_LOGOUT_SETTINGS.rolePolicies,
          ...(parsed.rolePolicies || {}),
        },
        accountRules: Array.isArray(parsed.accountRules) ? parsed.accountRules : [],
      };
    }
  } catch {
    // Ignore sandbox or storage errors
  }
  return DEFAULT_FORCED_LOGOUT_SETTINGS;
}

/**
 * Loads authoritative forced logout settings from Supabase business_rules.
 */
export async function loadForcedLogoutSettings(): Promise<ForcedLogoutSettings> {
  const cached = getCachedForcedLogoutSettings();
  try {
    const loaded = await loadBusinessRule<ForcedLogoutSettings>(
      SESSION_FORCED_LOGOUT_RULE_KEY,
      cached
    );

    const merged: ForcedLogoutSettings = {
      ...DEFAULT_FORCED_LOGOUT_SETTINGS,
      ...loaded,
      rolePolicies: {
        ...DEFAULT_FORCED_LOGOUT_SETTINGS.rolePolicies,
        ...(loaded.rolePolicies || {}),
      },
      accountRules: Array.isArray(loaded.accountRules) ? loaded.accountRules : [],
    };

    try {
      localStorage.setItem(SESSION_STORAGE_CACHE_KEY, JSON.stringify(merged));
    } catch {
      // Storage unavailable
    }

    return merged;
  } catch (err) {
    console.warn("Falling back to cached forced logout settings:", err);
    return cached;
  }
}

/**
 * Saves updated forced logout settings to Supabase business_rules via backend RPC and updates local cache.
 */
export async function saveForcedLogoutSettings(
  settings: ForcedLogoutSettings,
  actorEmail?: string | null
): Promise<SaveBusinessRuleResult> {
  const payload: ForcedLogoutSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: actorEmail || "super_admin",
  };

  // Method 1: Dedicated Backend RPC (save_security_governance_settings)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc("save_security_governance_settings" as never, {
      _settings: payload as unknown as Record<string, unknown>,
      _actor_email: actorEmail || null,
    } as never);

    if (!rpcErr && rpcData) {
      const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
      if (parsed?.success) {
        try {
          localStorage.setItem(SESSION_STORAGE_CACHE_KEY, JSON.stringify(payload));
          window.dispatchEvent(
            new CustomEvent("bagula_session_settings_updated", { detail: payload })
          );
        } catch {
          // Ignore storage quota
        }
        return {
          success: true,
          id: parsed.id,
          updated_at: parsed.updated_at || new Date().toISOString(),
        };
      }
    }
  } catch (rpcEx) {
    console.warn("save_security_governance_settings direct RPC fallback to saveBusinessRule:", rpcEx);
  }

  // Method 2: Standard SECURITY DEFINER save_business_rule RPC fallback
  const result = await saveBusinessRule(
    SESSION_FORCED_LOGOUT_RULE_KEY,
    payload as unknown as Record<string, unknown>,
    "Authoritative session forced logout and timeout rules",
    actorEmail
  );

  if (result.success) {
    try {
      localStorage.setItem(SESSION_STORAGE_CACHE_KEY, JSON.stringify(payload));
      // Dispatch notification event for live re-evaluation across active hooks
      window.dispatchEvent(
        new CustomEvent("bagula_session_settings_updated", { detail: payload })
      );
    } catch {
      // Ignore
    }

    // Log administrative audit
    await logActivity({
      action_type: "auth.session_rules_updated",
      metadata: {
        actor: actorEmail,
        global_enabled: payload.globalForcedLogoutEnabled,
        rules_count: payload.accountRules.length,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => null);
  }

  return result;
}

export interface ResolvedSessionPolicy {
  forcedLogoutEnabled: boolean;
  isExempt: boolean;
  timeoutMinutes: number;
  timeoutMs: number;
  warningSeconds: number;
  warningMs: number;
  warningTitle: string;
  warningMessage: string;
  warningMessageBn: string;
  disclaimer: string;
  disclaimerBn: string;
  matchedRuleName?: string;
  matchedRuleType: "global_disabled" | "account_override" | "role_policy" | "default";
}

/**
 * Resolves the precise forced logout policy for a specific user session,
 * matching individual rules first (e.g. super admin himself, bulk lists),
 * then role policy, then global defaults.
 */
export function resolveUserSessionPolicy(params: {
  userEmail?: string | null;
  userRole?: string | null;
  settings?: ForcedLogoutSettings;
}): ResolvedSessionPolicy {
  const settings = params.settings || getCachedForcedLogoutSettings();
  const normalizedEmail = (params.userEmail || "").trim().toLowerCase();
  const normalizedRole = isSuperAdminEmail(normalizedEmail)
    ? "super_admin"
    : (params.userRole || "").trim().toLowerCase();

  // 1. Global Master Switch disabled
  if (!settings.globalForcedLogoutEnabled) {
    return {
      forcedLogoutEnabled: false,
      isExempt: true,
      timeoutMinutes: settings.defaultTimeoutMinutes || 3,
      timeoutMs: (settings.defaultTimeoutMinutes || 3) * 60 * 1000,
      warningSeconds: settings.defaultWarningSeconds || 60,
      warningMs: (settings.defaultWarningSeconds || 60) * 1000,
      warningTitle: settings.warningModalTitle,
      warningMessage: settings.warningModalMessage,
      warningMessageBn: settings.warningModalMessageBn,
      disclaimer: settings.postLogoutDisclaimer,
      disclaimerBn: settings.postLogoutDisclaimerBn,
      matchedRuleName: "Globally Disabled by Super Admin",
      matchedRuleType: "global_disabled",
    };
  }

  // 2. Individual or Bulk Account Specific Rule Check
  if (Array.isArray(settings.accountRules) && settings.accountRules.length > 0) {
    for (const rule of settings.accountRules) {
      let isMatch = false;

      if (rule.targetType === "single_email") {
        isMatch = normalizedEmail === (rule.targetValue || "").trim().toLowerCase();
      } else if (rule.targetType === "bulk_emails") {
        const emailList = (rule.targetValue || "")
          .split(/[\s,;]+/)
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        isMatch = emailList.includes(normalizedEmail);
      } else if (rule.targetType === "role") {
        isMatch = normalizedRole === (rule.targetValue || "").trim().toLowerCase();
      }

      if (isMatch) {
        const isExempt = rule.exemptFromForcedLogout || !rule.forcedLogoutEnabled;
        const timeoutMinutes = Math.max(1, rule.timeoutMinutes || settings.defaultTimeoutMinutes || 3);
        const warningSeconds = Math.max(10, rule.warningSeconds || settings.defaultWarningSeconds || 60);

        return {
          forcedLogoutEnabled: !isExempt,
          isExempt,
          timeoutMinutes,
          timeoutMs: timeoutMinutes * 60 * 1000,
          warningSeconds,
          warningMs: warningSeconds * 1000,
          warningTitle: rule.customWarningTitle || settings.warningModalTitle,
          warningMessage: rule.customWarningMessage || settings.warningModalMessage,
          warningMessageBn: settings.warningModalMessageBn,
          disclaimer: rule.customDisclaimerMessage || settings.postLogoutDisclaimer,
          disclaimerBn: settings.postLogoutDisclaimerBn,
          matchedRuleName: rule.label,
          matchedRuleType: "account_override",
        };
      }
    }
  }

  // 3. Role-Based Access Policy Check
  const roleKey = normalizedRole as keyof typeof settings.rolePolicies;
  if (roleKey && settings.rolePolicies[roleKey]) {
    const rolePolicy = settings.rolePolicies[roleKey];
    const isExempt = rolePolicy.exempt || !rolePolicy.forcedLogoutEnabled;
    const timeoutMinutes = Math.max(1, rolePolicy.timeoutMinutes || settings.defaultTimeoutMinutes || 3);
    const warningSeconds = Math.max(10, rolePolicy.warningSeconds || settings.defaultWarningSeconds || 60);

    return {
      forcedLogoutEnabled: !isExempt,
      isExempt,
      timeoutMinutes,
      timeoutMs: timeoutMinutes * 60 * 1000,
      warningSeconds,
      warningMs: warningSeconds * 1000,
      warningTitle: settings.warningModalTitle,
      warningMessage: settings.warningModalMessage,
      warningMessageBn: settings.warningModalMessageBn,
      disclaimer: settings.postLogoutDisclaimer,
      disclaimerBn: settings.postLogoutDisclaimerBn,
      matchedRuleName: `Role Policy: ${normalizedRole}`,
      matchedRuleType: "role_policy",
    };
  }

  // 4. Default Fallback Policy
  const defaultMinutes = Math.max(1, settings.defaultTimeoutMinutes || 3);
  const defaultWarnSec = Math.max(10, settings.defaultWarningSeconds || 60);

  return {
    forcedLogoutEnabled: true,
    isExempt: false,
    timeoutMinutes: defaultMinutes,
    timeoutMs: defaultMinutes * 60 * 1000,
    warningSeconds: defaultWarnSec,
    warningMs: defaultWarnSec * 1000,
    warningTitle: settings.warningModalTitle,
    warningMessage: settings.warningModalMessage,
    warningMessageBn: settings.warningModalMessageBn,
    disclaimer: settings.postLogoutDisclaimer,
    disclaimerBn: settings.postLogoutDisclaimerBn,
    matchedRuleType: "default",
  };
}
