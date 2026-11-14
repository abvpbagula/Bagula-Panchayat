/**
 * MEMBER WARISH VERIFICATION & 45-DAY OBJECTION SERVICE
 * 
 * Statutory Workflow:
 * - 30 Elected Members (Ward 1 to 30) of Bagula 2 No Gram Panchayat.
 * - When an operator or applicant selects an elected member as the verifying member,
 *   a notification is dispatched to their official profile.
 * - The member has a statutory 45-day window to review the verification.
 * - If the member raises a concern / complaint:
 *     "I did not attend an enquiry and did not give any signature to anyone regarding this warish certificate."
 *   The certificate verification is flagged as "Disputed" and administrative action is triggered.
 * - If 45 days elapse without any claim/complaint, the certificate verification is
 *   automatically granted as approved!
 */

import { ELECTED_REPRESENTATIVES_DATA } from "./electedRepresentativesData";

export type VerificationNoticeStatus = 
  | "pending_enquiry" // within 45 days, awaiting member review
  | "acknowledged"    // member confirmed enquiry and signature
  | "disputed"        // member raised complaint within 45 days
  | "auto_approved";  // 45 days elapsed without complaint

export interface MemberWarishNotice {
  id: string;
  certificateId: string;
  memoNo: string;
  trackingNo: string;
  deceasedName: string;
  deceasedFatherHusband: string;
  village: string;
  postOffice: string;
  applicantName: string;
  applicantRelation: string;
  heirsCount: number;
  verifyingMemberId: number; // slNo 1 to 30
  verifyingMemberName: string;
  wardNumber: number; // 1 to 30
  sansadNo: string; // e.g. "I", "XI", "XXX"
  verificationType: "local_declaration" | "affidavit";
  noticeDate: string; // ISO date
  expiryDate: string; // noticeDate + 45 days
  status: VerificationNoticeStatus;
  complaint?: {
    filedAt: string;
    statement: string;
    detailedRemarks?: string;
    contactMobile?: string;
  };
  acknowledgement?: {
    acknowledgedAt: string;
    remarks?: string;
  };
  autoApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "bagula2gp_member_warish_notices_v1";

/**
 * Calculate 45-day statutory deadline from a start date
 */
export function calculate45DayExpiry(startDateIso: string): string {
  const d = new Date(startDateIso);
  d.setDate(d.getDate() + 45);
  return d.toISOString();
}

/**
 * Calculate remaining days out of 45-day window
 */
export function getRemainingDays(expiryDateIso: string): {
  daysLeft: number;
  isExpired: boolean;
  totalDays: number;
  elapsedDays: number;
} {
  const now = new Date().getTime();
  const expiry = new Date(expiryDateIso).getTime();
  const diffMs = expiry - now;
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  
  // 45 day window calculation
  const totalDays = 45;
  const elapsedDays = Math.min(45, Math.max(0, 45 - daysLeft));

  return {
    daysLeft: isExpired ? 0 : daysLeft,
    isExpired,
    totalDays,
    elapsedDays,
  };
}

/**
 * Generate Initial Seed Notices across the 30 members so representatives have active items
 */
function getInitialSeedNotices(): MemberWarishNotice[] {
  const today = new Date();
  
  // Notice 1: Ward 1 (Nandini Biswas) - 12 days ago (33 days remaining)
  const date1 = new Date(today);
  date1.setDate(date1.getDate() - 12);
  
  // Notice 2: Ward 5 (Ujjal Biswas) - 46 days ago (Expired -> Auto Approved!)
  const date2 = new Date(today);
  date2.setDate(date2.getDate() - 46);

  // Notice 3: Ward 11 (Susmita Biswas Barman - Prodhan) - 5 days ago (40 days remaining)
  const date3 = new Date(today);
  date3.setDate(date3.getDate() - 5);

  // Notice 4: Ward 17 (Iti Majumder) - 20 days ago (Disputed by member)
  const date4 = new Date(today);
  date4.setDate(date4.getDate() - 20);

  // Notice 5: Ward 30 (Manoranjan Bhowmick - Upa Prodhan) - 15 days ago (Acknowledged)
  const date5 = new Date(today);
  date5.setDate(date5.getDate() - 15);

  // Notice 6: Ward 2 (Kusum Bairagi) - 8 days ago
  const date6 = new Date(today);
  date6.setDate(date6.getDate() - 8);

  return [
    {
      id: "notif-w01-4501",
      certificateId: "cert-4501",
      memoNo: "4501/BGL-II/2026",
      trackingNo: "WARISH-2026-0891",
      deceasedName: "Nityananda Biswas",
      deceasedFatherHusband: "Late Sarat Chandra Biswas",
      village: "Milannagar Purba",
      postOffice: "Bagula",
      applicantName: "Sabita Biswas",
      applicantRelation: "Wife",
      heirsCount: 5,
      verifyingMemberId: 1,
      verifyingMemberName: "NANDINI BISWAS",
      wardNumber: 1,
      sansadNo: "I",
      verificationType: "local_declaration",
      noticeDate: date1.toISOString(),
      expiryDate: calculate45DayExpiry(date1.toISOString()),
      status: "pending_enquiry",
      createdAt: date1.toISOString(),
      updatedAt: date1.toISOString(),
    },
    {
      id: "notif-w05-4420",
      certificateId: "cert-4420",
      memoNo: "4420/BGL-II/2026",
      trackingNo: "WARISH-2026-0712",
      deceasedName: "Tarapada Mondal",
      deceasedFatherHusband: "Late Haripada Mondal",
      village: "Muragacha Colony",
      postOffice: "Muragacha Colony",
      applicantName: "Dipankar Mondal",
      applicantRelation: "Son",
      heirsCount: 3,
      verifyingMemberId: 5,
      verifyingMemberName: "UJJAL BISWAS",
      wardNumber: 5,
      sansadNo: "V",
      verificationType: "local_declaration",
      noticeDate: date2.toISOString(),
      expiryDate: calculate45DayExpiry(date2.toISOString()),
      status: "auto_approved",
      autoApprovedAt: calculate45DayExpiry(date2.toISOString()),
      createdAt: date2.toISOString(),
      updatedAt: date2.toISOString(),
    },
    {
      id: "notif-w11-4550",
      certificateId: "cert-4550",
      memoNo: "4550/BGL-II/2026",
      trackingNo: "WARISH-2026-0944",
      deceasedName: "Bhabatosh Barman",
      deceasedFatherHusband: "Late Khagendra Nath Barman",
      village: "Bagula Station Para",
      postOffice: "Bagula",
      applicantName: "Purnima Barman",
      applicantRelation: "Wife",
      heirsCount: 4,
      verifyingMemberId: 11,
      verifyingMemberName: "SUSMITA BISWAS BARMAN",
      wardNumber: 11,
      sansadNo: "XI",
      verificationType: "affidavit",
      noticeDate: date3.toISOString(),
      expiryDate: calculate45DayExpiry(date3.toISOString()),
      status: "pending_enquiry",
      createdAt: date3.toISOString(),
      updatedAt: date3.toISOString(),
    },
    {
      id: "notif-w17-4488",
      certificateId: "cert-4488",
      memoNo: "4488/BGL-II/2026",
      trackingNo: "WARISH-2026-0810",
      deceasedName: "Amal Majumder",
      deceasedFatherHusband: "Late Jogesh Majumder",
      village: "Santinagar",
      postOffice: "Santinagar",
      applicantName: "Subrata Majumder",
      applicantRelation: "Son",
      heirsCount: 2,
      verifyingMemberId: 17,
      verifyingMemberName: "ITI MAJUMDER",
      wardNumber: 17,
      sansadNo: "XVII",
      verificationType: "local_declaration",
      noticeDate: date4.toISOString(),
      expiryDate: calculate45DayExpiry(date4.toISOString()),
      status: "disputed",
      complaint: {
        filedAt: new Date(date4.getTime() + 3 * 24 * 3600 * 1000).toISOString(),
        statement: "I did not attend an enquiry and did not give any signature to anyone regarding this warish certificate.",
        detailedRemarks: "The applicant did not meet me or the Ward Committee. Local inquiry not verified by me.",
        contactMobile: "8967961203",
      },
      createdAt: date4.toISOString(),
      updatedAt: date4.toISOString(),
    },
    {
      id: "notif-w30-4495",
      certificateId: "cert-4495",
      memoNo: "4495/BGL-II/2026",
      trackingNo: "WARISH-2026-0833",
      deceasedName: "Kartick Bhowmick",
      deceasedFatherHusband: "Late Monomohan Bhowmick",
      village: "Madna",
      postOffice: "Bagula",
      applicantName: "Anjali Bhowmick",
      applicantRelation: "Wife",
      heirsCount: 3,
      verifyingMemberId: 30,
      verifyingMemberName: "MANORANJAN BHOWMICK",
      wardNumber: 30,
      sansadNo: "XXX",
      verificationType: "local_declaration",
      noticeDate: date5.toISOString(),
      expiryDate: calculate45DayExpiry(date5.toISOString()),
      status: "acknowledged",
      acknowledgement: {
        acknowledgedAt: new Date(date5.getTime() + 2 * 24 * 3600 * 1000).toISOString(),
        remarks: "Field inquiry conducted personally on site with local neighbours. Signature confirmed.",
      },
      createdAt: date5.toISOString(),
      updatedAt: date5.toISOString(),
    },
    {
      id: "notif-w02-4520",
      certificateId: "cert-4520",
      memoNo: "4520/BGL-II/2026",
      trackingNo: "WARISH-2026-0902",
      deceasedName: "Gopal Bairagi",
      deceasedFatherHusband: "Late Radha Raman Bairagi",
      village: "Milannagar East",
      postOffice: "Bagula",
      applicantName: "Sunil Bairagi",
      applicantRelation: "Son",
      heirsCount: 4,
      verifyingMemberId: 2,
      verifyingMemberName: "KUSUM BAIRAGI",
      wardNumber: 2,
      sansadNo: "II",
      verificationType: "local_declaration",
      noticeDate: date6.toISOString(),
      expiryDate: calculate45DayExpiry(date6.toISOString()),
      status: "pending_enquiry",
      createdAt: date6.toISOString(),
      updatedAt: date6.toISOString(),
    }
  ];
}

class MemberWarishVerificationService {
  private notices: MemberWarishNotice[] = [];
  private listeners: Array<() => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.notices = JSON.parse(raw);
      } else {
        this.notices = getInitialSeedNotices();
        this.saveToStorage();
      }
    } catch {
      this.notices = getInitialSeedNotices();
    }
    // Perform auto-approval check on load
    this.processAutoApprovals();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notices));
    } catch (err) {
      console.error("Failed to save member warish notices to storage:", err);
    }
    this.notifyListeners();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Process Auto-Approvals for any notice where 45 days have elapsed without dispute
   */
  public processAutoApprovals(): number {
    let count = 0;
    const now = new Date();

    this.notices = this.notices.map((n) => {
      if (n.status === "pending_enquiry") {
        const expiry = new Date(n.expiryDate);
        if (now >= expiry) {
          count++;
          return {
            ...n,
            status: "auto_approved" as VerificationNoticeStatus,
            autoApprovedAt: n.expiryDate,
            updatedAt: now.toISOString(),
          };
        }
      }
      return n;
    });

    if (count > 0) {
      this.saveToStorage();
    }
    return count;
  }

  /**
   * Register a new Warish verification notice when an operator or applicant selects a member
   */
  public registerNotice(params: {
    certificateId: string;
    memoNo?: string;
    trackingNo?: string;
    deceasedName: string;
    deceasedFatherHusband?: string;
    village?: string;
    postOffice?: string;
    applicantName: string;
    applicantRelation?: string;
    heirsCount?: number;
    verifyingMemberId?: number;
    verifyingMemberName: string;
    wardNumber?: number;
    verificationType?: "local_declaration" | "affidavit";
  }): MemberWarishNotice {
    // Find representative in 30 member list
    const rep = ELECTED_REPRESENTATIVES_DATA.find(
      (m) =>
        (params.verifyingMemberId && m.slNo === params.verifyingMemberId) ||
        (params.wardNumber && m.wardNumber === params.wardNumber) ||
        m.name.trim().toLowerCase() === params.verifyingMemberName.trim().toLowerCase()
    ) || ELECTED_REPRESENTATIVES_DATA[0];

    const now = new Date();
    const noticeDate = now.toISOString();
    const expiryDate = calculate45DayExpiry(noticeDate);

    const notice: MemberWarishNotice = {
      id: `notif-w${String(rep.wardNumber).padStart(2, "0")}-${Date.now().toString().slice(-4)}`,
      certificateId: params.certificateId,
      memoNo: params.memoNo || `PENDING/BGL-II/${now.getFullYear()}`,
      trackingNo: params.trackingNo || `WARISH-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      deceasedName: params.deceasedName,
      deceasedFatherHusband: params.deceasedFatherHusband || "—",
      village: params.village || rep.address || "Bagula",
      postOffice: params.postOffice || "Bagula",
      applicantName: params.applicantName,
      applicantRelation: params.applicantRelation || "Legal Heir",
      heirsCount: params.heirsCount || 1,
      verifyingMemberId: rep.slNo,
      verifyingMemberName: rep.name,
      wardNumber: rep.wardNumber,
      sansadNo: rep.sansadNo,
      verificationType: params.verificationType || "local_declaration",
      noticeDate,
      expiryDate,
      status: "pending_enquiry",
      createdAt: noticeDate,
      updatedAt: noticeDate,
    };

    this.notices.unshift(notice);
    this.saveToStorage();
    return notice;
  }

  /**
   * Member raises a dispute / complaint:
   * "I did not attend an enquiry and did not give any signature to anyone regarding warish certificate"
   */
  public raiseDispute(
    noticeId: string,
    complaintData: {
      statement?: string;
      detailedRemarks?: string;
      contactMobile?: string;
    }
  ): MemberWarishNotice | null {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) return null;

    const now = new Date().toISOString();
    notice.status = "disputed";
    notice.complaint = {
      filedAt: now,
      statement:
        complaintData.statement ||
        "I did not attend an enquiry and did not give any signature to anyone regarding this warish certificate.",
      detailedRemarks: complaintData.detailedRemarks || "",
      contactMobile: complaintData.contactMobile || "",
    };
    notice.updatedAt = now;

    this.saveToStorage();
    return notice;
  }

  /**
   * Member explicitly acknowledges that they conducted field inquiry and gave signature
   */
  public acknowledgeNotice(noticeId: string, remarks?: string): MemberWarishNotice | null {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) return null;

    const now = new Date().toISOString();
    notice.status = "acknowledged";
    notice.acknowledgement = {
      acknowledgedAt: now,
      remarks: remarks || "I have conducted field verification in my ward and attested this succession declaration.",
    };
    notice.updatedAt = now;

    this.saveToStorage();
    return notice;
  }

  /**
   * Get all notices
   */
  public getAllNotices(): MemberWarishNotice[] {
    this.processAutoApprovals();
    return [...this.notices];
  }

  /**
   * Get notices for a specific member by slNo (1 to 30) or wardNumber
   */
  public getNoticesByMember(memberIdOrWard: number): MemberWarishNotice[] {
    this.processAutoApprovals();
    return this.notices.filter(
      (n) => n.verifyingMemberId === memberIdOrWard || n.wardNumber === memberIdOrWard
    );
  }

  /**
   * Get statistics for a specific member
   */
  public getMemberStats(memberIdOrWard: number) {
    const items = this.getNoticesByMember(memberIdOrWard);
    return {
      total: items.length,
      pending: items.filter((n) => n.status === "pending_enquiry").length,
      acknowledged: items.filter((n) => n.status === "acknowledged").length,
      disputed: items.filter((n) => n.status === "disputed").length,
      autoApproved: items.filter((n) => n.status === "auto_approved").length,
    };
  }

  /**
   * Overall GP statistics
   */
  public getGlobalStats() {
    this.processAutoApprovals();
    return {
      total: this.notices.length,
      pending: this.notices.filter((n) => n.status === "pending_enquiry").length,
      acknowledged: this.notices.filter((n) => n.status === "acknowledged").length,
      disputed: this.notices.filter((n) => n.status === "disputed").length,
      autoApproved: this.notices.filter((n) => n.status === "auto_approved").length,
    };
  }
}

export const memberWarishVerificationService = new MemberWarishVerificationService();
