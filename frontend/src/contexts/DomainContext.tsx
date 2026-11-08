'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DOMAIN_COOKIE, isKnownDomain } from '@/lib/domains';

interface DomainContextValue {
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  /** 현재 분야를 유지한 채 이동할 링크 생성 */
  hrefWithDomain: (path: string) => string;
}

const DomainContext = createContext<DomainContextValue | null>(null);

function writeCookie(domain: string) {
  document.cookie = `${DOMAIN_COOKIE}=${domain}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * 분야(domain) 상태의 단일 진실 공급원 = URL `?domain=`.
 * URL 에 없을 때는 서버가 쿠키로 결정한 initialDomain 을 사용한다.
 * 선택 시 쿠키에도 저장 → 링크에 파라미터가 없어도 서버가 같은 분야를 렌더링.
 */
export function DomainProvider({
  initialDomain,
  children,
}: {
  initialDomain: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlDomain = searchParams.get('domain');
  const [fallback, setFallback] = useState(initialDomain);

  const selectedDomain = isKnownDomain(urlDomain) ? urlDomain : fallback;

  // URL 로 들어온 분야는 쿠키에도 반영 (공유 링크로 진입한 경우)
  useEffect(() => {
    if (isKnownDomain(urlDomain)) {
      writeCookie(urlDomain);
      setFallback(urlDomain);
    }
  }, [urlDomain]);

  const setSelectedDomain = useCallback(
    (domain: string) => {
      writeCookie(domain);
      setFallback(domain);
      // 상세 페이지는 분야에 종속 → 목록으로 이동. 목록 페이지는 페이지 전용 필터 초기화.
      const segments = pathname.split('/').filter(Boolean);
      const base = segments.length > 1 ? `/${segments[0]}` : pathname;
      router.push(`${base}?domain=${domain}`);
    },
    [pathname, router],
  );

  const hrefWithDomain = useCallback(
    (path: string) => {
      const sep = path.includes('?') ? '&' : '?';
      return `${path}${sep}domain=${selectedDomain}`;
    },
    [selectedDomain],
  );

  return (
    <DomainContext.Provider value={{ selectedDomain, setSelectedDomain, hrefWithDomain }}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain(): DomainContextValue {
  const ctx = useContext(DomainContext);
  if (!ctx) throw new Error('useDomain must be used within DomainProvider');
  return ctx;
}
