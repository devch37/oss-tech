import type { Metadata } from 'next';
import { Database } from 'lucide-react';
import { getRepositories } from '@/lib/api-client';
import { resolveDomain } from '@/lib/server';
import { getDomainMeta } from '@/lib/domains';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { CrawlButton } from '@/components/ActionButtons';
import { ErrorCard } from '@/components/ErrorBoundary';
import { RepositoryExplorer } from './RepositoryExplorer';

export const metadata: Metadata = { title: '프로젝트 활성도' };

export default async function RepositoriesPage({
  searchParams,
}: {
  searchParams: { domain?: string; sort?: string };
}) {
  const domain = resolveDomain(searchParams.domain);
  const meta = getDomainMeta(domain);
  const sort = searchParams.sort === 'stars' ? 'stars' : 'score';

  // Stars 정렬은 활성도 점수가 없으므로, 점수 데이터를 함께 받아 병합한다.
  const [scored, byStars] = await Promise.all([
    getRepositories({ domain, sort: 'score', size: 200 }).catch(() => null),
    sort === 'stars' ? getRepositories({ domain, sort: 'stars', size: 200 }).catch(() => null) : Promise.resolve(null),
  ]);

  let repositories = scored?.content ?? null;
  if (sort === 'stars' && byStars) {
    const scoreById = new Map((scored?.content ?? []).map((r) => [r.id, r]));
    repositories = byStars.content.map((r) => scoreById.get(r.id) ?? r);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span>{meta.label}</span>}
        title="프로젝트 활성도"
        description="인기 오픈소스 프로젝트가 요즘도 활발하게 개발되고 있는지 보여줘요. 최근 30일 커밋·PR·이슈 처리량을 프로젝트 규모로 보정해 S~C 등급을 매깁니다."
      />

      {repositories === null ? (
        <ErrorCard message="프로젝트 데이터를 불러오지 못했어요." />
      ) : repositories.length === 0 ? (
        <EmptyState
          icon={Database}
          title="아직 수집된 프로젝트가 없어요"
          description={`${meta.label} 분야 인기 프로젝트를 GitHub 에서 수집해 볼까요?`}
          action={<CrawlButton domain={domain} />}
        />
      ) : (
        <RepositoryExplorer key={`${domain}-${sort}`} repositories={repositories} sort={sort} />
      )}
    </div>
  );
}
