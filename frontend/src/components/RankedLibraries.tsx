import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Library } from '@/types/api';
import { GrowthBadge } from '@/components/GrowthBadge';
import { Sparkline } from '@/components/Sparkline';

export interface RankedLibrary {
  library: Library;
  /** 최근 N개월 사용량 (오래된 순) */
  trend: number[];
}

interface RankedLibrariesProps {
  items: RankedLibrary[];
  domain: string;
}

/** 카드 그리드 대신 한 줄에 순위·증감·추이를 담은 랭킹 리스트 */
export function RankedLibraries({ items, domain }: RankedLibrariesProps) {
  const t = useTranslations('common');

  return (
    <ol className="divide-y divide-border border-y border-border">
      {items.map(({ library, trend }, index) => (
        <li key={library.libraryName}>
          <Link
            href={{ pathname: `/libraries/${encodeURIComponent(library.libraryName)}`, query: { domain } }}
            className="group grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3.5 sm:grid-cols-[2rem_minmax(0,1fr)_6rem_5rem_6rem] sm:gap-x-4"
          >
            <span className="font-display text-lg font-semibold tabular-nums text-muted-foreground">{index + 1}</span>

            <span className="min-w-0">
              <span className="block truncate font-medium group-hover:underline group-hover:underline-offset-4">
                {library.libraryName}
              </span>
              <span className="block text-xs text-muted-foreground sm:hidden">
                {t('reposCount', { count: library.usageCount })}
              </span>
            </span>

            <GrowthBadge rate={library.growthRate} className="justify-self-end text-sm sm:order-4" />

            <span className="hidden justify-self-end text-sm tabular-nums text-muted-foreground sm:order-3 sm:block">
              {t('reposCount', { count: library.usageCount })}
            </span>

            <Sparkline values={trend} className="hidden text-muted-foreground sm:order-2 sm:block sm:justify-self-end" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
