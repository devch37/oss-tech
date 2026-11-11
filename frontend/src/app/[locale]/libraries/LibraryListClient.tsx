'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import type { Library } from '@/types/api';
import { buildPageNumbers } from '@/lib/pagination';
import { formatNumber } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { GrowthBadge } from '@/components/GrowthBadge';

type SortKey = 'usageCount' | 'growthRate' | 'prevMonthCount';

interface LibraryListClientProps {
  libraries: Library[];
  months: { value: string; label: string }[];
  currentMonth: string;
  currentMonthLabel: string;
  domain: string;
  fetchFailed: boolean;
}

const PAGE_SIZE = 20;

export function LibraryListClient({
  libraries,
  months,
  currentMonth,
  currentMonthLabel,
  domain,
  fetchFailed,
}: LibraryListClientProps) {
  const t = useTranslations('libraries');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('usageCount');
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q ? libraries.filter((l) => l.libraryName.toLowerCase().includes(q)) : libraries;
    return [...filtered].sort((a, b) => b[sort] - a[sort]);
  }, [libraries, search, sort]);

  const maxUsage = useMemo(() => Math.max(1, ...libraries.map((l) => l.usageCount)), [libraries]);
  const totalPages = Math.max(1, Math.ceil(processed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = processed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (fetchFailed) return <ErrorCard message={t('error')} />;
  if (libraries.length === 0) {
    return <EmptyState title={t('empty.title', { month: currentMonthLabel })} description={t('empty.description')} />;
  }

  return (
    <div className="space-y-5">
      {/* 도구 모음 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label={t('search')}
            placeholder={t('search')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={currentMonth}
          onValueChange={(month) => router.push({ pathname, query: { domain, month } })}
        >
          <SelectTrigger className="w-[150px]" aria-label={t('month')}>
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

        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as SortKey);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[190px]" aria-label={t('sort.label')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usageCount">{t('sort.usageCount')}</SelectItem>
            <SelectItem value="growthRate">{t('sort.growthRate')}</SelectItem>
            <SelectItem value="prevMonthCount">{t('sort.prevMonthCount')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('count', { count: processed.length })}
        {search && ` · ${t('matching', { query: search })}`}
      </p>

      {/* 목록 */}
      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="w-14 whitespace-nowrap py-2 pr-2 font-medium">{t('columns.rank')}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t('columns.library')}</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">{t('columns.usage')}</th>
              <th scope="col" className="hidden py-2 pr-4 text-right font-medium sm:table-cell">{t('columns.previous')}</th>
              <th scope="col" className="py-2 text-right font-medium">{t('columns.change')}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-14 text-center text-muted-foreground">
                  {t('noMatch', { query: search })}
                </td>
              </tr>
            ) : (
              pageItems.map((lib, i) => {
                const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={lib.libraryName} className="relative border-b border-border/70 transition-colors hover:bg-accent/50">
                    <td className="py-3.5 pr-2 font-display text-base font-semibold tabular-nums text-muted-foreground">{rank}</td>
                    <td className="w-full max-w-0 py-3.5 pr-4">
                      <Link
                        href={{ pathname: `/libraries/${encodeURIComponent(lib.libraryName)}`, query: { domain } }}
                        className="block truncate font-medium after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4"
                      >
                        {lib.libraryName}
                      </Link>
                      {/* 최대값 대비 사용량 */}
                      <span className="mt-1.5 block h-1 w-full max-w-[200px] overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <span className="block h-full rounded-full bg-signal" style={{ width: `${(lib.usageCount / maxUsage) * 100}%` }} />
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right tabular-nums">{formatNumber(lib.usageCount, locale)}</td>
                    <td className="hidden py-3.5 pr-4 text-right tabular-nums text-muted-foreground sm:table-cell">
                      {formatNumber(lib.prevMonthCount, locale)}
                    </td>
                    <td className="py-3.5 text-right">
                      <GrowthBadge rate={lib.growthRate} className="justify-end" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} />
            </PaginationItem>
            {buildPageNumbers(safePage, totalPages).map((p, idx) =>
              p === 'ellipsis' ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === safePage} aria-label={tc('page', { page: p })} onClick={() => setPage(p)}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
