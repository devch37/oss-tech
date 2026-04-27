import type { LucideIcon } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GrowthBadge } from '@/components/GrowthBadge';

interface StatCardProps {
  title: string;
  value: number;
  /** undefined이면 변화율 미표시 */
  growthRate?: number;
  icon: LucideIcon;
  /** 수치 포맷 — 기본값: formatNumber (천 단위 구분) */
  formatter?: (v: number) => string;
  className?: string;
}

export function StatCard({
  title,
  value,
  growthRate,
  icon: Icon,
  formatter = formatNumber,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{formatter(value)}</div>
        {growthRate !== undefined && (
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <GrowthBadge rate={growthRate} />
            <span>전월 대비</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
