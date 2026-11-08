import { Activity, BookOpen, FileText, Home, Package, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: '트렌드 한눈에', short: '홈', description: '이번 달 핵심 변화 요약', icon: Home },
  { href: '/libraries', label: '라이브러리 랭킹', short: '랭킹', description: '많이 쓰는·뜨는 라이브러리', icon: Package },
  { href: '/repositories', label: '프로젝트 활성도', short: '프로젝트', description: '얼마나 활발히 개발되는지', icon: Activity },
  { href: '/reports', label: 'AI 월간 리포트', short: '리포트', description: 'Claude 가 정리한 월간 분석', icon: FileText },
];

export const GUIDE_ITEM: NavItem = {
  href: '/guide',
  label: '이용 가이드',
  short: '가이드',
  description: '지표 읽는 법 · FAQ',
  icon: BookOpen,
};

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
