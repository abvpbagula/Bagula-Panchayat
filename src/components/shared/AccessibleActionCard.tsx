import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export type ActionCardAccent = "blue" | "emerald" | "amber" | "orange" | "slate";

export interface AccessibleActionCardProps {
  title: string;
  subtitle?: string;
  description: string;
  ctaLabel: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  metadataText?: string;
  accent?: ActionCardAccent;
  disabled?: boolean;
}

const ACCENT_MAP: Record<
  ActionCardAccent,
  {
    iconBox: string;
    subtitle: string;
    button: string;
    ring: string;
  }
> = {
  blue: {
    iconBox: "bg-blue-50 text-blue-800 border-blue-100",
    subtitle: "text-blue-800",
    button: "bg-blue-700 hover:bg-blue-800 text-white",
    ring: "focus-visible:ring-blue-600",
  },
  emerald: {
    iconBox: "bg-emerald-50 text-emerald-800 border-emerald-100",
    subtitle: "text-emerald-800",
    button: "bg-emerald-700 hover:bg-emerald-800 text-white",
    ring: "focus-visible:ring-emerald-600",
  },
  amber: {
    iconBox: "bg-amber-50 text-amber-800 border-amber-100",
    subtitle: "text-amber-900",
    button: "bg-amber-600 hover:bg-amber-700 text-white",
    ring: "focus-visible:ring-amber-600",
  },
  orange: {
    iconBox: "bg-orange-50 text-orange-800 border-orange-100",
    subtitle: "text-orange-800",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
    ring: "focus-visible:ring-orange-600",
  },
  slate: {
    iconBox: "bg-slate-100 text-slate-800 border-slate-200",
    subtitle: "text-slate-700",
    button: "bg-slate-900 hover:bg-slate-800 text-white",
    ring: "focus-visible:ring-slate-700",
  },
};

export const AccessibleActionCard: React.FC<AccessibleActionCardProps> = ({
  title,
  subtitle,
  description,
  ctaLabel,
  to,
  href,
  onClick,
  icon,
  metadataText,
  accent = "blue",
  disabled = false,
}) => {
  const palette = ACCENT_MAP[accent];

  const ctaContent = (
    <>
      <span className="truncate">{ctaLabel}</span>
      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </>
  );

  const ctaClass = `group inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${palette.button} ${palette.ring} ${
    disabled ? "opacity-50 pointer-events-none" : ""
  }`;

  return (
    <article className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      <div className="space-y-3">
        {(icon || metadataText) && (
          <div className="flex items-start justify-between gap-2">
            {icon ? (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${palette.iconBox}`}
                aria-hidden="true"
              >
                {icon}
              </div>
            ) : (
              <span />
            )}
            {metadataText && (
              <span className="text-xs font-medium text-slate-500 tabular-nums">
                {metadataText}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold leading-snug text-slate-900">
            {title}
          </h3>
          {subtitle && (
            <p className={`text-xs font-semibold ${palette.subtitle}`}>
              {subtitle}
            </p>
          )}
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 pt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        {to ? (
          <Link to={to} className={ctaClass} aria-disabled={disabled}>
            {ctaContent}
          </Link>
        ) : href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={ctaClass}
            aria-disabled={disabled}
          >
            {ctaContent}
          </a>
        ) : (
          <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={ctaClass}
          >
            {ctaContent}
          </button>
        )}
      </div>
    </article>
  );
};
