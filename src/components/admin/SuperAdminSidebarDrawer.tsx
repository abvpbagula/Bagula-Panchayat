import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Search,
  ClipboardCheck,
  SlidersHorizontal,
  Users,
  Database,
  Bell,
  UserCog,
  Activity,
  ShieldAlert,
  TrendingUp,
  FileCheck2,
  FileText,
  Baby,
  Stamp,
  FolderArchive,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  id: string;
  title: string;
  titleBn: string;
  to: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "default" | "outline" | "destructive" | "secondary";
  superAdminOnly?: boolean;
}

interface NavCategory {
  category: string;
  categoryBn: string;
  items: NavItem[];
}

interface SuperAdminSidebarDrawerProps {
  pendingCount?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: React.ReactNode;
}

export function SuperAdminSidebarDrawer({
  pendingCount = 0,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  triggerButton,
}: SuperAdminSidebarDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const categories: NavCategory[] = useMemo(
    () => [
      {
        category: "Review & Verification",
        categoryBn: "আবেদন ও পর্যালোচনা",
        items: [
          {
            id: "review-all",
            title: "Review Applications",
            titleBn: "সকল অপেক্ষমাণ আবেদন পর্যালোচনা",
            to: "/admin/review",
            icon: ClipboardCheck,
            badge: pendingCount > 0 ? `${pendingCount} Pending` : undefined,
            badgeVariant: pendingCount > 0 ? "destructive" : "secondary",
          },
          {
            id: "review-warish",
            title: "Warish Certificates Review",
            titleBn: "ওয়ারিশ সনদ পর্যালোচনা ও অনুমোদন",
            to: "/admin/review?kind=warish&filter=waiting",
            icon: Stamp,
          },
          {
            id: "review-dependent",
            title: "Dependent Certificates Review",
            titleBn: "পোষ্য সনদ পর্যালোচনা ও অনুমোদন",
            to: "/admin/review?kind=dependent&filter=waiting",
            icon: FileCheck2,
          },
          {
            id: "birth-digitization",
            title: "Legacy Birth Digitization",
            titleBn: "পুরোনো জন্ম নথি ডিজিটাইজেশন",
            to: "/birth-digitization-form",
            icon: Baby,
          },
          {
            id: "delayed-reg",
            title: "Delayed Registration Portal",
            titleBn: "বিলম্বিত জন্ম/মৃত্যু নিবন্ধন",
            to: "/delayed-registration-form",
            icon: Clock,
          },
        ],
      },
      {
        category: "Page Setup & Templates",
        categoryBn: "পেজ সেটআপ ও টেমপ্লেট",
        items: [
          {
            id: "page-setup",
            title: "Page Setup & Certificate Templates",
            titleBn: "পেজ সেটআপ ও সার্টিফিকেট ফরম্যাট",
            to: "/admin/templates",
            icon: SlidersHorizontal,
            superAdminOnly: true,
          },
          {
            id: "template-designer",
            title: "Visual Template Designer",
            titleBn: "ভিজ্যুয়াল সার্টিফিকেট ডিজাইনার",
            to: "/admin/templates/designer",
            icon: Layers,
            superAdminOnly: true,
          },
          {
            id: "portal-controls",
            title: "Portal Branding & Controls",
            titleBn: "পোর্টাল ব্রান্ডিং ও কনফিগারেশন",
            to: "/admin/portal-controls",
            icon: Sparkles,
            superAdminOnly: true,
          },
          {
            id: "digitalization-settings",
            title: "Digitalization Settings",
            titleBn: "ডিজিটাইজেশন ও সিস্টেম সেটিংস",
            to: "/admin/digitalization-settings",
            icon: UserCog,
            superAdminOnly: true,
          },
        ],
      },
      {
        category: "Employees & Access Control",
        categoryBn: "কর্মী ও ভূমিকা ব্যবস্থাপনা",
        items: [
          {
            id: "employees",
            title: "Employee Directory & Staff",
            titleBn: "কর্মচারী ও কর্মকর্তা ব্যবস্থাপনা",
            to: "/admin/employees",
            icon: Users,
            superAdminOnly: true,
          },
          {
            id: "admin-roles",
            title: "Admin & Roles Management",
            titleBn: "অ্যাডমিন ও সুপার অ্যাডমিন ভূমিকা",
            to: "/admin/manage",
            icon: ShieldCheck,
            superAdminOnly: true,
          },
          {
            id: "deo-quotas",
            title: "DEO Quotas & Tier Limits",
            titleBn: "ডিইও কোটা ও পারমিশন টিয়ার",
            to: "/admin/deo-quotas",
            icon: Activity,
          },
          {
            id: "profiles-directory",
            title: "DEO Quotas & Directory",
            titleBn: "ডিইও কোটা ও তালিকা",
            to: "/admin/profiles-directory",
            icon: FileText,
          },
        ],
      },
      {
        category: "Master Data & Governance",
        categoryBn: "মাস্টার ডাটা ও শাসন",
        items: [
          {
            id: "master-data",
            title: "Master Data Management",
            titleBn: "গ্রাম ও ওয়ার্ড মাস্টার ডাটা",
            to: "/admin/master-data",
            icon: Database,
            superAdminOnly: true,
          },
          {
            id: "control-center",
            title: "Super Admin Control Center",
            titleBn: "সুপার অ্যাডমিন গভর্নেন্স সেন্টার",
            to: "/admin/control-center",
            icon: SlidersHorizontal,
            superAdminOnly: true,
            badge: "Master Hub",
            badgeVariant: "default",
          },
          {
            id: "notices",
            title: "Public Notices & Announcements",
            titleBn: "জরুরি নোটিশ ও প্রজ্ঞাপন",
            to: "/admin/notices",
            icon: Bell,
          },
          {
            id: "activity-logs",
            title: "Audit & Activity Logs",
            titleBn: "অডিট ও নিরাপত্তা লগ",
            to: "/admin/activity",
            icon: ShieldAlert,
            superAdminOnly: true,
          },
        ],
      },
      {
        category: "Diagnostics & System Health",
        categoryBn: "ডায়াগনস্টিকস ও সিস্টেম হেলথ",
        items: [
          {
            id: "system-status",
            title: "System Status & Telemetry",
            titleBn: "সিস্টেম স্ট্যাটাস ও সার্ভার হেলথ",
            to: "/admin/system-status",
            icon: Activity,
            superAdminOnly: true,
          },
          {
            id: "diagnostics",
            title: "Diagnostics & Security Monitor",
            titleBn: "ডায়াগনস্টিকস ও নিরাপত্তা স্ক্যান",
            to: "/admin/diagnostics",
            icon: ShieldAlert,
            superAdminOnly: true,
          },
          {
            id: "analytics",
            title: "Analytics & Telemetry Dashboard",
            titleBn: "এক্সিকিউটিভ অ্যানালিটিক্স ও মেট্রিক্স",
            to: "/admin/analytics",
            icon: TrendingUp,
          },
          {
            id: "backups",
            title: "Database Backups & Schema",
            titleBn: "ডাটাবেস ব্যাকআপ ও স্ন্যাপশট",
            to: "/admin/backups",
            icon: Database,
            superAdminOnly: true,
          },
        ],
      },
    ],
    [pendingCount]
  );

  // Filter items according to search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.titleBn.toLowerCase().includes(q) ||
            item.to.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery]);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      {triggerButton ? (
        <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      ) : (
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3 gap-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent hover:from-primary/15 border-primary/30 text-primary font-bold shadow-xs rounded-xl"
            title="Open Super Admin Navigation Sidebar"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">সুপার অ্যাডমিন কন্ট্রোল সাইডবার</span>
            <span className="sm:hidden">সাইডবার</span>
            <Badge
              variant="outline"
              className="bg-primary text-white border-0 text-[10px] px-1.5 py-0 font-mono"
            >
              22
            </Badge>
          </Button>
        </SheetTrigger>
      )}

      <SheetContent
        side="left"
        className="w-[90vw] sm:max-w-md p-0 flex flex-col bg-slate-50/95 backdrop-blur-xl border-r border-border/60"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border/40 bg-white/90">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-foreground leading-tight">
                  Super Admin Control Hub
                </SheetTitle>
                <p className="text-xs text-muted-foreground">
                  বগুলা ২ নং গ্রাম পঞ্চায়েত • সমস্ত মডিউল নেভিগেশন
                </p>
              </div>
            </div>
          </div>

          {/* Quick Search inside Sidebar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খুঁজুন... (e.g. Review, Master Data, Employees)"
              className="pl-9 h-9 text-xs bg-slate-50 border-border/60 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {filteredCategories.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {cat.categoryBn}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    {cat.category}
                  </span>
                </div>

                <div className="space-y-1 bg-white/70 rounded-2xl p-1.5 border border-border/40 shadow-2xs">
                  {cat.items.map((item) => {
                    const isActive = location.pathname === item.to;
                    const Icon = item.icon;

                    return (
                      <SheetClose asChild key={item.id}>
                        <Link
                          to={item.to}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition-all text-xs group ${
                            isActive
                              ? "bg-primary text-white font-semibold shadow-xs"
                              : "hover:bg-slate-100 text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isActive
                                  ? "bg-white/20 text-white"
                                  : "bg-primary/10 text-primary group-hover:scale-105 transition-transform"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold truncate">{item.title}</p>
                              <p
                                className={`text-[10px] truncate ${
                                  isActive ? "text-white/80" : "text-muted-foreground"
                                }`}
                              >
                                {item.titleBn}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {item.badge && (
                              <Badge
                                variant={isActive ? "secondary" : item.badgeVariant || "outline"}
                                className={`text-[10px] font-mono px-1.5 py-0 ${
                                  isActive ? "bg-white text-primary font-bold" : ""
                                }`}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            <ChevronRight
                              className={`w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all ${
                                isActive ? "text-white" : ""
                              }`}
                            />
                          </div>
                        </Link>
                      </SheetClose>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground">
                <p>"{searchQuery}" এর জন্য কোনো অপশন পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Drawer Bottom Quick Action Bar */}
        <div className="p-3 border-t border-border/40 bg-white/95 flex items-center justify-between gap-2">
          <SheetClose asChild>
            <Button
              asChild
              variant="default"
              size="sm"
              className="w-full text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
            >
              <Link to="/admin/control-center">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Launch Full Control Center</span>
              </Link>
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
