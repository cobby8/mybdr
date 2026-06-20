import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { demoteExpiredAndPromoteNext } from "@/lib/games/waitlist";

type RouteCtx = { params: Promise<{ id: string; appId: string }> };

// POST /api/web/games/[id]/applications/[appId]/confirm
// M2(매칭 대기열) — 빈자리 승격 안내를 받은 대기자가 "참가 확정"을 누름.
//   ★자동승인 아님 — 승격 후보(status=3 + promotion_deadline 살아있음)만 이 API로 확정 가능.
//   권한: 본인(대기자) 또는 호스트.
export const POST = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id, appId } = await routeCtx.params;

  try {
    // 1) 경기 조회 (short UUID hex 검증 — LIKE 와일드카드 인젝션 방지)
    let game = null;
    if (id.length === 8) {
      if (!/^[a-f0-9]{8}$/.test(id)) {
        return apiError("경기를 찾을 수 없습니다.", 404);
      }
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
      `;
      const fullUuid = rows[0]?.uuid;
      if (fullUuid) game = await prisma.games.findUnique({ where: { uuid: fullUuid } });
    } else {
      game = await prisma.games.findUnique({ where: { uuid: id } });
    }
    if (!game) return apiError("경기를 찾을 수 없습니다.", 404);

    // 2) 신청 조회 + 소속 검증
    const appBigInt = parseBigIntParam(appId);
    if (appBigInt === null) {
      return apiError("신청 내역을 찾을 수 없습니다.", 404);
    }
    const application = await prisma.game_applications.findUnique({
      where: { id: appBigInt },
    });
    if (!application || application.game_id !== game.id) {
      return apiError("신청 내역을 찾을 수 없습니다.", 404);
    }

    // 3) 권한(IDOR): 본인(대기자) 또는 호스트만.
    const isApplicant = application.user_id === ctx.userId;
    const isHost = game.organizer_id === ctx.userId;
    if (!isApplicant && !isHost) {
      return apiError("권한이 없습니다.", 403);
    }

    // 4) 대기(status=3) 신청만 승격 확정 가능.
    if (application.status !== 3) {
      return apiError("승격 확정 대상이 아닌 신청입니다.", 409);
    }

    // 5) 승격 마감(promotion_deadline) 검증 — null 이거나 만료 → 410.
    //    만료 시 이 대기자의 기회는 끝났으므로 "다음 순번" 에게 재발동.
    //    ★수정(minor 가드): 단순 deadline=null 정리 후 재선출하면, 만료자가 여전히
    //      최앞 순번(waitlist_position asc)이라 본인이 즉시 재승격(새 30분)되는 미세 편차가
    //      있었다. demoteExpiredAndPromoteNext 가 만료자를 맨 뒤로 강등 후 재선출하므로
    //      스펙 "만료 → 다음 순번 승격" 에 정확히 맞고 무한 자기승격을 방지한다.
    const now = new Date();
    if (application.promotion_deadline === null || application.promotion_deadline < now) {
      await demoteExpiredAndPromoteNext({
        expiredApplicationId: application.id,
        gameId: game.id,
        gameTitle: game.title,
        shortId: game.uuid?.slice(0, 8) ?? game.id.toString(),
      });
      return apiError("승격 확정 시간이 만료되었습니다.", 410);
    }

    // 6) 확정 — current_participants < max 재확인(초과=409) 후 원자적 처리.
    //    M1 조건부 UPDATE 패턴 재사용 → 정원 초과/race 방지.
    let conflicted = false;
    await prisma.$transaction(async (tx) => {
      // 정원이 있을 때만 좌석 확보 시도. 정원 무제한이면 마감 개념이 없어 항상 확보.
      if (game!.max_participants !== null) {
        const reserved = await tx.$executeRaw`
          UPDATE games
          SET current_participants = current_participants + 1, updated_at = NOW()
          WHERE id = ${game!.id}
            AND current_participants < max_participants
        `;
        if (reserved === 0) {
          // 그 사이 다시 정원이 찼다 → 확정 불가(409). 트랜잭션 롤백.
          conflicted = true;
          throw Object.assign(new Error("FULL"), { code: "FULL" });
        }

        // 정원 도달 자동전환 (M1 패턴 재사용): current==max & status=1 → 2(확정).
        await tx.$executeRaw`
          UPDATE games
          SET status = 2, updated_at = NOW()
          WHERE id = ${game!.id}
            AND status = 1
            AND current_participants >= max_participants
        `;
      } else {
        await tx.games.update({
          where: { id: game!.id },
          data: { current_participants: { increment: 1 } },
        });
      }

      // 대기 → 승인(status=1) 전환 + 대기/마감 필드 클리어.
      await tx.game_applications.update({
        where: { id: application.id },
        data: {
          status: 1,
          approved_at: now,
          waitlist_position: null,
          promotion_deadline: null,
          updated_at: now,
        },
      });
    }).catch((e) => {
      const err = e as { code?: string; message?: string };
      if (err.code === "FULL" || err.message === "FULL") {
        conflicted = true;
        return;
      }
      throw e;
    });

    if (conflicted) {
      return apiError("정원이 다시 마감되어 확정할 수 없습니다.", 409);
    }

    // 7) 확정 알림 — 대기자에게 승인 통지(호스트가 대신 눌러도 대기자가 결과를 받도록).
    createNotification({
      userId: application.user_id,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_APPROVED,
      title: "참가 확정",
      content: `"${game.title}" 경기 참가가 확정되었습니다.`,
      actionUrl: `/games/${game.uuid?.slice(0, 8) ?? game.id}`,
      notifiableType: "game",
      notifiableId: game.id,
    }).catch(() => {});

    return apiSuccess({ success: true, message: "참가가 확정되었습니다." });
  } catch {
    return apiError("확정 처리 중 오류가 발생했습니다.", 500);
  }
});
