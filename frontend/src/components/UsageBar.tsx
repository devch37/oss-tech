import { cn } from '@/lib/utils';

/** 상대 비교용 가로 막대 (0~100%) */
export function UsageBar({
  value,
  max,
  className,
  tone = 'primary',
}: {
  value: number;
  max: number;
  className?: string;
  tone?: 'primary' | 'success' | 'danger';
}) {
  const pct = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  const color = tone === 'success' ? 'bg-success' : tone === 'danger' ? 'bg-danger' : 'bg-primary';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)} aria-hidden>
      <div
        className={cn('h-full origin-left animate-grow-x rounded-full opacity-80', color)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
