import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getRepositories } from '@/lib/api-client';
import { resolveDomain } from '@/lib/domains';
import { buildAlternates } from '@/lib/seo';
import { DomainTabs } from '@/components/DomainTabs';
import { PageHeader } from '@/components/PageHeader';
import { RepositoryListClient } from './RepositoryListClient';

interface Props {
  params: { locale: string };
  searchParams: { domain?: string; sort?: string };
}

// 백엔드 데이터와 ?domain= 쿼리에 따라 달라지므로 요청마다 렌더링한다 (빌드 시점에 굳히지 않음)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'repositories' });
  return { title: t('title'), alternates: buildAlternates('/repositories', locale) };
}

export default async function RepositoriesPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const [t, td] = await Promise.all([
    getTranslations({ locale, namespace: 'repositories' }),
    getTranslations({ locale, namespace: 'domains' }),
  ]);

  const domain = resolveDomain(searchParams.domain);
  const sort = searchParams.sort === 'stars' ? 'stars' : 'score';
  const data = await getRepositories({ domain, sort, size: 50 }).catch(() => null);

  return (
    <div className="space-y-8 pb-4">
      <Suspense fallback={<div className="h-10" />}>
        <DomainTabs className="border-b border-border" />
      </Suspense>

      <PageHeader title={t('title')} description={t('description', { domain: td(domain) })} />

      <RepositoryListClient
        repositories={data?.content ?? []}
        currentSort={sort}
        domain={domain}
        domainLabel={td(domain)}
        fetchFailed={data === null}
      />
    </div>
  );
}
