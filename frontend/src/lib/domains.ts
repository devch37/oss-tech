import { Code2, Database, Layout, Server, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react';

export interface DomainMeta {
  value: string;
  label: string;
  /** 한 줄 설명 — 비개발자도 이해할 수 있게 */
  description: string;
  icon: LucideIcon;
  /** 배지 클래스 (JIT 안전: 전체 문자열) */
  badge: string;
  /** 아이콘 배경 그라데이션 */
  gradient: string;
}

export const DOMAINS: DomainMeta[] = [
  {
    value: 'frontend',
    label: 'Frontend',
    description: '웹 화면·UI 를 만드는 기술',
    icon: Layout,
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 ring-indigo-500/20',
    gradient: 'from-indigo-500 to-violet-500',
  },
  {
    value: 'backend',
    label: 'Backend',
    description: '서버·API·데이터 처리 기술',
    icon: Server,
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-violet-500/20',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  {
    value: 'devops',
    label: 'DevOps',
    description: '배포·인프라·자동화 도구',
    icon: Code2,
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    value: 'mobile',
    label: 'Mobile',
    description: 'iOS·Android 앱 개발 기술',
    icon: Smartphone,
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    value: 'data',
    label: 'Data / AI',
    description: '데이터 분석·머신러닝 기술',
    icon: Database,
    badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/20',
    gradient: 'from-cyan-500 to-sky-500',
  },
  {
    value: 'security',
    label: 'Security',
    description: '보안·취약점 분석 도구',
    icon: ShieldCheck,
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20',
    gradient: 'from-rose-500 to-pink-500',
  },
];

export const DEFAULT_DOMAIN = 'frontend';
export const DOMAIN_COOKIE = 'oss-domain';

const FALLBACK: DomainMeta = {
  value: 'unknown',
  label: 'Unknown',
  description: '',
  icon: Code2,
  badge: 'bg-muted text-muted-foreground ring-border',
  gradient: 'from-zinc-500 to-zinc-600',
};

export function isKnownDomain(value: string | null | undefined): value is string {
  return !!value && DOMAINS.some((d) => d.value === value);
}

export function getDomainMeta(value: string): DomainMeta {
  return DOMAINS.find((d) => d.value === value.toLowerCase()) ?? { ...FALLBACK, value, label: value };
}
