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
 * S: score >= 50 · A: score >= 20 · B: score >= 5 · C: score >= 0 · -: 데이터 없음
 * (등급 이름/설명은 번역 파일의 `grades.*` 에 있다)
 */
export type ScoreGrade = 'S' | 'A' | 'B' | 'C' | '-';

export const GRADE_THRESHOLDS = { S: 50, A: 20, B: 5, C: 0 } as const;

export function getScoreGrade(score: number | null): ScoreGrade {
  if (score === null) return '-';
  if (score >= GRADE_THRESHOLDS.S) return 'S';
  if (score >= GRADE_THRESHOLDS.A) return 'A';
  if (score >= GRADE_THRESHOLDS.B) return 'B';
  return 'C';
}

/**
 * 등급 배지 클래스 — 색상 하나(Signal)의 농도로 위계를 표현한다.
 * 색만으로 구분하지 않도록 배지에는 항상 등급 글자가 함께 표시된다.
 * (JIT 안전: 전체 클래스 문자열 사용)
 */
export function getScoreGradeClass(grade: ScoreGrade): string {
  switch (grade) {
    case 'S':
      return 'border-signal bg-signal text-[#0B1B2E]';
    case 'A':
      return 'border-signal/70 bg-signal/25 text-signal-ink';
    case 'B':
      return 'border-signal/40 bg-signal/10 text-signal-ink';
    case 'C':
      return 'border-border bg-transparent text-muted-foreground';
    default:
      return 'border-dashed border-border bg-transparent text-muted-foreground';
  }
}

// ─── Growth Rate ──────────────────────────────────────────────────────────────

export type GrowthTone = 'up' | 'down' | 'flat';

export function getGrowthTone(rate: number): GrowthTone {
  if (rate > 0.05) return 'up';
  if (rate < -0.05) return 'down';
  return 'flat';
}

/** 색상 Tailwind 클래스 — 상승 Sea / 하락 Brick (부호·아이콘이 항상 함께 표시됨) */
export function getGrowthToneClass(tone: GrowthTone): string {
  if (tone === 'up') return 'text-sea';
  if (tone === 'down') return 'text-brick';
  return 'text-muted-foreground';
}

/**
 * growthRate 부호 포함 포맷
 * @example formatGrowthRate(23.4)  // "+23.4%"
 * @example formatGrowthRate(-5.2)  // "-5.2%"
 */
export function formatGrowthRate(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

// ─── Number / Date Formatting (locale-aware) ──────────────────────────────────

/** 천 단위 구분 — @example formatNumber(1240, 'en') // "1,240" */
export function formatNumber(n: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(n);
}

/** 축약 표기 — @example formatCompact(48210, 'en') // "48K" · 'ko' → "4.8만" */
export function formatCompact(n: number, locale: string): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/**
 * "YYYY-MM" → 로케일에 맞는 연월
 * @example formatMonth("2026-04", "en") // "Apr 2026" · 'ko' → "2026년 4월"
 */
export function formatMonth(month: string, locale: string, style: 'short' | 'long' = 'short'): string {
  const [year, mon] = month.split('-');
  if (!year || !mon) return month;
  const date = new Date(Date.UTC(Number(year), Number(mon) - 1, 1));
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: style, timeZone: 'UTC' }).format(date);
}

/** ISO 8601 → 로케일에 맞는 날짜+시각 */
export function formatDateTime(isoString: string, locale: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** ISO 8601 → 로케일에 맞는 날짜 */
export function formatDate(isoString: string, locale: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

// ─── Month helpers ────────────────────────────────────────────────────────────

export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function currentYearMonth(): string {
  return toYearMonth(new Date());
}

/** 이번 달부터 거슬러 올라간 n개월 ("YYYY-MM", 최신순) */
export function lastMonths(n: number): string[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => toYearMonth(new Date(now.getFullYear(), now.getMonth() - i, 1)));
}

/** 마크다운 본문에서 제목/코드/링크 문법을 걷어낸 미리보기 텍스트 */
export function extractPreview(markdown: string, maxLength = 180): string {
  const text = markdown
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/^\|.*\|$/gm, '')
    .replace(/[*_~>|]/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s\S*$/, '') + '…';
}
