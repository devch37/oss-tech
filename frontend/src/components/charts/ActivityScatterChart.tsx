'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import type { Repository } from '@/types/api';
import { formatNumber, getScoreGrade, getScoreGradeColor } from '@/lib/utils';

interface ScatterPoint {
  stars: number;
  score: number;
  fullName: string;
  grade: string;
}

interface ActivityScatterChartProps {
  repositories: Repository[];
  className?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ScatterPoint }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div
      style={{
        borderRadius: '8px',
        border: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
        color: 'hsl(var(--card-foreground))',
        fontSize: '12px',
        padding: '8px 12px',
        lineHeight: '1.6',
      }}
    >
      <p className="font-semibold">{d.fullName}</p>
      <p>Stars: {formatNumber(d.stars)}</p>
      <p>Score: {d.score.toFixed(1)}</p>
      <p>등급: {d.grade}</p>
    </div>
  );
}

// 등급 → 점 색상 (Tailwind JIT 불가 → HSL 직접 사용)
const GRADE_COLOR: Record<string, string> = {
  S: 'hsl(271 81% 56%)', // purple
  A: 'hsl(217 91% 60%)', // blue
  B: 'hsl(142 76% 36%)', // green
  C: 'hsl(45 93% 47%)',  // yellow
  '-': 'hsl(215 16% 47%)',
};

export function ActivityScatterChart({ repositories, className }: ActivityScatterChartProps) {
  const data: ScatterPoint[] = repositories
    .filter((r) => r.score !== null && r.stars > 0)
    .map((r) => {
      const grade = getScoreGrade(r.score);
      return {
        stars: r.stars,
        score: r.score as number,
        fullName: r.fullName,
        grade,
      };
    });

  return (
    <div className={className ?? 'h-72 w-full'}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.2}
          />
          <XAxis
            type="number"
            dataKey="stars"
            name="Stars"
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Stars', position: 'insideBottomRight', offset: -8, fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="score"
            name="Active Level Score"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            label={{
              value: 'Score',
              angle: -90,
              position: 'insideLeft',
              offset: 8,
              fontSize: 11,
            }}
          />
          <ZAxis range={[40, 40]} />
          <Tooltip content={<CustomTooltip />} />
          <Scatter
            name="레포지토리"
            data={data}
            fill="hsl(var(--primary))"
            shape={(props: React.SVGProps<SVGCircleElement> & { payload?: ScatterPoint }) => {
              const { cx, cy, payload } = props;
              const color = GRADE_COLOR[payload?.grade ?? '-'] ?? GRADE_COLOR['-'];
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  fillOpacity={0.7}
                  stroke={color}
                  strokeWidth={1}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
