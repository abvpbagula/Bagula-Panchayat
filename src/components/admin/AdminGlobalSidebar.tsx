import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  Database,
  SlidersHorizontal,
  Activity,
  ScrollText,
  FileText,
  Bell,
  Home,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  UserCog,
  Baby,
  ExternalLink,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { useAuthz } from "@/lib/permissions";
import { logActivity } from "@/lib/activityLog";
import { supabase } from "@/integrations/supabase/client";
import { refetchSchemaCache } from "@/lib/adminDatabaseErrorHandler";
import { SignOutConfirmDialog } from "@/components/SignOutConfirmDialog";
import { NotificationCenter } from "@/components/NotificationCenter";

interface AdminGlobalSidebarProps {
  pendingCount?: number;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminGlobalSidebar({
  pendingCount = 0,
  mobileOpen = false,
  onMobileClose,
}: AdminGlobalSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const authz = useAuthz();
  const [collapsed, setCollapsed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  }, [location.pathname, onMobileClose]);

  const handleSyncSchema = async () => {
    setSyncing(true);
    const tId = toast.loading("Synchronizing PostgREST schema cache...");
    const res = await refetchSchemaCache();
    toast.dismiss(tId);
    setSyncing(false);
    if (res.success) {
      toast.success("Database schema cache refreshed!");
    } else {
      toast.error(res.message);
    }
  };

  const handleSignOut = async () => {
    await logActivity({ action_type: "auth.signout" });
    await supabase.auth.signOut();
    navigate("/admin", { replace: true });
  };

  const navItems = [
    {
      title: "Dashboard",
      bengaliTitle: "ড্যাশবোর্ড",
      to: "/admin/dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/admin/dashboard",
    },
    {
      title: "Review Applications",
      bengaliTitle: "আবেদন পর্যালোচনা",
      to: "/admin/review?kind=warish&filter=waiting",
      icon: ClipboardCheck,
      active: location.pathname === "/admin/review",
      badge: pendingCount > 0 ? `${pendingCount}` : undefined,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      title: "Employee Master Data",
      bengaliTitle: "কর্মী ও মাস্টার ডাটা",
      to: "/admin/employees",
      icon: Users,
      active: location.pathname === "/admin/employees" || location.pathname === "/admin/master-data",
      subItems: [
        { title: "Employees & Roles", to: "/admin/employees", icon: Users },
        { title: "Panchayat Master Data", to: "/admin/master-data", icon: Database },
      ],
    },
    {
      title: "Certificate Templates",
      bengaliTitle: "সনদপত্র টেমপ্লেট",
      to: "/admin/templates",
      icon: SlidersHorizontal,
      active: location.pathname.startsWith("/admin/templates"),
    },
    {
      title: "System Status",
      bengaliTitle: "সিস্টেম স্ট্যাটাস",
      to: "/admin/system-status",
      icon: Activity,
      active: location.pathname === "/admin/system-status" || location.pathname === "/admin/diagnostics",
      subItems: [
        { title: "Telemetry & Storage", to: "/admin/system-status", icon: Activity },
        { title: "Security Diagnostics", to: "/admin/diagnostics", icon: ShieldAlert },
      ],
    },
    {
      title: "Warish Register",
      bengaliTitle: "ওয়ারিশ রেজিস্টার",
      to: "/admin/warish",
      icon: ScrollText,
      active: location.pathname.startsWith("/admin/warish") && location.pathname !== "/admin/review",
    },
    {
      title: "Birth Digitization",
      bengaliTitle: "জন্ম ডিজিটাইজেশন",
      to: "/birth-digitization-form",
      icon: Baby,
      active: location.pathname === "/birth-digitization-form",
    },
    {
      title: "Family Tree (বংশতালিকা)",
      bengaliTitle: "বংশতালিকা জেনারেটর",
      to: "/admin/family-tree",
      icon: GitBranch,
      active: location.pathname === "/admin/family-tree" || location.pathname === "/family-tree-generator",
    },
    {
      title: "Public Notices",
      bengaliTitle: "পাবলিক নোটিশ",
      to: "/admin/notices",
      icon: Bell,
      active: location.pathname === "/admin/notices",
    },
  ];

  if (authz.isSuperAdmin) {
    navItems.push({
      title: "Control Center",
      bengaliTitle: "সুপার গভর্ন্যান্স",
      to: "/admin/control-center",
      icon: ShieldCheck,
      active: location.pathname.startsWith("/admin/control-center"),
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-emerald-600 to-teal-700 flex items-center justify-center font-bold text-white shadow-md shrink-0">
            🏛️
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate tracking-tight">
                Bagula 2 No GP
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium truncate">
                {authz.isSuperAdmin ? "Super Admin" : authz.isDeo ? "DEO Desk" : "Admin Desk"}
              </p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white items-center justify-center transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onMobileClose}
          className="md:hidden w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        {!collapsed && (
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Navigation Menu
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.to} className="space-y-0.5">
              <Link
                to={item.to}
                title={collapsed ? `${item.title} (${item.bengaliTitle})` : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  item.active
                    ? "bg-primary text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    item.active ? "text-white" : "text-slate-400 group-hover:text-primary"
                  }`}
                />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${item.badgeColor || "bg-primary/20 text-primary"}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </Link>

              {/* Sub-items for expanded view if active */}
              {!collapsed && item.subItems && item.active && (
                <div className="ml-7 pl-2 border-l border-slate-700 space-y-1 py-1">
                  {item.subItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = location.pathname === sub.to;
                    return (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          isSubActive
                            ? "text-emerald-400 font-bold bg-slate-800"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{sub.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Actions Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90 space-y-2">
        {/* PostgREST Schema Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncSchema}
          disabled={syncing}
          className={`w-full justify-start text-xs rounded-xl bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all ${
            collapsed ? "px-2" : "px-3"
          }`}
          title="Synchronize PostgREST database schema cache"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 text-emerald-400 ${syncing ? "animate-spin" : ""}`} />
          {!collapsed && <span className="ml-2 truncate">{syncing ? "Syncing..." : "Sync Schema"}</span>}
        </Button>

        {/* View Main Site */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className={`w-full justify-start text-xs rounded-xl bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all ${
            collapsed ? "px-2" : "px-3"
          }`}
          title="Return to Public Website"
        >
          <Link to="/">
            <Home className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            {!collapsed && <span className="ml-2 truncate">Main Website</span>}
          </Link>
        </Button>

        {/* User Badge & Sign out */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {authz.email || "Admin"}
              </p>
              <p className="text-[10px] text-slate-400 capitalize">
                {authz.role || "Administrator"}
              </p>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSignOutDialog(true)}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 p-2 h-8 rounded-xl"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <SignOutConfirmDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
        onConfirm={handleSignOut}
        description="Are you sure you want to sign out of the administrative dashboard?"
      />
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 shrink-0 sticky top-0 h-screen z-30 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
