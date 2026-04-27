'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DomainContextValue {
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
}

const DomainContext = createContext<DomainContextValue | null>(null);

const STORAGE_KEY = 'oss-tech-selected-domain';
const DEFAULT_DOMAIN = 'frontend';

export function DomainProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [selectedDomain, setSelectedDomainState] = useState<string>(DEFAULT_DOMAIN);

  // 마운트 후 URL → localStorage → 기본값 순으로 초기화 (SSR hydration mismatch 방지)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlDomain = urlParams.get('domain');
    if (urlDomain) {
      setSelectedDomainState(urlDomain);
      localStorage.setItem(STORAGE_KEY, urlDomain);
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSelectedDomainState(stored);
    }
  }, []);

  const setSelectedDomain = useCallback(
    (domain: string) => {
      setSelectedDomainState(domain);
      localStorage.setItem(STORAGE_KEY, domain);
      // URL 업데이트 → 서버 컴포넌트 searchParams 재실행 (SSR 데이터 갱신)
      router.push(`?domain=${domain}`);
    },
    [router],
  );

  return (
    <DomainContext.Provider value={{ selectedDomain, setSelectedDomain }}>
      {children}
    </DomainContext.Provider>
  );
}

export function useDomain(): DomainContextValue {
  const ctx = useContext(DomainContext);
  if (!ctx) throw new Error('useDomain must be used within DomainProvider');
  return ctx;
}
