// ============================================================
// (admin-v2)/v2/(backoffice)/notifications/page.tsx — 컷오버 알림 발송
//   레거시 (admin)/admin/notifications 의 v2 포팅(알림 발송 폼).
//   ⚠ 백엔드 0변경 — 발송은 클라에서 기존 POST /api/web/admin/notifications
//     fetch 그대로(신규 API 0). 서버 컴포넌트는 클라 셸만 마운트.
// ============================================================

import { NotificationsConsole } from "./_notifications";

export const dynamic = "force-dynamic";

export default function AdminV2NotificationsPage() {
  return <NotificationsConsole />;
}
