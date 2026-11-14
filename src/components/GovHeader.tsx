import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  Users,
  Monitor,
  Lock,
  Landmark,
  GitBranch,
  HelpCircle,
} from "lucide-react";
import { useAppSettings } from "@/lib/appSettings";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function GovHeader() {
  const { authority } = useAppSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === "/";
  const isVerify =
    location.pathname.startsWith("/verify") ||
    location.pathname.startsWith("/track");
  const isTracker =
    location.pathname.startsWith("/tracker") ||
    location.pathname.startsWith("/accountability-tracker");
  const isDirectoryActive =
    location.pathname.startsWith("/elected-representatives") ||
    location.pathname.startsWith("/elected-portal") ||
    location.pathname.startsWith("/sc-st-lineage") ||
    location.pathname.startsWith("/faq");

  const brandName = authority.gramPanchayatName || "Bagula II Gram Panchayat";

  return (
    <header className="no-print sticky top-0 z-50 bg-slate-950 text-white border-b border-slate-800 shadow-sm">
      <div className="gov-tricolor-top h-1 w-full" />

      {/* Strict 3-Zone Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          aria-label={`${brandName} Home`}
          className="inline-flex items-center gap-2.5 text-sm sm:text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          <Landmark className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{brandName}</span>
        </Link>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <Link
            to="/"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm ${
              isHome
                ? "text-white border-amber-400 font-semibold"
                : "text-slate-300 border-transparent hover:text-white hover:border-slate-500"
            }`}
          >
            Home
          </Link>

          <Link
            to="/verify"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm ${
              isVerify
                ? "text-white border-amber-400 font-semibold"
                : "text-slate-300 border-transparent hover:text-white hover:border-slate-500"
            }`}
          >
            Verify &amp; Track
          </Link>

          <Link
            to="/tracker"
            className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm ${
              isTracker
                ? "text-white border-amber-400 font-semibold"
                : "text-slate-300 border-transparent hover:text-white hover:border-slate-500"
            }`}
          >
            Public Tracker
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`inline-flex items-center gap-1 whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-sm ${
                  isDirectoryActive
                    ? "text-white border-amber-400 font-semibold"
                    : "text-slate-300 border-transparent hover:text-white hover:border-slate-500"
                }`}
              >
                <span>Directory &amp; Desk</span>
                <ChevronDown className="w-4 h-4 opacity-80" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={10}
              className="w-72 p-2 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-900"
            >
              <DropdownMenuLabel className="text-xs font-semibold text-slate-500 px-2 py-1">
                Open Panchayat Desks &amp; Guides
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5 focus:bg-slate-100">
                <Link to="/elected-representatives" className="flex items-start gap-2.5 w-full">
                  <Users className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">Elected Representatives</p>
                    <p className="text-[11px] text-slate-500">30 Gram Sansads · Ward Directory</p>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5 focus:bg-slate-100">
                <Link to="/elected-portal" className="flex items-start gap-2.5 w-full">
                  <Monitor className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">Representative Inquiry Desk</p>
                    <p className="text-[11px] text-slate-500">Ward verification &amp; 45-day notices</p>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5 focus:bg-slate-100">
                <Link to="/sc-st-lineage" className="flex items-start gap-2.5 w-full">
                  <GitBranch className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">SC/ST Lineage Desk</p>
                    <p className="text-[11px] text-slate-500">Paternal Vamshabriksha verification</p>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5 focus:bg-slate-100">
                <Link to="/faq" className="flex items-start gap-2.5 w-full">
                  <HelpCircle className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">Service FAQ</p>
                    <p className="text-[11px] text-slate-500">Documents &amp; application procedures</p>
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Zone 3: Primary Action + Mobile Menu Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/admin"
            className="hidden md:inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Office Login</span>
          </Link>

          <button
            type="button"
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer (>=44px touch targets) */}
      {mobileOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-4 space-y-2 max-h-[82vh] overflow-y-auto"
        >
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isHome ? "bg-white text-slate-950" : "text-slate-100 hover:bg-white/10"
            }`}
          >
            <span>Home</span>
            <span className="text-xs opacity-75 font-normal">মূল পাতা</span>
          </Link>

          <Link
            to="/verify"
            onClick={() => setMobileOpen(false)}
            className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isVerify ? "bg-white text-slate-950" : "text-slate-100 hover:bg-white/10"
            }`}
          >
            <span>Verify &amp; Track</span>
            <span className="text-xs opacity-75 font-normal">যাচাই ও অনুসন্ধান</span>
          </Link>

          <Link
            to="/tracker"
            onClick={() => setMobileOpen(false)}
            className={`min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isTracker ? "bg-white text-slate-950" : "text-slate-100 hover:bg-white/10"
            }`}
          >
            <span>Public Tracker</span>
            <span className="text-xs opacity-75 font-normal">উন্নয়ন ট্র্যাকার</span>
          </Link>

          <div className="h-px bg-slate-800 my-2" />

          <Link
            to="/elected-representatives"
            onClick={() => setMobileOpen(false)}
            className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <span>Elected Representatives</span>
            <span className="text-xs text-slate-400">30 Wards</span>
          </Link>

          <Link
            to="/elected-portal"
            onClick={() => setMobileOpen(false)}
            className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <span>Representative Inquiry Desk</span>
            <span className="text-xs text-slate-400">Open Desk</span>
          </Link>

          <Link
            to="/sc-st-lineage"
            onClick={() => setMobileOpen(false)}
            className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <span>SC/ST Lineage Desk</span>
            <span className="text-xs text-slate-400">Vamshabriksha</span>
          </Link>

          <Link
            to="/faq"
            onClick={() => setMobileOpen(false)}
            className="min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <span>Service FAQ</span>
            <span className="text-xs text-slate-400">Guides</span>
          </Link>

          <div className="pt-2">
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="min-h-[44px] w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-bold transition-colors"
            >
              <Lock className="w-4 h-4" aria-hidden="true" />
              <span>Office Login (DEO / Admin / Super Admin)</span>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
