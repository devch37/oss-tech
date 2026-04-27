import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn, formatGrowthRate, getGrowthRateColor } from '@/lib/utils';

interface GrowthBadgeProps {
  rate: number;
  className?: string;
}

export function GrowthBadge({ rate, className }: GrowthBadgeProps) {
  const colorClass = getGrowthRateColor(rate);

  const Icon =
    rate > 0 ? TrendingUp : rate < 0 ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
        colorClass,
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {formatGrowthRate(rate)}
    </span>
  );
}
