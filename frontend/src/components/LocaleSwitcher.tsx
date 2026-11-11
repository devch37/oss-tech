'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const SHORT_LABEL: Record<Locale, string> = { en: 'EN', ko: '한국어' };

/** 현재 경로와 쿼리(?domain= 등)를 유지한 채 언어만 바꾼다. */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations('locale');
  const current = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function switchTo(next: Locale) {
    if (next === current) return;
    const query = Object.fromEntries(searchParams.entries());
    router.replace({ pathname, query }, { locale: next });
  }

  return (
    <div
      role="group"
      aria-label={t('label')}
      className={cn('inline-flex rounded-md border border-border bg-card p-0.5 text-xs', className)}
    >
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            aria-pressed={active}
            aria-label={t(locale)}
            onClick={() => switchTo(locale)}
            className={cn(
              'rounded-[5px] px-2.5 py-1 font-medium transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {SHORT_LABEL[locale]}
          </button>
        );
      })}
    </div>
  );
}
