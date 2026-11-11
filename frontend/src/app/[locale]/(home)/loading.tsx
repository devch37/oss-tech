import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading() {
  return (
    <div className="space-y-12" aria-busy="true">
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
      <Skeleton className="h-[420px] w-full" />
      <div className="grid gap-12 lg:grid-cols-[7fr_5fr]">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
