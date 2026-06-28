// ============================================================
// (admin-v2)/v2/ta/layout.tsx — 대회 콘솔 셸 마운트 (R3)
//   상위 /v2/layout.tsx 인증 게이트 통과 후 → TaShell(대회 콘솔 NAV) 마운트.
//   백오피스 (backoffice) 그룹과 형제 — 셸이 서로 중첩되지 않음(별도 콘솔).
// ============================================================

import { TaShell } from "./_ta-shell";
import { buildAdminV2User } from "../_admin-user";

export default async function TaConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await buildAdminV2User();
  return <TaShell user={user}>{children}</TaShell>;
}
