import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getTrends } from '@/lib/api-client';
import { buildAlternates } from '@/lib/seo';
import { ErrorCard } from '@/components/ErrorBoundary';
import { LanguageRanking } from '@/components/LanguageRanking';
import { PageHeader } from '@/components/PageHeader';
import { RuleNote } from '@/components/RuleNote';

interface Props {
  params: { locale: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'trends.pages' });
  return { title: t('languagesTitle'), alternates: buildAlternates('/languages', locale) };
}

export default async function LanguagesPage({ params }: Props) {
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
      <PageHeader title={t('languages.title')} description={t('languages.description')} />
      <RuleNote>{t('languages.rule')}</RuleNote>
      {trends && trends.languages.length > 0 ? (
        <LanguageRanking languages={trends.languages} />
      ) : trends ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-base text-muted-foreground">{t('languages.empty')}</p>
      ) : (
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      )}
    </div>
  );
}
