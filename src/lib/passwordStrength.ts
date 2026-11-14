/**
 * Password & Passcode Strength Evaluation Engine
 * Enforces Bagula II Gram Panchayat Digital & Account Security Policy:
 *  - Minimum 8 characters
 *  - At least 1 uppercase letter (A-Z)
 *  - At least 1 lowercase letter (a-z)
 *  - At least 1 digit (0-9)
 *  - At least 1 special symbol (!@#$%^&* etc.)
 *  - Penalizes predictable patterns, repeats, and common dictionary roots
 *  - Requires "Good" or "Strong" rating (score >= 3) for submission
 */

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;
export type PasswordStrengthLabel = "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordCriterion {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  score: PasswordStrengthScore;
  label: PasswordStrengthLabel;
  colorClass: string;
  barColor: string;
  feedback: string;
  isEligible: boolean; // Requires Good or Strong rating with mixed characters
  criteria: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    noCommonPatterns: boolean;
  };
}

export interface PasscodeStrengthResult {
  score: PasswordStrengthScore;
  label: PasswordStrengthLabel;
  colorClass: string;
  barColor: string;
  feedback: string;
  isEligible: boolean;
  criteria: {
    minLength: boolean;
    hasVariety: boolean;
    noCommonPatterns: boolean;
  };
}

const COMMON_DICTIONARY_WORDS = [
  "password",
  "admin",
  "bagula",
  "panchayat",
  "nadia",
  "hanskhali",
  "bengal",
  "secret",
  "welcome",
  "qwerty",
  "123456",
  "12345678",
  "123456789",
  "letmein",
  "portal",
  "office",
];

/**
 * Evaluates password strength and returns detailed score, feedback, and criteria.
 */
export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const pw = password ?? "";

  const minLength = pw.length >= 8;
  const longLength = pw.length >= 12;
  const hasUppercase = /[A-Z]/.test(pw);
  const hasLowercase = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);

  // Check for common patterns / repetitions
  const lowerPw = pw.toLowerCase();
  const hasRepeatedChars = /(.)\1{2,}/.test(pw); // e.g. "aaa", "111"
  const hasSequentialNumbers = /(012|123|234|345|456|567|678|789|890)/.test(pw);
  const hasDictionaryWord = COMMON_DICTIONARY_WORDS.some((word) => lowerPw.includes(word));

  const noCommonPatterns = !hasRepeatedChars && !hasSequentialNumbers && !hasDictionaryWord;

  if (pw.length === 0) {
    return {
      score: 0,
      label: "Very Weak",
      colorClass: "text-muted-foreground",
      barColor: "bg-muted",
      feedback: "Enter a strong password with letters, numbers, and symbols.",
      isEligible: false,
      criteria: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        noCommonPatterns: true,
      },
    };
  }

  // Count core character classes
  let classCount = 0;
  if (hasUppercase) classCount++;
  if (hasLowercase) classCount++;
  if (hasNumber) classCount++;
  if (hasSpecial) classCount++;

  let calculatedScore: PasswordStrengthScore = 0;

  if (!minLength) {
    // Under 8 characters is strictly weak
    calculatedScore = pw.length >= 5 && classCount >= 2 ? 1 : 0;
  } else {
    // Length >= 8
    if (classCount <= 1) {
      calculatedScore = 1;
    } else if (classCount === 2 || classCount === 3) {
      calculatedScore = 2; // Fair
      // If fairly long and has at least 3 classes without patterns, promote to Good
      if (pw.length >= 10 && classCount === 3 && noCommonPatterns) {
        calculatedScore = 3;
      }
    } else if (classCount === 4) {
      // Has all 4 mixed character groups!
      if (noCommonPatterns) {
        calculatedScore = longLength || pw.length >= 10 ? 4 : 3;
      } else {
        // Has all classes but contains common word or sequence
        calculatedScore = 2;
      }
    }
  }

  // Mandatory eligibility condition:
  // Must satisfy all 4 character classes + min 8 length + score >= 3 (Good or Strong)
  const isEligible =
    minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    calculatedScore >= 3;

  const scoreMap: Record<
    PasswordStrengthScore,
    { label: PasswordStrengthLabel; colorClass: string; barColor: string; feedback: string }
  > = {
    0: {
      label: "Very Weak",
      colorClass: "text-red-500 dark:text-red-400",
      barColor: "bg-red-500",
      feedback: "Password is too short or predictable. Use at least 8 mixed characters.",
    },
    1: {
      label: "Weak",
      colorClass: "text-orange-500 dark:text-orange-400",
      barColor: "bg-orange-500",
      feedback: "Add uppercase letters, numbers, and symbols to boost security.",
    },
    2: {
      label: "Fair",
      colorClass: "text-amber-500 dark:text-amber-400",
      barColor: "bg-amber-500",
      feedback: "Almost there! Include all 4 character groups and avoid common patterns for 'Good' status.",
    },
    3: {
      label: "Good",
      colorClass: "text-blue-600 dark:text-blue-400",
      barColor: "bg-blue-600",
      feedback: "Good security level! Meets administrative standards for portal access.",
    },
    4: {
      label: "Strong",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-600",
      feedback: "Excellent! Highly resilient password adhering to high-security standards.",
    },
  };

  const meta = scoreMap[calculatedScore];

  return {
    score: calculatedScore,
    label: meta.label,
    colorClass: meta.colorClass,
    barColor: meta.barColor,
    feedback: meta.feedback,
    isEligible,
    criteria: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      noCommonPatterns,
    },
  };
}

/**
 * Validates a password specifically against the "Good or Strong with mixed characters" policy.
 */
export function isPasswordEligible(password: string): {
  eligible: boolean;
  score: PasswordStrengthScore;
  reason?: string;
} {
  const result = calculatePasswordStrength(password);
  if (result.isEligible) {
    return { eligible: true, score: result.score };
  }

  let reason = "Password does not meet the required Good or Strong rating.";
  if (!result.criteria.minLength) {
    reason = "Password must be at least 8 characters long.";
  } else if (!result.criteria.hasUppercase) {
    reason = "Password must contain at least one uppercase letter (A-Z).";
  } else if (!result.criteria.hasLowercase) {
    reason = "Password must contain at least one lowercase letter (a-z).";
  } else if (!result.criteria.hasNumber) {
    reason = "Password must contain at least one number (0-9).";
  } else if (!result.criteria.hasSpecial) {
    reason = "Password must contain at least one special symbol (!@#$%^&* etc.).";
  } else if (!result.criteria.noCommonPatterns) {
    reason = "Password contains repeated characters or common words (like 'bagula' or '123').";
  }

  return { eligible: false, score: result.score, reason };
}

/**
 * Evaluates passcode strength for private site lock gates.
 */
export function calculatePasscodeStrength(passcode: string): PasscodeStrengthResult {
  const code = passcode ?? "";
  const minLength = code.length >= 6;
  const longLength = code.length >= 10;

  const hasRepeated = /(.)\1{2,}/.test(code);
  const hasSeq = /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(code);
  const hasCommonWord = COMMON_DICTIONARY_WORDS.some((w) => code.toLowerCase().includes(w));
  const noCommonPatterns = !hasRepeated && !hasSeq && !hasCommonWord;

  const hasNumbers = /[0-9]/.test(code);
  const hasLetters = /[a-zA-Z]/.test(code);
  const hasSymbols = /[^a-zA-Z0-9]/.test(code);
  const hasVariety = (hasNumbers && hasLetters) || (hasNumbers && hasSymbols) || (hasLetters && hasSymbols);

  if (code.length === 0) {
    return {
      score: 0,
      label: "Very Weak",
      colorClass: "text-muted-foreground",
      barColor: "bg-muted",
      feedback: "Enter at least 6 characters for your private gate passcode.",
      isEligible: false,
      criteria: { minLength: false, hasVariety: false, noCommonPatterns: true },
    };
  }

  let score: PasswordStrengthScore = 0;
  if (!minLength) {
    score = code.length >= 4 ? 1 : 0;
  } else if (!noCommonPatterns) {
    score = 1;
  } else if (!hasVariety) {
    score = code.length >= 8 ? 2 : 1;
  } else {
    score = longLength && hasSymbols ? 4 : 3;
  }

  const isEligible = score >= 3 && minLength && noCommonPatterns;

  const map: Record<
    PasswordStrengthScore,
    { label: PasswordStrengthLabel; colorClass: string; barColor: string; feedback: string }
  > = {
    0: {
      label: "Very Weak",
      colorClass: "text-red-500 dark:text-red-400",
      barColor: "bg-red-500",
      feedback: "Passcode is too short or predictable.",
    },
    1: {
      label: "Weak",
      colorClass: "text-orange-500 dark:text-orange-400",
      barColor: "bg-orange-500",
      feedback: "Avoid simple sequences like '1234' or common terms.",
    },
    2: {
      label: "Fair",
      colorClass: "text-amber-500 dark:text-amber-400",
      barColor: "bg-amber-500",
      feedback: "Combine letters and numbers for a Good rating.",
    },
    3: {
      label: "Good",
      colorClass: "text-blue-600 dark:text-blue-400",
      barColor: "bg-blue-600",
      feedback: "Solid passcode protecting the private gate.",
    },
    4: {
      label: "Strong",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-600",
      feedback: "High-entropy passcode. Very secure.",
    },
  };

  const meta = map[score];

  return {
    score,
    label: meta.label,
    colorClass: meta.colorClass,
    barColor: meta.barColor,
    feedback: meta.feedback,
    isEligible,
    criteria: { minLength, hasVariety, noCommonPatterns },
  };
}
