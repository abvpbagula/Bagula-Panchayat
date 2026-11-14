import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, Search, ShieldAlert, KeyRound, ExternalLink, UserPlus, Lock } from "lucide-react";
import { useAuthz, type OfficeRole } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";

interface UserDirectoryRow {
  user_id: string;
  email: string;
  display_name: string | null;
  roles: string[];
  status: string;
  created_at: string;
}

const PROTECTED_EMAILS = new Set(["bagula2nogp111@gmail.com", "nitish374482@gmail.com"]);

export const UsersRolesSection: React.FC = () => {
  const authz = useAuthz();
  const [users, setUsers] = useState<UserDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserDirectoryRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<OfficeRole>("deo");
  const [updating, setUpdating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch user roles
      const { data: rolesData, error: rolesErr } = await supabase
        .from("user_roles" as any)
        .select("user_id, role");

      if (rolesErr) throw rolesErr;

      // 2. Fetch admin profiles
      const { data: profilesData } = await supabase
        .from("admin_profiles" as any)
        .select("user_id, email, display_name, status, created_at");

      // Group roles by user_id
      const rolesMap: { [userId: string]: string[] } = {};
      rolesData?.forEach((r: any) => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role);
      });

      // Build unified list (office accounts only)
      const list: UserDirectoryRow[] = (profilesData || []).map((p: any) => ({
        user_id: p.user_id,
        email: p.email || "No Email",
        display_name: p.display_name,
        roles: (rolesMap[p.user_id] || ["deo"]).filter((r) =>
          ["deo", "admin", "super_admin"].includes(r)
        ),
        status: p.status || "active",
        created_at: p.created_at || new Date().toISOString(),
      }));

      setUsers(list);
    } catch (err: any) {
      toast.error("Failed to load user directory: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenRoleModal = (u: UserDirectoryRow) => {
    setSelectedUser(u);
    setNewRole((u.roles[0] as OfficeRole) || "deo");
    setDialogOpen(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    if (PROTECTED_EMAILS.has(selectedUser.email.toLowerCase()) && newRole !== "super_admin" && newRole !== "admin") {
      toast.error("Constitutional root administrator accounts cannot be demoted.");
      return;
    }

    setUpdating(true);
    try {
      // Add or update role in user_roles
      const { error } = await supabase.from("user_roles" as any).upsert({
        user_id: selectedUser.user_id,
        role: newRole,
      });

      if (error) throw error;

      await logActivity({
        action_type: "user_roles.assigned",
        target_table: "user_roles",
        metadata: {
          target_user_id: selectedUser.user_id,
          target_email: selectedUser.email,
          assigned_role: newRole,
        },
      });

      toast.success(`Role "${newRole}" assigned to ${selectedUser.email}.`);
      setDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error("Failed to assign role: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (roleFilter === "all") return true;
    return u.roles.includes(roleFilter);
  });

  return (
    <div className="space-y-6">
      {/* Security Governance Notice Card */}
      <Card className="shadow-xs border border-primary/20 bg-primary/[0.03]">
        <CardContent className="p-4 flex items-start gap-3 text-xs">
          <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Security Governance & Non-Bypass Principles
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Super Admin authority allows assigning governance roles and scopes, but
              <strong className="text-foreground"> CANNOT</strong> inspect plaintext passwords, view OTP codes, or bypass backend row-level security.
              All credentials remain salted and hashed at rest. Account recoveries must be sent directly to user mailboxes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Directory Card */}
      <Card className="shadow-xs border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Governance Users & Roles Directory ({users.length})</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage roles across DEOs, Admins, and Super Admins only.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/admin/admins">
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                  Manage Staff <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search user by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Office Roles</SelectItem>
                <SelectItem value="super_admin">Super Admins</SelectItem>
                <SelectItem value="admin">Panchayat Admins</SelectItem>
                <SelectItem value="deo">Data Entry Operators (DEO)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No users match your search query.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => {
                const isProtected = PROTECTED_EMAILS.has(u.email.toLowerCase());
                return (
                  <div
                    key={u.user_id}
                    className="p-3 rounded-lg border bg-card text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{u.email}</span>
                        {isProtected && (
                          <Badge variant="outline" className="text-[9px] font-mono text-primary border-primary/40">
                            Root Protected
                          </Badge>
                        )}
                        <div className="flex items-center gap-1">
                          {u.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={r === "super_admin" ? "default" : r === "admin" ? "secondary" : "outline"}
                              className="text-[9px] uppercase font-mono"
                            >
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {u.display_name ? `Name: ${u.display_name} | ` : ""}Status: {u.status} | Joined: {new Date(u.created_at).toLocaleDateString("en-IN")}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => handleOpenRoleModal(u)}
                      >
                        Change Role
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Update User Governance Role</DialogTitle>
            <DialogDescription className="text-xs">
              Assign administrative or operational scope for {selectedUser?.email}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div className="space-y-1">
              <span className="text-muted-foreground">Selected User:</span>
              <div className="font-semibold text-foreground">{selectedUser?.email}</div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium">Select Official Role:</span>
              <Select value={newRole} onValueChange={(val: any) => setNewRole(val)}>
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
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button size="sm" onClick={handleAssignRole} disabled={updating} className="text-xs">
              {updating ? "Updating..." : "Save Role Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
