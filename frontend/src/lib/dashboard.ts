import type { LevelCounts, Repository } from '@/types/api';

/** 레포 목록에서 활동 등급별 개수를 센다 (백엔드 OverviewCalculator.levelCounts 와 같은 기준) */
export function levelCounts(repositories: Repository[]): LevelCounts {
  const counts: LevelCounts = { s: 0, a: 0, b: 0, c: 0 };
  for (const repo of repositories) {
    if (repo.score === null) continue;
    if (repo.score >= 50) counts.s++;
    else if (repo.score >= 20) counts.a++;
    else if (repo.score >= 5) counts.b++;
    else counts.c++;
  }
  return counts;
}

/** 주 언어별 레포 수 (많은 순, 같으면 이름순) — 언어 정보가 없는 레포는 제외 */
export function languageShares(repositories: Repository[], top = 8): { language: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const repo of repositories) {
    const language = repo.language?.trim();
    if (language) counts.set(language, (counts.get(language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, top)
    .map(([language, count]) => ({ language, count }));
}

/** 레포 목록의 합계 지표 */
export function sumRepositories(repositories: Repository[]) {
  return {
    repositories: repositories.length,
    stars: repositories.reduce((sum, r) => sum + r.stars, 0),
    commits30d: repositories.reduce((sum, r) => sum + (r.commits30d ?? 0), 0),
  };
}
