import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { isLocale, routing, type Locale } from '@/i18n/routing';
import { getDomains, getLibraries, getLibraryTrend, getReport, getReports, getRepositories } from '@/lib/api-client';
import { resolveDomain } from '@/lib/domains';
import { buildAlternates } from '@/lib/seo';
import { extractPreview, formatMonth, formatNumber, lastMonths } from '@/lib/utils';
import type { ReportLanguage } from '@/types/api';
import { DomainTabs } from '@/components/DomainTabs';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { RadarPlot } from '@/components/RadarPlot';
import { RankedLibraries, type RankedLibrary } from '@/components/RankedLibraries';
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

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8089';

async function loadHome(domain: string, locale: Locale) {
  const [thisMonth, prevMonth] = lastMonths(2) as [string, string];
  const otherLang: ReportLanguage = locale === 'en' ? 'ko' : 'en';

  const [domains, repos, libsNow, libsPrev, reportsOwn, reportsOther] = await Promise.allSettled([
    getDomains(),
    getRepositories({ domain, sort: 'score', size: 60 }),
    getLibraries({ domain, month: thisMonth, size: 100 }),
    getLibraries({ domain, month: prevMonth, size: 100 }),
    getReports(domain, locale),
    getReports(domain, otherLang),
  ]);

  // 이번 달 집계가 아직 없으면(월초) 지난달 데이터를 보여준다
  const ok = <T,>(r: PromiseSettledResult<T>) => (r.status === 'fulfilled' ? r.value : null);
  const nowLibs = ok(libsNow)?.content ?? [];
  const useCurrent = nowLibs.length > 0;
  const libraries = useCurrent ? nowLibs : (ok(libsPrev)?.content ?? []);
  const month = useCurrent ? thisMonth : prevMonth;

  // 스파크라인용 추이 — 상위 8개만 병렬 조회
  const rising = libraries
    .filter((l) => l.growthRate > 0)
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 8);
  const trendResults = await Promise.allSettled(rising.map((l) => getLibraryTrend(l.libraryName, domain)));
  const rankedLibraries: RankedLibrary[] = rising.map((library, i) => {
    const tr = trendResults[i];
    const points = tr && tr.status === 'fulfilled' ? tr.value.trend : [];
    return { library, trend: points.slice(-6).map((p) => p.usageCount) };
  });

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
    libraryCount: libraries.length,
    month,
    rankedLibraries,
    latestMeta,
    latestReport,
    reportFallback,
  };
}

export default async function HomePage({ params, searchParams }: HomeProps) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const domain = resolveDomain(searchParams.domain);
  const [t, td] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'domains' }),
  ]);
  const domainLabel = td(domain);

  const data = await loadHome(domain, locale);
  const hasPlotData = data.repositories.some((r) => r.score !== null && r.stars > 0);

  return (
    <div className="space-y-12 pb-4">
      <Suspense fallback={<div className="h-10" />}>
        <DomainTabs className="border-b border-border" />
      </Suspense>

      {/* ─── 히어로: 제목 + 핵심 수치 ─────────────────────────────────────────── */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-2xl space-y-4">
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {t('title', { domain: domainLabel })}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t('intro')}</p>
        </div>

        {!data.backendDown && (
          <dl className="flex gap-8 lg:gap-10">
            <div>
              <dd className="font-display text-4xl font-semibold tabular-nums">{formatNumber(data.repoCount, locale)}</dd>
              <dt className="mt-1 max-w-[9rem] text-sm text-muted-foreground">{t('figures.repositories')}</dt>
            </div>
            <div>
              <dd className="font-display text-4xl font-semibold tabular-nums">{formatNumber(data.libraryCount, locale)}</dd>
              <dt className="mt-1 max-w-[9rem] text-sm text-muted-foreground">{t('figures.libraries')}</dt>
            </div>
          </dl>
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
          {/* ─── 레이더 플롯 ─────────────────────────────────────────────────── */}
          <section aria-labelledby="radar-heading" className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <h2 id="radar-heading" className="font-display text-2xl font-semibold tracking-tight">
                {t('radar.title')}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{t('radar.description')}</p>
            </div>
            <RadarPlot repositories={data.repositories} />
          </section>

          {/* ─── 라이브러리 랭킹 + 최신 리포트 ───────────────────────────────── */}
          <section className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t('rising.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('rising.description', { domain: domainLabel, month: formatMonth(data.month, locale) })}
                </p>
              </div>

              {data.rankedLibraries.length > 0 ? (
                <RankedLibraries items={data.rankedLibraries} domain={domain} />
              ) : (
                <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                  {t('rising.empty')}
                </p>
              )}

              <Link
                href={{ pathname: '/libraries', query: { domain } }}
                className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
              >
                {t('rising.viewAll')}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <aside className="space-y-4 lg:border-l lg:border-border lg:pl-12">
              <h2 className="font-display text-2xl font-semibold tracking-tight">{t('report.title')}</h2>
              {data.latestMeta && data.latestReport ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {formatMonth(data.latestMeta.reportMonth, locale, 'long')} · {domainLabel}
                  </p>
                  <p className="line-clamp-6 leading-relaxed">{extractPreview(data.latestReport.content, 320)}</p>
                  {data.reportFallback && <p className="text-sm text-muted-foreground">{t('report.fallback')}</p>}
                  <Link
                    href={`/reports/${data.latestMeta.id}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    {t('report.read')}
                  </Link>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('report.empty', { domain: domainLabel })}
                </p>
              )}
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
