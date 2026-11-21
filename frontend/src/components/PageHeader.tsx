import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
