import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FileText, CheckCircle2 } from "lucide-react";
import type { Attachments } from "./types";
import { toast } from "sonner";

const QUICK_DOCUMENT_TEMPLATES = [
  "Parents' Latest EPIC & Latest Voter List (Draft Roll 2025)",
  "Proof of Age of Daughter/Applicant (Madhyamik / Birth Certificate)",
  "Proof of Marriage (Husband GP Residential / Marriage Certificate)",
  "Bagula II GP Latest Tax Receipt of Parents",
  "EPIC Xerox of Applicant",
  "Husband's Proof of Identity / Residence (Aadhaar / EPIC)",
  "Declaration of Five People with the signature of the Prodhan",
  "Form-10 Non Availability Certificate",
  "Daima Certificate (For Birth only, 2 documents)",
  "Order of SDO / Executive Magistrate under Sec 13(3)",
  "School Admit Card / Age Proof",
  "Hospital Discharge Slip / Doctor Certificate",
];

export default function AttachmentsStep({
  value, onChange,
}: { value: Attachments; onChange: (v: Attachments) => void }) {
  const [customDocName, setCustomDocName] = useState("");
  const set = (patch: Partial<Attachments>) => onChange({ ...value, ...patch });

  const handleAddCustomDoc = (nameToAdd?: string) => {
    const targetName = (nameToAdd || customDocName).trim();
    if (!targetName) {
      toast.error("Please enter a document name");
      return;
    }

    if (value.items.some((it) => it.label.toLowerCase() === targetName.toLowerCase())) {
      toast.info("This document is already in the checklist");
      return;
    }

    set({
      items: [
        ...value.items,
        { label: targetName, provided: true, isCustom: true },
      ],
    });
    setCustomDocName("");
    toast.success(`Added document: ${targetName}`);
  };

  const handleRemoveDoc = (indexToRemove: number) => {
    set({
      items: value.items.filter((_, idx) => idx !== indexToRemove),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold flex items-center gap-2">
          <span>📎</span>
          <span>Declaration &amp; Attachments / সংযুক্ত প্রমাণ্য নথিসমূহ</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Tick the verified documents collected at the counter. Physical copies remain preserved in the official dossier.
        </p>
      </div>

      {/* Main Checklist */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Prescribed &amp; Attached Documents Checklist ({value.items.filter((it) => it.provided).length}/{value.items.length})
          </Label>
        </div>

        <ul className="space-y-2">
          {value.items.map((item, i) => (
            <li key={`${item.label}-${i}`}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-background/80 p-3 hover:border-primary/40 transition-colors text-sm">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                  <Checkbox
                    checked={item.provided}
                    onCheckedChange={(c) =>
                      set({
                        items: value.items.map((it, idx) =>
                          idx === i ? { ...it, provided: c === true } : it
                        ),
                      })
                    }
                  />
                  <span className={`truncate ${item.provided ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                    {item.label}
                  </span>
                  {item.isCustom && (
                    <Badge variant="secondary" className="text-[10px] shrink-0 font-normal">
                      Custom
                    </Badge>
                  )}
                </label>

                {item.isCustom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleRemoveDoc(i)}
                    title="Remove document"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Section 4: Other, I will add names and can add more documents */}
      <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-3">
        <div className="space-y-0.5">
          <Label className="text-xs font-bold text-primary flex items-center gap-1.5">
            <Plus size={14} />
            <span>4. Other, I will add names and can add more documents / অন্যান্য নথি সংযোজন</span>
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Type any additional document name and add unlimited supporting records to this application file.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            value={customDocName}
            onChange={(e) => setCustomDocName(e.target.value)}
            placeholder="e.g. SDO Order Copy, Daima Certificate, School Admit Card..."
            className="text-xs bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomDoc();
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => handleAddCustomDoc()}
            className="text-xs gap-1.5 shrink-0"
          >
            <Plus size={14} /> Add Document
          </Button>
        </div>

        {/* Quick Suggestions for Convenience */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Suggested Statutory Additions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_DOCUMENT_TEMPLATES.map((tmpl) => {
              const alreadyAdded = value.items.some((it) => it.label === tmpl);
              if (alreadyAdded) return null;
              return (
                <button
                  key={tmpl}
                  type="button"
                  onClick={() => handleAddCustomDoc(tmpl)}
                  className="text-[11px] px-2 py-1 rounded-md border border-border/80 bg-background hover:bg-primary/10 hover:text-primary transition-colors text-left"
                >
                  + {tmpl}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="att-notes" className="text-xs font-semibold">
          Office notes &amp; Verification Remarks (optional)
        </Label>
        <Textarea
          id="att-notes"
          rows={3}
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Record volume folio verification, SDO case status or special remarks..."
          className="text-xs"
        />
      </div>

      <label className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 text-xs text-foreground cursor-pointer">
        <Checkbox
          checked={value.declarationAccepted}
          onCheckedChange={(c) => set({ declarationAccepted: c === true })}
          className="mt-0.5"
        />
        <span className="leading-relaxed">
          I declare that the information and documentary records entered above were produced by the
          applicant/claimant and verified against the physical documents produced at the Bagula 2 No Gram
          Panchayat office counter.
        </span>
      </label>
    </div>
  );
}
