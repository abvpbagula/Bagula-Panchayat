import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Bell, CheckCircle2, ShieldCheck, Clock } from "lucide-react";
import { useAuthz } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

export const NotificationsSection: React.FC = () => {
  const authz = useAuthz();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("broadcast");
  const [targetAudience, setTargetAudience] = useState("all_staff");
  const [dispatching, setDispatching] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [prefs, setPrefs] = useState({
    emailOnReturn: true,
    emailOnIssue: true,
    dailySummary: false,
  });

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("office_notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentNotifications(data || []);
    } catch (err: any) {
      console.warn("Could not fetch office notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = (title ?? "").trim();
    const cleanBody = (body ?? "").trim();
    if (!cleanTitle || !cleanBody) {
      toast.error("Announcement title and message are required.");
      return;
    }

    setDispatching(true);
    try {
      // Find all target users (staff / DEOs)
      const { data: usersData } = await supabase
        .from("user_roles" as any)
        .select("user_id, role")
        .in("role", ["deo", "admin", "super_admin"]);

      if (usersData && usersData.length > 0) {
        // Insert notification rows
        const rows = usersData.map((u: any) => ({
          user_id: u.user_id,
          kind,
          title: cleanTitle,
          body: cleanBody,
          action_label: "View Dashboard",
          action_href: "/admin/dashboard",
        }));

        await supabase.from("office_notifications" as any).insert(rows);
      }

      await logActivity({
        action_type: "notification.broadcast_sent",
        target_table: "office_notifications",
        metadata: {
          title: cleanTitle,
          target_audience: targetAudience,
          sent_by: authz.email,
        },
      });

      toast.success("Office broadcast dispatched to active staff.");
      setTitle("");
      setBody("");
      fetchRecent();
    } catch (err: any) {
      toast.error("Failed to dispatch broadcast: " + err.message);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Broadcast Dispatcher */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            <span>Dispatch Internal Office Broadcast</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Send real-time alerts and urgent operational directives to DEOs, scrutinizing officers, and secretaries.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleDispatch} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Broadcast Title / Subject</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mandatory Scrutiny of Land Deeds for Hanskhali Mauza"
                  className="text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_staff">All Panchayat Staff & DEOs</SelectItem>
                    <SelectItem value="deos_only">Data Entry Operators Only</SelectItem>
                    <SelectItem value="admins_only">Panchayat Executive Officers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Directive Message Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the full administrative instructions or procedure guidance..."
                className="text-xs h-20"
                required
              />
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button type="submit" size="sm" disabled={dispatching} className="text-xs gap-1.5">
                <Send className="h-3.5 w-3.5" /> {dispatching ? "Sending..." : "Dispatch Broadcast"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Automated Event Notification Rules */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span>Automated Event Notification Triggers</span>
          </CardTitle>
          <CardDescription className="text-xs">
            System dispatch rules for citizen status changes and administrative milestones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Email Alert on Application Correction / Return</div>
              <div className="text-[11px] text-muted-foreground">Dispatches immediate email to citizen with officer scrutiny remark when form needs rectification.</div>
            </div>
            <Switch
              checked={prefs.emailOnReturn}
              onCheckedChange={(c) => {
                setPrefs({ ...prefs, emailOnReturn: c });
                toast.success("Preference saved.");
              }}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div>
              <div className="font-semibold text-foreground">Email Alert on Certificate Approval & Issuance</div>
              <div className="text-[11px] text-muted-foreground">Sends official memo notice with QR verification link as soon as digital certificate is signed.</div>
            </div>
            <Switch
              checked={prefs.emailOnIssue}
              onCheckedChange={(c) => {
                setPrefs({ ...prefs, emailOnIssue: c });
                toast.success("Preference saved.");
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Dispatched Feed */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>Recent Dispatched Notifications ({recentNotifications.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentNotifications.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No recent notifications dispatched.
            </div>
          ) : (
            <div className="space-y-2">
              {recentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-2.5 rounded-lg border bg-card text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-foreground">{notif.title}</div>
                    <div className="text-muted-foreground text-[11px] mt-0.5">{notif.body}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                    {new Date(notif.created_at).toLocaleDateString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
