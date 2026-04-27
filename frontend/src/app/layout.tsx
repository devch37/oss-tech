import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { DomainProvider } from '@/contexts/DomainContext';
import { DesktopSidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'OSS Tech-Radar',
  description: 'GitHub OSS 트렌드 & Active Level 분석 대시보드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DomainProvider>
            <div className="flex min-h-screen">
              <DesktopSidebar />
              <div className="flex flex-1 flex-col min-w-0">
                <Header />
                <main className="flex-1 p-4 lg:p-6">{children}</main>
              </div>
            </div>
          </DomainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
