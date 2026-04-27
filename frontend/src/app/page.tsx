import { GitFork, Package, TrendingUp, FileText } from 'lucide-react';
import { getDomains, getLibraries, getRepositories, getReports } from '@/lib/api-client';
import { formatMonth, formatDateTime, formatNumber } from '@/lib/utils';
import { StatCard } from '@/components/StatCard';
import { GrowthBadge } from '@/components/GrowthBadge';
import { ErrorCard } from '@/components/ErrorBoundary';
import { LibraryBarChart } from '@/components/charts/LibraryBarChart';
import { ActivityScatterChart } from '@/components/charts/ActivityScatterChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchDashboardData(domain: string, month: string) {
  // 모든 요청을 병렬 실행하고 개별 실패를 graceful degradation으로 처리
  const [domainsResult, librariesResult, repositoriesResult, reportsResult] =
    await Promise.allSettled([
      getDomains(),
      getLibraries({ domain, month, size: 20 }),
      getRepositories({ domain, sort: 'score', size: 20 }),
      getReports(domain),
    ]);

  return {
    domains: domainsResult.status === 'fulfilled' ? domainsResult.value : [],
    libraries:
      librariesResult.status === 'fulfilled' ? librariesResult.value.content : null,
    repositories:
      repositoriesResult.status === 'fulfilled' ? repositoriesResult.value.content : null,
    reports: reportsResult.status === 'fulfilled' ? reportsResult.value : [],
    errors: {
      libraries: librariesResult.status === 'rejected',
      repositories: repositoriesResult.status === 'rejected',
      reports: reportsResult.status === 'rejected',
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({
  searchParams,
}: {
  searchParams: { domain?: string };
}) {
  const domain = searchParams.domain ?? 'frontend';
  const month = currentYearMonth();

  const { domains, libraries, repositories, reports, errors } = await fetchDashboardData(
    domain,
    month,
  );

  // ── Derived values ───────────────────────────────────────────────────────────

  const domainInfo = domains.find((d) => d.domain === domain);
  const repoCount = Number(domainInfo?.repositoryCount ?? 0);

  const sortedLibraries = (libraries ?? []).slice().sort((a, b) => b.usageCount - a.usageCount);
  const libraryCount = sortedLibraries.length;

  const rising = (libraries ?? [])
    .filter((l) => l.growthRate > 0)
    .sort((a, b) => b.growthRate - a.growthRate);
  const topRising = rising[0]; // noUncheckedIndexedAccess → Library | undefined
  const top5Rising = rising.slice(0, 5);

  const top10Libraries = sortedLibraries.slice(0, 10);
  const latestReport = reports[0]; // ReportMeta | undefined

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ─── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            <span className="font-medium capitalize">{domain}</span> 도메인
          </p>
        </div>
        <div className="rounded-lg border bg-muted/50 px-3 py-1.5 text-sm font-medium">
          이번 달: {formatMonth(month)}
        </div>
      </div>

      {/* ─── Stat Cards ────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 수집 레포지토리 수 */}
        <StatCard title="수집 레포지토리" value={repoCount} icon={GitFork} />

        {/* 분석 라이브러리 수 */}
        <StatCard title="분석 라이브러리" value={libraryCount} icon={Package} />

        {/* 급상승 라이브러리 — 이름 + 증감률 표시 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              급상승 라이브러리
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {topRising ? (
              <>
                <p className="truncate text-lg font-bold" title={topRising.libraryName}>
                  {topRising.libraryName}
                </p>
                <div className="mt-1">
                  <GrowthBadge rate={topRising.growthRate} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {errors.libraries ? '데이터 로드 실패' : '데이터 없음'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI 리포트 생성일 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">AI 리포트</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {latestReport ? (
              <>
                <p className="font-bold">{formatMonth(latestReport.reportMonth)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  생성: {formatDateTime(latestReport.generatedAt)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {errors.reports ? '데이터 로드 실패' : '리포트 없음'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 급상승 TOP 5 BarChart ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 이번 달 급상승 TOP 5</CardTitle>
          <CardDescription>
            {formatMonth(month)} 기준 전월 대비 증가율 상위 라이브러리
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.libraries ? (
            <ErrorCard message="라이브러리 데이터를 불러오지 못했습니다." className="h-52" />
          ) : top5Rising.length > 0 ? (
            <LibraryBarChart data={top5Rising} className="h-52 w-full" />
          ) : (
            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
              이번 달 급상승 라이브러리 데이터가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 라이브러리 순위표 + Activity ScatterChart ──────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 라이브러리 순위표 */}
        <Card>
          <CardHeader>
            <CardTitle>라이브러리 순위</CardTitle>
            <CardDescription>
              {formatMonth(month)} 사용 빈도 상위 {top10Libraries.length}개
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {errors.libraries ? (
              <div className="p-6">
                <ErrorCard message="라이브러리 데이터를 불러오지 못했습니다." />
              </div>
            ) : top10Libraries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 pl-6">#</TableHead>
                    <TableHead>라이브러리</TableHead>
                    <TableHead className="text-right">사용 수</TableHead>
                    <TableHead className="pr-6 text-right">증감률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top10Libraries.map((lib, i) => (
                    <TableRow key={lib.libraryName}>
                      <TableCell className="pl-6 text-sm text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium">{lib.libraryName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(lib.usageCount)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <GrowthBadge rate={lib.growthRate} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                라이브러리 데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity ScatterChart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity 분석</CardTitle>
            <CardDescription>Stars vs Active Level Score 분포 (등급별 색상)</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.repositories ? (
              <ErrorCard
                message="레포지토리 데이터를 불러오지 못했습니다."
                className="h-72"
              />
            ) : (repositories ?? []).length > 0 ? (
              <ActivityScatterChart
                repositories={repositories ?? []}
                className="h-72 w-full"
              />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
                레포지토리 데이터가 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
