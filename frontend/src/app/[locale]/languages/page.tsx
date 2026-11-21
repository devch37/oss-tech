import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getTrends } from '@/lib/api-client';
import { buildAlternates } from '@/lib/seo';
import { languagesByPeriod, parsePeriod } from '@/lib/trend-periods';
import { ErrorCard } from '@/components/ErrorBoundary';
import { LanguageExplorer } from '@/components/LanguageExplorer';
import { PageHeader } from '@/components/PageHeader';

interface Props {
  params: { locale: string };
  searchParams: { period?: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'trends.pages' });
  return { title: t('languagesTitle'), alternates: buildAlternates('/languages', locale) };
}

export default async function LanguagesPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const [t, th, trends] = await Promise.all([
    getTranslations({ locale, namespace: 'trends' }),
    getTranslations({ locale, namespace: 'home' }),
    getTrends().catch(() => null),
  ]);

  return (
    <div className="space-y-8 pb-6">
      <PageHeader title={t('languages.title')} description={t('languages.description')} />
      {trends ? (
        <LanguageExplorer periods={languagesByPeriod(trends)} initialPeriod={parsePeriod(searchParams.period, 'month')} />
      ) : (
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      )}
    </div>
  );
}
