'use client';

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import type { Repository } from '@/types/api';
import { formatCompact, formatNumber, getScoreGrade, GRADE_HEX, GRADE_INFO, type ScoreGrade } from '@/lib/utils';

interface ScatterPoint {
  stars: number;
  score: number;
  fullName: string;
  grade: ScoreGrade;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  const d = payload?.[0]?.payload;
  if (!active || !d) return null;
  return (
    <div className="rounded-xl border bg-popover px-3 py-2 text-xs shadow-lift">
      <p className="font-semibold">{d.fullName}</p>
      <p className="mt-1 text-muted-foreground">
        ★ {formatNumber(d.stars)} · 활성도 {d.score.toFixed(1)}점
      </p>
      <p className="mt-0.5 font-medium" style={{ color: GRADE_HEX[d.grade] }}>
        {d.grade} 등급 · {GRADE_INFO[d.grade].label}
      </p>
    </div>
  );
}

export function ActivityScatterChart({
  repositories,
  className,
}: {
  repositories: Repository[];
  className?: string;
}) {
  const data: ScatterPoint[] = repositories
    .filter((r) => r.score !== null && r.stars > 0)
    .map((r) => ({
      stars: r.stars,
      score: r.score as number,
      fullName: r.fullName,
      grade: getScoreGrade(r.score),
    }));

  return (
    <div className={className ?? 'h-72 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 12, left: -12, bottom: 4 }}>
          <CartesianGrid stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="stars"
            name="Stars"
            scale="log"
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatCompact(v)}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="number"
            dataKey="score"
            name="활성도"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <ZAxis range={[70, 70]} />
          <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter
            data={data}
            shape={(props: { cx?: number; cy?: number; payload?: ScatterPoint }) => {
              const color = GRADE_HEX[props.payload?.grade ?? '-'];
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={6}
                  fill={color}
                  fillOpacity={0.75}
                  stroke="hsl(var(--card))"
                  strokeWidth={1.5}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>← Stars 적음 · 많음 → (로그 스케일)</span>
        <span className="flex flex-wrap gap-3">
          {(['S', 'A', 'B', 'C'] as const).map((g) => (
            <span key={g} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: GRADE_HEX[g] }} />
              {g} {GRADE_INFO[g].label}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
