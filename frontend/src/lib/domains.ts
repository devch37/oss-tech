/**
 * 백엔드 CrawlDomains.TOPIC_BY_DOMAIN 과 동일한 도메인 목록 (표시 순서 포함).
 * 라벨은 번역 파일의 `domains.<key>` 에 있다.
 */
export const DOMAINS = ['frontend', 'backend', 'devops', 'mobile', 'data', 'security'] as const;

export type DomainKey = (typeof DOMAINS)[number];

export const DEFAULT_DOMAIN: DomainKey = 'frontend';

export function isDomainKey(value: string | undefined): value is DomainKey {
  return !!value && (DOMAINS as readonly string[]).includes(value);
}

/** 쿼리스트링의 domain 값을 안전하게 정규화한다 (알 수 없는 값은 기본 도메인). */
export function resolveDomain(value: string | undefined): DomainKey {
  return isDomainKey(value) ? value : DEFAULT_DOMAIN;
}
