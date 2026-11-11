import type { Metadata } from 'next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { isLocale, routing } from '@/i18n/routing';
import { getLibraries, getLibraryTrend, getRepositories } from '@/lib/api-client';
import { resolveDomain } from '@/lib/domains';
import { buildAlternates } from '@/lib/seo';
import { currentYearMonth, formatMonth, formatNumber } from '@/lib/utils';
import { ActiveLevelBadge } from '@/components/ActiveLevelBadge';
import { ErrorCard } from '@/components/ErrorBoundary';
import { GrowthBadge } from '@/components/GrowthBadge';
import { TrendLineChart } from '@/components/charts/TrendLineChart';

interface Props {
  params: { locale: string; name: string };
  searchParams: { domain?: string };
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const name = safeDecode(params.name);
  return { title: name, alternates: buildAlternates(`/libraries/${encodeURIComponent(name)}`, locale) };
}

export default async function LibraryDetailPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const [t, td, tc] = await Promise.all([
    getTranslations({ locale, namespace: 'libraryDetail' }),
    getTranslations({ locale, namespace: 'domains' }),
    getTranslations({ locale, namespace: 'common' }),
  ]);

  const libraryName = safeDecode(params.name);
  const domain = resolveDomain(searchParams.domain);
  const domainLabel = td(domain);
  const month = currentYearMonth();

  const [trendResult, librariesResult, repositoriesResult] = await Promise.allSettled([
    getLibraryTrend(libraryName, domain),
    getLibraries({ domain, month, size: 100 }),
    getRepositories({ domain, sort: 'score', size: 8 }),
  ]);

  const trend = trendResult.status === 'fulfilled' ? trendResult.value.trend : [];
  const allLibraries = librariesResult.status === 'fulfilled' ? librariesResult.value.content : [];
  const repositories = repositoriesResult.status === 'fulfilled' ? repositoriesResult.value.content : [];

  // 이번 달 집계가 없으면 가장 최근 추이 지점을 기준으로 보여준다
  const lastPoint = trend[trend.length - 1];
  const current = allLibraries.find((l) => l.libraryName === libraryName);
  const usageNow = current?.usageCount ?? lastPoint?.usageCount ?? null;
  const usagePrev = current?.prevMonthCount ?? (trend.length > 1 ? (trend[trend.length - 2]?.usageCount ?? null) : null);
  const growthRate = current?.growthRate ?? null;
  const shownMonth = current ? month : (lastPoint?.month ?? month);

  const coLibraries = allLibraries
    .filter((l) => l.libraryName !== libraryName)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 8);

  return (
    <div className="space-y-12 pb-4">
      <header className="space-y-5">
        <Link
          href={{ pathname: '/libraries', query: { domain } }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('back')}
        </Link>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{domainLabel}</p>
          <h1 className="break-all font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            {libraryName}
          </h1>
          <p className="text-muted-foreground">
            {usageNow !== null
              ? t('usedBy', { count: usageNow, month: formatMonth(shownMonth, locale) })
              : t('noData')}
          </p>
        </div>

        {usageNow !== null && (
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            <div>
              <dt className="text-sm text-muted-foreground">{t('thisMonth')}</dt>
              <dd className="font-display text-3xl font-semibold tabular-nums">{formatNumber(usageNow, locale)}</dd>
            </div>
            {usagePrev !== null && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('lastMonth')}</dt>
                <dd className="font-display text-3xl font-semibold tabular-nums text-muted-foreground">
                  {formatNumber(usagePrev, locale)}
                </dd>
              </div>
            )}
            {growthRate !== null && (
              <div>
                <dt className="text-sm text-muted-foreground">{t('change')}</dt>
                <dd>
                  <GrowthBadge rate={growthRate} className="font-display text-3xl font-semibold" />
                </dd>
              </div>
            )}
          </dl>
        )}
      </header>

      <section aria-labelledby="trend-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="trend-heading" className="font-display text-2xl font-semibold tracking-tight">{t('trendTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('trendDescription', { domain: domainLabel })}</p>
        </div>
        {trend.length > 0 ? (
          <TrendLineChart data={trend} className="h-72 w-full" />
        ) : (
          <ErrorCard message={t('trendUnavailable')} />
        )}
      </section>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="repos-heading" className="space-y-4">
          <h2 id="repos-heading" className="font-display text-2xl font-semibold tracking-tight">
            {t('topRepos', { domain: domainLabel })}
          </h2>
          {repositories.length > 0 ? (
            <ul className="divide-y divide-border border-y border-border">
              {repositories.map((repo) => (
                <li key={repo.id} className="flex items-center gap-3 py-3">
                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${tc('viewOnGithub', { name: repo.fullName })} (${tc('opensInNewTab')})`}
                    className="inline-flex min-w-0 flex-1 items-center gap-1.5 font-medium hover:underline hover:underline-offset-4"
                  >
                    <span className="truncate">{repo.fullName}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-50" aria-hidden="true" />
                  </a>
                  <span className="text-sm tabular-nums text-muted-foreground">★ {formatNumber(repo.stars, locale)}</span>
                  <ActiveLevelBadge score={repo.score} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t('reposEmpty')}</p>
          )}
        </section>

        <section aria-labelledby="co-heading" className="space-y-4">
          <h2 id="co-heading" className="font-display text-2xl font-semibold tracking-tight">
            {t('alsoPopular', { domain: domainLabel })}
          </h2>
          {coLibraries.length > 0 ? (
            <ul className="divide-y divide-border border-y border-border">
              {coLibraries.map((lib) => (
                <li key={lib.libraryName}>
                  <Link
                    href={{ pathname: `/libraries/${encodeURIComponent(lib.libraryName)}`, query: { domain } }}
                    className="flex items-center gap-3 py-3 hover:bg-accent/50"
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">{lib.libraryName}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">{tc('reposCount', { count: lib.usageCount })}</span>
                    <GrowthBadge rate={lib.growthRate} className="w-20 justify-end text-sm" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{t('librariesEmpty')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
