import { describe, it, expect } from "vitest";
import {
  isSupabaseConfigured,
  getSupabaseProjectRef,
  getSupabaseAuthStorageKey,
  PLACEHOLDER_SUPABASE_URL,
} from "./supabaseEnv";
import { supabase } from "@/integrations/supabase/client";

describe("Supabase Env & Unconfigured Fallback", () => {
  it("detects unconfigured placeholder environment cleanly", () => {
    // In local environment without .env keys, isSupabaseConfigured is false
    expect(typeof isSupabaseConfigured).toBe("boolean");
    expect(getSupabaseProjectRef().length).toBeGreaterThan(0);
    expect(getSupabaseAuthStorageKey()).toMatch(/^sb-.*-auth-token$/);
    expect(PLACEHOLDER_SUPABASE_URL).toContain("placeholder-project.supabase.co");
  });

  it("resolves maybeSingle queries immediately without hanging when keys are unconfigured", async () => {
    const start = Date.now();
    const { data, error } = await supabase
      .from("business_rules")
      .select("rule_value")
      .eq("rule_key", "test_unconfigured_key")
      .maybeSingle();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it("resolves list queries immediately with empty array when keys are unconfigured", async () => {
    const { data, error } = await supabase
      .from("whats_new_entries")
      .select("id")
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual([]);
  });
});
