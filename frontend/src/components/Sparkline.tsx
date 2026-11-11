import { cn } from '@/lib/utils';

interface SparklineProps {
  values: number[];
  className?: string;
}

/** 장식용 미니 추이선 — 수치는 옆의 텍스트가 전달하므로 스크린리더에서는 숨긴다. */
export function Sparkline({ values, className }: SparklineProps) {
  const width = 96;
  const height = 28;
  const pad = 3;

  if (values.length < 2) {
    return <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className={cn('h-7 w-24', className)} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);
  const points = values.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - ((v - min) / span) * (height - pad * 2),
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1] as { x: number; y: number };

  return (
    <svg aria-hidden="true" viewBox={`0 0 ${width} ${height}`} className={cn('h-7 w-24 overflow-visible', className)}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.6} className="fill-signal" />
    </svg>
  );
}
