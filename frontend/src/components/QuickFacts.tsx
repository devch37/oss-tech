import type { ReactNode } from 'react';

export interface QuickFact {
  key: string;
  label: string;
  value: ReactNode;
  sub?: string;
  /** 같은 페이지의 섹션(#id)이나 다른 주소. 누르면 그 부분으로 이동한다. */
  href: string;
  tone?: 'trend' | 'star' | 'sea';
}

const TONE = { trend: 'text-trend-ink', star: 'text-signal-ink', sea: 'text-sea' } as const;

/**
 * 홈 맨 위의 "지금 가장 중요한 숫자 네 개". 읽는 데 3초면 충분하고, 누르면 자세한 섹션으로 내려간다.
 * 라벨(무엇인지) → 큰 값(얼마나) → 작은 설명(누구/무엇)의 순서가 네 칸 모두 같다.
 */
export function QuickFacts({ facts, columns = 4 }: { facts: QuickFact[]; columns?: 2 | 4 }) {
  return (
    <ul className={columns === 2 ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-2 gap-3 lg:grid-cols-4'}>
      {facts.map((f) => (
        <li key={f.key}>
          <a
            href={f.href}
            className="block h-full rounded-xl border border-border bg-card/60 px-3.5 py-3 transition-colors hover:border-foreground/30 hover:bg-card"
          >
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className={`mt-1 truncate font-mono text-xl font-semibold tabular-nums tracking-tight ${TONE[f.tone ?? 'trend']}`}>{f.value}</p>
            {f.sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{f.sub}</p>}
          </a>
        </li>
      ))}
    </ul>
  );
}
