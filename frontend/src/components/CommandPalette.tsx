'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, CornerDownLeft, FolderGit2, Loader2, Package, Search } from 'lucide-react';
import { useDomain } from '@/contexts/DomainContext';
import { getLibraries, getLibraryMonths, getRepositories } from '@/lib/api-client';
import { DOMAINS, getDomainMeta } from '@/lib/domains';
import { cn, formatNumber } from '@/lib/utils';
import { GUIDE_ITEM, NAV_ITEMS } from '@/components/nav-items';
import type { Library, Repository } from '@/types/api';

const OPEN_EVENT = 'oss:open-command-palette';

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
}

/**
 * ⌘K / Ctrl+K 빠른 검색.
 * 페이지 이동 · 분야 전환 · 현재 분야의 라이브러리/프로젝트 이름 검색을 한 곳에서.
 */
export function CommandPalette() {
  const router = useRouter();
  const { selectedDomain, setSelectedDomain, hrefWithDomain } = useDomain();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ domain: string; libs: Library[]; repos: Repository[] } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 단축키 + 외부 open 이벤트
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === '/' && !(e.target as HTMLElement)?.closest('input, textarea, [contenteditable]')) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  // 열릴 때 현재 분야 데이터 lazy-load
  useEffect(() => {
    if (!open || data?.domain === selectedDomain) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const months = await getLibraryMonths(selectedDomain).catch(() => [] as string[]);
      const [libs, repos] = await Promise.all([
        months[0]
          ? getLibraries({ domain: selectedDomain, month: months[0], size: 200 })
              .then((r) => r.content)
              .catch(() => [])
          : Promise.resolve([]),
        getRepositories({ domain: selectedDomain, sort: 'stars', size: 100 })
          .then((r) => r.content)
          .catch(() => []),
      ]);
      if (!cancelled) setData({ domain: selectedDomain, libs, repos });
    })().finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, selectedDomain, data?.domain]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (s: string) => !q || s.toLowerCase().includes(q);

    const pages: PaletteItem[] = [...NAV_ITEMS, GUIDE_ITEM]
      .filter((n) => match(n.label) || match(n.description))
      .map((n) => ({
        id: `page:${n.href}`,
        group: '페이지',
        label: n.label,
        hint: n.description,
        icon: n.icon,
        run: () => go(hrefWithDomain(n.href)),
      }));

    const domains: PaletteItem[] = DOMAINS.filter(
      (d) => d.value !== selectedDomain && (match(d.label) || match(d.description) || (q && match(d.value))),
    )
      .slice(0, q ? 6 : 0)
      .map((d) => ({
        id: `domain:${d.value}`,
        group: '분야 전환',
        label: `${d.label} 분야로 전환`,
        hint: d.description,
        icon: d.icon,
        run: () => {
          setOpen(false);
          setSelectedDomain(d.value);
        },
      }));

    const libs: PaletteItem[] = q
      ? (data?.libs ?? [])
          .filter((l) => match(l.libraryName))
          .slice(0, 8)
          .map((l) => ({
            id: `lib:${l.libraryName}`,
            group: '라이브러리',
            label: l.libraryName,
            hint: `${formatNumber(l.usageCount)}개 프로젝트 사용`,
            icon: Package,
            run: () => go(`/libraries/${encodeURIComponent(l.libraryName)}?domain=${selectedDomain}`),
          }))
      : [];

    const repos: PaletteItem[] = q
      ? (data?.repos ?? [])
          .filter((r) => match(r.fullName))
          .slice(0, 6)
          .map((r) => ({
            id: `repo:${r.id}`,
            group: '프로젝트',
            label: r.fullName,
            hint: `★ ${formatNumber(r.stars)}`,
            icon: FolderGit2,
            run: () => go(`/repositories?domain=${selectedDomain}&q=${encodeURIComponent(r.fullName)}`),
          }))
      : [];

    const all = [...libs, ...repos, ...pages, ...domains];
    if (q && all.length === 0) return [];
    if (q) {
      all.push({
        id: 'search:libs',
        group: '더 찾아보기',
        label: `라이브러리 랭킹에서 "${query.trim()}" 검색`,
        icon: Search,
        run: () => go(`/libraries?domain=${selectedDomain}&q=${encodeURIComponent(query.trim())}`),
      });
    }
    return all;
  }, [query, data, selectedDomain, go, hrefWithDomain, setSelectedDomain]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[active]?.run();
    }
  };

  let lastGroup = '';

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 animate-fade-in bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 animate-scale-in overflow-hidden rounded-2xl border bg-popover shadow-lift focus:outline-none"
        >
          <Dialog.Title className="sr-only">빠른 검색</Dialog.Title>
          <Dialog.Description className="sr-only">
            페이지, 분야, 라이브러리, 프로젝트를 검색합니다.
          </Dialog.Description>
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${getDomainMeta(selectedDomain).label} 분야에서 검색… (예: react, spring)`}
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          <div ref={listRef} className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                &ldquo;{query}&rdquo; 에 해당하는 결과가 없어요.
              </p>
            ) : (
              items.map((item, i) => {
                const showGroup = item.group !== lastGroup;
                lastGroup = item.group;
                const Icon = item.icon;
                return (
                  <div key={item.id}>
                    {showGroup && (
                      <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:pt-1">
                        {item.group}
                      </p>
                    )}
                    <button
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={item.run}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                        i === active ? 'bg-muted' : '',
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-card">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.hint && (
                          <span className="block truncate text-xs text-muted-foreground">{item.hint}</span>
                        )}
                      </span>
                      {i === active ? (
                        <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 text-transparent" />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center gap-4 border-t bg-muted/40 px-4 py-2.5 text-[11px] text-muted-foreground">
            <span><kbd className="font-sans font-semibold">↑↓</kbd> 이동</span>
            <span><kbd className="font-sans font-semibold">Enter</kbd> 선택</span>
            <span><kbd className="font-sans font-semibold">Esc</kbd> 닫기</span>
            <span className="ml-auto">
              <kbd className="font-sans font-semibold">/</kbd> 로도 열 수 있어요
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
