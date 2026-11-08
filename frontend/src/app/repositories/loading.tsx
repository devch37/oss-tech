import { CardSkeleton, HeaderSkeleton } from '@/components/LoadingSkeleton';

export default function RepositoriesLoading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} className="h-20" />
        ))}
      </div>
      <CardSkeleton className="h-16" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} className="h-44" />
        ))}
      </div>
    </div>
  );
}
