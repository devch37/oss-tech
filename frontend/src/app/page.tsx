import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Database,
  FileText,
  FolderGit2,
  Package,
  Sparkles,
  Star,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { getDomains, getLibraries, getRepositories, getReports } from '@/lib/api-client';
import { resolveDomain, resolveMonth } from '@/lib/server';
import { getDomainMeta } from '@/lib/domains';
import {
  cn,
  formatGrowthRate,
  formatMonth,
  formatNumber,
  formatRelative,
  getScoreGrade,
  isNewLibrary,
} from '@/lib/utils';
import type { Library } from '@/types/api';
import { StatTile } from '@/components/StatTile';
import { LibraryRow } from '@/components/LibraryRow';
import { ActiveLevelBadge } from '@/components/ActiveLevelBadge';
import { EmptyState } from '@/components/EmptyState';
import { ErrorCard } from '@/components/ErrorBoundary';
import { SectionTitle } from '@/components/PageHeader';
import { CrawlButton } from '@/components/ActionButtons';
import { ActivityScatterChart } from '@/components/charts/ActivityScatterChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ─── Summary sentence ─────────────────────────────────────────────────────────

function buildHeadline(label: string, top: Library | undefined, rising: Library | undefined) {
  if (rising) {
    return (
      <>
        이번 달 <b className="text-foreground">{label}</b> 분야에서 가장 빠르게 성장한 라이브러리는{' '}
        <span className="text-gradient font-bold">{rising.libraryName}</span>
        <span className="font-semibold text-success"> ({formatGrowthRate(rising.growthRate)})</span> 이에요.
        {top && top.libraryName !== rising.libraryName && (
          <>
            {' '}가장 많이 쓰이는 라이브러리는 <b className="text-foreground">{top.libraryName}</b> 입니다.
          </>
        )}
      </>
    );
  }
  if (top) {
    return (
      <>
        이번 달 <b className="text-foreground">{label}</b> 분야에서 가장 많이 쓰이는 라이브러리는{' '}
        <span className="text-gradient font-bold">{top.libraryName}</span> 이에요.
      </>
    );
  }
  return null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage({ searchParams }: { searchParams: { domain?: string } }) {
  const domain = resolveDomain(searchParams.domain);
  const meta = getDomainMeta(domain);
  const { month, hasData } = await resolveMonth(domain);

  const [domainsRes, libsRes, reposRes, reportsRes] = await Promise.allSettled([
    getDomains(),
    hasData ? getLibraries({ domain, month, size: 200 }) : Promise.resolve(null),
    getRepositories({ domain, sort: 'score', size: 30 }),
    getReports(domain),
  ]);

  const domains = domainsRes.status === 'fulfilled' ? domainsRes.value : [];
  const libraries = libsRes.status === 'fulfilled' ? (libsRes.value?.content ?? []) : null;
  const repositories = reposRes.status === 'fulfilled' ? reposRes.value.content : null;
  const reports = reportsRes.status === 'fulfilled' ? reportsRes.value : [];
  const backendDown = domainsRes.status === 'rejected' && reposRes.status === 'rejected';

  const repoCount = Number(domains.find((d) => d.domain === domain)?.repositoryCount ?? 0);
  const libs = libraries ?? [];
  const byUsage = [...libs].sort((a, b) => b.usageCount - a.usageCount);
  const rising = libs
    .filter((l) => l.growthRate > 0 && !isNewLibrary(l))
    .sort((a, b) => b.growthRate - a.growthRate || b.usageCount - a.usageCount);
  const newcomers = libs.filter(isNewLibrary).sort((a, b) => b.usageCount - a.usageCount);
  const falling = libs.filter((l) => l.growthRate < 0).sort((a, b) => a.growthRate - b.growthRate);
  const top10 = byUsage.slice(0, 10);
  const repos = repositories ?? [];
  const activeTop = repos.slice(0, 5);
  const veryActive = repos.filter((r) => getScoreGrade(r.score) === 'S').length;
  const latestReport = reports[0];
  const maxUsage = top10[0]?.usageCount ?? 0;
  const DomainIcon = meta.icon;

  if (backendDown) {
    return <ErrorCard message="서버에 연결할 수 없어요." className="min-h-[50vh]" />;
  }

  // ─── 데이터가 없을 때: 온보딩 ────────────────────────────────────────────────
  if (!hasData && repos.length === 0) {
    return (
      <div className="mx-auto max-w-2xl animate-fade-up space-y-6 py-6">
        <EmptyState
          icon={Database}
          title={`${meta.label} 분야 데이터가 아직 없어요`}
          description={
            <>
              GitHub 에서 <b>{meta.label}</b> 관련 인기 프로젝트 30개를 수집하고, 각 프로젝트가 쓰는 라이브러리를
              분석합니다. 수집은 매일 새벽 3시에 자동으로 실행되며, 지금 바로 시작할 수도 있어요.
            </>
          }
          action={<CrawlButton domain={domain} size="lg" />}
        />
        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            ['1', '프로젝트 수집', 'GitHub 토픽별 인기 저장소'],
            ['2', '의존성 분석', 'package.json · pom.xml 등 5종'],
            ['3', '트렌드 계산', '사용량 · 성장률 · 활성도'],
          ].map(([n, t, d]) => (
            <li key={n} className="rounded-2xl border bg-card p-4 shadow-soft">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {n}
              </span>
              <p className="mt-2 text-sm font-semibold">{t}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const headline = buildHeadline(meta.label, byUsage[0], rising[0]);

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative animate-fade-up overflow-hidden rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div
          className={cn(
            'pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gradient-to-br opacity-20 blur-3xl',
            meta.gradient,
          )}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-2.5 py-1 text-white',
                  meta.gradient,
                )}
              >
                <DomainIcon className="h-3.5 w-3.5" />
                {meta.label}
              </span>
              <span className="rounded-full border px-2.5 py-1 text-muted-foreground">
                {formatMonth(month)} 기준
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">
              {meta.label} 분야, 이번 달 이렇게 움직였어요
            </h1>
            {headline && <p className="text-[15px] leading-relaxed text-muted-foreground">{headline}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/libraries?domain=${domain}`}>
                전체 랭킹 보기 <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {latestReport && (
              <Button asChild variant="outline">
                <Link href={`/reports/${latestReport.id}`}>
                  <Sparkles className="h-4 w-4" /> AI 리포트
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── KPI ──────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatTile
          label="분석한 프로젝트"
          value={formatNumber(repoCount)}
          hint="GitHub 인기 저장소"
          icon={FolderGit2}
          info={`GitHub 에서 '${meta.label}' 토픽으로 검색한 Star 순 상위 프로젝트 수예요.`}
        />
        <StatTile
          label="추적 중인 라이브러리"
          value={formatNumber(libs.length)}
          hint="의존성 파일 기준"
          icon={Package}
          iconClass="bg-chart-2/10 text-chart-2"
          info="분석한 프로젝트들의 package.json · build.gradle · pom.xml · requirements.txt 에 등장한 라이브러리 수예요."
        />
        <StatTile
          label="새로 등장"
          value={formatNumber(newcomers.length)}
          hint={newcomers[0] ? `예: ${newcomers[0].libraryName}` : '지난달 대비'}
          icon={Sparkles}
          iconClass="bg-chart-5/10 text-chart-5"
          info="지난달에는 아무 프로젝트도 쓰지 않았는데, 이번 달 처음 등장한 라이브러리 수예요."
        />
        <StatTile
          label="매우 활발한 프로젝트"
          value={formatNumber(veryActive)}
          hint="S 등급 (활성도 50점 이상)"
          icon={Zap}
          iconClass="bg-chart-4/10 text-chart-4"
          info="최근 30일 커밋·PR·이슈 처리량을 프로젝트 규모(Star)로 보정한 활성도 점수가 50점 이상인 프로젝트예요."
        />
      </section>

      {/* ─── Movers ───────────────────────────────────────────────────────── */}
      {libraries === null ? (
        <ErrorCard message="라이브러리 데이터를 불러오지 못했어요." />
      ) : (
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <SectionTitle
                icon="🏆"
                title="가장 많이 쓰는 라이브러리"
                description="분석한 프로젝트 중 몇 개가 사용하는지 · 오른쪽 %는 채택률"
                action={
                  <Link
                    href={`/libraries?domain=${domain}`}
                    className="shrink-0 text-xs font-medium text-primary hover:underline"
                  >
                    전체 보기
                  </Link>
                }
              />
            </CardHeader>
            <CardContent className="grid gap-x-8 sm:grid-cols-2">
              {top10.length ? (
                top10.map((lib, i) => (
                  <LibraryRow key={lib.libraryName} lib={lib} domain={domain} rank={i + 1} max={maxUsage} repoCount={repoCount} />
                ))
              ) : (
                <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">데이터가 없어요.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle icon="🔥" title="급상승" description="지난달보다 사용 프로젝트가 늘어난 순" />
            </CardHeader>
            <CardContent>
              {rising.length ? (
                rising.slice(0, 6).map((lib, i) => (
                  <LibraryRow key={lib.libraryName} lib={lib} domain={domain} rank={i + 1} />
                ))
              ) : (
                <EmptyState compact icon={Activity} title="급상승 라이브러리가 없어요" description="두 달 이상 데이터가 쌓이면 표시돼요." />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SectionTitle icon="✨" title="이번 달 새로 등장" description="지난달엔 없었는데 이번 달 처음 쓰이기 시작한 라이브러리" />
            </CardHeader>
            <CardContent>
              {newcomers.length ? (
                <div className="flex flex-wrap gap-2">
                  {newcomers.slice(0, 18).map((lib) => (
                    <Link
                      key={lib.libraryName}
                      href={`/libraries/${encodeURIComponent(lib.libraryName)}?domain=${domain}`}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 font-mono text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      {lib.libraryName}
                      <span className="rounded-full bg-muted px-1.5 font-sans text-[10px] text-muted-foreground">
                        {lib.usageCount}
                      </span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">이번 달 새로 등장한 라이브러리가 없어요.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle icon="📉" title="주춤한 라이브러리" description="지난달보다 사용이 줄어든 순" />
            </CardHeader>
            <CardContent>
              {falling.length ? (
                falling.slice(0, 5).map((lib) => <LibraryRow key={lib.libraryName} lib={lib} domain={domain} />)
              ) : (
                <EmptyState compact icon={TrendingDown} title="감소한 라이브러리가 없어요" />
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ─── Repositories + Report ────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <SectionTitle
              icon="📊"
              title="프로젝트 활성도 분포"
              description="오른쪽일수록 인기(Star)가 많고, 위쪽일수록 최근 개발이 활발해요"
            />
          </CardHeader>
          <CardContent>
            {repositories === null ? (
              <ErrorCard message="프로젝트 데이터를 불러오지 못했어요." className="h-72" />
            ) : repos.length ? (
              <ActivityScatterChart repositories={repos} className="h-72 w-full" />
            ) : (
              <EmptyState icon={Activity} title="활성도 데이터가 없어요" className="h-72" />
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card className="flex-1">
            <CardHeader>
              <SectionTitle
                icon="⚡"
                title="가장 활발한 프로젝트"
                action={
                  <Link href={`/repositories?domain=${domain}`} className="shrink-0 text-xs font-medium text-primary hover:underline">
                    전체 보기
                  </Link>
                }
              />
            </CardHeader>
            <CardContent className="space-y-1">
              {activeTop.length ? (
                activeTop.map((r, i) => (
                  <a
                    key={r.id}
                    href={`https://github.com/${r.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
                  >
                    <span className="w-5 text-center text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                    <img
                      src={`https://github.com/${r.owner}.png?size=40`}
                      alt=""
                      className="h-7 w-7 rounded-lg border bg-muted"
                      loading="lazy"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium group-hover:text-primary">{r.fullName}</span>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Star className="h-3 w-3" /> {formatNumber(r.stars)}
                        {r.language && <> · {r.language}</>}
                      </span>
                    </span>
                    <ActiveLevelBadge score={r.score} />
                  </a>
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">데이터가 없어요.</p>
              )}
            </CardContent>
          </Card>

          {latestReport ? (
            <Link
              href={`/reports/${latestReport.id}`}
              className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-chart-2/10 p-5 shadow-soft transition-shadow hover:shadow-lift"
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> 최신 AI 리포트
              </p>
              <p className="mt-2 text-base font-semibold">
                {formatMonth(latestReport.reportMonth)} {meta.label} 트렌드 분석
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{formatRelative(latestReport.generatedAt)} 발행</p>
              <ArrowRight className="absolute bottom-5 right-5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ) : (
            <Link
              href={`/reports?domain=${domain}`}
              className="flex items-center gap-3 rounded-2xl border border-dashed p-5 text-sm text-muted-foreground transition-colors hover:bg-muted/40"
            >
              <FileText className="h-5 w-5" />
              <span className="flex-1">아직 AI 리포트가 없어요. 만들어 볼까요?</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
