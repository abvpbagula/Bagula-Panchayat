import React from "react";
import { FamilyNode, FamilyTreeLanguage } from "@/modules/familyTree/types";
import { FAMILY_TREE_PRINT_COPY } from "@/modules/familyTree/presets";

interface BranchingTreeDiagramProps {
  root: FamilyNode;
  language: FamilyTreeLanguage;
  compact?: boolean;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

interface BranchNodeProps {
  node: FamilyNode;
  language: FamilyTreeLanguage;
  depth: number;
  compact: boolean;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

const BranchNode: React.FC<BranchNodeProps> = ({
  node,
  language,
  depth,
  compact,
  onSelectNode,
  selectedNodeId,
}) => {
  const copy = FAMILY_TREE_PRINT_COPY[language];
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;
  const isSelected = selectedNodeId === node.id;

  const displayName = node.name.trim() || (language === "bn" ? "(নাম লিখুন)" : "(Enter Name)");
  const displayRelation = node.relationLabel.trim() || (language === "bn" ? "সদস্য" : "Member");

  return (
    <div className="inline-flex flex-col items-center">
      {/* Node Box */}
      <div
        role={onSelectNode ? "button" : undefined}
        tabIndex={onSelectNode ? 0 : undefined}
        onClick={onSelectNode ? () => onSelectNode(node.id) : undefined}
        onKeyDown={
          onSelectNode
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectNode(node.id);
                }
              }
            : undefined
        }
        className={`relative text-center transition-colors break-inside-avoid ${
          compact ? "min-w-[132px] max-w-[170px] px-2.5 py-2" : "min-w-[154px] max-w-[205px] px-3 py-2.5"
        } rounded-md border ${
          isRoot
            ? "border-slate-900 bg-slate-50 print:bg-slate-50"
            : "border-slate-500 bg-white"
        } ${
          isSelected
            ? "ring-2 ring-amber-600 border-amber-700 print:ring-0 print:border-slate-500"
            : ""
        } ${onSelectNode ? "cursor-pointer hover:border-slate-900" : ""}`}
      >
        <div
          className={`text-[10px] font-semibold leading-tight tracking-wide ${
            isRoot ? "text-slate-900 underline underline-offset-2" : "text-slate-600"
          } ${language === "bn" ? "font-bengali" : ""}`}
        >
          {displayRelation}
        </div>

        <div
          className={`mt-1 font-bold leading-snug text-slate-950 break-words ${
            compact ? "text-[11.5px]" : "text-[12.5px]"
          } ${language === "bn" ? "font-bengali" : ""}`}
        >
          {displayName}
        </div>

        {node.spouseName && node.spouseName.trim() && (
          <div
            className={`mt-0.5 text-[10.5px] text-slate-700 leading-tight break-words ${
              language === "bn" ? "font-bengali" : ""
            }`}
          >
            {copy.spousePrefix}: {node.spouseName}
          </div>
        )}

        {node.voterId && node.voterId.trim() && (
          <div className="mt-1 pt-1 border-t border-slate-200 text-[9.5px] font-mono tabular-nums text-slate-700 tracking-tight">
            {copy.voterPrefix}: {node.voterId.toUpperCase()}
          </div>
        )}
      </div>

      {/* Orthogonal Connectors & Child Subtrees */}
      {hasChildren && (
        <div className="flex flex-col items-center">
          {/* Vertical stem leaving parent */}
          <div className="w-[1.5px] h-5 bg-slate-700" aria-hidden="true" />

          {/* Children horizontal bus */}
          <div className="flex items-start justify-center">
            {node.children.map((child, idx) => {
              const isOnly = node.children.length === 1;
              const isFirst = idx === 0;
              const isLast = idx === node.children.length - 1;

              return (
                <div
                  key={child.id}
                  className={`relative flex flex-col items-center ${
                    compact ? "px-1.5" : "px-2.5"
                  }`}
                >
                  {/* Horizontal connector bus bar across siblings */}
                  {!isOnly && (
                    <div
                      aria-hidden="true"
                      className="absolute top-0 h-[1.5px] bg-slate-700"
                      style={{
                        left: isFirst ? "50%" : "0%",
                        right: isLast ? "50%" : "0%",
                      }}
                    />
                  )}

                  {/* Vertical drop stem into child card */}
                  <div className="w-[1.5px] h-5 bg-slate-700" aria-hidden="true" />

                  <BranchNode
                    node={child}
                    language={language}
                    depth={depth + 1}
                    compact={compact}
                    onSelectNode={onSelectNode}
                    selectedNodeId={selectedNodeId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const BranchingTreeDiagram: React.FC<BranchingTreeDiagramProps> = ({
  root,
  language,
  compact = false,
  onSelectNode,
  selectedNodeId,
}) => {
  return (
    <div className="w-full overflow-x-auto print:overflow-visible py-2">
      <div className="min-w-fit mx-auto flex justify-center">
        <BranchNode
          node={root}
          language={language}
          depth={0}
          compact={compact}
          onSelectNode={onSelectNode}
          selectedNodeId={selectedNodeId}
        />
      </div>
    </div>
  );
};
