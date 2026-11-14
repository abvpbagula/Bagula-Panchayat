import React, { useState, useEffect } from "react";
import { Heart, Lock, ShieldCheck, Sparkles, KeyRound, Eye, EyeOff, AlertTriangle, CheckCircle2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  checkClientRateLimit,
  resetClientRateLimit,
  hashPasscodePBKDF2,
  verifyPasscodeHash,
  logFailedPasswordAttempt,
  setSecureSameSiteCookie,
  sanitizeInputText,
} from "@/lib/securityHardening";
import { calculatePasscodeStrength } from "@/lib/passwordStrength";
import { PasswordStrengthMeter } from "@/components/security/PasswordStrengthMeter";
import { toast } from "sonner";

const GATE_UNLOCKED_SESSION_KEY = "private_gate_unlocked_v1";
const GATE_CUSTOM_HASH_STORAGE_KEY = "private_gate_pbkdf2_hash_v1";

interface PrivatePasscodeGateProps {
  children?: React.ReactNode;
  standaloneMode?: boolean;
}

export const PrivatePasscodeGate: React.FC<PrivatePasscodeGateProps> = ({
  children,
  standaloneMode = false,
}) => {
  const envPasscodeOrHash =
    (import.meta.env.VITE_SITE_PASSWORD_HASH as string | undefined) ||
    (import.meta.env.VITE_SITE_PASSCODE as string | undefined) ||
    "";
  const isGateForcedByEnv =
    String(import.meta.env.VITE_ENABLE_PRIVATE_GATE || "").toLowerCase() === "true";

  const [storedHash, setStoredHash] = useState<string>(() => {
    try {
      return envPasscodeOrHash || localStorage.getItem(GATE_CUSTOM_HASH_STORAGE_KEY) || "";
    } catch {
      return envPasscodeOrHash;
    }
  });

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(GATE_UNLOCKED_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [passcodeInput, setPasscodeInput] = useState("");
  const [setupPasscode, setSetupPasscode] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [generatedEnvHash, setGeneratedEnvHash] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // If neither standalone mode nor env-enabled private gate is active, render children directly
  if (!standaloneMode && !isGateForcedByEnv) {
    return <>{children}</>;
  }

  // If already unlocked in this session and not in standalone configuration preview
  if (unlocked && !standaloneMode) {
    return <>{children}</>;
  }

  const handleSetInitialPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPass = sanitizeInputText(setupPasscode, 128);
    const cleanConfirm = sanitizeInputText(setupConfirm, 128);

    const passcodeEvaluation = calculatePasscodeStrength(cleanPass);
    if (!passcodeEvaluation.isEligible) {
      setErrorMsg(
        passcodeEvaluation.feedback ||
          "Please choose a passcode with at least 6 characters, mixed letters and numbers/symbols, without repetitive sequences."
      );
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setErrorMsg("Passcodes do not match. Please re-enter carefully.");
      return;
    }

    setBusy(true);
    try {
      const pbkdf2Hash = await hashPasscodePBKDF2(cleanPass);
      try {
        localStorage.setItem(GATE_CUSTOM_HASH_STORAGE_KEY, pbkdf2Hash);
      } catch {
        // Ignore storage errors
      }
      setStoredHash(pbkdf2Hash);
      setGeneratedEnvHash(pbkdf2Hash);
      setSetupPasscode("");
      setSetupConfirm("");
      toast.success("Private passcode hash created! Copy VITE_SITE_PASSWORD_HASH to your .env file.");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rateCheck = checkClientRateLimit("private_gate_unlock", 5, 60_000);
    if (!rateCheck.allowed) {
      setLockoutSeconds(rateCheck.retryAfterSeconds);
      const msg = `Too many failed attempts (max 5 per minute). Please wait ${rateCheck.retryAfterSeconds}s.`;
      setErrorMsg(msg);
      await logFailedPasswordAttempt({
        target: "private_relationship_gate",
        reason: `Rate limit triggered (${rateCheck.retryAfterSeconds}s cooldown)`,
      });
      return;
    }

    const cleanCandidate = sanitizeInputText(passcodeInput, 128);
    if (!cleanCandidate) {
      setErrorMsg("Please enter the secret passcode.");
      return;
    }

    setBusy(true);
    try {
      const isValid = await verifyPasscodeHash(cleanCandidate, storedHash);
      if (!isValid) {
        const msg = `Incorrect passcode. ${rateCheck.remainingAttempts} attempt(s) remaining this minute.`;
        setErrorMsg(msg);
        await logFailedPasswordAttempt({
          target: "private_relationship_gate",
          reason: "Invalid passcode entered at private gate",
        });
        return;
      }

      resetClientRateLimit("private_gate_unlock");
      try {
        sessionStorage.setItem(GATE_UNLOCKED_SESSION_KEY, "1");
      } catch {
        // Ignore
      }
      setSecureSameSiteCookie("private_gate_session", "verified", 3600);
      setUnlocked(true);
      setPasscodeInput("");
      toast.success("Welcome back — private space unlocked.");
    } finally {
      setBusy(false);
    }
  };

  const handleLockAgain = () => {
    try {
      sessionStorage.removeItem(GATE_UNLOCKED_SESSION_KEY);
    } catch {
      // Ignore
    }
    setSecureSameSiteCookie("private_gate_session", "", 0);
    setUnlocked(false);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-950 via-slate-950 to-pink-950 text-rose-50 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle romantic ambient glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pink-500/15 blur-3xl" />

      <div className="w-full max-w-md rounded-3xl border border-rose-300/20 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <Heart className="w-7 h-7 text-white fill-white/90" />
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-rose-300/90 font-semibold pt-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Private Sanctuary & Protected Journey</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
            {storedHash ? "Enter Our Secret Key" : "Set Your Private Passcode"}
          </h1>
          <p className="text-xs sm:text-sm text-rose-200/80 leading-relaxed max-w-xs">
            {storedHash
              ? "This space is private and protected. Enter our shared passcode (such as our anniversary date) to unlock the journey."
              : "Protect your private memories before unlocking. Suggestion: use 'our anniversary date' (e.g., DD-MM-YYYY)."}
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-2xl border border-rose-500/40 bg-rose-950/70 px-4 py-3 text-xs text-rose-200 flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {!storedHash ? (
          <form onSubmit={handleSetInitialPasscode} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="setup-passcode" className="text-xs text-rose-200">
                Create Secret Passcode (Suggestion: Our Anniversary Date)
              </Label>
              <div className="relative">
                <Input
                  id="setup-passcode"
                  type={showPassword ? "text" : "password"}
                  value={setupPasscode}
                  onChange={(e) => setSetupPasscode(e.target.value)}
                  placeholder="e.g., 14-02-2023 or our anniversary date"
                  className="bg-slate-950/80 border-rose-300/25 text-white placeholder:text-rose-200/40 pr-10 rounded-xl h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300/70 hover:text-white"
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup-confirm" className="text-xs text-rose-200">
                Confirm Secret Passcode
              </Label>
              <Input
                id="setup-confirm"
                type={showPassword ? "text" : "password"}
                value={setupConfirm}
                onChange={(e) => setSetupConfirm(e.target.value)}
                placeholder="Re-enter your secret passcode"
                className="bg-slate-950/80 border-rose-300/25 text-white placeholder:text-rose-200/40 rounded-xl h-11"
                required
              />
            </div>

            {Boolean(setupPasscode || setupConfirm) && (
              <PasswordStrengthMeter
                mode="passcode"
                variant="romantic"
                value={setupPasscode}
                confirmValue={setupConfirm}
                showMatch={true}
                title="Passcode Security & Strength"
              />
            )}

            <Button
              type="submit"
              disabled={
                busy ||
                !calculatePasscodeStrength(setupPasscode).isEligible ||
                !setupConfirm ||
                setupPasscode !== setupConfirm
              }
              className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-rose-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              {busy ? "Hashing with PBKDF2-SHA256..." : "Save & Activate Private Gate"}
            </Button>
          </form>
        ) : unlocked && standaloneMode ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Private Journey Unlocked</span>
              </div>
              <p className="text-emerald-100/80 leading-relaxed">
                Your session is verified with PBKDF2-SHA256 hashing, brute-force rate limiting (max 5 tries/min), and failed-attempt monitoring.
              </p>
            </div>

            {generatedEnvHash && (
              <div className="rounded-2xl border border-rose-300/20 bg-slate-950/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-200">Store in .env (Never in code):</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-rose-300 hover:text-white"
                    onClick={() => {
                      navigator.clipboard?.writeText(`VITE_SITE_PASSWORD_HASH=${generatedEnvHash}`);
                      toast.success("Copied VITE_SITE_PASSWORD_HASH to clipboard");
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy .env Line
                  </Button>
                </div>
                <code className="block text-[11px] font-mono break-all text-rose-300/90 bg-slate-900 p-2 rounded-lg">
                  VITE_SITE_PASSWORD_HASH={generatedEnvHash}
                </code>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleLockAgain}
                className="w-full rounded-xl border-rose-300/30 bg-transparent text-rose-100 hover:bg-rose-900/30"
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Private Gate
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="unlock-passcode" className="text-xs text-rose-200">
                Secret Passcode (Hint: Our Anniversary Date)
              </Label>
              <div className="relative">
                <Input
                  id="unlock-passcode"
                  type={showPassword ? "text" : "password"}
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  disabled={lockoutSeconds > 0 || busy}
                  placeholder="Enter secret passcode..."
                  className="bg-slate-950/80 border-rose-300/25 text-white placeholder:text-rose-200/40 pr-10 rounded-xl h-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-300/70 hover:text-white"
                  aria-label={showPassword ? "Hide passcode" : "Show passcode"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={lockoutSeconds > 0 || busy}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-rose-600/25"
            >
              <Lock className="w-4 h-4 mr-2" />
              {lockoutSeconds > 0
                ? `Locked (${lockoutSeconds}s cooldown)`
                : busy
                ? "Verifying..."
                : "Unlock Our Journey"}
            </Button>

            {generatedEnvHash && (
              <div className="rounded-2xl border border-rose-300/20 bg-slate-950/80 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-rose-200">Add to .env:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(`VITE_SITE_PASSWORD_HASH=${generatedEnvHash}`);
                      toast.success("Copied VITE_SITE_PASSWORD_HASH to clipboard");
                    }}
                    className="text-rose-300 hover:text-white inline-flex items-center gap-1 text-[11px]"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <code className="block text-[10px] font-mono break-all text-rose-300/90">
                  VITE_SITE_PASSWORD_HASH={generatedEnvHash}
                </code>
              </div>
            )}
          </form>
        )}

        <div className="pt-3 border-t border-rose-300/15 flex items-center justify-between text-[11px] text-rose-200/60">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            PBKDF2-SHA256 Hashed
          </span>
          <span className="tabular-nums">Max 5 tries / min</span>
        </div>
      </div>
    </div>
  );
};

export default PrivatePasscodeGate;
