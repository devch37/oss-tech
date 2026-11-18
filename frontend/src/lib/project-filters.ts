import type { Repository } from '@/types/api';

/**
 * 프로젝트 검색의 조건 타입과 기본값. 서버(page.tsx)와 클라이언트(ProjectExplorer)가 함께 쓰므로
 * 'use client' 파일이 아닌 곳에 둔다 (클라이언트 파일의 값은 서버에서 읽을 수 없다).
 */

/** 여러 분야에 걸친 같은 프로젝트를 한 줄로 합친 항목 */
export type ProjectItem = Repository & { fields: string[] };

export type Activity = 'all' | 'S' | 'A' | 'B' | 'C';
export type Sort = 'stars' | 'activity' | 'name';

export interface Filters {
  q: string;
  field: string; // 'all' 또는 분야 키
  lang: string; // 'all' 또는 언어 이름
  activity: Activity;
  sort: Sort;
}

export const DEFAULT_FILTERS: Filters = { q: '', field: 'all', lang: 'all', activity: 'all', sort: 'stars' };
