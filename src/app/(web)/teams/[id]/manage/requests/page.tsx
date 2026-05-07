/**
 * /teams/[id]/manage/requests — 5/7 옛 알림 redirect 페이지
 *
 * 이유 (왜):
 *   2026-05-05 Phase 2 PR6 ~ 2026-05-07 fix(notify) 사이에 발송된 알림들의
 *   action_url 이 `/teams/${id}/manage/requests` 로 DB 에 박혀 있다 (notifications.action_url).
 *   2026-05-07 fix 는 신규 알림 actionUrl 만 `/manage?tab=member-requests` 로 변경 →
 *   옛 알림 클릭 시 여전히 404. 사용자 신고: "팀장이 팀원 요청 승인 페이지 404 계속".
 *
 * 어떻게:
 *   server component + redirect("/teams/${id}/manage?tab=member-requests")
 *   결과: 옛 알림 클릭해도 통합 탭 (번호변경/휴면/탈퇴/이적) 으로 정상 진입.
 *
 * 후속:
 *   - DB UPDATE 로 옛 action_url 일괄 정정 (선택, 사용자 승인 필수)
 *   - 신규 알림은 이미 정상 — 본 redirect 는 옛 알림 잔재 처리 + 향후 회귀 방어막.
 */
import { redirect } from "next/navigation";

type Ctx = { params: Promise<{ id: string }> };

export default async function ManageRequestsRedirect({ params }: Ctx) {
  const { id } = await params;
  redirect(`/teams/${id}/manage?tab=member-requests`);
}
