import { FAMILY_RELATION_PRESETS, getPresetLabel, translateKnownRelationLabel } from "./presets";
import { FamilyNode, FamilyTreeLanguage } from "./types";

let fallbackCounter = 0;

export function createFamilyNodeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `node_${crypto.randomUUID()}`;
  }
  fallbackCounter += 1;
  return `node_${Date.now()}_${fallbackCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createInitialFamilyTree(
  headName = "",
  headVoterId = "",
  language: FamilyTreeLanguage = "bn"
): FamilyNode {
  const headPreset = FAMILY_RELATION_PRESETS[0];
  return {
    id: createFamilyNodeId(),
    name: headName,
    spouseName: "",
    voterId: headVoterId,
    relationLabel: getPresetLabel(headPreset, language),
    children: [],
  };
}

export function findNodeById(root: FamilyNode, targetId: string): FamilyNode | null {
  if (root.id === targetId) return root;
  for (const child of root.children) {
    const found = findNodeById(child, targetId);
    if (found) return found;
  }
  return null;
}

export function updateNodeById(
  root: FamilyNode,
  targetId: string,
  patch: Partial<Omit<FamilyNode, "id" | "children">>
): FamilyNode {
  if (root.id === targetId) {
    return {
      ...root,
      ...patch,
    };
  }
  if (root.children.length === 0) return root;
  return {
    ...root,
    children: root.children.map((child) => updateNodeById(child, targetId, patch)),
  };
}

export function addChildNode(
  root: FamilyNode,
  parentId: string,
  childInput: Omit<FamilyNode, "id" | "children"> & { id?: string; children?: FamilyNode[] }
): FamilyNode {
  const newChild: FamilyNode = {
    id: childInput.id || createFamilyNodeId(),
    name: childInput.name,
    spouseName: childInput.spouseName?.trim() ? childInput.spouseName : undefined,
    voterId: childInput.voterId?.trim() ? childInput.voterId : undefined,
    relationLabel: childInput.relationLabel,
    children: childInput.children ?? [],
  };

  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, newChild],
    };
  }

  return {
    ...root,
    children: root.children.map((child) => addChildNode(child, parentId, newChild)),
  };
}

export function deleteNodeById(root: FamilyNode, targetId: string): FamilyNode {
  // Root node cannot be deleted
  if (root.id === targetId) return root;
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== targetId)
      .map((child) => deleteNodeById(child, targetId)),
  };
}

export function moveChildOrder(
  root: FamilyNode,
  parentId: string,
  childId: string,
  direction: "up" | "down"
): FamilyNode {
  if (root.id === parentId) {
    const idx = root.children.findIndex((c) => c.id === childId);
    if (idx === -1) return root;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= root.children.length) return root;

    const nextChildren = [...root.children];
    const [moved] = nextChildren.splice(idx, 1);
    nextChildren.splice(swapIdx, 0, moved);
    return { ...root, children: nextChildren };
  }

  return {
    ...root,
    children: root.children.map((child) => moveChildOrder(child, parentId, childId, direction)),
  };
}

export function countFamilyNodes(root: FamilyNode): number {
  return 1 + root.children.reduce((acc, child) => acc + countFamilyNodes(child), 0);
}

export function getTreeDepth(root: FamilyNode): number {
  if (root.children.length === 0) return 1;
  return 1 + Math.max(...root.children.map((child) => getTreeDepth(child)));
}

export function translateTreePresets(
  root: FamilyNode,
  targetLanguage: FamilyTreeLanguage
): FamilyNode {
  return {
    ...root,
    relationLabel: translateKnownRelationLabel(root.relationLabel, targetLanguage),
    children: root.children.map((child) => translateTreePresets(child, targetLanguage)),
  };
}

export function collectAllNodes(root: FamilyNode): FamilyNode[] {
  return [root, ...root.children.flatMap((child) => collectAllNodes(child))];
}

export function normalizeFamilyTree(raw: unknown, fallbackHeadName = ""): FamilyNode {
  if (!raw || typeof raw !== "object") {
    return createInitialFamilyTree(fallbackHeadName);
  }
  const obj = raw as Record<string, unknown>;
  const rawChildren = Array.isArray(obj.children) ? obj.children : [];

  return {
    id: typeof obj.id === "string" && obj.id.trim() ? obj.id : createFamilyNodeId(),
    name: typeof obj.name === "string" ? obj.name : fallbackHeadName,
    spouseName: typeof obj.spouseName === "string" && obj.spouseName.trim() ? obj.spouseName : undefined,
    voterId: typeof obj.voterId === "string" && obj.voterId.trim() ? obj.voterId : undefined,
    relationLabel:
      typeof obj.relationLabel === "string" && obj.relationLabel.trim()
        ? obj.relationLabel
        : "পরিবারের প্রধান",
    children: rawChildren.map((c) => normalizeFamilyTree(c)),
  };
}
