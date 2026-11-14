export type PageSizePreset = 'a4' | 'a5' | 'a3' | 'letter' | 'legal' | 'custom';
export type PageOrientation = 'portrait' | 'landscape';
export type ScaleMode = 'actual' | 'fit' | 'custom';

export interface PageDimensionInfo {
  width: number;
  height: number;
  label: string;
}

export const PAGE_PRESET_DIMENSIONS: Record<Exclude<PageSizePreset, 'custom'>, PageDimensionInfo> = {
  a4: { width: 210.0, height: 297.0, label: "A4 (210 × 297 mm)" },
  a5: { width: 148.0, height: 210.0, label: "A5 (148 × 210 mm)" },
  a3: { width: 297.0, height: 420.0, label: "A3 (297 × 420 mm)" },
  letter: { width: 215.9, height: 279.4, label: "Letter (215.9 × 279.4 mm)" },
  legal: { width: 215.9, height: 355.6, label: "Legal (215.9 × 355.6 mm)" },
};

export interface CertificateHeaderConfig {
  showEmblem: boolean;
  showTricolor: boolean;
  fontSize: number;
  subTitleSize: number;
  officeTitle?: string;
}

export interface CertificateTitleConfig {
  fontSize: number;
  color: string;
  underline: boolean;
  customTitle?: string;
}

export interface CertificateBodyConfig {
  fontSize: number;
  lineHeight: number;
  textAlign?: "left" | "justify" | "center";
}

export interface CertificateTableConfig {
  fontSize: number;
  cellPaddingMm: number;
  showBorders?: boolean;
}

export interface CertificateSignaturesConfig {
  showWardMember: boolean;
  showProdhan: boolean;
  showUpaProdhan: boolean;
  showSealBox: boolean;
  sealBoxSizeMm?: number;
}

export interface CertificateWatermarkConfig {
  enabled: boolean;
  text: string;
  opacity: number;
  angle?: number;
}

export interface CertificateFooterConfig {
  showQrCode: boolean;
  showVerificationMemo: boolean;
  fontSize: number;
}

export interface CertificateElementsConfig {
  header: CertificateHeaderConfig;
  title: CertificateTitleConfig;
  body: CertificateBodyConfig;
  table: CertificateTableConfig;
  signatures: CertificateSignaturesConfig;
  watermark: CertificateWatermarkConfig;
  footer: CertificateFooterConfig;
}

export type CertificateKind = 'warish' | 'dependent' | 'linkage';

export interface CertificateTemplateConfig {
  id?: string;
  serviceKind: CertificateKind;
  name: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'active' | 'retired';
  isActive: boolean;
  pageSizePreset: PageSizePreset;
  pageWidthMm: number;
  pageHeightMm: number;
  orientation: PageOrientation;
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  marginsLinked: boolean;
  headerDistanceMm: number;
  footerDistanceMm: number;
  scaleMode: ScaleMode;
  scalePercent: number;
  elementsConfig: CertificateElementsConfig;
  templateAssetUrl?: string | null;
  templateAssetName?: string | null;
  revisionNumber?: number;
  createdByName?: string;
  updatedAt?: string;
  updatedByName?: string;
  activatedAt?: string | null;
}

export const DEFAULT_ELEMENTS_CONFIG: CertificateElementsConfig = {
  header: {
    showEmblem: true,
    showTricolor: true,
    fontSize: 22,
    subTitleSize: 12,
    officeTitle: "BAGULA II GRAM PANCHAYAT",
  },
  title: {
    fontSize: 18,
    color: "#1A237E",
    underline: true,
  },
  body: {
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  table: {
    fontSize: 11,
    cellPaddingMm: 2,
    showBorders: true,
  },
  signatures: {
    showWardMember: true,
    showProdhan: true,
    showUpaProdhan: true,
    showSealBox: true,
    sealBoxSizeMm: 25,
  },
  watermark: {
    enabled: true,
    text: "BAGULA II GRAM PANCHAYAT",
    opacity: 0.07,
    angle: -30,
  },
  footer: {
    showQrCode: true,
    showVerificationMemo: true,
    fontSize: 10,
  },
};

export const DEFAULT_TEMPLATE_CONFIGS: Record<CertificateKind, CertificateTemplateConfig> = {
  warish: {
    serviceKind: 'warish',
    name: 'Official Warish Certificate Template',
    version: 1,
    status: 'active',
    isActive: true,
    pageSizePreset: 'a4',
    pageWidthMm: 210.0,
    pageHeightMm: 297.0,
    orientation: 'portrait',
    marginTopMm: 18.0,
    marginBottomMm: 18.0,
    marginLeftMm: 16.0,
    marginRightMm: 16.0,
    marginsLinked: false,
    headerDistanceMm: 10.0,
    footerDistanceMm: 10.0,
    scaleMode: 'fit',
    scalePercent: 100.0,
    elementsConfig: { ...DEFAULT_ELEMENTS_CONFIG },
    revisionNumber: 1,
    createdByName: 'Super Admin',
  },
  dependent: {
    serviceKind: 'dependent',
    name: 'Official Dependent Certificate Template',
    version: 1,
    status: 'active',
    isActive: true,
    pageSizePreset: 'a4',
    pageWidthMm: 210.0,
    pageHeightMm: 297.0,
    orientation: 'portrait',
    marginTopMm: 18.0,
    marginBottomMm: 18.0,
    marginLeftMm: 16.0,
    marginRightMm: 16.0,
    marginsLinked: false,
    headerDistanceMm: 10.0,
    footerDistanceMm: 10.0,
    scaleMode: 'fit',
    scalePercent: 100.0,
    elementsConfig: { ...DEFAULT_ELEMENTS_CONFIG },
    revisionNumber: 1,
    createdByName: 'Super Admin',
  },
  linkage: {
    serviceKind: 'linkage',
    name: 'Official Family Linkage Certificate Template',
    version: 1,
    status: 'active',
    isActive: true,
    pageSizePreset: 'a4',
    pageWidthMm: 210.0,
    pageHeightMm: 297.0,
    orientation: 'portrait',
    marginTopMm: 18.0,
    marginBottomMm: 18.0,
    marginLeftMm: 16.0,
    marginRightMm: 16.0,
    marginsLinked: false,
    headerDistanceMm: 10.0,
    footerDistanceMm: 10.0,
    scaleMode: 'fit',
    scalePercent: 100.0,
    elementsConfig: { ...DEFAULT_ELEMENTS_CONFIG },
    revisionNumber: 1,
    createdByName: 'Super Admin',
  },
};
