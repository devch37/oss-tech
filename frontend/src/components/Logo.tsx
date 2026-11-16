import { cn } from '@/lib/utils';

/** 레이더 글리프 — 두 개의 링, 신호(앰버 점)를 향하는 스윕 선. 파비콘(app/icon.svg)과 같은 모양 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn('h-7 w-7 shrink-0', className)}>
      <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />
      <path d="M16 16L22.8 9.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="22.9" cy="9.1" r="3.2" className="fill-signal" />
    </svg>
  );
}
