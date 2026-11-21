'use client';

import { useRef, useState } from 'react';
import type { Repository } from '@/types/api';
import { Paginator } from '@/components/Paginator';
import { RepoRow } from '@/components/RepoCards';

/** 스타가 많고 최근에도 활발한 프로젝트 — 한 줄 목록. pageSize 를 주면 번호로 넘겨 본다. */
export function LovedRepos({ repositories, limit = 10, pageSize }: { repositories: Repository[]; limit?: number; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const topRef = useRef<HTMLDivElement>(null);
  const paged = pageSize !== undefined;
  const totalPages = paged ? Math.max(1, Math.ceil(repositories.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const offset = paged ? (safePage - 1) * pageSize : 0;
  const items = paged ? repositories.slice(offset, offset + pageSize) : repositories.slice(0, limit);

  return (
    <div ref={topRef} className="scroll-mt-20 space-y-5">
      <ol start={offset + 1} className="divide-y divide-border/70 border-y border-border/70">
        {items.map((repo, i) => (
          <RepoRow key={repo.fullName} repo={repo} rank={offset + i + 1} />
        ))}
      </ol>
      {paged && (
        <Paginator
          page={safePage}
          pageSize={pageSize}
          total={repositories.length}
          onChange={(p) => {
            setPage(p);
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}
    </div>
  );
}
