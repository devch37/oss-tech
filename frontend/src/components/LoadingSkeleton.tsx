import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function HeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-28 rounded-full" />
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
  );
}

export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-xl" />
          </div>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('divide-y rounded-2xl border bg-card shadow-soft', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 flex-1 max-w-xs" />
          <Skeleton className="hidden h-1.5 w-40 rounded-full sm:block" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('w-full rounded-2xl', className ?? 'h-64')} />;
}
