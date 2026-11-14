import React, { useState, useMemo } from "react";
import {
  GitBranch,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  Award,
  User,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  CornerDownRight,
  Info,
  Calendar,
  MapPin,
  FileText,
  Heart,
  HeartOff,
} from "lucide-react";
import {
  LineageTreeNode,
  LineageGender,
  LivingStatus,
  NodeVerificationStatus,
} from "@/types/scStLineageTypes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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

export interface RecursiveFamilyTreeProps {
  nodes: LineageTreeNode[];
  onNodesChange?: (updatedNodes: LineageTreeNode[]) => void;
  readOnly?: boolean;
  className?: string;
  applicantName?: string;
}

// Hierarchical representation for true recursive rendering
interface HierarchyNode extends LineageTreeNode {
  children: HierarchyNode[];
}

export const RecursiveFamilyTree: React.FC<RecursiveFamilyTreeProps> = ({
  nodes,
  onNodesChange,
  readOnly = false,
  className = "",
  applicantName,
}) => {
  const [viewMode, setViewMode] = useState<"tree" | "ladder" | "table">("tree");
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

  // Modal State for adding/editing nodes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<
    "add_ancestor" | "add_child" | "add_sibling" | "edit" | "quick_add"
  >("add_child");
  const [targetNode, setTargetNode] = useState<LineageTreeNode | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formRelationCode, setFormRelationCode] = useState("PAT_GREAT_GRANDFATHER");
  const [formStatus, setFormStatus] = useState<LivingStatus>("Deceased");
  const [formGender, setFormGender] = useState<LineageGender>("Male");
  const [formVillage, setFormVillage] = useState("Bagula");
  const [formAgeOrDob, setFormAgeOrDob] = useState("");
  const [formDocRef, setFormDocRef] = useState("Land Khatian / 1971 Voter List");
  const [formRemarks, setFormRemarks] = useState("");
  const [formIsCertHolder, setFormIsCertHolder] = useState(false);
  const [formCertNo, setFormCertNo] = useState("");
  const [formSubCaste, setFormSubCaste] = useState("Namasudra");
  const [formIssueDate, setFormIssueDate] = useState("");
  const [formIssuingAuth, setFormIssuingAuth] = useState("SDO Ranaghat, Nadia");

  // Toggle Collapse
  const toggleCollapse = (id: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Build recursive hierarchical tree
  const hierarchyRoots = useMemo<HierarchyNode[]>(() => {
    const nodeMap = new Map<string, HierarchyNode>();
    nodes.forEach((n) => {
      nodeMap.set(n.id, { ...n, children: [] });
    });

    const roots: HierarchyNode[] = [];
    nodes.forEach((n) => {
      const current = nodeMap.get(n.id)!;
      if (n.parentId && nodeMap.has(n.parentId)) {
        nodeMap.get(n.parentId)!.children.push(current);
      } else {
        roots.push(current);
      }
    });

    // Sort roots and children by generation level descending (oldest ancestor first)
    const sortTree = (list: HierarchyNode[]) => {
      list.sort((a, b) => b.generationLevel - a.generationLevel);
      list.forEach((item) => sortTree(item.children));
    };
    sortTree(roots);

    return roots;
  }, [nodes]);

  // Open Add Ancestor Modal (e.g. Great-Grandparent above Grandparent)
  const handleOpenAddAncestor = (childNode?: LineageTreeNode) => {
    if (readOnly) return;
    const baseNode = childNode || nodes[0];
    setTargetNode(baseNode || null);
    setModalMode("add_ancestor");

    const targetGen = baseNode ? baseNode.generationLevel + 1 : 3;
    let defaultRel = "PAT_GREAT_GRANDFATHER";
    if (targetGen === 2) defaultRel = "PAT_GRANDFATHER";
    else if (targetGen === 3) defaultRel = "PAT_GREAT_GRANDFATHER";
    else if (targetGen >= 4) defaultRel = "PAT_GREAT_GREAT_GRANDFATHER";

    setFormName("");
    setFormRelationCode(defaultRel);
    setFormStatus("Deceased");
    setFormGender("Male");
    setFormVillage(baseNode?.villagePara || "Bagula");
    setFormAgeOrDob("");
    setFormDocRef("1971 Electoral Roll / CS Khatian");
    setFormRemarks("Paternal root ancestor verified from ancestral records.");
    setFormIsCertHolder(false);
    setIsModalOpen(true);
  };

  // Open Add Child Modal
  const handleOpenAddChild = (parentNode: LineageTreeNode) => {
    if (readOnly) return;
    setTargetNode(parentNode);
    setModalMode("add_child");

    const childGen = Math.max(0, parentNode.generationLevel - 1);
    let defaultRel = "FATHER";
    if (childGen === 2) defaultRel = "PAT_GRANDFATHER";
    else if (childGen === 1) defaultRel = "FATHER";
    else if (childGen === 0) defaultRel = "BROTHER_FULL";

    setFormName("");
    setFormRelationCode(defaultRel);
    setFormStatus(childGen === 0 ? "Living" : "Living");
    setFormGender("Male");
    setFormVillage(parentNode.villagePara);
    setFormAgeOrDob("");
    setFormDocRef("Aadhaar / School Admit Card");
    setFormRemarks("");
    setFormIsCertHolder(false);
    setIsModalOpen(true);
  };

  // Open Add Sibling Modal
  const handleOpenAddSibling = (siblingNode: LineageTreeNode) => {
    if (readOnly) return;
    setTargetNode(siblingNode);
    setModalMode("add_sibling");

    let defaultRel = "PAT_UNCLE_YOUNGER";
    if (siblingNode.generationLevel === 0) defaultRel = "BROTHER_FULL";
    else if (siblingNode.generationLevel === 1) defaultRel = "PAT_UNCLE_YOUNGER";
    else if (siblingNode.generationLevel === 2) defaultRel = "PAT_GRANDFATHER";

    setFormName("");
    setFormRelationCode(defaultRel);
    setFormStatus("Living");
    setFormGender("Male");
    setFormVillage(siblingNode.villagePara);
    setFormAgeOrDob("");
    setFormDocRef("Aadhaar / Voter List");
    setFormRemarks("");
    setFormIsCertHolder(false);
    setIsModalOpen(true);
  };

  // Open Quick Add with Presets (Great-Grandparent, Grandparent, Father, Applicant)
  const handleOpenQuickAdd = (preset: "great_grandparent" | "grandparent" | "father" | "applicant") => {
    if (readOnly) return;
    setModalMode("quick_add");
    setTargetNode(null);

    if (preset === "great_grandparent") {
      setFormName("");
      setFormRelationCode("PAT_GREAT_GRANDFATHER");
      setFormStatus("Deceased");
      setFormGender("Male");
      setFormVillage("Bagula");
      setFormAgeOrDob("");
      setFormDocRef("CS/RS Khatian / Pre-1971 Voter List");
      setFormRemarks("Paternal Great-Grandfather (প্রপিতামহ) - Gen Level 3");
      setFormIsCertHolder(false);
    } else if (preset === "grandparent") {
      setFormName("");
      setFormRelationCode("PAT_GRANDFATHER");
      setFormStatus("Deceased");
      setFormGender("Male");
      setFormVillage("Bagula");
      setFormAgeOrDob("");
      setFormDocRef("1971 Electoral Roll Extract");
      setFormRemarks("Paternal Grandfather (পিতামহ) - Gen Level 2");
      setFormIsCertHolder(false);
    } else if (preset === "father") {
      setFormName("");
      setFormRelationCode("FATHER");
      setFormStatus("Living");
      setFormGender("Male");
      setFormVillage("Bagula");
      setFormAgeOrDob("");
      setFormDocRef("Aadhaar Card / EPIC Voter Card");
      setFormRemarks("Biological Father (পিতা) - Gen Level 1");
      setFormIsCertHolder(false);
    } else {
      setFormName(applicantName || "");
      setFormRelationCode("SELF");
      setFormStatus("Living");
      setFormGender("Male");
      setFormVillage("Bagula");
      setFormAgeOrDob("");
      setFormDocRef("Madhyamik Admit / Aadhaar");
      setFormRemarks("Self / Applicant (আবেদনকারী) - Gen Level 0");
      setFormIsCertHolder(false);
    }

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (node: LineageTreeNode) => {
    if (readOnly) return;
    setTargetNode(node);
    setModalMode("edit");

    setFormName(node.fullName);
    setFormRelationCode(node.relationshipCode || "FATHER");
    setFormStatus(node.status);
    setFormGender(node.gender);
    setFormVillage(node.villagePara);
    setFormAgeOrDob(node.approxDobOrAge || "");
    setFormDocRef(node.supportingDocRef || "");
    setFormRemarks(node.remarks || "");
    setFormIsCertHolder(Boolean(node.isCertificateHolder));
    setFormCertNo(node.casteCertDetails?.certNo || "");
    setFormSubCaste(node.casteCertDetails?.subCaste || "Namasudra");
    setFormIssueDate(node.casteCertDetails?.issueDate || "");
    setFormIssuingAuth(node.casteCertDetails?.issuingAuthority || "SDO Ranaghat, Nadia");

    setIsModalOpen(true);
  };

  // Save Modal Action
  const handleSaveModal = () => {
    if (!formName.trim()) return;

    const matchedRule = PATERNAL_RELATIONSHIP_RULES.find((r) => r.code === formRelationCode);
    const relLabel = matchedRule ? matchedRule.labelEn : formRelationCode;
    const ruleGenOffset = matchedRule?.generationalOffset ?? 1;

    if (modalMode === "edit" && targetNode) {
      const updated = nodes.map((n) => {
        if (n.id === targetNode.id) {
          return {
            ...n,
            fullName: formName.trim().toUpperCase(),
            relationshipCode: formRelationCode,
            relationshipToApplicant: relLabel,
            status: formStatus,
            gender: formGender,
            villagePara: formVillage.trim(),
            approxDobOrAge: formAgeOrDob.trim(),
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
    } else if (modalMode === "add_ancestor" && targetNode) {
      // Add ancestor above target node
      const newGen = targetNode.generationLevel + 1;
      const newNodeId = `node_anc_${Date.now()}`;
      const newNode: LineageTreeNode = {
        id: newNodeId,
        parentId: null,
        fullName: formName.trim().toUpperCase(),
        relationshipCode: formRelationCode,
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
        if (n.id === targetNode.id) {
          return { ...n, parentId: newNodeId };
        }
        return n;
      });
      updated.unshift(newNode);
      onNodesChange?.(updated);
    } else if (modalMode === "add_child" && targetNode) {
      // Add child under target node
      const newGen = Math.max(0, targetNode.generationLevel - 1);
      const newNodeId = `node_ch_${Date.now()}`;
      const isApplicantNode = formRelationCode === "SELF";

      const newNode: LineageTreeNode = {
        id: newNodeId,
        parentId: targetNode.id,
        fullName: formName.trim().toUpperCase(),
        relationshipCode: formRelationCode,
        relationshipToApplicant: relLabel,
        generationLevel: newGen,
        gender: formGender,
        status: formStatus,
        approxDobOrAge: formAgeOrDob.trim(),
        villagePara: formVillage.trim(),
        supportingDocRef: formDocRef.trim(),
        remarks: formRemarks.trim(),
        verificationStatus: "Verified by Records",
        isApplicant: isApplicantNode,
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
    } else if (modalMode === "add_sibling" && targetNode) {
      // Add sibling under the same parent
      const newNodeId = `node_sib_${Date.now()}`;
      const newNode: LineageTreeNode = {
        id: newNodeId,
        parentId: targetNode.parentId,
        fullName: formName.trim().toUpperCase(),
        relationshipCode: formRelationCode,
        relationshipToApplicant: relLabel,
        generationLevel: targetNode.generationLevel,
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
    } else if (modalMode === "quick_add") {
      // Quick add based on generational offset
      const determinedGen = ruleGenOffset;
      const newNodeId = `node_qa_${Date.now()}`;
      const isApplicantNode = formRelationCode === "SELF";

      // Find appropriate parent if any
      let potentialParentId: string | null = null;
      if (determinedGen === 0) {
        // Applicant or Brother: find father node if exists
        const fatherNode = nodes.find((n) => n.generationLevel === 1 && n.gender === "Male");
        if (fatherNode) potentialParentId = fatherNode.id;
      } else if (determinedGen === 1) {
        // Father or Uncle: find grandfather node if exists
        const gfNode = nodes.find((n) => n.generationLevel === 2 && n.gender === "Male");
        if (gfNode) potentialParentId = gfNode.id;
      } else if (determinedGen === 2) {
        // Grandfather: find great-grandfather if exists
        const ggfNode = nodes.find((n) => n.generationLevel === 3 && n.gender === "Male");
        if (ggfNode) potentialParentId = ggfNode.id;
      }

      const newNode: LineageTreeNode = {
        id: newNodeId,
        parentId: potentialParentId,
        fullName: formName.trim().toUpperCase(),
        relationshipCode: formRelationCode,
        relationshipToApplicant: relLabel,
        generationLevel: determinedGen,
        gender: formGender,
        status: formStatus,
        approxDobOrAge: formAgeOrDob.trim(),
        villagePara: formVillage.trim(),
        supportingDocRef: formDocRef.trim(),
        remarks: formRemarks.trim(),
        verificationStatus: "Verified by Records",
        isApplicant: isApplicantNode,
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

      // If this is a parent for existing orphan nodes of child generation, link them
      let updated = [...nodes, newNode];
      if (determinedGen === 1) {
        // If applicant has no parent, link applicant to this father
        updated = updated.map((n) => {
          if (n.generationLevel === 0 && !n.parentId) {
            return { ...n, parentId: newNodeId };
          }
          return n;
        });
      } else if (determinedGen === 2) {
        // If father has no parent, link father to this grandfather
        updated = updated.map((n) => {
          if (n.generationLevel === 1 && !n.parentId) {
            return { ...n, parentId: newNodeId };
          }
          return n;
        });
      } else if (determinedGen === 3) {
        // If grandfather has no parent, link grandfather to this great-grandfather
        updated = updated.map((n) => {
          if (n.generationLevel === 2 && !n.parentId) {
            return { ...n, parentId: newNodeId };
          }
          return n;
        });
      }

      onNodesChange?.(updated);
    }

    setIsModalOpen(false);
  };

  // Delete Node
  const handleDeleteNode = (nodeId: string) => {
    if (readOnly) return;
    const target = nodes.find((n) => n.id === nodeId);
    if (!target) return;
    if (target.isApplicant) {
      alert("Statutory Protection: The primary Applicant node cannot be deleted.");
      return;
    }

    // Re-link children of deleted node to deleted node's parent to keep continuity
    const updated = nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => {
        if (n.parentId === nodeId) {
          return { ...n, parentId: target.parentId };
        }
        return n;
      });

    onNodesChange?.(updated);
  };

  // Quick Status Toggle (Living <-> Deceased)
  const handleToggleStatus = (nodeId: string) => {
    if (readOnly) return;
    const updated = nodes.map((n) => {
      if (n.id === nodeId) {
        const nextStatus: LivingStatus = n.status === "Living" ? "Deceased" : "Living";
        return { ...n, status: nextStatus };
      }
      return n;
    });
    onNodesChange?.(updated);
  };

  // Render a Single Recursive Node & its Child Subtree
  const renderRecursiveSubtree = (item: HierarchyNode, depth: number = 0) => {
    const isCollapsed = collapsedNodeIds.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isCertHolder = Boolean(item.isCertificateHolder);
    const isApplicant = Boolean(item.isApplicant);

    // Generation label
    let genBadgeText = `Level ${item.generationLevel}`;
    if (item.generationLevel === 3) genBadgeText = "Gen 3 · Great-Grandparent (প্রপিতামহ)";
    else if (item.generationLevel === 2) genBadgeText = "Gen 2 · Grandparent (পিতামহ)";
    else if (item.generationLevel === 1) genBadgeText = "Gen 1 · Father/Uncle (পিতা/কাকা)";
    else if (item.generationLevel === 0) genBadgeText = "Gen 0 · Applicant/Brother (আবেদনকারী)";

    return (
      <div key={item.id} className="relative pl-4 sm:pl-7 my-2.5">
        {/* Left Vertical Tree Guide Line */}
        {depth > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-700"
            style={{ left: "12px" }}
          />
        )}

        {/* Horizontal Connector Arm */}
        {depth > 0 && (
          <div
            className="absolute top-6 h-px bg-slate-300 dark:bg-slate-700"
            style={{ left: "12px", width: "16px" }}
          />
        )}

        {/* NODE CARD */}
        <div
          className={`relative p-3.5 sm:p-4 rounded-xl border transition-all duration-150 ${
            isCertHolder
              ? "border-amber-400 bg-amber-50/75 shadow-xs"
              : isApplicant
              ? "border-blue-400 bg-blue-50/75 shadow-xs"
              : "border-border/80 bg-card hover:border-primary/40 shadow-2xs"
          }`}
        >
          {/* Top Bar: Generation Badge + Status + Collapse Toggle */}
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  item.generationLevel === 3
                    ? "bg-purple-100 text-purple-900 border-purple-300"
                    : item.generationLevel === 2
                    ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                    : item.generationLevel === 1
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-blue-100 text-blue-900 border-blue-300"
                }`}
              >
                {genBadgeText}
              </Badge>

              <Badge
                variant="outline"
                className={`text-[10px] font-semibold ${
                  isCertHolder
                    ? "bg-amber-200 text-amber-950 border-amber-400 font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {item.relationshipToApplicant}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Quick Status Toggle Button */}
              <button
                type="button"
                onClick={() => handleToggleStatus(item.id)}
                disabled={readOnly}
                title="Click to toggle Living / Deceased"
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                  item.status === "Living"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                }`}
              >
                {item.status === "Living" ? (
                  <Heart size={11} className="text-emerald-600 fill-emerald-600" />
                ) : (
                  <HeartOff size={11} className="text-slate-500" />
                )}
                <span>{item.status}</span>
              </button>

              {/* Collapse / Expand Button */}
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleCollapse(item.id)}
                  className="w-6 h-6 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground flex items-center justify-center text-xs"
                  title={isCollapsed ? "Expand Branch" : "Collapse Branch"}
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Main Info Row: Full Name & Primary Attributes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <h5 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                {isCertHolder && <Award size={17} className="text-amber-600 shrink-0" />}
                {isApplicant && <User size={17} className="text-blue-600 shrink-0" />}
                <span className="uppercase tracking-tight truncate">{item.fullName}</span>
              </h5>

              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {item.relationshipToApplicant}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-muted-foreground" />
                  {item.villagePara || "Bagula"}
                </span>
                {item.approxDobOrAge && (
                  <>
                    <span>•</span>
                    <span>Approx. {item.approxDobOrAge}</span>
                  </>
                )}
              </div>
            </div>

            {/* Cert Holder Badge if present */}
            {isCertHolder && item.casteCertDetails && (
              <div className="p-2 rounded-lg bg-amber-100/80 border border-amber-300 text-[11px] text-amber-950 font-mono self-start sm:self-auto">
                <div className="flex items-center gap-1 font-bold text-amber-900">
                  <ShieldCheck size={13} className="text-amber-700" />
                  <span>SC Cert: {item.casteCertDetails.certNo}</span>
                </div>
                <div className="text-[10px] text-amber-800">
                  Sub-caste: {item.casteCertDetails.subCaste} · SDO: {item.casteCertDetails.issuingAuthority}
                </div>
              </div>
            )}
          </div>

          {/* Supporting Evidence Doc Reference */}
          {item.supportingDocRef && (
            <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 p-1.5 rounded-lg flex items-center gap-1.5">
              <FileText size={12} className="text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Document Proof:</span>
              <span className="truncate">{item.supportingDocRef}</span>
            </div>
          )}

          {/* ACTION BUTTONS TOOLBAR (Only in Edit Mode) */}
          {!readOnly && (
            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-1 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs font-semibold gap-1"
                  onClick={() => handleOpenEdit(item)}
                >
                  <Edit3 size={12} className="text-primary" />
                  <span>Edit</span>
                </Button>

                {!isApplicant && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleDeleteNode(item.id)}
                    title="Delete this node"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>

              {/* Dynamic Branching Actions: Add Ancestor / Add Child / Add Sibling */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.generationLevel < 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 gap-1"
                    onClick={() => handleOpenAddAncestor(item)}
                    title="Add parent or ancestor above this node"
                  >
                    <ArrowUp size={12} />
                    <span>+ Ancestor</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 gap-1"
                  onClick={() => handleOpenAddChild(item)}
                  title="Add child or descendant under this node"
                >
                  <ArrowDown size={12} />
                  <span>+ Child</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 gap-1"
                  onClick={() => handleOpenAddSibling(item)}
                  title="Add brother / sibling on same generation level"
                >
                  <CornerDownRight size={12} />
                  <span>+ Sibling</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* RECURSIVE RENDER OF CHILD NODES */}
        {!isCollapsed && hasChildren && (
          <div className="space-y-2 mt-1">
            {item.children.map((child) => renderRecursiveSubtree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Group nodes by generation for Ladder view
  const maxGen = Math.max(...nodes.map((n) => n.generationLevel), 0);
  const minGen = Math.min(...nodes.map((n) => n.generationLevel), 0);
  const generationGroups: { level: number; label: string; nodes: LineageTreeNode[] }[] = [];
  for (let g = Math.max(3, maxGen); g >= minGen; g--) {
    let label = `Generation Level ${g}`;
    if (g === 3) label = "Level 3: Great-Grandparent Generation (প্রপিতামহ)";
    else if (g === 2) label = "Level 2: Grandparent Generation (পিতামহ)";
    else if (g === 1) label = "Level 1: Father / Paternal Uncle Generation (পিতা ও কাকা)";
    else if (g === 0) label = "Level 0: Applicant, Brother & Paternal Cousins (আবেদনকারী)";

    const levelNodes = nodes.filter((n) => n.generationLevel === g);
    generationGroups.push({ level: g, label, nodes: levelNodes });
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {/* TOP BAR: HEADER + QUICK ADD PRESETS + VIEW TOGGLE */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <GitBranch size={20} className="text-primary" />
              <h4 className="font-bold text-base text-foreground">
                Recursive Paternal Vamshabriksha (পৈতৃক বংশলতিকা)
              </h4>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                {nodes.length} Nodes Loaded
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Dynamic multi-generational tree tracing from <strong>Great-Grandparent (Gen 3)</strong> down to the <strong>Applicant (Gen 0)</strong> under the WB SC/ST Act, 1994.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-muted rounded-xl border border-border/60 text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "tree"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Recursive Branches
            </button>
            <button
              type="button"
              onClick={() => setViewMode("ladder")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "ladder"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Generational Ladder
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === "table"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tabular Ledger
            </button>
          </div>
        </div>

        {/* QUICK ADD GENERATIONAL PRESETS TOOLBAR */}
        {!readOnly && (
          <div className="p-3 bg-muted/40 rounded-xl border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                <span>Quick Add Generational Node (Great-Grandparent to Applicant):</span>
              </span>
              <span className="text-[11px] text-muted-foreground">Click to add with statutory defaults</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenQuickAdd("great_grandparent")}
                className="h-8 text-xs bg-card border-purple-300 hover:bg-purple-50 text-purple-950 font-semibold gap-1 justify-start truncate"
              >
                <Plus size={13} className="text-purple-600" />
                <span className="truncate">+ Great-Grandparent (প্রপিতামহ)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenQuickAdd("grandparent")}
                className="h-8 text-xs bg-card border-indigo-300 hover:bg-indigo-50 text-indigo-950 font-semibold gap-1 justify-start truncate"
              >
                <Plus size={13} className="text-indigo-600" />
                <span className="truncate">+ Grandparent (পিতামহ)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenQuickAdd("father")}
                className="h-8 text-xs bg-card border-emerald-300 hover:bg-emerald-50 text-emerald-950 font-semibold gap-1 justify-start truncate"
              >
                <Plus size={13} className="text-emerald-600" />
                <span className="truncate">+ Father / Uncle (পিতা/কাকা)</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenQuickAdd("applicant")}
                className="h-8 text-xs bg-card border-blue-300 hover:bg-blue-50 text-blue-950 font-semibold gap-1 justify-start truncate"
              >
                <Plus size={13} className="text-blue-600" />
                <span className="truncate">+ Applicant / Brother (আবেদনকারী)</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: RECURSIVE TREE BRANCH VIEW */}
      {viewMode === "tree" && (
        <div className="p-4 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
            <span>
              Showing recursive descent tree from root ancestor(s) down to biological offspring.
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>SC Cert Holder</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Applicant</span>
              </span>
            </div>
          </div>

          {hierarchyRoots.length === 0 ? (
            <div className="text-center py-10 space-y-2 text-muted-foreground">
              <GitBranch size={32} className="mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold">No lineage nodes added yet.</p>
              <p className="text-xs">Use the Quick Add toolbar above to create your family tree nodes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {hierarchyRoots.map((root) => renderRecursiveSubtree(root, 0))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: GENERATIONAL LADDER VIEW */}
      {viewMode === "ladder" && (
        <div className="space-y-4">
          {generationGroups.map((group) => (
            <div
              key={group.level}
              className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
                  <Layers size={14} className="text-primary" />
                  <span>{group.label}</span>
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {group.nodes.length} {group.nodes.length === 1 ? "Person" : "Persons"}
                </span>
              </div>

              {group.nodes.length === 0 ? (
                <div className="text-xs text-muted-foreground italic py-2 flex items-center justify-between">
                  <span>No nodes recorded in this generation level yet.</span>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (group.level === 3) handleOpenQuickAdd("great_grandparent");
                        else if (group.level === 2) handleOpenQuickAdd("grandparent");
                        else if (group.level === 1) handleOpenQuickAdd("father");
                        else handleOpenQuickAdd("applicant");
                      }}
                      className="h-7 text-xs text-primary font-bold gap-1"
                    >
                      <Plus size={12} />
                      <span>Add Node to Level {group.level}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.nodes.map((node) => {
                    const isCertHolder = Boolean(node.isCertificateHolder);
                    const isApplicant = Boolean(node.isApplicant);

                    return (
                      <div
                        key={node.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCertHolder
                            ? "border-amber-400 bg-amber-50/70"
                            : isApplicant
                            ? "border-blue-400 bg-blue-50/70"
                            : "border-border/80 bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <Badge variant="outline" className="text-[10px] font-bold">
                            {node.relationshipToApplicant}
                          </Badge>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                              node.status === "Living"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {node.status}
                          </span>
                        </div>

                        <h5 className="font-bold text-sm text-foreground uppercase truncate">
                          {node.fullName}
                        </h5>

                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {node.villagePara} {node.approxDobOrAge ? `• ${node.approxDobOrAge}` : ""}
                        </p>

                        {isCertHolder && (
                          <div className="mt-2 text-[10px] font-mono font-bold text-amber-900 bg-amber-100 p-1.5 rounded">
                            Cert No: {node.casteCertDetails?.certNo || "Attached"}
                          </div>
                        )}

                        {!readOnly && (
                          <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-xs text-primary font-bold"
                              onClick={() => handleOpenEdit(node)}
                            >
                              Edit
                            </Button>
                            {!isApplicant && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-xs text-rose-600 hover:text-rose-700"
                                onClick={() => handleDeleteNode(node.id)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* VIEW 3: TABULAR LEDGER VIEW */}
      {viewMode === "table" && (
        <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs overflow-x-auto space-y-3">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left font-bold text-foreground">
                <th className="py-2.5 px-3">Generation</th>
                <th className="py-2.5 px-3">Full Legal Name</th>
                <th className="py-2.5 px-3">Relationship to Applicant</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Village / Para</th>
                <th className="py-2.5 px-3">SC Cert / Evidence Proof</th>
                {!readOnly && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {[...nodes]
                .sort((a, b) => b.generationLevel - a.generationLevel)
                .map((node) => (
                  <tr
                    key={node.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                      node.isCertificateHolder
                        ? "bg-amber-50/50 font-semibold"
                        : node.isApplicant
                        ? "bg-blue-50/50 font-semibold"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-3 font-mono font-bold text-muted-foreground">
                      Level {node.generationLevel}
                    </td>
                    <td className="py-2 px-3 font-bold uppercase text-foreground">
                      {node.fullName} {node.isApplicant && "(APPLICANT)"} {node.isCertificateHolder && "(CERT HOLDER)"}
                    </td>
                    <td className="py-2 px-3">{node.relationshipToApplicant}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          node.status === "Living"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {node.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{node.villagePara}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {node.isCertificateHolder
                        ? `Cert: ${node.casteCertDetails?.certNo || "Attached"}`
                        : node.supportingDocRef || "Ancestral Record"}
                    </td>
                    {!readOnly && (
                      <td className="py-2 px-3 text-right space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-xs text-primary"
                          onClick={() => handleOpenEdit(node)}
                        >
                          Edit
                        </Button>
                        {!node.isApplicant && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs text-rose-600"
                            onClick={() => handleDeleteNode(node.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DYNAMIC NODE ADD/EDIT DIALOG WITH MANDATORY FIELDS: NAME, RELATIONSHIP, STATUS */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <GitBranch size={18} className="text-primary" />
              <span>
                {modalMode === "edit"
                  ? "Edit Family Tree Node"
                  : modalMode === "add_ancestor"
                  ? "Add Paternal Ancestor (Great-Grandparent / Grandparent)"
                  : modalMode === "add_child"
                  ? "Add Child / Descendant"
                  : modalMode === "add_sibling"
                  ? "Add Sibling / Collateral Relative"
                  : "Quick Add Family Member"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Enter relative particulars for the official Bagula II GP Gram Sansad Vamshabriksha verification record.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 1. MANDATORY FIELD: NAME */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                <span>Full Legal Name (পূর্ণ নাম) *</span>
                <span className="text-[10px] text-muted-foreground">Uppercase Enforced</span>
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value.toUpperCase())}
                placeholder="e.g. HARIPADA BISWAS"
                className="h-9 text-xs font-bold uppercase"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter name matching ancestral land records (Khatian), 1971 electoral roll, or Aadhaar.
              </p>
            </div>

            {/* 2. MANDATORY FIELD: RELATIONSHIP */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">
                Relationship to Applicant (আবেদনকারীর সাথে সম্পর্ক) *
              </Label>
              <Select value={formRelationCode} onValueChange={setFormRelationCode}>
                <SelectTrigger className="h-9 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {PATERNAL_RELATIONSHIP_RULES.map((rule) => (
                    <SelectItem key={rule.code} value={rule.code} className="text-xs">
                      {rule.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Must trace an agnatic paternal bloodline under Section 5 of the WB SC/ST Act, 1994.
              </p>
            </div>

            {/* 3. MANDATORY FIELD: STATUS (LIVING / DECEASED) */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-foreground">
                Living Status (বর্তমান অবস্থা) *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormStatus("Living")}
                  className={`h-9 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    formStatus === "Living"
                      ? "bg-emerald-100 border-emerald-400 text-emerald-950 shadow-xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Heart size={14} className={formStatus === "Living" ? "text-emerald-600 fill-emerald-600" : ""} />
                  <span>Living (জীবিত)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormStatus("Deceased")}
                  className={`h-9 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    formStatus === "Deceased"
                      ? "bg-slate-200 border-slate-400 text-slate-950 shadow-xs"
                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <HeartOff size={14} className={formStatus === "Deceased" ? "text-slate-700" : ""} />
                  <span>Deceased (প্রয়াত)</span>
                </button>
              </div>
            </div>

            {/* ADDITIONAL ATTRIBUTES: GENDER & VILLAGE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Gender</Label>
                <Select
                  value={formGender}
                  onValueChange={(v) => setFormGender(v as LineageGender)}
                >
                  <SelectTrigger className="mt-1 h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male" className="text-xs">Male (পুরুষ)</SelectItem>
                    <SelectItem value="Female" className="text-xs">Female (মহিলা)</SelectItem>
                    <SelectItem value="Other" className="text-xs">Other (অন্যান্য)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Village / Para</Label>
                <Input
                  value={formVillage}
                  onChange={(e) => setFormVillage(e.target.value)}
                  placeholder="e.g. Bagula Stationpara"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* AGE / DOB & SUPPORTING DOCUMENT */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Approx. Age or Birth Year</Label>
                <Input
                  value={formAgeOrDob}
                  onChange={(e) => setFormAgeOrDob(e.target.value)}
                  placeholder="e.g. 1952 or 72 Yrs"
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <div>
                <Label className="text-[11px]">Supporting Document Reference</Label>
                <Input
                  value={formDocRef}
                  onChange={(e) => setFormDocRef(e.target.value)}
                  placeholder="e.g. 1971 Voter List / Land Khatian"
                  className="mt-1 h-8 text-xs"
                />
              </div>
            </div>

            {/* SC/ST CERTIFICATE HOLDER TOGGLE */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground text-xs">
                <input
                  type="checkbox"
                  checked={formIsCertHolder}
                  onChange={(e) => setFormIsCertHolder(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="flex items-center gap-1 text-amber-950">
                  <Award size={14} className="text-amber-600" />
                  <span>Is this person the Existing SC/ST Certificate Holder?</span>
                </span>
              </label>

              {formIsCertHolder && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60">
                  <div>
                    <Label className="text-[10px] text-amber-900 font-bold">SC Certificate Number</Label>
                    <Input
                      value={formCertNo}
                      onChange={(e) => setFormCertNo(e.target.value)}
                      placeholder="WB/NAD/SC/2004/..."
                      className="mt-1 h-8 text-xs font-mono font-bold bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-amber-900 font-bold">Sub-caste on Cert</Label>
                    <Input
                      value={formSubCaste}
                      onChange={(e) => setFormSubCaste(e.target.value)}
                      placeholder="Namasudra"
                      className="mt-1 h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-amber-900 font-bold">Date of Issue</Label>
                    <Input
                      value={formIssueDate}
                      onChange={(e) => setFormIssueDate(e.target.value)}
                      placeholder="2004-11-20"
                      className="mt-1 h-8 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-amber-900 font-bold">Issuing Authority</Label>
                    <Input
                      value={formIssuingAuth}
                      onChange={(e) => setFormIssuingAuth(e.target.value)}
                      placeholder="SDO Ranaghat, Nadia"
                      className="mt-1 h-8 text-xs bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveModal}
              disabled={!formName.trim()}
              className="bg-primary text-primary-foreground font-bold text-xs"
            >
              {modalMode === "edit" ? "Save Changes" : "Add to Family Tree"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
