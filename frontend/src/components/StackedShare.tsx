import { readableOn } from '@/lib/language-colors';
import { cn } from '@/lib/utils';

export interface ShareSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * 비율 막대 — 전체를 100% 로 보고 조각을 한 줄에 이어 붙인다. 가장 빠르게 "누가 얼마나 큰지" 보여 주는 그래프.
 * 조각이 충분히 넓으면 이름과 비율을 안에 적고, 좁은 조각은 아래 범례에서 읽는다.
 */
export function StackedShare({ segments, className }: { segments: ShareSegment[]; className?: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className="flex h-11 w-full gap-0.5 overflow-hidden rounded-lg"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}
      >
        {segments.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <div
              key={s.key}
              className="flex min-w-[2px] items-center overflow-hidden px-2 font-mono text-[11px] font-medium"
              style={{ width: `${pct}%`, backgroundColor: s.color, color: readableOn(s.color) }}
              title={`${s.label} ${pct.toFixed(1)}%`}
            >
              {pct >= 6 && (
                <span className="truncate">
                  <span className="hidden sm:inline">{pct >= 9 ? `${s.label} ` : ''}</span>
                  {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {segments.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-foreground/90">{s.label}</span>
            <span className="font-mono tabular-nums">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
