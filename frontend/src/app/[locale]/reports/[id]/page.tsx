import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { isLocale, routing } from '@/i18n/routing';
import { getReport, getReports } from '@/lib/api-client';
import { buildAlternates } from '@/lib/seo';
import { formatDateTime, formatMonth } from '@/lib/utils';
import type { ReportLanguage, ReportMeta } from '@/types/api';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ShareButton } from '@/components/ShareButton';

interface Props {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const id = Number(params.id);
  const report = Number.isFinite(id) ? await getReport(id).catch(() => null) : null;
  if (!report) return {};
  const td = await getTranslations({ locale, namespace: 'domains' });
  const tr = await getTranslations({ locale, namespace: 'reportDetail' });
  const domainLabel = td.has(report.domain as never) ? td(report.domain as never) : report.domain;
  return {
    title: tr('title', { domain: domainLabel, month: formatMonth(report.reportMonth, locale) }),
    alternates: buildAlternates(`/reports/${id}`, locale),
  };
}

/** reports 는 reportMonth 내림차순(최신이 앞) */
function findAdjacent(reports: ReportMeta[], currentId: number) {
  const idx = reports.findIndex((r) => r.id === currentId);
  if (idx === -1) return { older: null, newer: null };
  return {
    newer: idx > 0 ? (reports[idx - 1] ?? null) : null,
    older: idx < reports.length - 1 ? (reports[idx + 1] ?? null) : null,
  };
}

export default async function ReportDetailPage({ params }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const report = await getReport(id).catch(() => null);
  if (!report) notFound();

  const [t, td] = await Promise.all([
    getTranslations({ locale, namespace: 'reportDetail' }),
    getTranslations({ locale, namespace: 'domains' }),
  ]);
  const domainLabel = td.has(report.domain as never) ? td(report.domain as never) : report.domain;

  // 같은 언어의 이전/다음 + 같은 달의 다른 언어 버전
  const siblingLang: ReportLanguage = report.language === 'en' ? 'ko' : 'en';
  const [sameLang, otherLang] = await Promise.all([
    getReports(report.domain, report.language).catch(() => []),
    getReports(report.domain, siblingLang).catch(() => []),
  ]);
  const { older, newer } = findAdjacent(sameLang, id);
  const sibling = otherLang.find((r) => r.reportMonth === report.reportMonth) ?? null;

  const month = formatMonth(report.reportMonth, locale, 'long');

  return (
    <div className="mx-auto max-w-3xl space-y-10 pb-4">
      <header className="space-y-5">
        <Link
          href={{ pathname: '/reports', query: { domain: report.domain } }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('back')}
        </Link>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {domainLabel} · {t(`language.${report.language}`)}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
            {t('title', { domain: domainLabel, month: formatMonth(report.reportMonth, locale) })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('writtenBy', { month })} · {t('generated', { date: formatDateTime(report.generatedAt, locale) })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ShareButton />
          {sibling && (
            <Link
              href={`/reports/${sibling.id}`}
              hrefLang={sibling.language}
              className="text-sm font-medium underline underline-offset-4"
            >
              {t('readIn', { language: t(`language.${sibling.language}`) })}
            </Link>
          )}
        </div>
      </header>

      <article lang={report.language} className="border-t border-border pt-8">
        <MarkdownRenderer content={report.content} />
      </article>

      <nav aria-label={t('navLabel')} className="grid gap-3 border-t border-border pt-6 sm:grid-cols-2">
        {older ? (
          <Link href={`/reports/${older.id}`} className="group flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
            <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{t('olderReport')}</span>
              <span className="block truncate font-medium">{formatMonth(older.reportMonth, locale, 'long')}</span>
            </span>
          </Link>
        ) : (
          <p className="flex items-center rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">{t('noOlder')}</p>
        )}

        {newer ? (
          <Link href={`/reports/${newer.id}`} className="group flex items-center justify-end gap-3 rounded-lg border border-border p-4 text-right transition-colors hover:bg-accent/50 sm:col-start-2">
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{t('newerReport')}</span>
              <span className="block truncate font-medium">{formatMonth(newer.reportMonth, locale, 'long')}</span>
            </span>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ) : (
          <p className="flex items-center justify-end rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground sm:col-start-2">{t('noNewer')}</p>
        )}
      </nav>
    </div>
  );
}
