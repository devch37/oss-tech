import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { ThemeProvider } from 'next-themes';
import { DomainProvider } from '@/contexts/DomainContext';
import { DesktopSidebar, MobileTabBar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { CommandPalette } from '@/components/CommandPalette';
import { DEFAULT_DOMAIN, DOMAIN_COOKIE, isKnownDomain } from '@/lib/domains';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Tech-Radar · GitHub 오픈소스 트렌드',
    template: '%s · Tech-Radar',
  },
  description:
    'GitHub 인기 오픈소스 프로젝트를 매일 분석해 지금 뜨는 라이브러리와 활발한 프로젝트를 한눈에 보여줍니다.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieDomain = cookies().get(DOMAIN_COOKIE)?.value;
  const initialDomain = isKnownDomain(cookieDomain) ? cookieDomain : DEFAULT_DOMAIN;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-glow min-h-screen bg-no-repeat">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <DomainProvider initialDomain={initialDomain}>
            <div className="flex min-h-screen">
              <DesktopSidebar />
              <div className="flex min-w-0 flex-1 flex-col">
                <Header />
                <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-6 lg:px-8 lg:pb-12 lg:pt-8">
                  {children}
                </main>
              </div>
            </div>
            <MobileTabBar />
            <CommandPalette />
          </DomainProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
