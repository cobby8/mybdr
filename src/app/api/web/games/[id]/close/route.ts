/**
 * POST /api/web/games/[id]/close — 호스트 수동 모집 마감·확정 (status 1→2)
 *
 * [M6 보완①] 호스트가 정원이 차기 전에 수동으로 모집을 마감하고 경기를 확정한다.
 *
 * 왜 별도 route(POST /close):
 *   - 기존 PATCH /api/web/games/[id]는 사용자 입력 필드(title/일정/인원 등) 부분 수정 전용.
 *     status 전환은 의미·검증이 전혀 달라 한 핸들러에 섞으면 가드가 꼬임.
 *   - 단일 책임(status 1→2 전환만) + 엄격 가드를 위해 전용 엔드포인트로 분리.
 *
 * 가드(M1 game-status 정본 의미 사용):
 *   - organizer(호스트)만 (IDOR 방지 → 403)
 *   - status === 1(모집중) 일 때만 → 2(확정).
 *     2(이미 확정)/3(완료)/4(취소)/0(초안)은 거부(409/400).
 *   - 정원 충족 시 자동확정(M1)과 충돌 없음: 이미 2면 아래 가드에서 막힘 → 멱등 거부.
 *
 * destructive 0 · schema 0 · write = games.status 1→2 단일 update.
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(
  _req: NextRequest,
  { params }: RouteCtx
) {
  // 인증 확인
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }

  const { id } = await params;
  const userId = BigInt(session.sub);

  // 경기 존재 + 호스트 + 현재 상태 확인 (uuid 기반 — PATCH/DELETE와 동일 식별자)
  const game = await prisma.games.findUnique({
    where: { uuid: id },
    select: { id: true, organizer_id: true, status: true },
  });
  if (!game) {
    return apiError("존재하지 않는 경기입니다.", 404, "NOT_FOUND");
  }

  // IDOR 방지: 호스트만 마감·확정 가능
  if (game.organizer_id !== userId) {
    return apiError("경기 호스트만 마감·확정할 수 있습니다.", 403, "FORBIDDEN");
  }

  // 상태 가드: 모집중(1)일 때만 확정(2)으로 전환 가능.
  //   - 이미 확정(2): 멱등 거부(정원 충족 자동확정 M1과 충돌 방지)
  //   - 완료(3)/취소(4)/초안(0): 전환 불가
  if (game.status !== 1) {
    return apiError(
      "모집중인 경기만 마감·확정할 수 있습니다.",
      409,
      "INVALID_STATUS"
    );
  }

  // status 1 → 2(확정) 단일 전환
  const updated = await prisma.games.update({
    where: { id: game.id },
    data: { status: 2, updated_at: new Date() },
    select: { id: true, uuid: true, status: true },
  });

  return apiSuccess({
    id: updated.id.toString(),
    uuid: updated.uuid,
    status: updated.status,
    message: "모집을 마감하고 경기를 확정했습니다.",
  });
}
