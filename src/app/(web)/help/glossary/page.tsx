import type { Metadata } from "next";
import GlossaryClient from "./glossary-client";

/* ============================================================
 * 용어 사전 (Help > Glossary) — IU3-B · Phase 10 박제 (BDR v2.30)
 *
 * 이유: /help 통합 허브의 "전체 용어 사전 보기 →" 링크 대상 페이지.
 *      시안(Dev/design/BDR-current/screens/Glossary.jsx)을 박제 —
 *      A-Z chip 인덱스 + 검색 + 용어 카드 grid + cross-domain link.
 *
 * 구조: 이 server component 는 SEO metadata 만 보존하고, 인터랙션
 *      (A-Z chip / 검색)은 ./glossary-client.tsx 에서 처리.
 *
 * 보존:
 *  - SEO metadata 그대로 유지(검색엔진 색인).
 *  - redirect 금지(무한루프 — 사용자 결정 영구 보존). 별도 페이지 유지.
 *  - API/Prisma/데이터 패칭 0 변경. 용어는 시안 상수 박제(DB 없음).
 * ============================================================ */

// SEO: 용어 사전 페이지 메타데이터 (기존 보존)
export const metadata: Metadata = {
  title: "용어 사전 | MyBDR",
  description:
    "MyBDR에서 쓰는 농구 관련 용어(대회, 경기, 픽업, 게스트, 디비전, 시드, 토너먼트, 풀리그)를 쉽게 정리했습니다.",
};

export default function GlossaryPage() {
  return <GlossaryClient />;
}
