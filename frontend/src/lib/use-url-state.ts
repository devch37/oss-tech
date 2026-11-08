'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * 필터/정렬/검색 상태를 URL 쿼리에 반영 (공유·새로고침해도 유지).
 * 기본값과 같으면 쿼리에서 제거해 URL 을 깔끔하게 유지한다.
 */
export function useUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (patch: Record<string, string | null | undefined>, opts?: { push?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === '') params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.push) router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return { searchParams, update };
}
