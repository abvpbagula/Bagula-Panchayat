import { CertificateTemplateConfig } from "./certificateTemplateTypes";

let html2canvasPromise: Promise<typeof import("html2canvas")> | null = null;
let jsPdfPromise: Promise<typeof import("jspdf")> | null = null;

const getPdfLibraries = async () => {
  if (!html2canvasPromise) html2canvasPromise = import("html2canvas");
  if (!jsPdfPromise) jsPdfPromise = import("jspdf");
  const [html2canvasModule, jspdfModule] = await Promise.all([
    html2canvasPromise,
    jsPdfPromise,
  ]);
  return [html2canvasModule.default, jspdfModule.jsPDF] as const;
};

/**
 * Dynamically injects an @page CSS rule matching the exact configured page size and margins.
 * Returns a cleanup function to remove the rule.
 */
export function injectPrintPageStyles(config: CertificateTemplateConfig): () => void {
  const STYLE_ID = "dynamic-cert-page-setup-style";
  let existing = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!existing) {
    existing = document.createElement("style");
    existing.id = STYLE_ID;
    document.head.appendChild(existing);
  }

  const css = `
    @media print {
      @page {
        size: ${config.pageWidthMm}mm ${config.pageHeightMm}mm ${config.orientation};
        margin: ${config.marginTopMm}mm ${config.marginRightMm}mm ${config.marginBottomMm}mm ${config.marginLeftMm}mm;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
      .certificate-area, .certificate-paper {
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        width: 100% !important;
      }
    }
  `;

  existing.textContent = css;

  return () => {
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  };
}

/**
 * High-resolution PDF generator respecting Microsoft Word-like page setup.
 * Uses exact physical dimensions (mm), orientation, margins, and scaling mode.
 */
export async function generateCertificatePdf(
  targetOrSelector: HTMLElement | HTMLElement[] | string,
  config: CertificateTemplateConfig,
  fileName: string = "Certificate.pdf"
): Promise<boolean> {
  try {
    let targets: HTMLElement[] = [];

    if (typeof targetOrSelector === "string") {
      const el = document.querySelector(targetOrSelector) as HTMLElement | null;
      if (!el) throw new Error(`Target selector "${targetOrSelector}" not found`);
      const pageEls = Array.from(el.querySelectorAll<HTMLElement>(".print-page"));
      targets = pageEls.length > 0 ? pageEls : [el];
    } else if (Array.isArray(targetOrSelector)) {
      targets = targetOrSelector;
    } else {
      const pageEls = Array.from(targetOrSelector.querySelectorAll<HTMLElement>(".print-page"));
      targets = pageEls.length > 0 ? pageEls : [targetOrSelector];
    }

    if (targets.length === 0) {
      throw new Error("No printable elements found");
    }

    const [html2canvas, jsPDF] = await getPdfLibraries();

    // Configure jsPDF with custom mm format and orientation
    const orientation = config.orientation === "landscape" ? "landscape" : "portrait";
    const format: [number, number] = [config.pageWidthMm, config.pageHeightMm];

    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format,
    });

    const pageW = config.pageWidthMm;
    const pageH = config.pageHeightMm;
    const marginLeft = config.marginLeftMm;
    const marginRight = config.marginRightMm;
    const marginTop = config.marginTopMm;
    const marginBottom = config.marginBottomMm;

    const printableW = Math.max(20, pageW - marginLeft - marginRight);
    const printableH = Math.max(20, pageH - marginTop - marginBottom);

    for (let i = 0; i < targets.length; i++) {
      const targetEl = targets[i];

      const canvas = await html2canvas(targetEl, {
        scale: 2.2, // sharp vector-like rendering
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const canvasAspectRatio = canvas.width / canvas.height;

      let drawW = printableW;
      let drawH = drawW / canvasAspectRatio;

      if (config.scaleMode === "fit") {
        if (drawH > printableH) {
          drawH = printableH;
          drawW = drawH * canvasAspectRatio;
        }
      } else if (config.scaleMode === "custom") {
        const factor = (config.scalePercent || 100) / 100;
        drawW = printableW * factor;
        drawH = drawW / canvasAspectRatio;
      }

      // Center within printable margins
      const posX = marginLeft + (printableW - drawW) / 2;
      const posY = marginTop + Math.max(0, (printableH - drawH) / 2);

      if (i > 0) {
        pdf.addPage(format, orientation);
      }

      pdf.addImage(imgData, "JPEG", posX, posY, drawW, Math.min(drawH, printableH));
    }

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error("PDF Generation error:", err);
    throw err;
  }
}
