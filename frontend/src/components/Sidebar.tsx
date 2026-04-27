'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Library,
  GitFork,
  FileText,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: '대시보드', icon: LayoutDashboard },
  { href: '/libraries', label: '라이브러리 순위', icon: Library },
  { href: '/repositories', label: '레포지토리', icon: GitFork },
  { href: '/reports', label: '월간 리포트', icon: FileText },
];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-2 py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** 데스크탑 고정 사이드바 */
export function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-sidebar-border">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-bold text-base">OSS Tech-Radar</span>
      </div>
      <SidebarNav />
    </aside>
  );
}
