import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn/ui 표준 cn 유틸리티 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─── Score Grade ─────────────────────────────────────────────────────────────

/**
 * Active Level 등급
 * formula: score = (commits×3 + prs×2 + issues×1) / ln(stars+1)
 *
 * S: score >= 50  (매우 활발)
 * A: score >= 20  (활발)
 * B: score >= 5   (보통)
 * C: score >= 0   (낮음)
 * -: null         (데이터 없음)
 */
export type ScoreGrade = 'S' | 'A' | 'B' | 'C' | '-';

export function getScoreGrade(score: number | null): ScoreGrade {
  if (score === null) return '-';
  if (score >= 50) return 'S';
  if (score >= 20) return 'A';
  if (score >= 5) return 'B';
  return 'C';
}

/** Tailwind CSS 배지 클래스 (JIT 안전: 전체 클래스 문자열 사용) */
export function getScoreGradeColor(grade: ScoreGrade): string {
  switch (grade) {
    case 'S':
      return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'A':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'B':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'C':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    default:
      return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

// ─── Growth Rate ──────────────────────────────────────────────────────────────

/**
 * growthRate 부호 포함 포맷
 * @example formatGrowthRate(23.4)  // "+23.4%"
 * @example formatGrowthRate(-5.2)  // "-5.2%"
 */
export function formatGrowthRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

/** growthRate 색상 Tailwind 클래스 */
export function getGrowthRateColor(rate: number): string {
  if (rate > 0) return 'text-emerald-600';
  if (rate < 0) return 'text-red-500';
  return 'text-gray-500';
}

// ─── Number / Date Formatting ─────────────────────────────────────────────────

/**
 * 천 단위 구분 포맷 (ko-KR 로케일)
 * @example formatNumber(1240)  // "1,240"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ko-KR').format(n);
}

/**
 * "YYYY-MM" → "YYYY년 M월"
 * @example formatMonth("2026-04")  // "2026년 4월"
 */
export function formatMonth(month: string): string {
  const [year, mon] = month.split('-');
  // noUncheckedIndexedAccess 안전 처리
  if (!year || !mon) return month;
  return `${year}년 ${parseInt(mon, 10)}월`;
}

/**
 * ISO 8601 → 한국어 날짜+시각 문자열
 * @example formatDateTime("2026-04-15T09:00:00")  // "2026년 4월 15일 오전 9:00"
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
