import { ExternalLink, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, daysSince, formatCompact, formatNumber } from '@/lib/utils';
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
  return days === 0 ? t('startedToday') : t('startedDaysAgo', { days });
}

function LanguageChip({ language }: { language: string | null | undefined }) {
  if (!language) return null;
  return <span className="rounded-full border border-border px-2.5 py-0.5 text-sm text-muted-foreground">{language}</span>;
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
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">
        {tc('viewOnGithub', { name: repo.fullName })} ({tc('opensInNewTab')})
      </span>
    </a>
  );
}

/** 1~3위: 크게 보여 주는 카드. 순위·사진·이름·소개·스타 수가 한 장에 다 들어 있다. */
export function PodiumCard({ repo, rank }: { repo: RepoLike; rank: number }) {
  const t = useTranslations('trends.repo');
  const locale = useLocale();
  const started = useStartedText(repo.createdAt);

  const badge =
    rank === 1
      ? 'bg-signal text-[#0B1B2E]'
      : rank === 2
        ? 'bg-signal/45 text-foreground'
        : 'bg-signal/20 text-signal-ink';

  return (
    <li
      className={cn(
        'relative flex flex-col gap-4 rounded-2xl border bg-card p-6 transition-colors hover:border-foreground/40 focus-within:border-foreground/40',
        rank === 1 ? 'border-signal ring-1 ring-signal/50' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn('flex h-11 w-11 items-center justify-center rounded-full font-display text-xl font-semibold', badge)}
          aria-label={t('rank', { rank })}
        >
          {rank}
        </span>
        {started && <span className="text-sm text-muted-foreground">{started}</span>}
      </div>

      <div className="flex items-center gap-3.5">
        <OwnerAvatar login={repo.owner} size={56} />
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{repo.owner}</p>
          <p className="font-display text-2xl font-semibold leading-tight">
            <GithubLink repo={repo} />
          </p>
        </div>
      </div>

      <p className="line-clamp-3 text-base leading-relaxed text-muted-foreground">{repo.description ?? t('noDescription')}</p>

      <div className="mt-auto space-y-3 pt-1">
        <p className="flex items-baseline gap-2">
          <Star className="h-5 w-5 self-center fill-signal text-signal" aria-hidden="true" />
          <span className="font-display text-3xl font-semibold tabular-nums">{formatNumber(repo.stars, locale)}</span>
          <span className="text-sm text-muted-foreground">{t('stars', { count: '' }).trim()}</span>
        </p>
        <div className="min-h-[1.75rem]">
          <LanguageChip language={repo.language} />
        </div>
      </div>
    </li>
  );
}

/** 4위 이하: 한 줄 목록. 오른쪽에 스타 수를 크게, 모바일에서는 이름 아래에 붙여 보여 준다. */
export function RepoRow({ repo, rank }: { repo: RepoLike; rank: number }) {
  const t = useTranslations('trends.repo');
  const locale = useLocale();
  const started = useStartedText(repo.createdAt);

  return (
    <li className="relative grid grid-cols-[2rem_2.75rem_minmax(0,1fr)] items-center gap-x-3.5 gap-y-1 py-4 sm:grid-cols-[2.5rem_2.75rem_minmax(0,1fr)_8rem] sm:gap-x-5">
      <span className="font-display text-xl font-semibold tabular-nums text-muted-foreground">{rank}</span>
      <OwnerAvatar login={repo.owner} size={44} />

      <div className="min-w-0">
        <p className="text-lg font-semibold leading-snug">
          <GithubLink repo={repo} />
        </p>
        <p className="line-clamp-2 text-base text-muted-foreground">{repo.description ?? t('noDescription')}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground sm:hidden">
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <Star className="h-4 w-4 fill-signal text-signal" aria-hidden="true" />
            {formatCompact(repo.stars, locale)}
          </span>
          {repo.language && <span>{repo.language}</span>}
          {started && <span>{started}</span>}
        </p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="inline-flex items-center gap-1.5 font-display text-xl font-semibold tabular-nums">
          <Star className="h-5 w-5 fill-signal text-signal" aria-hidden="true" />
          {formatCompact(repo.stars, locale)}
        </p>
        <p className="text-sm text-muted-foreground">{repo.language ?? started}</p>
      </div>
    </li>
  );
}
