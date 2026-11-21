import type { LanguageTrend, RisingDeveloper, Trends } from '@/types/api';

/** 목록을 기간으로 나눠 보는 공통 선택지: 최근 7일 / 최근 30일 / 기간 제한 없음 */
export type Period = 'week' | 'month' | 'all';

export const PERIODS: Period[] = ['week', 'month', 'all'];

export function parsePeriod(value: string | undefined, fallback: Period = 'week'): Period {
  return value === 'week' || value === 'month' || value === 'all' ? value : fallback;
}

/** 기간별 언어 순위. 예전 스냅샷(기간별 필드 없음)이면 30일 목록만 있는 것으로 본다. */
export function languagesByPeriod(trends: Trends): Record<Period, LanguageTrend[]> {
  const p = trends.languagePeriods;
  return { week: p?.week ?? [], month: p?.month?.length ? p.month : trends.languages, all: p?.allTime ?? [] };
}

/** 기간별 뜨는 사람·팀. 예전 스냅샷이면 30일 목록만 있는 것으로 본다. */
export function risingByPeriod(trends: Trends): Record<Period, RisingDeveloper[]> {
  const p = trends.risingByPeriod;
  return { week: p?.week ?? [], month: p?.month?.length ? p.month : trends.risingDevelopers, all: p?.allTime ?? [] };
}
