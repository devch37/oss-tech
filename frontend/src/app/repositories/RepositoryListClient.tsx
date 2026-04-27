'use client';

import { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ExternalLink, Star, GitFork as GitForkIcon } from 'lucide-react';
import type { Repository } from '@/types/api';
import type { ScoreGrade } from '@/lib/utils';
import { formatNumber, getScoreGrade, getScoreGradeColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ActiveLevelBadge } from '@/components/ActiveLevelBadge';
import { ErrorCard } from '@/components/ErrorBoundary';

// ─── Types ────────────────────────────────────────────────────────────────────

type GradeFilter = ScoreGrade | 'ALL';

const GRADE_OPTIONS: { value: GradeFilter; label: string }[] = [
  { value: 'ALL', label: '전체 등급' },
  { value: 'S', label: 'S — 매우 활발 (≥50)' },
  { value: 'A', label: 'A — 활발 (≥20)' },
  { value: 'B', label: 'B — 보통 (≥5)' },
  { value: 'C', label: 'C — 낮음 (≥0)' },
  { value: '-', label: '- — 데이터 없음' },
];

const PAGE_SIZE = 20;

interface RepositoryListClientProps {
  repositories: Repository[];
  currentSort: 'score' | 'stars';
  domain: string;
  fetchFailed: boolean;
}

// ─── Pagination helper ────────────────────────────────────────────────────────

function buildPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RepositoryListClient({
  repositories,
  currentSort,
  domain,
  fetchFailed,
}: RepositoryListClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('ALL');
  const [page, setPage] = useState(1);

  // sort 변경 → URL 업데이트 (서버 재fetch)
  const handleSortChange = (sort: string) => {
    setPage(1);
    router.push(`${pathname}?domain=${domain}&sort=${sort}`);
  };

  // 등급 필터 (클라이언트)
  const filtered = useMemo(() => {
    if (gradeFilter === 'ALL') return repositories;
    return repositories.filter((r) => getScoreGrade(r.score) === gradeFilter);
  }, [repositories, gradeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleGradeFilter = (grade: GradeFilter) => {
    setGradeFilter(grade);
    setPage(1);
  };

  if (fetchFailed) {
    return <ErrorCard message="레포지토리 데이터를 불러오지 못했습니다." />;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {/* 등급 필터 버튼 그룹 */}
        <div className="flex flex-wrap gap-1.5">
          {GRADE_OPTIONS.map(({ value, label }) => (
            <Button
              key={value}
              variant={gradeFilter === value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleGradeFilter(value)}
              className="h-8 text-xs"
            >
              {value === 'ALL' ? '전체' : value}
            </Button>
          ))}
        </div>

        <div className="flex-1" />

        {/* 정렬 선택 */}
        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Score순</SelectItem>
            <SelectItem value="stars">Stars순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-muted-foreground">
        총 <span className="font-medium text-foreground">{filtered.length}</span>개
        {gradeFilter !== 'ALL' && ` (등급: ${gradeFilter})`}
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-10">#</TableHead>
              <TableHead>레포지토리</TableHead>
              <TableHead className="text-right">Stars</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">30d Commits</TableHead>
              <TableHead className="text-right">30d PRs</TableHead>
              <TableHead className="text-right pr-6">등급</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  {gradeFilter !== 'ALL'
                    ? `등급 "${gradeFilter}" 레포지토리가 없습니다.`
                    : '데이터가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((repo, i) => {
                const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                const grade = getScoreGrade(repo.score);
                const gradeColor = getScoreGradeColor(grade);
                return (
                  <TableRow key={repo.id}>
                    <TableCell className="pl-6 text-sm tabular-nums text-muted-foreground">
                      {rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {repo.fullName}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                        {repo.language && (
                          <span className="hidden sm:inline rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {repo.language}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Star className="h-3 w-3" />
                        {formatNumber(repo.stars)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {repo.score !== null ? (
                        <span className="font-mono text-sm">{repo.score.toFixed(1)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {repo.commits30d !== null ? formatNumber(repo.commits30d) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {repo.prsMerged30d !== null ? formatNumber(repo.prsMerged30d) : '—'}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <span
                        className={`inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold ${gradeColor}`}
                      >
                        {grade}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
              />
            </PaginationItem>
            {buildPageNumbers(safePage, totalPages).map((p, idx) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === safePage} onClick={() => setPage(p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
