import { useTranslations } from 'next-intl';

const POINTS = ['source', 'excluded', 'activity', 'fields', 'fresh'] as const;

/** 프로젝트 목록의 출처와 거르는 기준 — 눌러서 펼쳐 본다 */
export function HowListWasMade() {
  const t = useTranslations('repositories.how');
  return (
    <details className="rounded-2xl border border-border bg-card">
      <summary className="cursor-pointer list-none px-5 py-4 text-base font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        {t('summary')}
      </summary>
      <ul className="list-disc space-y-3 border-t border-border px-5 py-5 pl-10 text-base leading-relaxed text-muted-foreground">
        {POINTS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </details>
  );
}
