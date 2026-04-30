import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// CSP nonce는 middleware(proxy.ts)에서 생성 → x-nonce 헤더로 전달
// 빌드 시점 정적 헤더용 fallback (nonce 없는 경로)
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    // unsafe-eval / unsafe-inline 제거
    // nonce는 proxy.ts에서 동적 주입 (Next.js 15 패턴)
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // TODO: middleware에서 nonce 생성 구현 후 'unsafe-inline' 제거
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://t1.daumcdn.net http://t1.daumcdn.net https://dapi.kakao.com http://dapi.kakao.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://t1.daumcdn.net http://t1.daumcdn.net https://cdn.jsdelivr.net",
      "img-src 'self' data: https: http:",
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "connect-src 'self' https: http:",
      "frame-src https://postcode.map.daum.net http://postcode.map.daum.net https://postcode.map.kakao.com http://postcode.map.kakao.com https://t1.daumcdn.net https://accounts.google.com https://nid.naver.com https://kauth.kakao.com https://www.youtube.com https://www.youtube-nocookie.com", // 카카오 우편번호 + OAuth + YouTube embed
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    // AVIF 우선, 미지원 브라우저는 WebP fallback (AVIF는 WebP보다 20~30% 더 작음)
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "http", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "p.kakaocdn.net" },
      // 카카오 썸네일 프록시 (http/https 모두, /thumb/** 경로만)
      { protocol: "http", hostname: "img1.kakaocdn.net", pathname: "/thumb/**" },
      { protocol: "https", hostname: "img1.kakaocdn.net", pathname: "/thumb/**" },
      // 카카오 기본 프로필 원본 이미지 (/account_images/** 경로만)
      { protocol: "http", hostname: "t1.kakaocdn.net", pathname: "/account_images/**" },
      { protocol: "https", hostname: "t1.kakaocdn.net", pathname: "/account_images/**" },
      { protocol: "https", hostname: "phinf.pstatic.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Vercel Blob (프로필 사진 업로드) — *.public.blob.vercel-storage.com
      // 왜: /api/web/profile/upload-image 가 반환한 blob.url 을 헤더 UserDropdown / profile-hero
      //     의 next/image (optimized) 로 표시하려면 remotePatterns 등록 필수
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // Serwist(@serwist/next)가 webpack config를 추가함 → Turbopack이 경고 발생
  // dev는 disable:true로 SW 비활성화, 프로덕션 빌드(webpack)만 Serwist 사용
  // turbopack: {} → "이 설정을 인지했다"고 Next.js에 알림 (경고 억제)
  turbopack: {},
  // 클라이언트 라우터 캐시: 동적 페이지도 30초간 캐시하여 뒤로가기/재방문 즉시 표시
  experimental: {
    staleTimes: {
      dynamic: 30,  // 동적 페이지 30초 캐시 (기본 0)
      static: 300,  // 정적 페이지 5분 캐시 (기본 180)
    },
  },
  // 대회 상세 고아 라우트 → 메인 탭 경로로 영구 리다이렉트 (308)
  // 왜 308인가: GET 메서드를 그대로 유지하는 영구 리다이렉트. 301과 달리 메서드 변환 없음.
  // 탭 통합 매핑:
  //   - standings → bracket (순위표 LeagueStandings/GroupStandings가 bracket 탭 안에서 렌더링됨)
  //   - teams → teams (참가팀 탭 독립)
  async redirects() {
    return [
      // 시리즈 URL 통합: 구 /tournament-series → /series (308, 영구)
      // 왜 308: GET 메서드 유지, SEO 신호 이전. slug 기반 허브(/series/[slug])와 일관
      // 왜 목록만 리다이렉트: 구 페이지는 /tournament-series/${id}(숫자) 링크였고
      //   신규 허브는 /series/[slug](문자) 구조라 자동 매핑 불가 → 목록으로만 통합
      {
        source: "/tournament-series",
        destination: "/series",
        permanent: true,
      },
      {
        source: "/tournaments/:id/bracket",
        destination: "/tournaments/:id?tab=bracket",
        permanent: true, // 308
      },
      {
        source: "/tournaments/:id/schedule",
        destination: "/tournaments/:id?tab=schedule",
        permanent: true,
      },
      {
        source: "/tournaments/:id/standings",
        destination: "/tournaments/:id?tab=bracket",
        permanent: true,
      },
      {
        source: "/tournaments/:id/teams",
        destination: "/tournaments/:id?tab=teams",
        permanent: true,
      },
      // 업그레이드 안내 페이지 통합: 구 /upgrade → /pricing (308, 영구)
      // 왜 308: GET 유지. /pricing이 결제 플로우 포함 최신 페이지이므로 /upgrade는 제거하고 일원화
      {
        source: "/upgrade",
        destination: "/pricing",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // SW는 캐시 금지 (항상 최신 버전 사용)
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/api/v1/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGIN || "https://mybdr.kr",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PATCH, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Token",
          },
          // max-age 86400 → 3600 (1시간)
          { key: "Access-Control-Max-Age", value: "3600" },
        ],
      },
    ];
  },
};

// PWA: Serwist 래퍼 (개발 환경에서는 SW 비활성화 → Turbopack 충돌 방지)
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(nextConfig);
