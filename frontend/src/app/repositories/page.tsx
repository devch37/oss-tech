import { getRepositories } from '@/lib/api-client';
import { RepositoryListClient } from './RepositoryListClient';

export default async function RepositoriesPage({
  searchParams,
}: {
  searchParams: { domain?: string; sort?: string };
}) {
  const domain = searchParams.domain ?? 'frontend';
  const sort = searchParams.sort === 'stars' ? 'stars' : 'score';

  // score 정렬 시 50개, stars 정렬 시 50개 fetch
  const repoData = await getRepositories({ domain, sort, size: 50 }).catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">레포지토리</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="font-medium capitalize">{domain}</span> 도메인 · GitHub 레포지토리 & Active Level 분석
        </p>
      </div>

      <RepositoryListClient
        repositories={repoData?.content ?? []}
        currentSort={sort}
        domain={domain}
        fetchFailed={repoData === null}
      />
    </div>
  );
}
