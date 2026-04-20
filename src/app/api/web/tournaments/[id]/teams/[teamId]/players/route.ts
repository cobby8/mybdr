import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; teamId: string }> };

// 선수 추가 요청 검증 스키마
const createPlayerSchema = z.object({
  player_name: z.string().min(1, "이름은 필수입니다.").max(50),
  phone: z.string().regex(/^[0-9]{10,11}$/, "전화번호는 숫자 10~11자리").optional().nullable(),
  jersey_number: z.number().int().min(0).max(999).optional().nullable(),
  position: z.string().max(20).optional().nullable(),
  role: z.enum(["player", "captain", "coach"]).optional(),
});

/**
 * GET /api/web/tournaments/[id]/teams/[teamId]/players
 * 팀의 선수 목록 조회 (대회 관리자 전용)
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const teamBigInt = parseBigIntParam(teamId);
  if (teamBigInt === null) return apiError("팀을 찾을 수 없습니다.", 404);

  // 해당 대회의 팀이 맞는지 확인
  const team = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  // 선수 목록 + 연결된 유저 정보
  const players = await prisma.tournamentTeamPlayer.findMany({
    where: { tournamentTeamId: teamBigInt },
    include: {
      users: {
        select: { id: true, nickname: true, phone: true, profile_image_url: true },
      },
    },
    orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
  });

  return apiSuccess(players);
}

/**
 * POST /api/web/tournaments/[id]/teams/[teamId]/players
 * 선수 직접 추가 (대회 관리자 전용)
 *
 * - phone이 있으면 해당 번호의 기존 유저를 찾아 즉시 연결
 * - 유저가 없으면 userId=null로 생성 (나중에 가입 시 자동 매칭)
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id, teamId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const teamBigInt = parseBigIntParam(teamId);
  if (teamBigInt === null) return apiError("팀을 찾을 수 없습니다.", 404);

  // 해당 대회의 팀이 맞는지 확인
  const team = await prisma.tournamentTeam.findFirst({
    where: { id: teamBigInt, tournamentId: id },
  });
  if (!team) return apiError("팀을 찾을 수 없습니다.", 404);

  // 요청 바디 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = createPlayerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.", 400);
  }

  const { player_name, phone, jersey_number, position, role } = parsed.data;

  // 등번호 중복 검사 (jersey_number가 있는 경우)
  if (jersey_number !== undefined && jersey_number !== null) {
    const existing = await prisma.tournamentTeamPlayer.findFirst({
      where: { tournamentTeamId: teamBigInt, jerseyNumber: jersey_number },
    });
    if (existing) {
      return apiError(`등번호 ${jersey_number}은(는) 이미 사용 중입니다.`, 409);
    }
  }

  // phone이 있으면 해당 번호의 유저를 찾아 즉시 연결 시도
  let linkedUserId: bigint | null = null;
  if (phone) {
    const user = await prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });
    if (user) {
      // 같은 팀에 이미 해당 유저가 등록되어 있는지 확인 (유니크 제약 방지)
      const alreadyInTeam = await prisma.tournamentTeamPlayer.findFirst({
        where: { tournamentTeamId: teamBigInt, userId: user.id },
      });
      if (!alreadyInTeam) {
        linkedUserId = user.id;
      }
    }
  }

  const player = await prisma.tournamentTeamPlayer.create({
    data: {
      tournamentTeamId: teamBigInt,
      player_name,
      phone: phone ?? null,
      jerseyNumber: jersey_number ?? null,
      position: position ?? null,
      role: role ?? "player",
      userId: linkedUserId,
      is_active: true,
    },
  });

  return apiSuccess(player, 201);
}
