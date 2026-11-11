import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { EmptyState } from '@/components/EmptyState';
import { buttonVariants } from '@/components/ui/button-variants';

export default function NotFound() {
  const t = useTranslations('errors');
  return (
    <div className="max-w-2xl space-y-6 pb-8">
      <EmptyState title={t('notFoundTitle')} description={t('notFoundDescription')} />
      <Link href="/" className={buttonVariants({ variant: 'default' })}>
        {t('goHome')}
      </Link>
    </div>
  );
}
