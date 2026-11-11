import { notFound } from 'next/navigation';

/** 매칭되지 않는 모든 경로를 로케일 레이아웃 안의 not-found.tsx 로 보낸다 */
export default function CatchAll() {
  notFound();
}
