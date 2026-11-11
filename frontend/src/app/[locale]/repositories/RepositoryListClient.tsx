'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Repository } from '@/types/api';
import type { ScoreGrade } from '@/lib/utils';
import { cn, formatNumber, getScoreGrade } from '@/lib/utils';
import { buildPageNumbers } from '@/lib/pagination';
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
import { ActiveLevelBadge } from '@/components/ActiveLevelBadge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';

type LevelFilter = ScoreGrade | 'ALL';

const LEVELS: LevelFilter[] = ['ALL', 'S', 'A', 'B', 'C'];
const PAGE_SIZE = 20;

interface RepositoryListClientProps {
  repositories: Repository[];
  currentSort: 'score' | 'stars';
  domain: string;
  domainLabel: string;
  fetchFailed: boolean;
}

export function RepositoryListClient({
  repositories,
  currentSort,
  domain,
  domainLabel,
  fetchFailed,
}: RepositoryListClientProps) {
  const t = useTranslations('repositories');
  const tg = useTranslations('grades');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [level, setLevel] = useState<LevelFilter>('ALL');
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => (level === 'ALL' ? repositories : repositories.filter((r) => getScoreGrade(r.score) === level)),
    [repositories, level],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  if (fetchFailed) return <ErrorCard message={t('error')} />;
  if (repositories.length === 0) {
    return <EmptyState title={t('empty.title', { domain: domainLabel })} description={t('empty.description')} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {/* 활동 등급 필터 — 색에만 의존하지 않도록 글자로 표시 */}
        <div role="group" aria-label={t('level.label')} className="flex flex-wrap items-center gap-1.5">
          {LEVELS.map((value) => {
            const active = level === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                title={value === 'ALL' ? undefined : tg(value)}
                onClick={() => {
                  setLevel(value);
                  setPage(1);
                }}
                className={cn(
                  'h-8 min-w-8 rounded-md border px-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {value === 'ALL' ? t('level.all') : value}
              </button>
            );
          })}
        </div>

        <div className="ml-auto">
          <Select
            value={currentSort}
            onValueChange={(sort) => {
              setPage(1);
              router.push({ pathname, query: { domain, sort } });
            }}
          >
            <SelectTrigger className="w-[190px]" aria-label={t('sort.label')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">{t('sort.score')}</SelectItem>
              <SelectItem value="stars">{t('sort.stars')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('count', { count: filtered.length })}
        {level !== 'ALL' && ` · ${t('matchingLevel', { level })}`}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th scope="col" className="w-14 whitespace-nowrap py-2 pr-2 font-medium">{t('columns.rank')}</th>
              <th scope="col" className="py-2 pr-4 font-medium">{t('columns.repository')}</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">{t('columns.stars')}</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">{t('columns.score')}</th>
              <th scope="col" className="hidden py-2 pr-4 text-right font-medium md:table-cell">{t('columns.commits')}</th>
              <th scope="col" className="hidden py-2 pr-4 text-right font-medium md:table-cell">{t('columns.prs')}</th>
              <th scope="col" className="py-2 text-right font-medium">{t('columns.level')}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-muted-foreground">
                  {t('noMatch', { level })}
                </td>
              </tr>
            ) : (
              pageItems.map((repo, i) => {
                const rank = (safePage - 1) * PAGE_SIZE + i + 1;
                return (
                  <tr key={repo.id} className="border-b border-border/70 transition-colors hover:bg-accent/50">
                    <td className="py-3.5 pr-2 font-display text-base font-semibold tabular-nums text-muted-foreground">{rank}</td>
                    <td className="w-full max-w-0 py-3.5 pr-4">
                      <a
                        href={`https://github.com/${repo.fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${tc('viewOnGithub', { name: repo.fullName })} (${tc('opensInNewTab')})`}
                        className="inline-flex max-w-full items-center gap-1.5 font-medium hover:underline hover:underline-offset-4"
                      >
                        <span className="truncate">{repo.fullName}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
                      </a>
                      {repo.language && <span className="mt-0.5 block text-xs text-muted-foreground">{repo.language}</span>}
                    </td>
                    <td className="py-3.5 pr-4 text-right tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                        {formatNumber(repo.stars, locale)}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right tabular-nums">
                      {repo.score !== null ? repo.score.toFixed(1) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="hidden py-3.5 pr-4 text-right tabular-nums text-muted-foreground md:table-cell">
                      {repo.commits30d !== null ? formatNumber(repo.commits30d, locale) : '—'}
                    </td>
                    <td className="hidden py-3.5 pr-4 text-right tabular-nums text-muted-foreground md:table-cell">
                      {repo.prsMerged30d !== null ? formatNumber(repo.prsMerged30d, locale) : '—'}
                    </td>
                    <td className="py-3.5 text-right">
                      <ActiveLevelBadge score={repo.score} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{tg('formula')}</p>

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
