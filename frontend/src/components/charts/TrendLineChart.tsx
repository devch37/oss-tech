'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LibraryTrendPoint } from '@/types/api';
import { formatMonth, formatNumber } from '@/lib/utils';

interface TrendLineChartProps {
  data: LibraryTrendPoint[];
  /** 차트 제목 (범례 표시용) */
  libraryName: string;
  className?: string;
}

export function TrendLineChart({ data, libraryName, className }: TrendLineChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }));

  return (
    <div className={className ?? 'h-64 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border"
            stroke="currentColor"
            strokeOpacity={0.3}
          />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatNumber}
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            formatter={(value: number) => [formatNumber(value), '사용 횟수']}
            labelFormatter={(label: string) => label}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={() => libraryName}
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Line
            type="monotone"
            dataKey="usageCount"
            name={libraryName}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: 'hsl(var(--primary))' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
