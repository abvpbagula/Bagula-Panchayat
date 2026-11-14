import { describe, expect, it } from "vitest";
import {
  addChildNode,
  countFamilyNodes,
  createInitialFamilyTree,
  deleteNodeById,
  findNodeById,
  getTreeDepth,
  moveChildOrder,
  normalizeFamilyTree,
  translateTreePresets,
  updateNodeById,
} from "./treeOperations";

describe("familyTree treeOperations", () => {
  it("creates initial root node in requested language", () => {
    const bnTree = createInitialFamilyTree("হরেন বিশ্বাস", "WBE1234567", "bn");
    expect(bnTree.name).toBe("হরেন বিশ্বাস");
    expect(bnTree.voterId).toBe("WBE1234567");
    expect(bnTree.relationLabel).toBe("পরিবারের প্রধান");
    expect(bnTree.children).toEqual([]);

    const enTree = createInitialFamilyTree("Haren Biswas", "", "en");
    expect(enTree.relationLabel).toBe("Head of Family");
  });

  it("adds, updates, reorders, and deletes child nodes recursively without mutating original state", () => {
    const root = createInitialFamilyTree("Root Ancestor", "VOTER-1", "en");
    const withChild1 = addChildNode(root, root.id, {
      id: "child-1",
      name: "Eldest Child",
      relationLabel: "Eldest Son",
      spouseName: "Spouse 1",
      voterId: "VOTER-2",
    });
    const withChild2 = addChildNode(withChild1, root.id, {
      id: "child-2",
      name: "Second Child",
      relationLabel: "Second Son",
    });
    const withGrandchild = addChildNode(withChild2, "child-1", {
      id: "grand-1",
      name: "Grandchild One",
      relationLabel: "Grandson",
    });

    expect(root.children).toHaveLength(0);
    expect(countFamilyNodes(withGrandchild)).toBe(4);
    expect(getTreeDepth(withGrandchild)).toBe(3);

    const updated = updateNodeById(withGrandchild, "grand-1", {
      name: "Grandchild Updated",
      voterId: "VOTER-99",
    });
    expect(findNodeById(updated, "grand-1")?.name).toBe("Grandchild Updated");
    expect(findNodeById(updated, "grand-1")?.voterId).toBe("VOTER-99");

    const reordered = moveChildOrder(updated, root.id, "child-2", "up");
    expect(reordered.children.map((c) => c.id)).toEqual(["child-2", "child-1"]);

    // Attempting to delete root keeps root intact
    const afterRootDeleteAttempt = deleteNodeById(reordered, root.id);
    expect(countFamilyNodes(afterRootDeleteAttempt)).toBe(4);

    // Deleting child-1 removes its subtree
    const afterChildDelete = deleteNodeById(reordered, "child-1");
    expect(countFamilyNodes(afterChildDelete)).toBe(2);
    expect(findNodeById(afterChildDelete, "grand-1")).toBeNull();
  });

  it("translates known Bengali/English preset labels while preserving custom labels", () => {
    const root = createInitialFamilyTree("Subodh", "", "bn");
    const tree = addChildNode(
      addChildNode(root, root.id, {
        id: "c1",
        name: "Bikash",
        relationLabel: "বড় ছেলে",
      }),
      root.id,
      {
        id: "c2",
        name: "Custom Member",
        relationLabel: "দত্তক পুত্র",
      }
    );

    const translated = translateTreePresets(tree, "en");
    expect(translated.relationLabel).toBe("Head of Family");
    expect(translated.children[0].relationLabel).toBe("Eldest Son");
    expect(translated.children[1].relationLabel).toBe("দত্তক পুত্র");
  });

  it("normalizes partial or malformed JSON payloads safely", () => {
    const normalized = normalizeFamilyTree(
      {
        name: "Test Head",
        children: [{ name: "Child A" }],
      },
      "Fallback"
    );
    expect(normalized.id).toBeTruthy();
    expect(normalized.name).toBe("Test Head");
    expect(normalized.relationLabel).toBe("পরিবারের প্রধান");
    expect(normalized.children).toHaveLength(1);
    expect(normalized.children[0].children).toEqual([]);
  });
});
