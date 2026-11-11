'use client';

import { useEffect } from 'react';
import { ErrorCard } from '@/components/ErrorBoundary';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocaleError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[PageError]', error);
  }, [error]);

  return (
    <div className="max-w-2xl pb-8">
      <ErrorCard onRetry={reset} />
    </div>
  );
}
