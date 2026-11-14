import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  type AuthenticationSettings,
  useAuthenticationSettings,
  saveAuthenticationSettings,
} from "@/lib/authenticationSettings";
import { ShieldCheck, Save } from "lucide-react";

export const CitizenAuthSection: React.FC = () => {
  const { settings } = useAuthenticationSettings();
  const [local, setLocal] = useState<AuthenticationSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const nextSettings: AuthenticationSettings = {
      ...local,
      citizen_email_otp_enabled: false,
      citizen_google_enabled: false,
      citizen_password_enabled: false,
      citizen_forgot_password_enabled: false,
    };
    const res = await saveAuthenticationSettings(nextSettings);
    setSaving(false);

    if (res.success) {
      toast.success("Office authentication governance policy saved.");
    } else {
      toast.error(res.error || "Failed to update authentication policy");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xs border border-blue-200 bg-blue-50/40">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-slate-900">
              Office-Only Authentication Architecture
            </div>
            <p className="text-slate-600 leading-relaxed">
              Public service portals are open-access without login gates. Authentication applies strictly to{" "}
              <strong className="text-slate-900">DEO, Admin, and Super Admin</strong> office accounts via{" "}
              <strong className="text-slate-900">Password, Email OTP, or Google SSO</strong>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Office Account Authentication (DEO · Admin · Super Admin)</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Configure allowed authentication channels for authorized Panchayat office personnel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Official Password Login</div>
              <div className="text-[11px] text-muted-foreground">
                Requires strong password complexity and supports rate-limited sign-in for DEO, Admin, and Super Admin accounts.
              </div>
            </div>
            <Switch
              checked={local.official_password_enabled}
              onCheckedChange={(c) => setLocal({ ...local, official_password_enabled: c })}
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Official Google Workspace SSO</div>
              <div className="text-[11px] text-muted-foreground">
                Allows DEOs, Admins, and Super Admins to sign in with authorized Google accounts.
              </div>
            </div>
            <Switch
              checked={local.official_google_enabled}
              onCheckedChange={(c) => setLocal({ ...local, official_google_enabled: c })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end pt-2">
        <Button size="sm" onClick={handleSave} disabled={saving} className="text-xs gap-1.5 min-h-[40px]">
          <Save className="h-3.5 w-3.5" /> {saving ? "Saving Policy..." : "Save Office Auth Policy"}
        </Button>
      </div>
    </div>
  );
};
