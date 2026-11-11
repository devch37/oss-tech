import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { isLocale, routing } from '@/i18n/routing';
import { getReport, getReports } from '@/lib/api-client';
import { resolveDomain } from '@/lib/domains';
import { buildAlternates } from '@/lib/seo';
import { extractPreview, formatDate, formatMonth } from '@/lib/utils';
import type { ReportLanguage, ReportMeta } from '@/types/api';
import { DomainTabs } from '@/components/DomainTabs';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/PageHeader';

interface Props {
  params: { locale: string };
  searchParams: { domain?: string };
}

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8089';

// 백엔드 데이터와 ?domain= 쿼리에 따라 달라지므로 요청마다 렌더링한다 (빌드 시점에 굳히지 않음)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'reports' });
  return { title: t('title'), alternates: buildAlternates('/reports', locale) };
}

export default async function ReportsPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const [t, td] = await Promise.all([
    getTranslations({ locale, namespace: 'reports' }),
    getTranslations({ locale, namespace: 'domains' }),
  ]);

  const domain = resolveDomain(searchParams.domain);
  const domainLabel = td(domain);
  const otherLang: ReportLanguage = locale === 'en' ? 'ko' : 'en';

  // 현재 언어 우선, 비어 있으면 다른 언어로 폴백
  const own = await getReports(domain, locale).catch(() => null);
  const fallback = own !== null && own.length === 0 ? await getReports(domain, otherLang).catch(() => []) : [];
  const usingFallback = fallback.length > 0;
  const metas: ReportMeta[] = own === null ? [] : usingFallback ? fallback : own;

  // 목록 미리보기용 본문 (최신 8개)
  const shown = metas.slice(0, 8);
  const contents = await Promise.allSettled(shown.map((m) => getReport(m.id)));

  return (
    <div className="space-y-8 pb-4">
      <Suspense fallback={<div className="h-10" />}>
        <DomainTabs className="border-b border-border" />
      </Suspense>

      <PageHeader title={t('title')} description={t('description')} />

      {own === null ? (
        <ErrorCard message={t('error')} />
      ) : metas.length === 0 ? (
        <EmptyState
          title={t('empty.title', { domain: domainLabel })}
          description={t('empty.description')}
          code={`curl -X POST "${API_ORIGIN}/api/v1/reports/generate?domain=${domain}&yearMonth=${new Date().toISOString().slice(0, 7)}&lang=${locale}"`}
        />
      ) : (
        <div className="space-y-4">
          {usingFallback && <p className="text-sm text-muted-foreground">{t('fallback', { domain: domainLabel })}</p>}

          <ol className="divide-y divide-border border-y border-border">
            {shown.map((meta, i) => {
              const result = contents[i];
              const preview = result?.status === 'fulfilled' ? extractPreview(result.value.content, 220) : null;
              return (
                <li key={meta.id}>
                  <Link
                    href={`/reports/${meta.id}`}
                    className="group grid gap-x-8 gap-y-2 py-6 sm:grid-cols-[11rem_minmax(0,1fr)]"
                  >
                    <div>
                      <p className="font-display text-2xl font-semibold tracking-tight">
                        {formatMonth(meta.reportMonth, locale, 'long')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('generatedOn', { date: formatDate(meta.generatedAt, locale) })}
                      </p>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <h2 className="text-lg font-medium group-hover:underline group-hover:underline-offset-4">
                        {t('cardTitle', { domain: domainLabel, month: formatMonth(meta.reportMonth, locale) })}
                      </h2>
                      <p lang={meta.language} className="line-clamp-3 leading-relaxed text-muted-foreground">
                        {preview ?? t('previewUnavailable')}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
