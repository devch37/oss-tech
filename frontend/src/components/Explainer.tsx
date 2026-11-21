import { CircleHelp, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

const TERMS = ['github', 'project', 'star', 'developer'] as const;

/** "처음이세요?" — 눌러서 펼치는 낱말 풀이. 평소에는 한 줄로 조용히 접혀 있다. */
export function Explainer() {
  const t = useTranslations('trends.explainer');

  return (
    <details className="group rounded-xl border border-border bg-card/60 open:bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <CircleHelp className="h-4 w-4 shrink-0 text-signal-ink" aria-hidden="true" />
        <span>{t('summary')}</span>
        <Plus className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true" />
      </summary>
      <dl className="grid gap-x-8 gap-y-4 border-t border-border px-4 py-4 sm:grid-cols-2">
        {TERMS.map((key) => (
          <div key={key}>
            <dt className="text-sm font-semibold">{t(`${key}.term`)}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t(`${key}.text`)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
