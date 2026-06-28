// ============================================================
// ta/tournaments/new/page.tsx — 대회 생성 마법사 진입(R5-A)
//   인증은 부모 (admin-v2)/v2/layout(getWebSession+membershipType≥3/super) +
//   ta/layout(TaShell) 이 이미 담당 → 본 페이지는 클라 마법사만 마운트.
//   데이터 패칭 0(생성 폼은 자기완결·실입력). 생성 권한은 POST 엔드포인트
//   (hasCreatePermission) 가 서버에서 재검증.
//   ⚠ 백엔드/DB/Prisma 0변경. 기존 POST /api/web/tournaments 재사용.
// ============================================================

import { CreateWizard } from "./_create-wizard";

export const dynamic = "force-dynamic";

export default function NewTournamentPage() {
  return <CreateWizard />;
}
