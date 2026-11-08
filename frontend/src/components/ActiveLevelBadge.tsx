import { cn, getScoreGrade, getScoreGradeColor, GRADE_INFO } from '@/lib/utils';
import type { ScoreGrade } from '@/lib/utils';

interface ActiveLevelBadgeProps {
  score?: number | null;
  grade?: ScoreGrade;
  /** 등급 옆에 "매우 활발" 같은 라벨 표시 */
  showLabel?: boolean;
  className?: string;
}

export function ActiveLevelBadge({ score, grade: gradeProp, showLabel, className }: ActiveLevelBadgeProps) {
  const grade = gradeProp ?? getScoreGrade(score ?? null);
  const info = GRADE_INFO[grade];

  return (
    <span
      title={`${grade} 등급 · ${info.label} (${info.range})`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset',
        getScoreGradeColor(grade),
        className,
      )}
    >
      {grade}
      {showLabel && <span className="font-medium">{info.label}</span>}
    </span>
  );
}
