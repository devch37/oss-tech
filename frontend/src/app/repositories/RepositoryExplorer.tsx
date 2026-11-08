'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleDot, ExternalLink, GitCommitHorizontal, GitFork, GitPullRequest, SearchX, Star } from 'lucide-react';
import type { Repository } from '@/types/api';
import {
  cn,
  formatCompact,
  formatNumber,
  getScoreGrade,
  getScoreGradeColor,
  GRADE_INFO,
  type ScoreGrade,
} from '@/lib/utils';
import { useUrlState } from '@/lib/use-url-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/SearchInput';
import { Paginator } from '@/components/Paginator';
import { ActiveLevelBadge } from '@/components/ActiveLevelBadge';
import { InfoTip } from '@/components/InfoTip';
import { EmptyState } from '@/components/EmptyState';

const PAGE_SIZE = 20;
const GRADES: ScoreGrade[] = ['S', 'A', 'B', 'C'];

function Metric({ icon: Icon, value, label }: { icon: typeof Star; value: number | null; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums" title={label}>
      <Icon className="h-3.5 w-3.5 opacity-60" />
      {value === null ? '—' : formatNumber(value)}
    </span>
  );
}

export function RepositoryExplorer({ repositories, sort }: { repositories: Repository[]; sort: 'score' | 'stars' }) {
  const { searchParams, update } = useUrlState();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const gradeParam = searchParams.get('grade');
  const grade = (GRADES as string[]).includes(gradeParam ?? '') ? (gradeParam as ScoreGrade) : null;
  const lang = searchParams.get('lang');
  const page = Math.max(1, Number(searchParams.get('page') ?? 1) || 1);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get('q') ?? '') !== query) update({ q: query || null, page: null });
    }, 250);
    return () => clearTimeout(t);
  }, [query, searchParams, update]);

  const gradeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    repositories.forEach((r) => {
      const g = getScoreGrade(r.score);
      c[g] = (c[g] ?? 0) + 1;
    });
    return c;
  }, [repositories]);

  const languages = useMemo(() => {
    const c = new Map<string, number>();
    repositories.forEach((r) => r.language && c.set(r.language, (c.get(r.language) ?? 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1]);
  }, [repositories]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return repositories.filter(
      (r) =>
        (!grade || getScoreGrade(r.score) === grade) &&
        (!lang || r.language === lang) &&
        (!q || r.fullName.toLowerCase().includes(q)),
    );
  }, [repositories, grade, lang, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const items = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* ─── 등급 범례 (클릭 = 필터) ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {GRADES.map((g) => {
          const active = grade === g;
          return (
            <button
              key={g}
              onClick={() => update({ grade: active ? null : g, page: null })}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-3 rounded-2xl border bg-card p-3 text-left shadow-soft transition-all hover:shadow-lift sm:p-4',
                active && 'ring-2 ring-primary/50',
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ring-1 ring-inset',
                  getScoreGradeColor(g),
                )}
              >
                {g}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {GRADE_INFO[g].label}
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">{gradeCounts[g] ?? 0}</span>
                </span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {GRADE_INFO[g].range} · {GRADE_INFO[g].hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Controls ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-soft sm:flex-row sm:p-4">
        <SearchInput value={query} onChange={setQuery} placeholder="프로젝트 이름 검색 (예: vercel/next.js)" className="flex-1" />
        <div className="flex gap-2">
          <Select value={lang ?? 'all'} onValueChange={(v) => update({ lang: v === 'all' ? null : v, page: null })}>
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="언어">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 언어</SelectItem>
              {languages.map(([l, n]) => (
                <SelectItem key={l} value={l}>
                  {l} ({n})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => update({ sort: v === 'score' ? null : v, page: null }, { push: true })}>
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="정렬">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">활성도 높은 순</SelectItem>
              <SelectItem value="stars">Star 많은 순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[13px] text-muted-foreground">
        <p>
          <b className="text-foreground">{formatNumber(filtered.length)}</b>개 프로젝트
          {grade && <> · {grade} 등급</>}
          {lang && <> · {lang}</>}
        </p>
        <p className="flex items-center gap-1">
          활성도 점수는 어떻게 계산하나요?
          <InfoTip side="bottom">
            (30일 커밋 × 3 + 병합된 PR × 2 + 닫힌 이슈 × 1) ÷ ln(Star + 1)
            <br />
            Star 가 많은 대형 프로젝트일수록 같은 활동량이라도 점수가 낮아지도록 보정해요.
          </InfoTip>
        </p>
      </div>

      {/* ─── List ─────────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <EmptyState icon={SearchX} title="조건에 맞는 프로젝트가 없어요" description="다른 키워드나 필터를 선택해 보세요." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((repo) => {
            const g = getScoreGrade(repo.score);
            return (
              <li key={repo.id}>
                <a
                  href={`https://github.com/${repo.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={`https://github.com/${repo.owner}.png?size=64`}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 shrink-0 rounded-xl border bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-muted-foreground">{repo.owner}</p>
                      <p className="flex items-center gap-1 truncate font-semibold group-hover:text-primary">
                        <span className="truncate">{repo.name}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" />
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <ActiveLevelBadge grade={g} showLabel />
                      {repo.score !== null && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">{repo.score.toFixed(1)}점</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {repo.language && (
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                        <span className="h-2 w-2 rounded-full bg-primary/70" />
                        {repo.language}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="h-3.5 w-3.5 opacity-60" /> {formatCompact(repo.stars)}
                    </span>
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <GitFork className="h-3.5 w-3.5 opacity-60" /> {formatCompact(repo.forks)}
                    </span>
                  </div>

                  <div className="mt-auto grid grid-cols-3 gap-2 rounded-xl bg-muted/50 px-3 py-2.5 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground">30일 커밋</p>
                      <p className="mt-0.5 font-semibold"><Metric icon={GitCommitHorizontal} value={repo.commits30d} label="30일 커밋" /></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">병합된 PR</p>
                      <p className="mt-0.5 font-semibold"><Metric icon={GitPullRequest} value={repo.prsMerged30d} label="병합된 PR" /></p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">닫힌 이슈</p>
                      <p className="mt-0.5 font-semibold"><Metric icon={CircleDot} value={repo.issuesClosed30d} label="닫힌 이슈" /></p>
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
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
