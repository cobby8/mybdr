// ============================================================
// referee-console/members/new/page.tsx — 심판 사전 등록 (서버 thin 래퍼)
//   레거시 (referee)/referee/admin/members/new 를 v2 referee-console 로 포팅(4-4b).
//   ★폼은 전부 클라이언트 입력/검증 → 서버 데이터 패칭 0. 본 래퍼는 클라 폼만 렌더.
//   ★mutation = POST /api/web/referee-admin/members (기존 API 재사용·백엔드 0변경).
//   - layout 이 super_admin 만 통과시키므로 별도 가드 불필요.
// ============================================================

import { MemberNewForm } from "./_new-form";

export const dynamic = "force-dynamic";

export default function RefereeMemberNewPage() {
  // 데이터 패칭 없음 — 등록 폼(클라)만 렌더.
  return <MemberNewForm />;
}
