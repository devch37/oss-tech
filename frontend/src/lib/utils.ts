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

export const GRADE_INFO: Record<ScoreGrade, { label: string; range: string; hint: string }> = {
  S: { label: '매우 활발', range: '50점 이상', hint: '매일 개발이 진행되는 수준' },
  A: { label: '활발', range: '20 ~ 50점', hint: '꾸준히 업데이트되는 수준' },
  B: { label: '보통', range: '5 ~ 20점', hint: '가끔 업데이트되는 수준' },
  C: { label: '조용함', range: '5점 미만', hint: '최근 변화가 적은 수준' },
  '-': { label: '데이터 없음', range: '-', hint: '활성도 계산 전' },
};

/** Tailwind CSS 배지 클래스 (JIT 안전: 전체 클래스 문자열 사용) */
export function getScoreGradeColor(grade: ScoreGrade): string {
  switch (grade) {
    case 'S':
      return 'bg-violet-500/10 text-violet-700 ring-violet-500/30 dark:text-violet-300';
    case 'A':
      return 'bg-sky-500/10 text-sky-700 ring-sky-500/30 dark:text-sky-300';
    case 'B':
      return 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300';
    case 'C':
      return 'bg-amber-500/10 text-amber-700 ring-amber-500/30 dark:text-amber-300';
    default:
      return 'bg-muted text-muted-foreground ring-border';
  }
}

/** 차트용 등급 색상 */
export const GRADE_HEX: Record<ScoreGrade, string> = {
  S: '#8b5cf6',
  A: '#0ea5e9',
  B: '#10b981',
  C: '#f59e0b',
  '-': '#a1a1aa',
};

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
  if (rate > 0) return 'text-success';
  if (rate < 0) return 'text-danger';
  return 'text-muted-foreground';
}

/** 지난달 0 → 이번 달 등장 */
export function isNewLibrary(lib: { prevMonthCount: number; usageCount: number }): boolean {
  return lib.prevMonthCount === 0 && lib.usageCount > 0;
}

/** 채택률 (%) — 분석한 프로젝트 중 이 라이브러리를 쓰는 비율 */
export function adoptionRate(usageCount: number, repoCount: number): number | null {
  if (!repoCount) return null;
  return Math.min(100, (usageCount / repoCount) * 100);
}

/** 1.2k 같은 축약 표기 */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** "YYYY-MM" (현재 시각 기준) */
export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Ecosystem 추정 ───────────────────────────────────────────────────────────

export type Ecosystem = 'maven' | 'npm' | 'unknown';

/** 라이브러리 이름 형식으로 패키지 생태계 추정 (group:artifact → Maven, @scope/pkg → npm) */
export function inferEcosystem(name: string): Ecosystem {
  if (name.includes(':')) return 'maven';
  if (name.startsWith('@')) return 'npm';
  return 'unknown';
}

/** 라이브러리 외부 링크 목록 */
export function libraryLinks(name: string): { label: string; href: string }[] {
  const eco = inferEcosystem(name);
  const enc = encodeURIComponent(name);
  const links: { label: string; href: string }[] = [];
  if (eco === 'maven') {
    links.push({ label: 'Maven Central', href: `https://central.sonatype.com/search?q=${enc}` });
  } else {
    links.push({ label: 'npm', href: `https://www.npmjs.com/package/${name}` });
    if (eco === 'unknown') links.push({ label: 'PyPI', href: `https://pypi.org/project/${enc}/` });
  }
  links.push({ label: 'GitHub 검색', href: `https://github.com/search?q=${enc}&type=repositories` });
  return links;
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

/** "YYYY-MM" → "M월" */
export function formatShortMonth(month: string): string {
  const mon = month.split('-')[1];
  return mon ? `${parseInt(mon, 10)}월` : month;
}

/** 상대 시간 ("3일 전") */
export function formatRelative(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const rtf = new Intl.RelativeTimeFormat('ko', { numeric: 'auto' });
  const min = Math.round(diff / 60000);
  if (Math.abs(min) < 60) return rtf.format(-min, 'minute');
  const hour = Math.round(min / 60);
  if (Math.abs(hour) < 24) return rtf.format(-hour, 'hour');
  const day = Math.round(hour / 24);
  if (Math.abs(day) < 30) return rtf.format(-day, 'day');
  return rtf.format(-Math.round(day / 30), 'month');
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
