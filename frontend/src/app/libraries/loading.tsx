import { CardSkeleton, HeaderSkeleton, ListSkeleton } from '@/components/LoadingSkeleton';

export default function LibrariesLoading() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <CardSkeleton className="h-28" />
      <ListSkeleton rows={10} />
    </div>
  );
}
