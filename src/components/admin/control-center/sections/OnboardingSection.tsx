import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { validatePassword } from "@/lib/passwordPolicy";
import { PasswordRequirementsIndicator } from "@/components/PasswordRequirementsIndicator";
import { logActivity } from "@/lib/activityLog";
import { UserPlus, ShieldCheck, KeyRound, Copy, Check, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { useAuthz, type OfficeRole } from "@/lib/permissions";
import { DESIGNATION_LABEL, type OfficeDesignation } from "@/modules/office/permissions";

export const OnboardingSection: React.FC = () => {
  const authz = useAuthz();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<OfficeRole>("deo");
  const [designation, setDesignation] = useState<OfficeDesignation>("deo");
  const [tempPassword, setTempPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdCredential, setCreatedCredential] = useState<{ email: string; pass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSecureTempPass = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
    let pass = "Bg2#";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (email ?? "").trim();
    const cleanPass = (tempPassword ?? "").trim();
    const cleanName = (displayName ?? "").trim();

    if (!cleanEmail || !cleanPass) {
      toast.error("Email and temporary password are required.");
      return;
    }

    const check = validatePassword(cleanPass);
    if (!check.isValid) {
      toast.error("Temporary password does not satisfy government complexity criteria.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Check if user already exists or call edge function / create user
      // Create user via standard supabase admin RPC or signup with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            display_name: cleanName || cleanEmail.split("@")[0],
            role,
            designation,
            must_change_password: true,
          },
        },
      });

      if (authError) {
        // If already registered, alert admin
        throw authError;
      }

      const userId = authData.user?.id;
      if (userId) {
        // Insert role
        await supabase.from("user_roles" as any).upsert({
          user_id: userId,
          role,
        });

        // Insert profile
        await supabase.from("admin_profiles" as any).upsert({
          user_id: userId,
          email: cleanEmail,
          display_name: cleanName || cleanEmail.split("@")[0],
          status: "active",
          designation,
          service_scope: ["warish", "dependent", "linkage"],
        });
      }

      await logActivity({
        action_type: "official.onboarded",
        target_table: "admin_profiles",
        metadata: {
          email: cleanEmail,
          role,
          designation,
          onboarded_by: authz.email,
        },
      });

      setCreatedCredential({ email: cleanEmail, pass: cleanPass });
      toast.success(`Official account created for ${cleanEmail}. Share credentials securely.`);
      setEmail("");
      setDisplayName("");
      setTempPassword("");
    } catch (err: any) {
      toast.error("Failed to onboard official: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (createdCredential) {
      navigator.clipboard.writeText(`Bagula 2 No Gram Panchayat Official Login\nPortal: /admin/auth\nEmail: ${createdCredential.email}\nTemporary Password: ${createdCredential.pass}\nNotice: You must change your password upon first login within 3 hours.`);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      toast.success("Credentials copied to clipboard.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 3-Hour Expiry Governance Policy Card */}
      <Card className="shadow-xs border border-amber-300/40 bg-amber-50/10">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Official Temporary Credentials Policy (3-Hour Window)
            </div>
            <p className="text-muted-foreground leading-relaxed">
              When a new Gram Panchayat officer or DEO is onboarded, initial temporary credentials must be shared securely via official letter or encrypted channel.
              Upon first sign-in, the system strictly forces an immediate mandatory password change before granting access to application records.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Form */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <span>Onboard New Panchayat Official or Data Entry Operator</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Provisions a validated government employee account with designation and access controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleOnboard} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Official Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. deo.rahul@bagula2gp.gov.in"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Full Officer Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Rahul Mondal"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">System Role</Label>
                <Select value={role} onValueChange={(val: any) => setRole(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deo">Data Entry Operator (DEO Intake)</SelectItem>
                    <SelectItem value="admin">Panchayat Admin (Scrutiny & Review)</SelectItem>
                    <SelectItem value="super_admin">Super Admin (System Governance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Official Designation</Label>
                <Select value={designation} onValueChange={(val: any) => setDesignation(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DESIGNATION_LABEL).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Initial Temporary Password</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateSecureTempPass}
                  className="text-xs h-7 gap-1 text-primary"
                >
                  <KeyRound className="h-3 w-3" /> Auto-Generate Secure
                </Button>
              </div>
              <Input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="Minimum 8 characters with numbers, lowercase, and symbols"
                className="text-xs font-mono"
                required
              />
              {tempPassword && (
                <div className="pt-1">
                  <PasswordRequirementsIndicator password={tempPassword} />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link to="/admin/admins">
                <Button type="button" variant="outline" size="sm" className="text-xs gap-1">
                  View Staff Directory <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
              <Button type="submit" size="sm" disabled={submitting} className="text-xs gap-1.5">
                <UserPlus className="h-3.5 w-3.5" /> {submitting ? "Provisioning..." : "Provision Account"}
              </Button>
            </div>
          </form>

          {/* Credential Generated Box */}
          {createdCredential && (
            <div className="mt-5 p-4 rounded-lg border border-emerald-500/40 bg-emerald-50/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-xs text-foreground">One-Time Temporary Credential</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs h-7 gap-1"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy Credentials"}
                </Button>
              </div>
              <div className="p-2.5 rounded bg-muted/50 text-xs font-mono space-y-1">
                <div>Email: <strong className="text-foreground">{createdCredential.email}</strong></div>
                <div>Password: <strong className="text-foreground">{createdCredential.pass}</strong></div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Notice: Save this password immediately. For zero-knowledge protection, it is never stored in plaintext and will not be displayed again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
