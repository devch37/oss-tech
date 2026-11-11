'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Class-based Error Boundary ───────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorCard onRetry={() => this.setState({ hasError: false, error: null })} />
        )
      );
    }
    return this.props.children;
  }
}

// ─── Stateless Error UI ───────────────────────────────────────────────────────

interface ErrorCardProps {
  /** 무슨 일이 있었고 어떻게 하면 되는지. 생략하면 일반 안내 문구 */
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorCard({ message, onRetry, className }: ErrorCardProps) {
  const t = useTranslations();
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border border-border border-l-4 border-l-brick bg-card p-4 sm:p-5',
        className,
      )}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brick" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1">
          <p className="font-medium">{t('errors.title')}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{message ?? t('errors.description')}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            {t('common.retry')}
          </Button>
        )}
      </div>
    </div>
  );
}
