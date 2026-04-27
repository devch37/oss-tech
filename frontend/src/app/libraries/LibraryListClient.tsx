'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import type { Library } from '@/types/api';
import { formatNumber, formatGrowthRate, getGrowthRateColor } from '@/lib/utils';
import { Input } from '@/components/ui/input';
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
import { ErrorCard } from '@/components/ErrorBoundary';
import { GrowthBadge } from '@/components/GrowthBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'usageCount' | 'growthRate' | 'prevMonthCount';

interface LibraryListClientProps {
  libraries: Library[];
  months: { value: string; label: string }[];
  currentMonth: string;
  domain: string;
  fetchFailed: boolean;
}

// ─── Pagination Helper ────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

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

export function LibraryListClient({
  libraries,
  months,
  currentMonth,
  domain,
  fetchFailed,
}: LibraryListClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('usageCount');
  const [page, setPage] = useState(1);

  // 월 변경 → URL 업데이트 (서버 재fetch)
  const handleMonthChange = useCallback(
    (month: string) => {
      setPage(1);
      setSearch('');
      router.push(`${pathname}?domain=${domain}&month=${month}`);
    },
    [router, pathname, domain],
  );

  // 필터·정렬
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? libraries.filter((l) => l.libraryName.toLowerCase().includes(q)) : libraries;
    return [...filtered].sort((a, b) => b[sort] - a[sort]);
  }, [libraries, search, sort]);

  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };

  if (fetchFailed) {
    return <ErrorCard message="라이브러리 데이터를 불러오지 못했습니다." />;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="라이브러리 검색..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={currentMonth} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usageCount">사용 수순</SelectItem>
            <SelectItem value="growthRate">증감률순</SelectItem>
            <SelectItem value="prevMonthCount">전월 사용 수순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 결과 수 */}
      <p className="text-sm text-muted-foreground">
        총 <span className="font-medium text-foreground">{processed.length}</span>개
        {search && ` (검색: "${search}")`}
      </p>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6 w-10">#</TableHead>
              <TableHead>라이브러리</TableHead>
              <TableHead className="text-right">사용 수</TableHead>
              <TableHead className="text-right">전월</TableHead>
              <TableHead className="text-right pr-6">증감률</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {search ? `"${search}" 검색 결과가 없습니다.` : '데이터가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              pageItems.map((lib, i) => {
                const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <TableRow
                    key={lib.libraryName}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/libraries/${encodeURIComponent(lib.libraryName)}?domain=${domain}`,
                      )
                    }
                  >
                    <TableCell className="pl-6 text-sm text-muted-foreground tabular-nums">
                      {rank}
                    </TableCell>
                    <TableCell className="font-medium">{lib.libraryName}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatNumber(lib.usageCount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatNumber(lib.prevMonthCount)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <GrowthBadge rate={lib.growthRate} />
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
