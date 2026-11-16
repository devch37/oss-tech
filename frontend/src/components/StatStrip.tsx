import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: ReactNode;
}

/**
 * 대시보드 상단 핵심 수치 — 라벨이 숫자를 설명하는 한 줄.
 * 모바일은 2열 × 2행(오른쪽 칸에만 구분선), 데스크톱은 4열(첫 칸 빼고 구분선).
 */
export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-6 border-y border-border py-6 sm:grid-cols-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'pr-4 sm:pr-6',
            i % 2 === 0 ? 'pl-0' : 'border-l border-border pl-4',
            i > 0 ? 'sm:border-l sm:border-border sm:pl-6' : 'sm:pl-0',
          )}
        >
          <dd className="font-display text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl">{item.value}</dd>
          <dt className="mt-1 text-sm text-muted-foreground">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}
