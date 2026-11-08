import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from 'lucide-react';
import { cn, formatGrowthRate } from '@/lib/utils';

interface GrowthBadgeProps {
  rate: number;
  /** 지난달 0 → 이번 달 등장한 경우 "NEW" 로 표시 */
  isNew?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function GrowthBadge({ rate, isNew, size = 'sm', className }: GrowthBadgeProps) {
  const base = cn(
    'inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums ring-1 ring-inset',
    size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-sm',
    className,
  );

  if (isNew) {
    return (
      <span className={cn(base, 'bg-primary/10 text-primary ring-primary/20')}>
        <Sparkles className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        NEW
      </span>
    );
  }

  const tone =
    rate > 0
      ? 'bg-success/10 text-success ring-success/20'
      : rate < 0
        ? 'bg-danger/10 text-danger ring-danger/20'
        : 'bg-muted text-muted-foreground ring-border';
  const Icon = rate > 0 ? ArrowUpRight : rate < 0 ? ArrowDownRight : Minus;

  return (
    <span className={cn(base, tone)}>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {rate === 0 ? '변동 없음' : formatGrowthRate(rate)}
    </span>
  );
}
