import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Bricolage_Grotesque, Instrument_Sans, Noto_Sans_KR } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from 'next-themes';
import { isLocale, routing } from '@/i18n/routing';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import '../globals.css';

// 제목·큰 숫자: 개성 있는 가변 그로테스크 / 본문·UI: 읽기 편한 휴머니스트 산세리프
const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
// 한글 글리프는 unicode-range 로 필요한 조각만 내려받는다 (영어 페이지에서는 로드되지 않음)
const korean = Noto_Sans_KR({ subsets: ['latin'], variable: '--font-ko', display: 'swap', preload: false });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    // 런타임 환경변수 — Docker 배포에서도 이미지를 다시 빌드하지 않고 지정할 수 있다 (NEXT_PUBLIC_* 는 빌드 시점에 굳는다)
    metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3033'),
    title: { default: t('title'), template: '%s · OSS Radar' },
    description: t('description'),
    openGraph: { title: t('title'), description: t('description'), locale: locale === 'ko' ? 'ko_KR' : 'en_US', type: 'website' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  setRequestLocale(locale);

  const [messages, nav] = await Promise.all([getMessages(), getTranslations({ locale, namespace: 'nav' })]);

  return (
    <html lang={locale} suppressHydrationWarning className={`${display.variable} ${body.variable} ${korean.variable}`}>
      <body className="min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
            >
              {nav('skipToContent')}
            </a>
            {/* SiteHeader 가 useSearchParams 를 쓰므로 Suspense 경계가 필요하다 */}
            <Suspense fallback={<div className="h-14 border-b border-border" />}>
              <SiteHeader />
            </Suspense>
            <main id="main" className="container pt-8 sm:pt-12">
              {children}
            </main>
            <SiteFooter />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
