import { BarChart3, ChevronsDown, Code2, Flame, LayoutGrid, RefreshCw, ShieldCheck, Trophy, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getOverview, getTrends } from '@/lib/api-client';
import { formatCompact, formatRelative } from '@/lib/utils';
import { starsPerDay } from '@/lib/trend';
import { languagesByPeriod, risingByPeriod } from '@/lib/trend-periods';
import { DeveloperBoard } from '@/components/DeveloperBoard';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { Explainer } from '@/components/Explainer';
import { QuickFacts, type QuickFact } from '@/components/QuickFacts';
import { FieldButtons } from '@/components/FieldButtons';
import { HeroBoard } from '@/components/HeroBoard';
import { HowWeDecide } from '@/components/HowWeDecide';
import { LanguageGlance } from '@/components/LanguageGlance';
import { LanguageRanking } from '@/components/LanguageRanking';
import { LovedRepos } from '@/components/LovedRepos';
import { NewReposBoard } from '@/components/NewReposBoard';
import { TrendTicker } from '@/components/TrendTicker';
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
    <Link href={href} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
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

  const prompt = t('hero.prompt');
  const monthLangs = trends ? languagesByPeriod(trends).month : [];
  const updatedAgo = trends?.generatedAt ? formatRelative(parseUtc(trends.generatedAt), locale) : null;

  // 왼쪽 "핵심 숫자 4개" — 모두 아래 섹션과 같은 데이터에서 계산한다
  const facts: QuickFact[] = [];
  const riser = (trends?.newRepos.week ?? [])
    .map((r) => ({ r, perDay: starsPerDay(r.stars, r.createdAt) ?? 0 }))
    .sort((a, b) => b.perDay - a.perDay)[0];
  if (riser && riser.perDay > 0) {
    facts.push({ key: 'riser', label: t('facts.riser'), value: `▲ +${formatCompact(riser.perDay, locale)}/${t('facts.day')}`, sub: riser.r.name, href: '#hot-heading', tone: 'trend' });
  }
  const topLang = monthLangs[0];
  if (topLang) {
    const totalNew = monthLangs.reduce((sum, l) => sum + l.newRepoCount, 0);
    facts.push({ key: 'lang', label: t('facts.language'), value: topLang.language, sub: t('facts.languageShare', { percent: `${totalNew > 0 ? Math.round((topLang.newRepoCount / totalNew) * 100) : 0}%` }), href: '#languages-heading', tone: 'sea' });
  }
  const topDev = trends?.topDevelopers[0];
  if (topDev) {
    facts.push({ key: 'dev', label: t('facts.developer'), value: formatCompact(topDev.followers, locale), sub: topDev.name ?? topDev.login, href: '#developers-heading', tone: 'star' });
  }
  if (overview && overview.totals.repositories > 0) {
    facts.push({ key: 'projects', label: t('facts.projects'), value: formatCompact(overview.totals.stars, locale), sub: t('facts.projectsSub', { count: overview.totals.repositories }), href: '/repositories', tone: 'star' });
  }

  // 섹션으로 바로 가는 칩 — 아래에 이만큼의 데이터가 더 있다는 신호이기도 하다
  const jumps = trends
    ? [
        { key: 'projects', href: '#hot-heading', count: trends.newRepos.week.length },
        { key: 'languages', href: '#languages-heading', count: languagesByPeriod(trends).all.length || monthLangs.length },
        { key: 'people', href: '#developers-heading', count: trends.topDevelopers.length },
        { key: 'fields', href: '#fields-heading', count: overview?.domains.length ?? 0 },
        { key: 'search', href: '/repositories', count: overview?.totals.repositories ?? 0 },
      ].filter((j) => j.count > 0)
    : [];

  const hero = (
    <section className="grid items-start gap-x-12 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]">
      {/* A: 제목과 신뢰 신호 */}
      <div className="space-y-5 lg:col-start-1 lg:row-start-1">
        {/* 터미널 한 줄: 초록 점은 "방금 갱신됨", 한 글자씩 타이핑되는 명령어 */}
        <p className="flex items-center gap-2.5 font-mono text-[13px] text-muted-foreground">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-trend" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-trend" />
          </span>
          <span>
            <span className="text-trend-ink">$</span>{' '}
            <span className="typewriter text-foreground" style={{ '--n': prompt.length } as React.CSSProperties}>
              {prompt}
            </span>
            <span aria-hidden="true" className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-caret bg-trend" />
          </span>
        </p>
        <h1 className="font-display text-3xl font-semibold leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.75rem]">
          {t('hero.title')}
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{t('hero.subtitle')}</p>

        {/* 믿고 다시 올 수 있게: 언제 갱신됐는지, 어디서 온 데이터인지, 기준은 어디서 보는지 */}
        {updatedAgo && (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-muted-foreground">
            <li className="inline-flex items-center gap-1.5 text-trend-ink">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              {t('hero.updatedAgo', { relative: updatedAgo })}
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('hero.trust.source')}
            </li>
            {overview && overview.totals.repositories > 0 && (
              <li className="inline-flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                {t('hero.trust.tracked', { count: overview.totals.repositories })}
              </li>
            )}
            <li>
              <a href="#how" className="underline underline-offset-4 hover:text-foreground">
                {t('hero.trust.method')}
              </a>
            </li>
          </ul>
        )}

      </div>

      {/* B: 스크롤 전에 보이는 진짜 데이터 (모바일에서는 제목 바로 아래) */}
      {trends?.generatedAt && (
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <HeroBoard week={trends.newRepos.week} month={trends.newRepos.month} allTime={trends.newRepos.allTime ?? []} />
        </div>
      )}

      {/* C: 핵심 숫자와 섹션 바로가기 */}
      <div className="space-y-5 lg:col-start-1 lg:row-start-2">
        {facts.length >= 3 && <QuickFacts facts={facts} columns={2} />}

        {jumps.length > 0 && (
          <nav aria-label={t('hero.jumpLabel')} className="flex flex-wrap gap-2">
            {jumps.map((j) =>
              j.href.startsWith('#') ? (
                <a key={j.key} href={j.href} className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-xs font-medium transition-colors hover:border-foreground/30 hover:bg-card">
                  {t(`jump.${j.key}`)}
                  <span className="font-mono tabular-nums text-muted-foreground">{j.count}</span>
                </a>
              ) : (
                <Link key={j.key} href={j.href} className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-card/60 px-3 text-xs font-medium transition-colors hover:border-foreground/30 hover:bg-card">
                  {t(`jump.${j.key}`)}
                  <span className="font-mono tabular-nums text-muted-foreground">{j.count}</span>
                </Link>
              ),
            )}
          </nav>
        )}
      </div>
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
    <div className="space-y-14 pb-6">
      <div className="space-y-8">
        {hero}
        <TrendTicker locale={locale} repos={trends.newRepos.week} />
        {/* 아래에 더 있다는 신호 */}
        <a href="#hot-heading" className="mx-auto flex w-fit flex-col items-center gap-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          {t('hero.scroll')}
          <ChevronsDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
        </a>
        <Explainer />
      </div>

      <section aria-labelledby="hot-heading" className="space-y-5">
        <SectionHeader id="hot-heading" icon={Flame} title={t('hot.title')} description={t('hot.description')} />
        <RuleNote>{t('hot.rule')}</RuleNote>
        <NewReposBoard week={trends.newRepos.week} month={trends.newRepos.month} allTime={trends.newRepos.allTime} limit={10} />
        <SeeAll href="/trending">{t('hot.viewAll')}</SeeAll>
      </section>

      {trends.popularNow.length > 0 && (
        <section aria-labelledby="loved-heading" className="space-y-5">
          <SectionHeader id="loved-heading" icon={Trophy} title={t('loved.title')} description={t('loved.description')} />
          <RuleNote>{t('loved.rule')}</RuleNote>
          <LovedRepos repositories={trends.popularNow} limit={10} />
          <SeeAll href="/popular">{t('loved.viewAll')}</SeeAll>
        </section>
      )}

      <section aria-labelledby="languages-heading" className="space-y-5">
        <SectionHeader id="languages-heading" icon={Code2} tone="sea" title={t('languages.title')} description={t('languages.description')} />
        <RuleNote>{t('languages.rule')}</RuleNote>
        {languagesByPeriod(trends).month.length > 0 ? (
          <>
            <LanguageGlance languages={languagesByPeriod(trends).month} showStats={false} />
            <LanguageRanking languages={languagesByPeriod(trends).month} limit={8} />
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-base text-muted-foreground">{t('languages.empty')}</p>
        )}
        <SeeAll href="/languages">{t('languages.viewAll')}</SeeAll>
      </section>

      <section aria-labelledby="developers-heading" className="space-y-5">
        <SectionHeader id="developers-heading" icon={Users} tone="sea" title={t('developers.title')} description={t('developers.description')} />
        <RuleNote>{t('developers.rule')}</RuleNote>
        <DeveloperBoard risingPeriods={risingByPeriod(trends)} followed={trends.topDevelopers} limit={6} />
        <SeeAll href="/developers">{t('developers.viewAll')}</SeeAll>
      </section>

      {overview && overview.domains.length > 0 && (
        <section aria-labelledby="fields-heading" className="space-y-5">
          <SectionHeader id="fields-heading" icon={LayoutGrid} title={t('fields.title')} description={t('fields.description')} />
          <FieldButtons domains={overview.domains} />
        </section>
      )}

      <HowWeDecide />
    </div>
  );
}
