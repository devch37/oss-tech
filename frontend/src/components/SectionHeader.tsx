import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** 아이콘 배경 색조 */
  tone?: 'signal' | 'sea';
  children?: React.ReactNode;
}

/** 섹션 제목 — 큰 아이콘 + 질문형 제목 + 한두 줄 쉬운 설명. 모든 섹션이 같은 모양이라 처음 보는 사람도 구조를 금방 익힌다. */
export function SectionHeader({ id, icon: Icon, title, description, tone = 'signal', children }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex max-w-2xl items-start gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
            tone === 'signal' ? 'bg-signal/20 text-signal-ink' : 'bg-sea/15 text-sea',
          )}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="space-y-1.5">
          <h2 id={id} className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {title}
          </h2>
          {description && <p className="text-base leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
