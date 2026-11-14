import { describe, expect, it } from "vitest";
import {
  applyWarishRelationChange,
  computeWarishCareOf,
  formatCareOf,
  splitCareOfString,
  validateWarishApplicantStep,
} from "./careOfRules";

describe("Warish Care-of Rules (careOfRules.ts)", () => {
  describe("formatCareOf(relation, parentName)", () => {
    it('returns "Late <parentName>" without embedding the relation in the text', () => {
      expect(formatCareOf("Son", "Gouranga Chakraborty")).toBe(
        "Late Gouranga Chakraborty",
      );
      expect(formatCareOf("Daughter", "Gouranga Chakraborty")).toBe(
        "Late Gouranga Chakraborty",
      );
      expect(formatCareOf("Wife", "Nityananda Biswas")).toBe(
        "Late Nityananda Biswas",
      );
      expect(formatCareOf("Husband", "Sabita Biswas")).toBe(
        "Late Sabita Biswas",
      );
    });

    it("supports single-argument formatCareOf(deceasedName) and strips duplicate Late", () => {
      expect(formatCareOf("Gouranga Chakraborty")).toBe(
        "Late Gouranga Chakraborty",
      );
      expect(formatCareOf("Son", "Late Gouranga Chakraborty")).toBe(
        "Late Gouranga Chakraborty",
      );
      expect(formatCareOf("Son", "   ")).toBe("");
    });
  });

  it('computes formatCareOf(deceased name) = "Late <deceased name>" and read-only mode when applicant is Son', () => {
    const res = computeWarishCareOf({
      relation: "Son",
      deceasedName: "Gouranga Chakraborty",
      applicantName: "Subhashis Chakraborty",
    });

    expect(res.mode).toBe("auto_applicant_from_deceased");
    expect(res.prefix).toBe("S/O");
    expect(res.applicantCareOf).toBe("Late Gouranga Chakraborty");
    expect(res.isApplicantCareOfReadOnly).toBe(true);
    expect(res.requiresDeceasedChildQuestion).toBe(false);
    expect(res.deceasedCareOf).toBe("");
    expect(res.isDeceasedCareOfReadOnly).toBe(false);
  });

  it('computes formatCareOf(deceased name) = "Late <deceased name>" when applicant is Daughter', () => {
    const res = computeWarishCareOf({
      relation: "Daughter",
      deceasedName: "Gouranga Chakraborty",
      applicantName: "Ananya Chakraborty",
    });

    expect(res.mode).toBe("auto_applicant_from_deceased");
    expect(res.prefix).toBe("D/O");
    expect(res.applicantCareOf).toBe("Late Gouranga Chakraborty");
    expect(res.isApplicantCareOfReadOnly).toBe(true);
  });

  it('computes formatCareOf(deceased name) = "Late <deceased name>" when applicant is Husband', () => {
    const res = computeWarishCareOf({
      relation: "Husband",
      deceasedName: "Sabita Biswas",
      applicantName: "Nityananda Biswas",
    });

    expect(res.mode).toBe("auto_applicant_from_deceased");
    expect(res.prefix).toBe("H/O");
    expect(res.applicantCareOf).toBe("Late Sabita Biswas");
    expect(res.isApplicantCareOfReadOnly).toBe(true);
  });

  it('computes formatCareOf(deceased name) = "Late <deceased name>" when applicant is Wife', () => {
    const res = computeWarishCareOf({
      relation: "Wife",
      deceasedName: "Nityananda Biswas",
      applicantName: "Sabita Biswas",
    });

    expect(res.mode).toBe("auto_applicant_from_deceased");
    expect(res.prefix).toBe("W/O");
    expect(res.applicantCareOf).toBe("Late Nityananda Biswas");
    expect(res.isApplicantCareOfReadOnly).toBe(true);
  });

  it('avoids duplicate "Late" if deceased name already starts with "Late"', () => {
    const res = computeWarishCareOf({
      relation: "Son",
      deceasedName: "Late Gouranga Chakraborty",
      applicantName: "Subhashis Chakraborty",
    });

    expect(res.applicantCareOf).toBe("Late Gouranga Chakraborty");
  });

  it("returns empty applicantCareOf when deceasedName is blank for Son/Daughter/Husband/Wife", () => {
    const res = computeWarishCareOf({
      relation: "Wife",
      deceasedName: "   ",
      applicantName: "Sabita Biswas",
    });

    expect(res.applicantCareOf).toBe("");
    expect(res.isApplicantCareOfReadOnly).toBe(true);
  });

  describe("Father and Mother relations", () => {
    it("asks if deceased is a son or daughter first before computing deceasedCareOf", () => {
      const initial = computeWarishCareOf({
        relation: "Father",
        deceasedName: "Ramesh Das",
        applicantName: "Haripada Das",
        deceasedChildRelation: "",
        manualApplicantCareOf: "Late Tarapada Das",
      });

      expect(initial.mode).toBe("auto_deceased_from_applicant");
      expect(initial.requiresDeceasedChildQuestion).toBe(true);
      expect(initial.deceasedCareOf).toBe("");
      expect(initial.isDeceasedCareOfReadOnly).toBe(true);
      expect(initial.isApplicantCareOfReadOnly).toBe(false);
      expect(initial.applicantCareOf).toBe("Late Tarapada Das");
    });

    it('sets deceasedCareOf to the applicant name without "Late" when Father selects Son', () => {
      const res = computeWarishCareOf({
        relation: "Father",
        deceasedName: "Ramesh Das",
        applicantName: "Haripada Das",
        deceasedChildRelation: "son",
        manualApplicantCareOf: "Late Tarapada Das",
      });

      expect(res.prefix).toBe("S/O");
      expect(res.deceasedCareOf).toBe("Haripada Das");
      expect(res.deceasedCareOf).not.toContain("Late");
      expect(res.isDeceasedCareOfReadOnly).toBe(true);
    });

    it('sets deceasedCareOf to the applicant name without "Late" when Mother selects Daughter', () => {
      const res = computeWarishCareOf({
        relation: "Mother",
        deceasedName: "Rina Das",
        applicantName: "Gita Das",
        deceasedChildRelation: "daughter",
        manualApplicantCareOf: "Haripada Das",
      });

      expect(res.prefix).toBe("D/O");
      expect(res.deceasedCareOf).toBe("Gita Das");
      expect(res.deceasedCareOf).not.toContain("Late");
      expect(res.isDeceasedCareOfReadOnly).toBe(true);
    });

    it('never puts "Late" before the applicant even if input starts with "Late"', () => {
      const res = computeWarishCareOf({
        relation: "Father",
        deceasedName: "Ramesh Das",
        applicantName: "Late Haripada Das",
        deceasedChildRelation: "son",
      });

      expect(res.deceasedCareOf).toBe("Haripada Das");
    });
  });

  describe("Brother, Sister, and other manual relations", () => {
    it.each(["Brother", "Sister", "Grandson", "Nephew", "Other Legal Heir"])(
      "uses manual editable applicantCareOf and no automatic deceasedCareOf for %s",
      (relation) => {
        const res = computeWarishCareOf({
          relation,
          deceasedName: "Gouranga Chakraborty",
          applicantName: "Bimal Chakraborty",
          manualApplicantCareOf: "Late Napal Chakraborty",
        });

        expect(res.mode).toBe("manual");
        expect(res.isApplicantCareOfReadOnly).toBe(false);
        expect(res.requiresDeceasedChildQuestion).toBe(false);
        expect(res.applicantCareOf).toBe("Late Napal Chakraborty");
        expect(res.deceasedCareOf).toBe("");
      },
    );
  });

  describe("Changing relation and deceased name afterwards", () => {
    it("recomputes at once when relation changes from Son to Daughter", () => {
      const first = computeWarishCareOf({
        relation: "Son",
        deceasedName: "Nityananda Biswas",
        applicantName: "Nitish Biswas",
      });
      expect(first.applicantCareOf).toBe("Late Nityananda Biswas");
      expect(first.prefix).toBe("S/O");

      const second = applyWarishRelationChange({
        nextRelation: "Daughter",
        deceasedName: "Nityananda Biswas",
        applicantName: "Nitish Biswas",
      });
      expect(second.applicantCareOf).toBe("Late Nityananda Biswas");
      expect(second.prefix).toBe("D/O");
    });

    it("clears old auto-filled applicantCareOf when changing from Son to Brother", () => {
      const first = computeWarishCareOf({
        relation: "Son",
        deceasedName: "Nityananda Biswas",
        applicantName: "Nitish Biswas",
      });
      expect(first.applicantCareOf).toBe("Late Nityananda Biswas");

      const second = applyWarishRelationChange({
        nextRelation: "Brother",
        deceasedName: "Nityananda Biswas",
        applicantName: "Nitish Biswas",
      });
      expect(second.mode).toBe("manual");
      expect(second.isApplicantCareOfReadOnly).toBe(false);
      expect(second.applicantCareOf).toBe("");
      expect(second.deceasedCareOf).toBe("");
    });

    it("clears old deceasedCareOf when changing from Father to Son or Brother", () => {
      const asFather = computeWarishCareOf({
        relation: "Father",
        deceasedName: "Ramesh Das",
        applicantName: "Haripada Das",
        deceasedChildRelation: "son",
        manualApplicantCareOf: "Late Tarapada Das",
      });
      expect(asFather.deceasedCareOf).toBe("Haripada Das");

      const toSon = applyWarishRelationChange({
        nextRelation: "Son",
        deceasedName: "Ramesh Das",
        applicantName: "Haripada Das",
      });
      expect(toSon.deceasedCareOf).toBe("");
      expect(toSon.requiresDeceasedChildQuestion).toBe(false);
      expect(toSon.applicantCareOf).toBe("Late Ramesh Das");

      const toBrother = applyWarishRelationChange({
        nextRelation: "Brother",
        deceasedName: "Ramesh Das",
        applicantName: "Haripada Das",
      });
      expect(toBrother.deceasedCareOf).toBe("");
      expect(toBrother.applicantCareOf).toBe("");
    });

    it("clears manual Care-of when changing between manual relations (Brother -> Sister)", () => {
      const next = applyWarishRelationChange({
        nextRelation: "Sister",
        deceasedName: "Ramesh Das",
        applicantName: "Anima Das",
      });
      expect(next.applicantCareOf).toBe("");
      expect(next.deceasedCareOf).toBe("");
    });

    it("recomputes applicantCareOf immediately when deceased name changes", () => {
      const initial = computeWarishCareOf({
        relation: "Wife",
        deceasedName: "Ramesh Das",
        applicantName: "Mala Das",
      });
      expect(initial.applicantCareOf).toBe("Late Ramesh Das");

      const updated = computeWarishCareOf({
        relation: "Wife",
        deceasedName: "Ramesh Chandra Das",
        applicantName: "Mala Das",
      });
      expect(updated.applicantCareOf).toBe("Late Ramesh Chandra Das");
    });

    it("recomputes deceasedCareOf immediately when applicant name changes for Father/Mother", () => {
      const initial = computeWarishCareOf({
        relation: "Mother",
        deceasedName: "Ramesh Das",
        applicantName: "Gita Das",
        deceasedChildRelation: "son",
      });
      expect(initial.deceasedCareOf).toBe("Gita Das");

      const updated = computeWarishCareOf({
        relation: "Mother",
        deceasedName: "Ramesh Das",
        applicantName: "Gita Rani Das",
        deceasedChildRelation: "son",
      });
      expect(updated.deceasedCareOf).toBe("Gita Rani Das");
    });
  });

  describe("splitCareOfString & validateWarishApplicantStep", () => {
    it("splits Care-of prefix and guardian name cleanly", () => {
      expect(splitCareOfString("H/O Late Sabita Biswas")).toEqual({
        relationType: "H/O",
        guardianName: "Late Sabita Biswas",
      });
      expect(splitCareOfString("Late Sabita Biswas")).toEqual({
        relationType: "",
        guardianName: "Late Sabita Biswas",
      });
    });

    it("reports every missing or invalid field for Warish Step 1", () => {
      const res = validateWarishApplicantStep({
        prefix: "",
        name: "",
        applicantRelation: "",
        deceasedName: "",
        careOf: "",
        village: "Other",
        postOffice: "",
        mobile: "12345",
      });

      expect(res.valid).toBe(false);
      expect(res.fieldErrors.prefix).toBeTruthy();
      expect(res.fieldErrors.name).toBeTruthy();
      expect(res.fieldErrors.applicantRelation).toBeTruthy();
      expect(res.fieldErrors.deceasedName).toBeTruthy();
      expect(res.fieldErrors.careOf).toBeTruthy();
      expect(res.fieldErrors.village).toBeTruthy();
      expect(res.fieldErrors.postOffice).toBeTruthy();
      expect(res.fieldErrors.mobile).toBeTruthy();
      expect(res.errors.length).toBeGreaterThanOrEqual(7);
    });

    it("blocks Next if Father/Mother has not answered whether deceased is son or daughter", () => {
      const res = validateWarishApplicantStep({
        prefix: "Shri",
        name: "Haripada Das",
        applicantRelation: "Father",
        deceasedName: "Ramesh Das",
        deceasedChildRelation: "",
        careOf: "Late Tarapada Das",
        village: "Bagula College Para",
        postOffice: "Bagula",
        mobile: "9832104567",
      });

      expect(res.valid).toBe(false);
      expect(res.fieldErrors.deceasedChildRelation).toBeTruthy();
    });

    it('blocks "Late" on applicant name and invalid mobile numbers', () => {
      const res = validateWarishApplicantStep({
        prefix: "Shri",
        name: "Late Haripada Das",
        applicantRelation: "Son",
        deceasedName: "Tarapada Das",
        village: "Bagula College Para",
        postOffice: "Bagula",
        mobile: "5832104567",
      });

      expect(res.valid).toBe(false);
      expect(res.fieldErrors.name).toContain("Late");
      expect(res.fieldErrors.mobile).toContain("10 digits");
    });

    it("passes validation when all required Warish Step 1 fields are valid", () => {
      const res = validateWarishApplicantStep({
        prefix: "Shri",
        name: "Subhashis Chakraborty",
        applicantRelation: "Son",
        deceasedName: "Gouranga Chakraborty",
        village: "Bagula College Para",
        postOffice: "Bagula",
        mobile: "9832104567",
      });

      expect(res.valid).toBe(true);
      expect(res.errors).toEqual([]);
    });
  });
});
