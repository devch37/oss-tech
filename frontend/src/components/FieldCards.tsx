import { ArrowRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatCompact, getScoreGrade } from '@/lib/utils';
import type { DomainOverview } from '@/types/api';
import { LevelBar } from '@/components/LevelBar';

/**
 * 여섯 개 분야를 한 화면에 — 분야마다 "지금 가장 활발한 프로젝트"와 "가장 많이 쓰이는 라이브러리"를 보여주고
 * 누르면 그 분야 상세로 이동한다. 카드 전체가 하나의 링크라서 내부에 또 다른 링크는 두지 않는다.
 */
export function FieldCards({ domains }: { domains: DomainOverview[] }) {
  const t = useTranslations('overview.fields');
  const td = useTranslations('domains');
  const tg = useTranslations('grades');
  const locale = useLocale();

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {domains.map((d) => {
        const empty = d.repositoryCount === 0;
        const grade = getScoreGrade(d.topRepository?.score ?? null);
        return (
          <li key={d.domain} className="relative">
            <div className="group flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors focus-within:border-foreground/40 hover:border-foreground/40">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  <Link
                    href={{ pathname: '/', query: { domain: d.domain } }}
                    className="after:absolute after:inset-0 after:rounded-lg"
                    aria-label={t('open', { domain: td(d.domain as 'frontend') })}
                  >
                    {td(d.domain as 'frontend')}
                  </Link>
                </h3>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {empty ? t('empty') : t('projects', { count: d.repositoryCount })}
                </span>
              </div>

              {!empty && <LevelBar levels={d.levels} legend={false} />}

              <dl className="space-y-2.5 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t('hottest')}</dt>
                  <dd className="font-medium">
                    {d.topRepository ? (
                      <>
                        <span className="break-all">{d.topRepository.name}</span>
                        <span className="ml-2 font-normal text-signal-ink">{grade === '-' ? '' : tg(grade)}</span>
                      </>
                    ) : (
                      <span className="font-normal text-muted-foreground">{t('empty')}</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('topLibrary')}</dt>
                  <dd className="font-medium">
                    {d.topLibrary ? (
                      <>
                        <span className="break-all">{d.topLibrary.name}</span>
                        <span className="ml-2 font-normal tabular-nums text-muted-foreground">
                          {t('usedBy', { count: d.topLibrary.usageCount })}
                        </span>
                      </>
                    ) : (
                      <span className="font-normal text-muted-foreground">{t('empty')}</span>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="mt-auto flex items-center justify-between pt-1 text-sm text-muted-foreground">
                <span className="tabular-nums">
                  {!empty && t('stars', { count: formatCompact(d.totalStars, locale) })}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
