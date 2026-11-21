'use client';

import { useRef, useState } from 'react';
import { Building2, MapPin, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Period } from '@/lib/trend-periods';
import { formatCompact } from '@/lib/utils';
import type { RisingDeveloper, TopDeveloper } from '@/types/api';
import { GlanceCard } from '@/components/GlanceCard';
import { HBars } from '@/components/HBars';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { Paginator } from '@/components/Paginator';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatStrip } from '@/components/StatStrip';

type View = 'rising' | 'followed';

interface DeveloperBoardProps {
  /** 기간별 "뜨는 프로젝트를 만든 사람·팀" */
  risingPeriods: Record<Period, RisingDeveloper[]>;
  followed: TopDeveloper[];
  /** 홈처럼 앞부분만 보여 줄 때의 개수 (페이지 나누기 없음) */
  limit?: number;
  /** 지정하면 이 개수씩 나눠서 번호로 넘겨 본다 (전체 목록 페이지용) */
  pageSize?: number;
  /** 목록 위에 핵심 숫자와 상위 10 막대 그래프를 보여 준다 (전체 목록 페이지용) */
  glance?: boolean;
}

const CARD =
  'relative flex min-w-0 items-start gap-3.5 rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-foreground/30 hover:bg-card focus-within:border-foreground/30';

const profile = (login: string) => `https://github.com/${encodeURIComponent(login)}`;

function ProfileLink({ login, children }: { login: string; children: React.ReactNode }) {
  const tc = useTranslations('common');
  return (
    <a
      href={profile(login)}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex max-w-full items-center after:absolute after:inset-0 after:rounded-[inherit]"
    >
      <span className="break-words group-hover:underline group-hover:underline-offset-4">{children}</span>
      <span className="sr-only">
        {tc('viewOnGithub', { name: login })} ({tc('opensInNewTab')})
      </span>
    </a>
  );
}

/** 막대 그래프 안의 이름 — 누르면 그 사람·팀의 GitHub 로 간다 */
function NameLink({ login, children }: { login: string; children: React.ReactNode }) {
  return (
    <a href={profile(login)} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
      {children}
    </a>
  );
}

/**
 * 사람·팀 — 큰 프로필 사진과 한눈에 읽히는 설명. 사진과 이름은 모두 GitHub 프로필로 연결된다.
 * "뜨는 프로젝트를 만든 사람"(기간 선택 가능)과 "팔로워 많은 순"을 토글로 바꾸고, 전체 목록에서는 번호로 페이지를 넘긴다.
 */
export function DeveloperBoard({ risingPeriods, followed, limit = 8, pageSize, glance = false }: DeveloperBoardProps) {
  const t = useTranslations('trends.developers');
  const tg = useTranslations('trends.developers.glance');
  const tp = useTranslations('trends.hot');
  const locale = useLocale();
  const [view, setView] = useState<View>('rising');
  const [period, setPeriod] = useState<Period>(risingPeriods.month.length > 0 ? 'month' : 'week');
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const rising = risingPeriods[period];
  const total = view === 'rising' ? rising.length : followed.length;
  const paged = pageSize !== undefined;
  const totalPages = paged ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const from = paged ? (safePage - 1) * pageSize : 0;
  const to = paged ? Math.min(from + pageSize, total) : Math.min(limit, total);

  const goTo = (next: number) => {
    setPage(next);
    // 페이지를 넘기면 목록 맨 위로 돌아가서, 새로 나온 사람들이 바로 보이게 한다
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('viewBy')}</span>
          <SegmentedControl<View>
            label={t('viewBy')}
            value={view}
            onChange={(v) => {
              setView(v);
              setPage(1);
            }}
            options={[
              { value: 'rising', label: t('rising') },
              { value: 'followed', label: t('followed') },
            ]}
          />
        </div>
        {view === 'rising' && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{t('period')}</span>
            <SegmentedControl<Period>
              label={t('period')}
              value={period}
              onChange={(v) => {
                setPeriod(v);
                setPage(1);
              }}
              options={[
                { value: 'week', label: tp('weekShort'), disabled: risingPeriods.week.length === 0 },
                { value: 'month', label: tp('monthShort'), disabled: risingPeriods.month.length === 0 },
                { value: 'all', label: tp('all'), disabled: risingPeriods.all.length === 0 },
              ]}
            />
          </div>
        )}
      </div>

      {glance && total > 0 && (
        <div className="space-y-5">
          {view === 'rising' ? (
            <>
              <StatStrip
                items={[
                  { label: tg('people'), value: rising.length },
                  { label: tg('teams'), value: rising.filter((d) => d.ownerType === 'Organization').length },
                  { label: tg('hotStars'), value: formatCompact(rising.reduce((sum, d) => sum + d.totalStars, 0), locale) },
                ]}
              />
              <GlanceCard title={tg('risingTitle')} hint={tg('risingHint')}>
                <HBars
                  labelWidth="11rem"
                  items={rising.slice(0, 10).map((d) => ({
                    key: d.login,
                    label: <NameLink login={d.login}>{d.login}</NameLink>,
                    value: d.totalStars,
                    display: formatCompact(d.totalStars, locale),
                    color: d.ownerType === 'Organization' ? 'hsl(var(--sea))' : 'hsl(var(--trend))',
                    lead: <OwnerAvatar login={d.login} size={20} link />,
                  }))}
                />
                <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-trend" aria-hidden="true" />{t('person')}</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sea" aria-hidden="true" />{t('team')}</span>
                </p>
              </GlanceCard>
            </>
          ) : (
            <>
              <StatStrip
                items={[
                  { label: tg('ranked'), value: followed.length },
                  { label: tg('followersTotal'), value: formatCompact(followed.reduce((sum, d) => sum + d.followers, 0), locale) },
                  { label: tg('mostFollowed'), value: followed[0]?.name ?? followed[0]?.login ?? '' },
                ]}
              />
              <GlanceCard title={tg('followedTitle')} hint={tg('followedHint')}>
                <HBars
                  labelWidth="11rem"
                  items={followed.slice(0, 10).map((d) => ({
                    key: d.login,
                    label: <NameLink login={d.login}>{d.name ?? d.login}</NameLink>,
                    value: d.followers,
                    display: formatCompact(d.followers, locale),
                    color: 'hsl(var(--sea))',
                    lead: <OwnerAvatar login={d.login} size={20} link />,
                  }))}
                />
              </GlanceCard>
            </>
          )}
        </div>
      )}

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          {paged && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('range', { from: from + 1, to, total })}
            </p>
          )}

          <ol key={`${view}-${period}-${safePage}`} start={from + 1} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {view === 'rising'
              ? rising.slice(from, to).map((dev, i) => (
                  <li key={dev.login} className={CARD}>
                    <OwnerAvatar login={dev.login} size={44} link />
                    <div className="min-w-0 space-y-1">
                      <p className="font-display text-base font-semibold leading-tight tracking-tight">
                        <span className="mr-2 font-mono text-sm tabular-nums text-muted-foreground">{from + i + 1}</span>
                        <ProfileLink login={dev.login}>{dev.login}</ProfileLink>
                      </p>
                      <p className="text-xs font-medium text-signal-ink">{dev.ownerType === 'Organization' ? t('team') : t('person')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('hotProjects', { count: dev.repoCount })}, {t('starsTotal', { count: formatCompact(dev.totalStars, locale) })}
                      </p>
                      <div className="rounded-lg bg-muted/60 px-3 py-2">
                        <p className="flex items-center justify-between gap-2 text-[13px]">
                          <span className="min-w-0 truncate font-medium">
                            {t('topProject')}:{' '}
                            <a
                              href={`https://github.com/${dev.topRepo.fullName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative z-10 underline-offset-4 hover:underline"
                            >
                              {dev.topRepo.name}
                            </a>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 tabular-nums">
                            <Star className="h-3.5 w-3.5 fill-signal text-signal" aria-hidden="true" />
                            {formatCompact(dev.topRepo.stars, locale)}
                          </span>
                        </p>
                        {dev.topRepo.description && (
                          <p className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground">{dev.topRepo.description}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))
              : followed.slice(from, to).map((dev, i) => (
                  <li key={dev.login} className={CARD}>
                    <OwnerAvatar login={dev.login} size={44} link />
                    <div className="min-w-0 space-y-1">
                      <p className="font-display text-base font-semibold leading-tight tracking-tight">
                        <span className="mr-2 font-mono text-sm tabular-nums text-muted-foreground">{from + i + 1}</span>
                        <ProfileLink login={dev.login}>{dev.name ?? dev.login}</ProfileLink>
                      </p>
                      {dev.name && <p className="text-sm text-muted-foreground">{dev.login}</p>}
                      <p className="text-sm font-medium">
                        {t('followers', { count: formatCompact(dev.followers, locale) })}
                        <span className="font-normal text-muted-foreground">, {t('publicProjects', { count: dev.publicRepos })}</span>
                      </p>
                      {dev.bio && <p className="line-clamp-2 text-[13px] text-muted-foreground">{dev.bio}</p>}
                      {(dev.location || dev.company) && (
                        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {dev.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                              {dev.location}
                            </span>
                          )}
                          {dev.company && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {dev.company}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
          </ol>

          {view === 'followed' && <p className="text-sm text-muted-foreground">{t('followersHelp')}</p>}

          {paged && <Paginator page={safePage} pageSize={pageSize} total={total} onChange={goTo} />}
        </>
      )}
    </div>
  );
}
