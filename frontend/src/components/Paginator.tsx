'use client';

import { useTranslations } from 'next-intl';
import { buildPageNumbers } from '@/lib/pagination';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface PaginatorProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

/** 번호로 넘기는 페이지 이동 + "1–10 / 87" 같은 현재 위치. 모든 목록이 같은 모양을 쓴다. */
export function Paginator({ page, pageSize, total, onChange }: PaginatorProps) {
  const tc = useTranslations('common');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const safe = Math.min(page, totalPages);
  const from = (safe - 1) * pageSize + 1;
  const to = Math.min(safe * pageSize, total);

  return (
    <div className="space-y-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => onChange(Math.max(1, safe - 1))} disabled={safe === 1} />
          </PaginationItem>
          {buildPageNumbers(safe, totalPages).map((p, idx) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`e-${idx}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === safe} aria-label={tc('page', { page: p })} onClick={() => onChange(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext onClick={() => onChange(Math.min(totalPages, safe + 1))} disabled={safe === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <p className="text-center font-mono text-xs text-muted-foreground" aria-live="polite">
        {tc('range', { from, to, total })}
      </p>
    </div>
  );
}
