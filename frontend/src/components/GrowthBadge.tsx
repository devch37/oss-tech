import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn, formatGrowthRate, getGrowthTone, getGrowthToneClass } from '@/lib/utils';

interface GrowthBadgeProps {
  rate: number;
  className?: string;
}

/** 증감률 — 색뿐 아니라 부호와 화살표를 함께 써서 색각 이상에서도 읽힌다. */
export function GrowthBadge({ rate, className }: GrowthBadgeProps) {
  const t = useTranslations('growth');
  const tone = getGrowthTone(rate);
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus;
  const value = formatGrowthRate(rate);

  return (
    <span className={cn('inline-flex items-center gap-0.5 font-medium tabular-nums', getGrowthToneClass(tone), className)}>
      <Icon className="h-[1em] w-[1em] shrink-0" aria-hidden="true" />
      <span aria-hidden="true">{value}</span>
      <span className="sr-only">{t(tone, { value })}</span>
    </span>
  );
}
