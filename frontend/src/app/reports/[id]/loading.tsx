import { Skeleton } from '@/components/ui/skeleton';
import { CardSkeleton } from '@/components/LoadingSkeleton';

const WIDTHS = ['92%', '78%', '85%', '70%', '96%', '64%', '88%', '74%', '90%', '60%'];

export default function ReportDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-7 w-28 rounded-full" />
      <CardSkeleton className="h-52 rounded-3xl" />
      <div className="space-y-4 rounded-3xl border bg-card p-6 shadow-soft sm:p-10">
        {WIDTHS.map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}
