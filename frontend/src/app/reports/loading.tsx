import { Skeleton } from '@/components/ui/skeleton';

function ReportCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <div className="pt-1 border-t border-border/50">
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export default function ReportsLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Domain section 1 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Domain section 2 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
