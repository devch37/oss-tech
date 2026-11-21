'use client';

import { useState } from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Period } from '@/lib/trend-periods';
import { starsPerDay } from '@/lib/trend';
import { cn, formatCompact } from '@/lib/utils';
import type { TrendRepo } from '@/types/api';
import { HeroGlobe } from '@/components/HeroGlobe';
import { OwnerAvatar } from '@/components/OwnerAvatar';

const ROWS = 5;

interface HeroBoardProps {
  week: TrendRepo[];
  month: TrendRepo[];
  allTime: TrendRepo[];
}

/**
 * 첫 화면의 "지금 뜨는 프로젝트" 보드 — 스크롤하기 전에 진짜 데이터를 보여 준다.
 * 상위 5개를 순위·사진·이름·속도(하루 평균 스타)·막대 한 줄로 요약하고, 7일/30일/전체 기간을 바로 바꿀 수 있다.
 * 모서리의 작은 지구본은 장식이다.
 */
export function HeroBoard({ week, month, allTime }: HeroBoardProps) {
  const t = useTranslations('trends.hero.board');
  const tr = useTranslations('trends.repo');
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>('week');

  const list = (period === 'week' ? week : period === 'month' ? month : allTime).slice(0, ROWS);
  // 막대: 새 프로젝트는 "하루 평균 스타"(속도), 전체 기간은 스타 수로 길이를 정한다
  const metric = (r: TrendRepo) => (period === 'all' ? r.stars : (starsPerDay(r.stars, r.createdAt) ?? 0));
  const max = Math.max(...list.map(metric), 1);

  const tabs: { value: Period; label: string; disabled: boolean }[] = [
    { value: 'week', label: t('week'), disabled: week.length === 0 },
    { value: 'month', label: t('month'), disabled: month.length === 0 },
    { value: 'all', label: t('all'), disabled: allTime.length === 0 },
  ];

  return (
    <section
      aria-label={t('title')}
      className="relative overflow-hidden rounded-2xl border border-border bg-card/70 shadow-[0_0_0_1px_hsl(var(--trend)/0.08),0_24px_60px_-30px_hsl(var(--trend)/0.35)] backdrop-blur"
    >
      <header className="relative flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-trend" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-trend" />
          </span>
          <h2 className="font-display text-base font-semibold tracking-tight">{t('title')}</h2>
        </div>
        <div role="group" aria-label={t('title')} className="inline-flex rounded-lg border border-border bg-muted/60 p-0.5 font-mono text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              aria-pressed={period === tab.value}
              disabled={tab.disabled}
              onClick={() => setPeriod(tab.value)}
              className={cn(
                'rounded-md px-2.5 py-1 transition-colors',
                period === tab.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                tab.disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {list.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ol key={period} className="relative divide-y divide-border/60 border-t border-border/60">
          {list.map((repo, i) => {
            const perDay = period === 'all' ? null : starsPerDay(repo.stars, repo.createdAt);
            return (
              <li key={repo.fullName} className="relative grid grid-cols-[1.25rem_1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 px-5 py-3 transition-colors hover:bg-muted/40">
                <span className="font-mono text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                <OwnerAvatar login={repo.owner} size={28} link />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">
                    <a
                      href={`https://github.com/${repo.fullName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline hover:underline-offset-4 after:absolute after:inset-0"
                    >
                      {repo.name}
                    </a>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{repo.description ?? repo.owner}</p>
                  <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span
                      className="bar-fill block h-full rounded-full bg-trend"
                      style={{ width: `${Math.max((metric(repo) / max) * 100, 3)}%`, ['--i' as string]: i }}
                    />
                  </span>
                </div>
                <div className="text-right">
                  {perDay ? (
                    <p className="font-mono text-sm font-semibold tabular-nums text-trend-ink">
                      <span aria-hidden="true">▲</span> {tr('perDay', { count: formatCompact(perDay, locale) })}
                    </p>
                  ) : null}
                  <p className={cn('inline-flex items-center gap-1 font-mono text-xs tabular-nums', perDay ? 'text-muted-foreground' : 'text-sm font-semibold text-foreground')}>
                    <Star className="h-3 w-3 fill-signal text-signal" aria-hidden="true" />
                    {formatCompact(repo.stars, locale)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <footer className="relative overflow-hidden border-t border-border/60 px-5 py-2.5">
        {/* 작은 지구본 (장식) — 버튼·목록과 겹치지 않게 푸터 오른쪽 구석에 둔다 */}
        <HeroGlobe labels={[]} className="pointer-events-none absolute -bottom-12 -right-6 h-32 w-32 opacity-60" />
        <Link href={period === 'week' ? '/trending' : { pathname: '/trending', query: { period } }} className="group inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          {t('seeAll')}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </footer>
    </section>
  );
}
