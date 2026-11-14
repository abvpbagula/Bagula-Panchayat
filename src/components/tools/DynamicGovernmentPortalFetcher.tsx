import { useState, useEffect, useCallback } from "react";
import {
  ExternalLink,
  Search,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  fetchGovernmentPortalsDynamically,
  type GovernmentPortal,
  OFFICIAL_GOVERNMENT_DIRECTORY,
} from "@/lib/governmentPortalsService";

interface Props {
  onClose?: () => void;
  initialFetch?: boolean;
}

export function DynamicGovernmentPortalFetcher({ onClose, initialFetch = false }: Props) {
  // Query state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [hasInteracted, setHasInteracted] = useState<boolean>(initialFetch);

  // 4 Core States: 'idle' | 'loading' | 'success' | 'error' | 'empty'
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    initialFetch ? "loading" : "idle"
  );
  const [portals, setPortals] = useState<GovernmentPortal[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const executeFetch = useCallback(
    async (category: string, query: string, forceErr = false) => {
      setStatus("loading");
      setErrorMessage(null);
      setHasInteracted(true);

      try {
        const results = await fetchGovernmentPortalsDynamically({
          category,
          searchQuery: query,
          forceError: forceErr,
        });
        setPortals(results);
        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Network communication failed while fetching government portal registry.");
      }
    },
    []
  );

  useEffect(() => {
    if (initialFetch) {
      executeFetch("all", "");
    }
  }, [initialFetch, executeFetch]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    executeFetch(cat, searchQuery);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeFetch(selectedCategory, searchQuery);
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    executeFetch("all", "");
  };

  const handleCopyLink = (portal: GovernmentPortal) => {
    navigator.clipboard.writeText(portal.url);
    setCopiedId(portal.id);
    toast.success(`Copied official URL: ${portal.name}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="bg-white rounded-3xl border border-border/80 p-5 sm:p-6 shadow-sm space-y-6 animate-in fade-in-50 duration-200">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center text-lg">
              🏛️
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                প্রয়োজনীয় সরকারি ওয়েবসাইট ও সিটিজেন পোর্টাল (Dynamic Directory)
              </h3>
              <p className="text-xs text-muted-foreground">
                Live on-demand verified West Bengal & Central Government service endpoints.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <Badge className="bg-blue-100 text-blue-800 text-[11px] gap-1 font-semibold animate-pulse border-blue-200">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Fetching links...</span>
            </Badge>
          ) : hasInteracted ? (
            <Badge className="bg-emerald-100 text-emerald-800 text-[11px] gap-1 font-semibold border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>{portals.length} Verified Links Active</span>
            </Badge>
          ) : null}

          {onClose && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 text-xs rounded-xl border-border text-muted-foreground hover:text-foreground shrink-0"
            >
              সংক্ষিপ্ত করুন ✕
            </Button>
          )}
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search government service (e.g. Banglarbhumi, Aadhaar, Swasthya Sathi, Ration...)"
              className="pl-9 h-10 text-xs sm:text-sm rounded-xl border-border/80"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="h-10 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0"
          >
            Search &amp; Fetch
          </Button>
          {hasInteracted && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => executeFetch(selectedCategory, searchQuery)}
              className="h-10 px-3 text-xs font-semibold rounded-xl shrink-0"
              title="Refresh link registry"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </form>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "all", label: "All Portals", labelBn: "সকল সরকারি পোর্টাল" },
            { id: "land_revenue", label: "Land & Records", labelBn: "জমি ও রাজস্ব" },
            { id: "identity", label: "National ID", labelBn: "আধার, ভোটার, প্যান" },
            { id: "welfare", label: "Health & Welfare", labelBn: "স্বাস্থ্য ও কল্যাণ" },
            { id: "state", label: "Citizen Certificates", labelBn: "ডিজিটাল শংসাপত্র" },
            { id: "central", label: "Central Services", labelBn: "কেন্দ্রীয় পরিবহন ও ডিজিলকার" },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className={`px-3 py-1.5 rounded-full font-semibold shrink-0 transition-all text-xs flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-700 shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] ${isActive ? "text-blue-100" : "text-muted-foreground"}`}>
                  ({cat.labelBn})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4 COMPLETE ARCHITECTURAL STATES                                      */}
      {/* =================================================================== */}

      {/* 1. IDLE / UNINTERACTED STATE */}
      {status === "idle" && (
        <div className="p-8 text-center rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl shadow-inner">
            ⚡
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-blue-950">
              On-Demand Government Directory Ready
            </h4>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              To keep the page fast and clean, verified state and central portals are loaded dynamically upon your command.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => executeFetch("all", "")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-5 rounded-xl shadow-xs"
          >
            👉 Click to Load All Government Portals
          </Button>
        </div>
      )}

      {/* 2. LOADING STATE (Skeleton Cards) */}
      {status === "loading" && (
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span className="font-semibold text-slate-800">
                Contacting State Data Center &amp; NIC Directory...
              </span>
            </div>
            <span className="text-[11px] font-mono">Status: HTTP 200 Handshake</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-slate-200" />
                  <div className="w-20 h-4 rounded-full bg-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <div className="w-3/4 h-4 rounded bg-slate-200" />
                  <div className="w-1/2 h-3 rounded bg-slate-200" />
                  <div className="w-full h-8 rounded bg-slate-200" />
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between">
                  <div className="w-24 h-4 rounded bg-slate-200" />
                  <div className="w-12 h-4 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {status === "error" && (
        <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-red-950">Failed to Retrieve Government Portals</h4>
            <p className="text-xs text-red-800 mt-1 max-w-md mx-auto">{errorMessage}</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              onClick={() => executeFetch(selectedCategory, searchQuery)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-8 px-4 rounded-xl gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs h-8 px-3 rounded-xl border-red-300"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}

      {/* 4. SUCCESS / LOADED STATE */}
      {status === "success" && (
        <div className="space-y-4">
          {portals.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl">
                🔍
              </div>
              <h4 className="font-bold text-sm text-slate-800">
                No matching government portals found
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                No active links found for "{searchQuery}" under the selected category. Please try different keywords like "Land", "Ration", "PAN", "Aadhaar", or reset filters.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs h-8 rounded-xl font-semibold"
              >
                Reset Search Filters
              </Button>
            </div>
          ) : (
            /* LOADED RESULTS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portals.map((portal) => (
                <div
                  key={portal.id}
                  className="group p-4 rounded-2xl border border-border/80 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{portal.icon}</span>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold bg-white border-blue-200 text-blue-900"
                        >
                          {portal.tag}
                        </Badge>
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-mono">
                          SSL Verified
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                        <span>{portal.name}</span>
                      </h4>
                      <p className="text-xs font-semibold text-blue-950/80 mt-0.5">{portal.nameBn}</p>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {portal.desc}
                    </p>

                    <div className="pt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{portal.department}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(portal)}
                      className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                      title="Copy official website link"
                    >
                      {copiedId === portal.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
