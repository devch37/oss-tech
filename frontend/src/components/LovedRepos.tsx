import type { Repository } from '@/types/api';
import { RepoRow } from '@/components/RepoCards';

/** 스타가 많고 최근에도 활발한 프로젝트 — 모두 한 줄 목록으로 */
export function LovedRepos({ repositories, limit = 10 }: { repositories: Repository[]; limit?: number }) {
  return (
    <ol className="divide-y divide-border border-y border-border">
      {repositories.slice(0, limit).map((repo, i) => (
        <RepoRow key={repo.fullName} repo={repo} rank={i + 1} />
      ))}
    </ol>
  );
}
