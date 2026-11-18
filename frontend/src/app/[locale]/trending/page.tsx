import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getTrends } from '@/lib/api-client';
import { buildAlternates } from '@/lib/seo';
import { ErrorCard } from '@/components/ErrorBoundary';
import { NewReposBoard } from '@/components/NewReposBoard';
import { PageHeader } from '@/components/PageHeader';
import { RuleNote } from '@/components/RuleNote';

interface Props {
  params: { locale: string };
  searchParams: { period?: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'trends.pages' });
  return { title: t('trendingTitle'), alternates: buildAlternates('/trending', locale) };
}

export default async function TrendingPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const [t, th, trends] = await Promise.all([
    getTranslations({ locale, namespace: 'trends' }),
    getTranslations({ locale, namespace: 'home' }),
    getTrends().catch(() => null),
  ]);

  return (
    <div className="space-y-10 pb-6">
      <PageHeader title={t('pages.trendingTitle')} description={t('hot.description')} />
      <RuleNote>{t('hot.rule')}</RuleNote>
      {trends ? (
        <NewReposBoard
          week={trends.newRepos.week}
          month={trends.newRepos.month}
          limit={20}
          initialPeriod={searchParams.period === 'month' ? 'month' : 'week'}
        />
      ) : (
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      )}
    </div>
  );
}
