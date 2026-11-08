import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Library } from '@/types/api';
import { cn, formatNumber, isNewLibrary } from '@/lib/utils';
import { GrowthBadge } from '@/components/GrowthBadge';
import { UsageBar } from '@/components/UsageBar';

interface LibraryRowProps {
  lib: Library;
  domain: string;
  rank?: number;
  /** 막대 기준 최댓값 (없으면 막대 숨김) */
  max?: number;
  /** 채택률 표시용 분모 */
  repoCount?: number;
  className?: string;
}

/** 라이브러리 한 줄 — 홈/상세 공용 (클릭 → 상세) */
export function LibraryRow({ lib, domain, rank, max, repoCount, className }: LibraryRowProps) {
  const adoption = repoCount ? Math.round((lib.usageCount / repoCount) * 100) : null;
  return (
    <Link
      href={`/libraries/${encodeURIComponent(lib.libraryName)}?domain=${domain}`}
      className={cn(
        'group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60',
        className,
      )}
    >
      {rank !== undefined && (
        <span
          className={cn(
            'w-6 shrink-0 text-center text-sm font-semibold tabular-nums',
            rank <= 3 ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[13px] font-medium group-hover:text-primary">
            {lib.libraryName}
          </span>
          <GrowthBadge rate={lib.growthRate} isNew={isNewLibrary(lib)} />
        </div>
        {max !== undefined && (
          <div className="mt-1.5 flex items-center gap-2">
            <UsageBar value={lib.usageCount} max={max} />
            <span className="w-24 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {formatNumber(lib.usageCount)}개{adoption !== null && ` · ${adoption}%`}
            </span>
          </div>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
    </Link>
  );
}
