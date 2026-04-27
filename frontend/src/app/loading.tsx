import { ChartSkeleton, StatCardsSkeleton, TableRowsSkeleton } from '@/components/LoadingSkeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Stat Cards */}
      <StatCardsSkeleton count={4} />

      {/* Bar Chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <ChartSkeleton className="h-52" />
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-48" />
          <TableRowsSkeleton rows={10} cols={4} />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-52" />
          <ChartSkeleton className="h-72" />
        </div>
      </div>
    </div>
  );
}
