// ============================================================
// referee-console/settings/page.tsx — 설정 (thin 서버 래퍼)
//   ★컷오버 4-4d: 레거시 (referee)/referee/admin/fee-settings(역할별 배정비 단가)를
//     v2 설정 페이지로 포팅. 이전 데모 no-op(정책 표시만·저장 안 됨) → 단가 실편집으로 교체.
//   - 패칭 0(서버) — 데이터는 클라(_settings)에서 adminFetch GET/PUT로 로드/저장.
//   - 백엔드 0변경: 기존 /api/web/referee-admin/fee-settings 만 재사용(신규 API 0).
//   - nav 무변경(기존 settings nav 그대로) · _shell 미터치.
// ============================================================

import { RefereeSettings } from "./_settings";

export const dynamic = "force-dynamic";

export default function RefereeSettingsPage() {
  return <RefereeSettings />;
}
