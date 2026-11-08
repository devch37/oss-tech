import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 지표 설명 툴팁 — CSS 만으로 hover / 키보드 focus 시 표시.
 * 모든 숫자 지표 옆에 붙여 "이게 무슨 뜻이지?" 를 해소한다.
 */
export function InfoTip({
  children,
  className,
  side = 'top',
}: {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom';
}) {
  return (
    <span className={cn('group/tip relative inline-flex align-middle', className)}>
      <button
        type="button"
        aria-label="설명 보기"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-64 -translate-x-1/2 rounded-xl border bg-popover px-3 py-2.5 text-left text-xs font-normal leading-relaxed text-popover-foreground opacity-0 shadow-lift transition-opacity duration-150',
          'group-hover/tip:opacity-100 group-focus-within/tip:opacity-100',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {children}
      </span>
    </span>
  );
}
