import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; teamId: string; playerId: string }> };

// 선수 수정 요청 검증 스키마
const updatePlayerSchema = z.object({
  player_name: z.string().min(1).max(50).optional(),
  phone: z.string().regex(/^[0-9]{10,11}$/, "전화번호는 숫자 10~11자리").optional().nullable(),
  jersey_number: z.number().int().min(0).max(999).optional().nullable(),
  position: z.string().max(20).optional().nullable(),
  role: z.enum(["player", "captain", "coach"]).optional(),
});

/**
 * PATCH /api/web/tournaments/[id]/teams/[teamId]/players/[playerId]
 * 선수 정보 수정 (대회 관리자 전용)
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, teamId, playerId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const teamBigInt = parseBigIntParam(teamId);
  const playerBigInt = parseBigIntParam(playerId);
  if (teamBigInt === null || playerBigInt === null) {
    return apiError("선수를 찾을 수 없습니다.", 404);
  }

  // 해당 대회+팀에 속한 선수인지 확인
  const team = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  const player = await prisma.tournamentTeamPlayer.findFirst({
    where: { id: playerBigInt, tournamentTeamId: teamBigInt },
  });
  if (!player) return apiError("선수를 찾을 수 없습니다.", 404);

  // 요청 바디 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = updatePlayerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", 400);
  }

  const { player_name, phone, jersey_number, position, role } = parsed.data;

  // 등번호 변경 시 중복 검사
  if (jersey_number !== undefined && jersey_number !== null) {
    const dup = await prisma.tournamentTeamPlayer.findFirst({
      where: {
        tournamentTeamId: teamBigInt,
        jerseyNumber: jersey_number,
        id: { not: playerBigInt }, // 자기 자신은 제외
      },
    });
    if (dup) {
      return apiError(`등번호 ${jersey_number}은(는) 이미 사용 중입니다.`, 409);
    }
  }

  // phone 변경 시 유저 자동 연결 시도
  let userIdUpdate: bigint | null | undefined;
  if (phone !== undefined && phone !== player.phone) {
    if (phone) {
      const user = await prisma.user.findFirst({
        where: { phone },
        select: { id: true },
      });
      if (user) {
        const alreadyInTeam = await prisma.tournamentTeamPlayer.findFirst({
          where: { tournamentTeamId: teamBigInt, userId: user.id, id: { not: playerBigInt } },
        });
        // 같은 팀에 이미 있으면 userId 연결하지 않음
        userIdUpdate = alreadyInTeam ? undefined : user.id;
      } else {
        // 유저가 없으면 기존 연결 유지 (해제하지 않음)
        userIdUpdate = undefined;
      }
    }
    // phone이 null로 변경되어도 기존 userId 연결은 유지
  }

  const updated = await prisma.tournamentTeamPlayer.update({
    where: { id: playerBigInt },
    data: {
      ...(player_name !== undefined && { player_name }),
      ...(phone !== undefined && { phone: phone ?? null }),
      ...(jersey_number !== undefined && { jerseyNumber: jersey_number ?? null }),
      ...(position !== undefined && { position: position ?? null }),
      ...(role !== undefined && { role }),
      ...(userIdUpdate !== undefined && { userId: userIdUpdate }),
    },
  });

  return apiSuccess(updated);
}

/**
 * DELETE /api/web/tournaments/[id]/teams/[teamId]/players/[playerId]
 * 선수 삭제 (대회 관리자 전용)
 */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, teamId, playerId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const teamBigInt = parseBigIntParam(teamId);
  const playerBigInt = parseBigIntParam(playerId);
  if (teamBigInt === null || playerBigInt === null) {
    return apiError("선수를 찾을 수 없습니다.", 404);
  }

  // 해당 대회+팀에 속한 선수인지 확인
  const team = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  const player = await prisma.tournamentTeamPlayer.findFirst({
    where: { id: playerBigInt, tournamentTeamId: teamBigInt },
  });
  if (!player) return apiError("선수를 찾을 수 없습니다.", 404);

  await prisma.tournamentTeamPlayer.delete({
    where: { id: playerBigInt },
  });

  return apiSuccess({ deleted: true });
}
