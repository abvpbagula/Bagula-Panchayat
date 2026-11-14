import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  FileText,
  Users,
  Vote,
  FilePlus2,
  QrCode,
  Baby,
  Monitor,
  Printer,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CyberToolsAndGovernmentPortals } from "@/components/tools/CyberToolsAndGovernmentPortals";
import { PageSectionHeader } from "@/components/shared/PageSectionHeader";
import { AccessibleActionCard } from "@/components/shared/AccessibleActionCard";

export default function CyberCafePortal() {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Helmet>
        <title>Cyber Cafe &amp; Assisted Service Hub — Bagula 2 No Gram Panchayat</title>
        <meta
          name="description"
          content="Open-access Cyber Cafe & Assisted Operator Workstation for Bagula 2 No Gram Panchayat. Apply for Warish, Dependent, and Voter Linkage certificates, resize documents, format ID cards, and verify memos."
        />
      </Helmet>

      {/* Top Hub Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-700"
              aria-hidden="true"
            >
              <Monitor className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-700">
                Bagula 2 No Gram Panchayat · Open Operator Workspace
              </p>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                Cyber Cafe &amp; Assisted Service Hub
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="min-h-[44px] rounded-xl px-4 text-xs font-semibold"
            >
              <Link to="/faq">
                <BookOpen className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Operator FAQ &amp; SOP
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="min-h-[44px] rounded-xl px-4 text-xs font-semibold"
            >
              <Link to="/verify">
                <QrCode className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Verify Certificate
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="min-h-[44px] rounded-xl px-4 text-xs font-semibold text-slate-700"
            >
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        {/* Section 1: Assisted Application & Certificate Intake */}
        <section aria-labelledby="cyber-intake-heading" className="space-y-6">
          <PageSectionHeader
            headingId="cyber-intake-heading"
            kicker="Direct Assisted Intake · No Login Required"
            title="Start a New Application or Digital Form"
            bengaliTitle="সাইবার ক্যাফে সহায়তা কেন্দ্র — সরাসরি আবেদন ও ফর্ম এন্ট্রি"
            description="Cyber Cafe operators and assisted service desks can initiate certificate drafts, delayed birth/death applications, and legacy register digitization immediately without user accounts."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AccessibleActionCard
              title="Warish (Legal Heir) Certificate"
              subtitle="ওয়ারিশান সার্টিফিকেট আবেদন"
              description="Submit family succession particulars, upload death records, and add hierarchical legal heirs for Gram Panchayat verification."
              ctaLabel="Start Warish Application"
              to="/apply/warish"
              icon={<FileText className="h-5 w-5" />}
              accent="blue"
              metadataText="Tier 1 · Digital Form"
            />

            <AccessibleActionCard
              title="Dependent Certificate"
              subtitle="নির্ভরশীল সার্টিফিকেট আবেদন"
              description="Prepare family dependency certification drafts for pension, welfare, and service department verification."
              ctaLabel="Start Dependent Application"
              to="/apply/dependent"
              icon={<Users className="h-5 w-5" />}
              accent="emerald"
              metadataText="Tier 2 · Welfare"
            />

            <AccessibleActionCard
              title="Voter Linkage Certificate"
              subtitle="ভোটার ও বংশগত সংযোগ সার্টিফিকেট"
              description="Generate ancestral or marital electoral roll linkage drafts with parent EPIC details for verification."
              ctaLabel="Start Linkage Application"
              to="/apply/linkage"
              icon={<Vote className="h-5 w-5" />}
              accent="amber"
              metadataText="Tier 3 · Electoral"
            />

            <AccessibleActionCard
              title="Delayed Birth / Death Form"
              subtitle="বিলম্বিত জন্ম ও মৃত্যু নিবন্ধন ফর্ম"
              description="Complete Section 13(3) delayed birth/death reporting petitions, affidavit schedules, and witness declarations."
              ctaLabel="Open Delayed Form"
              to="/delayed-registration"
              icon={<FilePlus2 className="h-5 w-5" />}
              accent="orange"
              metadataText="RBD Act 1969"
            />

            <AccessibleActionCard
              title="Legacy Birth Digitization Request"
              subtitle="পুরাতন জন্ম নিবন্ধন ডিজিটাইজেশন"
              description="Digitize pre-2016 handwritten panchayat birth registers for CRS record verification and online retrieval."
              ctaLabel="Open Digitization Form"
              to="/birth-digitization-form"
              icon={<Baby className="h-5 w-5" />}
              accent="slate"
              metadataText="Legacy Register"
            />

            <AccessibleActionCard
              title="Verify & Track Application"
              subtitle="আবেদন ও মেমো যাচাইকরণ"
              description="Validate issued Memo Numbers, scan QR verification codes, and inspect real-time Gram Panchayat processing status."
              ctaLabel="Verify Memo / Status"
              to="/verify"
              icon={<QrCode className="h-5 w-5" />}
              accent="blue"
              metadataText="Instant Check"
            />
          </div>
        </section>

        {/* Section 2: Cyber Cafe Document Standards */}
        <section aria-labelledby="cyber-standards-heading" className="space-y-4">
          <PageSectionHeader
            headingId="cyber-standards-heading"
            kicker="Standard Operating Guidelines"
            title="Cyber Cafe Operator Quality Checklist"
            description="Follow these formatting and verification norms so Gram Panchayat DEOs and Admins can process submitted files without return delays."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Printer className="h-4 w-4 text-orange-700" aria-hidden="true" />
                <h3>Standard ISO ID-1 Card Formatting</h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                Align front and back scans of Aadhaar, Voter EPIC, PAN, or Ration cards at 85.60 mm × 53.98 mm using the Smart Card Formatter below before attaching.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                <h3>Client-Side Photo &amp; Signature Optimization</h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                Compress photographs and signatures under 20KB, 50KB, or 100KB directly in your browser—zero external uploads or privacy exposure.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Users className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <h3>30 Gram Sansad Ward Routing</h3>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                Ensure the correct Village and Gram Sansad Ward number are selected so Warish verification notices reach the right elected representative.
              </p>
            </article>
          </div>
        </section>

        {/* Section 3: Built-in Cyber Utilities & Government Portals */}
        <section aria-labelledby="cyber-tools-heading" className="space-y-4">
          <PageSectionHeader
            headingId="cyber-tools-heading"
            kicker="Utility Workstation"
            title="Image Resizer, Smart Card Cropper &amp; Portal Links"
            description="Select any card below to expand official West Bengal &amp; central portals, photo/signature tools, or ISO ID card alignment."
          />
          <CyberToolsAndGovernmentPortals />
        </section>
      </main>
    </div>
  );
}
