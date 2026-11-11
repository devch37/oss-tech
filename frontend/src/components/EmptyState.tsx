import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** 명령어/코드 스니펫 등 다음 행동 */
  code?: string;
  hint?: string;
  className?: string;
}

/** 빈 화면은 막다른 길이 아니라 다음 행동을 안내하는 자리다. */
export function EmptyState({ title, description, code, hint, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 rounded-lg border border-dashed border-border bg-card/50 p-6 sm:p-8',
        className,
      )}
    >
      <Logo className="h-8 w-8 text-muted-foreground" />
      <div className="space-y-1.5">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {description && <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {code && (
        <pre className="max-w-full overflow-x-auto rounded-md border border-border bg-muted px-4 py-3 text-sm">
          <code>{code}</code>
        </pre>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
