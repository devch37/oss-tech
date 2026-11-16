import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatCompact, getScoreGrade } from '@/lib/utils';
import type { Repository } from '@/types/api';

/** "스타는 적지만 활동은 활발한" 프로젝트 목록 — 아직 덜 알려진 후보를 짚어준다 */
export function GemList({ repositories }: { repositories: Repository[] }) {
  const t = useTranslations('overview.gems');
  const tg = useTranslations('grades');
  const td = useTranslations('domains');
  const tc = useTranslations('common');
  const tp = useTranslations('home.projects');
  const locale = useLocale();

  return (
    <ul className="divide-y divide-border border-y border-border">
      {repositories.map((repo) => {
        const grade = getScoreGrade(repo.score);
        return (
          <li key={repo.id} className="relative flex items-start justify-between gap-4 py-3.5">
            <div className="min-w-0">
              <a
                href={`https://github.com/${repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex max-w-full items-center gap-1.5 font-medium after:absolute after:inset-0"
              >
                <span className="truncate group-hover:underline group-hover:underline-offset-4">{repo.name}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">{tc('viewOnGithub', { name: repo.fullName })} ({tc('opensInNewTab')})</span>
              </a>
              <p className="truncate text-xs text-muted-foreground">
                {td(repo.domain as 'frontend')}
                {repo.language ? `, ${repo.language}` : ''}
              </p>
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="font-medium text-signal-ink">{grade === '-' ? tg('none') : tg(grade)}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {t('stars', { count: formatCompact(repo.stars, locale) })}
                {repo.commits30d !== null ? `, ${tp('commits', { count: repo.commits30d })}` : ''}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
