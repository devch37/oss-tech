import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

const ITEMS = ['newProjects', 'loved', 'languages', 'developers'] as const;

/** "이 순위는 어떻게 정하나요?" — 숨기지 않고 한 번 눌러서 볼 수 있게 둔다. */
export function HowWeDecide() {
  const t = useTranslations('trends.how');

  return (
    <details id="how" className="group scroll-mt-20 rounded-xl border border-border bg-card/60 open:bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        {t('summary')}
        <Plus className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true" />
      </summary>
      <div className="space-y-3 border-t border-border px-4 py-4 text-sm leading-relaxed text-muted-foreground">
        <p>{t('intro')}</p>
        <ul className="list-disc space-y-1.5 pl-5">
          {ITEMS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
