import React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DataStateViewProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  emptyAction?: React.ReactNode;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
}

export const DataStateView: React.FC<DataStateViewProps> = ({
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingLabel = "Loading records...",
  emptyTitle = "No records found",
  emptyDescription = "There are currently no items matching this view.",
  errorTitle = "Unable to load data",
  errorMessage = "Please check your connection and try again.",
  onRetry,
  retryLabel = "Try Again",
  emptyAction,
  skeleton,
  children,
}) => {
  if (isLoading) {
    if (skeleton) {
      return (
        <div role="status" aria-busy="true" aria-label={loadingLabel}>
          {skeleton}
          <span className="sr-only">{loadingLabel}</span>
        </div>
      );
    }

    return (
      <div
        role="status"
        aria-busy="true"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center"
      >
        <Loader2 className="h-6 w-6 animate-spin text-blue-700" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-700">{loadingLabel}</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-8 text-center"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-bold text-slate-900">{errorTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-600">{errorMessage}</p>
        </div>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="min-h-[40px] gap-2 rounded-xl border-rose-300 bg-white text-rose-900 hover:bg-rose-50"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>{retryLabel}</span>
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/80 text-slate-700">
          <Inbox className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-w-md">
          <h3 className="text-base font-bold text-slate-900">{emptyTitle}</h3>
          <p className="text-xs sm:text-sm text-slate-600">{emptyDescription}</p>
        </div>
        {emptyAction && <div className="pt-1">{emptyAction}</div>}
      </div>
    );
  }

  return <>{children}</>;
};
