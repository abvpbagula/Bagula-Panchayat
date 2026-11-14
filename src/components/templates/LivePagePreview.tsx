import React, { useRef, useEffect, useState } from "react";
import {
  CertificateTemplate,
  getEffectivePageDimensions,
} from "@/types/certificateTemplate";
import { HorizontalRuler, VerticalRuler } from "./DocumentRuler";
import { AlertTriangle, ZoomIn, ZoomOut, Maximize2, ShieldCheck, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LivePagePreviewProps {
  template: CertificateTemplate;
  showRulers?: boolean;
  onFitToPage?: () => void;
  sampleApplicantName?: string;
  sampleDeceasedName?: string;
}

export const LivePagePreview: React.FC<LivePagePreviewProps> = ({
  template,
  showRulers = true,
  onFitToPage,
  sampleApplicantName = "Shri Debasish Roy",
  sampleDeceasedName = "Late Samir Biswas",
}) => {
  const { page_setup: setup, element_styles: styles } = template;
  const { widthMm, heightMm, printableWidthMm, printableHeightMm, isLandscape } = getEffectivePageDimensions(setup);

  const [zoom, setZoom] = useState<number>(100);
  const [hasOverflow, setHasOverflow] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Overflow measurement
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const scrollH = el.scrollHeight;
      const clientH = el.clientHeight;
      setHasOverflow(scrollH > clientH + 8);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => observer.disconnect();
  }, [setup, styles, zoom]);

  const scaleFactor = (setup.scale_mode === "fit_page" ? 100 : setup.scale_percent || 100) / 100;
  const viewZoom = zoom / 100;

  return (
    <div className="flex flex-col h-full bg-slate-200/70 dark:bg-slate-950/80 rounded-xl border overflow-hidden">
      {/* Top toolbar: Dimensions & Zoom controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b select-none text-xs">
        <div className="flex items-center gap-2 font-mono">
          <span className="font-bold text-primary">{setup.preset}</span>
          <span className="text-muted-foreground">({widthMm} × {heightMm} mm)</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] font-medium capitalize">
            {setup.orientation}
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            · Margins: {setup.margin_top_mm}/{setup.margin_bottom_mm}/{setup.margin_left_mm}/{setup.margin_right_mm} mm
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="h-7 w-7 p-0"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="w-12 text-center font-mono text-[11px]">{zoom}%</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(150, z + 10))}
            className="h-7 w-7 p-0"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setZoom(100)}
            className="h-7 px-2 text-[11px]"
            title="Reset to 100%"
          >
            100%
          </Button>
        </div>
      </div>

      {/* Overflow warning banner */}
      {hasOverflow && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-xs font-medium flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>⚠️ Certificate content exceeds printable margins and may be clipped when printed!</span>
          </div>
          {onFitToPage && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onFitToPage}
              className="h-6 text-[11px] bg-white hover:bg-white/90 text-amber-950 font-bold"
            >
              Fit to Page
            </Button>
          )}
        </div>
      )}

      {/* Editor Canvas Container */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start">
        <div
          className="flex flex-col items-start transition-transform origin-top"
          style={{ transform: `scale(${viewZoom})` }}
        >
          {/* Horizontal Ruler */}
          {showRulers && styles.show_rulers && (
            <div className="flex" style={{ width: `${widthMm}mm` }}>
              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 border-r border-b shrink-0" />
              <div className="flex-1">
                <HorizontalRuler
                  widthMm={widthMm}
                  marginLeftMm={setup.margin_left_mm}
                  marginRightMm={setup.margin_right_mm}
                />
              </div>
            </div>
          )}

          <div className="flex items-start">
            {/* Vertical Ruler */}
            {showRulers && styles.show_rulers && (
              <div style={{ height: `${heightMm}mm` }} className="shrink-0">
                <VerticalRuler
                  heightMm={heightMm}
                  marginTopMm={setup.margin_top_mm}
                  marginBottomMm={setup.margin_bottom_mm}
                />
              </div>
            )}

            {/* The Physical Paper Page */}
            <div
              ref={pageRef}
              id="certificate-page-canvas"
              className="relative bg-white text-slate-900 shadow-2xl transition-all duration-200 select-none overflow-hidden"
              style={{
                width: `${widthMm}mm`,
                height: `${heightMm}mm`,
                minWidth: `${widthMm}mm`,
                minHeight: `${heightMm}mm`,
                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.08)",
                fontFamily: styles.font_family,
              }}
            >
              {/* Optional Background Template Asset / Letterhead */}
              {template.template_asset_url && (
                <img
                  src={template.template_asset_url}
                  alt="Template Background"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-90 z-0"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Watermark */}
              {styles.watermark_enabled && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                  style={{
                    transform: "rotate(-35deg)",
                    opacity: styles.watermark_opacity,
                  }}
                >
                  <span className="font-bold text-6xl tracking-wider text-slate-900 whitespace-nowrap">
                    {styles.watermark_text}
                  </span>
                </div>
              )}

              {/* Printable Safe Area Guidelines */}
              {styles.snap_to_guides && (
                <div
                  className="absolute pointer-events-none border border-dashed border-amber-400/40 z-10"
                  style={{
                    top: `${setup.margin_top_mm}mm`,
                    bottom: `${setup.margin_bottom_mm}mm`,
                    left: `${setup.margin_left_mm}mm`,
                    right: `${setup.margin_right_mm}mm`,
                  }}
                />
              )}

              {/* Certificate Inner Printable Content Area */}
              <div
                ref={contentRef}
                className="relative z-10 h-full flex flex-col justify-between"
                style={{
                  paddingTop: `${setup.margin_top_mm}mm`,
                  paddingBottom: `${setup.margin_bottom_mm}mm`,
                  paddingLeft: `${setup.margin_left_mm}mm`,
                  paddingRight: `${setup.margin_right_mm}mm`,
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: "top left",
                  width: `${(100 / scaleFactor)}%`,
                  height: `${(100 / scaleFactor)}%`,
                }}
              >
                {/* Header Section */}
                <div style={{ marginBottom: `${setup.header_distance_mm}mm` }}>
                  {styles.show_tricolor_bar && (
                    <div
                      style={{
                        background: "linear-gradient(to right, #FF9933 33.33%, white 33.33% 66.66%, #2E7D32 66.66%)",
                        height: "4px",
                        marginBottom: "8px",
                      }}
                    />
                  )}

                  <div className="text-center">
                    <div style={{ fontSize: "11px", color: "#555", letterSpacing: "0.5px" }}>Office of the</div>
                    <div
                      style={{
                        fontSize: `${styles.title_font_size_pt}pt`,
                        fontWeight: "bold",
                        color: "#1A237E",
                        textTransform: "uppercase",
                        lineHeight: 1.1,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {styles.panchayat_name}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "bold", color: "#555", marginTop: "2px" }}>
                      ({styles.panchayat_samity})
                    </div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                      {styles.office_address}
                    </div>
                    <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>
                      E-mail: <span style={{ background: "#e2e8f0", padding: "1px 4px", borderRadius: "2px" }}>{styles.office_email}</span>
                    </div>
                  </div>

                  {/* Prodhan / Upa-Prodhan Row */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-300">
                    <div>
                      <div style={{ color: "#c55a11", fontWeight: "bold", fontSize: "11px" }}>
                        {styles.prodhan_name}
                      </div>
                      <div style={{ color: "#2e74b5", fontWeight: "bold", fontSize: "11px" }}>
                        {styles.prodhan_title}
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ color: "#c55a11", fontWeight: "bold", fontSize: "11px" }}>
                        {styles.upa_prodhan_name}
                      </div>
                      <div style={{ color: "#2e74b5", fontWeight: "bold", fontSize: "11px" }}>
                        {styles.upa_prodhan_title}
                      </div>
                    </div>
                  </div>

                  {/* Memo No & Date Line */}
                  <div
                    className="flex justify-between items-center font-bold text-xs mt-3 pt-2 border-t-2 border-slate-900"
                    style={{ fontSize: "11px" }}
                  >
                    <span>Memo No: 142/BGL-II/{new Date().getFullYear()}</span>
                    <span>Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Certificate Title & Body Content */}
                <div className="flex-1 flex flex-col justify-start">
                  <div
                    className="text-center font-bold underline tracking-wide my-3"
                    style={{
                      fontSize: `${Math.round(styles.title_font_size_pt * 0.9)}pt`,
                      color: "#1A237E",
                    }}
                  >
                    {template.service_kind === "warish"
                      ? "WARISH CERTIFICATE"
                      : template.service_kind === "dependent"
                      ? "DEPENDENT CERTIFICATE"
                      : "LINKAGE CERTIFICATE"}
                  </div>

                  <div
                    className="text-justify leading-relaxed"
                    style={{
                      fontSize: `${styles.body_font_size_pt}pt`,
                      lineHeight: styles.line_height,
                    }}
                  >
                    {template.service_kind === "warish" ? (
                      <p>
                        This is to certify that the following individuals are declared as the legal successor(s) of Late{" "}
                        <strong>{sampleDeceasedName}</strong>, S/O Late Nityananda Biswas, who was a permanent resident of Vill:{" "}
                        <strong>Stationpara</strong>, P.O.: <strong>Bagula</strong>, under the jurisdiction of Bagula 2 No Gram Panchayat No. Gram Panchayat,
                        District: <strong>Nadia</strong>, West Bengal, PIN – <strong>741502</strong>.
                      </p>
                    ) : template.service_kind === "dependent" ? (
                      <p>
                        This is to certify that Sri/Smt <strong>{sampleApplicantName}</strong> is a recognized dependent of employee Late{" "}
                        <strong>{sampleDeceasedName}</strong>, resident of Stationpara, Bagula, Nadia. All official claims and dependent status are hereby affirmed as per Gram Panchayat records.
                      </p>
                    ) : (
                      <p>
                        This is to certify the familial and genealogical linkage of Sri/Smt <strong>{sampleApplicantName}</strong>,
                        confirming resident status and official ancestral linkage in Bagula 2 No Gram Panchayat records.
                      </p>
                    )}
                  </div>

                  {/* Sample Heirs / Table Section */}
                  {template.service_kind === "warish" && (
                    <div className="mt-3 overflow-hidden border border-slate-400 text-xs">
                      <table className="w-full text-center border-collapse">
                        <thead className="bg-slate-100 font-bold border-b border-slate-400 text-[10px]">
                          <tr>
                            <th className="p-1 border-r border-slate-300">Sl No.</th>
                            <th className="p-1 border-r border-slate-300">Name of Heirs</th>
                            <th className="p-1 border-r border-slate-300">Relation</th>
                            <th className="p-1 border-r border-slate-300">Age</th>
                            <th className="p-1">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-[10px]">
                          <tr className="border-b border-slate-200">
                            <td className="p-1 border-r border-slate-200">1</td>
                            <td className="p-1 border-r border-slate-200 font-semibold">Smt. Debika Biswas</td>
                            <td className="p-1 border-r border-slate-200">Wife</td>
                            <td className="p-1 border-r border-slate-200">60 Yrs</td>
                            <td className="p-1 text-emerald-700 font-semibold">Living</td>
                          </tr>
                          <tr className="border-b border-slate-200">
                            <td className="p-1 border-r border-slate-200">2</td>
                            <td className="p-1 border-r border-slate-200 font-semibold">Sri Debargho Biswas</td>
                            <td className="p-1 border-r border-slate-200">Son</td>
                            <td className="p-1 border-r border-slate-200">24 Yrs</td>
                            <td className="p-1 text-emerald-700 font-semibold">Living</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer, Verification, & Signature Block */}
                <div style={{ marginTop: `${setup.footer_distance_mm}mm` }} className="pt-2 border-t border-slate-300">
                  <div className="flex justify-between items-end">
                    {/* Left: QR Code & Verification ID */}
                    {styles.qr_code_enabled && (
                      <div className="flex items-center gap-2 border border-slate-200 p-1.5 rounded bg-slate-50/70">
                        <div className="w-12 h-12 bg-white border border-slate-300 flex items-center justify-center text-slate-800">
                          <QrCode className="w-10 h-10" />
                        </div>
                        <div className="text-[9px] font-mono leading-tight">
                          <div className="font-bold text-primary">BAGULA-II GP</div>
                          <div>ID: BGL-II/WAR/DEMO/2026</div>
                          <div className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" /> VERIFIED
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Right: Official Seal & Executive Signature Block */}
                    <div className="text-center min-w-[140px]">
                      <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">
                        [ Official Digital Signature ]
                      </div>
                      <div className="border-t border-slate-800 pt-1">
                        <div className="font-bold text-[11px] text-slate-900">{styles.prodhan_name}</div>
                        <div className="text-[10px] text-slate-600 font-medium">{styles.prodhan_title}</div>
                        <div className="text-[9px] text-slate-500">{styles.panchayat_name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
