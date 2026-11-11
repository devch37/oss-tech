import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getLibraries } from '@/lib/api-client';
import { resolveDomain } from '@/lib/domains';
import { buildAlternates } from '@/lib/seo';
import { formatMonth, lastMonths } from '@/lib/utils';
import { DomainTabs } from '@/components/DomainTabs';
import { PageHeader } from '@/components/PageHeader';
import { LibraryListClient } from './LibraryListClient';

interface Props {
  params: { locale: string };
  searchParams: { domain?: string; month?: string };
}

// 백엔드 데이터와 ?domain= 쿼리에 따라 달라지므로 요청마다 렌더링한다 (빌드 시점에 굳히지 않음)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'libraries' });
  return { title: t('title'), alternates: buildAlternates('/libraries', locale) };
}

export default async function LibrariesPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const [t, td] = await Promise.all([
    getTranslations({ locale, namespace: 'libraries' }),
    getTranslations({ locale, namespace: 'domains' }),
  ]);

  const domain = resolveDomain(searchParams.domain);
  const monthValues = lastMonths(6);
  const month = monthValues.includes(searchParams.month ?? '') ? (searchParams.month as string) : (monthValues[0] as string);
  const months = monthValues.map((value) => ({ value, label: formatMonth(value, locale) }));

  // 검색·정렬·페이지네이션은 클라이언트에서 하므로 한 번에 넉넉히 가져온다
  const data = await getLibraries({ domain, month, size: 100 }).catch(() => null);

  return (
    <div className="space-y-8 pb-4">
      <Suspense fallback={<div className="h-10" />}>
        <DomainTabs className="border-b border-border" />
      </Suspense>

      <PageHeader title={t('title')} description={t('description', { domain: td(domain) })} />

      <LibraryListClient
        libraries={data?.content ?? []}
        months={months}
        currentMonth={month}
        currentMonthLabel={formatMonth(month, locale)}
        domain={domain}
        fetchFailed={data === null}
      />
    </div>
  );
}
