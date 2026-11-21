import { useTranslations } from 'next-intl';

const POINTS = ['source', 'excluded', 'activity', 'fields', 'fresh'] as const;

/** 프로젝트 목록의 출처와 거르는 기준 — 눌러서 펼쳐 본다 */
export function HowListWasMade() {
  const t = useTranslations('repositories.how');
  return (
    <details className="group rounded-xl border border-border bg-card/60 open:bg-card">
      <summary className="flex cursor-pointer list-none items-center px-4 py-3 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        {t('summary')}
      </summary>
      <ul className="list-disc space-y-2 border-t border-border px-4 py-4 pl-9 text-sm leading-relaxed text-muted-foreground">
        {POINTS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </details>
  );
}
