import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activityLog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  loadForcedLogoutSettings,
  resolveUserSessionPolicy,
  type ResolvedSessionPolicy,
} from "@/lib/sessionSecurityService";
import { isSuperAdminEmail } from "@/lib/permissions";

// Security compliance constants: 3 minutes total inactivity limit, 60s warning threshold
export const ADMIN_IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 180,000 ms = 3 minutes
export const ADMIN_IDLE_WARNING_MS = 60 * 1000;      // 60,000 ms = 1 minute warning window
const ACTIVITY_STORAGE_KEY = "admin_last_activity_ts";
export const ADMIN_LOGOUT_REASON_KEY = "admin_logout_reason";
export const ADMIN_DISCLAIMER_KEY = "admin_logout_disclaimer";

export const ADMIN_INACTIVITY_DISCLAIMER =
  "Your administrative session was automatically terminated due to 3 minutes of inactivity, in accordance with Gram Panchayat e-governance security compliance guidelines. Please log in again to continue.";

interface AdminIdleTimerProps {
  children: ReactNode;
  timeoutMs?: number;
  warningMs?: number;
}

export function AdminIdleTimer({
  children,
  timeoutMs: propTimeoutMs,
  warningMs: propWarningMs,
}: AdminIdleTimerProps) {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const [policy, setPolicy] = useState<ResolvedSessionPolicy>(() =>
    resolveUserSessionPolicy({})
  );

  // If explicit props were passed (e.g. In unit tests), respect them; otherwise use dynamic resolved policy
  const effectiveTimeoutMs =
    typeof propTimeoutMs === "number" ? propTimeoutMs : policy.timeoutMs;
  const effectiveWarningMs =
    typeof propWarningMs === "number" ? propWarningMs : policy.warningMs;
  const isForcedLogoutEnabled =
    typeof propTimeoutMs === "number" ? true : policy.forcedLogoutEnabled;

  const [secondsRemaining, setSecondsRemaining] = useState(Math.floor(effectiveWarningMs / 1000));
  const isLoggingOutRef = useRef(false);
  const lastActiveRef = useRef<number>(Date.now());
  const toastShownRef = useRef(false);

  // Synchronize dynamic session rules from database & current user
  useEffect(() => {
    let isMounted = true;
    async function syncPolicy() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userEmail = sessionData?.session?.user?.email;
        const role = isSuperAdminEmail(userEmail)
          ? "super_admin"
          : (sessionData?.session?.user?.user_metadata as any)?.role || "admin";
        const settings = await loadForcedLogoutSettings();
        if (isMounted) {
          const resolved = resolveUserSessionPolicy({
            userEmail,
            userRole: role,
            settings,
          });
          setPolicy(resolved);
        }
      } catch (err) {
        // Keep fallback
      }
    }

    syncPolicy();

    // Live listener when Super Admin updates settings
    const handleUpdate = () => {
      syncPolicy();
    };
    window.addEventListener("bagula_session_settings_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("bagula_session_settings_updated", handleUpdate);
    };
  }, []);

  // Synchronize initial timestamp
  useEffect(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
    } catch {
      // Storage unavailable in sandbox or private mode
    }
  }, []);

  const handleForcedLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);

    const activeDisclaimer = policy.disclaimer || ADMIN_INACTIVITY_DISCLAIMER;

    try {
      sessionStorage.setItem(ADMIN_LOGOUT_REASON_KEY, "idle_timeout");
      sessionStorage.setItem(ADMIN_DISCLAIMER_KEY, activeDisclaimer);
    } catch {
      // Ignore sessionStorage issues
    }

    try {
      await logActivity({
        action_type: "auth.session_timeout",
        metadata: {
          reason: "idle_inactivity",
          rule: policy.matchedRuleName || "standard_inactivity_rule",
          compliance: "gram_panchayat_security_policy",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn("Failed to log activity timeout:", err);
    }

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Supabase signOut error on idle timeout:", err);
    } finally {
      navigate("/admin?reason=idle_timeout", { replace: true });
    }
  }, [navigate, policy.disclaimer, policy.matchedRuleName]);

  // Keep session alive (user explicitly confirms or performs active action)
  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActiveRef.current = now;
    setShowWarning(false);
    toastShownRef.current = false;
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
    } catch {
      // Ignore
    }
  }, []);

  // Activity handler with throttling (update at most once per 1000ms)
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;

    const handleUserActivity = () => {
      // If warning modal is open, user must explicitly click button to dismiss
      if (showWarning) return;

      if (!throttleTimeout) {
        lastActiveRef.current = Date.now();
        try {
          localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());
        } catch {
          // Ignore
        }
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "wheel"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    // Multi-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ACTIVITY_STORAGE_KEY && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime) && remoteTime > lastActiveRef.current) {
          lastActiveRef.current = remoteTime;
          if (showWarning) {
            setShowWarning(false);
            toastShownRef.current = false;
          }
        }
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      window.removeEventListener("storage", handleStorage);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [showWarning]);

  // Interval ticker checking idle state every 1 second
  useEffect(() => {
    // If forced logout is disabled for this user/role or globally, bypass check
    if (!isForcedLogoutEnabled) {
      if (showWarning) setShowWarning(false);
      return;
    }

    const interval = setInterval(() => {
      if (isLoggingOutRef.current) return;

      // Check for remote multi-tab updates
      try {
        const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastActiveRef.current) {
            lastActiveRef.current = parsed;
          }
        }
      } catch {
        // Ignore
      }

      const now = Date.now();
      const elapsed = now - lastActiveRef.current;
      const timeLeft = effectiveTimeoutMs - elapsed;

      if (timeLeft <= 0) {
        // Inactivity exceeded - force logout
        handleForcedLogout();
      } else if (timeLeft <= effectiveWarningMs) {
        // Within warning window
        const secondsLeft = Math.max(1, Math.ceil(timeLeft / 1000));
        setSecondsRemaining(secondsLeft);
        if (!showWarning) {
          setShowWarning(true);
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast.warning("Administrative session expiring soon due to inactivity.", {
              id: "admin-session-inactivity",
              duration: 5000,
            });
          }
        }
      } else {
        // Session active and healthy
        if (showWarning) {
          setShowWarning(false);
          toastShownRef.current = false;
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [effectiveTimeoutMs, effectiveWarningMs, showWarning, handleForcedLogout, isForcedLogoutEnabled]);

  const progressPercent = Math.min(
    100,
    Math.max(0, (secondsRemaining / (effectiveWarningMs / 1000)) * 100)
  );

  return (
    <>
      {children}

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="max-w-md border-destructive/20 bg-background/95 backdrop-blur-md shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <AlertDialogTitle className="text-base font-bold text-foreground">
                  {policy.warningTitle || "Session Timeout Warning"}
                </AlertDialogTitle>
                <p className="text-xs text-muted-foreground">
                  Security Compliance · Bagula 2 No Gram Panchayat
                </p>
              </div>
            </div>

            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2 text-sm text-foreground">
                <p>
                  {policy.warningMessage ||
                    "You have been inactive for over 2 minutes. For security compliance and protection of official records, your session will automatically terminate in:"}
                </p>

                {policy.warningMessageBn && (
                  <p className="text-xs text-primary font-bengali bg-primary/5 p-2 rounded-lg">
                    {policy.warningMessageBn}
                  </p>
                )}

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-2xl font-mono">
                    <Clock className="w-5 h-5 animate-pulse" />
                    <span>0:{secondsRemaining.toString().padStart(2, "0")}</span>
                  </div>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                    seconds remaining until forced sign out
                  </p>
                  <div className="mt-2.5">
                    <Progress value={progressPercent} className="h-1.5 bg-amber-200/50" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground border-l-2 border-primary/40 pl-2">
                  <span className="font-semibold text-foreground">Security Policy:</span> Government
                  e-governance standards require automatic logout after inactivity to prevent
                  unauthorized access to office records.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-2 flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              onClick={handleForcedLogout}
              className="w-full sm:w-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Now</span>
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={resetTimer}
              className="w-full sm:w-auto inline-flex items-center gap-1.5 font-medium bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Stay Signed In</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AdminIdleTimer;
