import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** StatCard 스켈레톤 (4개 그리드용) */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <Skeleton className="h-8 w-20 mt-1" />
          <Skeleton className="h-3 w-28 mt-2" />
        </div>
      ))}
    </div>
  );
}

/** 테이블 행 스켈레톤 */
export function TableRowsSkeleton({ rows = 10, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton
              key={j}
              className={cn('h-4', j === 0 ? 'w-40' : j === cols - 1 ? 'w-16' : 'w-24')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** 차트 영역 스켈레톤 */
export function ChartSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('w-full rounded-xl', className ?? 'h-64')} />;
}

/** 전체 페이지 스켈레톤 (제목 + 카드 그리드 + 차트) */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <StatCardsSkeleton />
      <ChartSkeleton className="h-72" />
    </div>
  );
}
