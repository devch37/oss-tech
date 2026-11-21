import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface HBarItem {
  key: string;
  label: ReactNode;
  /** 막대 길이를 정하는 값 */
  value: number;
  /** 오른쪽에 보여 줄 글자 (예: "1,105 projects") */
  display: ReactNode;
  /** 막대 색 (CSS 색). 없으면 파랑 */
  color?: string;
  /** 라벨 앞에 붙는 작은 요소 (색 점, 프로필 사진) */
  lead?: ReactNode;
}

/**
 * 가로 막대 그래프 — 이름, 막대, 값 세 칸. 막대 길이만 봐도 순서와 차이가 보인다.
 * 한 줄이 가볍고(막대 높이 8px) 숫자는 고정폭 글꼴이라 줄이 맞는다.
 */
export function HBars({ items, className, labelWidth = '9rem' }: { items: HBarItem[]; className?: string; labelWidth?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ol className={cn('space-y-2.5', className)}>
      {items.map((item, index) => (
        <li key={item.key} className="grid items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[var(--lw)_minmax(0,1fr)_auto]" style={{ ['--lw' as string]: labelWidth }}>
          <span className="flex min-w-0 items-center gap-2 font-medium">
            {item.lead}
            <span className="truncate">{item.label}</span>
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span
              className="bar-fill block h-full rounded-full"
              style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: item.color ?? 'hsl(var(--sea))', ['--i' as string]: index }}
            />
          </span>
          <span className="font-mono text-xs tabular-nums text-muted-foreground sm:min-w-[4.5rem] sm:text-right">{item.display}</span>
        </li>
      ))}
    </ol>
  );
}
