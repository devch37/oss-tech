'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, SearchX } from 'lucide-react';
import type { Library } from '@/types/api';
import { cn, formatMonth, formatNumber, inferEcosystem, isNewLibrary } from '@/lib/utils';
import { useUrlState } from '@/lib/use-url-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SearchInput } from '@/components/SearchInput';
import { Paginator } from '@/components/Paginator';
import { GrowthBadge } from '@/components/GrowthBadge';
import { UsageBar } from '@/components/UsageBar';
import { InfoTip } from '@/components/InfoTip';
import { EmptyState } from '@/components/EmptyState';

type SortKey = 'usage' | 'growth' | 'prev';
type FilterKey = 'all' | 'rising' | 'new' | 'falling';

const PAGE_SIZE = 25;

const ECO_LABEL: Record<string, string> = { maven: 'Maven', npm: 'npm' };

function parseSort(v: string | null): SortKey {
  return v === 'growth' || v === 'prev' ? v : 'usage';
}
function parseFilter(v: string | null): FilterKey {
  return v === 'rising' || v === 'new' || v === 'falling' ? v : 'all';
}

export function LibraryExplorer({
  libraries,
  months,
  month,
  domain,
  repoCount,
}: {
  libraries: Library[];
  months: string[];
  month: string;
  domain: string;
  repoCount: number;
}) {
  const { searchParams, update } = useUrlState();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const sort = parseSort(searchParams.get('sort'));
  const filter = parseFilter(searchParams.get('filter'));
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  // 검색어 → URL (debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get('q') ?? '') !== query) update({ q: query || null, page: null });
    }, 250);
    return () => clearTimeout(t);
  }, [query, searchParams, update]);

  // 전체 순위 (사용량 기준) — 필터와 무관하게 고정
  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    [...libraries].sort((a, b) => b.usageCount - a.usageCount).forEach((l, i) => m.set(l.libraryName, i + 1));
    return m;
  }, [libraries]);

  const counts = useMemo(
    () => ({
      all: libraries.length,
      rising: libraries.filter((l) => l.growthRate > 0 && !isNewLibrary(l)).length,
      new: libraries.filter(isNewLibrary).length,
      falling: libraries.filter((l) => l.growthRate < 0).length,
    }),
    [libraries],
  );

  const processed = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = libraries;
    if (filter === 'rising') list = list.filter((l) => l.growthRate > 0 && !isNewLibrary(l));
    if (filter === 'new') list = list.filter(isNewLibrary);
    if (filter === 'falling') list = list.filter((l) => l.growthRate < 0);
    if (q) list = list.filter((l) => l.libraryName.toLowerCase().includes(q));
    const key = sort === 'growth' ? 'growthRate' : sort === 'prev' ? 'prevMonthCount' : 'usageCount';
    const dir = filter === 'falling' && sort === 'growth' ? -1 : 1;
    return [...list].sort((a, b) => dir * (b[key] - a[key]) || b.usageCount - a.usageCount);
  }, [libraries, query, filter, sort]);

  const maxUsage = useMemo(() => Math.max(1, ...libraries.map((l) => l.usageCount)), [libraries]);
  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* ─── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="라이브러리 이름 검색 (예: react, spring-boot)"
            className="flex-1"
          />
          <div className="flex gap-2">
            <Select value={month} onValueChange={(m) => update({ month: m, page: null }, { push: true })}>
              <SelectTrigger className="w-full sm:w-[150px]" aria-label="기준월">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatMonth(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => update({ sort: v === 'usage' ? null : v, page: null })}>
              <SelectTrigger className="w-full sm:w-[150px]" aria-label="정렬">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage">많이 쓰는 순</SelectItem>
                <SelectItem value="growth">성장률 순</SelectItem>
                <SelectItem value="prev">지난달 사용 순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SegmentedControl<FilterKey>
          ariaLabel="빠른 필터"
          value={filter}
          onChange={(v) => update({ filter: v === 'all' ? null : v, page: null })}
          options={[
            { value: 'all', label: '전체', count: counts.all },
            { value: 'rising', label: '🔥 급상승', count: counts.rising },
            { value: 'new', label: '✨ 신규', count: counts.new },
            { value: 'falling', label: '📉 하락', count: counts.falling },
          ]}
        />
      </div>

      <p className="px-1 text-[13px] text-muted-foreground">
        <b className="text-foreground">{formatNumber(processed.length)}</b>개 라이브러리
        {query && <> · &ldquo;{query}&rdquo; 검색 결과</>}
      </p>

      {/* ─── List ─────────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={query ? `"${query}" 에 해당하는 라이브러리가 없어요` : '조건에 맞는 라이브러리가 없어요'}
          description="다른 키워드나 필터를 선택해 보세요."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-soft">
          <div className="hidden grid-cols-[3rem_minmax(0,1fr)_14rem_5rem_6rem_1.5rem] items-center gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
            <span className="text-center">순위</span>
            <span>라이브러리</span>
            <span className="flex items-center gap-1">
              사용 프로젝트
              <InfoTip side="bottom">이번 달 분석한 프로젝트 중 이 라이브러리를 의존성으로 가진 프로젝트 수예요.</InfoTip>
            </span>
            <span className="flex items-center justify-end gap-1">
              채택률
              <InfoTip side="bottom">사용 프로젝트 ÷ 분석한 전체 프로젝트. 이 분야에서 얼마나 &lsquo;표준&rsquo;인지 보여줘요.</InfoTip>
            </span>
            <span className="flex items-center justify-end gap-1">
              지난달 대비
              <InfoTip side="bottom">(이번 달 − 지난달) ÷ 지난달. 지난달 0개였다면 NEW 로 표시해요.</InfoTip>
            </span>
            <span />
          </div>
          <ul className="divide-y">
            {items.map((lib) => {
              const rank = rankMap.get(lib.libraryName) ?? 0;
              const eco = inferEcosystem(lib.libraryName);
              const adoption = repoCount ? Math.round((lib.usageCount / repoCount) * 100) : null;
              return (
                <li key={lib.libraryName}>
                  <Link
                    href={`/libraries/${encodeURIComponent(lib.libraryName)}?domain=${domain}`}
                    className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3.5 transition-colors hover:bg-muted/50 md:grid-cols-[3rem_minmax(0,1fr)_14rem_5rem_6rem_1.5rem] md:gap-4 md:px-5"
                  >
                    <span
                      className={cn(
                        'row-span-2 flex h-8 w-8 items-center justify-center self-center rounded-lg text-sm font-bold tabular-nums md:row-span-1 md:mx-auto',
                        rank === 1 && 'bg-amber-400/20 text-amber-600 dark:text-amber-300',
                        rank === 2 && 'bg-zinc-400/20 text-zinc-600 dark:text-zinc-300',
                        rank === 3 && 'bg-orange-400/20 text-orange-700 dark:text-orange-300',
                        rank > 3 && 'text-muted-foreground',
                      )}
                    >
                      {rank}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-[13px] font-medium group-hover:text-primary">
                        {lib.libraryName}
                      </span>
                      {eco !== 'unknown' && (
                        <span className="hidden shrink-0 rounded-md border px-1.5 py-px text-[10px] font-medium text-muted-foreground sm:inline">
                          {ECO_LABEL[eco]}
                        </span>
                      )}
                    </span>
                    <span className="justify-self-end md:hidden">
                      <GrowthBadge rate={lib.growthRate} isNew={isNewLibrary(lib)} />
                    </span>
                    <span className="col-span-2 flex items-center gap-2 md:col-span-1">
                      <UsageBar value={lib.usageCount} max={maxUsage} />
                      <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
                        {formatNumber(lib.usageCount)}개
                      </span>
                      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground md:hidden">
                        {adoption !== null && `${adoption}%`}
                      </span>
                    </span>
                    <span className="hidden text-right text-xs tabular-nums text-muted-foreground md:block">
                      {adoption !== null ? `${adoption}%` : '—'}
                    </span>
                    <span className="hidden justify-self-end md:block">
                      <GrowthBadge rate={lib.growthRate} isNew={isNewLibrary(lib)} />
                    </span>
                    <ChevronRight className="hidden h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 md:block" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Paginator
        page={safePage}
        totalPages={totalPages}
        onChange={(p) => {
          update({ page: p === 1 ? null : String(p) });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}
