import { useTranslations } from 'next-intl';
import { Logo } from '@/components/Logo';

export function SiteFooter() {
  const t = useTranslations();
  return (
    <footer className="mt-20 border-t border-border">
      <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-foreground">
          <Logo className="h-5 w-5" />
          <span className="font-display font-semibold">{t('brand.name')}</span>
        </div>
        <p className="max-w-xl sm:text-right">{t('footer.text')}</p>
      </div>
    </footer>
  );
}
