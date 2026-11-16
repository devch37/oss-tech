'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Library } from '@/types/api';
import { GrowthBadge } from '@/components/GrowthBadge';
import { SegmentedControl } from '@/components/SegmentedControl';

type View = 'usage' | 'growth';

const TOP_N = 10;

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

  const rows = useMemo(() => {
    const list =
      view === 'usage'
        ? [...libraries].sort((a, b) => b.usageCount - a.usageCount)
        : libraries
            .filter((l) => l.prevMonthCount > 0 && l.growthRate > 0)
            .sort((a, b) => b.growthRate - a.growthRate || b.usageCount - a.usageCount);
    const top = list.slice(0, TOP_N);
    // 두 보기에서 막대 길이를 같은 기준(전체 최대 사용량)으로 맞춰 전환해도 길이가 일관되게 한다
    const max = Math.max(...libraries.map((l) => l.usageCount), 1);
    return top.map((library) => ({ library, pct: Math.max((library.usageCount / max) * 100, 2) }));
  }, [libraries, view]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl<View>
          label={t('viewBy')}
          value={view}
          onChange={setView}
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
          {rows.map(({ library, pct }, index) => (
            <li key={library.libraryName}>
              <Link
                href={{ pathname: `/libraries/${encodeURIComponent(library.libraryName)}`, query: { domain } }}
                className="group grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 py-3.5 sm:grid-cols-[2rem_13rem_minmax(0,1fr)_11rem] sm:items-center sm:gap-x-5"
              >
                <span className="font-display text-lg font-semibold tabular-nums text-muted-foreground">{index + 1}</span>

                <span className="truncate font-medium group-hover:underline group-hover:underline-offset-4">
                  {library.libraryName}
                </span>

                <span className="col-start-2 h-2.5 overflow-hidden rounded-full bg-muted sm:col-start-3" aria-hidden="true">
                  <span
                    className="bar-fill block h-full rounded-full bg-sea"
                    style={{ width: `${pct}%`, ['--i' as string]: index }}
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
    </div>
  );
}
