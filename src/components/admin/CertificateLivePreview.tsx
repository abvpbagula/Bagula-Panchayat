import React, { useMemo, useRef, useState, useEffect } from "react";
import { CertificateTemplateConfig, CertificateKind } from "@/core/certificateTemplateTypes";
import { MillimeterRuler } from "./MillimeterRuler";
import { AlertTriangle, CheckCircle2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

interface CertificateLivePreviewProps {
  config: CertificateTemplateConfig;
  sampleKind?: CertificateKind;
  onFitToPage?: () => void;
  certRef?: React.RefObject<HTMLDivElement>;
}

export const CertificateLivePreview: React.FC<CertificateLivePreviewProps> = ({
  config,
  sampleKind = "warish",
  onFitToPage,
  certRef: externalCertRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalCertRef = useRef<HTMLDivElement>(null);
  const actualCertRef = externalCertRef || internalCertRef;

  const [zoomLevel, setZoomLevel] = useState<number>(0.85); // default comfortable preview zoom
  const [contentOverflow, setContentOverflow] = useState<boolean>(false);

  // Millimeter to pixel scale factor (at standard 96 DPI screen: 1 inch = 25.4 mm = 96 px => 1 mm ≈ 3.7795 px)
  const baseMmToPx = 3.7795;
  const zoomFactor = baseMmToPx * zoomLevel;

  const pageWidthPx = config.pageWidthMm * zoomFactor;
  const pageHeightPx = config.pageHeightMm * zoomFactor;

  const marginTopPx = config.marginTopMm * zoomFactor;
  const marginBottomPx = config.marginBottomMm * zoomFactor;
  const marginLeftPx = config.marginLeftMm * zoomFactor;
  const marginRightPx = config.marginRightMm * zoomFactor;

  const printableWidthPx = Math.max(50, pageWidthPx - marginLeftPx - marginRightPx);
  const printableHeightPx = Math.max(50, pageHeightPx - marginTopPx - marginBottomPx);

  // Check content overflow
  useEffect(() => {
    const el = actualCertRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const scrollH = el.scrollHeight;
      const clientH = el.clientHeight;
      // If inner scroll height exceeds printable height significantly
      setContentOverflow(scrollH > clientH + 10);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [actualCertRef, config, zoomFactor]);

  // Sample data placeholders for preview
  const sampleData = useMemo(() => {
    return {
      referenceId: "BGL-II/WAR/2026/00429",
      memoNo: "128/BGL-II/2026",
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      deceasedName: "Late Nityananda Biswas",
      fatherName: "Late Surendranath Biswas",
      applicantName: "Sri Nitish Biswas",
      village: "Stationpara",
      postOffice: "Bagula",
      district: "Nadia",
      pin: "741502",
      heirs: [
        { sl: 1, name: "Smt. Susama Biswas", relation: "Wife", age: 58, status: "Living" },
        { sl: 2, name: "Sri Nitish Biswas", relation: "Son", age: 25, status: "Living" },
        { sl: 3, name: "Smt. Priyanka Biswas", relation: "Daughter", age: 22, status: "Living" },
      ],
    };
  }, []);

  const elements = config.elementsConfig;

  return (
    <div className="flex flex-col h-full bg-slate-200 border rounded-xl overflow-hidden shadow-inner">
      {/* Top Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-800 text-white border-b border-slate-700 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>📄</span> Live Document Canvas
          </span>
          <span className="bg-slate-700 px-2 py-0.5 rounded text-slate-300 font-mono">
            {config.pageSizePreset.toUpperCase()} · {config.pageWidthMm} × {config.pageHeightMm} mm ({config.orientation})
          </span>
          <span className="text-slate-400 hidden sm:inline">
            Margins: T:{config.marginTopMm} B:{config.marginBottomMm} L:{config.marginLeftMm} R:{config.marginRightMm} mm
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="font-mono text-slate-200 min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.1).toFixed(2))))}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(0.8)}
            className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-[11px] text-slate-200"
            title="Reset Zoom"
          >
            Fit View
          </button>
        </div>
      </div>

      {/* Overflow Warning Banner */}
      {contentOverflow && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-amber-500 text-slate-900 text-xs font-medium border-b border-amber-600 shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-slate-950" />
            <span>
              <strong>Print Safety Warning:</strong> Content height exceeds the printable area. Some content may be clipped when printed.
            </span>
          </div>
          {onFitToPage && (
            <button
              type="button"
              onClick={onFitToPage}
              className="bg-slate-900 text-white hover:bg-black px-2.5 py-0.5 rounded text-[11px] font-semibold transition"
            >
              Fit to Page
            </button>
          )}
        </div>
      )}

      {/* Canvas Area with Rulers */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex flex-col items-center justify-start bg-slate-300/80 relative"
      >
        <div className="inline-block relative">
          {/* Horizontal Top Ruler */}
          <div className="ml-[24px]">
            <MillimeterRuler
              lengthMm={config.pageWidthMm}
              orientation="horizontal"
              zoomFactor={zoomFactor}
              marginStartMm={config.marginLeftMm}
              marginEndMm={config.marginRightMm}
            />
          </div>

          <div className="flex">
            {/* Vertical Left Ruler */}
            <div>
              <MillimeterRuler
                lengthMm={config.pageHeightMm}
                orientation="vertical"
                zoomFactor={zoomFactor}
                marginStartMm={config.marginTopMm}
                marginEndMm={config.marginBottomMm}
              />
            </div>

            {/* The Page Sheet */}
            <div
              id="certificate-page-canvas"
              className="relative bg-white shadow-2xl transition-all duration-150 select-none overflow-hidden print-page"
              style={{
                width: `${pageWidthPx}px`,
                height: `${pageHeightPx}px`,
                minHeight: `${pageHeightPx}px`,
                maxHeight: `${pageHeightPx}px`,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Subtle Margin Boundary Guide (dashed lines inside sheet) */}
              <div
                className="absolute pointer-events-none border border-dashed border-sky-300/70 z-20"
                style={{
                  top: `${marginTopPx}px`,
                  bottom: `${marginBottomPx}px`,
                  left: `${marginLeftPx}px`,
                  right: `${marginRightPx}px`,
                }}
                title="Printable margin boundary"
              />

              {/* Watermark */}
              {elements.watermark.enabled && (
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
                  style={{
                    opacity: elements.watermark.opacity,
                    transform: `rotate(${elements.watermark.angle ?? -30}deg)`,
                  }}
                >
                  <span
                    className="font-black text-slate-900 uppercase tracking-widest text-center"
                    style={{
                      fontSize: `${Math.round(42 * zoomLevel)}px`,
                      lineHeight: 1.2,
                    }}
                  >
                    {elements.watermark.text || "BAGULA II GRAM PANCHAYAT"}
                  </span>
                </div>
              )}

              {/* Printable Content Area */}
              <div
                ref={actualCertRef}
                className="relative z-10 flex flex-col justify-between h-full text-slate-800"
                style={{
                  paddingTop: `${marginTopPx}px`,
                  paddingBottom: `${marginBottomPx}px`,
                  paddingLeft: `${marginLeftPx}px`,
                  paddingRight: `${marginRightPx}px`,
                  fontSize: `${Math.max(8, Math.round(elements.body.fontSize * zoomLevel))}px`,
                  lineHeight: elements.body.lineHeight,
                }}
              >
                {/* 1. Header Section */}
                <div>
                  {elements.header.showTricolor && (
                    <div
                      className="h-[3px] w-full mb-2"
                      style={{
                        background:
                          "linear-gradient(to right, #FF9933 33.33%, #FFFFFF 33.33% 66.66%, #138808 66.66%)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    />
                  )}

                  <div className="text-center mb-1">
                    <div
                      className="text-slate-500 font-serif"
                      style={{ fontSize: `${Math.round(11 * zoomLevel)}px` }}
                    >
                      Office of the
                    </div>
                    <div
                      className="font-bold font-serif text-[#1A237E] uppercase tracking-wide"
                      style={{
                        fontSize: `${Math.round(elements.header.fontSize * zoomLevel)}px`,
                        lineHeight: 1.1,
                      }}
                    >
                      {elements.header.officeTitle || "BAGULA II GRAM PANCHAYAT"}
                    </div>
                    <div
                      className="font-bold text-slate-600 font-serif"
                      style={{ fontSize: `${Math.round(elements.header.subTitleSize * zoomLevel)}px` }}
                    >
                      (UNDER HANSKHALI PANCHAYAT SAMITY)
                    </div>
                    <div
                      className="text-slate-500 text-[10px]"
                      style={{ fontSize: `${Math.round(10 * zoomLevel)}px` }}
                    >
                      Vill: Stationpara, P.O.: Bagula, P.S.: Hanskhali, Nadia, West Bengal, PIN – 741502
                    </div>
                    <div
                      className="text-slate-500 text-[10px]"
                      style={{ fontSize: `${Math.round(10 * zoomLevel)}px` }}
                    >
                      E-mail: <span className="font-mono bg-slate-100 px-1">bagula2nogp111@gmail.com</span>
                    </div>
                  </div>

                  {/* Prodhan & Upa-Prodhan Row */}
                  <div
                    className="flex justify-between items-center py-1 border-b-2 border-slate-800 my-1 font-serif"
                    style={{ fontSize: `${Math.round(11 * zoomLevel)}px` }}
                  >
                    <div>
                      <div className="font-bold text-[#c55a11]">Smt. Susmita Biswas Barman</div>
                      <div className="text-[#2e74b5] font-semibold text-[10px]">Prodhan</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#c55a11]">Sri Manaranjan Bhowmick</div>
                      <div className="text-[#2e74b5] font-semibold text-[10px]">Upa-Prodhan</div>
                    </div>
                  </div>

                  {/* Memo No & Date */}
                  <div
                    className="flex justify-between items-center font-bold my-1.5 font-serif"
                    style={{ fontSize: `${Math.round(12 * zoomLevel)}px` }}
                  >
                    <span>Memo No: {sampleData.memoNo}</span>
                    <span>Date: {sampleData.date}</span>
                  </div>

                  {/* Certificate Title */}
                  <div
                    className="text-center font-bold uppercase my-2 tracking-wider"
                    style={{
                      fontSize: `${Math.round(elements.title.fontSize * zoomLevel)}px`,
                      color: elements.title.color,
                      textDecoration: elements.title.underline ? "underline" : "none",
                    }}
                  >
                    {elements.title.customTitle ||
                      (sampleKind === "warish"
                        ? "WARISH CERTIFICATE"
                        : sampleKind === "dependent"
                        ? "DEPENDENT CERTIFICATE"
                        : "FAMILY LINKAGE CERTIFICATE")}
                  </div>

                  {/* Certificate Body text */}
                  <div
                    className="font-serif text-justify my-2 text-slate-900"
                    style={{
                      fontSize: `${Math.round(elements.body.fontSize * zoomLevel)}px`,
                      lineHeight: elements.body.lineHeight,
                    }}
                  >
                    {sampleKind === "warish" ? (
                      <p>
                        This is to certify that the following individuals are declared as the lawful successors of Late{" "}
                        <strong>{sampleData.deceasedName}</strong>, son of Late <strong>{sampleData.fatherName}</strong>, who was a
                        permanent resident of Village: <strong>{sampleData.village}</strong>, P.O.: <strong>{sampleData.postOffice}</strong>,
                        under the jurisdiction of Bagula 2 No. Gram Panchayat, District: <strong>{sampleData.district}</strong>, West
                        Bengal, PIN – <strong>{sampleData.pin}</strong>.
                      </p>
                    ) : sampleKind === "dependent" ? (
                      <p>
                        This is to certify that the persons mentioned below are bona-fide family dependents of{" "}
                        <strong>{sampleData.applicantName}</strong>, permanent resident of Village:{" "}
                        <strong>{sampleData.village}</strong>, P.O.: <strong>{sampleData.postOffice}</strong>, District:{" "}
                        <strong>{sampleData.district}</strong>, West Bengal.
                      </p>
                    ) : (
                      <p>
                        This is to certify that official family linkage and relationship scrutiny has been verified for{" "}
                        <strong>{sampleData.applicantName}</strong> residing at Bagula 2 No Gram Panchayat area.
                      </p>
                    )}
                  </div>

                  {/* Heirs / Dependents Table */}
                  <div className="my-2">
                    <table
                      className="w-full border-collapse border border-slate-400 text-center font-serif"
                      style={{
                        fontSize: `${Math.round(elements.table.fontSize * zoomLevel)}px`,
                      }}
                    >
                      <thead className="bg-slate-100 font-bold border-b border-slate-400">
                        <tr>
                          <th className="border border-slate-400 p-1">Sl.</th>
                          <th className="border border-slate-400 p-1">Full Legal Name</th>
                          <th className="border border-slate-400 p-1">Relationship</th>
                          <th className="border border-slate-400 p-1">Age</th>
                          <th className="border border-slate-400 p-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleData.heirs.map((h) => (
                          <tr key={h.sl}>
                            <td className="border border-slate-400 p-1">{h.sl}</td>
                            <td className="border border-slate-400 p-1 font-medium">{h.name}</td>
                            <td className="border border-slate-400 p-1">{h.relation}</td>
                            <td className="border border-slate-400 p-1">{h.age} yrs</td>
                            <td className="border border-slate-400 p-1 text-emerald-700 font-semibold">{h.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Signatures & Official Seals */}
                <div className="mt-4 pt-2">
                  <div className="grid grid-cols-3 gap-2 text-center font-serif text-xs">
                    {/* Ward Member */}
                    {elements.signatures.showWardMember && (
                      <div className="flex flex-col items-center justify-end">
                        <div className="h-10 flex items-end justify-center">
                          <span className="text-[10px] text-slate-400 italic font-mono">[Signature]</span>
                        </div>
                        <div className="border-t border-slate-800 w-4/5 pt-0.5 font-bold text-slate-800">
                          Ward Member
                        </div>
                        <div className="text-[9px] text-slate-500">Sansad Area No. 12</div>
                      </div>
                    )}

                    {/* Official Seal Box */}
                    {elements.signatures.showSealBox && (
                      <div className="flex flex-col items-center justify-center">
                        <div
                          className="border-2 border-dashed border-slate-400 rounded flex flex-col items-center justify-center text-slate-400 font-sans"
                          style={{
                            width: `${Math.round(28 * zoomLevel)}mm`,
                            height: `${Math.round(24 * zoomLevel)}mm`,
                          }}
                        >
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Official GP Seal</span>
                          <span className="text-[8px] text-slate-400">Bagula 2 No Gram Panchayat</span>
                        </div>
                      </div>
                    )}

                    {/* Prodhan Signature */}
                    {elements.signatures.showProdhan && (
                      <div className="flex flex-col items-center justify-end">
                        <div className="h-10 flex items-end justify-center">
                          <span className="text-[10px] text-slate-400 italic font-mono">[Signature & Stamp]</span>
                        </div>
                        <div className="border-t border-slate-800 w-4/5 pt-0.5 font-bold text-slate-800">
                          Prodhan
                        </div>
                        <div className="text-[9px] text-slate-500">Bagula 2 No Gram Panchayat</div>
                      </div>
                    )}
                  </div>

                  {/* 3. Footer & Verification Row */}
                  <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-slate-600 font-mono text-[9px]">
                    <div className="flex items-center gap-2">
                      {elements.footer.showQrCode && (
                        <div className="w-10 h-10 border border-slate-400 bg-slate-100 flex items-center justify-center text-[7px] text-center font-bold p-0.5">
                          QR VERIFY
                        </div>
                      )}
                      <div>
                        <div>Unique ID: <strong>{sampleData.referenceId}</strong></div>
                        <div className="text-[8px] text-slate-500">Verify online at /verify?id={sampleData.referenceId}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div>Bagula 2 No Gram Panchayat · Hanskhali Block</div>
                      <div className="text-[8px] text-slate-500">Government of West Bengal Rural Portal</div>
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
