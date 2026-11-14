import React, { useEffect, useState } from "react";
import {
  FileText,
  FolderOpen,
  Printer,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  deleteFamilyTree,
  searchFamilyTrees,
} from "@/modules/familyTree/familyTreeService";
import { countFamilyNodes } from "@/modules/familyTree/treeOperations";
import { FamilyTreeRecord } from "@/modules/familyTree/types";
import { toast } from "sonner";

interface SavedFamilyTreesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRecordId: string | null;
  onLoadRecord: (record: FamilyTreeRecord, triggerPrint?: boolean) => void;
}

export const SavedFamilyTreesDrawer: React.FC<SavedFamilyTreesDrawerProps> = ({
  open,
  onOpenChange,
  activeRecordId,
  onLoadRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [records, setRecords] = useState<FamilyTreeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRecords = async (query: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const results = await searchFamilyTrees(query);
      setRecords(results);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to load saved records.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      loadRecords(searchTerm);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, searchTerm]);

  const handleDelete = async (record: FamilyTreeRecord) => {
    setDeletingId(record.id);
    try {
      await deleteFamilyTree(record.id);
      setRecords((prev) => prev.filter((item) => item.id !== record.id));
      toast.success(`Deleted family tree for ${record.head_name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete record.";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border space-y-1">
          <SheetTitle className="text-base font-bold text-foreground">
            Saved Records · সংরক্ষিত তালিকা
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Search saved family trees by Head Voter ID, Head Name, or Memo No to edit or reprint.
          </SheetDescription>

          <div className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Voter ID, Head Name, Memo No..."
                className="pl-9 h-10 text-xs"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadRecords(searchTerm)}
              disabled={loading}
              className="h-10 px-3 shrink-0"
              aria-label="Refresh saved records"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {!isSupabaseConfigured && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1">
              <p className="font-semibold">Supabase Database Not Connected</p>
              <p className="text-[11.5px] leading-relaxed">
                Configure <span className="font-mono">VITE_SUPABASE_URL</span> and{" "}
                <span className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</span> to query and store{" "}
                <span className="font-mono">family_trees</span> records.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3.5 text-xs text-destructive space-y-2">
              <p className="font-semibold">{errorMessage}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadRecords(searchTerm)}
                className="h-8 text-xs"
              >
                Retry Search
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="rounded-lg border border-border p-3.5 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : records.length === 0 && !errorMessage ? (
            <div className="py-12 text-center space-y-2">
              <FileText size={28} className="mx-auto text-muted-foreground/60" />
              <p className="text-sm font-semibold text-foreground">
                {searchTerm.trim()
                  ? "No matching records found"
                  : "No saved family trees yet"}
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {searchTerm.trim()
                  ? "Try clearing the filter or searching with another Voter ID, Head Name, or Memo No."
                  : "Fill in the Applicant and Head of Family details on the left and click Save Record."}
              </p>
            </div>
          ) : (
            records.map((record) => {
              const isActive = record.id === activeRecordId;
              const nodeCount = countFamilyNodes(record.tree_data);
              const updatedLabel = new Date(record.updated_at).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={record.id}
                  className={`rounded-lg border p-3.5 transition-colors space-y-2.5 ${
                    isActive
                      ? "border-secondary bg-secondary/[0.04]"
                      : "border-border bg-card hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-sm font-bold text-foreground truncate">
                        {record.head_name}
                      </h4>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <span>Applicant: {record.applicant_name}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {record.language === "bn" ? "বাংলা" : "English"}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="text-[11px] font-semibold text-secondary shrink-0">
                        Loaded
                      </span>
                    )}
                  </div>

                  {/* Quiet unboxed metadata line */}
                  <div className="text-[11px] text-muted-foreground font-mono tabular-nums flex items-center gap-2 flex-wrap">
                    <span>Memo: {record.memo_no || "—"}</span>
                    <span aria-hidden="true">·</span>
                    <span>Voter: {record.head_voter_id || "—"}</span>
                    {record.sansad_no && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Sansad: {record.sansad_no}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{nodeCount} members</span>
                    <span aria-hidden="true">·</span>
                    <span>Updated {updatedLabel}</span>
                  </div>

                  <div className="pt-2 border-t border-border/70 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onLoadRecord(record, false);
                          onOpenChange(false);
                        }}
                        className="h-8 px-3 text-xs gap-1.5 whitespace-nowrap"
                      >
                        <FolderOpen size={13} />
                        <span>Load</span>
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onLoadRecord(record, true);
                          onOpenChange(false);
                        }}
                        className="h-8 px-3 text-xs gap-1.5 whitespace-nowrap"
                      >
                        <Printer size={13} />
                        <span>Reprint</span>
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === record.id}
                      onClick={() => handleDelete(record)}
                      className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Delete ${record.head_name}`}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
