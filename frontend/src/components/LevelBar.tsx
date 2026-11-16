import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { LevelCounts } from '@/types/api';

const SEGMENTS = [
  { key: 's', grade: 'S', className: 'bg-signal' },
  { key: 'a', grade: 'A', className: 'bg-signal/65' },
  { key: 'b', grade: 'B', className: 'bg-signal/35' },
  { key: 'c', grade: 'C', className: 'bg-muted-foreground/30' },
] as const;

interface LevelBarProps {
  levels: LevelCounts;
  /** 범례(등급 이름과 개수)를 막대 아래에 보여줄지 */
  legend?: boolean;
  className?: string;
}

/**
 * 활동 등급 분포 — 한 줄짜리 누적 막대. 앰버의 농도가 진할수록 더 활발하다.
 * 색만으로 구분하지 않도록 범례에 등급 이름과 개수를 함께 적는다.
 */
export function LevelBar({ levels, legend = true, className }: LevelBarProps) {
  const t = useTranslations('grades');
  const total = levels.s + levels.a + levels.b + levels.c;

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={SEGMENTS.map((seg) => `${t(seg.grade)} ${levels[seg.key]}`).join(', ')}
      >
        {total > 0 &&
          SEGMENTS.filter((seg) => levels[seg.key] > 0).map((seg) => (
            <span key={seg.key} className={seg.className} style={{ width: `${(levels[seg.key] / total) * 100}%` }} />
          ))}
      </div>
      {legend && (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-4">
          {SEGMENTS.map((seg) => (
            <li key={seg.key} className="flex items-center gap-2">
              <span aria-hidden="true" className={cn('h-2.5 w-2.5 shrink-0 rounded-sm', seg.className)} />
              <span className="text-muted-foreground">{t(seg.grade)}</span>
              <span className="ml-auto font-medium tabular-nums">{levels[seg.key]}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
