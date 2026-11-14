import React from "react";
import { Link } from "react-router-dom";
import {
  FilePlus2,
  Baby,
  Users2,
  Clock,
  Search,
  Bell,
  Zap,
  ArrowRight,
  Stamp,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminQuickFormShortcutsProps {
  onOpenSidebar?: () => void;
  isSuperAdmin?: boolean;
}

export function AdminQuickFormShortcuts({
  onOpenSidebar,
  isSuperAdmin = false,
}: AdminQuickFormShortcutsProps) {
  const formShortcuts = [
    {
      id: "new-warish",
      label: "Issue New Warish",
      labelBn: "নতুন ওয়ারিশ সনদ",
      desc: "উত্তরাধিকার সনদ আবেদন ও এন্ট্রি",
      to: "/warish-application-form",
      icon: Stamp,
      color: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100/80 hover:border-sky-300",
      iconBg: "bg-sky-500/15 text-sky-700",
      badge: "জনপ্রিয়",
    },
    {
      id: "birth-entry",
      label: "Add Birth Entry",
      labelBn: "জন্ম নথিভুক্তকরণ",
      desc: "লেগ্যাসি ও নতুন জন্ম রেকর্ড ডিজিটাইজেশন",
      to: "/birth-digitization-form",
      icon: Baby,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80 hover:border-emerald-300",
      iconBg: "bg-emerald-500/15 text-emerald-700",
      badge: "ডিজিটাইজেশন",
    },
    {
      id: "dependent-cert",
      label: "Issue Dependent Certificate",
      labelBn: "পোষ্য প্রত্যয়ন সনদ",
      desc: "পরিবার পোষ্য সনদপত্র তৈরি",
      to: "/dependent-certificate",
      icon: Users2,
      color: "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100/80 hover:border-violet-300",
      iconBg: "bg-violet-500/15 text-violet-700",
    },
    {
      id: "delayed-reg",
      label: "Delayed Registration",
      labelBn: "বিলম্বিত নিবন্ধন ফরম",
      desc: "দেরিতে হওয়া জন্ম/মৃত্যু নিবন্ধন",
      to: "/delayed-registration-form",
      icon: Clock,
      color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80 hover:border-amber-300",
      iconBg: "bg-amber-500/15 text-amber-700",
    },
    {
      id: "verify-cert",
      label: "Verify & Search Certificate",
      labelBn: "সনদ যাচাই ও অনুসন্ধান",
      desc: "মেমো বা কিউআর কোড স্ক্যান করে তথ্য যাচাই",
      to: "/verify",
      icon: Search,
      color: "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300",
      iconBg: "bg-slate-500/15 text-slate-700",
    },
    {
      id: "post-notice",
      label: "Publish Public Notice",
      labelBn: "নোটিশ ও প্রজ্ঞাপন",
      desc: "গ্রামবাসীর জন্য নতুন নোটিশ জারি",
      to: "/admin/notices",
      icon: Bell,
      color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80 hover:border-rose-300",
      iconBg: "bg-rose-500/15 text-rose-700",
    },
  ];

  return (
    <section className="rounded-3xl border border-border/50 bg-white/95 backdrop-blur-md p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              ⚡ Quick Actions (সাধারণ ফরম শর্টকাট)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            নিয়মিত ব্যবহৃত সনদ ফরম ও ডিজিটাইজেশন এন্ট্রির সরাসরি অ্যাকশন বাটন
          </p>
        </div>

        {onOpenSidebar && isSuperAdmin && (
          <Button
            type="button"
            onClick={onOpenSidebar}
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-xs font-bold border-primary/30 text-primary hover:bg-primary/5 rounded-xl shadow-xs self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>সমস্ত অপশন সাইডবার খুলুন</span>
            <Badge variant="outline" className="bg-primary text-white border-0 text-[10px] px-1.5 py-0 font-mono">
              22
            </Badge>
          </Button>
        )}
      </div>

      {/* Grid of Shortcut Buttons to commonly used forms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {formShortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-start gap-3 group shadow-2xs hover:shadow-sm hover:-translate-y-0.5 ${item.color}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${item.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.label}
                  </h4>
                  {item.badge && (
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 bg-white font-medium shrink-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-primary/80 truncate">
                  {item.labelBn}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {item.desc}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
