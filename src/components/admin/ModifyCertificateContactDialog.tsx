import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Smartphone, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateCertificateContact } from "@/lib/certificateContactService";

export interface TargetCertificateContact {
  id: string;
  kind: "warish" | "dependent" | "linkage";
  memo_no?: string | null;
  verification_id?: string | null;
  applicant_name?: string | null;
  mobile?: string | null;
  email?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: TargetCertificateContact | null;
  actorEmail?: string;
  onSuccess?: (updated: { id: string; mobile: string; email: string }) => void;
}

export default function ModifyCertificateContactDialog({
  open,
  onOpenChange,
  target,
  actorEmail,
  onSuccess,
}: Props) {
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (target) {
      setMobile(target.mobile || "");
      setEmail(target.email || "");
      setReason("");
      setError(null);
    }
  }, [target]);

  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  const hasValidMobile = cleanMobile.length === 10;
  const cleanEmail = email.trim().toLowerCase();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const isValid = hasValidMobile || hasValidEmail;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    if (!isValid) {
      setError("Please provide at least a valid 10-digit mobile number OR a valid email address.");
      return;
    }

    if (mobile && !hasValidMobile) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (email && !hasValidEmail) {
      setError("Please enter a valid email format.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await updateCertificateContact({
        kind: target.kind,
        certId: target.id,
        mobile: cleanMobile,
        email: cleanEmail,
        reason: reason.trim() || "Administrative correction of contact details",
        actorEmail,
      });

      toast.success(res.message || "Contact details successfully updated!");
      onSuccess?.({
        id: target.id,
        mobile: cleanMobile,
        email: cleanEmail,
      });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Modify contact error:", err);
      setError(err.message || "Failed to update contact details");
      toast.error(err.message || "Failed to update contact details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Smartphone size={18} className="text-primary" />
            <span>Modify Application Contact Info</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update the contact phone number and/or email for this certificate. All modifications are logged in the administrative audit register.
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border/60 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applicant:</span>
              <span className="font-semibold text-foreground">{target.applicant_name || "—"}</span>
            </div>
            {target.memo_no && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Memo No:</span>
                <span className="font-mono text-foreground">{target.memo_no}</span>
              </div>
            )}
            {target.verification_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verification ID:</span>
                <span className="font-mono text-primary">{target.verification_id}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium uppercase text-muted-foreground">{target.kind} certificate</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contact-modal-mobile" className="text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone size={13} /> Mobile Number / মোবাইল
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {hasValidMobile ? (
                  <span className="text-emerald-600 font-medium">✅ Valid (10 digits)</span>
                ) : hasValidEmail ? (
                  "(Optional)"
                ) : (
                  <span className="text-amber-600 font-medium">(Mandatory if no email)</span>
                )}
              </span>
            </Label>
            <Input
              id="contact-modal-mobile"
              inputMode="numeric"
              maxLength={10}
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-modal-email" className="text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail size={13} /> Email Address / ইমেল
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {hasValidEmail ? (
                  <span className="text-emerald-600 font-medium">✅ Valid email</span>
                ) : hasValidMobile ? (
                  "(Optional)"
                ) : (
                  <span className="text-amber-600 font-medium">(Mandatory if no mobile)</span>
                )}
              </span>
            </Label>
            <Input
              id="contact-modal-email"
              type="email"
              placeholder="citizen@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-modal-reason" className="text-xs">
              Reason for Modification / পরিবর্তনের কারণ <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="contact-modal-reason"
              rows={2}
              placeholder="e.g. Citizen lost SIM card, updated to active communication number."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-blue-50/50 dark:bg-blue-950/20 p-2.5 rounded-lg border border-blue-200/50">
            <ShieldCheck size={14} className="text-primary shrink-0" />
            <span>DPDP Compliance: Modifying contact details retains historical version logs in the audit trail.</span>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving || !isValid}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="mr-1.5 animate-spin" /> Saving...
                </>
              ) : (
                "Save & Log Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
