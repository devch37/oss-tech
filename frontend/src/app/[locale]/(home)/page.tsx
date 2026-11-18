import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import { getDomains, getLibraries, getReport, getReports, getRepositories } from '@/lib/api-client';
import { isDomainKey, resolveDomain } from '@/lib/domains';
import { languageShares, levelCounts, sumRepositories } from '@/lib/dashboard';
import { buildAlternates } from '@/lib/seo';
import { extractFirstParagraph, formatCompact, formatMonth, formatNumber, lastMonths } from '@/lib/utils';
import type { ReportLanguage } from '@/types/api';
import { DomainTabs } from '@/components/DomainTabs';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { RadarPlot } from '@/components/RadarPlot';
import { Highlights } from '@/components/Highlights';
import { LanguageBars } from '@/components/LanguageBars';
import { LevelBar } from '@/components/LevelBar';
import { TrendsHome } from '@/components/TrendsHome';
import { StatStrip } from '@/components/StatStrip';
import { LibraryBars } from '@/components/LibraryBars';
import { ProjectBars } from '@/components/ProjectBars';
import { buttonVariants } from '@/components/ui/button-variants';

interface HomeProps {
  params: { locale: string };
  searchParams: { domain?: string };
}

// 백엔드 데이터와 ?domain= 쿼리에 따라 달라지므로 요청마다 렌더링한다 (빌드 시점에 굳히지 않음)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: HomeProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  return { alternates: buildAlternates('/', locale) };
}

// 증가율 순위는 전체 라이브러리를 대상으로 계산해야 하므로 상위 N개로 자르지 않는다
const LIBRARY_FETCH_SIZE = 1000;

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8089';

async function loadHome(domain: string, locale: Locale) {
  const [thisMonth, prevMonth] = lastMonths(2) as [string, string];
  const otherLang: ReportLanguage = locale === 'en' ? 'ko' : 'en';

  const [domains, repos, libsNow, libsPrev, reportsOwn, reportsOther] = await Promise.allSettled([
    getDomains(),
    getRepositories({ domain, sort: 'score', size: 60 }),
    getLibraries({ domain, month: thisMonth, size: LIBRARY_FETCH_SIZE }),
    getLibraries({ domain, month: prevMonth, size: LIBRARY_FETCH_SIZE }),
    getReports(domain, locale),
    getReports(domain, otherLang),
  ]);

  // 이번 달 집계가 아직 없으면(월초) 지난달 데이터를 보여준다
  const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null);
  const nowPage = ok(libsNow);
  const useCurrent = (nowPage?.content.length ?? 0) > 0;
  const page = useCurrent ? nowPage : ok(libsPrev);
  const libraries = page?.content ?? [];
  const month = useCurrent ? thisMonth : prevMonth;

  // 지난달 데이터가 하나도 없으면(첫 수집) 모든 증가율이 +100%라 의미가 없다 → 증가율 보기를 잠근다
  const hasBaseline = libraries.some((l) => l.prevMonthCount > 0);

  // 최신 리포트: 현재 언어 우선, 없으면 다른 언어로 폴백
  const own = ok(reportsOwn) ?? [];
  const other = ok(reportsOther) ?? [];
  const latestMeta = own[0] ?? other[0] ?? null;
  const reportFallback = !own[0] && !!other[0];
  const latestReport = latestMeta ? await getReport(latestMeta.id).catch(() => null) : null;

  return {
    backendDown: [domains, repos, libsNow].every((r) => r.status === 'rejected'),
    repositories: ok(repos)?.content ?? [],
    repoCount: ok(domains)?.find((d) => d.domain === domain)?.repositoryCount ?? ok(repos)?.content.length ?? 0,
    libraries,
    libraryCount: page?.totalElements ?? libraries.length,
    hasBaseline,
    month,
    latestMeta,
    latestReport,
    reportFallback,
  };
}

export default async function HomePage({ params, searchParams }: HomeProps) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  // ?domain= 이 없거나 알 수 없는 값이면 전체 대시보드, 분야 이름이면 그 분야 상세
  if (!isDomainKey(searchParams.domain)) {
    return (
      <div className="space-y-12">
        <Suspense fallback={<div className="h-10" />}>
          <DomainTabs withOverview className="border-b border-border" />
        </Suspense>
        <TrendsHome locale={locale} />
      </div>
    );
  }

  const domain = resolveDomain(searchParams.domain);
  const [t, td, to] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'domains' }),
    getTranslations({ locale, namespace: 'overview' }),
  ]);
  const domainLabel = td(domain);

  const data = await loadHome(domain, locale);
  const hasPlotData = data.repositories.some((r) => r.score !== null && r.stars > 0);
  const totals = sumRepositories(data.repositories);

  return (
    <div className="space-y-14 pb-4">
      <Suspense fallback={<div className="h-10" />}>
        <DomainTabs withOverview className="border-b border-border" />
      </Suspense>

      {/* ─── 제목: 이 페이지가 무엇인지 한 줄 ─────────────────────────────────── */}
      <section className="max-w-3xl space-y-3">
        <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
          {t('title', { domain: domainLabel })}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t('intro')}</p>
        {!data.backendDown && hasPlotData && (
          <p className="text-sm text-muted-foreground">
            {t('scope', {
              repos: data.repoCount,
              libs: data.libraryCount,
              month: formatMonth(data.month, locale),
            })}
          </p>
        )}
      </section>

      {data.backendDown ? (
        <ErrorCard message={`${t('error.title')}. ${t('error.description')}`} />
      ) : !hasPlotData ? (
        <EmptyState
          title={t('empty.title', { domain: domainLabel })}
          description={t('empty.description')}
          code={`curl -X POST "${API_ORIGIN}/api/v1/crawl/trigger?domain=${domain}"`}
          hint={t('empty.hint')}
        />
      ) : (
        <>
          {/* ─── 이 분야의 핵심 수치 ────────────────────────────────────────── */}
          <StatStrip
            items={[
              { label: t('stats.projects'), value: formatNumber(data.repoCount, locale) },
              { label: t('stats.stars'), value: formatCompact(totals.stars, locale) },
              { label: t('stats.commits'), value: formatCompact(totals.commits30d, locale) },
              { label: t('stats.libraries'), value: formatNumber(data.libraryCount, locale) },
            ]}
          />

          {/* ─── 한눈에 보기: 뭐가 뜨고 있는지 세 문장으로 ────────────────────── */}
          <Highlights
            locale={locale}
            domain={domain}
            repositories={data.repositories}
            libraries={data.libraries}
            hasBaseline={data.hasBaseline}
          />

          {/* ─── 질문 1: 어떤 프로젝트가 활발한가 ───────────────────────────── */}
          <section aria-labelledby="projects-heading" className="space-y-5">
            <div className="max-w-2xl space-y-1.5">
              <h2 id="projects-heading" className="font-display text-2xl font-semibold tracking-tight">
                {t('projects.title')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('projects.description')}</p>
            </div>
            <ProjectBars repositories={data.repositories} />
            <Link
              href={{ pathname: '/repositories', query: { domain } }}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              {t('projects.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          {/* ─── 질문 2: 어떤 라이브러리를 쓰는가 ───────────────────────────── */}
          <section aria-labelledby="libs-heading" className="space-y-5">
            <div className="max-w-2xl space-y-1.5">
              <h2 id="libs-heading" className="font-display text-2xl font-semibold tracking-tight">
                {t('libs.title')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('libs.description')}</p>
            </div>
            {data.libraries.length > 0 ? (
              <LibraryBars libraries={data.libraries} domain={domain} hasBaseline={data.hasBaseline} />
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                {t('libs.noGrowth')}
              </p>
            )}
            <Link
              href={{ pathname: '/libraries', query: { domain } }}
              className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              {t('libs.viewAll')}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          {/* ─── 이 분야 프로젝트의 활동 분포와 언어 ─────────────────────────── */}
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
            <section aria-labelledby="levels-heading" className="space-y-5">
              <div className="max-w-2xl space-y-1.5">
                <h2 id="levels-heading" className="font-display text-2xl font-semibold tracking-tight">
                  {to('levels.title')}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{to('levels.description')}</p>
              </div>
              <LevelBar levels={levelCounts(data.repositories)} />
            </section>

            <section aria-labelledby="languages-heading" className="space-y-5">
              <div className="max-w-2xl space-y-1.5">
                <h2 id="languages-heading" className="font-display text-2xl font-semibold tracking-tight">
                  {to('languages.title')}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{to('languages.description')}</p>
              </div>
              <LanguageBars languages={languageShares(data.repositories)} total={totals.repositories} />
            </section>
          </div>

          {/* ─── 이번 달 리포트 ─────────────────────────────────────────────── */}
          <section aria-labelledby="report-heading" className="max-w-3xl space-y-3 border-t border-border pt-10">
            <h2 id="report-heading" className="font-display text-2xl font-semibold tracking-tight">
              {t('report.title')}
            </h2>
            {data.latestMeta && data.latestReport ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {formatMonth(data.latestMeta.reportMonth, locale, 'long')}, {domainLabel}
                </p>
                <p className="leading-relaxed">{extractFirstParagraph(data.latestReport.content, 260)}</p>
                {data.reportFallback && <p className="text-sm text-muted-foreground">{t('report.fallback')}</p>}
                <Link
                  href={`/reports/${data.latestMeta.id}`}
                  className={buttonVariants({ variant: 'outline', size: 'sm' })}
                >
                  {t('report.read')}
                </Link>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{t('report.empty', { domain: domainLabel })}</p>
            )}
          </section>

          {/* ─── 전체 지도: 별·활동량 분포 (자세히 보고 싶은 사람용) ─────────── */}
          <section aria-labelledby="radar-heading" className="space-y-4">
            <div className="max-w-2xl space-y-1.5">
              <h2 id="radar-heading" className="font-display text-2xl font-semibold tracking-tight">
                {t('radar.title')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('radar.description')}</p>
            </div>
            <RadarPlot repositories={data.repositories} />
          </section>
        </>
      )}
    </div>
  );
}
