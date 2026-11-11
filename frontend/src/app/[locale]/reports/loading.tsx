import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-5 w-4/5" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    </div>
  );
}
