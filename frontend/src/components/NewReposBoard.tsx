'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Period } from '@/lib/trend-periods';
import { Paginator } from '@/components/Paginator';
import { PodiumCard, RepoRow, type RepoLike } from '@/components/RepoCards';
import { SegmentedControl } from '@/components/SegmentedControl';

export type { Period };

interface NewReposBoardProps {
  week: RepoLike[];
  month: RepoLike[];
  /** 기간 제한 없는 목록. 비어 있으면(예전 데이터) 해당 버튼을 잠근다. */
  allTime?: RepoLike[];
  /** 홈처럼 앞부분만 보여 줄 때의 개수 (페이지 나누기 없음) */
  limit?: number;
  /** 지정하면 이 개수씩 나눠서 번호로 넘겨 본다 (전체 목록 페이지용) */
  pageSize?: number;
  initialPeriod?: Period;
}

/**
 * 스타 많은 프로젝트 — 첫 페이지는 시상대(1~3위)와 목록, 다음 페이지부터는 목록.
 * "최근 7일 / 최근 30일 / 기간 제한 없음" 토글 하나로 프로젝트의 나이를 고른다.
 */
export function NewReposBoard({ week, month, allTime = [], limit = 10, pageSize, initialPeriod = 'week' }: NewReposBoardProps) {
  const t = useTranslations('trends.hot');
  const hasAllTime = allTime.length > 0;
  const [period, setPeriod] = useState<Period>(initialPeriod === 'all' && !hasAllTime ? 'week' : initialPeriod);
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);

  const all = period === 'week' ? week : period === 'month' ? month : allTime;
  const paged = pageSize !== undefined;
  const totalPages = paged ? Math.max(1, Math.ceil(all.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const offset = paged ? (safePage - 1) * pageSize : 0;
  const list = paged ? all.slice(offset, offset + pageSize) : all.slice(0, limit);

  // 시상대는 1페이지에만. 다른 페이지는 순위 번호만 이어서 한 줄 목록으로.
  const podium = offset === 0 ? list.slice(0, 3) : [];
  const rest = offset === 0 ? list.slice(3) : list;
  const restStart = offset + podium.length + 1;

  const goTo = (next: number) => {
    setPage(next);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-5">
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
            { value: 'week', label: t('week') },
            { value: 'month', label: t('month') },
            { value: 'all', label: t('all'), disabled: !hasAllTime },
          ]}
        />
      </div>

      {list.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div key={`${period}-${safePage}`} className="space-y-3">
          {podium.length > 0 && (
            <ol className="grid gap-3 md:grid-cols-3">
              {podium.map((repo, i) => (
                <PodiumCard key={repo.fullName} repo={repo} rank={i + 1} />
              ))}
            </ol>
          )}
          {rest.length > 0 && (
            <ol start={restStart} className="divide-y divide-border/70 border-y border-border/70">
              {rest.map((repo, i) => (
                <RepoRow key={repo.fullName} repo={repo} rank={restStart + i} />
              ))}
            </ol>
          )}
        </div>
      )}

      {paged && <Paginator page={safePage} pageSize={pageSize} total={all.length} onChange={goTo} />}
    </div>
  );
}
