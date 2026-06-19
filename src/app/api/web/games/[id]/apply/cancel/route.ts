import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
// M2: 승인 참가자 본인취소로 빈자리 발생 시 대기열 1번 승격 트리거
import { promoteNextWaitlist, sendPromotionNotice, type PromotionResult } from "@/lib/games/waitlist";

type RouteCtx = { params: Promise<{ id: string }> };

// DELETE /api/web/games/[id]/apply/cancel
// 신청자: 본인 신청 취소
export const DELETE = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    // TC-NEW-001: short UUID hex 검증 (LIKE 와일드카드 인젝션 방지)
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

    // 경기 시작 전에만 취소 가능
    if (game.scheduled_at < new Date()) {
      return apiError("이미 시작된 경기는 취소할 수 없습니다.", 400);
    }

    // [가드 1] 경기 status가 1(모집중) 또는 2(확정)일 때만 본인취소 허용.
    // 이유: 완료(3)·취소(4) 경기의 신청을 본인취소하면 current_participants가
    //       부적절히 차감되어 정합이 깨진다. 모집/확정 단계에서만 정원 변동을 허용.
    //       (game-status.ts: 1=모집중 / 2=확정 / 3=완료 / 4=취소 단일출처 주석 참조)
    if (game.status !== 1 && game.status !== 2) {
      return apiError("취소할 수 없는 경기 상태입니다.", 400);
    }

    const application = await prisma.game_applications.findUnique({
      where: { game_id_user_id: { game_id: game.id, user_id: ctx.userId } },
    });
    if (!application) {
      return apiError("신청 내역이 없습니다.", 404);
    }

    // TC-NEW-023: 삭제 + current_participants 감소를 원자적 트랜잭션으로 처리
    // M2: 좌석 점유 신청(status 0·1) 취소로 좌석이 비면 같은 트랜잭션에서 대기열 1번을 승격 후보로 지정.
    let promotion: PromotionResult | null = null;
    await prisma.$transaction(async (tx) => {
      // delete 자체는 신청 status와 무관하게 항상 수행 (본인 신청 제거)
      await tx.game_applications.delete({ where: { id: application.id } });

      // [가드 2] 정원 차감은 신청 status가 0(신청완료) 또는 1(승인)일 때만 수행.
      // 이유: 거절(status=2) 신청은 거절 처리 시점에 이미 current_participants가
      //       1 차감됐다. 그 신청자가 본인취소를 호출하면 status 필터 없이 또 차감되어
      //       이중감소(음수/오염)가 발생 → M1 자동전환(current>=max / current<max)이
      //       영구 왜곡된다. 따라서 0·1 신청만 자리를 점유 중이므로 그때만 차감/복귀.
      if (application.status === 0 || application.status === 1) {
        await tx.games.update({
          where: { id: game!.id },
          data: { current_participants: { decrement: 1 } },
        });

        // M1: 정원 복귀 — 신청 취소로 자리가 비어 current<max 이고 status=2(확정)면 1(모집중)로.
        // 이유: 같은 트랜잭션 내 조건부 UPDATE로 race-safe. 미달이 아니면 no-op.
        await tx.$executeRaw`
          UPDATE games
          SET status = 1, updated_at = NOW()
          WHERE id = ${game!.id}
            AND status = 2
            AND current_participants < max_participants
        `;

        // M2: 좌석 차감(status 0 또는 1 취소)이 일어났으므로 대기열 1번 승격 트리거.
        //   ★수정(M2 차단): 이 코드베이스는 "신청=좌석선점" 모델 — status=0(미승인)도
        //     apply 시점에 current_participants 를 점유한다. 따라서 status 0·1 어느 쪽 취소든
        //     좌석이 실제로 비므로(위 decrement) 승격 트리거도 0·1 모두에서 발동해야 정합.
        //   비대칭 제거: 거절 경로(applications/[appId])는 status=0 해제 시에도 무조건
        //     promoteNextWaitlist 를 호출한다. 본인취소도 동일하게 맞춰 "거절은 승격되는데
        //     본인취소는 빈자리가 영구 미충원" 갭을 없앤다.
        //   같은 트랜잭션 내 승격 → 좌석 해제와 승격 후보 지정이 원자적.
        promotion = await promoteNextWaitlist(tx, game!.id);
      } else if (application.status === 3 && application.waitlist_position !== null) {
        // M2: 대기(status=3) 취소 — current_participants 미변경(좌석 미점유).
        //   취소분보다 뒤 순번(waitlist_position 큰) 대기자들을 한 칸씩 당겨 재정렬.
        //   이유: 순번에 빈칸이 생기면 표시/승격 우선순위가 어긋나므로 연속성 유지.
        //   같은 트랜잭션 내 조건부 UPDATE로 race-safe.
        await tx.game_applications.updateMany({
          where: {
            game_id: game!.id,
            status: 3,
            waitlist_position: { gt: application.waitlist_position },
          },
          data: { waitlist_position: { decrement: 1 } },
        });
      }
    });

    // M2: 승격 후보가 지정됐으면 커밋 후 알림 발송 (트랜잭션 밖 fire-and-forget).
    if (promotion) {
      const p = promotion as PromotionResult;
      sendPromotionNotice({
        userId: p.promotedUserId,
        gameId: game.id,
        gameTitle: game.title,
        shortId: game.uuid?.slice(0, 8) ?? game.id.toString(),
        deadline: p.deadline,
      });
    }

    return apiSuccess({ success: true, message: "신청이 취소되었습니다." });
  } catch {
    return apiError("취소 중 오류가 발생했습니다.", 500);
  }
});
