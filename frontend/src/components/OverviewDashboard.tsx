import { getTranslations } from 'next-intl/server';
import { getOverview } from '@/lib/api-client';
import { formatCompact, formatMonth, formatNumber } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { FieldCards } from '@/components/FieldCards';
import { GemList } from '@/components/GemList';
import { LanguageBars } from '@/components/LanguageBars';
import { LevelBar } from '@/components/LevelBar';
import { ProjectBars } from '@/components/ProjectBars';
import { StatStrip } from '@/components/StatStrip';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8089';

function SectionHeading({ id, title, description }: { id: string; title: string; description?: string }) {
  return (
    <div className="max-w-2xl space-y-1.5">
      <h2 id={id} className="font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}

/**
 * 첫 화면 대시보드 — 여섯 분야를 가로질러 "지금 무엇이 뜨는가"를 한 번에 보여준다.
 * 위에서 아래로: 핵심 수치 → 가장 활발한 프로젝트 → 분야별 요약 → 숨은 후보 / 활동 분포 / 언어 분포.
 */
export async function OverviewDashboard({ locale }: { locale: string }) {
  const [t, th, overview] = await Promise.all([
    getTranslations({ locale, namespace: 'overview' }),
    getTranslations({ locale, namespace: 'home' }),
    getOverview().catch(() => null),
  ]);

  const header = (
    <section className="max-w-3xl space-y-3">
      <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">{t('title')}</h1>
      <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t('intro')}</p>
    </section>
  );

  if (!overview) {
    return (
      <div className="space-y-10">
        {header}
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      </div>
    );
  }

  if (overview.totals.repositories === 0) {
    return (
      <div className="space-y-10">
        {header}
        <EmptyState
          title={th('empty.title', { domain: t('tab') })}
          description={th('empty.description')}
          code={`curl -X POST "${API_ORIGIN}/api/v1/crawl/trigger?domain=frontend"`}
          hint={th('empty.hint')}
        />
      </div>
    );
  }

  const { totals } = overview;

  return (
    <div className="space-y-14 pb-4">
      <div className="space-y-6">
        {header}
        {overview.libraryMonth && (
          <p className="text-sm text-muted-foreground">
            {t('scope', {
              repos: totals.repositories,
              libs: totals.libraries,
              month: formatMonth(overview.libraryMonth, locale),
            })}
          </p>
        )}
      </div>

      <StatStrip
        items={[
          { label: t('stats.projects'), value: formatNumber(totals.repositories, locale) },
          { label: t('stats.stars'), value: formatCompact(totals.stars, locale) },
          { label: t('stats.commits'), value: formatCompact(totals.commits30d, locale) },
          { label: t('stats.libraries'), value: formatNumber(totals.libraries, locale) },
        ]}
      />

      <section aria-labelledby="hot-heading" className="space-y-5">
        <SectionHeading id="hot-heading" title={t('hot.title')} description={t('hot.description')} />
        <ProjectBars repositories={overview.topRepositories} showField allowSort={false} />
      </section>

      <section aria-labelledby="fields-heading" className="space-y-5">
        <SectionHeading id="fields-heading" title={t('fields.title')} description={t('fields.description')} />
        <FieldCards domains={overview.domains} />
      </section>

      <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="gems-heading" className="space-y-5">
          <SectionHeading id="gems-heading" title={t('gems.title')} description={t('gems.description')} />
          {overview.hiddenGems.length > 0 ? (
            <GemList repositories={overview.hiddenGems} />
          ) : (
            <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t('gems.empty')}
            </p>
          )}
        </section>

        <div className="space-y-14">
          <section aria-labelledby="levels-heading" className="space-y-5">
            <SectionHeading id="levels-heading" title={t('levels.title')} description={t('levels.description')} />
            <LevelBar levels={overview.levels} />
          </section>

          <section aria-labelledby="languages-heading" className="space-y-5">
            <SectionHeading id="languages-heading" title={t('languages.title')} description={t('languages.description')} />
            <LanguageBars languages={overview.languages} total={totals.repositories} />
          </section>
        </div>
      </div>
    </div>
  );
}
