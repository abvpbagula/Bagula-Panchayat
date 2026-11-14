import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeInputText,
  sanitizeObjectStrings,
  checkClientRateLimit,
  resetClientRateLimit,
  validateSafeExternalUrl,
  validateAndSanitizeUpload,
  sanitizeErrorMessage,
  hashPasscodePBKDF2,
  verifyPasscodeHash,
} from "./securityHardening";

describe("Security Hardening Suite", () => {
  beforeEach(() => {
    resetClientRateLimit("test_gate");
  });

  it("strips <script> tags, inline event handlers, and javascript: URIs to prevent XSS", () => {
    const dirty = `Hello <script>alert('xss')</script><img src=x onerror="evil()"> javascript:alert(1) World`;
    const clean = sanitizeInputText(dirty);
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain("Hello");
    expect(clean).toContain("World");

    const nested = sanitizeObjectStrings({
      note: "<script>steal()</script>Our favorite memory",
      tags: ["<b>safe</b>", "<script>bad()</script>anniversary"],
    });
    expect(nested.note).toBe("Our favorite memory");
    expect(nested.tags[1]).toBe("anniversary");
  });

  it("enforces brute-force rate limiting at max 5 tries per minute", () => {
    for (let i = 1; i <= 5; i++) {
      const res = checkClientRateLimit("test_gate", 5, 60_000);
      expect(res.allowed).toBe(true);
    }
    const sixth = checkClientRateLimit("test_gate", 5, 60_000);
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("blocks SSRF internal IPs (127.0.0.1, 169.254.169.254, RFC1918, localhost)", () => {
    expect(validateSafeExternalUrl("http://127.0.0.1:8080/admin").valid).toBe(false);
    expect(validateSafeExternalUrl("http://169.254.169.254/latest/meta-data/").valid).toBe(false);
    expect(validateSafeExternalUrl("http://localhost:3000/secret").valid).toBe(false);
    expect(validateSafeExternalUrl("http://192.168.1.1/router").valid).toBe(false);
    expect(validateSafeExternalUrl("http://10.0.0.5/internal").valid).toBe(false);
    expect(validateSafeExternalUrl("https://bagula2gp.lovable.app/verify").valid).toBe(true);
  });

  it("validates file uploads (JPG/PNG magic bytes, max 5MB, and UUID rename)", async () => {
    // Valid PNG header: 89 50 4E 47 0D 0A 1A 0A
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const validPng = new File([pngBytes], "../../evil_shell.php.png", { type: "image/png" });
    const res = await validateAndSanitizeUpload(validPng);
    expect(res.valid).toBe(true);
    expect(res.safeFileName).toMatch(/^[a-f0-9_-]+\.png$/i);
    expect(res.safeFileName).not.toContain("evil_shell");

    // Spoofed PHP file pretending to be image/jpeg
    const spoofedBytes = new Uint8Array([0x3c, 0x3f, 0x70, 0x68, 0x70]); // <?php
    const spoofedFile = new File([spoofedBytes], "photo.jpg", { type: "image/jpeg" });
    const badRes = await validateAndSanitizeUpload(spoofedFile);
    expect(badRes.valid).toBe(false);
  });

  it("hashes and verifies passcodes without storing plain text", async () => {
    const hash = await hashPasscodePBKDF2("14-02-2022");
    expect(hash).not.toContain("14-02-2022");
    expect(await verifyPasscodeHash("14-02-2022", hash)).toBe(true);
    expect(await verifyPasscodeHash("wrong-date", hash)).toBe(false);
  });

  it("strips internal database structure details from error messages", () => {
    const dbErr = new Error('relation "public.secret_table" does not exist at character 15');
    const safeMsg = sanitizeErrorMessage(dbErr);
    expect(safeMsg).not.toContain("secret_table");
  });
});
