import type { Metadata } from 'next';
import type { Locale } from '@/i18n/routing';

/** 영어는 접두사 없음, 한국어는 /ko */
export function localizedPath(path: string, locale: Locale): string {
  const clean = path === '/' ? '' : path;
  return locale === 'en' ? path : `/ko${clean}`;
}

/** 페이지별 canonical + hreflang(en, ko, x-default). path 는 로케일 접두사 없는 경로 */
export function buildAlternates(path: string, locale: Locale): NonNullable<Metadata['alternates']> {
  return {
    canonical: localizedPath(path, locale),
    languages: {
      en: localizedPath(path, 'en'),
      ko: localizedPath(path, 'ko'),
      'x-default': localizedPath(path, 'en'),
    },
  };
}
