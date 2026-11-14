import React from "react";

interface MillimeterRulerProps {
  lengthMm: number;
  orientation: "horizontal" | "vertical";
  zoomFactor: number; // pixels per mm (e.g. 1mm = 3.78px at 96dpi * scale)
  marginStartMm?: number;
  marginEndMm?: number;
}

export const MillimeterRuler: React.FC<MillimeterRulerProps> = ({
  lengthMm,
  orientation,
  zoomFactor,
  marginStartMm,
  marginEndMm,
}) => {
  const isHorizontal = orientation === "horizontal";
  const numMajorTicks = Math.floor(lengthMm / 10);
  const totalLengthPx = lengthMm * zoomFactor;

  // Generate tick marks
  const ticks: React.ReactNode[] = [];
  for (let mm = 0; mm <= lengthMm; mm += 2) {
    const isMajor = mm % 10 === 0;
    const isMedium = mm % 5 === 0 && !isMajor;
    const posPx = mm * zoomFactor;

    if (isHorizontal) {
      ticks.push(
        <div
          key={`tick-${mm}`}
          className="absolute border-gray-400"
          style={{
            left: `${posPx}px`,
            bottom: 0,
            width: "1px",
            height: isMajor ? "12px" : isMedium ? "8px" : "4px",
            borderLeft: "1px solid #94a3b8",
          }}
        >
          {isMajor && (
            <span
              className="absolute -top-3.5 -left-2 text-[9px] text-slate-500 font-mono select-none pointer-events-none"
              style={{ fontSize: "9px" }}
            >
              {mm}
            </span>
          )}
        </div>
      );
    } else {
      ticks.push(
        <div
          key={`tick-${mm}`}
          className="absolute border-gray-400"
          style={{
            top: `${posPx}px`,
            right: 0,
            height: "1px",
            width: isMajor ? "12px" : isMedium ? "8px" : "4px",
            borderTop: "1px solid #94a3b8",
          }}
        >
          {isMajor && (
            <span
              className="absolute -left-5 -top-1.5 text-[9px] text-slate-500 font-mono select-none pointer-events-none"
              style={{ fontSize: "9px" }}
            >
              {mm}
            </span>
          )}
        </div>
      );
    }
  }

  // Margin indicators
  const marginStartPx = marginStartMm ? marginStartMm * zoomFactor : 0;
  const marginEndPx = marginEndMm ? (lengthMm - marginEndMm) * zoomFactor : 0;

  if (isHorizontal) {
    return (
      <div
        className="relative bg-slate-100 border-b border-slate-300 text-slate-600 select-none overflow-hidden"
        style={{
          width: `${totalLengthPx}px`,
          height: "22px",
        }}
      >
        {/* Shaded margin regions */}
        {marginStartMm && (
          <div
            className="absolute top-0 bottom-0 left-0 bg-slate-200/70 border-r border-amber-500/60"
            style={{ width: `${marginStartPx}px` }}
            title={`Left Margin: ${marginStartMm}mm`}
          />
        )}
        {marginEndMm && (
          <div
            className="absolute top-0 bottom-0 right-0 bg-slate-200/70 border-l border-amber-500/60"
            style={{ width: `${marginEndMm * zoomFactor}px` }}
            title={`Right Margin: ${marginEndMm}mm`}
          />
        )}
        {ticks}
      </div>
    );
  }

  return (
    <div
      className="relative bg-slate-100 border-r border-slate-300 text-slate-600 select-none overflow-hidden"
      style={{
        height: `${totalLengthPx}px`,
        width: "24px",
      }}
    >
      {/* Shaded margin regions */}
      {marginStartMm && (
        <div
          className="absolute top-0 left-0 right-0 bg-slate-200/70 border-b border-amber-500/60"
          style={{ height: `${marginStartPx}px` }}
          title={`Top Margin: ${marginStartMm}mm`}
        />
      )}
      {marginEndMm && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-slate-200/70 border-t border-amber-500/60"
          style={{ height: `${marginEndMm * zoomFactor}px` }}
          title={`Bottom Margin: ${marginEndMm}mm`}
        />
      )}
      {ticks}
    </div>
  );
};
