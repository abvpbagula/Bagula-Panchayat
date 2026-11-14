import React, { useEffect } from "react";
import type { ApplicantInfo, LinkageDetails, LinkageParentElectoralRecord } from "@/modules/application/types";
import EpicParentLinkageForm from "@/modules/linkage/EpicParentLinkageForm";
import type { EpicParentLinkageData } from "@/modules/linkage/epicParentLinkageTypes";
import { EMPTY_EPIC_PARENT_LINKAGE } from "@/modules/linkage/epicParentLinkageTypes";

interface LinkageDetailsStepProps {
  value: LinkageDetails;
  applicant: ApplicantInfo;
  onChange: (value: LinkageDetails) => void;
  readOnly?: boolean;
}

export default function LinkageDetailsStep({
  value,
  applicant,
  onChange,
  readOnly = false,
}: LinkageDetailsStepProps) {
  // Ensure epicParentLinkage is initialized and populated with any applicant basics
  const currentLinkageData: EpicParentLinkageData = value.epicParentLinkage || {
    ...EMPTY_EPIC_PARENT_LINKAGE,
    applicantFullName: applicant?.name || "",
    villagePara: applicant?.village === "Other" ? applicant.villageManual : applicant?.village || "Bagula",
    postOffice: applicant?.postOffice || "Bagula",
    policeStation: applicant?.policeStation || "Hanskhali",
    block: applicant?.block || "Hanskhali",
    district: applicant?.district || "Nadia",
    pin: applicant?.pin || "741502",
    applicantEpicNo: applicant?.epicNo || "",
    mobile: applicant?.mobile || "",
    email: applicant?.email || "",
  };

  // Sync back to LinkageDetails (including parentElectoralRecords and spouseName for backward compatibility)
  const handleLinkageChange = (updated: EpicParentLinkageData) => {
    const parentRecords: LinkageParentElectoralRecord[] = [];

    const isFather = updated.linkFather || updated.linkageSelection === "father" || updated.linkageSelection === "both";
    const isMother = updated.linkMother || updated.linkageSelection === "mother" || updated.linkageSelection === "both";

    if (isFather) {
      parentRecords.push({
        name: updated.fatherElectoral?.fullName || updated.fatherName || "",
        relation: "Father",
        partNo: updated.fatherElectoral?.partNo || "",
        serialNo: updated.fatherElectoral?.serialNo || "",
        epicNo: updated.fatherElectoral?.epicNo || "",
        electoralRollYear: updated.fatherElectoral?.electoralRollYear || "Draft Electoral Roll 2025",
        assemblyConstituency: updated.fatherElectoral?.assemblyConstituency || "89 - Ranaghat (S.C.) North East Assembly Constituency",
      });
    }

    if (isMother) {
      parentRecords.push({
        name: updated.motherElectoral?.fullName || updated.motherName || "",
        relation: "Mother",
        partNo: updated.motherElectoral?.partNo || "",
        serialNo: updated.motherElectoral?.serialNo || "",
        epicNo: updated.motherElectoral?.epicNo || "",
        electoralRollYear: updated.motherElectoral?.electoralRollYear || "Draft Electoral Roll 2025",
        assemblyConstituency: updated.motherElectoral?.assemblyConstituency || "89 - Ranaghat (S.C.) North East Assembly Constituency",
      });
    }

    onChange({
      ...value,
      epicParentLinkage: updated,
      parentElectoralRecords: parentRecords,
      spouseName: updated.husbandName || value.spouseName,
      spouseRelationWording: "Wife of",
      applicantEpicNo: updated.applicantEpicNo || value.applicantEpicNo,
      assemblyConstituency: "89 - Ranaghat (S.C.) North East Assembly Constituency",
      targetAssemblyConstituency: "89 - Ranaghat (S.C.) North East Assembly Constituency",
    });
  };

  return (
    <div className="space-y-6">
      <EpicParentLinkageForm
        value={currentLinkageData}
        onChange={handleLinkageChange}
        readOnly={readOnly}
      />
    </div>
  );
}
