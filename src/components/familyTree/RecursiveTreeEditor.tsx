import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FamilyNode, FamilyTreeLanguage } from "@/modules/familyTree/types";
import { CHILD_ADD_PRESETS, getPresetLabel } from "@/modules/familyTree/presets";

interface RecursiveTreeEditorProps {
  root: FamilyNode;
  language: FamilyTreeLanguage;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateNode: (
    nodeId: string,
    patch: Partial<Omit<FamilyNode, "id" | "children">>
  ) => void;
  onAddChild: (
    parentId: string,
    child: Omit<FamilyNode, "id" | "children">
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveChild: (parentId: string, childId: string, direction: "up" | "down") => void;
}

interface EditorBranchProps {
  node: FamilyNode;
  parentId: string | null;
  siblingIndex: number;
  siblingCount: number;
  depth: number;
  language: FamilyTreeLanguage;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateNode: (
    nodeId: string,
    patch: Partial<Omit<FamilyNode, "id" | "children">>
  ) => void;
  onAddChild: (
    parentId: string,
    child: Omit<FamilyNode, "id" | "children">
  ) => void;
  onDeleteNode: (nodeId: string) => void;
  onMoveChild: (parentId: string, childId: string, direction: "up" | "down") => void;
}

const EditorBranch: React.FC<EditorBranchProps> = ({
  node,
  parentId,
  siblingIndex,
  siblingCount,
  depth,
  language,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onAddChild,
  onDeleteNode,
  onMoveChild,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildSpouse, setNewChildSpouse] = useState("");
  const [newChildVoterId, setNewChildVoterId] = useState("");
  const [newChildRelation, setNewChildRelation] = useState(
    getPresetLabel(CHILD_ADD_PRESETS[0], language)
  );

  const isRoot = depth === 0;
  const isSelected = selectedNodeId === node.id;

  const handleOpenAddChild = () => {
    setNewChildRelation(getPresetLabel(CHILD_ADD_PRESETS[0], language));
    setNewChildName("");
    setNewChildSpouse("");
    setNewChildVoterId("");
    setAddingChild(true);
    setExpanded(true);
  };

  const handleConfirmAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    onAddChild(node.id, {
      name: newChildName.trim(),
      spouseName: newChildSpouse.trim() || undefined,
      voterId: newChildVoterId.trim().toUpperCase() || undefined,
      relationLabel: newChildRelation.trim() || getPresetLabel(CHILD_ADD_PRESETS[0], language),
    });
    setAddingChild(false);
    setNewChildName("");
    setNewChildSpouse("");
    setNewChildVoterId("");
  };

  return (
    <div className={depth > 0 ? "pl-3.5 ml-2 border-l border-border space-y-2.5" : "space-y-2.5"}>
      <div
        onClick={() => onSelectNode(node.id)}
        className={`rounded-lg border p-3 transition-colors ${
          isSelected
            ? "border-secondary bg-secondary/[0.03]"
            : "border-border bg-card hover:border-slate-400"
        }`}
      >
        {/* Node Header Bar */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-border/70">
          <div className="flex items-center gap-1.5 min-w-0">
            {node.children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="w-7 h-7 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
                aria-label={expanded ? "Collapse branch" : "Expand branch"}
              >
                {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <span className="w-7 h-7 flex items-center justify-center text-xs font-mono text-muted-foreground shrink-0">
                G{depth + 1}
              </span>
            )}

            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">
                {node.name.trim() || (language === "bn" ? "নতুন সদস্য" : "Unnamed Member")}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {node.relationLabel}
                {node.children.length > 0
                  ? ` · ${node.children.length} ${
                      language === "bn" ? "সন্তান/শাখা" : node.children.length === 1 ? "child" : "children"
                    }`
                  : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {parentId && siblingCount > 1 && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={siblingIndex === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveChild(parentId, node.id, "up");
                  }}
                  title="Move earlier"
                >
                  <ArrowUp size={13} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={siblingIndex === siblingCount - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveChild(parentId, node.id, "down");
                  }}
                  title="Move later"
                >
                  <ArrowDown size={13} />
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenAddChild();
              }}
              className="h-7 px-2.5 text-[11px] font-semibold gap-1 whitespace-nowrap shrink-0"
            >
              <Plus size={12} />
              <span>{language === "bn" ? "সন্তান যোগ" : "Add Child"}</span>
            </Button>

            {!isRoot && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(node.id);
                }}
                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                title={language === "bn" ? "শাখা মুছুন" : "Delete node"}
              >
                <Trash2 size={13} />
              </Button>
            )}
          </div>
        </div>

        {/* Inline Node Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <Label className="text-[11px] text-muted-foreground">
              {language === "bn" ? "সদস্যের নাম *" : "Member Name *"}
            </Label>
            <Input
              value={node.name}
              onChange={(e) => onUpdateNode(node.id, { name: e.target.value })}
              placeholder={language === "bn" ? "যেমন: হরেন বিশ্বাস" : "e.g. HAREN BISWAS"}
              className={`mt-1 h-9 text-xs ${language === "bn" ? "font-bengali" : ""}`}
            />
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">
              {language === "bn" ? "সম্পর্ক (Relation)" : "Relation Label"}
            </Label>
            <Input
              value={node.relationLabel}
              onChange={(e) => onUpdateNode(node.id, { relationLabel: e.target.value })}
              placeholder={language === "bn" ? "যেমন: বড় ছেলে" : "e.g. Eldest Son"}
              className={`mt-1 h-9 text-xs ${language === "bn" ? "font-bengali" : ""}`}
            />
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">
              {language === "bn" ? "স্ত্রী / স্বামীর নাম (ঐচ্ছিক)" : "Spouse Name (Optional)"}
            </Label>
            <Input
              value={node.spouseName ?? ""}
              onChange={(e) => onUpdateNode(node.id, { spouseName: e.target.value })}
              placeholder={language === "bn" ? "যেমন: গীতা বিশ্বাস" : "e.g. Gita Biswas"}
              className={`mt-1 h-9 text-xs ${language === "bn" ? "font-bengali" : ""}`}
            />
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground">
              {language === "bn" ? "ভোটার আইডি / EPIC (ঐচ্ছিক)" : "Voter ID / EPIC (Optional)"}
            </Label>
            <Input
              value={node.voterId ?? ""}
              onChange={(e) =>
                onUpdateNode(node.id, { voterId: e.target.value.toUpperCase() })
              }
              placeholder="e.g. WBE1234567"
              className="mt-1 h-9 text-xs font-mono tabular-nums uppercase"
            />
          </div>
        </div>

        {/* One-Click Bilingual Preset Strip for this node's Relation Label */}
        {!isRoot && (
          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10.5px] text-muted-foreground mr-1">
              {language === "bn" ? "দ্রুত সম্পর্ক:" : "Presets:"}
            </span>
            {CHILD_ADD_PRESETS.slice(0, 7).map((preset) => {
              const label = getPresetLabel(preset, language);
              const active = node.relationLabel.trim() === label;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateNode(node.id, { relationLabel: label });
                  }}
                  className={`px-2 py-1 rounded text-[10.5px] border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                      : "bg-muted/40 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Inline Add Child Sub-Form */}
        {addingChild && (
          <form
            onSubmit={handleConfirmAddChild}
            onClick={(e) => e.stopPropagation()}
            className="mt-3 p-3 rounded-lg border border-secondary/30 bg-muted/30 space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus size={14} className="text-secondary" />
                <span>
                  {language === "bn"
                    ? `${node.name || "এই সদস্যের"} অধীনে নতুন সন্তান যোগ করুন`
                    : `Add child under ${node.name || "this member"}`}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAddingChild(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
            </div>

            {/* One-Click Relation Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {CHILD_ADD_PRESETS.map((preset) => {
                const label = getPresetLabel(preset, language);
                const selected = newChildRelation === label;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setNewChildRelation(label)}
                    className={`px-2 py-1 rounded text-[11px] border transition-colors whitespace-nowrap shrink-0 ${
                      selected
                        ? "bg-secondary text-secondary-foreground border-secondary font-semibold"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder={language === "bn" ? "নাম লিখুন *" : "Full Name *"}
                className="h-9 text-xs bg-background"
                autoFocus
              />
              <Input
                value={newChildRelation}
                onChange={(e) => setNewChildRelation(e.target.value)}
                placeholder={language === "bn" ? "কাস্টম সম্পর্ক লিখুন" : "Custom relation label"}
                className="h-9 text-xs bg-background"
              />
              <Input
                value={newChildSpouse}
                onChange={(e) => setNewChildSpouse(e.target.value)}
                placeholder={language === "bn" ? "স্ত্রী / স্বামীর নাম" : "Spouse Name (optional)"}
                className="h-9 text-xs bg-background"
              />
              <Input
                value={newChildVoterId}
                onChange={(e) => setNewChildVoterId(e.target.value.toUpperCase())}
                placeholder={language === "bn" ? "ভোটার আইডি (ঐচ্ছিক)" : "Voter ID (optional)"}
                className="h-9 text-xs font-mono tabular-nums uppercase bg-background"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddingChild(false)}
                className="h-8 px-3 text-xs"
              >
                {language === "bn" ? "বন্ধ করুন" : "Cancel"}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newChildName.trim()}
                className="h-8 px-3 text-xs bg-secondary text-secondary-foreground hover:bg-secondary/90"
              >
                {language === "bn" ? "বংশতালিকায় যুক্ত করুন" : "Add to Tree"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Recursive Children */}
      {expanded && node.children.length > 0 && (
        <div className="space-y-2.5">
          {node.children.map((child, idx) => (
            <EditorBranch
              key={child.id}
              node={child}
              parentId={node.id}
              siblingIndex={idx}
              siblingCount={node.children.length}
              depth={depth + 1}
              language={language}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onUpdateNode={onUpdateNode}
              onAddChild={onAddChild}
              onDeleteNode={onDeleteNode}
              onMoveChild={onMoveChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const RecursiveTreeEditor: React.FC<RecursiveTreeEditorProps> = ({
  root,
  language,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onAddChild,
  onDeleteNode,
  onMoveChild,
}) => {
  return (
    <EditorBranch
      node={root}
      parentId={null}
      siblingIndex={0}
      siblingCount={1}
      depth={0}
      language={language}
      selectedNodeId={selectedNodeId}
      onSelectNode={onSelectNode}
      onUpdateNode={onUpdateNode}
      onAddChild={onAddChild}
      onDeleteNode={onDeleteNode}
      onMoveChild={onMoveChild}
    />
  );
};
