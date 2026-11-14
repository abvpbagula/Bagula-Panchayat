import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthz } from "@/lib/permissions";
import {
  CertificateKind,
  CertificateTemplateConfig,
  DEFAULT_TEMPLATE_CONFIGS,
} from "@/core/certificateTemplateTypes";
import { getActiveTemplate } from "@/core/certificateTemplateService";
import { generateCertificatePdf } from "@/core/certificatePrintEngine";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sliders,
  FileCheck2,
  FileText,
  Printer,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  History,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminCertificateTemplates() {
  const navigate = useNavigate();
  const authz = useAuthz();
  const [loading, setLoading] = useState<boolean>(true);
  const [templates, setTemplates] = useState<Record<CertificateKind, CertificateTemplateConfig>>({
    warish: DEFAULT_TEMPLATE_CONFIGS.warish,
    dependent: DEFAULT_TEMPLATE_CONFIGS.dependent,
    linkage: DEFAULT_TEMPLATE_CONFIGS.linkage,
  });

  const isSuperAdmin = authz.isSuperAdmin;
  const isDeo = authz.isDeo;

  const canAccessKind = (kind: CertificateKind): boolean => {
    if (isSuperAdmin) return true;
    if (isDeo) {
      if (!authz.serviceScope || authz.serviceScope.includes("all")) return true;
      return authz.serviceScope.includes(kind);
    }
    return false;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [w, d, l] = await Promise.all([
          getActiveTemplate("warish"),
          getActiveTemplate("dependent"),
          getActiveTemplate("linkage"),
        ]);
        if (active) {
          setTemplates({ warish: w, dependent: d, linkage: l });
        }
      } catch (e) {
        console.error("Failed to load active templates:", e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (authz.loading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-600">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading Certificate Template Registry...</span>
      </div>
    );
  }

  if (!authz.role || (!isSuperAdmin && !isDeo)) {
    return (
      <div className="container max-w-lg mx-auto py-16 px-4 text-center">
        <ShieldAlert size={48} className="mx-auto text-rose-500 mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Access Restricted</h2>
        <p className="text-sm text-slate-600 mb-4">
          Certificate template management is reserved exclusively for authorized Gram Panchayat administrative
          personnel.
        </p>
        <BackButton fallbackUrl="/admin/dashboard" label="Back to Dashboard" />
      </div>
    );
  }

  const items: {
    kind: CertificateKind;
    title: string;
    description: string;
    icon: string;
    color: string;
  }[] = [
    {
      kind: "warish",
      title: "Warish Certificate",
      description: "Official legal heir declaration layout, succession hierarchy table, and Panchayati Raj stamps.",
      icon: "📜",
      color: "from-blue-600 to-indigo-700",
    },
    {
      kind: "dependent",
      title: "Dependent Certificate",
      description: "Family dependent verification layout, guardian declaration, and Prodhan executive sign-offs.",
      icon: "👨‍👩‍👧‍👦",
      color: "from-emerald-600 to-teal-700",
    },
    {
      kind: "linkage",
      title: "Family Linkage Certificate",
      description: "Ancestral lineage and family relation scrutiny certificate layout and official verification markers.",
      icon: "🔗",
      color: "from-purple-600 to-violet-700",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <BackButton fallbackUrl="/admin/dashboard" label="Back to Dashboard" />
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Certificate Templates & Page Setup
            </h1>
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs font-semibold">
              MS Word Layout Engine
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Configure paper presets (A4, A5, A3, Custom mm), physical portrait/landscape orientation, precise
            millimeter margins, typography, and live print preview for all Gram Panchayat official certificates.
          </p>
        </div>

        <Link to="/admin/templates/designer">
          <Button className="gap-2 font-semibold shadow-sm">
            <Settings2 size={16} />
            <span>Open Template Designer</span>
          </Button>
        </Link>
      </div>

      {/* Feature Highlights / Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            📐
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Measurement Standard</div>
            <div className="text-sm font-bold text-slate-900">Millimeter Precision (mm)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            🔒
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Historical Integrity</div>
            <div className="text-sm font-bold text-slate-900">Immutable Issued Snapshots</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            🖨️
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Print Fidelity</div>
            <div className="text-sm font-bold text-slate-900">Auto Scale & Overflow Safety</div>
          </div>
        </div>
      </div>

      {/* Templates Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => {
          const tpl = templates[item.kind];
          const hasAccess = canAccessKind(item.kind);

          return (
            <div
              key={item.kind}
              className={`bg-white rounded-2xl border shadow-sm flex flex-col justify-between overflow-hidden transition ${
                hasAccess ? "border-slate-200 hover:shadow-md hover:border-slate-300" : "opacity-60 border-slate-200"
              }`}
            >
              <div>
                {/* Card Top Banner */}
                <div className={`p-4 bg-gradient-to-r ${item.color} text-white flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-bold text-base">{item.title}</span>
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white font-mono text-[10px] border-none">
                    v{tpl.version}
                  </Badge>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2 text-xs font-medium text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Paper Preset:</span>
                      <span className="font-bold uppercase font-mono text-slate-900">
                        {tpl.pageSizePreset} ({tpl.pageWidthMm} × {tpl.pageHeightMm} mm)
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Orientation:</span>
                      <span className="font-semibold capitalize text-slate-900">{tpl.orientation}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Margins:</span>
                      <span className="font-mono text-slate-900">
                        T:{tpl.marginTopMm} · B:{tpl.marginBottomMm} · L:{tpl.marginLeftMm} · R:{tpl.marginRightMm} mm
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Scale Mode:</span>
                      <span className="font-mono text-slate-900">
                        {tpl.scaleMode === "fit" ? "Fit to Page" : `${tpl.scalePercent}%`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="text-slate-500">Production Status:</span>
                      {tpl.isActive ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Active
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Draft / Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-0">
                {hasAccess ? (
                  <Button
                    type="button"
                    onClick={() => navigate(`/admin/templates/designer?kind=${item.kind}`)}
                    className="w-full gap-2 font-semibold text-xs h-9 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <span>Edit Layout & Margins</span>
                    <ArrowRight size={14} />
                  </Button>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 font-medium">
                    Restricted by DEO service scope
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security & Immutability Notice */}
      <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 bg-slate-200 rounded-lg text-slate-700 font-bold shrink-0">ℹ️</div>
        <div className="text-xs text-slate-600 leading-relaxed">
          <h4 className="font-bold text-slate-900 mb-1 text-sm">
            Statutory Immutability & Safe Data Binding Guarantee
          </h4>
          <p>
            When a certificate is approved and issued by the Prodhan or reviewing authority, the exact page setup
            configuration (paper size, margins, font sizes, orientation) is permanently archived into that
            certificate's tamper-proof database snapshot. Future changes to active templates will apply strictly to
            subsequent applications, safeguarding archival legal validity.
          </p>
        </div>
      </div>
    </div>
  );
}
