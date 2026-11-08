import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Hash, LineChart, Percent, TrendingUp, Users } from 'lucide-react';
import { getDomains, getLibraries, getLibraryTrend } from '@/lib/api-client';
import { resolveDomain, resolveMonth } from '@/lib/server';
import { getDomainMeta } from '@/lib/domains';
import { formatGrowthRate, formatMonth, formatNumber, isNewLibrary, libraryLinks } from '@/lib/utils';
import { TrendAreaChart } from '@/components/charts/TrendAreaChart';
import { GrowthBadge } from '@/components/GrowthBadge';
import { StatTile } from '@/components/StatTile';
import { LibraryRow } from '@/components/LibraryRow';
import { EmptyState } from '@/components/EmptyState';
import { SectionTitle } from '@/components/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function generateMetadata({ params }: { params: { name: string } }): Metadata {
  return { title: decodeURIComponent(params.name) };
}

export default async function LibraryDetailPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { domain?: string };
}) {
  const libraryName = decodeURIComponent(params.name);
  const domain = resolveDomain(searchParams.domain);
  const meta = getDomainMeta(domain);
  const { month, hasData } = await resolveMonth(domain);

  const [trend, libsRes, domains] = await Promise.all([
    getLibraryTrend(libraryName, domain).catch(() => null),
    hasData ? getLibraries({ domain, month, size: 500 }).catch(() => null) : Promise.resolve(null),
    getDomains().catch(() => []),
  ]);

  const all = [...(libsRes?.content ?? [])].sort((a, b) => b.usageCount - a.usageCount);
  const rankIdx = all.findIndex((l) => l.libraryName === libraryName);
  const current = rankIdx >= 0 ? all[rankIdx] : undefined;
  const repoCount = Number(domains.find((d) => d.domain === domain)?.repositoryCount ?? 0);
  const adoption = current && repoCount ? Math.round((current.usageCount / repoCount) * 100) : null;
  const points = trend?.trend ?? [];
  const peers = all.filter((l) => l.libraryName !== libraryName).slice(0, 8);

  // 6개월 변화 요약
  const first = points[0];
  const last = points[points.length - 1];
  const sixMonthDelta = first && last && points.length > 1 ? last.usageCount - first.usageCount : null;

  return (
    <div className="space-y-6">
      <Link
        href={`/libraries?domain=${domain}`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        라이브러리 랭킹
      </Link>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <section className="animate-fade-up rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className={`rounded-full px-2.5 py-1 ring-1 ring-inset ${meta.badge}`}>{meta.label}</span>
          <span>{formatMonth(month)} 기준</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="break-all font-mono text-2xl font-bold tracking-tight sm:text-3xl">{libraryName}</h1>
          {current && <GrowthBadge rate={current.growthRate} isNew={isNewLibrary(current)} size="md" />}
        </div>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          {current ? (
            <>
              {meta.label} 분야 프로젝트 <b className="text-foreground">{formatNumber(repoCount)}개</b> 중{' '}
              <b className="text-foreground">{formatNumber(current.usageCount)}개</b>가 사용하고 있어요
              {rankIdx >= 0 && <> · 전체 <b className="text-foreground">{rankIdx + 1}위</b></>}.
            </>
          ) : (
            <>이번 달 {meta.label} 분야 프로젝트에서는 사용이 확인되지 않았어요.</>
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {libraryLinks(libraryName).map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary"
            >
              {l.label}
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          ))}
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      {current && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatTile
            label="사용 프로젝트"
            value={`${formatNumber(current.usageCount)}개`}
            hint={`지난달 ${formatNumber(current.prevMonthCount)}개`}
            icon={Users}
            info="이번 달 분석한 프로젝트 중 이 라이브러리를 의존성으로 가진 프로젝트 수예요."
          />
          <StatTile
            label="분야 내 순위"
            value={`${rankIdx + 1}위`}
            hint={`${formatNumber(all.length)}개 중`}
            icon={Hash}
            iconClass="bg-chart-4/10 text-chart-4"
            info="사용 프로젝트 수 기준 순위예요."
          />
          <StatTile
            label="채택률"
            value={adoption !== null ? `${adoption}%` : '—'}
            hint="분석 프로젝트 대비"
            icon={Percent}
            iconClass="bg-chart-2/10 text-chart-2"
            info="사용 프로젝트 ÷ 분석한 전체 프로젝트. 높을수록 이 분야의 '표준' 도구예요."
          />
          <StatTile
            label="지난달 대비"
            value={isNewLibrary(current) ? 'NEW' : formatGrowthRate(current.growthRate)}
            hint={isNewLibrary(current) ? '이번 달 처음 등장' : '사용 프로젝트 증감'}
            icon={TrendingUp}
            iconClass="bg-success/10 text-success"
            info="(이번 달 − 지난달) ÷ 지난달 × 100"
          />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <SectionTitle
              icon="📈"
              title="최근 6개월 사용 추이"
              description={
                sixMonthDelta !== null
                  ? `${formatMonth(first!.month)} 이후 ${sixMonthDelta >= 0 ? '+' : ''}${formatNumber(sixMonthDelta)}개 프로젝트`
                  : '월별 사용 프로젝트 수'
              }
            />
          </CardHeader>
          <CardContent>
            {points.length > 1 ? (
              <TrendAreaChart data={points} className="h-72 w-full" />
            ) : (
              <EmptyState
                icon={LineChart}
                title={points.length === 1 ? '아직 한 달치 데이터만 있어요' : '추이 데이터가 없어요'}
                description="매일 수집이 쌓이면 다음 달부터 추이 그래프가 그려져요."
                className="h-72"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle icon="🧭" title={`${meta.label} 인기 라이브러리`} description="같은 분야에서 많이 쓰는 다른 라이브러리" />
          </CardHeader>
          <CardContent>
            {peers.length ? (
              peers.map((lib) => <LibraryRow key={lib.libraryName} lib={lib} domain={domain} />)
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">데이터가 없어요.</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
