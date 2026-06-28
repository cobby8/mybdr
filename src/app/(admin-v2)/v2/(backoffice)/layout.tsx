// ============================================================
// (admin-v2)/v2/(backoffice)/layout.tsx — 백오피스 셸 마운트 (R3 분리)
//   기존 /v2/layout.tsx 가 하던 V2Shell 마운트를 이 그룹 레이아웃으로 이전.
//   라우트 그룹 (backoffice) 는 URL 비가시 → 백오피스 URL/렌더 100% 동일.
//   인증은 상위 /v2/layout.tsx 게이트가 이미 통과시킴 → 여기선 표시용 user 만 구성.
// ============================================================

import { V2Shell } from "../_shell";
import { buildAdminV2User } from "../_admin-user";

export default async function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await buildAdminV2User();
  return <V2Shell user={user}>{children}</V2Shell>;
}
