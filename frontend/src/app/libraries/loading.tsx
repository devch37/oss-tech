import { Skeleton } from '@/components/ui/skeleton';
import { TableRowsSkeleton } from '@/components/LoadingSkeleton';

export default function LibrariesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Controls skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-4 w-24" />
      {/* Table skeleton */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <TableRowsSkeleton rows={15} cols={5} />
      </div>
    </div>
  );
}
