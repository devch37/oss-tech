import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InfoTip } from '@/components/InfoTip';

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  info?: React.ReactNode;
  icon: LucideIcon;
  /** 아이콘 배경 색 (tailwind 클래스 전체 문자열) */
  iconClass?: string;
  className?: string;
}

export function StatTile({ label, value, hint, info, icon: Icon, iconClass, className }: StatTileProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift sm:p-5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
          {label}
          {info && <InfoTip>{info}</InfoTip>}
        </p>
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl',
            iconClass ?? 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums sm:text-[28px]">{value}</div>
      {hint && <div className="mt-1 truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
