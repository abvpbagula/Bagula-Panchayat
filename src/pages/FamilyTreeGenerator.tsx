import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  FolderSearch,
  GitBranch,
  Languages,
  Printer,
  RotateCcw,
  Save,
  SlidersHorizontal,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RecursiveTreeEditor } from "@/components/familyTree/RecursiveTreeEditor";
import { FamilyTreePrintSheet } from "@/components/familyTree/FamilyTreePrintSheet";
import { SavedFamilyTreesDrawer } from "@/components/familyTree/SavedFamilyTreesDrawer";
import {
  addChildNode,
  countFamilyNodes,
  createInitialFamilyTree,
  deleteNodeById,
  getTreeDepth,
  moveChildOrder,
  translateTreePresets,
  updateNodeById,
} from "@/modules/familyTree/treeOperations";
import {
  createFamilyTree,
  updateFamilyTree,
} from "@/modules/familyTree/familyTreeService";
import {
  FamilyNode,
  FamilyTreeLanguage,
  FamilyTreePrintMode,
  FamilyTreeRecord,
} from "@/modules/familyTree/types";

export default function FamilyTreeGenerator() {
  const [searchParams] = useSearchParams();
  const initialApplicant = searchParams.get("applicant") || "";
  const initialHead = searchParams.get("head") || "";
  const initialSansad = searchParams.get("sansad") || "";
  const fromScStDesk = searchParams.get("from") === "sc-st-lineage";

  // Active Supabase record tracking (null = unsaved / new draft)
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Record metadata fields
  const [memoNo, setMemoNo] = useState("");
  const [applicantName, setApplicantName] = useState(initialApplicant);
  const [headName, setHeadName] = useState(initialHead);
  const [headVoterId, setHeadVoterId] = useState("");
  const [sansadNo, setSansadNo] = useState(initialSansad);
  const [language, setLanguage] = useState<FamilyTreeLanguage>("bn");
  const [topOffsetMm, setTopOffsetMm] = useState<number>(0);
  const [printMode, setPrintMode] = useState<FamilyTreePrintMode>("full_letterhead");

  // Recursive family tree state
  const [treeData, setTreeData] = useState<FamilyNode>(() =>
    createInitialFamilyTree(initialHead, "", "bn")
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => treeData.id);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);

  const totalMembers = countFamilyNodes(treeData);
  const totalGenerations = getTreeDepth(treeData);

  // Sync Head Name & Voter ID edits into root node if root matches or is blank
  const handleHeadNameChange = (value: string) => {
    const previousHead = headName;
    setHeadName(value);
    setTreeData((prev) => {
      if (!prev.name.trim() || prev.name === previousHead) {
        return { ...prev, name: value };
      }
      return prev;
    });
  };

  const handleHeadVoterIdChange = (value: string) => {
    const upper = value.toUpperCase();
    const previousVoter = headVoterId;
    setHeadVoterId(upper);
    setTreeData((prev) => {
      if (!prev.voterId?.trim() || prev.voterId === previousVoter) {
        return { ...prev, voterId: upper || undefined };
      }
      return prev;
    });
  };

  // Switch Bengali / English and translate known preset labels automatically
  const handleLanguageChange = (nextLang: FamilyTreeLanguage) => {
    if (nextLang === language) return;
    setLanguage(nextLang);
    setTreeData((prev) => translateTreePresets(prev, nextLang));
  };

  // Recursive node mutation handlers
  const handleUpdateNode = (
    nodeId: string,
    patch: Partial<Omit<FamilyNode, "id" | "children">>
  ) => {
    setTreeData((prev) => {
      const next = updateNodeById(prev, nodeId, patch);
      if (nodeId === prev.id) {
        if (typeof patch.name === "string") setHeadName(patch.name);
        if (typeof patch.voterId === "string") setHeadVoterId(patch.voterId.toUpperCase());
      }
      return next;
    });
  };

  const handleAddChild = (
    parentId: string,
    child: Omit<FamilyNode, "id" | "children">
  ) => {
    setTreeData((prev) => addChildNode(prev, parentId, child));
  };

  const handleDeleteNode = (nodeId: string) => {
    setTreeData((prev) => deleteNodeById(prev, nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(treeData.id);
    }
  };

  const handleMoveChild = (
    parentId: string,
    childId: string,
    direction: "up" | "down"
  ) => {
    setTreeData((prev) => moveChildOrder(prev, parentId, childId, direction));
  };

  // Reset editor for a fresh record
  const handleNewTree = () => {
    const freshRoot = createInitialFamilyTree("", "", language);
    setActiveRecordId(null);
    setMemoNo("");
    setApplicantName("");
    setHeadName("");
    setHeadVoterId("");
    setSansadNo("");
    setTopOffsetMm(0);
    setTreeData(freshRoot);
    setSelectedNodeId(freshRoot.id);
    toast.info(
      language === "bn"
        ? "নতুন বংশতালিকা ফর্ম প্রস্তুত করা হয়েছে।"
        : "Started a new blank family tree."
    );
  };

  // Load saved record from Supabase drawer
  const handleLoadRecord = (record: FamilyTreeRecord, triggerPrint = false) => {
    setActiveRecordId(record.id);
    setMemoNo(record.memo_no ?? "");
    setApplicantName(record.applicant_name);
    setHeadName(record.head_name);
    setHeadVoterId(record.head_voter_id ?? "");
    setSansadNo(record.sansad_no ?? "");
    setLanguage(record.language);
    setTopOffsetMm(record.top_offset_mm);
    setTreeData(record.tree_data);
    setSelectedNodeId(record.tree_data.id);
    setPrintMode(record.top_offset_mm > 0 ? "preprinted_pad" : "full_letterhead");

    toast.success(`Loaded record: ${record.head_name}`);

    if (triggerPrint) {
      window.setTimeout(() => {
        window.print();
      }, 250);
    }
  };

  // Save or Update in Supabase
  const handleSaveRecord = async (asCopy = false) => {
    const resolvedApplicant = applicantName.trim();
    const resolvedHead = (headName.trim() || treeData.name.trim()).trim();

    if (!resolvedApplicant) {
      toast.error(
        language === "bn"
          ? "আবেদনকারীর নাম (Applicant Name) আবশ্যক।"
          : "Applicant Name is required before saving."
      );
      return;
    }

    if (!resolvedHead) {
      toast.error(
        language === "bn"
          ? "পরিবারের প্রধানের নাম (Head of Family) আবশ্যক।"
          : "Head of Family name is required before saving."
      );
      return;
    }

    const syncedTree: FamilyNode =
      treeData.name.trim() === "" ? { ...treeData, name: resolvedHead } : treeData;

    const payload = {
      memo_no: memoNo.trim() || null,
      applicant_name: resolvedApplicant,
      head_name: resolvedHead,
      head_voter_id: (headVoterId.trim() || syncedTree.voterId?.trim() || "").toUpperCase() || null,
      sansad_no: sansadNo.trim() || null,
      language,
      top_offset_mm: Math.min(80, Math.max(0, Math.round(topOffsetMm))),
      tree_data: syncedTree,
    };

    setIsSaving(true);
    try {
      const saved =
        activeRecordId && !asCopy
          ? await updateFamilyTree(activeRecordId, payload)
          : await createFamilyTree(payload);

      setActiveRecordId(saved.id);
      setHeadName(saved.head_name);
      setTreeData(saved.tree_data);
      toast.success(
        activeRecordId && !asCopy
          ? "Family tree record updated in database."
          : "Family tree record saved to database."
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save family tree record.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Update selected node if tree root resets externally
  useEffect(() => {
    if (!selectedNodeId) {
      setSelectedNodeId(treeData.id);
    }
  }, [selectedNodeId, treeData.id]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Bilingual Family Tree Generator (বংশতালিকা) | Bagula II Gram Panchayat</title>
        <meta
          name="description"
          content="Bilingual Family Tree / বংশতালিকা Generator for Bagula 2 No. Gram Panchayat administrative records, SC/ST linkage, and calibrated A4 letterhead printing."
        />
      </Helmet>

      {/* Studio Top Bar (Hidden when printing) */}
      <div className="print:hidden border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={fromScStDesk ? "/sc-st-lineage" : "/admin/dashboard"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
            >
              <ArrowLeft size={15} />
              <span>{fromScStDesk ? "SC/ST Lineage Desk" : "Office Dashboard"}</span>
            </Link>

            <span className="text-border" aria-hidden="true">
              /
            </span>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <GitBranch size={16} className="text-secondary shrink-0" aria-hidden="true" />
                <h1 className="text-sm sm:text-base font-bold text-foreground truncate">
                  Bilingual Family Tree Generator · বংশতালিকা
                </h1>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono tabular-nums truncate">
                {activeRecordId ? `Record ID: ${activeRecordId.slice(0, 8)}` : "New Draft"} ·{" "}
                {totalMembers} members · {totalGenerations} generations · Offset {topOffsetMm} mm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDrawerOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0"
            >
              <FolderSearch size={14} />
              <span>Saved Records · সংরক্ষিত তালিকা</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNewTree}
              className="h-9 px-3 text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0"
            >
              <RotateCcw size={14} />
              <span>New</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={() => handleSaveRecord(false)}
              className="h-9 px-4 text-xs font-semibold gap-1.5 whitespace-nowrap shrink-0"
            >
              <Save size={14} />
              <span>
                {isSaving
                  ? "Saving..."
                  : activeRecordId
                  ? "Update Record"
                  : "Save Record"}
              </span>
            </Button>

            {activeRecordId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={() => handleSaveRecord(true)}
                className="h-9 px-3 text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Save as New
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => window.print()}
              className="h-9 px-4 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap shrink-0"
            >
              <Printer size={14} />
              <span>Print A4</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col xl:flex-row items-start gap-6 print:p-0 print:block">
        {/* LEFT PANE: Metadata, Print Calibration & Recursive Tree Editor */}
        <aside className="print:hidden w-full xl:w-[480px] shrink-0 space-y-5">
          {/* Section 1: Record Metadata & Language */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border">
              <h2 className="text-sm font-bold text-foreground">
                01. Record Details &amp; Language
              </h2>

              {/* Bilingual Segmented Control */}
              <div
                className="flex items-center p-0.5 rounded-lg bg-muted border border-border text-xs shrink-0"
                role="group"
                aria-label="Certificate Language"
              >
                <button
                  type="button"
                  onClick={() => handleLanguageChange("bn")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    language === "bn"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageChange("en")}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap ${
                    language === "en"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <Label htmlFor="ft-applicant" className="text-[11px] font-semibold">
                  {language === "bn" ? "আবেদনকারীর নাম *" : "Applicant Name *"}
                </Label>
                <Input
                  id="ft-applicant"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder={language === "bn" ? "যেমন: বিকাশ বিশ্বাস" : "e.g. Bikash Biswas"}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="ft-head" className="text-[11px] font-semibold">
                  {language === "bn" ? "পরিবারের প্রধান *" : "Head of Family *"}
                </Label>
                <Input
                  id="ft-head"
                  value={headName}
                  onChange={(e) => handleHeadNameChange(e.target.value)}
                  placeholder={language === "bn" ? "যেমন: হরিদাস বিশ্বাস" : "e.g. Haridas Biswas"}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="ft-voter" className="text-[11px] font-semibold">
                  {language === "bn" ? "প্রধানের ভোটার কার্ড নং" : "Head Voter ID (EPIC)"}
                </Label>
                <Input
                  id="ft-voter"
                  value={headVoterId}
                  onChange={(e) => handleHeadVoterIdChange(e.target.value)}
                  placeholder="e.g. WBE1234567"
                  className="mt-1 h-9 text-xs font-mono tabular-nums uppercase"
                />
              </div>

              <div>
                <Label htmlFor="ft-memo" className="text-[11px] font-semibold">
                  {language === "bn" ? "স্মারক নং (Memo No)" : "Official Memo No."}
                </Label>
                <Input
                  id="ft-memo"
                  value={memoNo}
                  onChange={(e) => setMemoNo(e.target.value)}
                  placeholder="e.g. 142/B2GP/2026"
                  className="mt-1 h-9 text-xs font-mono tabular-nums"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="ft-sansad" className="text-[11px] font-semibold">
                  {language === "bn" ? "গ্রাম সংসদ / ওয়ার্ড নং" : "Gram Sansad / Ward No."}
                </Label>
                <Input
                  id="ft-sansad"
                  value={sansadNo}
                  onChange={(e) => setSansadNo(e.target.value)}
                  placeholder="e.g. Sansad IV (Ward 04) — Stationpara"
                  className="mt-1 h-9 text-xs"
                />
              </div>
            </div>
          </section>

          {/* Section 2: A4 Pad Calibration & Output Mode */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-secondary" aria-hidden="true" />
                <span>02. Letterhead &amp; Pad Offset Calibration</span>
              </h2>
              <span className="text-xs font-mono tabular-nums font-bold text-foreground">
                {topOffsetMm} mm
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Pre-printed GP Pad Top Margin (0–80 mm)
                </span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    max={80}
                    value={topOffsetMm}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (Number.isNaN(val)) return;
                      setTopOffsetMm(Math.min(80, Math.max(0, Math.round(val))));
                    }}
                    className="w-16 h-8 text-xs font-mono tabular-nums text-right"
                    aria-label="Top offset in millimeters"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
              </div>

              <Slider
                value={[topOffsetMm]}
                min={0}
                max={80}
                step={1}
                onValueChange={([val]) => setTopOffsetMm(val ?? 0)}
                aria-label="Top offset millimeter slider"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground">Paper Header Mode</span>
                <div className="flex items-center p-0.5 rounded-lg bg-muted border border-border text-xs">
                  <button
                    type="button"
                    onClick={() => setPrintMode("full_letterhead")}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                      printMode === "full_letterhead"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Full Letterhead
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrintMode("preprinted_pad");
                      if (topOffsetMm === 0) setTopOffsetMm(38);
                    }}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
                      printMode === "preprinted_pad"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Pre-Printed Pad
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Recursive Family Hierarchy Builder */}
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  03. Family Hierarchy Builder
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Add children under any member using Bengali/English presets or custom labels.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
                {totalMembers} {totalMembers === 1 ? "node" : "nodes"}
              </span>
            </div>

            <RecursiveTreeEditor
              root={treeData}
              language={language}
              selectedNodeId={selectedNodeId}
              onSelectNode={(id) => setSelectedNodeId(id)}
              onUpdateNode={handleUpdateNode}
              onAddChild={handleAddChild}
              onDeleteNode={handleDeleteNode}
              onMoveChild={handleMoveChild}
            />
          </section>
        </aside>

        {/* RIGHT PANE: Live A4 Branching Preview */}
        <section className="flex-1 min-w-0 w-full space-y-3 print:m-0 print:p-0">
          <div className="print:hidden flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
              <Languages size={14} className="text-secondary shrink-0" aria-hidden="true" />
              <span className="font-semibold text-foreground truncate">
                Live A4 Print Preview ({language === "bn" ? "বাংলা সংস্করণ" : "English Edition"})
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums shrink-0">210 × 297 mm</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewZoom((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                className="h-8 w-8 p-0"
                aria-label="Zoom out A4 preview"
              >
                <ZoomOut size={14} />
              </Button>
              <span className="text-xs font-mono tabular-nums w-11 text-center">
                {Math.round(previewZoom * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewZoom((z) => Math.min(1.1, Number((z + 0.1).toFixed(2))))}
                className="h-8 w-8 p-0"
                aria-label="Zoom in A4 preview"
              >
                <ZoomIn size={14} />
              </Button>
            </div>
          </div>

          {/* Scrollable A4 Viewport */}
          <div className="rounded-xl border border-border bg-slate-100/80 p-4 sm:p-6 overflow-x-auto print:border-none print:bg-transparent print:p-0 print:overflow-visible">
            <div
              className="origin-top mx-auto print:!transform-none print:!w-auto"
              style={{
                transform: `scale(${previewZoom})`,
                transformOrigin: "top center",
                width: "210mm",
              }}
            >
              <FamilyTreePrintSheet
                memoNo={memoNo}
                applicantName={applicantName}
                headName={headName}
                headVoterId={headVoterId}
                sansadNo={sansadNo}
                language={language}
                topOffsetMm={topOffsetMm}
                printMode={printMode}
                treeData={treeData}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => setSelectedNodeId(id)}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Saved Records Slide-Over Drawer */}
      <SavedFamilyTreesDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        activeRecordId={activeRecordId}
        onLoadRecord={handleLoadRecord}
      />
    </div>
  );
}
