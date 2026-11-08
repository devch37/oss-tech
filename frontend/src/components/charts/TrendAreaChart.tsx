'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LibraryTrendPoint } from '@/types/api';
import { formatMonth, formatNumber, formatShortMonth } from '@/lib/utils';

interface TrendAreaChartProps {
  data: LibraryTrendPoint[];
  className?: string;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: LibraryTrendPoint }[];
}) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lift">
      <p className="text-muted-foreground">{formatMonth(p.month)}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">
        {formatNumber(p.usageCount)}개 프로젝트
      </p>
    </div>
  );
}

// SVG 속성에서는 CSS 변수가 해석되지 않으므로 고정 색상 사용 (primary 와 동일 계열)
const color = '#6366f1';

export function TrendAreaChart({ data, className }: TrendAreaChartProps) {
  return (
    <div className={className ?? 'h-64 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            tickFormatter={formatShortMonth}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={formatNumber}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="usageCount"
            stroke={color}
            strokeWidth={2.5}
            fill="url(#trendFill)"
            isAnimationActive={false}
            dot={{ r: 3.5, fill: color, stroke: color, strokeWidth: 2 }}
            activeDot={{ r: 5.5, fill: color, stroke: color, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
