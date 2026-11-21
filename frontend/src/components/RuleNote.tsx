import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** "이 목록은 이렇게 골랐어요" — 목록 바로 위에서 기준을 한 줄로 밝힌다. 눈에 띄지 않게, 하지만 읽으면 바로 이해되게. */
export function RuleNote({ children }: { children: React.ReactNode }) {
  const t = useTranslations('trends.rule');
  return (
    <p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/50 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">
      <Info className="mt-[3px] h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground">{t('label')}. </span>
        {children}
      </span>
    </p>
  );
}
