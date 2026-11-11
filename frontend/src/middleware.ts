import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // /api (백엔드 rewrite), Next 내부 경로, 정적 파일(확장자 포함)은 제외
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
