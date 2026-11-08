'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DomainBar } from '@/components/DomainBar';
import { openCommandPalette } from '@/components/CommandPalette';
import { GUIDE_ITEM, isActivePath, NAV_ITEMS } from '@/components/nav-items';

export function Header() {
  const pathname = usePathname();
  const current = [...NAV_ITEMS, GUIDE_ITEM].find((i) => isActivePath(pathname, i.href));

  return (
    <header className="sticky top-0 z-30 border-b bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 lg:px-8">
        <Link href="/" className="lg:hidden" aria-label="홈으로">
          <Logo />
        </Link>
        <p className="hidden text-sm font-medium text-muted-foreground lg:block">{current?.label}</p>

        <div className="flex-1" />

        <button
          onClick={openCommandPalette}
          className="group flex h-9 items-center gap-2 rounded-full border bg-card pl-3 pr-2 text-sm text-muted-foreground shadow-sm transition-colors hover:border-foreground/20 hover:text-foreground sm:w-64"
          aria-label="검색 열기"
        >
          <Search className="h-4 w-4" />
          <span className="hidden flex-1 text-left sm:inline">라이브러리·프로젝트 검색</span>
          <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-sans text-[10px] font-semibold sm:inline">
            ⌘K
          </kbd>
        </button>
        <ThemeToggle />
      </div>
      <div className="mx-auto w-full max-w-7xl px-4 pb-3 lg:px-8">
        <DomainBar />
      </div>
    </header>
  );
}
