import { HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

const TERMS = ['github', 'project', 'star', 'developer'] as const;

/** "처음이세요?" — 눌러서 펼치는 낱말 풀이. 스타·레포·개발자가 뭔지 모르는 사람도 바로 따라올 수 있게 한다. */
export function Explainer() {
  const t = useTranslations('trends.explainer');

  return (
    <details className="group rounded-2xl border border-border bg-card open:border-signal/60">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-base font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <HelpCircle className="h-6 w-6 shrink-0 text-signal-ink" aria-hidden="true" />
        <span>{t('summary')}</span>
        <span aria-hidden="true" className="ml-auto text-xl text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <dl className="grid gap-x-8 gap-y-5 border-t border-border px-5 py-5 sm:grid-cols-2">
        {TERMS.map((key) => (
          <div key={key}>
            <dt className="font-display text-lg font-semibold">{t(`${key}.term`)}</dt>
            <dd className="mt-1 text-base leading-relaxed text-muted-foreground">{t(`${key}.text`)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
