import type { Metadata } from 'next';
import { Database } from 'lucide-react';
import { getDomains, getLibraries } from '@/lib/api-client';
import { resolveDomain, resolveMonth } from '@/lib/server';
import { getDomainMeta } from '@/lib/domains';
import { formatMonth, formatNumber } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { CrawlButton } from '@/components/ActionButtons';
import { ErrorCard } from '@/components/ErrorBoundary';
import { LibraryExplorer } from './LibraryExplorer';

export const metadata: Metadata = { title: '라이브러리 랭킹' };

export default async function LibrariesPage({
  searchParams,
}: {
  searchParams: { domain?: string; month?: string };
}) {
  const domain = resolveDomain(searchParams.domain);
  const meta = getDomainMeta(domain);
  const { month, months, hasData } = await resolveMonth(domain, searchParams.month);

  const [libsRes, domains] = await Promise.all([
    hasData ? getLibraries({ domain, month, size: 500 }).catch(() => null) : Promise.resolve(null),
    getDomains().catch(() => []),
  ]);
  const repoCount = Number(domains.find((d) => d.domain === domain)?.repositoryCount ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span>{meta.label} · {formatMonth(month)}</span>}
        title="라이브러리 랭킹"
        description={
          <>
            {meta.label} 분야 인기 프로젝트 <b className="text-foreground">{formatNumber(repoCount)}개</b>가 실제로
            사용하는 라이브러리를 집계했어요. 많이 쓰일수록 위에, 빠르게 늘어날수록 🔥 표시가 붙어요.
          </>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={Database}
          title="아직 집계된 라이브러리가 없어요"
          description="프로젝트 수집이 끝나면 라이브러리 랭킹이 자동으로 만들어져요."
          action={<CrawlButton domain={domain} />}
        />
      ) : libsRes === null ? (
        <ErrorCard message="라이브러리 데이터를 불러오지 못했어요." />
      ) : (
        <LibraryExplorer
          key={`${domain}-${month}`}
          libraries={libsRes.content}
          months={months}
          month={month}
          domain={domain}
          repoCount={repoCount}
        />
      )}
    </div>
  );
}
