'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Library } from '@/types/api';
import { GrowthBadge } from '@/components/GrowthBadge';
import { Paginator } from '@/components/Paginator';
import { SegmentedControl } from '@/components/SegmentedControl';

type View = 'usage' | 'growth';

const PAGE = 10;
/** 한 번에 둘러볼 수 있는 최대 개수 (10페이지) */
const MAX_ITEMS = 100;

interface LibraryBarsProps {
  libraries: Library[];
  domain: string;
  /** 지난달 데이터가 있어야 증가율이 의미가 있다. 없으면 "빠르게 늘어난 순"을 잠근다. */
  hasBaseline: boolean;
}

/** "어떤 라이브러리를 쓰는가" — 막대 길이 = 그 라이브러리를 쓰는 프로젝트 수 */
export function LibraryBars({ libraries, domain, hasBaseline }: LibraryBarsProps) {
  const t = useTranslations('home.libs');
  const [view, setView] = useState<View>('usage');
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => {
    const list =
      view === 'usage'
        ? [...libraries].sort((a, b) => b.usageCount - a.usageCount)
        : libraries
            .filter((l) => l.prevMonthCount > 0 && l.growthRate > 0)
            .sort((a, b) => b.growthRate - a.growthRate || b.usageCount - a.usageCount);
    const top = list.slice(0, MAX_ITEMS);
    // 두 보기에서 막대 길이를 같은 기준(전체 최대 사용량)으로 맞춰 전환해도 길이가 일관되게 한다
    const max = Math.max(...libraries.map((l) => l.usageCount), 1);
    return top.map((library) => ({ library, pct: Math.max((library.usageCount / max) * 100, 2) }));
  }, [libraries, view]);

  const safePage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE)));
  const offset = (safePage - 1) * PAGE;
  const pageRows = rows.slice(offset, offset + PAGE);

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl<View>
          label={t('viewBy')}
          value={view}
          onChange={(v) => {
            setView(v);
            setPage(1);
          }}
          options={[
            { value: 'usage', label: t('byUsage') },
            { value: 'growth', label: t('byGrowth'), disabled: !hasBaseline },
          ]}
        />
        {!hasBaseline && <p className="text-sm text-muted-foreground">{t('baselineNote')}</p>}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{t('noGrowth')}</p>
      ) : (
        <ol key={view} className="divide-y divide-border border-y border-border">
          {pageRows.map(({ library, pct }, pageIndex) => (
            <li key={library.libraryName}>
              <Link
                href={{ pathname: `/libraries/${encodeURIComponent(library.libraryName)}`, query: { domain } }}
                className="group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 py-3.5 sm:grid-cols-[2rem_13rem_minmax(0,1fr)_11rem] sm:items-center sm:gap-x-5"
              >
                <span className="font-mono text-sm tabular-nums text-muted-foreground">{offset + pageIndex + 1}</span>

                <span className="truncate font-medium group-hover:underline group-hover:underline-offset-4">
                  {library.libraryName}
                </span>

                <span className="col-start-2 h-2.5 overflow-hidden rounded-full bg-muted sm:col-start-3" aria-hidden="true">
                  <span
                    className="bar-fill block h-full rounded-full bg-sea"
                    style={{ width: `${pct}%`, ['--i' as string]: pageIndex }}
                  />
                </span>

                <span className="col-start-2 text-sm sm:col-start-4">
                  <span className="block font-medium tabular-nums">
                    {t('projectsUsing', { count: library.usageCount })}
                  </span>
                  {hasBaseline &&
                    (library.prevMonthCount === 0 ? (
                      <span className="block text-xs font-medium text-sea">{t('new')}</span>
                    ) : (
                      <GrowthBadge rate={library.growthRate} className="text-xs" />
                    ))}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 && (
        <Paginator
          page={safePage}
          pageSize={PAGE}
          total={rows.length}
          onChange={(p) => {
            setPage(p);
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </div>
  );
}
