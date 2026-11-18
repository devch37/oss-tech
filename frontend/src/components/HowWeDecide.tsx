import { useTranslations } from 'next-intl';

const ITEMS = ['newProjects', 'loved', 'languages', 'developers'] as const;

/** "이 순위는 어떻게 정하나요?" — 숨기지 않고 한 번 눌러서 볼 수 있게 둔다. 믿을 수 있는 사이트의 기본이다. */
export function HowWeDecide() {
  const t = useTranslations('trends.how');

  return (
    <details className="rounded-2xl border border-border bg-card">
      <summary className="cursor-pointer list-none px-5 py-4 text-base font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        {t('summary')}
      </summary>
      <div className="space-y-3 border-t border-border px-5 py-5 text-base leading-relaxed text-muted-foreground">
        <p>{t('intro')}</p>
        <ul className="list-disc space-y-2 pl-5">
          {ITEMS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
