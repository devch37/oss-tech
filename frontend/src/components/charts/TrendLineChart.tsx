'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LibraryTrendPoint } from '@/types/api';
import { formatMonth, formatNumber } from '@/lib/utils';

interface TrendLineChartProps {
  data: LibraryTrendPoint[];
  className?: string;
}

export function TrendLineChart({ data, className }: TrendLineChartProps) {
  const locale = useLocale();
  const t = useTranslations('libraryDetail');
  const formatted = data.map((d) => ({ ...d, monthLabel: formatMonth(d.month, locale) }));

  return (
    <div className={className ?? 'h-64 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--signal))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--signal))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={(v: number) => formatNumber(v, locale)}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '3 4' }}
            formatter={(value: number) => [formatNumber(value, locale), t('series')]}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              fontSize: 12,
              boxShadow: '0 8px 24px -8px hsl(213 61% 11% / 0.25)',
            }}
          />
          <Area
            type="monotone"
            dataKey="usageCount"
            stroke="hsl(var(--signal))"
            strokeWidth={2.5}
            fill="url(#trend-fill)"
            dot={{ r: 3.5, fill: 'hsl(var(--signal))', stroke: 'hsl(var(--card))', strokeWidth: 1.5 }}
            activeDot={{ r: 5.5, fill: 'hsl(var(--signal))', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
