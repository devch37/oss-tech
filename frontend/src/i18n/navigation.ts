import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** 로케일을 자동으로 붙여주는 Link / useRouter / usePathname — next/link, next/navigation 대신 사용 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
