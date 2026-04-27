import { cn, getScoreGrade, getScoreGradeColor } from '@/lib/utils';
import type { ScoreGrade } from '@/lib/utils';

interface ActiveLevelBadgeProps {
  /** score 수치 또는 이미 계산된 grade */
  score?: number | null;
  grade?: ScoreGrade;
  className?: string;
}

export function ActiveLevelBadge({ score, grade: gradeProp, className }: ActiveLevelBadgeProps) {
  const grade = gradeProp ?? getScoreGrade(score ?? null);
  const colorClass = getScoreGradeColor(grade);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-bold',
        colorClass,
        className,
      )}
    >
      {grade}
    </span>
  );
}
