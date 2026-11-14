export type TrackerStatus = "fulfilled" | "in_progress" | "under_review" | "scheduled" | "stalled";

export type TrackerCategory =
  | "all"
  | "certificates"
  | "civil_registration"
  | "revenue_tax"
  | "infrastructure"
  | "water_sanitation"
  | "governance_it"
  | "welfare_livelihood";

export interface TrackerMilestone {
  id: string;
  date: string;
  title: string;
  titleBn?: string;
  description: string;
  descriptionBn?: string;
  documentRef?: string;
  statusTag: "completed" | "in_progress" | "planned";
}

export interface TrackerInitiative {
  id: string;
  slug: string;
  title: string;
  titleBn: string;
  category: TrackerCategory;
  categoryLabel: string;
  categoryLabelBn: string;
  status: TrackerStatus;
  statusLabel: string;
  statusLabelBn: string;
  verbatimPromiseEn: string;
  verbatimPromiseBn: string;
  officialMemoNo: string;
  resolutionDate: string;
  targetArea: string;
  targetAreaBn: string;
  department: string;
  departmentBn: string;
  progressPercent: number;
  lastUpdated: string;
  timeline: TrackerMilestone[];
  verificationLink?: string;
  applyLink?: string;
  externalNoticeLink?: string;
  officialNotes?: string;
  officialNotesBn?: string;
  citizenReportsCount: number;
}

export interface TrackerUpdateEvent {
  id: string;
  initiativeId: string;
  initiativeTitle: string;
  date: string;
  status: TrackerStatus;
  type: "official_milestone" | "camp_notice" | "circular" | "inspection" | "citizen_report";
  headline: string;
  headlineBn: string;
  memoNo?: string;
  details: string;
  detailsBn: string;
}

export interface CitizenTrackerSubmission {
  id: string;
  initiativeId: string;
  citizenName: string;
  wardNumber: string;
  mobile?: string;
  claimStatus: TrackerStatus;
  details: string;
  evidenceMemoOrPhotoNote?: string;
  submittedAt: string;
}
