import React from "react";

interface HorizontalRulerProps {
  widthMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  scale?: number;
}

interface VerticalRulerProps {
  heightMm: number;
  marginTopMm: number;
  marginBottomMm: number;
  scale?: number;
}

/**
 * Microsoft Word-style horizontal millimeter ruler.
 * Displays 0, 10, 20, 30... mm ticks with margin boundary highlights.
 */
export const HorizontalRuler: React.FC<HorizontalRulerProps> = ({
  widthMm,
  marginLeftMm,
  marginRightMm,
  scale = 1,
}) => {
  const step = 10; // mm label step
  const totalSteps = Math.ceil(widthMm / step);
  const printableStart = (marginLeftMm / widthMm) * 100;
  const printableWidth = ((widthMm - marginLeftMm - marginRightMm) / widthMm) * 100;

  return (
    <div
      className="relative h-6 bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 select-none text-[9px] font-mono text-slate-600 dark:text-slate-400 overflow-hidden"
      style={{ width: "100%" }}
    >
      {/* Margin zones */}
      <div
        className="absolute top-0 bottom-0 bg-slate-200/80 dark:bg-slate-800/80 border-r border-amber-500/60"
        style={{ left: 0, width: `${printableStart}%` }}
        title={`Left Margin: ${marginLeftMm} mm`}
      />
      <div
        className="absolute top-0 bottom-0 bg-emerald-500/10"
        style={{ left: `${printableStart}%`, width: `${printableWidth}%` }}
        title="Printable Area"
      />
      <div
        className="absolute top-0 bottom-0 bg-slate-200/80 dark:bg-slate-800/80 border-l border-amber-500/60"
        style={{ right: 0, width: `${(marginRightMm / widthMm) * 100}%` }}
        title={`Right Margin: ${marginRightMm} mm`}
      />

      {/* Millimeter markings */}
      {Array.from({ length: totalSteps + 1 }).map((_, i) => {
        const mm = i * step;
        if (mm > widthMm) return null;
        const leftPercent = (mm / widthMm) * 100;
        return (
          <div
            key={mm}
            className="absolute top-0 h-full flex flex-col justify-between"
            style={{ left: `${leftPercent}%` }}
          >
            <span className="leading-none pl-0.5 pt-0.5 text-[8px]">{mm}</span>
            <div className="w-[1px] h-2 bg-slate-400 dark:bg-slate-600 self-start" />
          </div>
        );
      })}
    </div>
  );
};

/**
 * Microsoft Word-style vertical millimeter ruler.
 */
export const VerticalRuler: React.FC<VerticalRulerProps> = ({
  heightMm,
  marginTopMm,
  marginBottomMm,
}) => {
  const step = 10;
  const totalSteps = Math.ceil(heightMm / step);
  const printableTop = (marginTopMm / heightMm) * 100;
  const printableHeight = ((heightMm - marginTopMm - marginBottomMm) / heightMm) * 100;

  return (
    <div
      className="relative w-6 bg-slate-100 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 select-none text-[8px] font-mono text-slate-600 dark:text-slate-400 overflow-hidden"
      style={{ height: "100%" }}
    >
      {/* Margin zones */}
      <div
        className="absolute left-0 right-0 bg-slate-200/80 dark:bg-slate-800/80 border-b border-amber-500/60"
        style={{ top: 0, height: `${printableTop}%` }}
        title={`Top Margin: ${marginTopMm} mm`}
      />
      <div
        className="absolute left-0 right-0 bg-emerald-500/10"
        style={{ top: `${printableTop}%`, height: `${printableHeight}%` }}
        title="Printable Area"
      />
      <div
        className="absolute left-0 right-0 bg-slate-200/80 dark:bg-slate-800/80 border-t border-amber-500/60"
        style={{ bottom: 0, height: `${(marginBottomMm / heightMm) * 100}%` }}
        title={`Bottom Margin: ${marginBottomMm} mm`}
      />

      {/* Millimeter markings */}
      {Array.from({ length: totalSteps + 1 }).map((_, i) => {
        const mm = i * step;
        if (mm > heightMm) return null;
        const topPercent = (mm / heightMm) * 100;
        return (
          <div
            key={mm}
            className="absolute left-0 w-full flex items-center justify-between"
            style={{ top: `${topPercent}%` }}
          >
            <span className="leading-none pl-0.5 text-[8px]">{mm}</span>
            <div className="h-[1px] w-2 bg-slate-400 dark:bg-slate-600" />
          </div>
        );
      })}
    </div>
  );
};
