import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getTrends } from '@/lib/api-client';
import { buildAlternates } from '@/lib/seo';
import { ErrorCard } from '@/components/ErrorBoundary';
import { LovedRepos } from '@/components/LovedRepos';
import { PageHeader } from '@/components/PageHeader';
import { RuleNote } from '@/components/RuleNote';

interface Props {
  params: { locale: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'trends.loved' });
  return { title: t('title'), alternates: buildAlternates('/popular', locale) };
}

/** 스타가 많고 최근에도 활발한 프로젝트 전체 목록 (10개씩 번호로 넘겨 보기) */
export default async function PopularPage({ params }: Props) {
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
      <PageHeader title={t('loved.title')} description={t('loved.description')} />
      <RuleNote>{t('loved.rule')}</RuleNote>
      {trends ? (
        trends.popularNow.length > 0 ? (
          <LovedRepos repositories={trends.popularNow} pageSize={10} />
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">{t('loved.empty')}</p>
        )
      ) : (
        <ErrorCard message={`${th('error.title')}. ${th('error.description')}`} />
      )}
    </div>
  );
}
