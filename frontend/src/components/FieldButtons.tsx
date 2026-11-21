import { ArrowUpRight, Cloud, Database, Monitor, Server, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react';
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

/** 분야로 들어가는 여섯 개의 작은 타일 — 아이콘, 분야 이름, 프로젝트 수만 보여 준다. */
export function FieldButtons({ domains }: { domains: DomainOverview[] }) {
  const t = useTranslations('trends.fields');
  const td = useTranslations('domains');

  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {domains.map((d) => {
        const Icon = ICONS[d.domain] ?? Monitor;
        return (
          <li key={d.domain} className="relative">
            <div className="group flex h-full items-center gap-3 rounded-xl border border-border bg-card/60 px-4 py-3.5 transition-colors hover:border-foreground/30 hover:bg-card focus-within:border-foreground/30">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/80">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-tight">
                  <Link
                    href={{ pathname: '/', query: { domain: d.domain } }}
                    className="after:absolute after:inset-0 after:rounded-xl"
                    aria-label={t('open', { domain: td(d.domain as 'frontend') })}
                  >
                    {td(d.domain as 'frontend')}
                  </Link>
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">{t('projects', { count: d.repositoryCount })}</p>
              </div>
              <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
