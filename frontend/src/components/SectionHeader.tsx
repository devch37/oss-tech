import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** 아이콘 색조 */
  tone?: 'signal' | 'sea';
  children?: React.ReactNode;
}

/** 섹션 제목 — 작은 아이콘 + 제목 + 한두 줄 설명. 아이콘은 장식이라 작게, 글자가 주인공이다. */
export function SectionHeader({ id, icon: Icon, title, description, tone = 'signal', children }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-1.5">
        <h2 id={id} className="flex scroll-mt-20 items-center gap-2.5 font-display text-xl font-semibold tracking-tight sm:text-2xl">
          <Icon className={cn('h-[18px] w-[18px] shrink-0', tone === 'signal' ? 'text-signal-ink' : 'text-sea')} aria-hidden="true" />
          {title}
        </h2>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
