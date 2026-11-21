import { useTranslations } from 'next-intl';
import { languageColor } from '@/lib/language-colors';
import type { LanguageTrend } from '@/types/api';

/**
 * 프로그래밍 언어 순위 — 이름, 가는 막대, 개수와 비율. 한 줄이 가볍게 읽히도록 얇은 막대를 쓴다.
 * (지난달과의 증감은 싣지 않는다: 최근 프로젝트는 스타가 쌓일 시간이 짧아 비교가 왜곡되기 때문)
 */
export function LanguageRanking({ languages, limit, offset = 0, scope }: { languages: LanguageTrend[]; limit?: number; /** 앞쪽 몇 개를 건너뛸지 (페이지 넘김용) */ offset?: number; /** 비율·막대 길이를 계산할 전체 목록 (기본은 languages) */ scope?: LanguageTrend[] }) {
  const t = useTranslations('trends.languages');

  const all = scope ?? languages;
  const total = all.reduce((sum, l) => sum + l.newRepoCount, 0);
  const max = Math.max(...all.map((l) => l.newRepoCount), 1);
  const shown = languages.slice(offset, limit !== undefined ? offset + limit : undefined);

  return (
    <ol className="divide-y divide-border/70 border-y border-border/70">
      {shown.map((item, index) => {
        const percent = total > 0 ? Math.round((item.newRepoCount / total) * 100) : 0;
        return (
          <li
            key={item.language}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-4 gap-y-1.5 py-3.5 sm:grid-cols-[1.75rem_7.5rem_minmax(0,1fr)_9.5rem]"
          >
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{offset + index + 1}</span>
            <span className="flex items-center gap-2 text-base font-semibold">
              <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: languageColor(item.language) }} />
              {item.language}
            </span>

            <span className="col-start-2 h-1.5 overflow-hidden rounded-full bg-muted sm:col-start-3" aria-hidden="true">
              <span
                className="bar-fill block h-full rounded-full"
                style={{ width: `${Math.max((item.newRepoCount / max) * 100, 2)}%`, backgroundColor: languageColor(item.language), ['--i' as string]: index }}
              />
            </span>

            <span className="col-start-2 text-sm sm:col-start-4 sm:text-right">
              <span className="font-mono font-medium tabular-nums">{t('projects', { count: item.newRepoCount })}</span>
              <span className="text-muted-foreground sm:block sm:text-xs"> {t('share', { percent: `${percent}%` })}</span>
            </span>

            {item.topRepo && (
              <span className="col-start-2 text-[13px] text-muted-foreground sm:col-span-3 sm:col-start-2">
                {t('topProject')}:{' '}
                <a
                  href={`https://github.com/${item.topRepo.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/90 underline-offset-4 hover:underline"
                >
                  {item.topRepo.fullName}
                </a>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
