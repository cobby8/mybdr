// ============================================================
// referee-console/bulk-register/page.tsx — Excel 일괄 사전 등록 (서버 thin 래퍼)
//   컷오버 4-4c: 레거시 (referee)/referee/admin/bulk-register 포팅.
//   ★데이터 패칭 0 — 업로드(미리보기)/확정 전부 클라(_bulk-register)에서 raw fetch.
//     사유: FormData(Excel 업로드)라 adminFetch(JSON snake↔camel) 부적합.
//           → 레거시 raw fetch 로직 verbatim 유지(documents 패턴 동일).
//   ★백엔드/DB/Prisma 0변경 — 기존 2개 API만 재사용:
//     · POST /api/web/referee-admin/bulk-register/preview  (미리보기·FormData)
//     · POST /api/web/referee-admin/bulk-register/confirm  (등록 확정·JSON)
//   ★권한 = layout(super_admin) + 기존 API 가드(referee_manage|game_manage). 별도 가드 불필요.
// ============================================================

import { RefereeBulkRegister } from "./_bulk-register";

export const dynamic = "force-dynamic";

export default function RefereeBulkRegisterPage() {
  return <RefereeBulkRegister />;
}
