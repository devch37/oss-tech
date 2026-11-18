import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** "이 목록은 이렇게 골랐어요" — 목록 바로 위에서 기준을 한 줄로 밝혀, 어디서 온 데이터인지 바로 알게 한다. */
export function RuleNote({ children }: { children: React.ReactNode }) {
  const t = useTranslations('trends.rule');
  return (
    <p className="flex items-start gap-2.5 rounded-lg bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground">{t('label')}: </span>
        {children}
      </span>
    </p>
  );
}
