import { defineRouting } from 'next-intl/routing';

/**
 * 영어가 기본(접두사 없음: /libraries), 한국어는 /ko/libraries.
 * 영어권 검색 노출이 목표라 기본 언어 URL을 가장 짧게 유지한다.
 */
export const routing = defineRouting({
  locales: ['en', 'ko'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (routing.locales as readonly string[]).includes(value);
}
