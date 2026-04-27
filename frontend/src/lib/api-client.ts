import type {
  ApiResponse,
  CrawlResult,
  Domain,
  Library,
  LibraryTrend,
  MonthlyReport,
  PagedResult,
  ReportMeta,
  Repository,
} from '@/types/api';

// ─── URL Strategy ─────────────────────────────────────────────────────────────

/**
 * 서버 컴포넌트: INTERNAL_API_URL (백엔드 직접 연결, CORS 없음)
 * 클라이언트 컴포넌트: '' (빈 문자열 → Next.js rewrite /api/* 프록시 경유)
 */
function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';
  }
  return '';
}

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success || json.data === null) {
    throw new ApiError(
      json.error?.code ?? 'UNKNOWN_ERROR',
      json.error?.message ?? `HTTP ${res.status}`,
      res.status,
    );
  }

  return json.data;
}

// ─── Query String Builder ─────────────────────────────────────────────────────

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined,
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

// ─── Endpoint Functions ───────────────────────────────────────────────────────

/** GET /api/v1/domains */
export async function getDomains(): Promise<Domain[]> {
  return apiFetch<Domain[]>('/api/v1/domains', {
    next: { revalidate: 300 },
  } as RequestInit);
}

/** GET /api/v1/libraries?domain=&month=&page=&size= */
export async function getLibraries(params: {
  domain: string;
  month: string; // "YYYY-MM"
  page?: number;
  size?: number;
}): Promise<PagedResult<Library>> {
  const query = buildQuery({
    domain: params.domain,
    month: params.month,
    page: params.page,
    size: params.size,
  });
  return apiFetch<PagedResult<Library>>(`/api/v1/libraries${query}`, {
    next: { revalidate: 600 },
  } as RequestInit);
}

/** GET /api/v1/libraries/{name}/trend?domain= */
export async function getLibraryTrend(name: string, domain: string): Promise<LibraryTrend> {
  const query = buildQuery({ domain });
  return apiFetch<LibraryTrend>(`/api/v1/libraries/${encodeURIComponent(name)}/trend${query}`, {
    next: { revalidate: 600 },
  } as RequestInit);
}

/** GET /api/v1/repositories?domain=&sort=&page=&size= */
export async function getRepositories(params: {
  domain: string;
  sort?: 'score' | 'stars';
  page?: number;
  size?: number;
}): Promise<PagedResult<Repository>> {
  const query = buildQuery({
    domain: params.domain,
    sort: params.sort,
    page: params.page,
    size: params.size,
  });
  return apiFetch<PagedResult<Repository>>(`/api/v1/repositories${query}`, {
    next: { revalidate: 300 },
  } as RequestInit);
}

/** GET /api/v1/reports?domain= */
export async function getReports(domain: string): Promise<ReportMeta[]> {
  const query = buildQuery({ domain });
  return apiFetch<ReportMeta[]>(`/api/v1/reports${query}`, {
    next: { revalidate: 300 },
  } as RequestInit);
}

/** GET /api/v1/reports/{id} */
export async function getReport(id: number): Promise<MonthlyReport> {
  return apiFetch<MonthlyReport>(`/api/v1/reports/${id}`, {
    next: { revalidate: 3600 },
  } as RequestInit);
}

/** POST /api/v1/reports/generate?domain=&yearMonth= */
export async function generateReport(domain: string, yearMonth: string): Promise<MonthlyReport> {
  const query = buildQuery({ domain, yearMonth });
  return apiFetch<MonthlyReport>(`/api/v1/reports/generate${query}`, {
    method: 'POST',
    cache: 'no-store',
  });
}

/** POST /api/v1/crawl/trigger?domain= */
export async function triggerCrawl(domain: string): Promise<CrawlResult> {
  const query = buildQuery({ domain });
  return apiFetch<CrawlResult>(`/api/v1/crawl/trigger${query}`, {
    method: 'POST',
    cache: 'no-store',
  });
}
