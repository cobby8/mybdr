import type { Metadata } from "next";
import { Suspense } from "react";
// Phase 3: v2 시안 적용 컨테이너로 교체. 기존 teams-content.tsx 는 보존(롤백용)
// 옛 TeamsFilter(검색바+FloatingFilterPanel) 는 v2 헤더 내장 검색박스와 중복되어 import 제거 (2026-04-29)
// 지역/정렬 필터 기능은 추후 v2 디자인으로 재구현 예정 (scratchpad 추후 구현 목록 참조)
import { TeamsContentV2 } from "./_components/teams-content-v2";
import TeamsLoading from "./loading";

// SEO: 팀 디렉토리 페이지 메타데이터
export const metadata: Metadata = {
  title: "팀 디렉토리 | MyBDR",
  description: "활동 중인 농구 팀을 찾고 가입 신청하세요.",
};

/**
 * /teams 페이지
 *
 * 서버 컴포넌트는 래퍼 역할만 수행.
 * 실제 데이터 로딩은 TeamsContent (클라이언트 컴포넌트)에서
 * /api/web/teams API를 호출하여 처리한다.
 */
export default function TeamsPage() {
  return (
    <Suspense fallback={<TeamsLoading />}>
      <TeamsContentV2 />
    </Suspense>
  );
}
