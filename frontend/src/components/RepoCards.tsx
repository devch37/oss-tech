import { ExternalLink, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, daysSince, formatCompact, formatNumber } from '@/lib/utils';
import { starsPerDay } from '@/lib/trend';
import { OwnerAvatar } from '@/components/OwnerAvatar';

/** 화면에 필요한 최소 정보 — 새 프로젝트(TrendRepo)와 추적 중인 프로젝트(Repository)가 모두 맞는다 */
export interface RepoLike {
  fullName: string;
  owner: string;
  name: string;
  description?: string | null;
  language?: string | null;
  stars: number;
  createdAt?: string | null;
}

function useStartedText(createdAt: string | null | undefined): string | null {
  const t = useTranslations('trends.repo');
  const days = daysSince(createdAt);
  if (days === null) return null;
  if (days === 0) return t('startedToday');
  if (days >= 365) return t('startedYearsAgo', { years: Math.floor(days / 365) });
  if (days >= 60) return t('startedMonthsAgo', { months: Math.floor(days / 30) });
  return t('startedDaysAgo', { days });
}

/** 하루 평균 스타 — 새 프로젝트가 얼마나 빠르게 뜨는지 보여 주는 초록 ▲ 뱃지 (오래된 프로젝트에는 없음) */
function VelocityBadge({ repo, className }: { repo: RepoLike; className?: string }) {
  const t = useTranslations('trends.repo');
  const locale = useLocale();
  const perDay = starsPerDay(repo.stars, repo.createdAt);
  if (!perDay) return null;
  return (
    <span
      title={t('perDayHelp')}
      className={cn('inline-flex items-center gap-1 rounded-md bg-trend/10 px-1.5 py-0.5 font-mono text-xs font-medium text-trend-ink', className)}
    >
      <span aria-hidden="true">▲</span>
      {t('perDay', { count: formatCompact(perDay, locale) })}
      <span className="sr-only">. {t('perDayHelp')}</span>
    </span>
  );
}

function LanguageChip({ language }: { language: string | null | undefined }) {
  if (!language) return null;
  return <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{language}</span>;
}

function GithubLink({ repo, className }: { repo: RepoLike; className?: string }) {
  const tc = useTranslations('common');
  return (
    <a
      href={`https://github.com/${repo.fullName}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('group inline-flex max-w-full items-center gap-1.5 after:absolute after:inset-0 after:rounded-[inherit]', className)}
    >
      <span className="break-words group-hover:underline group-hover:underline-offset-4">{repo.name}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
      <span className="sr-only">
        {tc('viewOnGithub', { name: repo.fullName })} ({tc('opensInNewTab')})
      </span>
    </a>
  );
}

/** 1~3위: 조금 크게 보여 주는 카드. 순위·사진·이름·소개·스타 수가 한 장에 들어 있다. */
export function PodiumCard({ repo, rank }: { repo: RepoLike; rank: number }) {
  const t = useTranslations('trends.repo');
  const locale = useLocale();
  const started = useStartedText(repo.createdAt);

  const badge =
    rank === 1
      ? 'bg-trend text-[#04210c]'
      : rank === 2
        ? 'bg-trend/30 text-foreground'
        : 'bg-trend/15 text-trend-ink';

  return (
    <li
      className={cn(
        'relative flex flex-col gap-3.5 rounded-xl border bg-card/60 p-5 transition-colors hover:bg-card focus-within:bg-card',
        rank === 1 ? 'border-trend/60 shadow-[0_0_0_1px_hsl(var(--trend)/0.25),0_8px_30px_-12px_hsl(var(--trend)/0.35)]' : 'border-border hover:border-foreground/30',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn('inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-mono text-xs font-semibold tabular-nums', badge)}
          aria-label={t('rank', { rank })}
        >
          {rank}
        </span>
        <span className="flex items-center gap-2">
          {started && <span className="text-xs text-muted-foreground">{started}</span>}
          <VelocityBadge repo={repo} />
        </span>
      </div>

      <div className="flex items-center gap-3">
        <OwnerAvatar login={repo.owner} size={36} link />
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{repo.owner}</p>
          <p className="font-display text-lg font-semibold leading-tight tracking-tight">
            <GithubLink repo={repo} />
          </p>
        </div>
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{repo.description ?? t('noDescription')}</p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <p className="flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-signal text-signal" aria-hidden="true" />
          <span className="font-mono text-xl font-semibold tabular-nums tracking-tight">{formatNumber(repo.stars, locale)}</span>
          <span className="sr-only">{t('stars', { count: '' }).trim()}</span>
        </p>
        <LanguageChip language={repo.language} />
      </div>
    </li>
  );
}

/** 4위 이하: 한 줄 목록. 오른쪽에 스타 수, 모바일에서는 이름 아래에 붙여 보여 준다. */
export function RepoRow({ repo, rank }: { repo: RepoLike; rank: number }) {
  const t = useTranslations('trends.repo');
  const locale = useLocale();
  const started = useStartedText(repo.createdAt);

  return (
    <li className="relative grid grid-cols-[1.5rem_2rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 py-3.5 transition-colors hover:bg-muted/40 sm:grid-cols-[1.75rem_2rem_minmax(0,1fr)_6.5rem] sm:gap-x-4">
      <span className="font-mono text-sm tabular-nums text-muted-foreground">{rank}</span>
      <OwnerAvatar login={repo.owner} size={32} link />

      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug">
          <GithubLink repo={repo} />
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground">{repo.description ?? t('noDescription')}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground sm:hidden">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Star className="h-3.5 w-3.5 fill-signal text-signal" aria-hidden="true" />
            {formatCompact(repo.stars, locale)}
          </span>
          {repo.language && <span className="font-mono">{repo.language}</span>}
          {started && <span>{started}</span>}
          <VelocityBadge repo={repo} />
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="inline-flex items-center gap-1.5 font-mono text-[15px] font-semibold tabular-nums">
          <Star className="h-3.5 w-3.5 fill-signal text-signal" aria-hidden="true" />
          {formatCompact(repo.stars, locale)}
        </p>
        <div className="mt-0.5 flex justify-end">
          {starsPerDay(repo.stars, repo.createdAt) ? <VelocityBadge repo={repo} /> : <p className="font-mono text-xs text-muted-foreground">{repo.language ?? started}</p>}
        </div>
      </div>
    </li>
  );
}
