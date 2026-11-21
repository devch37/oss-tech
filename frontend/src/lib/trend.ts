import { daysSince } from '@/lib/utils';

/** "새 프로젝트"로 보고 하루 평균 스타를 보여 줄 최대 나이(일). 오래된 프로젝트의 평균은 의미가 없다. */
export const FRESH_DAYS = 45;

/**
 * 만든 날부터 지금까지 하루 평균 몇 개의 스타를 받았는지 (최소 1일로 계산).
 * 새 프로젝트끼리 "얼마나 빠르게 뜨는지"를 비교하는 가장 단순하고 정직한 속도 지표다.
 * 최근 프로젝트가 아니거나 날짜를 모르면 null.
 */
export function starsPerDay(stars: number, createdAt: string | null | undefined): number | null {
  const days = daysSince(createdAt);
  if (days === null || days > FRESH_DAYS) return null;
  return Math.round(stars / Math.max(1, days));
}
