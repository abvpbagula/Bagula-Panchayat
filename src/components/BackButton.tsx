import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGoBack, type UseGoBackOptions } from "@/hooks/useGoBack";

export interface BackButtonProps {
  /**
   * Safe fallback route if no useful or valid history exists.
   */
  fallbackUrl?: string;

  /**
   * Alias for fallbackUrl.
   */
  fallbackPath?: string;

  /**
   * Alias for fallbackUrl.
   */
  fallback?: string;

  /**
   * Alias for fallbackUrl.
   */
  to?: string;

  /**
   * Display label for the button. Defaults to "Go Back".
   */
  label?: ReactNode;

  /**
   * Alias for label.
   */
  text?: ReactNode;

  /**
   * Alias for label.
   */
  title?: ReactNode;

  /**
   * Accessible aria-label. Defaults to the text label or "Go Back".
   */
  ariaLabel?: string;

  /**
   * Optional classes to merge with the button styling.
   */
  className?: string;

  /**
   * Button variant from shadcn UI (ghost, outline, default, secondary, etc.). Defaults to "ghost".
   */
  variant?: ButtonProps["variant"];

  /**
   * Button size (sm, default, lg, icon). Defaults to "sm".
   */
  size?: ButtonProps["size"];

  /**
   * Whether to display the leading arrow/back icon. Defaults to true.
   */
  showIcon?: boolean;

  /**
   * Custom leading icon component or emoji node.
   */
  icon?: ReactNode;

  /**
   * If true, the button will automatically hide when rendered on root dashboard routes without prior history.
   */
  hideOnRoot?: boolean;

  /**
   * Custom path validation filter passed to useGoBack.
   */
  isAllowedPath?: (path: string) => boolean;

  /**
   * User roles to determine appropriate role-based dashboard fallback.
   */
  userRoles?: string[];
}

/**
 * Standardized Back button component for all internal citizen, DEO, and admin pages.
 * Integrates directly with `useGoBack` to ensure safe history traversal and prevent prohibited redirects.
 */
export function BackButton({
  fallbackUrl,
  fallbackPath,
  fallback,
  to,
  label,
  text,
  title,
  ariaLabel,
  className,
  variant = "ghost",
  size = "sm",
  showIcon = true,
  icon,
  hideOnRoot = false,
  isAllowedPath,
  userRoles,
}: BackButtonProps) {
  const resolvedFallback = fallbackUrl || fallbackPath || fallback || to;
  const resolvedLabel = label !== undefined ? label : (text !== undefined ? text : (title !== undefined ? title : "Go Back"));

  const { goBack, canGoBack, isRoot } = useGoBack({
    fallbackUrl: resolvedFallback,
    isAllowedPath,
    disableOnRoot: hideOnRoot,
    userRoles,
  });

  // Hide when on root page if requested and no prior safe history
  if (hideOnRoot && isRoot && !canGoBack) {
    return null;
  }

  const computedAriaLabel =
    ariaLabel || (typeof resolvedLabel === "string" ? resolvedLabel : "Go Back");

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={goBack}
      className={cn(
        "inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label={computedAriaLabel}
    >
      {showIcon && (icon || <ArrowLeft className="w-4 h-4 shrink-0" />)}
      {resolvedLabel && <span>{resolvedLabel}</span>}
    </Button>
  );
}

// Full alias for backwards compatibility
export const GoBackButton = BackButton;

export default BackButton;
