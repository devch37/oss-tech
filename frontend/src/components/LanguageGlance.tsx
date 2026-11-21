import { useLocale, useTranslations } from 'next-intl';
import { languageColor } from '@/lib/language-colors';
import type { Period } from '@/lib/trend-periods';
import { formatNumber } from '@/lib/utils';
import type { LanguageTrend } from '@/types/api';
import { GlanceCard } from '@/components/GlanceCard';
import { StackedShare } from '@/components/StackedShare';
import { StatStrip } from '@/components/StatStrip';

const TOP = 8;

/**
 * 언어 탭의 첫 화면 — 숫자 네 개와 비율 막대 하나.
 * 비율 막대는 언어마다 GitHub 색을 써서, 이름을 읽기 전에 "파랑이 제일 크다 = Python"이 보인다.
 */
export function LanguageGlance({ languages, period = 'month', showStats = true }: { languages: LanguageTrend[]; period?: Period; showStats?: boolean }) {
  const t = useTranslations('trends.languages.glance');
  const locale = useLocale();
  if (languages.length === 0) return null;

  const total = languages.reduce((sum, l) => sum + l.newRepoCount, 0);
  const sorted = [...languages].sort((a, b) => b.newRepoCount - a.newRepoCount);
  const top = sorted.slice(0, TOP);
  const othersValue = sorted.slice(TOP).reduce((sum, l) => sum + l.newRepoCount, 0);
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const segments = [
    ...top.map((l) => ({ key: l.language, label: l.language, value: l.newRepoCount, color: languageColor(l.language) })),
    ...(othersValue > 0 ? [{ key: '__others', label: t('others'), value: othersValue, color: '#6e7681' }] : []),
  ];
  const leader = sorted[0]!;
  const top3 = sorted.slice(0, 3).reduce((sum, l) => sum + l.newRepoCount, 0);
  const totalKey = period === 'week' ? 'totalWeek' : period === 'all' ? 'totalAll' : 'total';

  return (
    <div className="space-y-5">
      {showStats && (
        <StatStrip
          items={[
            { label: t('ranked'), value: languages.length },
            { label: t(totalKey), value: formatNumber(total, locale) },
            {
              label: t('leader'),
              value: (
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: languageColor(leader.language) }} />
                  {leader.language}
                </span>
              ),
            },
            { label: t('top3'), value: `${pct(top3)}%` },
          ]}
        />
      )}
      <GlanceCard title={t('chartTitle')} hint={t('chartHint')}>
        <StackedShare segments={segments} />
      </GlanceCard>
    </div>
  );
}
