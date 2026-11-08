import { CardSkeleton, StatTilesSkeleton } from '@/components/LoadingSkeleton';

export default function HomeLoading() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <CardSkeleton className="h-52 rounded-3xl" />
      <StatTilesSkeleton />
      <div className="grid gap-4 lg:grid-cols-3">
        <CardSkeleton className="h-96 lg:col-span-2" />
        <CardSkeleton className="h-96" />
      </div>
    </div>
  );
}
