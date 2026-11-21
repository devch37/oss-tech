import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale, routing } from '@/i18n/routing';
import { getRepositories } from '@/lib/api-client';
import { DOMAINS, isDomainKey } from '@/lib/domains';
import { buildAlternates } from '@/lib/seo';
import type { Repository } from '@/types/api';
import { ErrorCard } from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { HowListWasMade } from '@/components/HowListWasMade';
import { ProjectExplorer } from '@/components/ProjectExplorer';
import { DEFAULT_FILTERS, type Activity, type Filters, type ProjectItem, type Sort } from '@/lib/project-filters';

interface Props {
  params: { locale: string };
  searchParams: { q?: string; field?: string; lang?: string; activity?: string; sort?: string; domain?: string };
}

// 백엔드 데이터에 따라 달라지므로 요청마다 렌더링한다 (빌드 시점에 굳히지 않음)
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'repositories' });
  return { title: t('title'), alternates: buildAlternates('/repositories', locale) };
}

/** 주소의 검색 조건을 안전한 값으로 바꾼다 (예전 ?domain= 링크도 분야 필터로 이어 준다) */
function parseFilters(sp: Props['searchParams']): Filters {
  const field = sp.field ?? sp.domain;
  return {
    q: (sp.q ?? '').slice(0, 100),
    field: isDomainKey(field) ? field : 'all',
    lang: sp.lang?.slice(0, 40) || 'all',
    activity: (['S', 'A', 'B', 'C'] as const).includes(sp.activity as 'S') ? (sp.activity as Activity) : 'all',
    sort: (['stars', 'activity', 'name'] as const).includes(sp.sort as 'stars') ? (sp.sort as Sort) : DEFAULT_FILTERS.sort,
  };
}

/** 여섯 분야의 목록을 합치고, 여러 분야에 걸친 같은 프로젝트는 한 줄로 만든다 */
function mergeByProject(lists: (Repository[] | null)[]): ProjectItem[] {
  const merged = new Map<string, ProjectItem>();
  lists.forEach((list, i) => {
    for (const repo of list ?? []) {
      const existing = merged.get(repo.fullName);
      if (existing) {
        existing.fields.push(DOMAINS[i]!);
      } else {
        merged.set(repo.fullName, { ...repo, fields: [DOMAINS[i]!] });
      }
    }
  });
  return [...merged.values()];
}

export default async function RepositoriesPage({ params, searchParams }: Props) {
  if (!isLocale(params.locale)) return null;
  const locale = params.locale;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'repositories' });

  const results = await Promise.allSettled(DOMAINS.map((domain) => getRepositories({ domain, sort: 'score', size: 100 })));
  const lists = results.map((r) => (r.status === 'fulfilled' ? r.value.content : null));
  const items = mergeByProject(lists);
  const allFailed = lists.every((l) => l === null);

  return (
    <div className="space-y-10 pb-6">
      <PageHeader title={t('title')} description={t('description', { count: items.length })} />

      {allFailed ? (
        <ErrorCard message={t('error')} />
      ) : items.length === 0 ? (
        <EmptyState title={t('empty.title')} description={t('empty.description')} />
      ) : (
        <>
          <p className="max-w-3xl rounded-lg border border-border/70 bg-muted/50 px-3 py-2.5 text-[13px] leading-relaxed text-muted-foreground">{t('criteria')}</p>
          <ProjectExplorer repositories={items} initial={parseFilters(searchParams)} />
          <HowListWasMade />
        </>
      )}
    </div>
  );
}
