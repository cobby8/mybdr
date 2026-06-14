import type { Metadata } from "next";

import { RefereeInfoContent } from "./_components/referee-info-content";

/* ============================================================
 * RefereeInfo — /referee-info (RI1 · v2.31 시안 박제)
 *
 * 이유(왜):
 *   사이트의 `/referee` 는 심판 플랫폼(심판 활동 화면)을 점유 중 →
 *   심판 제도 안내 페이지를 별도 라우트 `/referee-info` 로 운영.
 *   비로그인 열람 가능한 공개 SEO 페이지 (getWebSession 가드 X) — 검색
 *   엔진 인덱스 친화 + 외부 마케팅 진입점 활성.
 *
 * 구조 결정 (v2.31):
 *   시안 RefereeInfo.jsx 는 FAQ 아코디언(useState) = client 인터랙션 필요.
 *   반면 metadata export 는 server component 전용 → 분리:
 *     - page.tsx(server): metadata SEO export 보존
 *     - _components/referee-info-content.tsx(client): 시안 8섹션 + FAQ
 *
 * 시안 출처: Dev/design/BDR-current/screens/RefereeInfo.jsx (+ referee-info.css)
 *
 * v2.31 변경 요약 (vs v2.4):
 *   - 정적 SEO 카드 3종(단순화) → 시안 마케팅 랜딩 8섹션 복원
 *     (Hero / 통계4 / 하는일4 / 자격등급3 / 지원절차4 / 정산표 / FAQ / CTA)
 *   - 데이터 0(제도 안내 정적) / 데이터 패칭 0 / 라우트 불변
 *
 * 진입: 더보기 메뉴 "심판 센터 안내" / SEO 검색 인덱스
 * AppNav active: pathname 자동 판정(/referee-info → more)
 * ============================================================ */

// SEO: 심판 제도 안내 메타데이터 (Open Graph 포함) — server 보존
export const metadata: Metadata = {
  title: "심판 센터 안내 | MyBDR",
  description:
    "BDR 공식 대회의 모든 경기는 인증된 심판이 운영합니다. 심판 등록·교육·배정 시스템에 대해 안내드립니다.",
  openGraph: {
    title: "심판 센터 안내 | MyBDR",
    description:
      "BDR 공식 대회의 모든 경기는 인증된 심판이 운영합니다. 심판 등록·교육·배정 시스템 안내.",
    type: "website",
  },
};

export default function RefereeInfoPage() {
  // 공개 SEO 페이지 정책: getWebSession 가드 미사용 — 비로그인 열람 가능.
  // 본문(8섹션 + FAQ 아코디언)은 client 컴포넌트로 위임.
  return <RefereeInfoContent />;
}
