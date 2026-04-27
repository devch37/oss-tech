import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Calendar, Clock, ChevronLeft } from 'lucide-react';
import { getReport, getReports } from '@/lib/api-client';
import { formatMonth, formatDateTime } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ShareButton } from '@/components/ShareButton';
import { Separator } from '@/components/ui/separator';
import type { ReportMeta } from '@/types/api';

// ─── Domain color ─────────────────────────────────────────────────────────────

const DOMAIN_COLORS: Record<string, string> = {
  frontend: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  backend: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  devops: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  mobile: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  data: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  security: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

function domainColor(domain: string): string {
  return (
    DOMAIN_COLORS[domain.toLowerCase()] ??
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  );
}

// ─── Prev / Next helper ───────────────────────────────────────────────────────

function findAdjacentReports(
  reports: ReportMeta[],
  currentId: number,
): { prev: ReportMeta | null; next: ReportMeta | null } {
  // getReports → reportMonth DESC 정렬 (최신이 앞)
  const idx = reports.findIndex((r) => r.id === currentId);
  if (idx === -1) return { prev: null, next: null };
  return {
    next: idx > 0 ? (reports[idx - 1] ?? null) : null,    // 더 최신
    prev: idx < reports.length - 1 ? (reports[idx + 1] ?? null) : null, // 더 오래된
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  // 현재 리포트 + 같은 도메인 리포트 목록 병렬 조회
  const report = await getReport(id).catch(() => null);
  if (!report) notFound();

  const sameDomainReports = await getReports(report.domain).catch(() => []);
  const { prev, next } = findAdjacentReports(sameDomainReports, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ─── Back link ─────────────────────────────────────────────────────── */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        리포트 목록으로
      </Link>

      {/* ─── Report Header ──────────────────────────────────────────────────── */}
      <header className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${domainColor(report.domain)}`}
          >
            {report.domain}
          </span>
          <span className="text-xs text-muted-foreground">AI 월간 트렌드 리포트</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          {formatMonth(report.reportMonth)} {report.domain} 도메인 트렌드 분석
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formatMonth(report.reportMonth)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            생성: {formatDateTime(report.generatedAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <ShareButton />
        </div>
      </header>

      {/* ─── Report Content (Markdown) ──────────────────────────────────────── */}
      <article className="rounded-xl border bg-card p-6 shadow-sm lg:p-10">
        <MarkdownRenderer content={report.content} />
      </article>

      {/* ─── Prev / Next Navigation ─────────────────────────────────────────── */}
      <Separator />
      <nav className="grid gap-3 sm:grid-cols-2" aria-label="리포트 네비게이션">
        {/* 이전 (더 오래된) */}
        {prev ? (
          <Link
            href={`/reports/${prev.id}`}
            className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
          >
            <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">이전 리포트</p>
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {formatMonth(prev.reportMonth)} {prev.domain}
              </p>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed p-4 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">더 오래된 리포트가 없습니다</p>
          </div>
        )}

        {/* 다음 (더 최신) */}
        {next ? (
          <Link
            href={`/reports/${next.id}`}
            className="group flex items-center justify-end gap-3 rounded-xl border bg-card p-4 shadow-sm hover:border-primary/40 hover:shadow-md transition-all text-right sm:col-start-2"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">다음 리포트</p>
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {formatMonth(next.reportMonth)} {next.domain}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed p-4 flex items-center justify-center sm:col-start-2">
            <p className="text-xs text-muted-foreground">더 최신 리포트가 없습니다</p>
          </div>
        )}
      </nav>
    </div>
  );
}
