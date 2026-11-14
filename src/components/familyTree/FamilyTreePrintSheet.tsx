import React from "react";
import {
  FamilyNode,
  FamilyTreeLanguage,
  FamilyTreePrintMode,
} from "@/modules/familyTree/types";
import { FAMILY_TREE_PRINT_COPY } from "@/modules/familyTree/presets";
import { countFamilyNodes, getTreeDepth } from "@/modules/familyTree/treeOperations";
import { BranchingTreeDiagram } from "./BranchingTreeDiagram";

interface FamilyTreePrintSheetProps {
  memoNo: string;
  applicantName: string;
  headName: string;
  headVoterId: string;
  sansadNo: string;
  language: FamilyTreeLanguage;
  topOffsetMm: number;
  printMode: FamilyTreePrintMode;
  treeData: FamilyNode;
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
}

export const FamilyTreePrintSheet: React.FC<FamilyTreePrintSheetProps> = ({
  memoNo,
  applicantName,
  headName,
  headVoterId,
  sansadNo,
  language,
  topOffsetMm,
  printMode,
  treeData,
  selectedNodeId,
  onSelectNode,
}) => {
  const copy = FAMILY_TREE_PRINT_COPY[language];
  const totalNodes = countFamilyNodes(treeData);
  const maxDepth = getTreeDepth(treeData);
  const compactTree = totalNodes >= 7 || maxDepth >= 4;

  const formattedDate = new Date().toLocaleDateString(
    language === "bn" ? "bn-IN" : "en-IN",
    { day: "2-digit", month: "2-digit", year: "numeric" }
  );

  return (
    <div
      id="family-tree-a4-sheet"
      className={`a4-page mx-auto bg-white text-slate-950 border border-slate-300 shadow-sm print:border-none print:shadow-none ${
        language === "bn" ? "font-bengali" : "font-sans"
      }`}
      style={{
        width: "210mm",
        minHeight: "296mm",
        boxSizing: "border-box",
        paddingLeft: "14mm",
        paddingRight: "14mm",
        paddingBottom: "14mm",
        paddingTop: `${printMode === "full_letterhead" ? Math.max(12, topOffsetMm) : topOffsetMm}mm`,
        position: "relative",
      }}
    >
      {/* Screen-only calibrated offset guide for pre-printed GP letterhead */}
      {topOffsetMm > 0 && (
        <div
          aria-hidden="true"
          className="print:hidden absolute top-0 left-0 right-0 flex items-end justify-between px-4 pb-1.5 border-b border-dashed border-amber-500/70 bg-amber-50/60 text-[11px] font-mono tabular-nums text-amber-900 select-none"
          style={{ height: `${topOffsetMm}mm` }}
        >
          <span>Pre-Printed Pad Header Clearance</span>
          <span>Offset: {topOffsetMm} mm</span>
        </div>
      )}

      {/* Optional Plain Paper Official Letterhead */}
      {printMode === "full_letterhead" && (
        <header className="border-b-2 border-slate-900 pb-3 mb-4 text-center space-y-0.5">
          <p className="text-[10.5px] font-semibold text-slate-600 tracking-wide">
            {copy.govHeader}
          </p>
          <h1
            className={`text-xl font-bold text-slate-950 ${
              language === "en" ? "font-heading uppercase tracking-tight" : "font-bengali"
            }`}
          >
            {copy.gpName}
          </h1>
          <p className="text-[11px] text-slate-700">{copy.gpAddress}</p>
        </header>
      )}

      {/* Memo & Reference Row */}
      <div className="flex items-center justify-between gap-4 text-[11.5px] text-slate-800 border-b border-slate-300 pb-2 mb-4">
        <div className="font-mono tabular-nums">
          <span className="font-semibold text-slate-600">{copy.memoLabel}:</span>{" "}
          <span className="font-bold text-slate-950">{memoNo.trim() || "________________"}</span>
        </div>
        {sansadNo.trim() && (
          <div className="font-mono tabular-nums">
            <span className="font-semibold text-slate-600">{copy.sansadLabel}:</span>{" "}
            <span className="font-bold text-slate-950">{sansadNo.trim()}</span>
          </div>
        )}
        <div className="font-mono tabular-nums">
          <span className="font-semibold text-slate-600">{copy.dateLabel}:</span>{" "}
          <span className="font-bold text-slate-950">{formattedDate}</span>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-4 space-y-0.5">
        <h2 className="text-lg font-bold text-slate-950 underline underline-offset-4">
          {copy.certTitle}
        </h2>
        <p className="text-[11px] text-slate-600">{copy.certSubtitle}</p>
      </div>

      {/* Case Metadata Grid (clean unboxed hairline table) */}
      <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-[11.5px] border border-slate-300 rounded-sm p-3 mb-5 bg-slate-50/50 print:bg-transparent">
        <div>
          <span className="block text-[10px] text-slate-500">{copy.applicantLabel}</span>
          <span className="font-bold text-slate-950 break-words">
            {applicantName.trim() || "—"}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500">{copy.headLabel}</span>
          <span className="font-bold text-slate-950 break-words">
            {headName.trim() || treeData.name.trim() || "—"}
          </span>
        </div>
        <div>
          <span className="block text-[10px] text-slate-500">{copy.headVoterLabel}</span>
          <span className="font-mono tabular-nums font-bold text-slate-950">
            {headVoterId.trim().toUpperCase() || treeData.voterId?.trim().toUpperCase() || "—"}
          </span>
        </div>
      </div>

      {/* Visual Branching Tree Area */}
      <section className="my-4 py-3 border-y border-slate-200">
        <BranchingTreeDiagram
          root={treeData}
          language={language}
          compact={compactTree}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
        />
      </section>

      {/* Quiet Summary Metadata Line */}
      <div className="flex items-center justify-center gap-2 text-[10.5px] text-slate-600 font-mono tabular-nums mb-5">
        <span>
          {copy.totalMembersLabel}: {totalNodes}
        </span>
        <span aria-hidden="true">·</span>
        <span>
          {copy.generationsLabel}: {maxDepth}
        </span>
      </div>

      {/* Official Attestation & Dual Signature Footer */}
      <footer className="mt-6 pt-3 space-y-10 break-inside-avoid">
        <p className="text-[11.5px] leading-relaxed text-slate-800 text-justify">
          {copy.declarationText}
        </p>

        <div className="grid grid-cols-2 gap-12 pt-8 text-center text-[11px]">
          <div className="space-y-1">
            <div className="border-t border-slate-700 pt-1.5 font-semibold text-slate-900">
              {copy.signatoryLeft}
            </div>
            <div className="text-[10px] text-slate-600">{copy.officeSubtext}</div>
          </div>

          <div className="space-y-1">
            <div className="border-t border-slate-700 pt-1.5 font-semibold text-slate-900">
              {copy.signatoryRight}
            </div>
            <div className="text-[10px] text-slate-600">{copy.officeSubtext}</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
