import { Skeleton } from '@/components/ui/skeleton';

export default function RepositoriesLoading() {
  return (
    <div className="space-y-8" aria-busy="true">
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-5 w-4/5" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[150px]" />
        <Skeleton className="h-9 w-[190px]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
