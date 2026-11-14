import React from "react";
import { AlertCircle, CheckCircle2, ShieldAlert, Info, Scale } from "lucide-react";
import { evaluatePaternalRelationship } from "@/lib/paternalRelationshipRules";
import { Badge } from "@/components/ui/badge";

interface Props {
  relationshipCodeOrLabel: string;
  className?: string;
  showStatutoryCitations?: boolean;
}

export const PaternalValidationAlert: React.FC<Props> = ({
  relationshipCodeOrLabel,
  className = "",
  showStatutoryCitations = true,
}) => {
  const result = evaluatePaternalRelationship(relationshipCodeOrLabel);

  if (result.isEligible) {
    return (
      <div className={`p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 text-xs space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{result.alertTitleEn}</span>
          </div>
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
            Admissible Bloodline
          </Badge>
        </div>
        <p className="font-bengali text-emerald-900 font-medium">
          {result.alertTitleBn}: {result.rule.labelBn}
        </p>
        <p className="text-[11px] text-emerald-900/80 leading-relaxed">
          {result.alertMessageEn}
        </p>
        {showStatutoryCitations && (
          <div className="pt-1 border-t border-emerald-200/60 flex items-center gap-1 text-[10px] text-emerald-800 font-mono">
            <Scale size={11} />
            <span>Statutory Basis: {result.rule.statutoryReference}</span>
          </div>
        )}
      </div>
    );
  }

  // Maternal or Affinal Warning
  const isMaternal = result.warningCode === "MATERNAL_INELIGIBLE";

  return (
    <div
      className={`p-3.5 rounded-xl border ${
        isMaternal
          ? "border-amber-300 bg-amber-50/90 text-amber-950"
          : "border-rose-300 bg-rose-50/90 text-rose-950"
      } text-xs space-y-1.5 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <ShieldAlert size={16} className={isMaternal ? "text-amber-600 shrink-0" : "text-rose-600 shrink-0"} />
          <span>{result.alertTitleEn}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] font-semibold ${
            isMaternal
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-rose-100 text-rose-800 border-rose-300"
          }`}
        >
          {isMaternal ? "Maternal Pathway Restriction" : "Affinal Inadmissibility"}
        </Badge>
      </div>

      <p className="font-bengali font-semibold text-[11px]">
        {result.alertTitleBn}
      </p>

      <p className="text-[11px] leading-relaxed">
        {result.alertMessageEn}
      </p>

      <div className="p-2 rounded-lg bg-white/70 border border-amber-200/60 text-[10px] space-y-0.5">
        <span className="font-bold flex items-center gap-1">
          <Info size={11} className="text-primary" />
          Administrative Note for Citizen &amp; Operator:
        </span>
        <p className="text-muted-foreground leading-snug">
          The application record will preserve your entered details, but the West Bengal Caste Certificate scrutiny authority requires evidence linking to an ancestor on the <strong>biological father&apos;s agnatic side</strong>. Please enter the paternal grandfather, paternal uncle, or father&apos;s caste certificate holder for approval.
        </p>
      </div>

      {showStatutoryCitations && (
        <div className="pt-1 border-t border-amber-200/60 flex items-center gap-1 text-[10px] text-amber-900/80 font-mono">
          <Scale size={11} />
          <span>Legal Precedent: {result.rule.statutoryReference}</span>
        </div>
      )}
    </div>
  );
};
