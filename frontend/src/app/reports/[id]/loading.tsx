import { Skeleton } from '@/components/ui/skeleton';

export default function ReportDetailLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back link */}
      <Skeleton className="h-5 w-32" />

      {/* Header card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card p-6 lg:p-10 shadow-sm space-y-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${70 + Math.random() * 30}%` }}
          />
        ))}
      </div>

      {/* Prev / Next */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
