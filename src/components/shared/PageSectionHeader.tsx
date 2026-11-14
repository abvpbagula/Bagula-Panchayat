import React from "react";

export interface PageSectionHeaderProps {
  kicker?: string;
  title: string;
  bengaliTitle?: string;
  description?: string;
  action?: React.ReactNode;
  headingId?: string;
}

export const PageSectionHeader: React.FC<PageSectionHeaderProps> = ({
  kicker,
  title,
  bengaliTitle,
  description,
  action,
  headingId,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200 pb-4">
      <div className="space-y-1 min-w-0">
        {kicker && (
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-900">
            {kicker}
          </p>
        )}
        <h2
          id={headingId}
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h2>
        {bengaliTitle && (
          <p className="text-xs sm:text-sm font-semibold text-blue-800 font-bengali">
            {bengaliTitle}
          </p>
        )}
        {description && (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};
