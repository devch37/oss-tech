'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { Library } from '@/types/api';
import { formatNumber } from '@/lib/utils';

interface LibraryBarChartProps {
  /** 상위 N개 라이브러리 */
  data: Pick<Library, 'libraryName' | 'usageCount' | 'growthRate'>[];
  className?: string;
}

// 증감률에 따른 bar 색상
function barColor(growthRate: number): string {
  if (growthRate > 10) return 'hsl(142 76% 36%)';   // emerald-600
  if (growthRate > 0) return 'hsl(var(--primary))';  // primary
  if (growthRate < 0) return 'hsl(0 84% 60%)';       // destructive
  return 'hsl(var(--muted-foreground))';
}

export function LibraryBarChart({ data, className }: LibraryBarChartProps) {
  return (
    <div className={className ?? 'h-72 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 48, left: 8, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={false}
            stroke="currentColor"
            strokeOpacity={0.2}
          />
          <XAxis
            type="number"
            tickFormatter={formatNumber}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="libraryName"
            width={100}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [formatNumber(value), '사용 횟수']}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="usageCount" name="사용 횟수" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={barColor(entry.growthRate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
