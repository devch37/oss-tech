'use client';

import { useEffect } from 'react';
import { ErrorCard } from '@/components/ErrorBoundary';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <ErrorCard
        message={error.message || '대시보드 데이터를 불러오는 중 문제가 발생했습니다.'}
        onRetry={reset}
        className="max-w-md w-full"
      />
    </div>
  );
}
