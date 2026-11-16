'use client';

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatCompact, getScoreGrade } from '@/lib/utils';
import type { Repository } from '@/types/api';
import { SegmentedControl } from '@/components/SegmentedControl';

type View = 'activity' | 'stars';

const TOP_N = 10;

/**
 * "어떤 프로젝트가 가장 활발한가" — 한 가지 질문에 막대 하나로 답한다.
 * 막대 길이 = 활동량(또는 스타). 숫자는 막대 오른쪽에 그대로 적어 눈금이 필요 없다.
 */
interface ProjectBarsProps {
  repositories: Repository[];
  /** 분야 이름을 함께 보여준다 (여러 분야가 섞인 목록용) */
  showField?: boolean;
  /** 활동량/스타 전환 토글. 이미 활동량 상위로 걸러진 목록이면 스타 순 전환이 의미가 없으므로 끈다. */
  allowSort?: boolean;
}

export function ProjectBars({ repositories, showField = false, allowSort = true }: ProjectBarsProps) {
  const t = useTranslations('home.projects');
  const tg = useTranslations('grades');
  const tc = useTranslations('common');
  const td = useTranslations('domains');
  const locale = useLocale();
  const [view, setView] = useState<View>('activity');

  const rows = useMemo(() => {
    const valueOf = (r: Repository) => (view === 'activity' ? (r.score ?? 0) : r.stars);
    const sorted = [...repositories].filter((r) => valueOf(r) > 0).sort((a, b) => valueOf(b) - valueOf(a)).slice(0, TOP_N);
    // 1위가 나머지보다 수십 배 큰 경우가 흔해서(봇 커밋, 대형 프로젝트) 선형 막대로는 2위 이하가 거의 안 보인다.
    // 제곱근 척도는 순서를 그대로 두면서 차이를 읽을 수 있게 한다. 정확한 값은 오른쪽 숫자가 말해 준다.
    const max = Math.sqrt(Math.max(...sorted.map(valueOf), 1));
    return sorted.map((repo) => ({ repo, pct: Math.max((Math.sqrt(valueOf(repo)) / max) * 100, 2) }));
  }, [repositories, view]);

  return (
    <div className="space-y-4">
      {allowSort && (
        <SegmentedControl<View>
          label={t('viewBy')}
          value={view}
          onChange={setView}
          options={[
            { value: 'activity', label: t('byActivity') },
            { value: 'stars', label: t('byStars') },
          ]}
        />
      )}

      {/* key 를 view 로 바꿔 전환할 때 막대가 다시 자라게 한다 (사용자 동작에 대한 반응) */}
      <ol key={view} className="divide-y divide-border border-y border-border">
        {rows.map(({ repo, pct }, index) => {
          const grade = getScoreGrade(repo.score);
          const gradeLabel = grade === '-' ? tg('none') : tg(grade);
          return (
            <li
              key={repo.id}
              className="relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 py-3.5 sm:grid-cols-[2rem_13rem_minmax(0,1fr)_11rem] sm:items-center sm:gap-x-5"
            >
              <span className="font-display text-lg font-semibold tabular-nums text-muted-foreground">{index + 1}</span>

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
                  {showField ? `${td(repo.domain as 'frontend')}, ` : ''}
                  {repo.owner}
                  {repo.language ? `, ${repo.language}` : ''}
                </p>
              </div>

              <div className="col-start-2 h-2.5 overflow-hidden rounded-full bg-muted sm:col-start-3" aria-hidden="true">
                <div
                  className="bar-fill h-full rounded-full bg-signal"
                  style={{ width: `${pct}%`, ['--i' as string]: index }}
                />
              </div>

              <div className="col-start-2 text-sm sm:col-start-4">
                {view === 'activity' ? (
                  <>
                    <p className={cn('font-medium', (grade === 'S' || grade === 'A') && 'text-signal-ink')}>{gradeLabel}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {repo.commits30d !== null ? t('commits', { count: repo.commits30d }) : ''}
                      {repo.commits30d !== null && repo.prsMerged30d !== null ? ', ' : ''}
                      {repo.prsMerged30d !== null ? t('prs', { count: repo.prsMerged30d }) : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium tabular-nums">{t('stars', { count: formatCompact(repo.stars, locale) })}</p>
                    <p className="text-xs text-muted-foreground">{gradeLabel}</p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
