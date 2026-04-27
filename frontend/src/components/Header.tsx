'use client';

import { Menu, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DomainSelector } from '@/components/DomainSelector';
import { SidebarNav } from '@/components/Sidebar';
import { useState } from 'react';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="다크모드 토글"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export function Header() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {/* 모바일 햄버거 */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="메뉴 열기">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="flex h-14 flex-row items-center gap-2 px-5 border-b">
            <Zap className="h-5 w-5 text-primary" />
            <SheetTitle className="font-bold text-base">OSS Tech-Radar</SheetTitle>
          </SheetHeader>
          <SidebarNav onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* 왼쪽 여백 (데스크탑에서 사이드바가 대체) */}
      <div className="flex-1" />

      {/* 오른쪽: 도메인 선택 + 다크모드 */}
      <DomainSelector className="w-[160px]" />
      <ThemeToggle />
    </header>
  );
}
