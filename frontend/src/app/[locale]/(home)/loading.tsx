import { Skeleton } from '@/components/ui/skeleton';

/** 새 홈 구성(제목 → 한눈에 보기 → 막대 차트 두 개)과 같은 모양의 뼈대 */
export default function HomeLoading() {
  return (
    <div className="space-y-14" aria-busy="true">
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-12 w-3/5" />
        <Skeleton className="h-5 w-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full max-w-3xl" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-80" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
