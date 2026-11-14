import React, { useMemo } from "react";
import { CheckCircle2, Circle, ShieldCheck, ShieldAlert, Sparkles, Check, X } from "lucide-react";
import {
  calculatePasswordStrength,
  calculatePasscodeStrength,
  PasswordStrengthResult,
  PasscodeStrengthResult,
} from "@/lib/passwordStrength";
import { checkPasswordMatch } from "@/lib/passwordPolicy";

export interface PasswordStrengthMeterProps {
  value: string;
  confirmValue?: string;
  mode?: "password" | "passcode";
  showRequirements?: boolean;
  showMatch?: boolean;
  className?: string;
  variant?: "default" | "romantic";
  title?: string;
  onStrengthChange?: (isEligible: boolean, score: number) => void;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  value,
  confirmValue,
  mode = "password",
  showRequirements = true,
  showMatch = false,
  className = "",
  variant = "default",
  title,
  onStrengthChange,
}) => {
  const isRomantic = variant === "romantic";

  const passwordResult = useMemo<PasswordStrengthResult | null>(() => {
    if (mode === "password") {
      return calculatePasswordStrength(value);
    }
    return null;
  }, [value, mode]);

  const passcodeResult = useMemo<PasscodeStrengthResult | null>(() => {
    if (mode === "passcode") {
      return calculatePasscodeStrength(value);
    }
    return null;
  }, [value, mode]);

  const result = passwordResult || passcodeResult;
  const isEligible = result?.isEligible ?? false;
  const score = result?.score ?? 0;

  React.useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(isEligible, score);
    }
  }, [isEligible, score, onStrengthChange]);

  const matchResult =
    showMatch && confirmValue !== undefined
      ? checkPasswordMatch(value, confirmValue)
      : null;

  if (!result) return null;

  // Percentage mapping for visual progress bar
  const getPercentage = () => {
    if (!value || value.length === 0) return 0;
    switch (score) {
      case 0:
        return 10;
      case 1:
        return 25;
      case 2:
        return 50;
      case 3:
        return 75;
      case 4:
        return 100;
      default:
        return 10;
    }
  };

  const percentage = getPercentage();

  // Color mapping based on score
  const getProgressColor = () => {
    if (!value || value.length === 0) {
      return isRomantic ? "bg-slate-700" : "bg-muted";
    }
    switch (score) {
      case 0:
      case 1:
        return "bg-red-500 shadow-sm shadow-red-500/30";
      case 2:
        return "bg-amber-500 shadow-sm shadow-amber-500/30";
      case 3:
        return isRomantic
          ? "bg-pink-500 shadow-sm shadow-pink-500/30"
          : "bg-blue-600 shadow-sm shadow-blue-600/30";
      case 4:
        return isRomantic
          ? "bg-emerald-400 shadow-sm shadow-emerald-400/30"
          : "bg-emerald-600 shadow-sm shadow-emerald-600/30";
      default:
        return "bg-red-500";
    }
  };

  const getSegmentColor = (segmentIndex: number) => {
    if (segmentIndex >= score || !value || value.length === 0) {
      return isRomantic ? "bg-slate-800" : "bg-muted";
    }
    switch (score) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-amber-500";
      case 3:
        return isRomantic ? "bg-pink-500" : "bg-blue-600";
      case 4:
        return isRomantic ? "bg-emerald-400" : "bg-emerald-600";
      default:
        return "bg-red-500";
    }
  };

  const getScoreBadge = () => {
    if (value.length === 0) {
      return {
        label: "Empty",
        badgeClass: isRomantic
          ? "bg-slate-800 text-slate-400 border-slate-700"
          : "bg-muted text-muted-foreground border-border/60",
      };
    }
    switch (score) {
      case 0:
      case 1:
        return {
          label: result.label,
          badgeClass: isRomantic
            ? "bg-red-950/80 text-red-300 border-red-800/60"
            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900",
        };
      case 2:
        return {
          label: result.label,
          badgeClass: isRomantic
            ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
            : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
        };
      case 3:
        return {
          label: result.label,
          badgeClass: isRomantic
            ? "bg-rose-950/80 text-rose-300 border-rose-800/60"
            : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
        };
      case 4:
        return {
          label: result.label,
          badgeClass: isRomantic
            ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
        };
      default:
        return { label: result.label, badgeClass: "bg-muted text-muted-foreground border-border/60" };
    }
  };

  const badge = getScoreBadge();

  // Password rules checklist
  const passwordRules = passwordResult
    ? [
        {
          key: "minLength",
          label: "At least 8 characters",
          satisfied: passwordResult.criteria.minLength,
        },
        {
          key: "hasUppercase",
          label: "Uppercase letter (A-Z)",
          satisfied: passwordResult.criteria.hasUppercase,
        },
        {
          key: "hasLowercase",
          label: "Lowercase letter (a-z)",
          satisfied: passwordResult.criteria.hasLowercase,
        },
        {
          key: "hasNumber",
          label: "Number (0-9)",
          satisfied: passwordResult.criteria.hasNumber,
        },
        {
          key: "hasSpecial",
          label: "Special character (!@#$%^&* etc.)",
          satisfied: passwordResult.criteria.hasSpecial,
        },
        {
          key: "noPatterns",
          label: "No trivial sequences or dictionary words",
          satisfied: passwordResult.criteria.noCommonPatterns,
        },
      ]
    : [];

  const passcodeRules = passcodeResult
    ? [
        {
          key: "minLength",
          label: "At least 6 characters",
          satisfied: passcodeResult.criteria.minLength,
        },
        {
          key: "hasVariety",
          label: "Mix of letters and numbers/symbols",
          satisfied: passcodeResult.criteria.hasVariety,
        },
        {
          key: "noPatterns",
          label: "No trivial repeats (111) or sequences (1234)",
          satisfied: passcodeResult.criteria.noCommonPatterns,
        },
      ]
    : [];

  const rules = mode === "password" ? passwordRules : passcodeRules;
  const defaultTitle =
    mode === "password" ? "Password Strength & Requirements" : "Passcode Strength";
  const displayTitle = title || defaultTitle;

  return (
    <div
      className={`rounded-xl border p-4 text-xs space-y-3.5 transition-all ${
        isRomantic
          ? "border-rose-300/20 bg-slate-950/80 text-rose-100 shadow-sm"
          : "border-border/60 bg-card/60 text-foreground shadow-sm"
      } ${className}`}
      aria-live="polite"
      role="region"
      aria-label="Password strength meter and requirements checklist"
    >
      {/* Header with Title, Percentage & Score Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-foreground/90">{displayTitle}</span>
          <span className="font-mono text-[11px] font-medium text-muted-foreground tabular-nums">
            {percentage}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badgeClass}`}
          >
            {isEligible ? (
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            ) : score >= 2 ? (
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{badge.label}</span>
          </span>
        </div>
      </div>

      {/* Real-time Color-Coded Progress Bar */}
      <div className="space-y-1.5">
        <div
          className={`h-2.5 w-full rounded-full overflow-hidden p-0.5 border ${
            isRomantic
              ? "bg-slate-900 border-rose-300/20"
              : "bg-muted/80 dark:bg-muted/40 border-border/60"
          }`}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${percentage} percent (${badge.label})`}
        >
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* 4 Segment Step Markers */}
        <div className="grid grid-cols-4 gap-1 text-[10px] text-center font-medium pt-0.5">
          {[
            { label: "Very Weak", idx: 0, minScore: 1 },
            { label: "Weak", idx: 1, minScore: 2 },
            { label: "Good", idx: 2, minScore: 3 },
            { label: "Strong", idx: 3, minScore: 4 },
          ].map((tier) => {
            const isReached = score >= tier.minScore && value.length > 0;
            return (
              <div key={tier.idx} className="flex flex-col items-center gap-1">
                <div
                  className={`h-1 w-full rounded-full transition-all duration-300 ${getSegmentColor(
                    tier.idx
                  )}`}
                />
                <span
                  className={`truncate transition-colors ${
                    isReached
                      ? isRomantic
                        ? "text-rose-200 font-semibold"
                        : "text-foreground font-semibold"
                      : isRomantic
                      ? "text-rose-400/50"
                      : "text-muted-foreground/60"
                  }`}
                >
                  {tier.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Guidance and Eligibility Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] pt-1">
          <span
            className={
              isRomantic ? "text-rose-200/80" : "text-muted-foreground"
            }
          >
            {value.length === 0 ? "Type a password to evaluate requirements" : result.feedback}
          </span>
          <span
            className={`font-medium ${
              isEligible
                ? isRomantic
                  ? "text-emerald-300"
                  : "text-emerald-700 dark:text-emerald-400"
                : isRomantic
                ? "text-rose-300/70"
                : "text-amber-700 dark:text-amber-400"
            }`}
          >
            {isEligible ? "✓ Eligible for submission" : "Requires Good or Strong"}
          </span>
        </div>
      </div>

      {/* Explicit Requirements Checklist */}
      {showRequirements && (
        <div
          className={`pt-2.5 border-t ${
            isRomantic ? "border-rose-300/15" : "border-border/60"
          } space-y-2`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground/80 tracking-wide uppercase">
              Requirements Checklist
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
              {rules.filter((r) => r.satisfied).length} / {rules.length} completed
            </span>
          </div>

          <ul className="grid sm:grid-cols-2 gap-x-3 gap-y-1.5" role="list">
            {rules.map((r) => (
              <li
                key={r.key}
                className={`flex items-center gap-2 rounded-md px-2 py-1 transition-all ${
                  r.satisfied
                    ? isRomantic
                      ? "bg-emerald-950/30 text-emerald-300 font-medium border border-emerald-800/30"
                      : "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-900/40"
                    : isRomantic
                    ? "text-rose-200/60 bg-slate-900/40 border border-transparent"
                    : "text-muted-foreground bg-muted/30 border border-transparent"
                }`}
              >
                {r.satisfied ? (
                  <CheckCircle2
                    size={14}
                    className={`shrink-0 ${
                      isRomantic
                        ? "text-emerald-400"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    size={14}
                    className={`shrink-0 ${
                      isRomantic
                        ? "text-rose-400/40"
                        : "text-muted-foreground/50"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-[11px] leading-tight">
                  <span className="sr-only">
                    {r.satisfied ? "Requirement met: " : "Requirement incomplete: "}
                  </span>
                  {r.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Password Match Checklist Item */}
      {showMatch && confirmValue !== undefined && (
        <div
          className={`pt-2 border-t ${
            isRomantic ? "border-rose-300/15" : "border-border/60"
          }`}
        >
          <div
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-all ${
              matchResult?.matches
                ? isRomantic
                  ? "bg-emerald-950/30 text-emerald-300 font-medium border border-emerald-800/30"
                  : "bg-emerald-50/80 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium border border-emerald-200/60 dark:border-emerald-900/40"
                : isRomantic
                ? "bg-slate-900/40 text-rose-200/60 border border-transparent"
                : "bg-muted/30 text-muted-foreground border border-transparent"
            }`}
          >
            {matchResult?.matches ? (
              <CheckCircle2
                size={14}
                className={`shrink-0 ${
                  isRomantic
                    ? "text-emerald-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
                aria-hidden="true"
              />
            ) : (
              <Circle
                size={14}
                className={`shrink-0 ${
                  isRomantic
                    ? "text-rose-400/40"
                    : "text-muted-foreground/50"
                }`}
                aria-hidden="true"
              />
            )}
            <span className="text-[11px]">
              <span className="sr-only">
                {matchResult?.matches ? "Match status: " : "Match status: incomplete "}
              </span>
              {matchResult?.matches
                ? "✓ Passwords match"
                : confirmValue.length > 0
                ? "✕ Passwords do not match yet"
                : "○ Confirm password to verify match"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
