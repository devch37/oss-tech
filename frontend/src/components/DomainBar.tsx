'use client';

import { useDomain } from '@/contexts/DomainContext';
import { DOMAINS } from '@/lib/domains';
import { cn } from '@/lib/utils';

/**
 * 분야 선택 칩 바 — 모든 페이지 상단에 항상 노출.
 * 셀렉트 박스보다 한눈에 선택지가 보여 직관적.
 */
export function DomainBar({ className }: { className?: string }) {
  const { selectedDomain, setSelectedDomain } = useDomain();

  return (
    <div className={cn('relative', className)}>
      <div
        role="tablist"
        aria-label="분야 선택"
        className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        {DOMAINS.map((d) => {
          const active = d.value === selectedDomain;
          const Icon = d.icon;
          return (
            <button
              key={d.value}
              role="tab"
              aria-selected={active}
              title={d.description}
              onClick={() => !active && setSelectedDomain(d.value)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                active
                  ? 'border-foreground bg-foreground text-background shadow-sm'
                  : 'bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
