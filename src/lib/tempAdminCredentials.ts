/**
 * Temporary Super Admin Credential Handler
 * Manages the time-limited temporary password for bagula2nogp111@gmail.com
 * with an enforced 30-minute expiry window and mandatory password update.
 */

import { getSupabaseAuthStorageKey } from "@/lib/supabaseEnv";
import type { OfficeRole } from "@/lib/permissions";

export const TEMP_ADMIN_EMAIL = "bagula2nogp111@gmail.com";
export const SUPER_ADMIN_CRED_EMAILS = ["bagula2nogp111@gmail.com", "nitish374482@gmail.com"];
export const TEMP_ADMIN_PASSWORD = "Nitish@374482";
export const TEMP_ADMIN_USER_ID = "0b49a1d5-50b3-4cce-ba8d-9a0d5a0fbb16";
export const TEMP_PASSWORD_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const STORAGE_KEY = `bagula2_temp_cred_${TEMP_ADMIN_EMAIL}`;
const PERM_PW_STORAGE_KEY = `bagula2_perm_cred_${TEMP_ADMIN_EMAIL}`;

export interface ConfiguredOfficeCredential {
  email: string;
  role: OfficeRole;
  password: string;
  userId: string;
  displayName: string;
  fullName: string;
  designation: string;
}

export const ACTIVE_OFFICE_CREDENTIALS: Record<string, ConfiguredOfficeCredential> = {
  "nitush6488@gmail.com": {
    email: "nitush6488@gmail.com",
    role: "deo",
    password: TEMP_ADMIN_PASSWORD,
    userId: "0b49a1d5-50b3-4cce-ba8d-9a0d5a0fbb18",
    displayName: "DEO (Bagula 2 No Gram Panchayat)",
    fullName: "GP Data Entry Operator",
    designation: "deo",
  },
  "nitush8343980898@gmail.com": {
    email: "nitush8343980898@gmail.com",
    role: "admin",
    password: TEMP_ADMIN_PASSWORD,
    userId: "0b49a1d5-50b3-4cce-ba8d-9a0d5a0fbb19",
    displayName: "Admin (Bagula 2 No Gram Panchayat)",
    fullName: "GP Reviewing Authority",
    designation: "secretary",
  },
  "bagulaiiofficerecords@gmail.com": {
    email: "bagulaiiofficerecords@gmail.com",
    role: "super_admin",
    password: TEMP_ADMIN_PASSWORD,
    userId: "0b49a1d5-50b3-4cce-ba8d-9a0d5a0fbb20",
    displayName: "Super Admin (Bagula 2 No Gram Panchayat)",
    fullName: "GP Super Admin",
    designation: "pradhan",
  },
};

export function getConfiguredOfficeCredential(email: string | null | undefined): ConfiguredOfficeCredential | null {
  if (!email) return null;
  return ACTIVE_OFFICE_CREDENTIALS[email.trim().toLowerCase()] ?? null;
}

export function isConfiguredOfficeCredentialEmail(email: string | null | undefined): boolean {
  return getConfiguredOfficeCredential(email) !== null;
}

export interface TempCredRecord {
  email: string;
  issuedAt: number;
  durationMs: number;
  consumed: boolean;
  permanentPasswordSet?: boolean;
}

/**
 * Get or initialize the temporary credential state.
 */
export function getTempCredRecord(): TempCredRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.issuedAt === "number") {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // Initialize with current timestamp (30 minutes starts now)
  const initial: TempCredRecord = {
    email: TEMP_ADMIN_EMAIL,
    issuedAt: Date.now(),
    durationMs: TEMP_PASSWORD_DURATION_MS,
    consumed: false,
    permanentPasswordSet: false,
  };
  saveTempCredRecord(initial);
  return initial;
}

export function saveTempCredRecord(record: TempCredRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (e) {
    console.error("Failed to save temporary credential record", e);
  }
}

/**
 * Reset/re-issue the temporary password with a fresh 30-minute window.
 */
export function reIssueTempPassword(): TempCredRecord {
  const record: TempCredRecord = {
    email: TEMP_ADMIN_EMAIL,
    issuedAt: Date.now(),
    durationMs: TEMP_PASSWORD_DURATION_MS,
    consumed: false,
    permanentPasswordSet: false,
  };
  saveTempCredRecord(record);
  return record;
}

/**
 * Check if the temporary password has expired (30-minute limit).
 */
export function isTempPasswordExpired(record: TempCredRecord = getTempCredRecord()): boolean {
  return Date.now() - record.issuedAt > record.durationMs;
}

/**
 * Get remaining minutes on the temporary password.
 */
export function getRemainingTempMinutes(record: TempCredRecord = getTempCredRecord()): number {
  const remainingMs = record.issuedAt + record.durationMs - Date.now();
  return Math.max(0, Math.ceil(remainingMs / (60 * 1000)));
}

/**
 * Validates a sign-in attempt for configured active office credentials
 * (nitush6488@gmail.com -> deo, nitush8343980898@gmail.com -> admin, bagulaiiofficerecords@gmail.com -> super_admin).
 */
export function verifyConfiguredOfficeLogin(
  email: string,
  candidatePassword: string
): {
  matchedAccount: boolean;
  success: boolean;
  role?: OfficeRole;
  credential?: ConfiguredOfficeCredential;
  error?: string;
} {
  const entry = getConfiguredOfficeCredential(email);
  if (!entry) {
    return { matchedAccount: false, success: false };
  }

  try {
    const permanentPw = localStorage.getItem(`bagula2_perm_cred_${entry.email}`);
    if (permanentPw) {
      if (candidatePassword === permanentPw) {
        return { matchedAccount: true, success: true, role: entry.role, credential: entry };
      }
      return { matchedAccount: true, success: false, error: "Incorrect password." };
    }
  } catch {
    // ignore storage errors
  }

  if (candidatePassword === entry.password) {
    return { matchedAccount: true, success: true, role: entry.role, credential: entry };
  }

  return { matchedAccount: true, success: false, error: "Incorrect password." };
}

/**
 * Creates and writes a synthetic authenticated session into Supabase local storage
 * for a configured active office account with its assigned role.
 */
export function establishConfiguredOfficeSession(targetEmail: string): any {
  const entry = getConfiguredOfficeCredential(targetEmail);
  if (!entry) return null;

  const nowIso = new Date().toISOString();
  const nowSec = Math.floor(Date.now() / 1000);
  const ttlSec = 12 * 60 * 60; // 12 hours

  const session = {
    access_token: `temp_admin_token_${Date.now()}`,
    token_type: "bearer",
    expires_in: ttlSec,
    expires_at: nowSec + ttlSec,
    refresh_token: `temp_refresh_${Date.now()}`,
    user: {
      id: entry.userId,
      aud: "authenticated",
      role: "authenticated",
      email: entry.email,
      email_confirmed_at: nowIso,
      confirmed_at: nowIso,
      last_sign_in_at: nowIso,
      app_metadata: {
        provider: "email",
        providers: ["email"],
        role: entry.role,
      },
      user_metadata: {
        office: true,
        display_name: entry.displayName,
        full_name: entry.fullName,
        designation: entry.designation,
        role: entry.role,
        service_scope: ["all"],
        is_super_admin: entry.role === "super_admin",
      },
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: nowIso,
    },
  };

  try {
    localStorage.setItem(getSupabaseAuthStorageKey(), JSON.stringify(session));
    sessionStorage.removeItem("bagula2_temp_must_change_password");
    sessionStorage.removeItem("bagula2_temp_issued_at");
  } catch (err) {
    console.error("Failed to store office session", err);
  }

  return session;
}

/**
 * Validates a sign-in attempt with email and password against the temporary credential
 * or any newly set permanent password for this account.
 */
export function verifyTempAdminLogin(
  email: string,
  candidatePassword: string
): { success: boolean; error?: string; isTemp: boolean; mustChangePassword?: boolean } {
  const normEmail = email.trim().toLowerCase();
  if (!SUPER_ADMIN_CRED_EMAILS.includes(normEmail)) {
    return { success: false, error: "Not target account", isTemp: false };
  }

  // 1. Check if permanent password was already set and candidate matches it
  try {
    const userPermKey = `bagula2_perm_cred_${normEmail}`;
    const permanentPw = localStorage.getItem(userPermKey) || localStorage.getItem(PERM_PW_STORAGE_KEY);
    if (permanentPw && candidatePassword === permanentPw) {
      return { success: true, isTemp: false, mustChangePassword: false };
    }
  } catch {
    // ignore
  }

  // 2. Check candidate against the temporary password Nitish@374482
  if (candidatePassword === TEMP_ADMIN_PASSWORD) {
    const record = getTempCredRecord();

    // Has it already been consumed?
    if (record.consumed) {
      return {
        success: false,
        error: "This temporary password has already been used and changed. Please use your permanent password.",
        isTemp: true,
      };
    }

    // Has it expired (30-minute limit)?
    if (isTempPasswordExpired(record)) {
      return {
        success: false,
        error: "Your temporary credentials have expired (30-minute limit). Please request a password reset from Super Admin.",
        isTemp: true,
      };
    }

    // Valid temporary password within 30 minutes
    return {
      success: true,
      isTemp: true,
      mustChangePassword: true,
    };
  }

  return { success: false, error: "Incorrect password.", isTemp: false };
}

/**
 * Creates and writes a synthetic authenticated session into Supabase local storage
 * so getSession() recognizes the Super Admin as logged in.
 */
export function establishTempAdminSession(targetEmail: string = TEMP_ADMIN_EMAIL): any {
  const record = getTempCredRecord();
  const nowSec = Math.floor(Date.now() / 1000);
  const remainingSec = Math.max(60, Math.floor((record.issuedAt + record.durationMs - Date.now()) / 1000));
  const activeEmail = targetEmail.trim().toLowerCase();

  const session = {
    access_token: `temp_admin_token_${Date.now()}`,
    token_type: "bearer",
    expires_in: remainingSec,
    expires_at: nowSec + remainingSec,
    refresh_token: `temp_refresh_${Date.now()}`,
    user: {
      id: activeEmail === TEMP_ADMIN_EMAIL ? TEMP_ADMIN_USER_ID : "0b49a1d5-50b3-4cce-ba8d-9a0d5a0fbb17",
      aud: "authenticated",
      role: "authenticated",
      email: activeEmail,
      email_confirmed_at: new Date(record.issuedAt).toISOString(),
      confirmed_at: new Date(record.issuedAt).toISOString(),
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {
        provider: "email",
        providers: ["email"],
        role: "super_admin",
      },
      user_metadata: {
        office: true,
        display_name: "Super Admin (Bagula 2 No Gram Panchayat)",
        full_name: "GP Super Admin",
        role: "super_admin",
        is_super_admin: true,
        temp_auth: true,
      },
      created_at: "2026-05-01T00:00:00.000Z",
      updated_at: new Date().toISOString(),
    },
  };

  try {
    // Write into the active Supabase client storage key
    localStorage.setItem(getSupabaseAuthStorageKey(), JSON.stringify(session));
    sessionStorage.setItem("bagula2_temp_must_change_password", "true");
    sessionStorage.setItem("bagula2_temp_issued_at", String(record.issuedAt));
  } catch (err) {
    console.error("Failed to store temp session", err);
  }

  return session;
}

/**
 * Consumes the temporary password when the user successfully sets their permanent password.
 * The temporary password STOPPED working immediately!
 */
export function markTempPasswordConsumed(newPermanentPassword: string, targetEmail?: string | null): void {
  const normTarget = targetEmail?.trim().toLowerCase();
  if (normTarget && isConfiguredOfficeCredentialEmail(normTarget)) {
    try {
      localStorage.setItem(`bagula2_perm_cred_${normTarget}`, newPermanentPassword);
      sessionStorage.removeItem("bagula2_temp_must_change_password");
    } catch {
      // ignore
    }
    return;
  }

  const record = getTempCredRecord();
  record.consumed = true;
  record.permanentPasswordSet = true;
  saveTempCredRecord(record);

  try {
    localStorage.setItem(PERM_PW_STORAGE_KEY, newPermanentPassword);
    if (normTarget) {
      localStorage.setItem(`bagula2_perm_cred_${normTarget}`, newPermanentPassword);
    }
    sessionStorage.removeItem("bagula2_temp_must_change_password");
  } catch {
    // ignore
  }
}
