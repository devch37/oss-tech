import { Cloud, Database, Monitor, Server, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { DomainOverview } from '@/types/api';

const ICONS: Record<string, LucideIcon> = {
  frontend: Monitor,
  backend: Server,
  devops: Cloud,
  mobile: Smartphone,
  data: Database,
  security: ShieldCheck,
};

/** 분야로 들어가는 큰 버튼 여섯 개 — 아이콘, 분야 이름, 프로젝트 수만 보여 준다. */
export function FieldButtons({ domains }: { domains: DomainOverview[] }) {
  const t = useTranslations('trends.fields');
  const td = useTranslations('domains');

  return (
    <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {domains.map((d) => {
        const Icon = ICONS[d.domain] ?? Monitor;
        return (
          <li key={d.domain} className="relative">
            <div className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/40 focus-within:border-foreground/40">
              <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-signal/15 text-signal-ink">
                <Icon className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-xl font-semibold leading-tight">
                  <Link
                    href={{ pathname: '/', query: { domain: d.domain } }}
                    className="after:absolute after:inset-0 after:rounded-2xl"
                    aria-label={t('open', { domain: td(d.domain as 'frontend') })}
                  >
                    {td(d.domain as 'frontend')}
                  </Link>
                </p>
                <p className="text-sm tabular-nums text-muted-foreground">{t('projects', { count: d.repositoryCount })}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
