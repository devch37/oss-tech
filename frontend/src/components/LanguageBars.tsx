import { useTranslations } from 'next-intl';
import { languageColor } from '@/lib/language-colors';

interface LanguageBarsProps {
  languages: { language: string; count: number }[];
  /** 비율의 분모 — 보통 추적 중인 전체 프로젝트 수 */
  total: number;
}

/** 프로젝트의 주 언어 분포 — 막대 길이 = 그 언어를 쓰는 프로젝트 수 */
export function LanguageBars({ languages, total }: LanguageBarsProps) {
  const t = useTranslations('overview.languages');
  const max = Math.max(...languages.map((l) => l.count), 1);

  return (
    <ol className="space-y-2.5">
      {languages.map((item, index) => (
        <li key={item.language} className="grid grid-cols-[9rem_minmax(0,1fr)_5.5rem] items-center gap-x-3 text-sm">
          <span className="flex items-center gap-2 truncate font-medium">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: languageColor(item.language) }} />
            {item.language}
          </span>
          <span className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span
              className="bar-fill block h-full rounded-full"
              style={{ width: `${Math.max((item.count / max) * 100, 3)}%`, backgroundColor: languageColor(item.language), ['--i' as string]: index }}
            />
          </span>
          <span className="text-right tabular-nums text-muted-foreground">
            {t('projects', { count: item.count })}
            <span className="sr-only">{total > 0 ? ` (${Math.round((item.count / total) * 100)}%)` : ''}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
