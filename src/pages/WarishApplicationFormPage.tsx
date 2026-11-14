import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import WarishApplicationFormPrint from "@/components/warish/WarishApplicationFormPrint";
import { Button } from "@/components/ui/button";
import { Home, Printer, FileText, ScrollText } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { PublicFormBackendBanner } from "@/components/citizen/PublicFormBackendBanner";

export default function WarishApplicationFormPage() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <Helmet>
        <title>Warish Application Form (A4 Print) — Bagula 2 No Gram Panchayat</title>
        <meta
          name="description"
          content="Official Warish (Legal Heir / Succession) physical application form for Bagula 2 No Gram Panchayat. Instant download and forced A4 printout."
        />
      </Helmet>

      {/* Navigation Header (hidden on print) */}
      <div className="no-print sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/80 px-4 py-3 shadow-2xs">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BackButton
              fallbackUrl="/"
              label="Back"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs gap-1.5 h-8 font-medium"
            />
            <Link to="/">
              <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1.5 h-8">
                <Home size={14} />
                <span className="hidden sm:inline">GP Portal</span>
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/apply/warish">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-9 text-primary border-primary/30">
                <span>Apply Online</span>
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => window.print()}
              className="rounded-xl bg-primary text-primary-foreground text-xs font-bold gap-1.5 h-8 shadow-xs"
            >
              <Printer size={14} />
              <span>Print A4 Form</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <PublicFormBackendBanner
          serviceCode="WARISH_A4"
          serviceTitle="Warish (Legal Heir / Succession) Certificate Application"
          serviceTitleBn="ওয়ারিশান (উত্তরাধিকার) শংসাপত্রের আবেদন"
        />
        <WarishApplicationFormPrint />
      </main>
    </div>
  );
}
