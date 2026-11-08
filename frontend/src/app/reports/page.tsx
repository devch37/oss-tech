import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Clock, FileText } from 'lucide-react';
import { getReport, getReports } from '@/lib/api-client';
import { resolveDomain, resolveMonth } from '@/lib/server';
import { DOMAINS, getDomainMeta } from '@/lib/domains';
import { cn, formatMonth, formatRelative } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { GenerateReportButton } from '@/components/ActionButtons';
import type { ReportMeta } from '@/types/api';

export const metadata: Metadata = { title: 'AI 월간 리포트' };

function extractPreview(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/^\s*\|.*$/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_~>|#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s\S*$/, '') + '…';
}

interface CardData extends ReportMeta {
  preview: string | null;
}

function ReportCard({ report, featured }: { report: CardData; featured?: boolean }) {
  const meta = getDomainMeta(report.domain);
  const Icon = meta.icon;
  return (
    <Link
      href={`/reports/${report.id}`}
      className={cn(
        'group relative flex flex-col gap-3 overflow-hidden rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift',
        featured && 'sm:col-span-2 sm:p-7',
      )}
    >
      {featured && (
        <div className={cn('pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br opacity-15 blur-3xl', meta.gradient)} />
      )}
      <div className="relative flex items-center justify-between gap-2">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', meta.badge)}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className={cn('relative font-semibold leading-snug group-hover:text-primary', featured ? 'text-xl sm:text-2xl' : 'text-base')}>
        {formatMonth(report.reportMonth)} {meta.label} 트렌드 리포트
      </h3>
      {report.preview && (
        <p className={cn('relative text-sm leading-relaxed text-muted-foreground', featured ? 'line-clamp-3' : 'line-clamp-2')}>
          {report.preview}
        </p>
      )}
      <p className="relative mt-auto flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatRelative(report.generatedAt)} 발행
      </p>
    </Link>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { domain?: string; scope?: string };
}) {
  const domain = resolveDomain(searchParams.domain);
  const meta = getDomainMeta(domain);
  const showAll = searchParams.scope === 'all';

  const targets = showAll ? DOMAINS.map((d) => d.value) : [domain];
  const metaResults = await Promise.allSettled(targets.map((d) => getReports(d)));
  const metas = metaResults
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => b.reportMonth.localeCompare(a.reportMonth) || b.generatedAt.localeCompare(a.generatedAt));

  const withPreview = metas.slice(0, 9);
  const contents = await Promise.allSettled(withPreview.map((m) => getReport(m.id)));
  const cards: CardData[] = metas.map((m, i) => {
    const c = i < contents.length ? contents[i] : undefined;
    return { ...m, preview: c?.status === 'fulfilled' ? extractPreview(c.value.content) : null };
  });

  const { month } = showAll ? { month: '' } : await resolveMonth(domain);

  const tabClass = (active: boolean) =>
    cn(
      'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all',
      active ? 'bg-card text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground',
    );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<span>Claude AI 분석</span>}
        title="AI 월간 리포트"
        description="한 달간 쌓인 데이터를 Claude AI 가 읽고, 무엇이 뜨고 왜 중요한지 사람이 읽기 쉬운 글로 정리했어요. 매월 1일 자동 발행돼요."
        actions={
          <div className="inline-flex rounded-xl border bg-muted/50 p-1">
            <Link href={`/reports?domain=${domain}`} className={tabClass(!showAll)}>
              {meta.label}
            </Link>
            <Link href={`/reports?domain=${domain}&scope=all`} className={tabClass(showAll)}>
              모든 분야
            </Link>
          </div>
        }
      />

      {cards.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={showAll ? '아직 발행된 리포트가 없어요' : `${meta.label} 분야 리포트가 아직 없어요`}
          description={
            showAll
              ? '분야를 선택한 뒤 리포트를 직접 만들어 볼 수 있어요.'
              : `${formatMonth(month)} 수집 데이터를 바탕으로 지금 바로 만들 수 있어요. (서버에 CLAUDE_API_KEY 가 필요해요)`
          }
          action={!showAll ? <GenerateReportButton domain={domain} yearMonth={month} /> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((r, i) => (
            <ReportCard key={r.id} report={r} featured={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
