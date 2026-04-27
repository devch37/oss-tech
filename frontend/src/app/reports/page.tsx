import Link from 'next/link';
import { FileText, Calendar, Clock } from 'lucide-react';
import { getDomains, getReport, getReports } from '@/lib/api-client';
import { formatMonth, formatDateTime } from '@/lib/utils';
import { ErrorCard } from '@/components/ErrorBoundary';
import type { ReportMeta } from '@/types/api';

// ─── Preview extractor ────────────────────────────────────────────────────────

function extractPreview(markdown: string, maxLength = 180): string {
  const text = markdown
    .replace(/^#{1,6}\s+.+$/gm, '')                 // 제목 제거
    .replace(/!\[.*?\]\(.*?\)/g, '')                 // 이미지 제거
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')         // 링크 → 텍스트
    .replace(/```[\s\S]*?```/g, '')                  // 코드 블록 제거
    .replace(/`[^`]+`/g, '')                         // 인라인 코드 제거
    .replace(/[*_~>|]/g, '')                         // 마크다운 기호 제거
    .replace(/\n{2,}/g, '\n')                        // 빈 줄 정리
    .trim();

  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s\S*$/, '') + '…';
}

// ─── Domain color palette ─────────────────────────────────────────────────────

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

// ─── Report Card ──────────────────────────────────────────────────────────────

interface ReportCardData extends ReportMeta {
  preview: string | null;
}

function ReportCard({ report }: { report: ReportCardData }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="group block rounded-xl border bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
    >
      <div className="p-6 space-y-3">
        {/* 도메인 배지 + 월 */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${domainColor(report.domain)}`}
          >
            {report.domain}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatMonth(report.reportMonth)}
          </span>
        </div>

        {/* 리포트 제목 */}
        <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {formatMonth(report.reportMonth)} {report.domain} 도메인 AI 트렌드 리포트
        </h3>

        {/* 미리보기 텍스트 */}
        {report.preview ? (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {report.preview}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">미리보기를 불러오지 못했습니다.</p>
        )}

        {/* 생성 시각 */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Clock className="h-3 w-3" />
          {formatDateTime(report.generatedAt)}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  // 1. 전체 도메인 조회
  const domains = await getDomains().catch(() => []);

  if (domains.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">월간 AI 리포트</h1>
        <ErrorCard message="도메인 정보를 불러오지 못했습니다." />
      </div>
    );
  }

  // 2. 모든 도메인의 리포트 메타 병렬 조회
  const allMetasResults = await Promise.allSettled(
    domains.map((d) => getReports(d.domain)),
  );

  const allMetas: ReportMeta[] = allMetasResults
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

  // 3. 최신 12개 리포트 내용 조회 (미리보기 추출용)
  const recentMetas = allMetas.slice(0, 12);
  const contentResults = await Promise.allSettled(
    recentMetas.map((meta) => getReport(meta.id)),
  );

  const reportCards: ReportCardData[] = recentMetas.map((meta, i) => {
    const result = contentResults[i];
    const content = result?.status === 'fulfilled' ? result.value.content : null;
    return {
      ...meta,
      preview: content ? extractPreview(content) : null,
    };
  });

  // 도메인별 그룹핑
  const grouped = reportCards.reduce<Record<string, ReportCardData[]>>((acc, r) => {
    if (!acc[r.domain]) acc[r.domain] = [];
    acc[r.domain]!.push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          월간 AI 리포트
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Claude AI가 생성한 도메인별 월간 OSS 트렌드 분석 리포트
        </p>
      </div>

      {reportCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <FileText className="h-12 w-12 opacity-30" />
          <p className="text-sm">아직 생성된 리포트가 없습니다.</p>
        </div>
      ) : (
        /* 도메인별 섹션 */
        Object.entries(grouped).map(([domain, reports]) => (
          <section key={domain} className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold capitalize ${domainColor(domain)}`}
              >
                {domain}
              </span>
              <span className="text-sm text-muted-foreground">{reports.length}개 리포트</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
