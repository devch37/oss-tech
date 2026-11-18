'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn, formatCompact, getScoreGrade, type ScoreGrade } from '@/lib/utils';
import { DEFAULT_FILTERS, type Activity, type Filters, type ProjectItem, type Sort } from '@/lib/project-filters';
import { OwnerAvatar } from '@/components/OwnerAvatar';
import { Button } from '@/components/ui/button';

const PAGE = 20;
const FIELD_ORDER = ['frontend', 'backend', 'devops', 'mobile', 'data', 'security'];
const ACTIVITIES: Exclude<Activity, 'all'>[] = ['S', 'A', 'B', 'C'];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'h-11 rounded-full border px-4 text-base font-medium transition-colors',
        active ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

const selectClass =
  'h-12 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground focus-visible:outline-none';

/**
 * 프로젝트 찾기 — 검색창 하나, 눈에 보이는 필터, "지금 적용한 조건" 요약.
 * 필터 상태는 주소(?q=&field=&lang=&activity=&sort=)에 그대로 남아서 링크로 공유할 수 있다.
 */
export function ProjectExplorer({ repositories, initial }: { repositories: ProjectItem[]; initial: Filters }) {
  const t = useTranslations('repositories');
  const tg = useTranslations('grades');
  const td = useTranslations('domains');
  const tc = useTranslations('common');
  const locale = useLocale();

  const [f, setF] = useState<Filters>(initial);
  const [shown, setShown] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false); // 모바일에서만 의미 있음 (데스크톱은 항상 펼쳐짐)

  const update = (patch: Partial<Filters>) => {
    setF((prev) => ({ ...prev, ...patch }));
    setShown(PAGE);
  };

  // 조건을 주소에 반영 (페이지 이동 없이) — 새로 고치거나 링크를 공유해도 같은 화면이 나온다
  useEffect(() => {
    const params = new URLSearchParams();
    if (f.q.trim()) params.set('q', f.q.trim());
    if (f.field !== 'all') params.set('field', f.field);
    if (f.lang !== 'all') params.set('lang', f.lang);
    if (f.activity !== 'all') params.set('activity', f.activity);
    if (f.sort !== DEFAULT_FILTERS.sort) params.set('sort', f.sort);
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [f]);

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of repositories) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [repositories]);

  const fields = useMemo(() => {
    const present = new Set(repositories.flatMap((r) => r.fields));
    return FIELD_ORDER.filter((k) => present.has(k));
  }, [repositories]);

  const results = useMemo(() => {
    const words = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = repositories.filter((r) => {
      if (f.field !== 'all' && !r.fields.includes(f.field)) return false;
      if (f.lang !== 'all' && r.language !== f.lang) return false;
      if (f.activity !== 'all' && getScoreGrade(r.score) !== f.activity) return false;
      if (words.length === 0) return true;
      const haystack = `${r.fullName} ${r.description ?? ''} ${r.language ?? ''}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    });
    const sorted = [...list];
    if (f.sort === 'stars') sorted.sort((a, b) => b.stars - a.stars);
    else if (f.sort === 'activity') sorted.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else sorted.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
    return sorted;
  }, [repositories, f]);

  // 지금 적용한 조건을 눈에 보이게 — 하나씩 지울 수 있다
  const applied: { key: string; label: string; clear: () => void }[] = [];
  if (f.q.trim()) applied.push({ key: 'q', label: t('summary.search', { value: f.q.trim() }), clear: () => update({ q: '' }) });
  if (f.field !== 'all') applied.push({ key: 'field', label: t('summary.field', { value: td(f.field as 'frontend') }), clear: () => update({ field: 'all' }) });
  if (f.lang !== 'all') applied.push({ key: 'lang', label: t('summary.language', { value: f.lang }), clear: () => update({ lang: 'all' }) });
  if (f.activity !== 'all') applied.push({ key: 'activity', label: t('summary.activity', { value: tg(f.activity) }), clear: () => update({ activity: 'all' }) });

  const clearAll = () => update({ q: '', field: 'all', lang: 'all', activity: 'all' });
  const visible = results.slice(0, shown);
  const remaining = results.length - visible.length;

  const filterCount = applied.filter((a) => a.key !== 'q').length;

  const filters = (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-display text-xl font-semibold">{t('filters.field.label')}</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={f.field === 'all'} onClick={() => update({ field: 'all' })}>
            {t('filters.field.all')}
          </Chip>
          {fields.map((k) => (
            <Chip key={k} active={f.field === k} onClick={() => update({ field: k })}>
              {td(k as 'frontend')}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-display text-xl font-semibold">{t('filters.activity.label')}</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={f.activity === 'all'} onClick={() => update({ activity: 'all' })}>
            {t('filters.activity.all')}
          </Chip>
          {ACTIVITIES.map((a) => (
            <Chip key={a} active={f.activity === a} onClick={() => update({ activity: a })}>
              {tg(a)}
            </Chip>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('filters.activity.help')}</p>
      </fieldset>

      <div className="space-y-2">
        <label htmlFor="project-language" className="block font-display text-xl font-semibold">
          {t('filters.language.label')}
        </label>
        <select id="project-language" value={f.lang} onChange={(e) => update({ lang: e.target.value })} className={selectClass}>
          <option value="all">{t('filters.language.all')}</option>
          {languages.map(([language, count]) => (
            <option key={language} value={language}>
              {t('filters.language.option', { language, count })}
            </option>
          ))}
        </select>
        <p className="text-sm text-muted-foreground">{t('filters.language.help')}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="project-sort" className="block font-display text-xl font-semibold">
          {t('filters.sort.label')}
        </label>
        <select id="project-sort" value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })} className={selectClass}>
          <option value="stars">{t('filters.sort.stars')}</option>
          <option value="activity">{t('filters.sort.activity')}</option>
          <option value="name">{t('filters.sort.name')}</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start lg:gap-12">
      {/* ─── 왼쪽(모바일은 위): 검색과 필터 ──────────────────── */}
      <aside className="space-y-5 lg:sticky lg:top-20">
        <div role="search" className="space-y-2">
          <label htmlFor="project-search" className="block font-display text-xl font-semibold">
            {t('search.label')}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="project-search"
              type="search"
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder={t('search.placeholder')}
              autoComplete="off"
              className="h-14 w-full rounded-xl border border-input bg-card pl-12 pr-4 text-lg placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>
          <p className="text-sm text-muted-foreground">{t('search.help')}</p>
        </div>

        {/* 모바일: 필터를 접었다 펼친다. 몇 개가 적용 중인지 버튼에 바로 보인다. */}
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="project-filters"
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-card px-4 text-base font-medium lg:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
            {t('filters.label')}
          </span>
          {filterCount > 0 && <span className="rounded-full bg-signal px-2.5 py-0.5 text-sm font-semibold text-[#0B1B2E]">{filterCount}</span>}
        </button>

        <div id="project-filters" className={cn(filtersOpen ? 'block' : 'hidden', 'lg:block')}>
          {filters}
        </div>
      </aside>

      {/* ─── 오른쪽(모바일은 아래): 적용한 조건과 결과 ──────────── */}
      <div className="min-w-0 space-y-8">
      {/* ─── 지금 적용한 조건 ─────────────────────────────── */}
      <section aria-label={t('summary.applied')} className="space-y-3 rounded-2xl border border-border bg-card p-5">
        <p className="font-display text-xl font-semibold" aria-live="polite">
          {applied.length === 0 ? t('summary.all', { total: repositories.length }) : t('summary.showing', { shown: results.length, total: repositories.length })}
        </p>
        {applied.length === 0 ? (
          <p className="text-base text-muted-foreground">{t('summary.none')}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-medium">{t('summary.applied')}:</span>
            {applied.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={a.clear}
                aria-label={t('summary.remove', { label: a.label })}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-signal/20 pl-4 pr-3 text-base font-medium text-foreground transition-colors hover:bg-signal/35"
              >
                {a.label}
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="text-base underline underline-offset-4">
              {t('summary.clear')}
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {t('summary.sortedBy', { value: t(`filters.sort.${f.sort}`) })}
        </p>
      </section>

      {/* ─── 결과 ─────────────────────────────────────────── */}
      {results.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-dashed border-border p-8">
          <h2 className="font-display text-2xl font-semibold">{t('list.noMatch.title')}</h2>
          <p className="text-base text-muted-foreground">{t('list.noMatch.description')}</p>
          <Button type="button" size="lg" onClick={clearAll}>
            {t('list.noMatch.clear')}
          </Button>
        </div>
      ) : (
        <>
          <ol className="divide-y divide-border border-y border-border">
            {visible.map((repo) => {
              const grade: ScoreGrade = getScoreGrade(repo.score);
              return (
                <li key={repo.fullName} className="relative grid grid-cols-[3rem_minmax(0,1fr)] items-start gap-x-4 gap-y-1 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_7rem]">
                  <OwnerAvatar login={repo.owner} size={48} />

                  <div className="min-w-0 space-y-1.5">
                    <p className="text-lg font-semibold leading-snug">
                      <a
                        href={`https://github.com/${repo.fullName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex max-w-full items-center gap-1.5 after:absolute after:inset-0"
                      >
                        <span className="break-words group-hover:underline group-hover:underline-offset-4">{repo.fullName}</span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="sr-only">
                          {tc('viewOnGithub', { name: repo.fullName })} ({tc('opensInNewTab')})
                        </span>
                      </a>
                    </p>
                    <p className="line-clamp-2 text-base text-muted-foreground">{repo.description ?? t('list.noDescription')}</p>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      {repo.fields.map((k) => (
                        <span key={k} className="rounded-full bg-muted px-2.5 py-0.5">{td(k as 'frontend')}</span>
                      ))}
                      {repo.language && <span>{repo.language}</span>}
                      {grade !== '-' && (
                        <span className={cn('font-medium', (grade === 'S' || grade === 'A') && 'text-signal-ink')}>{tg(grade)}</span>
                      )}
                      <span className="inline-flex items-center gap-1 font-medium text-foreground sm:hidden">
                        <Star className="h-4 w-4 fill-signal text-signal" aria-hidden="true" />
                        {formatCompact(repo.stars, locale)}
                      </span>
                    </p>
                  </div>

                  <p className="hidden items-center justify-end gap-1.5 font-display text-xl font-semibold tabular-nums sm:flex">
                    <Star className="h-5 w-5 fill-signal text-signal" aria-hidden="true" />
                    {formatCompact(repo.stars, locale)}
                  </p>
                </li>
              );
            })}
          </ol>

          {remaining > 0 && (
            <div className="flex justify-center">
              <Button type="button" variant="outline" size="lg" onClick={() => setShown((n) => n + PAGE)}>
                {t('list.more', { count: Math.min(PAGE, remaining) })}
              </Button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
