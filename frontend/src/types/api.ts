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
}

// ─── Report ───────────────────────────────────────────────────────────────────

/** GET /api/v1/reports → ReportMetaDto */
export interface ReportMeta {
  id: number;
  domain: string;
  reportMonth: string; // "YYYY-MM"
  generatedAt: string; // ISO 8601
}

/** GET /api/v1/reports/{id} → MonthlyReportDto */
export interface MonthlyReport extends ReportMeta {
  content: string; // Markdown 전문
}

// ─── Crawl ────────────────────────────────────────────────────────────────────

/** POST /api/v1/crawl/trigger → CrawlTriggerResponse */
export interface CrawlResult {
  domain: string;
  status: string;
  message: string;
}
