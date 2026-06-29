import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDevelopment = process.env.NODE_ENV === "development";
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  isDevelopment ? "'unsafe-eval'" : null,
  "https://accounts.google.com",
  "https://t1.daumcdn.net",
  "http://t1.daumcdn.net",
  "https://dapi.kakao.com",
  "http://dapi.kakao.com",
]
  .filter(Boolean)
  .join(" ");

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
      scriptSrc,
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

      // ─────────────────────────────────────────────────────────────
      // R7-A 컷오버 1단계: 관리자 그린필드(/v2) 안내 redirect (308 영구)
      // 왜: 그린필드 준비 영역(대회관리자 /v2/ta·백오피스 /v2/*)이 완성되어
      //   레거시 URL 접근을 그린필드로 안내. 레거시 라우트는 무손상 유지(롤백 안전망).
      // ★정밀 매칭: 와일드카드(:path*) 금지 — 개별 ready 경로만 명시 열거.
      //   블로커/super전용/미포팅 보조도구 경로는 의도적으로 제외(잘못 redirect 시 운영 마비).
      //   /admin(exact)은 /admin/games·/admin/news 등 제외 경로를 잡지 않음.
      //   /tournament-admin/tournaments/:id/edit 패턴은 /tournament-admin/tournaments/:id
      //   (대회운영 블로커)를 잡지 않음(세그먼트 edit 필수).
      // ─────────────────────────────────────────────────────────────

      // ── 대회관리자(/tournament-admin) → /v2/ta (갭 0·ready) ──
      {
        // 대회관리자 홈
        source: "/tournament-admin",
        destination: "/v2/ta",
        permanent: true,
      },
      {
        // 대회 목록
        source: "/tournament-admin/tournaments",
        destination: "/v2/ta/tournaments",
        permanent: true,
      },
      {
        // 대회 생성 마법사 → 그린필드 단일 생성 폼
        source: "/tournament-admin/tournaments/new/wizard",
        destination: "/v2/ta/tournaments/new",
        permanent: true,
      },
      {
        // 대회 수정 폼 (:id 보존 매핑)
        source: "/tournament-admin/tournaments/:id/edit",
        destination: "/v2/ta/tournaments/:id/edit",
        permanent: true,
      },
      {
        // 정규대회 시리즈 목록
        source: "/tournament-admin/series",
        destination: "/v2/ta/series",
        permanent: true,
      },
      {
        // 단체(조직) 목록
        source: "/tournament-admin/organizations",
        destination: "/v2/ta/organizations",
        permanent: true,
      },
      {
        // 템플릿 목록
        source: "/tournament-admin/templates",
        destination: "/v2/ta/templates",
        permanent: true,
      },

      // ── 백오피스(/admin) → /v2 (매칭 제외·ready) ──
      {
        // 백오피스 홈
        source: "/admin",
        destination: "/v2",
        permanent: true,
      },
      {
        // 유저 관리 → 유저 콘솔(유저/팀/단체 통합)
        source: "/admin/users",
        destination: "/v2/user-console",
        permanent: true,
      },
      {
        // 팀 관리 → 유저 콘솔
        source: "/admin/teams",
        destination: "/v2/user-console",
        permanent: true,
      },
      {
        // 단체 관리 → 유저 콘솔
        source: "/admin/organizations",
        destination: "/v2/user-console",
        permanent: true,
      },
      {
        // 캠페인 → 마케팅 콘솔
        source: "/admin/campaigns",
        destination: "/v2/marketing-console",
        permanent: true,
      },
      {
        // 결제 관리
        source: "/admin/payments",
        destination: "/v2/payments",
        permanent: true,
      },
      {
        // 요금제 관리
        source: "/admin/plans",
        destination: "/v2/plans",
        permanent: true,
      },
      {
        // 커뮤니티 관리 → 커뮤니티 콘솔
        source: "/admin/community",
        destination: "/v2/community-console",
        permanent: true,
      },
      {
        // 건의/제안 → 커뮤니티 콘솔
        source: "/admin/suggestions",
        destination: "/v2/community-console",
        permanent: true,
      },
      {
        // 코트 관리 → 코트 콘솔
        source: "/admin/courts",
        destination: "/v2/court-console",
        permanent: true,
      },

      // ─────────────────────────────────────────────────────────────
      // R7 컷오버 후속: ④협력(partner-admin→partner)·①대회운영(→v2/operate)
      //   완료영역만 308 봉인. 레거시 라우트 무손상(롤백=규칙제거).
      // ─────────────────────────────────────────────────────────────

      // ── ④ 협력(/partner-admin) → /partner (편집폼 완료·ready) ──
      {
        // 협력 홈
        source: "/partner-admin",
        destination: "/partner",
        permanent: true,
      },
      {
        // 캠페인 목록
        source: "/partner-admin/campaigns",
        destination: "/partner/campaigns",
        permanent: true,
      },
      {
        // 캠페인 상세 (:id 보존 매핑)
        source: "/partner-admin/campaigns/:id",
        destination: "/partner/campaigns/:id",
        permanent: true,
      },
      {
        // 장소 관리 — 레거시 단수 venue → v2 복수 venues (경로 리네이밍)
        source: "/partner-admin/venue",
        destination: "/partner/venues",
        permanent: true,
      },

      // ── ① 대회운영(/tournament-admin/tournaments/:id) → /v2/operate/:id ──
      {
        // ★id=UUID(String) → 숫자제한 불가. UUID 형식 정규식으로 :id 제한해
        //   세그먼트 1개짜리 비-UUID(예: /new 생성진입)를 자동 배제(운영 마비 방지).
        //   /:id/edit·/new/wizard(세그먼트 2개)는 애초에 :id(1개) 미매칭.
        source:
          "/tournament-admin/tournaments/:id([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})",
        destination: "/v2/operate/:id",
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
      // ★OBS 오버레이 읽기 전용 라우트만 CORS 와일드카드(*)로 오버라이드.
      //   OBS 브라우저소스는 임의 출처에서 fetch 하므로 단일 origin 으로는 막힌다.
      //   읽기 전용 + ?key= HMAC 보호라 저위험. 이 항목이 위의 전역 항목보다 뒤(더 구체적
      //   source)라 동일 키(Access-Control-Allow-Origin)를 이 경로에서만 * 로 덮는다.
      //   (POST·key 발급 등 나머지 /api/v1 은 위 전역 단일 origin 유지)
      {
        source: "/api/v1/live/courts/:courtKey/scoreboard",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
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
