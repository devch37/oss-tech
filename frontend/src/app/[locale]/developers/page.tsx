import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getTrends } from '@/lib/api-client';
import { buildAlternates } from '@/lib/seo';
import { risingByPeriod } from '@/lib/trend-periods';
import { DeveloperBoard } from '@/components/DeveloperBoard';
import { ErrorCard } from '@/components/ErrorBoundary';
import { PageHeader } from '@/components/PageHeader';
import { RuleNote } from '@/components/RuleNote';

interface Props {
  params: { locale: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'trends.pages' });
  return { title: t('developersTitle'), alternates: buildAlternates('/developers', locale) };
}

export default async function DevelopersPage({ params }: Props) {
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
      <PageHeader title={t('developers.title')} description={t('developers.description')} />
      <RuleNote>{t('developers.rule')}</RuleNote>
      {trends ? (
        <DeveloperBoard risingPeriods={risingByPeriod(trends)} followed={trends.topDevelopers} limit={100} pageSize={10} glance />
      ) : (
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      )}
    </div>
  );
}
