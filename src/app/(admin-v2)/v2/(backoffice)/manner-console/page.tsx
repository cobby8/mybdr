// ============================================================
// (admin-v2)/v2/(backoffice)/manner-console/page.tsx — 매너 평가 콘솔 (컷오버 포팅)
//   레거시 (admin)/admin/game-reports/page.tsx 를 admin-v2 백오피스로 1:1 포팅.
//   서버 컴포넌트: 권한 가드만 담당(super_admin 전용). 본문(3탭·차트·신고큐)은 _console(클라).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0.
//     READ 는 레거시와 동일하게 클라가 기존 GET API 를 직접 호출한다(레거시 방식 따름):
//       · 신고 큐 = GET /api/web/admin/game-reports?status=...
//       · 통계/추세 = GET /api/web/admin/game-reports/stats
//     ★레거시에선 "추후 추가" 텍스트로만 남아 미배선이던 검토/기각을 v2 에선 실배선한다:
//       · resolve/dismiss = POST /api/web/admin/game-reports/[id]/resolve (실재 route)
//   ⚠ 권한 — /v2 layout 은 tournament_admin 까지 통과시키지만, 매너 평가 검토는 레거시 API 와
//     동일하게 super_admin 전용이다. categories/partner-console 과 동일한 페이지 레벨 super 가드 재현.
// ============================================================

import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { MannerConsole } from "./_console";

export const dynamic = "force-dynamic";

export default async function AdminV2MannerConsolePage() {
  // ── 페이지 단위 super_admin 방어 가드 (레거시 API 가드 동등·기존 헬퍼 재사용) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/v2");
  }

  // 데이터는 레거시와 동일하게 클라가 기존 GET API 로 패칭(서버 신규 쿼리 0).
  return <MannerConsole />;
}
