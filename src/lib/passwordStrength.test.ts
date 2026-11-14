import { describe, it, expect } from "vitest";
import {
  calculatePasswordStrength,
  isPasswordEligible,
  calculatePasscodeStrength,
} from "./passwordStrength";

describe("Password Strength & Policy Engine", () => {
  it("evaluates empty password as score 0 and not eligible", () => {
    const res = calculatePasswordStrength("");
    expect(res.score).toBe(0);
    expect(res.isEligible).toBe(false);
    expect(res.criteria.minLength).toBe(false);
  });

  it("penalizes common dictionary words and simple sequences", () => {
    const weakRes = calculatePasswordStrength("bagula123");
    expect(weakRes.criteria.noCommonPatterns).toBe(false);
    expect(weakRes.isEligible).toBe(false);

    const simpleRes = calculatePasswordStrength("12345678");
    expect(simpleRes.score).toBeLessThanOrEqual(1);
    expect(simpleRes.isEligible).toBe(false);
  });

  it("rejects passwords lacking mixed character classes even if long", () => {
    const allLower = calculatePasswordStrength("alllowercaselongpassword");
    expect(allLower.isEligible).toBe(false);
    expect(allLower.score).toBeLessThan(3);

    const eligibility = isPasswordEligible("alllowercaselongpassword");
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reason).toContain("uppercase");
  });

  it("penalizes passwords containing local dictionary roots like Bagula", () => {
    const bagulaPw = calculatePasswordStrength("Bagula@2026Secure!");
    expect(bagulaPw.criteria.noCommonPatterns).toBe(false);
    expect(bagulaPw.score).toBeLessThanOrEqual(2);
  });

  it("qualifies robust password with mixed character classes as Good or Strong", () => {
    const validGood = calculatePasswordStrength("Kolkata#2026Secure!");
    expect(validGood.criteria.minLength).toBe(true);
    expect(validGood.criteria.hasUppercase).toBe(true);
    expect(validGood.criteria.hasLowercase).toBe(true);
    expect(validGood.criteria.hasNumber).toBe(true);
    expect(validGood.criteria.hasSpecial).toBe(true);
    expect(validGood.criteria.noCommonPatterns).toBe(true);
    expect(validGood.score).toBeGreaterThanOrEqual(3);
    expect(validGood.isEligible).toBe(true);

    const eligibility = isPasswordEligible("Kolkata#2026Secure!");
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.score).toBeGreaterThanOrEqual(3);
  });

  it("evaluates passcodes correctly for private gates", () => {
    // Trivial sequential passcode
    const trivial = calculatePasscodeStrength("123456");
    expect(trivial.isEligible).toBe(false);
    expect(trivial.criteria.noCommonPatterns).toBe(false);

    // Short passcode
    const short = calculatePasscodeStrength("12a");
    expect(short.isEligible).toBe(false);

    // Good mixed passcode
    const goodPasscode = calculatePasscodeStrength("Kolkata@2024");
    expect(goodPasscode.score).toBeGreaterThanOrEqual(3);
    expect(goodPasscode.isEligible).toBe(true);
  });
});
