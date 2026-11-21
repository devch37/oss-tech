// ─── Common Wrappers ─────────────────────────────────────────────────────────

/** 백엔드 ApiResponse<T> 매핑 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  timestamp: string;
}

/** 백엔드 PagedResult<T> 매핑 */
export interface PagedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

// ─── Domain ───────────────────────────────────────────────────────────────────

/** GET /api/v1/domains → DomainSummaryDto */
export interface Domain {
  domain: string;
  repositoryCount: number; // Kotlin Long → number
}

// ─── Library ─────────────────────────────────────────────────────────────────

/** GET /api/v1/libraries → LibraryRankDto */
export interface Library {
  libraryName: string;
  domain: string;
  collectedMonth: string; // "YYYY-MM"
  usageCount: number;
  prevMonthCount: number;
  growthRate: number; // 예: 23.4, -5.2
}

/** LibraryTrendDto.TrendPoint */
export interface LibraryTrendPoint {
  month: string; // "YYYY-MM"
  usageCount: number;
}

/** GET /api/v1/libraries/{name}/trend → LibraryTrendDto */
export interface LibraryTrend {
  libraryName: string;
  domain: string;
  trend: LibraryTrendPoint[];
}

// ─── Repository ───────────────────────────────────────────────────────────────

/** GET /api/v1/repositories → RepositoryWithScoreDto */
export interface Repository {
  id: number;
  owner: string;
  name: string;
  fullName: string; // "owner/name"
  domain: string;
  stars: number;
  forks: number;
  language: string | null; // Kotlin String?
  score: number | null; // sort=stars 이면 null
  commits30d: number | null;
  prsMerged30d: number | null;
  issuesClosed30d: number | null;
  /** 프로젝트 소개 문구 (영어 원문, 없을 수 있음) */
  description?: string | null;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

/** 활동 등급별 레포 수 (S 매우 활발 · A 활발 · B 보통 · C 낮음) */
export interface LevelCounts {
  s: number;
  a: number;
  b: number;
  c: number;
}

export interface DomainOverview {
  domain: string;
  repositoryCount: number;
  totalStars: number;
  commits30d: number;
  prsMerged30d: number;
  levels: LevelCounts;
  topRepository: Repository | null;
  libraryCount: number;
  topLibrary: { name: string; usageCount: number } | null;
}

/** GET /api/v1/overview → OverviewDto */
export interface Overview {
  totals: { repositories: number; stars: number; commits30d: number; prsMerged30d: number; libraries: number };
  domains: DomainOverview[];
  topRepositories: Repository[];
  hiddenGems: Repository[];
  languages: { language: string; count: number }[];
  levels: LevelCounts;
  libraryMonth: string | null;
}

// ─── Trends (지금 GitHub 에서 뜨는 것) ─────────────────────────────────────────

/** 새로 뜨는 프로젝트 한 건 */
export interface TrendRepo {
  fullName: string; // "owner/name"
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  ownerType: 'User' | 'Organization' | string | null;
  createdAt: string | null; // ISO 8601
}

export interface LanguageTrend {
  language: string;
  /** 최근 30일 안에 만들어져 스타 50개 이상 받은 프로젝트 수 */
  newRepoCount: number;
  topRepo: TrendRepo | null;
}

export interface RisingDeveloper {
  login: string;
  ownerType: string | null;
  repoCount: number;
  totalStars: number;
  topRepo: TrendRepo;
}

export interface TopDeveloper {
  login: string;
  name: string | null;
  bio: string | null;
  followers: number;
  publicRepos: number;
  /** 프로필에 적어 둔 지역·소속 (없을 수 있음) */
  location?: string | null;
  company?: string | null;
}

/** GET /api/v1/trends → TrendsDto */
export interface Trends {
  /** 마지막 수집 시각 (UTC). 한 번도 수집하지 않았으면 null */
  generatedAt: string | null;
  /** allTime: 기간 제한 없이 지금 스타가 가장 많은 프로젝트 (예전 스냅샷에는 없을 수 있음) */
  newRepos: { week: TrendRepo[]; month: TrendRepo[]; allTime?: TrendRepo[] };
  /** 최근 30일 기준 언어 순위 (이전 형식 호환) */
  languages: LanguageTrend[];
  /** 기간별 언어 순위 */
  languagePeriods?: { week: LanguageTrend[]; month: LanguageTrend[]; allTime: LanguageTrend[] };
  /** 최근 30일 기준 뜨는 사람·팀 (이전 형식 호환) */
  risingDevelopers: RisingDeveloper[];
  /** 기간별 뜨는 사람·팀 */
  risingByPeriod?: { week: RisingDeveloper[]; month: RisingDeveloper[]; allTime: RisingDeveloper[] };
  topDevelopers: TopDeveloper[];
  /** 스타가 많고 최근에도 활발한 프로젝트 */
  popularNow: Repository[];
}

// ─── Crawl ────────────────────────────────────────────────────────────────────

/** POST /api/v1/crawl/trigger → CrawlTriggerResponse */
export interface CrawlResult {
  domain: string;
  status: string;
  message: string;
}
