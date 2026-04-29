/**
 * Phase 10-2 — 경기 종료 후 평가 요청 알림 발송 (Cron)
 *
 * 이유:
 *   - 경기가 끝나면 호스트/승인 참가자에게 "평가 작성해주세요" 알림이 필요.
 *   - 게임 종료 처리는 자동 계산(scheduled_at 기반) 또는 수동(status=3)이라
 *     "이벤트 시점"이 명확하지 않음 → 가장 단순한 cron polling 방식 채택.
 *   - 1~3시간 전에 종료된 경기를 매시간 검색.
 *     · 너무 빠르면(0분 후) 경기장 정리도 안 끝남
 *     · 너무 늦으면(1일+) 기억 흐려짐
 *     · 1~3시간 윈도우 + dedupe 조회로 중복 발송 방지.
 *
 * 트리거 방식:
 *   - 옵션 A (Cron polling) 채택. 단순/안전.
 *   - vercel.json은 별도 PM 처리 (Hobby plan cron 한도 우려로 본 작업에서는 미수정).
 *   - 수동 실행: `curl -H "Authorization: Bearer $CRON_SECRET" https://.../api/cron/game-report-reminders`
 *
 * Dedupe:
 *   - DB 스키마 변경 없이 처리 위해 notifications 테이블에서
 *     동일 user_id + notification_type + action_url 조합 존재 여부 조회.
 *   - 중복 발송 방지 + 사용자가 알림을 읽었는지 여부와 무관하게 1회만 발송.
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1) 권한: CRON_SECRET 헤더 검증 (다른 cron 라우트와 동일 패턴)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  // 2) 검색 윈도우: scheduled_at 이 [3시간 전, 1시간 전) 인 경기
  //    이유: scheduled_at 은 경기 시작 시각. duration_hours 기본 2시간을 더하면
  //    실제 종료 시각은 scheduled_at + 2h. 그래서 시작 1~3시간 전 경기는
  //    "끝난 지 약 0~1시간" 된 것 → 평가 요청에 적절.
  const now = Date.now();
  const cutoffStart = new Date(now - 3 * 60 * 60 * 1000);
  const cutoffEnd = new Date(now - 1 * 60 * 60 * 1000);

  const games = await prisma.games.findMany({
    where: {
      // status=3 → 완료. 아직 status가 자동 전환 안 된 경기도 시간 기반으로 잡고 싶다면
      // 여기서 status 조건을 빼고 ended_at이 있는 것만 잡는 것도 가능하지만,
      // 우선 명시적으로 "운영자가 종료 처리한 경기"만 대상.
      status: 3,
      scheduled_at: { gte: cutoffStart, lt: cutoffEnd },
    },
    select: {
      id: true,
      uuid: true,
      title: true,
      organizer_id: true,
      // 승인된 참가자 (game_applications.status=1 = approved)
      game_applications: {
        where: { status: 1 },
        select: { user_id: true },
      },
    },
  });

  let sent = 0;
  let skippedDuplicate = 0;

  for (const game of games) {
    // uuid 없으면 action_url 만들 수 없으므로 스킵 (안전 가드)
    if (!game.uuid) continue;

    const actionUrl = `/games/${game.uuid}/report`;
    const title = game.title ?? "경기";

    // 호스트 + 승인된 참가자 set으로 중복 제거
    const userIds = new Set<bigint>();
    if (game.organizer_id) userIds.add(game.organizer_id);
    for (const a of game.game_applications) {
      userIds.add(a.user_id);
    }

    for (const userId of userIds) {
      // 이미 같은 (사용자 + 평가요청 + 같은 경기 URL) 알림 있는지 확인
      // dedupe 기준 — DB 스키마 변경 없이 알림 테이블 자체로 처리
      const existing = await prisma.notifications.findFirst({
        where: {
          user_id: userId,
          notification_type: NOTIFICATION_TYPES.GAME_REPORT_REQUEST,
          action_url: actionUrl,
        },
        select: { id: true },
      });

      if (existing) {
        skippedDuplicate++;
        continue;
      }

      // 알림 발송 (createNotification 내부에서 인앱 + 푸시 모두 처리)
      // 푸시 실패는 무시되므로 await 가능.
      await createNotification({
        userId,
        notificationType: NOTIFICATION_TYPES.GAME_REPORT_REQUEST,
        title: "경기 평가 작성 요청",
        content: `"${title}" 경기 종료 후 평가를 작성해 주세요.`,
        actionUrl,
      }).catch(() => {
        // 개별 알림 실패는 전체 cron을 깨뜨리지 않음 — 다음 사이클에서 dedupe로 재시도 가능
      });

      sent++;
    }
  }

  return apiSuccess({
    success: true,
    gamesProcessed: games.length,
    notificationsSent: sent,
    skippedDuplicate,
  });
}
