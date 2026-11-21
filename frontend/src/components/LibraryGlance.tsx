import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatNumber } from '@/lib/utils';
import type { Library } from '@/types/api';
import { GlanceCard } from '@/components/GlanceCard';
import { HBars } from '@/components/HBars';
import { StatStrip } from '@/components/StatStrip';

/**
 * 라이브러리 탭의 첫 화면 — 숫자 세 개와 "가장 많이 쓰는 10개" 막대 그래프.
 * 막대를 누르면 그 라이브러리의 월별 추이로 이동한다.
 */
export async function LibraryGlance({
  locale,
  domain,
  libraries,
}: {
  locale: string;
  domain: string;
  libraries: Library[];
}) {
  const t = await getTranslations({ locale, namespace: 'libraries.glance' });
  if (libraries.length === 0) return null;

  const sorted = [...libraries].sort((a, b) => b.usageCount - a.usageCount);
  const top = sorted.slice(0, 10);
  const leader = sorted[0]!;
  const hasBaseline = libraries.some((l) => l.prevMonthCount > 0);
  const newCount = hasBaseline ? libraries.filter((l) => l.prevMonthCount === 0).length : null;

  return (
    <div className="space-y-5">
      <StatStrip
        items={[
          { label: t('analyzed'), value: formatNumber(libraries.length, locale) },
          { label: t('leader'), value: <span className="break-all">{leader.libraryName}</span> },
          { label: t('leaderUsed'), value: formatNumber(leader.usageCount, locale) },
          ...(newCount !== null ? [{ label: t('newThisMonth'), value: formatNumber(newCount, locale) }] : []),
        ]}
      />
      <GlanceCard title={t('chartTitle')} hint={t('chartHint')}>
        <HBars
          labelWidth="13rem"
          items={top.map((l) => ({
            key: l.libraryName,
            label: (
              <Link href={{ pathname: `/libraries/${encodeURIComponent(l.libraryName)}`, query: { domain } }} className="hover:underline underline-offset-4">
                {l.libraryName}
              </Link>
            ),
            value: l.usageCount,
            display: t('projects', { count: l.usageCount }),
          }))}
        />
      </GlanceCard>
    </div>
  );
}
