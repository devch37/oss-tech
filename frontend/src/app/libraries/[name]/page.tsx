import Link from 'next/link';
import { ArrowLeft, TrendingUp, GitFork, Package } from 'lucide-react';
import { getLibraries, getLibraryTrend, getRepositories } from '@/lib/api-client';
import { formatNumber, formatMonth, getScoreGrade, getScoreGradeColor } from '@/lib/utils';
import { TrendLineChart } from '@/components/charts/TrendLineChart';
import { GrowthBadge } from '@/components/GrowthBadge';
import { ActiveLevelBadge } from '@/components/ActiveLevelBadge';
import { ErrorCard } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Helper ───────────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LibraryDetailPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { domain?: string };
}) {
  const libraryName = decodeURIComponent(params.name);
  const domain = searchParams.domain ?? 'frontend';
  const month = currentYearMonth();

  // 병렬 fetch
  const [trendResult, librariesResult, repositoriesResult] = await Promise.allSettled([
    getLibraryTrend(libraryName, domain),
    getLibraries({ domain, month, size: 20 }),
    getRepositories({ domain, sort: 'score', size: 10 }),
  ]);

  const trend = trendResult.status === 'fulfilled' ? trendResult.value : null;
  const allLibraries =
    librariesResult.status === 'fulfilled' ? librariesResult.value.content : [];
  const repositories =
    repositoriesResult.status === 'fulfilled' ? repositoriesResult.value.content : [];

  // 이번 달 이 라이브러리 데이터
  const currentLibData = allLibraries.find((l) => l.libraryName === libraryName);

  // 공존하는 다른 라이브러리 TOP 10 (같은 도메인·월, 현재 라이브러리 제외)
  const coLibraries = allLibraries
    .filter((l) => l.libraryName !== libraryName)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <Link
          href={`/libraries?domain=${domain}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          라이브러리 목록으로
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight font-mono">{libraryName}</h1>
          {currentLibData && <GrowthBadge rate={currentLibData.growthRate} className="text-sm" />}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium capitalize">{domain}</span> 도메인 ·{' '}
          {currentLibData
            ? `${formatMonth(currentLibData.collectedMonth)} 기준 ${formatNumber(currentLibData.usageCount)}회 사용`
            : '이번 달 데이터 없음'}
        </p>
      </div>

      {/* ─── 통계 요약 ───────────────────────────────────────────────────────── */}
      {currentLibData && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">이번 달</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {formatNumber(currentLibData.usageCount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">사용 횟수</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">전월</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {formatNumber(currentLibData.prevMonthCount)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">사용 횟수</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">증감률</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <GrowthBadge rate={currentLibData.growthRate} className="text-2xl" />
              <p className="text-xs text-muted-foreground mt-1">전월 대비</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── 6개월 트렌드 차트 ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>6개월 사용량 트렌드</CardTitle>
          <CardDescription>월별 사용 횟수 추이</CardDescription>
        </CardHeader>
        <CardContent>
          {trend && trend.trend.length > 0 ? (
            <TrendLineChart
              data={trend.trend}
              libraryName={libraryName}
              className="h-64 w-full"
            />
          ) : (
            <ErrorCard
              message="트렌드 데이터를 불러오지 못했습니다."
              className="h-64"
            />
          )}
        </CardContent>
      </Card>

      {/* ─── 하단 2열 ────────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 이 도메인 Top 레포지토리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitFork className="h-4 w-4" />
              도메인 Top 레포지토리
            </CardTitle>
            <CardDescription>
              {domain} · Active Level Score 상위 레포지토리
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {repositories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">레포지토리</TableHead>
                    <TableHead className="text-right">Stars</TableHead>
                    <TableHead className="pr-6 text-right">등급</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repositories.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell className="pl-6">
                        <a
                          href={`https://github.com/${repo.fullName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {repo.fullName}
                        </a>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        ★ {formatNumber(repo.stars)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <ActiveLevelBadge score={repo.score} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6">
                <ErrorCard message="레포지토리 데이터가 없습니다." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 공존하는 다른 라이브러리 TOP 10 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              같은 도메인 TOP 라이브러리
            </CardTitle>
            <CardDescription>
              {formatMonth(month)} · {domain} 도메인 인기 라이브러리
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {coLibraries.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6 w-8">#</TableHead>
                    <TableHead>라이브러리</TableHead>
                    <TableHead className="text-right">사용 수</TableHead>
                    <TableHead className="pr-6 text-right">증감률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coLibraries.map((lib, i) => (
                    <TableRow
                      key={lib.libraryName}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/libraries/${encodeURIComponent(lib.libraryName)}?domain=${domain}`;
                      }}
                    >
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
              <div className="p-6">
                <ErrorCard message="라이브러리 데이터가 없습니다." />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
