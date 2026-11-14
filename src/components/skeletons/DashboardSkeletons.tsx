import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export { Skeleton };

/**
 * Skeleton placeholder for list items like notices, updates, or audit rows.
 */
export function ListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-white/70 p-4 space-y-2.5 animate-pulse"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-4/5 rounded-md" />
          <Skeleton className="h-3 w-2/3 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder for stat counters & metric tiles.
 */
export function MetricCardsSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 bg-white/80 p-4 space-y-3 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-2.5 w-28 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton placeholder for application cards (Citizen / Admin application lists).
 */
export function ApplicationListSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-white p-5 space-y-3.5 shadow-2xs animate-pulse"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-48 rounded" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="pt-2 border-t border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-full rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Table rows skeleton for DataTable.
 */
export function TableRowsSkeleton({ columns = 5, rows = 4 }: { columns?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-border/20 last:border-0 animate-pulse">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} className="px-3 py-3.5 align-middle">
              <Skeleton
                className={cn(
                  "h-4 rounded",
                  cIdx === 0 ? "w-28" : cIdx === 1 ? "w-36" : cIdx === 2 ? "w-20" : "w-16"
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
