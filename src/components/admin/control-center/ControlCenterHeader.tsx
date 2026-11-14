import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Search,
  Download,
  ArrowLeft,
  Server,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { exportCompleteSystemGovernanceSnapshot } from "@/lib/governanceCenterService";

interface ControlCenterHeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  activeSectionTitle: string;
  activeSectionDesc?: string;
}

export const ControlCenterHeader: React.FC<ControlCenterHeaderProps> = ({
  searchQuery = "",
  onSearchChange = () => {},
  activeSectionTitle,
  activeSectionDesc = "",
}) => {
  const [exporting, setExporting] = React.useState(false);

  const handleExportSnapshot = async () => {
    setExporting(true);
    try {
      const data = await exportCompleteSystemGovernanceSnapshot();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bagula2_governance_snapshot_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Governance snapshot exported successfully.");
    } catch (err: any) {
      toast.error("Failed to export governance snapshot: " + (err?.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <header className="border-b bg-card text-card-foreground shadow-xs">
      {/* Top Banner */}
      <div className="bg-primary/95 text-primary-foreground px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className="h-4 w-4 text-emerald-300 shrink-0" />
          <span className="tracking-wide">BAGULA II GRAM PANCHAYAT — SUPER ADMIN CENTRAL GOVERNANCE</span>
          <Badge variant="outline" className="text-[10px] uppercase font-mono border-white/30 text-white bg-white/10 px-1.5 py-0">
            Highest Security Mode
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-white/85 text-[11px]">
          <span className="hidden sm:inline">Jurisdiction: Hanskhali Block, Nadia</span>
          <span className="border-l border-white/20 pl-4 hidden md:inline">Node: Container Port 3000 (Nginx Reverse Proxy)</span>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1 font-semibold text-white hover:underline ml-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="px-4 py-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-heading text-foreground">
                {activeSectionTitle}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-3xl">
                {activeSectionDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Search 22 governance modules..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 pl-8 text-xs bg-background"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSnapshot}
            disabled={exporting}
            className="h-9 text-xs gap-1.5 shrink-0"
            title="Download full system governance JSON snapshot for disaster recovery"
          >
            {exporting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Export Snapshot</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
