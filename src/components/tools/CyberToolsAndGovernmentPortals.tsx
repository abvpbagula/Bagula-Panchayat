import { useState, useRef } from "react";
import {
  ExternalLink,
  Search,
  Scissors,
  Wrench,
  Building,
  Download,
  Upload,
  RefreshCw,
  FileText,
  CreditCard,
  Printer,
  Sparkles,
  ChevronRight,
  Sliders,
  CheckCircle2,
  FileCheck,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Copy,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { DynamicGovernmentPortalFetcher } from "@/components/tools/DynamicGovernmentPortalFetcher";

// =========================================================================
// SECTION 1: ESSENTIAL UTILITY TOOLS FOR CYBER CAFES & CITIZENS
// =========================================================================

export function CyberToolsAndGovernmentPortals() {
  // Start with 'none' so that the government websites directory does NOT bloat the page depth initially.
  // It only opens upon the user clicking the banner!
  const [activeMainTab, setActiveMainTab] = useState<"none" | "gov" | "tools" | "smart_crop">("none");

  // =========================================================================
  // SECTION 2: RESIZE & COMPRESS UTILITY STATE
  // =========================================================================
  const [compressImage, setCompressImage] = useState<string | null>(null);
  const [compressedResult, setCompressedResult] = useState<string | null>(null);
  const [origFileSizeKb, setOrigFileSizeKb] = useState<number>(0);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [targetKb, setTargetKb] = useState<number>(50);
  const [targetWidth, setTargetWidth] = useState<number>(413); // 3.5cm standard
  const [targetHeight, setTargetHeight] = useState<number>(531); // 4.5cm standard
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo + Signature Merger State
  const [photoImage, setPhotoImage] = useState<string | null>(null);
  const [signImage, setSignImage] = useState<string | null>(null);
  const [mergedResult, setMergedResult] = useState<string | null>(null);

  // =========================================================================
  // SECTION 3: SMART CARD CROPPER STATE
  // =========================================================================
  const [cardType, setCardType] = useState<"aadhaar" | "voter" | "pan" | "ration" | "ayushman">("aadhaar");
  const [frontCardImg, setFrontCardImg] = useState<string | null>(null);
  const [backCardImg, setBackCardImg] = useState<string | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Compress / Resize
  const handleCompressFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOrigFileSizeKb(Math.round(file.size / 1024));
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setCompressImage(src);
      performClientCompression(src, targetWidth, targetHeight, targetKb);
    };
    reader.readAsDataURL(file);
  };

  const performClientCompression = (
    src: string,
    w: number,
    h: number,
    desiredKb: number
  ) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Fit or fill
      ctx.drawImage(img, 0, 0, w, h);

      // Binary search quality for target KB
      let minQ = 0.05;
      let maxQ = 0.98;
      let bestDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      for (let i = 0; i < 6; i++) {
        const midQ = (minQ + maxQ) / 2;
        const testData = canvas.toDataURL("image/jpeg", midQ);
        const testKb = Math.round((testData.length * 3) / 4 / 1024);

        if (testKb > desiredKb) {
          maxQ = midQ;
        } else {
          bestDataUrl = testData;
          minQ = midQ;
        }
      }

      const finalKb = Math.round((bestDataUrl.length * 3) / 4 / 1024);
      setCompressedResult(bestDataUrl);
      setCompressedSizeKb(finalKb);
      setIsProcessing(false);
      toast.success(`Image optimized to ~${finalKb} KB!`);
    };
    img.src = src;
  };

  // Merge Photo + Signature
  const handleMergePhotoAndSign = () => {
    if (!photoImage || !signImage) {
      toast.error("Please upload both Photo and Signature to merge!");
      return;
    }

    const pImg = new Image();
    const sImg = new Image();

    pImg.onload = () => {
      sImg.onload = () => {
        const canvas = document.createElement("canvas");
        const outWidth = 400;
        const photoHeight = 450;
        const signHeight = 150;
        canvas.width = outWidth;
        canvas.height = photoHeight + signHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Photo
        ctx.drawImage(pImg, 0, 0, outWidth, photoHeight);

        // Separator line
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, photoHeight, outWidth, 1);

        // Draw Signature
        ctx.drawImage(sImg, 20, photoHeight + 10, outWidth - 40, signHeight - 20);

        const out = canvas.toDataURL("image/jpeg", 0.9);
        setMergedResult(out);
        toast.success("Photo & Signature joined successfully!");
      };
      sImg.src = signImage;
    };
    pImg.src = photoImage;
  };

  // Smart Card Crop Print Handler
  const handlePrintCardSheet = () => {
    window.print();
  };

  const handleDownloadCardPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Bagula 2 No Gram Panchayat — Cyber Facilitation Print", 105, 18, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Official ID Card Layout (${cardType.toUpperCase()} FORMAT: 85.60 mm x 53.98 mm)`, 105, 25, { align: "center" });

      const cardW = 85.6;
      const cardH = 53.98;

      if (frontCardImg) {
        doc.addImage(frontCardImg, "JPEG", 20, 35, cardW, cardH);
        doc.setDrawColor(180, 180, 180);
        doc.rect(20, 35, cardW, cardH);
        doc.setFontSize(8);
        doc.text("FRONT SIDE (Cut along border)", 20, 93);
      }

      if (backCardImg) {
        doc.addImage(backCardImg, "JPEG", 110, 35, cardW, cardH);
        doc.setDrawColor(180, 180, 180);
        doc.rect(110, 35, cardW, cardH);
        doc.setFontSize(8);
        doc.text("BACK SIDE (Cut along border)", 110, 93);
      }

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("Standard ISO/IEC 7810 ID-1 card format for citizen documentation and official records.", 105, 105, { align: "center" });

      doc.save(`${cardType}_smart_crop_card.pdf`);
      toast.success("Card PDF generated with exact ISO-7810 dimensions!");
    } catch {
      toast.error("Could not generate PDF. Please ensure card images are loaded.");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 3 HERO GRADIENT BANNERS DIRECTLY INSPIRED BY OPENCONCEPTBANGLA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Banner 1: সরকারি ওয়েবসাইট */}
        <button
          type="button"
          onClick={() => setActiveMainTab(activeMainTab === "gov" ? "none" : "gov")}
          className={`text-left rounded-3xl p-5 transition-all transform hover:-translate-y-1 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] ${
            activeMainTab === "gov"
              ? "ring-4 ring-blue-500/40 shadow-lg scale-[1.01]"
              : "opacity-95 hover:opacity-100"
          }`}
          style={{
            background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 60%, #7C3AED 100%)",
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl text-white shadow-inner">
              🏛️
            </div>
            <Badge className="bg-white/25 text-white backdrop-blur-sm border-white/30 text-[10px]">
              {activeMainTab === "gov" ? "তালিকা সক্রিয় (Active)" : "Citizen Portals"}
            </Badge>
          </div>
          <div className="text-white mt-3">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">প্রয়োজনীয় সরকারি ওয়েবসাইট</h3>
            <p className="text-xs text-blue-100/90 font-medium">
              সরকারি পরিষেবা • Citizen Portals • Essential Links
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-2.5 bg-white/20 hover:bg-white/30 rounded-xl px-2.5 py-1 w-fit transition-all backdrop-blur-sm">
              <span>{activeMainTab === "gov" ? "সংক্ষিপ্ত করুন / Collapse Portals ✕" : "👉 ক্লিক করে পোর্টালগুলো সামনে আনুন (Click to Reveal) ↓"}</span>
            </div>
          </div>
        </button>

        {/* Banner 2: Online Tools */}
        <button
          type="button"
          onClick={() => setActiveMainTab(activeMainTab === "tools" ? "none" : "tools")}
          className={`text-left rounded-3xl p-5 transition-all transform hover:-translate-y-1 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] ${
            activeMainTab === "tools"
              ? "ring-4 ring-amber-500/40 shadow-lg scale-[1.01]"
              : "opacity-95 hover:opacity-100"
          }`}
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #EA580C 50%, #DC2626 100%)",
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl text-white shadow-inner">
              🛠️
            </div>
            <Badge className="bg-white/25 text-white backdrop-blur-sm border-white/30 text-[10px]">
              {activeMainTab === "tools" ? "টুলস সক্রিয় (Active)" : "Cyber Cafe Utilities"}
            </Badge>
          </div>
          <div className="text-white mt-3">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">Useful Online Tools</h3>
            <p className="text-xs text-amber-100/90 font-medium">
              Resize • Compress • Convert • PDF • Photo Tools
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-2.5 bg-white/20 hover:bg-white/30 rounded-xl px-2.5 py-1 w-fit transition-all backdrop-blur-sm">
              <span>{activeMainTab === "tools" ? "টুলস বন্ধ করুন ✕" : "👉 ফটো রিসাইজার ও কম্প্রেসর খুলুন ↓"}</span>
            </div>
          </div>
        </button>

        {/* Banner 3: Smart Card Crop Tool */}
        <button
          type="button"
          onClick={() => setActiveMainTab(activeMainTab === "smart_crop" ? "none" : "smart_crop")}
          className={`text-left rounded-3xl p-5 transition-all transform hover:-translate-y-1 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] ${
            activeMainTab === "smart_crop"
              ? "ring-4 ring-purple-500/40 shadow-lg scale-[1.01]"
              : "opacity-95 hover:opacity-100"
          }`}
          style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)",
          }}
        >
          <div className="flex items-start justify-between w-full">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl text-white shadow-inner">
              ✂️
            </div>
            <Badge className="bg-white/25 text-white backdrop-blur-sm border-white/30 text-[10px]">
              {activeMainTab === "smart_crop" ? "ক্রপার সক্রিয় (Active)" : "Smart Card Crop"}
            </Badge>
          </div>
          <div className="text-white mt-3">
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              Voter, Aadhaar, PAN & Ration Smart Card Format
            </h3>
            <p className="text-xs text-pink-100/90 font-medium">
              Official Standard ID-1 Alignment & A4 Documentation
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold mt-2.5 bg-white/20 hover:bg-white/30 rounded-xl px-2.5 py-1 w-fit transition-all backdrop-blur-sm">
              <span>{activeMainTab === "smart_crop" ? "ক্রপার বন্ধ করুন ✕" : "👉 স্মার্ট কার্ড ক্রপ টুল খুলুন ↓"}</span>
            </div>
          </div>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ESSENTIAL GOVERNMENT WEBSITES (DYNAMIC ON-DEMAND FETCHER)   */}
      {/* =================================================================== */}
      {activeMainTab === "gov" && (
        <DynamicGovernmentPortalFetcher
          onClose={() => setActiveMainTab("none")}
          initialFetch={false}
        />
      )}

      {/* =================================================================== */}
      {/* TAB 2: USEFUL ONLINE TOOLS (RESIZE • COMPRESS • CONVERT)           */}
      {/* =================================================================== */}
      {activeMainTab === "tools" && (
        <section className="bg-white rounded-3xl border border-border/70 p-5 sm:p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🛠️</span>
              <h3 className="text-lg font-bold text-foreground">Useful Online Cyber Cafe Tools</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client-side fast tools for Cyber Cafes and Citizens. No files uploaded to external servers.
            </p>
          </div>

          <Tabs defaultValue="resize" className="w-full">
            <TabsList className="bg-slate-100 p-1 rounded-2xl w-fit">
              <TabsTrigger value="resize" className="rounded-xl text-xs font-semibold">
                Photo & Document Resizer
              </TabsTrigger>
              <TabsTrigger value="merger" className="rounded-xl text-xs font-semibold">
                Photo + Signature Joiner
              </TabsTrigger>
            </TabsList>

            {/* Sub-tool 1: Resize & Compress */}
            <TabsContent value="resize" className="pt-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload & Controls */}
                <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    1. Upload Photo / Document
                  </h4>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleCompressFile}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-dashed border-2 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-amber-500/5 hover:border-amber-400"
                  >
                    <Upload className="w-6 h-6 text-amber-600" />
                    <span className="text-xs font-semibold">
                      {compressImage ? "Choose a Different Image" : "Click to Upload JPG/PNG File"}
                    </span>
                    {origFileSizeKb > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        Original Size: {origFileSizeKb} KB
                      </span>
                    )}
                  </Button>

                  {/* Target KB Presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Target File Size (Gov Exam / Portal Preset):
                    </label>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {[20, 50, 100, 200].map((kb) => (
                        <button
                          key={kb}
                          type="button"
                          onClick={() => {
                            setTargetKb(kb);
                            if (compressImage) performClientCompression(compressImage, targetWidth, targetHeight, kb);
                          }}
                          className={`py-2 rounded-xl font-bold border transition-all ${
                            targetKb === kb
                              ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                              : "bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          &lt; {kb} KB
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Dimension Presets */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">
                      Standard Dimensions:
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetWidth(413);
                          setTargetHeight(531);
                          if (compressImage) performClientCompression(compressImage, 413, 531, targetKb);
                        }}
                        className="text-xs rounded-xl font-medium"
                      >
                        Passport (3.5 × 4.5 cm)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTargetWidth(280);
                          setTargetHeight(120);
                          if (compressImage) performClientCompression(compressImage, 280, 120, targetKb);
                        }}
                        className="text-xs rounded-xl font-medium"
                      >
                        Signature (140 × 60 px)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Live Preview & Download */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                      2. Live Optimized Preview
                    </h4>

                    {compressedResult ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border shadow-xs max-h-60 overflow-hidden flex items-center justify-center">
                          <img
                            src={compressedResult}
                            alt="Compressed preview"
                            className="max-h-56 max-w-full object-contain rounded-lg"
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <Badge variant="outline" className="bg-white">
                            Target: ~{targetKb} KB
                          </Badge>
                          <Badge className="bg-emerald-600 text-white font-bold">
                            Result: {compressedSizeKb} KB
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 border rounded-2xl flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4">
                        <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                        <span>Upload an image to see live compressed output</span>
                      </div>
                    )}
                  </div>

                  {compressedResult && (
                    <Button
                      type="button"
                      asChild
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl"
                    >
                      <a href={compressedResult} download="compressed_gov_photo.jpg">
                        <Download className="w-4 h-4 mr-2" />
                        Download Optimized Image ({compressedSizeKb} KB)
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Sub-tool 2: Photo + Signature Merger */}
            <TabsContent value="merger" className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Photo Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border space-y-3 text-center">
                  <h4 className="text-xs font-bold text-foreground">1. Applicant Photo</h4>
                  {photoImage ? (
                    <img src={photoImage} alt="Photo" className="h-36 mx-auto object-cover rounded-lg border" />
                  ) : (
                    <div className="h-36 border-dashed border-2 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                      No Photo Loaded
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = (ev) => setPhotoImage(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }}
                    className="text-xs w-full"
                  />
                </div>

                {/* Sign Upload */}
                <div className="p-4 rounded-2xl bg-slate-50 border space-y-3 text-center">
                  <h4 className="text-xs font-bold text-foreground">2. Applicant Signature</h4>
                  {signImage ? (
                    <img src={signImage} alt="Sign" className="h-36 mx-auto object-contain rounded-lg border bg-white" />
                  ) : (
                    <div className="h-36 border-dashed border-2 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                      No Signature Loaded
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = (ev) => setSignImage(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }}
                    className="text-xs w-full"
                  />
                </div>

                {/* Result */}
                <div className="p-4 rounded-2xl bg-slate-50 border space-y-3 text-center flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-foreground">3. Combined Output</h4>
                  {mergedResult ? (
                    <img src={mergedResult} alt="Merged" className="h-36 mx-auto object-contain rounded-lg border shadow-xs" />
                  ) : (
                    <div className="h-36 border-dashed border-2 rounded-xl flex items-center justify-center text-xs text-muted-foreground">
                      Preview Will Appear Here
                    </div>
                  )}
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      onClick={handleMergePhotoAndSign}
                      className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Join Photo & Signature
                    </Button>
                    {mergedResult && (
                      <Button asChild size="sm" variant="outline" className="w-full text-xs font-bold">
                        <a href={mergedResult} download="merged_photo_signature.jpg">
                          Download Joined Image
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SMART CARD CROP TOOL (AADHAAR, VOTER, PAN, RATION, AYUSHMAN)*/}
      {/* =================================================================== */}
      {activeMainTab === "smart_crop" && (
        <section className="bg-white rounded-3xl border border-border/70 p-5 sm:p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">✂️</span>
                <h3 className="text-lg font-bold text-foreground">
                  Voter, Aadhaar, PAN, Ration & Ayushman Smart Card Formatting Tool
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard ISO/IEC 7810 ID-1 Card Formatter (85.60 mm × 53.98 mm). Align and format citizen cards side-by-side on A4 for official office and citizen documentation.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={handleDownloadCardPdf}
                className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ISO A4 PDF</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrintCardSheet}
                className="text-xs h-9 font-bold gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card Sheet</span>
              </Button>
            </div>
          </div>

          {/* Card Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "aadhaar", label: "🪪 Aadhaar Card (Cut Letter)" },
              { id: "voter", label: "🗳️ Voter ID Card (EPIC)" },
              { id: "pan", label: "💳 PAN Card" },
              { id: "ration", label: "🌾 Digital Ration Card" },
              { id: "ayushman", label: "🏥 Ayushman / Swasthya Sathi" },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCardType(c.id as any)}
                className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
                  cardType === c.id
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Upload Cards Front & Back */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Side */}
            <div className="p-4 rounded-2xl bg-slate-50 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Front Side Image
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">85.6 mm × 53.98 mm</span>
              </div>

              {frontCardImg ? (
                <div className="relative group border-2 border-purple-300 rounded-xl overflow-hidden bg-white aspect-[1.586] flex items-center justify-center">
                  <img src={frontCardImg} alt="Card Front" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setFrontCardImg(null)}
                    className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="border-dashed border-2 border-purple-200 hover:border-purple-400 rounded-xl aspect-[1.586] flex flex-col items-center justify-center p-4 cursor-pointer bg-purple-50/20 text-center">
                  <Upload className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-xs font-bold text-foreground">Upload Front Side</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Click to browse JPG, PNG or PDF screenshot
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = (ev) => setFrontCardImg(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Back Side */}
            <div className="p-4 rounded-2xl bg-slate-50 border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                  Back Side Image
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">85.6 mm × 53.98 mm</span>
              </div>

              {backCardImg ? (
                <div className="relative group border-2 border-purple-300 rounded-xl overflow-hidden bg-white aspect-[1.586] flex items-center justify-center">
                  <img src={backCardImg} alt="Card Back" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setBackCardImg(null)}
                    className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="border-dashed border-2 border-purple-200 hover:border-purple-400 rounded-xl aspect-[1.586] flex flex-col items-center justify-center p-4 cursor-pointer bg-purple-50/20 text-center">
                  <Upload className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-xs font-bold text-foreground">Upload Back Side</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Click to browse JPG, PNG or PDF screenshot
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = (ev) => setBackCardImg(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Side-by-side A4 Sheet Preview */}
          <div className="p-5 rounded-2xl bg-slate-100 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-purple-600" />
                <span>A4 Sheet Printable Preview (Front & Back Aligned)</span>
              </span>
              <span className="text-[11px] text-muted-foreground">Cutting guide marks included</span>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-inner max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* Front Preview */}
              <div className="w-48 aspect-[1.586] border border-dashed border-slate-400 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center text-center p-2 relative shadow-xs">
                {frontCardImg ? (
                  <img src={frontCardImg} alt="Front" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">FRONT SIDE</span>
                )}
                <span className="absolute bottom-0.5 left-1 text-[7px] text-slate-400 font-mono">85.6mm</span>
              </div>

              {/* Back Preview */}
              <div className="w-48 aspect-[1.586] border border-dashed border-slate-400 rounded-md overflow-hidden bg-slate-50 flex items-center justify-center text-center p-2 relative shadow-xs">
                {backCardImg ? (
                  <img src={backCardImg} alt="Back" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-muted-foreground">BACK SIDE</span>
                )}
                <span className="absolute bottom-0.5 left-1 text-[7px] text-slate-400 font-mono">85.6mm</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
