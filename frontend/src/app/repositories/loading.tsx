import { Skeleton } from '@/components/ui/skeleton';
import { TableRowsSkeleton } from '@/components/LoadingSkeleton';

export default function RepositoriesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Controls skeleton */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16" />
        ))}
        <div className="flex-1" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-4 w-20" />
      {/* Table skeleton */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <TableRowsSkeleton rows={15} cols={7} />
      </div>
    </div>
  );
}
