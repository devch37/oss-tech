import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, ChevronLeft, Clock, Sparkles } from 'lucide-react';
import { getReport, getReports } from '@/lib/api-client';
import { getDomainMeta } from '@/lib/domains';
import { cn, formatDateTime, formatMonth } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ShareButton } from '@/components/ShareButton';
import type { ReportMeta } from '@/types/api';

export const metadata: Metadata = { title: 'AI 리포트' };

function findAdjacent(reports: ReportMeta[], id: number) {
  const idx = reports.findIndex((r) => r.id === id);
  if (idx === -1) return { prev: null, next: null };
  return {
    next: idx > 0 ? (reports[idx - 1] ?? null) : null,
    prev: idx < reports.length - 1 ? (reports[idx + 1] ?? null) : null,
  };
}

/** 한국어 기준 분당 ~500자 */
function readingMinutes(md: string): number {
  return Math.max(1, Math.round(md.replace(/\s+/g, '').length / 500));
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) notFound();

  const report = await getReport(id).catch(() => null);
  if (!report) notFound();

  const meta = getDomainMeta(report.domain);
  const Icon = meta.icon;
  const siblings = await getReports(report.domain).catch(() => []);
  const { prev, next } = findAdjacent(siblings, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/reports?domain=${report.domain}`}
        className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        리포트 목록
      </Link>

      <header className="relative animate-fade-up overflow-hidden rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div className={cn('pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gradient-to-br opacity-20 blur-3xl', meta.gradient)} />
        <div className="relative space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ring-inset', meta.badge)}>
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Claude AI 작성
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {formatMonth(report.reportMonth)} {meta.label} 트렌드 리포트
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {formatMonth(report.reportMonth)} 데이터
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {formatDateTime(report.generatedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" /> 약 {readingMinutes(report.content)}분
            </span>
          </div>
          <ShareButton />
        </div>
      </header>

      <article className="rounded-3xl border bg-card p-6 shadow-soft sm:p-10">
        <MarkdownRenderer content={report.content} />
      </article>

      <nav className="grid gap-3 sm:grid-cols-2" aria-label="리포트 이동">
        {prev ? (
          <Link
            href={`/reports/${prev.id}`}
            className="group flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition-all hover:border-primary/30 hover:shadow-lift"
          >
            <ArrowLeft className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">이전 리포트</p>
              <p className="truncate text-sm font-semibold">{formatMonth(prev.reportMonth)}</p>
            </div>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}
        {next && (
          <Link
            href={`/reports/${next.id}`}
            className="group flex items-center justify-end gap-3 rounded-2xl border bg-card p-4 text-right shadow-soft transition-all hover:border-primary/30 hover:shadow-lift"
          >
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">다음 리포트</p>
              <p className="truncate text-sm font-semibold">{formatMonth(next.reportMonth)}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        )}
      </nav>
    </div>
  );
}
