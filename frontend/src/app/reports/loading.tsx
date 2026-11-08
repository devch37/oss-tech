import { CardSkeleton, HeaderSkeleton } from '@/components/LoadingSkeleton';

export default function ReportsLoading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton className="h-56 sm:col-span-2" />
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  );
}
