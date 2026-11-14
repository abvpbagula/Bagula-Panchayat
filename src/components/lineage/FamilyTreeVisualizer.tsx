import React, { useState } from "react";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Award,
  User,
  ArrowDown,
  Info,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Layers,
  Sparkles,
} from "lucide-react";
import { LineageTreeNode, LineageGender, LivingStatus, NodeVerificationStatus } from "@/types/scStLineageTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PATERNAL_RELATIONSHIP_RULES } from "@/lib/paternalRelationshipRules";

interface Props {
  nodes: LineageTreeNode[];
  onNodesChange?: (updated: LineageTreeNode[]) => void;
  readOnly?: boolean;
  className?: string;
}

export const FamilyTreeVisualizer: React.FC<Props> = ({
  nodes,
  onNodesChange,
  readOnly = false,
  className = "",
}) => {
  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");
  const [editingNode, setEditingNode] = useState<LineageTreeNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "add_parent" | "add_child" | "add_sibling">("edit");
  const [targetNodeForRelation, setTargetNodeForRelation] = useState<LineageTreeNode | null>(null);

  // Form fields for editing/adding node
  const [formName, setFormName] = useState("");
  const [formRelation, setFormRelation] = useState("FATHER");
  const [formGender, setFormGender] = useState<LineageGender>("Male");
  const [formStatus, setFormStatus] = useState<LivingStatus>("Living");
  const [formAgeOrDob, setFormAgeOrDob] = useState("");
  const [formVillage, setFormVillage] = useState("Bagula");
  const [formDocRef, setFormDocRef] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [formIsCertHolder, setFormIsCertHolder] = useState(false);
  const [formCertNo, setFormCertNo] = useState("");
  const [formSubCaste, setFormSubCaste] = useState("Namasudra");
  const [formIssueDate, setFormIssueDate] = useState("");
  const [formIssuingAuth, setFormIssuingAuth] = useState("SDO Ranaghat, Nadia");

  // Organize nodes by generation levels (highest level = root ancestors at top)
  const maxGen = Math.max(...nodes.map((n) => n.generationLevel), 0);
  const minGen = Math.min(...nodes.map((n) => n.generationLevel), 0);

  // Group nodes by generation
  const generationGroups: { level: number; label: string; nodes: LineageTreeNode[] }[] = [];
  for (let g = maxGen; g >= minGen; g--) {
    let label = "Generational Level";
    if (g === 4) label = "4th Generation (Great-Great-Grandfather / মূল প্রপিতামহ)";
    else if (g === 3) label = "3rd Generation (Great-Grandfather / প্রপিতামহ)";
    else if (g === 2) label = "2nd Generation (Grandfather / পিতামহ)";
    else if (g === 1) label = "1st Generation (Father / Paternal Uncles / পিতা ও কাকা)";
    else if (g === 0) label = "Applicant Generation (Self, Brothers & Cousins / আবেদনকারী)";
    else label = `Generation -${Math.abs(g)} (Children / সন্তানাদি)`;

    const levelNodes = nodes.filter((n) => n.generationLevel === g);
    if (levelNodes.length > 0) {
      generationGroups.push({ level: g, label, nodes: levelNodes });
    }
  }

  // Handle open edit
  const openEditModal = (node: LineageTreeNode) => {
    if (readOnly) return;
    setEditingNode(node);
    setModalMode("edit");
    setFormName(node.fullName);
    setFormRelation(node.relationshipCode || "FATHER");
    setFormGender(node.gender);
    setFormStatus(node.status);
    setFormAgeOrDob(node.approxDobOrAge || "");
    setFormVillage(node.villagePara);
    setFormDocRef(node.supportingDocRef || "");
    setFormRemarks(node.remarks || "");
    setFormIsCertHolder(Boolean(node.isCertificateHolder));
    setFormCertNo(node.casteCertDetails?.certNo || "");
    setFormSubCaste(node.casteCertDetails?.subCaste || "Namasudra");
    setFormIssueDate(node.casteCertDetails?.issueDate || "");
    setFormIssuingAuth(node.casteCertDetails?.issuingAuthority || "SDO Ranaghat, Nadia");
    setIsModalOpen(true);
  };

  // Open add parent
  const openAddParentModal = (childNode: LineageTreeNode) => {
    if (readOnly) return;
    setTargetNodeForRelation(childNode);
    setModalMode("add_parent");
    setEditingNode(null);
    setFormName("");
    setFormRelation("PAT_GRANDFATHER");
    setFormGender("Male");
    setFormStatus("Deceased");
    setFormAgeOrDob("");
    setFormVillage(childNode.villagePara);
    setFormDocRef("CS Khatian / Voter Roll 1971");
    setFormRemarks("");
    setFormIsCertHolder(false);
    setIsModalOpen(true);
  };

  // Open add sibling/collateral
  const openAddSiblingModal = (siblingNode: LineageTreeNode) => {
    if (readOnly) return;
    setTargetNodeForRelation(siblingNode);
    setModalMode("add_sibling");
    setEditingNode(null);
    setFormName("");
    setFormRelation(siblingNode.generationLevel === 1 ? "PAT_UNCLE_YOUNGER" : "BROTHER_FULL");
    setFormGender("Male");
    setFormStatus("Living");
    setFormAgeOrDob("");
    setFormVillage(siblingNode.villagePara);
    setFormDocRef("Aadhaar / Voter List");
    setFormRemarks("");
    setFormIsCertHolder(false);
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = () => {
    if (!formName.trim()) return;

    const matchedRule = PATERNAL_RELATIONSHIP_RULES.find((r) => r.code === formRelation);
    const relLabel = matchedRule ? matchedRule.labelEn : formRelation;

    if (modalMode === "edit" && editingNode) {
      const updated = nodes.map((n) => {
        if (n.id === editingNode.id) {
          return {
            ...n,
            fullName: formName.trim().toUpperCase(),
            relationshipCode: formRelation,
            relationshipToApplicant: relLabel,
            gender: formGender,
            status: formStatus,
            approxDobOrAge: formAgeOrDob.trim(),
            villagePara: formVillage.trim(),
            supportingDocRef: formDocRef.trim(),
            remarks: formRemarks.trim(),
            isCertificateHolder: formIsCertHolder,
            casteCertDetails: formIsCertHolder
              ? {
                  certNo: formCertNo.trim(),
                  subCaste: formSubCaste.trim(),
                  issueDate: formIssueDate.trim(),
                  issuingAuthority: formIssuingAuth.trim(),
                  state: "West Bengal",
                }
              : undefined,
          };
        }
        return n;
      });
      onNodesChange?.(updated);
    } else if (modalMode === "add_parent" && targetNodeForRelation) {
      // Add parent node at generationLevel + 1
      const newGen = targetNodeForRelation.generationLevel + 1;
      const newNodeId = `node_${Date.now()}`;
      const newNode: LineageTreeNode = {
        id: newNodeId,
        parentId: null,
        fullName: formName.trim().toUpperCase(),
        relationshipCode: formRelation,
        relationshipToApplicant: relLabel,
        generationLevel: newGen,
        gender: formGender,
        status: formStatus,
        approxDobOrAge: formAgeOrDob.trim(),
        villagePara: formVillage.trim(),
        supportingDocRef: formDocRef.trim(),
        remarks: formRemarks.trim(),
        verificationStatus: "Verified by Records",
        isCertificateHolder: formIsCertHolder,
        casteCertDetails: formIsCertHolder
          ? {
              certNo: formCertNo.trim(),
              subCaste: formSubCaste.trim(),
              issueDate: formIssueDate.trim(),
              issuingAuthority: formIssuingAuth.trim(),
              state: "West Bengal",
            }
          : undefined,
      };

      // Set target node's parentId to this new node
      const updated = nodes.map((n) => {
        if (n.id === targetNodeForRelation.id) {
          return { ...n, parentId: newNodeId };
        }
        return n;
      });
      updated.unshift(newNode);
      onNodesChange?.(updated);
    } else if (modalMode === "add_sibling" && targetNodeForRelation) {
      // Add sibling node at same generation level and same parentId
      const newNodeId = `node_${Date.now()}`;
      const newNode: LineageTreeNode = {
        id: newNodeId,
        parentId: targetNodeForRelation.parentId,
        fullName: formName.trim().toUpperCase(),
        relationshipCode: formRelation,
        relationshipToApplicant: relLabel,
        generationLevel: targetNodeForRelation.generationLevel,
        gender: formGender,
        status: formStatus,
        approxDobOrAge: formAgeOrDob.trim(),
        villagePara: formVillage.trim(),
        supportingDocRef: formDocRef.trim(),
        remarks: formRemarks.trim(),
        verificationStatus: "Verified by Records",
        isCertificateHolder: formIsCertHolder,
        casteCertDetails: formIsCertHolder
          ? {
              certNo: formCertNo.trim(),
              subCaste: formSubCaste.trim(),
              issueDate: formIssueDate.trim(),
              issuingAuthority: formIssuingAuth.trim(),
              state: "West Bengal",
            }
          : undefined,
      };
      const updated = [...nodes, newNode];
      onNodesChange?.(updated);
    }

    setIsModalOpen(false);
  };

  // Remove node
  const handleRemoveNode = (nodeId: string) => {
    if (readOnly) return;
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    if (target.isApplicant) {
      alert("Cannot delete the Applicant node.");
      return;
    }
    const updated = nodes.filter((n) => n.id !== nodeId);
    onNodesChange?.(updated);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch size={18} className="text-primary" />
            <h4 className="font-bold text-sm text-foreground">
              Recursive Paternal Vamshabriksha (পৈতৃক বংশলতিকা)
            </h4>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
              {nodes.length} Lineage Nodes
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Relational multi-generational graph linking the Applicant directly to the Paternal SC/ST Certificate Holder.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-muted rounded-xl border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "tree"
                  ? "bg-white text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Visual Flowchart
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-primary shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Structured Ledger
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE GRAPHICAL TREE */}
      {viewMode === "tree" && (
        <div className="space-y-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-50/50 to-white border border-border/80 shadow-2xs">
          {generationGroups.map((gen, idx) => (
            <div key={gen.level} className="relative space-y-3">
              {/* Generation Banner */}
              <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-primary" />
                  <span>{gen.label}</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Level {gen.level}</span>
              </div>

              {/* Node Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {gen.nodes.map((node) => {
                  const isCertHolder = Boolean(node.isCertificateHolder);
                  const isApplicant = Boolean(node.isApplicant);

                  return (
                    <div
                      key={node.id}
                      className={`relative p-4 rounded-xl border transition-all shadow-2xs ${
                        isCertHolder
                          ? "border-amber-400 bg-amber-50/70 shadow-amber-100"
                          : isApplicant
                          ? "border-blue-400 bg-blue-50/70 shadow-blue-100"
                          : "border-border/80 bg-white hover:border-primary/40"
                      }`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            isCertHolder
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : isApplicant
                              ? "bg-blue-100 text-blue-900 border-blue-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {node.relationshipToApplicant}
                        </Badge>

                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              node.status === "Living"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>
                      </div>

                      {/* Main Title & Identifiers */}
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          {isCertHolder && <Award size={15} className="text-amber-600 shrink-0" />}
                          {isApplicant && <User size={15} className="text-blue-600 shrink-0" />}
                          <span className="truncate">{node.fullName}</span>
                        </h5>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span>{node.gender}</span>
                          {node.approxDobOrAge && <span>• {node.approxDobOrAge}</span>}
                          <span>• {node.villagePara}</span>
                        </div>
                      </div>

                      {/* Certificate Holder Special Box */}
                      {isCertHolder && node.casteCertDetails && (
                        <div className="mt-2.5 p-2 rounded-lg bg-white/90 border border-amber-300/80 text-[10px] space-y-1 text-amber-950 font-mono">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1">
                              <ShieldCheck size={12} className="text-amber-700" />
                              SC/ST Certificate Holder
                            </span>
                            <span className="text-amber-800">{node.casteCertDetails.subCaste}</span>
                          </div>
                          <div>Cert No: <strong>{node.casteCertDetails.certNo}</strong></div>
                          <div>Issued: {node.casteCertDetails.issueDate} ({node.casteCertDetails.issuingAuthority})</div>
                        </div>
                      )}

                      {/* Supporting Document Reference */}
                      {node.supportingDocRef && (
                        <div className="mt-2 text-[10px] text-slate-600 bg-slate-100/70 p-1.5 rounded flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 shrink-0">Doc:</span>
                          <span className="truncate">{node.supportingDocRef}</span>
                        </div>
                      )}

                      {/* Action buttons (if not read-only) */}
                      {!readOnly && (
                        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1 flex-wrap text-xs">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] text-primary"
                              onClick={() => openEditModal(node)}
                            >
                              <Edit2 size={11} className="mr-1" /> Edit
                            </Button>
                            {!isApplicant && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-rose-600 hover:text-rose-700"
                                onClick={() => handleRemoveNode(node.id)}
                              >
                                <Trash2 size={11} />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {node.generationLevel >= 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-muted-foreground"
                                onClick={() => openAddParentModal(node)}
                              >
                                <Plus size={10} className="mr-0.5" /> Ancestor
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-1.5 text-[10px] text-muted-foreground"
                              onClick={() => openAddSiblingModal(node)}
                            >
                              <Plus size={10} className="mr-0.5" /> Sibling/Uncle
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Connecting Flow Arrow to Lower Generation */}
              {idx < generationGroups.length - 1 && (
                <div className="flex justify-center pt-2">
                  <div className="p-1 rounded-full bg-muted/80 text-muted-foreground border border-border">
                    <ArrowDown size={14} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: STRUCTURED RELATIONAL GRAPH LEDGER */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border/80 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Node / Name</th>
                <th className="py-2.5 px-3">Relationship</th>
                <th className="py-2.5 px-3">Gen Level</th>
                <th className="py-2.5 px-3">Status / Village</th>
                <th className="py-2.5 px-3">SC/ST Cert Holder</th>
                <th className="py-2.5 px-3">Supporting Evidence</th>
                {!readOnly && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-foreground">
              {nodes.map((n) => (
                <tr
                  key={n.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    n.isCertificateHolder ? "bg-amber-50/40" : n.isApplicant ? "bg-blue-50/40" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold">
                    <div className="flex items-center gap-1.5">
                      {n.isCertificateHolder && <Award size={13} className="text-amber-600 shrink-0" />}
                      {n.isApplicant && <User size={13} className="text-blue-600 shrink-0" />}
                      <span>{n.fullName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className="text-[10px] font-semibold">
                      {n.relationshipToApplicant}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px]">Level {n.generationLevel}</td>
                  <td className="py-2.5 px-3 text-[11px]">
                    <span className="font-medium">{n.status}</span>
                    <span className="text-muted-foreground block text-[10px]">{n.villagePara}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    {n.isCertificateHolder ? (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <ShieldCheck size={11} />
                        {n.casteCertDetails?.certNo || "Holder"}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-[10px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-muted-foreground max-w-xs truncate">
                    {n.supportingDocRef || "—"}
                  </td>
                  {!readOnly && (
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-primary"
                          onClick={() => openEditModal(n)}
                        >
                          <Edit2 size={12} />
                        </Button>
                        {!n.isApplicant && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-rose-600"
                            onClick={() => handleRemoveNode(n.id)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT / ADD MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              {modalMode === "edit"
                ? `Edit Family Tree Node: ${editingNode?.fullName}`
                : modalMode === "add_parent"
                ? `Add Direct Ancestor for ${targetNodeForRelation?.fullName}`
                : `Add Sibling / Collateral Relative`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <Label className="text-[11px]">Full Legal Name (as per documents)</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value.toUpperCase())}
                placeholder="e.g. SUBODH BISWAS"
                className="mt-1 h-8 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Relationship</Label>
                <Select value={formRelation} onValueChange={setFormRelation}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PATERNAL_RELATIONSHIP_RULES.map((r) => (
                      <SelectItem key={r.code} value={r.code} className="text-xs">
                        {r.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px]">Living Status</Label>
                <Select value={formStatus} onValueChange={(v) => setFormStatus(v as LivingStatus)}>
                  <SelectTrigger className="mt-1 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Living" className="text-xs">Living (জীবিত)</SelectItem>
                    <SelectItem value="Deceased" className="text-xs">Deceased (প্রয়াত)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Approx Age / Year of Birth</Label>
                <Input
                  value={formAgeOrDob}
                  onChange={(e) => setFormAgeOrDob(e.target.value)}
                  placeholder="e.g. 1966 or 59 Yrs"
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <Label className="text-[11px]">Village / Para</Label>
                <Input
                  value={formVillage}
                  onChange={(e) => setFormVillage(e.target.value)}
                  placeholder="e.g. Stationpara"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-[11px]">Supporting Document Reference</Label>
              <Input
                value={formDocRef}
                onChange={(e) => setFormDocRef(e.target.value)}
                placeholder="e.g. CS Khatian 142, Voter List 1971, Aadhaar Card"
                className="mt-1 h-8 text-xs"
              />
            </div>

            {/* Is SC/ST Certificate Holder Checkbox */}
            <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsCertHolder}
                  onChange={(e) => setFormIsCertHolder(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span className="font-bold text-[11px] text-amber-950">
                  This Relative Holds an Existing SC/ST Certificate
                </span>
              </label>

              {formIsCertHolder && (
                <div className="space-y-2 pt-1 border-t border-amber-200/60">
                  <div>
                    <Label className="text-[10px] text-amber-900">Certificate Number</Label>
                    <Input
                      value={formCertNo}
                      onChange={(e) => setFormCertNo(e.target.value)}
                      placeholder="e.g. WB/NAD/SC/2004/008741"
                      className="mt-0.5 h-7 text-xs bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-amber-900">Sub-caste</Label>
                      <Input
                        value={formSubCaste}
                        onChange={(e) => setFormSubCaste(e.target.value)}
                        placeholder="Namasudra"
                        className="mt-0.5 h-7 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-amber-900">Issuing Authority</Label>
                      <Input
                        value={formIssuingAuth}
                        onChange={(e) => setFormIssuingAuth(e.target.value)}
                        placeholder="SDO Ranaghat"
                        className="mt-0.5 h-7 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveModal}>
              Save Node
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
