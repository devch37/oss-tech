'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDomain } from '@/contexts/DomainContext';
import { Logo } from '@/components/Logo';
import { GUIDE_ITEM, isActivePath, NAV_ITEMS, type NavItem } from '@/components/nav-items';

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { hrefWithDomain } = useDomain();
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={hrefWithDomain(item.href)}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-muted hover:text-sidebar-foreground',
      )}
    >
      <Icon className={cn('h-[18px] w-[18px] shrink-0', active ? '' : 'opacity-70 group-hover:opacity-100')} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{item.label}</span>
        <span className={cn('truncate text-[11px] font-normal', active ? 'opacity-80' : 'text-muted-foreground')}>
          {item.description}
        </span>
      </span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="주요 메뉴">
      <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        탐색
      </p>
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}
      <p className="mt-4 px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        도움말
      </p>
      <NavLink item={GUIDE_ITEM} onNavigate={onNavigate} />
    </nav>
  );
}

/** 데스크탑 고정 사이드바 */
export function DesktopSidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:flex">
      <Link href="/" className="flex h-16 items-center px-6">
        <Logo />
      </Link>
      <SidebarNav />
      <div className="m-3 rounded-2xl border bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-1.5 font-semibold text-foreground">
          <Clock className="h-3.5 w-3.5" />
          데이터 업데이트
        </p>
        <p className="mt-1">매일 새벽 3시 GitHub 수집 · 매월 1일 AI 리포트 발행</p>
      </div>
    </aside>
  );
}

/** 모바일 하단 탭바 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { hrefWithDomain } = useDomain();
  const items = [...NAV_ITEMS, GUIDE_ITEM];

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={hrefWithDomain(item.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
