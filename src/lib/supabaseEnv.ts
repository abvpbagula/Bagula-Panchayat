/**
 * Centralized Supabase environment configuration & offline/unconfigured key detection.
 * Allows the application to operate gracefully in local preview mode when
 * VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are not yet configured in .env.
 */

const RAW_SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const RAW_SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "").trim();

export const PLACEHOLDER_SUPABASE_URL = "https://placeholder-project.supabase.co";
export const PLACEHOLDER_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

export const SUPABASE_URL = RAW_SUPABASE_URL || PLACEHOLDER_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = RAW_SUPABASE_PUBLISHABLE_KEY || PLACEHOLDER_SUPABASE_KEY;

export const isSupabaseConfigured: boolean = Boolean(
  RAW_SUPABASE_URL &&
    RAW_SUPABASE_PUBLISHABLE_KEY &&
    !RAW_SUPABASE_URL.includes("placeholder-project.supabase.co") &&
    !RAW_SUPABASE_PUBLISHABLE_KEY.includes(".placeholder")
);

export function getSupabaseProjectRef(): string {
  const explicitId = (import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "").trim();
  if (explicitId) return explicitId;
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    const sub = hostname.split(".")[0];
    if (sub) return sub;
  } catch {
    // ignore invalid URL
  }
  return "placeholder-project";
}

export function getSupabaseAuthStorageKey(): string {
  return `sb-${getSupabaseProjectRef()}-auth-token`;
}
