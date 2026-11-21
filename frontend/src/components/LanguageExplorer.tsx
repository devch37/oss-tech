'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Period } from '@/lib/trend-periods';
import type { LanguageTrend } from '@/types/api';
import { LanguageGlance } from '@/components/LanguageGlance';
import { LanguageRanking } from '@/components/LanguageRanking';
import { Paginator } from '@/components/Paginator';
import { RuleNote } from '@/components/RuleNote';
import { SegmentedControl } from '@/components/SegmentedControl';

const PAGE_SIZE = 10;

/**
 * 언어 탭 — 기간(7일 / 30일 / 기간 제한 없음)을 고르면 숫자와 비율 막대와 순위가 모두 그 기간 기준으로 바뀌고,
 * 순위는 10개씩 번호로 넘겨 본다.
 */
export function LanguageExplorer({ periods, initialPeriod = 'month' }: { periods: Record<Period, LanguageTrend[]>; initialPeriod?: Period }) {
  const t = useTranslations('trends.languages');
  const [period, setPeriod] = useState<Period>(periods[initialPeriod].length > 0 ? initialPeriod : 'month');
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const list = periods[period];
  const rule = period === 'week' ? t('ruleWeek') : period === 'all' ? t('ruleAll') : t('rule');

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">{t('viewBy')}</span>
        <SegmentedControl<Period>
          label={t('viewBy')}
          value={period}
          onChange={(v) => {
            setPeriod(v);
            setPage(1);
          }}
          options={[
            { value: 'week', label: t('week'), disabled: periods.week.length === 0 },
            { value: 'month', label: t('month') },
            { value: 'all', label: t('all'), disabled: periods.all.length === 0 },
          ]}
        />
      </div>

      <RuleNote>{rule}</RuleNote>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <LanguageGlance languages={list} period={period} />
          <div key={`${period}-${page}`}>
            <LanguageRanking languages={list} offset={(page - 1) * PAGE_SIZE} limit={PAGE_SIZE} scope={list} />
          </div>
          <Paginator
            page={page}
            pageSize={PAGE_SIZE}
            total={list.length}
            onChange={(p) => {
              setPage(p);
              topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </>
      )}
    </div>
  );
}
