import { Skeleton } from '@/components/ui/skeleton';

export default function ReportDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8" aria-busy="true">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="space-y-3 border-t border-border pt-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  );
}
