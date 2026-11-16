import { Flame, Star, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatCompact } from '@/lib/utils';
import type { Library, Repository } from '@/types/api';

interface HighlightsProps {
  locale: string;
  domain: string;
  repositories: Repository[];
  libraries: Library[];
  hasBaseline: boolean;
}

/**
 * 첫 화면에서 "그래서 뭐가 뜨고 있는데?"에 바로 답하는 세 문장.
 * 모든 숫자는 집계 데이터에서 계산한 값이다 (LLM·템플릿 리포트와 무관).
 */
export async function Highlights({ locale, domain, repositories, libraries, hasBaseline }: HighlightsProps) {
  const t = await getTranslations({ locale, namespace: 'home.highlights' });

  const scored = repositories.filter((r) => r.score !== null && r.score > 0);
  const mostActive = [...scored].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  // "지금 뜨는 것"을 말하는 화면이므로, 스타가 많아도 최근 활동이 거의 없는 레포(문서·보관용 등)는 고르지 않는다 (등급 B 이상)
  const mostStarred = repositories.filter((r) => (r.score ?? 0) >= 5).sort((a, b) => b.stars - a.stars)[0];

  const fastest = hasBaseline
    ? [...libraries]
        .filter((l) => l.prevMonthCount > 0 && l.growthRate > 0)
        .sort((a, b) => b.growthRate - a.growthRate || b.usageCount - a.usageCount)[0]
    : undefined;
  const mostUsed = [...libraries].sort((a, b) => b.usageCount - a.usageCount)[0];

  const repoLink = (r: Repository) => (chunks: ReactNode) => (
    <a
      href={`https://github.com/${r.fullName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline decoration-signal decoration-2 underline-offset-4 hover:decoration-foreground"
    >
      {chunks}
    </a>
  );
  const libLink = (l: Library) => (chunks: ReactNode) => (
    <Link
      href={{ pathname: `/libraries/${encodeURIComponent(l.libraryName)}`, query: { domain } }}
      className="font-semibold underline decoration-sea decoration-2 underline-offset-4 hover:decoration-foreground"
    >
      {chunks}
    </Link>
  );

  const items: { key: string; icon: ReactNode; tone: string; text: ReactNode }[] = [];

  if (mostActive) {
    items.push({
      key: 'active',
      icon: <Flame className="h-5 w-5" aria-hidden="true" />,
      tone: 'bg-signal/15 text-signal-ink',
      text: t.rich('mostActive', {
        link: repoLink(mostActive),
        name: mostActive.name,
        commits: mostActive.commits30d ?? 0,
        prs: mostActive.prsMerged30d ?? 0,
      }),
    });
  }
  if (mostStarred) {
    items.push({
      key: 'starred',
      icon: <Star className="h-5 w-5" aria-hidden="true" />,
      tone: 'bg-signal/15 text-signal-ink',
      text: t.rich('mostStarred', { link: repoLink(mostStarred), name: mostStarred.name, stars: formatCompact(mostStarred.stars, locale) }),
    });
  }
  if (fastest) {
    items.push({
      key: 'growing',
      icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
      tone: 'bg-sea/15 text-sea',
      text: t.rich('topGrowing', {
        link: libLink(fastest),
        name: fastest.libraryName,
        count: fastest.usageCount,
        rate: `${Math.abs(fastest.growthRate).toFixed(1)}%`,
      }),
    });
  } else if (mostUsed) {
    items.push({
      key: 'used',
      icon: <TrendingUp className="h-5 w-5" aria-hidden="true" />,
      tone: 'bg-sea/15 text-sea',
      text: t.rich('topUsed', { link: libLink(mostUsed), name: mostUsed.libraryName, count: mostUsed.usageCount }),
    });
  }

  if (items.length === 0) return null;

  return (
    <section aria-label={t('label')}>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-4 py-4">
            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.tone}`}>{item.icon}</span>
            <p className="max-w-[70ch] text-base leading-relaxed sm:text-lg">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
