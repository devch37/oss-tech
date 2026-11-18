'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PodiumCard, RepoRow, type RepoLike } from '@/components/RepoCards';
import { SegmentedControl } from '@/components/SegmentedControl';

type Period = 'week' | 'month';

interface NewReposBoardProps {
  week: RepoLike[];
  month: RepoLike[];
  /** 보여 줄 총 개수 (1~3위는 큰 카드, 나머지는 한 줄 목록) */
  limit?: number;
  initialPeriod?: Period;
}

/**
 * 가장 뜨거운 새 프로젝트 — 시상대(1~3위)와 목록(4위 이하).
 * "최근 7일 / 최근 30일"만 바꾸는 단순한 토글 하나로 기간을 고른다.
 */
export function NewReposBoard({ week, month, limit = 10, initialPeriod = 'week' }: NewReposBoardProps) {
  const t = useTranslations('trends.hot');
  const [period, setPeriod] = useState<Period>(initialPeriod);

  const list = (period === 'week' ? week : month).slice(0, limit);
  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base font-medium">{t('viewBy')}</span>
        <SegmentedControl<Period>
          label={t('viewBy')}
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: t('week') },
            { value: 'month', label: t('month') },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-base text-muted-foreground">{t('empty')}</p>
      ) : (
        <div key={period} className="space-y-2">
          <ol className="grid gap-4 md:grid-cols-3">
            {podium.map((repo, i) => (
              <PodiumCard key={repo.fullName} repo={repo} rank={i + 1} />
            ))}
          </ol>
          {rest.length > 0 && (
            <ol start={4} className="divide-y divide-border border-y border-border">
              {rest.map((repo, i) => (
                <RepoRow key={repo.fullName} repo={repo} rank={i + 4} />
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
