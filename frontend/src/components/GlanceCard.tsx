import { cn } from '@/lib/utils';

/** "한눈에 보기" 카드 — 제목 한 줄 아래에 그래프 하나. 탭마다 같은 틀이라 어디서든 같은 방식으로 읽힌다. */
export function GlanceCard({ title, hint, children, className }: { title: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-border bg-card/60 p-4 sm:p-5', className)}>
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}
