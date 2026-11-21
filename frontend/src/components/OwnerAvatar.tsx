import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

/**
 * GitHub 프로필 사진. 사람·팀을 한눈에 알아보게 해 주는 가장 직관적인 단서라서 목록마다 넣는다.
 * `link` 이면 사진을 눌러 그 사람·팀의 GitHub 프로필이 새 탭에서 열린다.
 * (카드 전체가 "프로젝트로 가는 링크"일 때도 사진은 그 위에 떠서 따로 눌린다.)
 */
export function OwnerAvatar({ login, size = 40, className, link = false }: { login: string; size?: number; className?: string; link?: boolean }) {
  const tc = useTranslations('common');
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://github.com/${encodeURIComponent(login)}.png?size=${size * 2}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className={cn('shrink-0 rounded-full bg-muted object-cover', className)}
    />
  );
  if (!link) return img;
  return (
    <a
      href={`https://github.com/${encodeURIComponent(login)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={tc('viewOnGithub', { name: login })}
      className="relative z-10 shrink-0 rounded-full transition-opacity hover:opacity-80"
    >
      {img}
      <span className="sr-only">
        {tc('viewOnGithub', { name: login })} ({tc('opensInNewTab')})
      </span>
    </a>
  );
}
