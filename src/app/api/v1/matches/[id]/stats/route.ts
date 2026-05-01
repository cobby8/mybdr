import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { createStatSchema, bulkStatsSchema } from "@/lib/validation/match";
import { apiSuccess, notFound, validationError, forbidden } from "@/lib/api/response";
import { mapStatToPrisma } from "@/lib/utils/stat-mapper";
import { getDisplayName } from "@/lib/utils/player-display-name";
import { USER_DISPLAY_SELECT } from "@/lib/db/select-presets";

// FR-026: 매치 스탯 조회
async function getHandler(
  _req: NextRequest,
  ctx: AuthContext & { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await ctx.params;

  const statsRaw = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatchId: BigInt(matchId) },
    include: {
      tournamentTeamPlayer: {
        select: {
          jerseyNumber: true,
          position: true,
          player_name: true,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          users: { select: USER_DISPLAY_SELECT },
        },
      },
    },
  });

  // Flutter 앱 호환: nickname 키 자리에 실명 우선 표시값 채움 (response schema 동일)
  const stats = statsRaw.map((s) => ({
    ...s,
    tournamentTeamPlayer: s.tournamentTeamPlayer
      ? {
          jerseyNumber: s.tournamentTeamPlayer.jerseyNumber,
          position: s.tournamentTeamPlayer.position,
          users: s.tournamentTeamPlayer.users
            ? {
                nickname: getDisplayName(
                  s.tournamentTeamPlayer.users,
                  {
                    player_name: s.tournamentTeamPlayer.player_name,
                    jerseyNumber: s.tournamentTeamPlayer.jerseyNumber,
                  },
                ),
              }
            : null,
        }
      : null,
  }));

  return apiSuccess(stats);
}

// FR-026: 스탯 생성
async function postHandler(
  req: NextRequest,
  ctx: AuthContext & { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await ctx.params;
  const matchIdBig = BigInt(matchId);

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchIdBig },
    select: { tournamentId: true },
  });
  if (!match) return notFound("Match not found");

  const hasAccess = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId: match.tournamentId, userId: BigInt(ctx.userId), isActive: true },
  });
  if (!hasAccess) return forbidden("No access to this tournament");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([{ message: "Invalid JSON body" }]);
  }

  const bulkResult = bulkStatsSchema.safeParse(body);
  if (bulkResult.success) {
    // Zod 검증된 데이터를 실제 DB 컬럼명으로 매핑
    const now = new Date();
    const created = await prisma.matchPlayerStat.createMany({
      data: bulkResult.data.stats.map((s) => ({
        tournamentMatchId: matchIdBig,
        tournamentTeamPlayerId: BigInt(s.tournamentTeamPlayerId),
        ...mapStatToPrisma(s),
        createdAt: now,
        updatedAt: now,
      })),
    });
    return apiSuccess({ created: created.count }, 201);
  }

  const singleResult = createStatSchema.safeParse(body);
  if (!singleResult.success) return validationError(singleResult.error.issues);

  const s = singleResult.data;
  const stat = await prisma.matchPlayerStat.create({
    data: {
      tournamentMatchId: matchIdBig,
      tournamentTeamPlayerId: BigInt(s.tournamentTeamPlayerId),
      ...mapStatToPrisma(s),
    },
  });

  return apiSuccess(stat, 201);
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return getHandler(r, { ...authCtx, params: context.params });
  }))(req);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return postHandler(r, { ...authCtx, params: context.params });
  }))(req);
}
