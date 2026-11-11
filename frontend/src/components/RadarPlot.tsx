'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Repository } from '@/types/api';
import { cn, formatCompact, formatNumber } from '@/lib/utils';

/**
 * Stars × Activity 사분면 플롯 ("레이더").
 *  - X: 스타 수(로그), Y: Active Level 점수, 점 크기: 포크 수
 *  - 십자선 중심은 두 축의 중앙값. 중심에서 퍼지는 동심원이 레이더 느낌을 준다.
 *  - 로드 시 12시 방향에서 시계 방향으로 스윕이 한 번 돌고, 점은 선이 지나가는 순서대로 나타난다.
 */

type Quadrant = 'rising' | 'established' | 'coasting' | 'quiet';

interface PlotPoint {
  repo: Repository;
  score: number;
  quadrant: Quadrant;
  x: number;
  y: number;
  r: number;
  delay: number;
}

const SWEEP_SECONDS = 1.6;
const MARGIN = { top: 20, right: 24, bottom: 50, left: 58 };

// ─── 수학 헬퍼 ────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return 0;
  return sorted.length % 2 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

/** 1·2·5 × 10^k 로 반올림한 "보기 좋은" 간격 */
function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

function linearTicks(max: number, count = 4): { ticks: number[]; max: number } {
  const step = niceStep(max / count);
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return { ticks, max: niceMax };
}

function logTicks(min: number, max: number): number[] {
  const build = (multipliers: number[]) => {
    const out: number[] = [];
    for (let k = Math.floor(Math.log10(min)); k <= Math.ceil(Math.log10(max)); k++) {
      for (const m of multipliers) {
        const v = m * Math.pow(10, k);
        if (v >= min && v <= max) out.push(v);
      }
    }
    return out;
  };
  const coarse = build([1, 3]);
  return coarse.length >= 3 ? coarse : build([1, 2, 5]);
}

function useContainerWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.clientWidth));
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

const QUADRANT_FILL: Record<Quadrant, string> = {
  rising: 'hsl(var(--signal))',
  established: 'hsl(var(--sea))',
  coasting: 'hsl(var(--muted-foreground) / 0.6)',
  quiet: 'hsl(var(--muted-foreground) / 0.4)',
};

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

interface RadarPlotProps {
  repositories: Repository[];
  className?: string;
}

export function RadarPlot({ repositories, className }: RadarPlotProps) {
  const t = useTranslations('radar');
  const locale = useLocale();
  const [containerRef, width] = useContainerWidth<HTMLDivElement>();
  const [active, setActive] = useState<PlotPoint | null>(null);

  const height = width < 480 ? 340 : width < 820 ? 400 : 460;

  const data = useMemo(
    () => repositories.filter((r): r is Repository & { score: number } => r.score !== null && r.stars > 0),
    [repositories],
  );

  const layout = useMemo(() => {
    if (width === 0 || data.length === 0) return null;

    const x0 = MARGIN.left;
    const x1 = width - MARGIN.right;
    const y0 = MARGIN.top;
    const y1 = height - MARGIN.bottom;

    // X: 로그 스케일
    const starValues = data.map((r) => r.stars);
    let lmin = Math.log10(Math.max(1, Math.min(...starValues))) - 0.12;
    let lmax = Math.log10(Math.max(...starValues)) + 0.08;
    if (lmax - lmin < 0.6) {
      const mid = (lmax + lmin) / 2;
      lmin = mid - 0.3;
      lmax = mid + 0.3;
    }
    const xOf = (stars: number) => x0 + ((Math.log10(stars) - lmin) / (lmax - lmin)) * (x1 - x0);

    // Y: 선형
    const maxScore = Math.max(...data.map((r) => r.score), 1);
    const { ticks: yTicks, max: yMax } = linearTicks(maxScore * 1.08);
    const yOf = (score: number) => y1 - (score / yMax) * (y1 - y0);

    const medStars = median(starValues);
    const medScore = median(data.map((r) => r.score));
    const cx = xOf(medStars);
    const cy = yOf(medScore);

    // 중심에서 가장 먼 모서리까지의 거리 = 동심원/스윕 반지름
    const R = Math.max(
      Math.hypot(cx - x0, cy - y0),
      Math.hypot(cx - x1, cy - y0),
      Math.hypot(cx - x0, cy - y1),
      Math.hypot(cx - x1, cy - y1),
    );

    const points: PlotPoint[] = data
      .map((repo) => {
        const px = xOf(repo.stars);
        const py = yOf(repo.score);
        const quadrant: Quadrant =
          repo.stars >= medStars
            ? repo.score >= medScore
              ? 'established'
              : 'coasting'
            : repo.score >= medScore
              ? 'rising'
              : 'quiet';
        // 12시 기준 시계 방향 각도(0~360) → 스윕 선이 닿는 시점
        const angle = ((Math.atan2(px - cx, -(py - cy)) * 180) / Math.PI + 360) % 360;
        return {
          repo,
          score: repo.score,
          quadrant,
          x: px,
          y: py,
          r: 4 + Math.min(6, Math.sqrt(repo.forks) / 9),
          delay: 0.12 + (angle / 360) * SWEEP_SECONDS,
        };
      })
      // 큰 점을 먼저 그려 작은 점이 위에 오도록
      .sort((a, b) => b.r - a.r);

    // 라벨: 활동 점수 상위 3 + 스타 상위 2, 겹치면 건너뜀
    const byScore = [...points].sort((a, b) => b.score - a.score).slice(0, 3);
    const byStars = [...points].sort((a, b) => b.repo.stars - a.repo.stars).slice(0, 2);
    const labelled: PlotPoint[] = [];
    for (const p of [...byScore, ...byStars]) {
      if (labelled.includes(p)) continue;
      if (labelled.some((q) => Math.abs(q.y - p.y) < 15 && Math.abs(q.x - p.x) < 130)) continue;
      labelled.push(p);
    }

    return {
      x0, x1, y0, y1, cx, cy, R, xOf, yOf, yTicks, points, labelled,
      xTicks: logTicks(Math.pow(10, lmin), Math.pow(10, lmax)),
    };
  }, [data, width, height]);

  const tooltipStyle = useMemo<CSSProperties | undefined>(() => {
    if (!active) return undefined;
    const w = 220;
    const left = Math.min(Math.max(active.x - w / 2, 8), Math.max(8, width - w - 8));
    const below = active.y < 150;
    return { left, top: below ? active.y + active.r + 12 : active.y - active.r - 12, width: w, transform: below ? undefined : 'translateY(-100%)' };
  }, [active, width]);

  return (
    <div ref={containerRef} className={cn('relative w-full', className)} style={{ minHeight: height }}>
      {/* 크롤러/스크린리더용 텍스트 목록 */}
      <ul className="sr-only" aria-label={t('listLabel')}>
        {data.map((r) => (
          <li key={r.id}>
            {r.fullName}: {t('tooltip.stars')} {formatNumber(r.stars, locale)}, {t('tooltip.score')} {r.score.toFixed(1)}
          </li>
        ))}
      </ul>

      {layout && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          role="group"
          aria-label={t('ariaLabel', { count: data.length })}
          className="block overflow-visible"
        >
          <defs>
            <clipPath id="radar-clip">
              <rect x={layout.x0} y={layout.y0} width={layout.x1 - layout.x0} height={layout.y1 - layout.y0} />
            </clipPath>
          </defs>

          {/* 플롯 배경 */}
          <rect
            x={layout.x0}
            y={layout.y0}
            width={layout.x1 - layout.x0}
            height={layout.y1 - layout.y0}
            rx={6}
            className="fill-card stroke-border"
          />

          <g clipPath="url(#radar-clip)">
            {/* 사분면 색조 */}
            <rect x={layout.x0} y={layout.y0} width={layout.cx - layout.x0} height={layout.cy - layout.y0} fill="hsl(var(--signal) / 0.07)" />
            <rect x={layout.cx} y={layout.y0} width={layout.x1 - layout.cx} height={layout.cy - layout.y0} fill="hsl(var(--sea) / 0.06)" />

            {/* 동심원 */}
            {[0.25, 0.5, 0.75, 1].map((f, i) => (
              <circle
                key={f}
                cx={layout.cx}
                cy={layout.cy}
                r={layout.R * f}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeDasharray={i % 2 === 0 ? undefined : '3 5'}
              />
            ))}

            {/* 십자선 */}
            <line x1={layout.cx} x2={layout.cx} y1={layout.y0} y2={layout.y1} stroke="hsl(var(--muted-foreground) / 0.45)" strokeWidth={1} />
            <line x1={layout.x0} x2={layout.x1} y1={layout.cy} y2={layout.cy} stroke="hsl(var(--muted-foreground) / 0.45)" strokeWidth={1} />

            {/* 스윕 (1회) */}
            <g
              className="radar-sweep"
              style={{ transformOrigin: `${layout.cx}px ${layout.cy}px`, '--sweep-duration': `${SWEEP_SECONDS}s` } as CSSProperties}
              aria-hidden="true"
            >
              <path
                d={`M ${layout.cx} ${layout.cy} L ${layout.cx} ${layout.cy - layout.R} A ${layout.R} ${layout.R} 0 0 0 ${
                  layout.cx + layout.R * Math.sin(-Math.PI / 6)
                } ${layout.cy - layout.R * Math.cos(-Math.PI / 6)} Z`}
                fill="hsl(var(--signal) / 0.16)"
              />
              <line x1={layout.cx} y1={layout.cy} x2={layout.cx} y2={layout.cy - layout.R} stroke="hsl(var(--signal))" strokeWidth={1.5} />
            </g>
          </g>

          {/* 사분면 라벨 */}
          <g className="font-display text-[13px] font-semibold" aria-hidden="true">
            <text x={layout.x0 + 12} y={layout.y0 + 22} className="fill-signal-ink">{t('quadrants.rising')}</text>
            <text x={layout.x1 - 12} y={layout.y0 + 22} textAnchor="end" className="fill-sea">{t('quadrants.established')}</text>
            <text x={layout.x1 - 12} y={layout.y1 - 12} textAnchor="end" className="fill-muted-foreground">{t('quadrants.coasting')}</text>
            <text x={layout.x0 + 12} y={layout.y1 - 12} className="fill-muted-foreground">{t('quadrants.quiet')}</text>
          </g>

          {/* 축 */}
          <g className="fill-muted-foreground text-[11px] tabular-nums" aria-hidden="true">
            {layout.xTicks.map((v) => (
              <g key={`x-${v}`}>
                <line x1={layout.xOf(v)} x2={layout.xOf(v)} y1={layout.y1} y2={layout.y1 + 5} className="stroke-border" />
                <text x={layout.xOf(v)} y={layout.y1 + 19} textAnchor="middle">{formatCompact(v, locale)}</text>
              </g>
            ))}
            {layout.yTicks.map((v) => (
              <g key={`y-${v}`}>
                <line x1={layout.x0 - 5} x2={layout.x0} y1={layout.yOf(v)} y2={layout.yOf(v)} className="stroke-border" />
                <text x={layout.x0 - 10} y={layout.yOf(v) + 4} textAnchor="end">{formatCompact(v, locale)}</text>
              </g>
            ))}
            <text x={(layout.x0 + layout.x1) / 2} y={height - 8} textAnchor="middle" className="text-xs font-medium">
              {t('xAxis')}
            </text>
            <text transform={`translate(14 ${(layout.y0 + layout.y1) / 2}) rotate(-90)`} textAnchor="middle" className="text-xs font-medium">
              {t('yAxis')}
            </text>
          </g>

          {/* 점 */}
          {layout.points.map((p) => {
            const isActive = active?.repo.id === p.repo.id;
            return (
              <a
                key={p.repo.id}
                href={`https://github.com/${p.repo.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${p.repo.fullName} — ${t('tooltip.stars')} ${formatNumber(p.repo.stars, locale)}, ${t('tooltip.score')} ${p.score.toFixed(1)}`}
                onMouseEnter={() => setActive(p)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(p)}
                onBlur={() => setActive(null)}
              >
                <g className="radar-dot" style={{ '--delay': `${p.delay}s` } as CSSProperties}>
                  <circle cx={p.x} cy={p.y} r={p.r + 6} fill="transparent" />
                  {isActive && <circle cx={p.x} cy={p.y} r={p.r + 5} fill="none" stroke={QUADRANT_FILL[p.quadrant]} strokeWidth={1.5} />}
                  <circle cx={p.x} cy={p.y} r={p.r} fill={QUADRANT_FILL[p.quadrant]} stroke="hsl(var(--card))" strokeWidth={1.5} />
                </g>
              </a>
            );
          })}

          {/* 이름 라벨 */}
          <g className="fill-foreground text-xs font-medium" aria-hidden="true" pointerEvents="none">
            {layout.labelled.map((p) => {
              const flip = p.x > layout.x1 - 150;
              return (
                <text
                  key={p.repo.id}
                  className="radar-label"
                  style={{ '--delay': `${p.delay}s` } as CSSProperties}
                  x={flip ? p.x - p.r - 6 : p.x + p.r + 6}
                  y={p.y + 4}
                  textAnchor={flip ? 'end' : 'start'}
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {p.repo.name}
                </text>
              );
            })}
          </g>
        </svg>
      )}

      {active && tooltipStyle && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-lg"
          style={tooltipStyle}
        >
          <p className="truncate font-display text-sm font-semibold">{active.repo.fullName}</p>
          {active.repo.language && <p className="mt-0.5 text-muted-foreground">{active.repo.language}</p>}
          <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 tabular-nums">
            <dt className="text-muted-foreground">{t('tooltip.stars')}</dt>
            <dd>{formatNumber(active.repo.stars, locale)}</dd>
            <dt className="text-muted-foreground">{t('tooltip.forks')}</dt>
            <dd>{formatNumber(active.repo.forks, locale)}</dd>
            <dt className="text-muted-foreground">{t('tooltip.score')}</dt>
            <dd>{active.score.toFixed(1)}</dd>
            {active.repo.commits30d !== null && (
              <>
                <dt className="text-muted-foreground">{t('tooltip.commits')}</dt>
                <dd>{formatNumber(active.repo.commits30d, locale)}</dd>
              </>
            )}
            {active.repo.prsMerged30d !== null && (
              <>
                <dt className="text-muted-foreground">{t('tooltip.prs')}</dt>
                <dd>{formatNumber(active.repo.prsMerged30d, locale)}</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
