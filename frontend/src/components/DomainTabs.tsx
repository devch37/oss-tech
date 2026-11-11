'use client';

import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname } from '@/i18n/navigation';
import { DOMAINS, resolveDomain } from '@/lib/domains';
import { cn } from '@/lib/utils';

/** URL의 ?domain= 이 단일 진실. 탭을 누르면 같은 페이지의 다른 도메인으로 이동한다. */
export function DomainTabs({ className }: { className?: string }) {
  const t = useTranslations('domains');
  const pathname = usePathname();
  const current = resolveDomain(useSearchParams().get('domain') ?? undefined);

  return (
    <nav aria-label={t('label')} className={cn('-mx-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      <ul className="flex min-w-max items-center gap-1 px-1">
        {DOMAINS.map((domain) => {
          const active = domain === current;
          return (
            <li key={domain}>
              <Link
                href={{ pathname, query: { domain } }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative block px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(domain)}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-signal"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
