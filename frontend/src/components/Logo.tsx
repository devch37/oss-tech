import { cn } from '@/lib/utils';

/** 레이더 글리프 — 두 개의 링, 12시 방향 스윕 선, 하나의 신호(앰버 점) */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-7 w-7 shrink-0', className)}>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />
      <path d="M16 16V3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="22.5" cy="10.5" r="3.1" className="fill-signal" />
    </svg>
  );
}
