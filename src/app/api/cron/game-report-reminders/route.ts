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

/**
 * [M4] 24시간 리마인드 식별 키.
 *   - 즉시 알림(lazyEndGame)과 1~3h 윈도우 알림은 같은 action_url 을 쓴다(동일 기능).
 *     그래서 "이미 GAME_REPORT_REQUEST 가 있으면 스킵" dedupe 만으로는 24h 리마인드를 영영 못 보낸다
 *     (종료 직후 즉시 알림이 항상 먼저 존재하므로).
 *   - 따라서 24h 리마인드는 metadata.reminder = "24h" 로 표식하고, dedupe 도 "같은 user+game 의
 *     24h 리마인드가 이미 있는지"로 따로 판정한다(즉시 알림과 독립). 같은 user+game 에 24h 리마인드 1회만.
 */
const REMINDER_24H_TAG = "24h";

export async function GET(req: NextRequest) {
  // 1) 권한: CRON_SECRET 헤더 검증 (다른 cron 라우트와 동일 패턴)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const now = Date.now();
  let sent = 0;
  let skippedDuplicate = 0;
  let remindersSent = 0;
  let remindersSkipped = 0;

  // ===========================================================================
  // (A) 종료 직후(1~3h) 평가 요청 — 기존 동작 유지.
  //     이유: scheduled_at 은 경기 시작 시각. duration_hours 기본 2시간을 더하면
  //     실제 종료 시각은 scheduled_at + 2h. 시작 1~3시간 전 경기 = "끝난 지 약 0~1시간".
  // ===========================================================================
  const cutoffStart = new Date(now - 3 * 60 * 60 * 1000);
  const cutoffEnd = new Date(now - 1 * 60 * 60 * 1000);

  const games = await prisma.games.findMany({
    where: {
      // status=3 → 완료. 명시적으로 "종료 처리된 경기"만 대상.
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
      // 이미 같은 (사용자 + 평가요청 + 같은 경기 URL) 알림 있는지 확인.
      // [M4] 즉시 알림(lazyEndGame)도 같은 키를 쓰므로, 종료 직후 알림이 이미 있으면 여기서 스킵(중복 0).
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

  // ===========================================================================
  // (B) [M4 신규] 종료 + 24시간 시점 "미작성자" 리마인드 — 1회.
  //     스펙: "종료+24h 1회 리마인드 미작성자".
  //     · 윈도우: 종료 시각이 약 24h 전(±1h)인 경기. duration_hours 기본 2h 가정해
  //       scheduled_at 이 [25h 전, 23h 전) 인 경기 = 종료 후 약 23~25h 경과.
  //     · 대상: 호스트 + 승인 참가자 중 "아직 game_reports 를 작성하지 않은" 사람만(미작성자).
  //     · dedupe: 같은 user+game 의 24h 리마인드(metadata.reminder="24h")가 이미 있으면 스킵(1회 보장).
  // ===========================================================================
  const remindStart = new Date(now - 25 * 60 * 60 * 1000);
  const remindEnd = new Date(now - 23 * 60 * 60 * 1000);

  const remindGames = await prisma.games.findMany({
    where: {
      status: 3,
      scheduled_at: { gte: remindStart, lt: remindEnd },
    },
    select: {
      id: true,
      uuid: true,
      title: true,
      organizer_id: true,
      game_applications: {
        where: { status: 1 },
        select: { user_id: true },
      },
      // [M4] 미작성자 판정용 — 이 경기에 제출된 리포트 작성자 id 목록.
      game_reports: {
        where: { status: "submitted" },
        select: { reporter_user_id: true },
      },
    },
  });

  for (const game of remindGames) {
    if (!game.uuid) continue;

    const actionUrl = `/games/${game.uuid}/report`;
    const title = game.title ?? "경기";

    // 이미 리포트를 작성한 사람들 — 리마인드 제외.
    const reportedUserIds = new Set<bigint>(
      game.game_reports.map((r) => r.reporter_user_id)
    );

    // 호스트 + 승인 참가자 모집단
    const userIds = new Set<bigint>();
    if (game.organizer_id) userIds.add(game.organizer_id);
    for (const a of game.game_applications) {
      userIds.add(a.user_id);
    }

    for (const userId of userIds) {
      // 이미 작성한 사람은 리마인드 안 함(미작성자만).
      if (reportedUserIds.has(userId)) continue;

      // 24h 리마인드 중복 방지 — 같은 user+game 의 24h 리마인드가 이미 있는지.
      //   즉시/1~3h 알림과 독립적으로 따로 판정(metadata.reminder="24h").
      const existingReminder = await prisma.notifications.findFirst({
        where: {
          user_id: userId,
          notification_type: NOTIFICATION_TYPES.GAME_REPORT_REQUEST,
          action_url: actionUrl,
          metadata: { path: ["reminder"], equals: REMINDER_24H_TAG },
        },
        select: { id: true },
      });

      if (existingReminder) {
        remindersSkipped++;
        continue;
      }

      await createNotification({
        userId,
        notificationType: NOTIFICATION_TYPES.GAME_REPORT_REQUEST,
        title: "경기 평가 작성 리마인드",
        content: `"${title}" 경기 평가가 아직 작성되지 않았어요. 잊지 말고 남겨주세요!`,
        actionUrl,
        // [M4] 24h 리마인드 표식 — 위 dedupe 판정 키.
        metadata: { reminder: REMINDER_24H_TAG },
      }).catch(() => {
        // 개별 실패 무시
      });

      remindersSent++;
    }
  }

  return apiSuccess({
    success: true,
    gamesProcessed: games.length,
    notificationsSent: sent,
    skippedDuplicate,
    // [M4] 24h 리마인드 결과
    reminderGamesProcessed: remindGames.length,
    remindersSent,
    remindersSkipped,
  });
}
