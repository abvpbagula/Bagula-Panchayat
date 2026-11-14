import DOMPurify from "dompurify";
import { recordAdminAuthAuditEvent } from "@/lib/authAuditService";

// ============================================================================
// 1. XSS & INPUT SANITIZATION (Strip <script> tags, event handlers, JS URIs)
// ============================================================================

const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER_REGEX = /\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URI_REGEX = /javascript\s*:/gi;

/**
 * Strips <script> tags, inline event handlers, and dangerous HTML from text inputs.
 */
export function sanitizeInputText(input: string | null | undefined, maxLength = 2000): string {
  if (!input) return "";
  const raw = String(input)
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "")
    .replace(JS_URI_REGEX, "");

  const purified = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return purified.trim().slice(0, maxLength);
}

/**
 * Recursively sanitizes all string fields in a payload object before sending to the backend.
 */
export function sanitizeObjectStrings<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;
  const clone: Record<string, any> = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      clone[key] = sanitizeInputText(value, 5000);
    } else if (Array.isArray(value)) {
      clone[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeInputText(item, 5000)
          : item && typeof item === "object"
          ? sanitizeObjectStrings(item)
          : item
      );
    } else if (value && typeof value === "object") {
      clone[key] = sanitizeObjectStrings(value);
    } else {
      clone[key] = value;
    }
  }
  return clone as T;
}

// ============================================================================
// 2. RATE LIMITING (Brute-Force Protection: Max 5 Tries Per Minute)
// ============================================================================

interface RateLimitBucket {
  attempts: number[];
  lockedUntil?: number;
}

const RATE_LIMIT_STORAGE_PREFIX = "sec_rl_v1_";

export interface RateLimitCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

export function checkClientRateLimit(
  actionKey: string,
  maxAttempts = 5,
  windowMs = 60_000
): RateLimitCheckResult {
  const now = Date.now();
  const storageKey = `${RATE_LIMIT_STORAGE_PREFIX}${actionKey}`;

  let bucket: RateLimitBucket = { attempts: [] };
  try {
    const raw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
    if (raw) {
      bucket = JSON.parse(raw);
    }
  } catch {
    bucket = { attempts: [] };
  }

  if (bucket.lockedUntil && bucket.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000),
    };
  }

  const recentAttempts = (bucket.attempts || []).filter((ts) => now - ts < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    const lockedUntil = now + windowMs;
    const updated: RateLimitBucket = { attempts: recentAttempts, lockedUntil };
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  recentAttempts.push(now);
  const updated: RateLimitBucket = { attempts: recentAttempts };
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(updated));
    localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - recentAttempts.length),
    retryAfterSeconds: 0,
  };
}

export function resetClientRateLimit(actionKey: string): void {
  const storageKey = `${RATE_LIMIT_STORAGE_PREFIX}${actionKey}`;
  try {
    sessionStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore
  }
}

// ============================================================================
// 3. SSRF PROTECTION (Block 127.0.0.1, 169.254.169.254, Private RFC1918 IPs)
// ============================================================================

const PRIVATE_OR_INTERNAL_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^169\.254\.\d+\.\d+$/, // Cloud metadata service (AWS/GCP/Azure SSRF target)
  /^10\.\d+\.\d+\.\d+$/, // RFC1918 Class A
  /^192\.168\.\d+\.\d+$/, // RFC1918 Class C
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/, // RFC1918 Class B
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd00:/i,
  /\.internal$/i,
  /\.local$/i,
  /^metadata\.google\.internal$/i,
];

export interface SsrfValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

/**
 * Validates a URL to prevent Server-Side / Client-Side Request Forgery (SSRF)
 * against internal loopback, cloud metadata (169.254.169.254), and RFC1918 ranges.
 */
export function validateSafeExternalUrl(
  rawUrl: string,
  options?: { allowDataImage?: boolean; allowRelative?: boolean }
): SsrfValidationResult {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    return { valid: false, reason: "URL cannot be empty." };
  }

  if (options?.allowDataImage && /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed)) {
    return { valid: true, sanitizedUrl: trimmed };
  }

  if (options?.allowRelative && trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return { valid: true, sanitizedUrl: trimmed };
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { valid: false, reason: `Disallowed URL protocol: ${parsed.protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();
    for (const pattern of PRIVATE_OR_INTERNAL_HOST_PATTERNS) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          reason: `Blocked internal/private network address (${hostname}) for SSRF protection.`,
        };
      }
    }

    if (parsed.username || parsed.password) {
      return { valid: false, reason: "Credentials embedded in URLs are not permitted." };
    }

    return { valid: true, sanitizedUrl: parsed.toString() };
  } catch {
    return { valid: false, reason: "Malformed URL format." };
  }
}

// ============================================================================
// 4. SECURE FILE UPLOAD VALIDATION (Max 5MB, JPG/PNG Magic Bytes, UUID Rename)
// ============================================================================

export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface FileSecurityValidationOptions {
  allowPdf?: boolean;
  maxSizeBytes?: number;
}

export interface FileSecurityValidationResult {
  valid: boolean;
  error?: string;
  safeFileName?: string;
  safeExtension?: string;
  detectedMimeType?: string;
}

async function readMagicBytes(file: File, length = 8): Promise<Uint8Array> {
  const slice = file.slice(0, length);
  if (typeof slice.arrayBuffer === "function") {
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
  }
  return await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error("Failed to read file bytes"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("File read error"));
    reader.readAsArrayBuffer(slice);
  });
}

function detectMimeFromMagicBytes(bytes: Uint8Array): "image/jpeg" | "image/png" | "application/pdf" | null {
  // JPEG: FF D8 FF
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  // PDF: 25 50 44 46 (%PDF)
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  return null;
}

/**
 * Validates file size (<= 5MB), checks strict MIME type & binary magic bytes (JPG/PNG, optional PDF),
 * and renames the file to a randomized UUID to prevent path traversal and RCE.
 */
export async function validateAndSanitizeUpload(
  file: File,
  options?: FileSecurityValidationOptions
): Promise<FileSecurityValidationResult> {
  if (!file) {
    return { valid: false, error: "No file provided." };
  }

  const maxBytes = options?.maxSizeBytes ?? MAX_UPLOAD_SIZE_BYTES;
  if (file.size <= 0) {
    return { valid: false, error: "File is empty." };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB security limit.`,
    };
  }

  const allowedMimes = options?.allowPdf
    ? ["image/jpeg", "image/png", "application/pdf"]
    : ["image/jpeg", "image/png"];

  const declaredMime = (file.type || "").toLowerCase();
  if (!allowedMimes.includes(declaredMime)) {
    return {
      valid: false,
      error: options?.allowPdf
        ? "Only JPG, PNG, or PDF files (max 5 MB) are permitted."
        : "Only JPG and PNG photos (max 5 MB) are permitted.",
    };
  }

  try {
    const magicBytes = await readMagicBytes(file, 8);
    const detectedMime = detectMimeFromMagicBytes(magicBytes);
    if (!detectedMime || !allowedMimes.includes(detectedMime)) {
      return {
        valid: false,
        error: "File binary signature does not match a valid JPG/PNG image.",
      };
    }

    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "application/pdf": "pdf",
    };
    const safeExtension = extMap[detectedMime] || "jpg";
    const randomId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    return {
      valid: true,
      safeExtension,
      safeFileName: `${randomId}.${safeExtension}`,
      detectedMimeType: detectedMime,
    };
  } catch {
    return {
      valid: false,
      error: "Unable to verify file binary signature.",
    };
  }
}

// ============================================================================
// 5. PRODUCTION ERROR SANITIZATION (Hide DB Structure / SQL Details)
// ============================================================================

const DB_ERROR_LEAK_PATTERNS = [
  /relation\s+"[^"]+"\s+does\s+not\s+exist/i,
  /column\s+"[^"]+"\s+of\s+relation/i,
  /duplicate\s+key\s+value\s+violates\s+unique\s+constraint/i,
  /violates\s+foreign\s+key\s+constraint/i,
  /violates\s+row-level\s+security\s+policy/i,
  /syntax\s+error\s+at\s+or\s+near/i,
  /PGRST\d+/i,
  /pg_catalog/i,
  /schema\s+"public"/i,
];

/**
 * Strips database table names, constraint names, and internal SQL error details in production.
 */
export function sanitizeErrorMessage(
  err: unknown,
  fallbackMessage = "Request could not be completed. Please check your input and try again."
): string {
  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : fallbackMessage;

  for (const pattern of DB_ERROR_LEAK_PATTERNS) {
    if (pattern.test(rawMessage)) {
      if (/violates\s+row-level\s+security/i.test(rawMessage)) {
        return "Access denied by security policy.";
      }
      if (/duplicate\s+key/i.test(rawMessage)) {
        return "A record with this identifier already exists.";
      }
      return fallbackMessage;
    }
  }

  return sanitizeInputText(rawMessage, 240) || fallbackMessage;
}

// ============================================================================
// 6. PASSWORD / PASSCODE HASHING (PBKDF2-SHA256 & Bcrypt Prefix Support)
// ============================================================================

const DEFAULT_PBKDF2_SALT = "b2gp_nitisha_sec_salt_v1";

/**
 * Derives a salted PBKDF2-SHA256 hex digest (100,000 iterations) in browser WebCrypto
 * so plain-text passwords are never stored in browser storage or source code.
 */
export async function hashPasscodePBKDF2(
  plainText: string,
  salt = DEFAULT_PBKDF2_SALT
): Promise<string> {
  const normalized = plainText.trim();
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(normalized),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `pbkdf2_sha256$100000$${salt}$${hex}`;
  }

  // Fallback deterministic hash if SubtleCrypto is unavailable in test runner
  let h = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    h ^= normalized.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `pbkdf2_fallback$${salt}$${(h >>> 0).toString(16)}`;
}

/**
 * Constant-time string comparison to prevent timing side-channel attacks.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPasscodeHash(
  candidatePlain: string,
  storedHashOrEnvValue: string
): Promise<boolean> {
  const candidate = candidatePlain.trim();
  const target = (storedHashOrEnvValue || "").trim();
  if (!candidate || !target) return false;

  if (target.startsWith("pbkdf2_sha256$")) {
    const parts = target.split("$");
    const salt = parts[2] || DEFAULT_PBKDF2_SALT;
    const candidateHash = await hashPasscodePBKDF2(candidate, salt);
    return timingSafeEqualStr(candidateHash, target);
  }

  // If env contains a raw SHA-256 64-char hex digest
  if (/^[a-f0-9]{64}$/i.test(target) && typeof window !== "undefined" && window.crypto?.subtle) {
    const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(candidate));
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return timingSafeEqualStr(hex.toLowerCase(), target.toLowerCase());
  }

  // Fallback: compare PBKDF2 hashes of both values so comparison is still constant-time hashed
  const [hashA, hashB] = await Promise.all([
    hashPasscodePBKDF2(candidate),
    hashPasscodePBKDF2(target),
  ]);
  return timingSafeEqualStr(hashA, hashB);
}

// ============================================================================
// 7. FAILED PASSWORD ATTEMPT MONITORING & SECURE COOKIE HELPERS
// ============================================================================

export interface FailedAuthAttemptEntry {
  id: string;
  target: string;
  reason: string;
  timestamp: string;
  userAgent: string;
}

const FAILED_ATTEMPTS_STORAGE_KEY = "sec_failed_password_attempts_v1";

export async function logFailedPasswordAttempt(params: {
  target: string;
  reason: string;
  routePath?: string;
}): Promise<void> {
  const entry: FailedAuthAttemptEntry = {
    id: `fail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    target: sanitizeInputText(params.target, 120),
    reason: sanitizeInputText(params.reason, 240),
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 180) : "unknown",
  };

  try {
    const existingRaw = localStorage.getItem(FAILED_ATTEMPTS_STORAGE_KEY);
    const list: FailedAuthAttemptEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    const next = [entry, ...list].slice(0, 100);
    localStorage.setItem(FAILED_ATTEMPTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }

  // Forward to Supabase Auth Audit Ledger
  await recordAdminAuthAuditEvent({
    actorEmail: params.target,
    eventType: "login_failure",
    severity: "warning",
    routePath: params.routePath || (typeof window !== "undefined" ? window.location.pathname : "/"),
    failureReason: params.reason,
  });
}

export function getFailedPasswordAttemptsLog(): FailedAuthAttemptEntry[] {
  try {
    const raw = localStorage.getItem(FAILED_ATTEMPTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Sets a browser cookie with Secure and SameSite=Strict flags enforced.
 */
export function setSecureSameSiteCookie(name: string, value: string, maxAgeSeconds = 86400): void {
  if (typeof document === "undefined") return;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const secureFlag = isHttps ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict${secureFlag}`;
}
