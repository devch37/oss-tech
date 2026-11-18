import { useTranslations } from 'next-intl';
import type { LanguageTrend } from '@/types/api';

/**
 * 프로그래밍 언어 순위 — 큰 글씨 이름, 긴 막대, 그리고 "전체 중 몇 퍼센트인지".
 * (지난달과의 증감은 싣지 않는다: 최근 프로젝트는 스타가 쌓일 시간이 짧아 비교가 왜곡되기 때문)
 */
export function LanguageRanking({ languages, limit }: { languages: LanguageTrend[]; limit?: number }) {
  const t = useTranslations('trends.languages');

  const total = languages.reduce((sum, l) => sum + l.newRepoCount, 0);
  const max = Math.max(...languages.map((l) => l.newRepoCount), 1);
  const shown = languages.slice(0, limit ?? languages.length);

  return (
    <ol className="divide-y divide-border border-y border-border">
      {shown.map((item, index) => {
        const percent = total > 0 ? Math.round((item.newRepoCount / total) * 100) : 0;
        return (
          <li
            key={item.language}
            className="grid grid-cols-[2rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[2.5rem_9rem_minmax(0,1fr)_10rem] sm:gap-x-5"
          >
            <span className="font-display text-xl font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
            <span className="font-display text-2xl font-semibold leading-tight">{item.language}</span>

            <span className="col-start-2 h-4 overflow-hidden rounded-full bg-muted sm:col-start-3" aria-hidden="true">
              <span
                className="bar-fill block h-full rounded-full bg-sea"
                style={{ width: `${Math.max((item.newRepoCount / max) * 100, 2)}%`, ['--i' as string]: index }}
              />
            </span>

            <span className="col-start-2 text-base sm:col-start-4">
              <span className="block font-medium tabular-nums">{t('projects', { count: item.newRepoCount })}</span>
              <span className="block text-sm text-muted-foreground">{t('share', { percent: `${percent}%` })}</span>
            </span>

            {item.topRepo && (
              <span className="col-start-2 text-sm text-muted-foreground sm:col-span-3 sm:col-start-2">
                {t('topProject')}:{' '}
                <a
                  href={`https://github.com/${item.topRepo.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
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
