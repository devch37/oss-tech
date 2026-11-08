import { cookies } from 'next/headers';
import { getLibraryMonths } from '@/lib/api-client';
import { DEFAULT_DOMAIN, DOMAIN_COOKIE, isKnownDomain } from '@/lib/domains';
import { currentYearMonth } from '@/lib/utils';

/** URL ?domain= → 쿠키 → 기본값 순으로 현재 분야를 결정 */
export function resolveDomain(param?: string): string {
  if (isKnownDomain(param)) return param;
  const fromCookie = cookies().get(DOMAIN_COOKIE)?.value;
  if (isKnownDomain(fromCookie)) return fromCookie;
  return DEFAULT_DOMAIN;
}

/**
 * 데이터가 존재하는 월 목록과 기준월을 결정.
 * - 요청 월이 목록에 있으면 그대로
 * - 없으면 데이터가 있는 가장 최근 월
 * - 데이터가 전혀 없으면 이번 달
 */
export async function resolveMonth(
  domain: string,
  requested?: string,
): Promise<{ month: string; months: string[]; hasData: boolean }> {
  const months = await getLibraryMonths(domain).catch(() => [] as string[]);
  if (requested && months.includes(requested)) return { month: requested, months, hasData: true };
  const latest = months[0];
  if (latest) return { month: latest, months, hasData: true };
  return { month: currentYearMonth(), months, hasData: false };
}
