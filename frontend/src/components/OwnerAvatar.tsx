import { cn } from '@/lib/utils';

/**
 * GitHub 프로필 사진. 사람·팀을 한눈에 알아보게 해 주는 가장 직관적인 단서라서 목록마다 넣는다.
 * 장식용이므로 alt 는 비워 두고(이름은 옆 글자로 읽힌다), 느리게 불러와도 레이아웃이 흔들리지 않게 크기를 고정한다.
 */
export function OwnerAvatar({ login, size = 40, className }: { login: string; size?: number; className?: string }) {
  return (
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
}
