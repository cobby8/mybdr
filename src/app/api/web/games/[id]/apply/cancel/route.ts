import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

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
      }
    });

    return apiSuccess({ success: true, message: "신청이 취소되었습니다." });
  } catch {
    return apiError("취소 중 오류가 발생했습니다.", 500);
  }
});
