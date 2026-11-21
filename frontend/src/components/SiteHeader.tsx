'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Logo } from '@/components/Logo';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';

const NAV = [
  { href: '/', key: 'home' },
  { href: '/languages', key: 'languages' },
  { href: '/developers', key: 'developers' },
  { href: '/repositories', key: 'repositories' },
  { href: '/libraries', key: 'libraries' },
] as const;

const DOMAIN_PAGES: string[] = ['/repositories', '/libraries'];

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark() {
  const t = useTranslations('brand');
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-foreground">
      <Logo />
      <span className="font-mono text-[15px] font-semibold tracking-tight">{t('name')}</span>
    </Link>
  );
}

export function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const domain = useSearchParams().get('domain');
  const [open, setOpen] = useState(false);

  // 분야 선택은 분야별 페이지(프로젝트·라이브러리·리포트)를 오갈 때만 유지한다.
  const hrefFor = (href: string) => (domain && DOMAIN_PAGES.includes(href) ? { pathname: href, query: { domain } } : href);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-14 items-center gap-3 sm:gap-6">
        <Wordmark />

        <nav aria-label={t('main')} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map(({ href, key }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={hrefFor(href)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('openMenu')}>
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-border px-5 py-4 text-left">
                <SheetTitle className="font-display">{t('main')}</SheetTitle>
              </SheetHeader>
              <nav aria-label={t('main')} className="p-3">
                <ul className="flex flex-col gap-1">
                  {NAV.map(({ href, key }) => {
                    const active = isActive(pathname, href);
                    return (
                      <li key={href}>
                        <Link
                          href={hrefFor(href)}
                          onClick={() => setOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'block rounded-md px-3 py-2.5 text-base font-medium',
                            active ? 'bg-accent text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {t(key)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
