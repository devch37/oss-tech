import { getTranslations } from 'next-intl/server';
import { formatCompact } from '@/lib/utils';
import { starsPerDay } from '@/lib/trend';
import type { TrendRepo } from '@/types/api';

/**
 * 주식 시세판처럼 흐르는 "지금 뜨는 프로젝트" 띠. 스타 하루 평균을 초록 ▲로 보여 준다.
 * 같은 내용을 두 번 이어 붙여 끊김 없이 돌고, 두 번째는 스크린리더에서 숨긴다.
 * 마우스를 올리거나 키보드로 초점이 가면 멈추고, 움직임 줄이기 설정이면 멈춰 있다.
 */
export async function TrendTicker({ locale, repos }: { locale: string; repos: TrendRepo[] }) {
  const t = await getTranslations({ locale, namespace: 'trends.ticker' });

  const items = repos
    .map((r) => ({ repo: r, perDay: starsPerDay(r.stars, r.createdAt) }))
    .filter((x): x is { repo: TrendRepo; perDay: number } => x.perDay !== null && x.perDay > 0)
    .slice(0, 14);
  if (items.length < 3) return null;

  const row = (hidden: boolean) =>
    items.map(({ repo, perDay }) => (
      <li key={`${hidden ? 'b' : 'a'}-${repo.fullName}`} className="shrink-0">
        <a
          href={`https://github.com/${repo.fullName}`}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={hidden ? -1 : undefined}
          className="inline-flex items-center gap-2 rounded px-1 hover:text-foreground"
        >
          <span className="text-trend-ink" aria-hidden="true">▲</span>
          <span className="font-medium text-foreground/90">{repo.name}</span>
          <span className="text-trend-ink">{t('perDay', { count: formatCompact(perDay, locale) })}</span>
          <span className="text-muted-foreground">★ {formatCompact(repo.stars, locale)}</span>
        </a>
      </li>
    ));

  return (
    <section aria-label={t('label')} className="relative overflow-hidden border-y border-border/70 bg-card/40 py-2.5 font-mono text-xs [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
      <ul className="ticker-track flex w-max animate-ticker items-center gap-8 pr-8 text-muted-foreground">
        {row(false)}
        <li aria-hidden="true" className="contents">
          <ul className="contents">{row(true)}</ul>
        </li>
      </ul>
    </section>
  );
}
