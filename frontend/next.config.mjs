// import type {NextConfig } from "next";

/** @type {import('next').NextConfig} */

const nextConfig = {
  // Docker 최적화: standalone 모드로 최소 런타임만 포함
  output: 'standalone',

  // NEXT_PUBLIC_* 변수는 빌드 타임에 인라인되므로 env 블록 없이 자동 노출됨.
  // 서버사이드 전용 변수만 명시적으로 선언.
  env: {
    INTERNAL_API_URL: process.env.INTERNAL_API_URL ?? "http://backend:8080",
  },

  // Docker 컨테이너 내부: 브라우저 → Next.js → backend 프록시
  // 로컬 개발 시에는 NEXT_PUBLIC_API_URL을 직접 사용
  async rewrites() {
    const internalApiUrl =
      process.env.INTERNAL_API_URL ?? "http://backend:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${internalApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
