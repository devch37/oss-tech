import { Code2, Flame, LayoutGrid, Trophy, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getOverview, getTrends } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { DeveloperBoard } from '@/components/DeveloperBoard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { Explainer } from '@/components/Explainer';
import { FieldButtons } from '@/components/FieldButtons';
import { HowWeDecide } from '@/components/HowWeDecide';
import { LanguageRanking } from '@/components/LanguageRanking';
import { LovedRepos } from '@/components/LovedRepos';
import { NewReposBoard } from '@/components/NewReposBoard';
import { RuleNote } from '@/components/RuleNote';
import { SectionHeader } from '@/components/SectionHeader';
import { buttonVariants } from '@/components/ui/button-variants';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8089';

/** 백엔드가 시간대 없이 UTC 로 내려 주는 시각을 안전하게 읽는다 */
function parseUtc(iso: string): string {
  return `${iso.slice(0, 19)}Z`;
}

function SeeAll({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
      {children}
    </Link>
  );
}

/**
 * 첫 화면 — "지금 GitHub 에서 뭐가 뜨나"에 위에서 아래로 답한다.
 * 새 프로젝트 → 여전히 사랑받는 프로젝트 → 언어 → 사람·팀 → 분야별 둘러보기.
 * 섹션 제목은 모두 질문이나 쉬운 말이고, 낱말 풀이와 순위 기준은 눌러서 펼칠 수 있게 둔다.
 */
export async function TrendsHome({ locale }: { locale: string }) {
  const [t, th, trends, overview] = await Promise.all([
    getTranslations({ locale, namespace: 'trends' }),
    getTranslations({ locale, namespace: 'home' }),
    getTrends().catch(() => null),
    getOverview().catch(() => null),
  ]);

  const hero = (
    <section className="max-w-3xl space-y-4">
      <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
        {t('hero.title')}
      </h1>
      <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">{t('hero.subtitle')}</p>
      {trends?.generatedAt && (
        <p className="text-sm text-muted-foreground">{t('hero.updated', { date: formatDate(parseUtc(trends.generatedAt), locale) })}</p>
      )}
    </section>
  );

  if (!trends) {
    return (
      <div className="space-y-10">
        {hero}
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      </div>
    );
  }

  if (!trends.generatedAt) {
    return (
      <div className="space-y-10">
        {hero}
        <EmptyState
          title={t('pending.title')}
          description={t('pending.description')}
          code={`curl -X POST "${API_ORIGIN}/api/v1/trends/refresh"`}
          hint={t('pending.hint')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-6">
      <div className="space-y-8">
        {hero}
        <Explainer />
      </div>

      <section aria-labelledby="hot-heading" className="space-y-6">
        <SectionHeader id="hot-heading" icon={Flame} title={t('hot.title')} description={t('hot.description')} />
        <RuleNote>{t('hot.rule')}</RuleNote>
        <NewReposBoard week={trends.newRepos.week} month={trends.newRepos.month} limit={10} />
        <SeeAll href="/trending">{t('hot.viewAll')}</SeeAll>
      </section>

      {trends.popularNow.length > 0 && (
        <section aria-labelledby="loved-heading" className="space-y-6">
          <SectionHeader id="loved-heading" icon={Trophy} title={t('loved.title')} description={t('loved.description')} />
          <RuleNote>{t('loved.rule')}</RuleNote>
          <LovedRepos repositories={trends.popularNow} limit={10} />
          <SeeAll href="/repositories">{t('loved.viewAll')}</SeeAll>
        </section>
      )}

      <section aria-labelledby="languages-heading" className="space-y-6">
        <SectionHeader id="languages-heading" icon={Code2} tone="sea" title={t('languages.title')} description={t('languages.description')} />
        <RuleNote>{t('languages.rule')}</RuleNote>
        {trends.languages.length > 0 ? (
          <LanguageRanking languages={trends.languages} limit={8} />
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-base text-muted-foreground">{t('languages.empty')}</p>
        )}
        <SeeAll href="/languages">{t('languages.viewAll')}</SeeAll>
      </section>

      <section aria-labelledby="developers-heading" className="space-y-6">
        <SectionHeader id="developers-heading" icon={Users} tone="sea" title={t('developers.title')} description={t('developers.description')} />
        <RuleNote>{t('developers.rule')}</RuleNote>
        <DeveloperBoard rising={trends.risingDevelopers} followed={trends.topDevelopers} limit={6} />
        <SeeAll href="/developers">{t('developers.viewAll')}</SeeAll>
      </section>

      {overview && overview.domains.length > 0 && (
        <section aria-labelledby="fields-heading" className="space-y-6">
          <SectionHeader id="fields-heading" icon={LayoutGrid} title={t('fields.title')} description={t('fields.description')} />
          <FieldButtons domains={overview.domains} />
        </section>
      )}

      <HowWeDecide />
    </div>
  );
}
