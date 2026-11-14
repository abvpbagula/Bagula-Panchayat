import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrendInfo } from "@/lib/trendUtils";

interface TrendIndicatorProps {
  trend: TrendInfo;
  comparisonLabel?: string;
  invertColors?: boolean; // When true, downward trend is considered positive (green) and upward is warning (amber/rose)
  size?: "xs" | "sm";
  className?: string;
}

export function TrendIndicator({
  trend,
  comparisonLabel,
  invertColors = false,
  size = "xs",
  className,
}: TrendIndicatorProps) {
  const isUp = trend.direction === "up";
  const isDown = trend.direction === "down";
  const isNeutral = trend.direction === "neutral";

  // Determine sentiment badge styling
  let toneClass = "bg-slate-100 text-slate-700 border-slate-200/90";
  if (isUp) {
    toneClass = invertColors
      ? "bg-amber-50/90 text-amber-800 border-amber-300/80"
      : "bg-emerald-50/90 text-emerald-800 border-emerald-300/80";
  } else if (isDown) {
    toneClass = invertColors
      ? "bg-emerald-50/90 text-emerald-800 border-emerald-300/80"
      : "bg-rose-50/90 text-rose-800 border-rose-300/80";
  }

  const isXs = size === "xs";

  return (
    <div className={cn("inline-flex items-center gap-1.5 flex-wrap", className)}>
      <span
        className={cn(
          "inline-flex items-center font-bold font-mono border shadow-2xs transition-all",
          isXs ? "gap-0.5 px-1.5 py-0.5 text-[10px] rounded-md" : "gap-1 px-2 py-0.5 text-xs rounded-lg",
          toneClass
        )}
        title={`Current: ${trend.currentValue} | Previous: ${trend.prevValue} (${trend.formattedText})`}
      >
        {isUp && <TrendingUp className={cn(isXs ? "w-3 h-3" : "w-3.5 h-3.5", "stroke-[2.5]")} />}
        {isDown && <TrendingDown className={cn(isXs ? "w-3 h-3" : "w-3.5 h-3.5", "stroke-[2.5]")} />}
        {isNeutral && <Minus className={cn(isXs ? "w-3 h-3" : "w-3.5 h-3.5", "stroke-[2.5]")} />}
        <span>{trend.formattedText}</span>
      </span>

      {comparisonLabel && (
        <span className="text-[10px] text-muted-foreground/90 font-medium tracking-tight whitespace-nowrap">
          {comparisonLabel}
        </span>
      )}
    </div>
  );
}
