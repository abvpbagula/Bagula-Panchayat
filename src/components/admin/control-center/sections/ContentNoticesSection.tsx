import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Pin, Plus, Trash2, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { useAuthz } from "@/lib/permissions";

interface NoticeRecord {
  id: string;
  notice_no?: string;
  title: string;
  category: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  is_published: boolean;
  published_at: string;
  expiry_date?: string;
}

export const ContentNoticesSection: React.FC = () => {
  const authz = useAuthz();
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    notice_no: "",
    category: "general",
    content: "",
    priority: "normal",
    is_pinned: false,
    is_published: true,
  });

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notices" as any)
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (error) throw error;
      setNotices((data as any) || []);
    } catch (err: any) {
      toast.error("Failed to load notices: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async () => {
    if (!(form.title ?? "").trim() || !(form.content ?? "").trim()) {
      toast.error("Notice title and content are mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("notices" as any).insert({
        title: (form.title ?? "").trim(),
        notice_no: (form.notice_no ?? "").trim() || `B2/NOT/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        category: form.category,
        content: (form.content ?? "").trim(),
        priority: form.priority,
        is_pinned: form.is_pinned,
        is_published: form.is_published,
        published_at: new Date().toISOString(),
        created_by_name: authz.email || "Super Admin",
      });

      if (error) throw error;

      toast.success("Official notice published.");
      setDialogOpen(false);
      setForm({
        title: "",
        notice_no: "",
        category: "general",
        content: "",
        priority: "normal",
        is_pinned: false,
        is_published: true,
      });
      fetchNotices();
    } catch (err: any) {
      toast.error("Failed to publish notice: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("notices" as any)
        .update({ is_pinned: !current })
        .eq("id", id);
      if (error) throw error;
      toast.success(!current ? "Notice pinned to top." : "Notice unpinned.");
      fetchNotices();
    } catch (err: any) {
      toast.error("Failed to update notice: " + err.message);
    }
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("notices" as any)
        .update({ is_published: !current })
        .eq("id", id);
      if (error) throw error;
      toast.success(!current ? "Notice published." : "Notice archived to drafts.");
      fetchNotices();
    } catch (err: any) {
      toast.error("Failed to update notice: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notices" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Notice deleted.");
      fetchNotices();
    } catch (err: any) {
      toast.error("Failed to delete notice: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xs border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span>Official Notices & Citizen Orders ({notices.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Publish gazette notifications, holiday rosters, tender advertisements, and service circulars.
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="text-xs h-8 gap-1">
            <Plus className="h-3.5 w-3.5" /> Publish New Notice
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {notices.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No official notices registered. Click "Publish New Notice" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-lg border bg-card text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                    n.is_pinned ? "border-primary/60 bg-primary/[0.02]" : ""
                  }`}
                >
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {n.is_pinned && (
                        <Badge variant="default" className="text-[9px] gap-1 bg-amber-600">
                          <Pin className="h-2.5 w-2.5" /> Pinned
                        </Badge>
                      )}
                      <span className="font-semibold text-foreground text-sm">{n.title}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono">
                        {n.category}
                      </Badge>
                      <Badge
                        variant={n.priority === "urgent" ? "destructive" : "secondary"}
                        className="text-[9px] uppercase font-mono"
                      >
                        {n.priority}
                      </Badge>
                      {n.notice_no && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Ref: {n.notice_no}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.content}
                    </p>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-3">
                      <span>Published: {new Date(n.published_at).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      variant={n.is_pinned ? "default" : "outline"}
                      size="sm"
                      className="text-[11px] h-7 gap-1"
                      onClick={() => handleTogglePin(n.id, n.is_pinned)}
                    >
                      <Pin className="h-3 w-3" /> {n.is_pinned ? "Pinned" : "Pin"}
                    </Button>

                    <div className="flex items-center gap-1.5 ml-1">
                      <Switch
                        checked={n.is_published}
                        onCheckedChange={() => handleTogglePublish(n.id, n.is_published)}
                      />
                      <span className="text-[11px] w-12">{n.is_published ? "Live" : "Draft"}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Notice Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Publish Official Gram Panchayat Notice</DialogTitle>
            <DialogDescription className="text-xs">
              Enters a validated record into the public notices gazette and triggers RSS citizen feeds.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div className="space-y-1">
              <Label className="text-xs">Notice Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Schedule of Field Inquiries for Hanskhali Mauza"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Notice / Memo Reference Number</Label>
                <Input
                  value={form.notice_no}
                  onChange={(e) => setForm({ ...form, notice_no: e.target.value })}
                  placeholder="e.g. B2/NOT/2026/042"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Administrative</SelectItem>
                    <SelectItem value="birth_death">Birth & Death Registrations</SelectItem>
                    <SelectItem value="tenders">Tenders & Auctions</SelectItem>
                    <SelectItem value="meetings">Gram Sabha Meetings</SelectItem>
                    <SelectItem value="schemes">Government Welfare Schemes</SelectItem>
                    <SelectItem value="emergency">Emergency / Weather Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Full Notice Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write the full statutory text, terms, or instructions for the citizens..."
                className="text-xs h-28"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(val) => setForm({ ...form, priority: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-2 rounded-md border text-xs self-end">
                <div>
                  <div className="font-medium">Pin to Top</div>
                  <div className="text-[10px] text-muted-foreground">Sticks to head of list</div>
                </div>
                <Switch
                  checked={form.is_pinned}
                  onCheckedChange={(c) => setForm({ ...form, is_pinned: c })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateNotice} disabled={submitting} className="text-xs">
              {submitting ? "Publishing..." : "Publish Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
