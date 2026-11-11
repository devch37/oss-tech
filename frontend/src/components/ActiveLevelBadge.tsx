import { useTranslations } from 'next-intl';
import { cn, getScoreGrade, getScoreGradeClass } from '@/lib/utils';
import type { ScoreGrade } from '@/lib/utils';

interface ActiveLevelBadgeProps {
  /** score 수치 또는 이미 계산된 grade */
  score?: number | null;
  grade?: ScoreGrade;
  className?: string;
}

export function ActiveLevelBadge({ score, grade: gradeProp, className }: ActiveLevelBadgeProps) {
  const t = useTranslations('grades');
  const grade = gradeProp ?? getScoreGrade(score ?? null);
  const label = grade === '-' ? t('none') : `${grade} · ${t(grade)}`;

  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1.5 font-display text-xs font-semibold',
        getScoreGradeClass(grade),
        className,
      )}
    >
      {grade}
    </span>
  );
}
