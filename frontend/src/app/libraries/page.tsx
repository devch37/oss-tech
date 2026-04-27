import { getLibraries } from '@/lib/api-client';
import { formatMonth } from '@/lib/utils';
import { LibraryListClient } from './LibraryListClient';

// ─── Month helpers ────────────────────────────────────────────────────────────

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLast6Months(): { value: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { value, label: formatMonth(value) };
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LibrariesPage({
  searchParams,
}: {
  searchParams: { domain?: string; month?: string };
}) {
  const domain = searchParams.domain ?? 'frontend';
  const months = getLast6Months();
  const defaultMonth = months[0]?.value ?? currentYearMonth();
  const month = months.some((m) => m.value === searchParams.month)
    ? (searchParams.month as string)
    : defaultMonth;

  // 클라이언트 필터링을 위해 한 번에 넉넉히 fetch (100개)
  const librariesData = await getLibraries({ domain, month, size: 100 }).catch(() => null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">라이브러리 순위</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="font-medium capitalize">{domain}</span> 도메인 · 월별 라이브러리 사용 현황
        </p>
      </div>

      <LibraryListClient
        libraries={librariesData?.content ?? []}
        months={months}
        currentMonth={month}
        domain={domain}
        fetchFailed={librariesData === null}
      />
    </div>
  );
}
