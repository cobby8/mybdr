import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { createStatSchema, bulkStatsSchema } from "@/lib/validation/match";
import { apiSuccess, notFound, validationError, forbidden } from "@/lib/api/response";
import { mapStatToPrisma } from "@/lib/utils/stat-mapper";
import { getDisplayName } from "@/lib/utils/player-display-name";
import { USER_DISPLAY_SELECT } from "@/lib/db/select-presets";
// PR5: 매치 시점 jersey 우선순위 적용 (override → ttp → team_members)
import { resolveMatchJerseysBatch } from "@/lib/jersey/resolve";
// 2026-05-05 Phase 5 PR14 — 활동 추적 (매치 통계 기록 = 활동 5종 중 #3)
import { trackTeamMemberActivityForUser } from "@/lib/team-members/track-activity";

// FR-026: 매치 스탯 조회
async function getHandler(
  _req: NextRequest,
  ctx: AuthContext & { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await ctx.params;

  const matchIdBig = BigInt(matchId);
  const statsRaw = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatchId: matchIdBig },
    include: {
      tournamentTeamPlayer: {
        select: {
          id: true, // PR5: jersey resolve 위해 ttp.id 필요
          jerseyNumber: true,
          position: true,
          player_name: true,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          users: { select: USER_DISPLAY_SELECT },
        },
      },
    },
  });

  // PR5: 매치 시점 jersey 일괄 결정 (override → ttp.jerseyNumber → null)
  // team_members.jersey_number 까지 폴백하려면 별도 JOIN 필요 — Phase 1 범위에서는 ttp 까지만 (team_members 미연결 케이스 0건 가정)
  const ttpEntries = statsRaw
    .filter((s) => s.tournamentTeamPlayer !== null)
    .map((s) => ({
      ttpId: s.tournamentTeamPlayer!.id,
      ttpJersey: s.tournamentTeamPlayer!.jerseyNumber,
      teamJersey: null as number | null, // 본 endpoint 는 team_members 미조회 — null fallback
    }));
  const jerseyMap = await resolveMatchJerseysBatch(matchIdBig, ttpEntries);

  // Flutter 앱 호환: nickname 키 자리에 실명 우선 표시값 채움 (response schema 동일)
  const stats = statsRaw.map((s) => {
    // PR5: 매치 시점 정확값으로 치환 (없으면 ttp 영구값)
    const resolvedJersey = s.tournamentTeamPlayer
      ? jerseyMap.get(s.tournamentTeamPlayer.id) ?? s.tournamentTeamPlayer.jerseyNumber
      : null;
    return {
      ...s,
      tournamentTeamPlayer: s.tournamentTeamPlayer
        ? {
            jerseyNumber: resolvedJersey,
            position: s.tournamentTeamPlayer.position,
            users: s.tournamentTeamPlayer.users
              ? {
                  nickname: getDisplayName(
                    s.tournamentTeamPlayer.users,
                    {
                      player_name: s.tournamentTeamPlayer.player_name,
                      // 표시명 폴백에도 매치 시점 번호 사용 (운영자가 임시 번호 부여한 매치는 그 번호로 노출)
                      jerseyNumber: resolvedJersey,
                    },
                  ),
                }
              : null,
          }
        : null,
    };
  });

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
    // Phase 5 PR14 — 통계 기록 운영자(본인) 의 모든 active 팀 활동 갱신.
    // 이유: 매치 통계 기록 자체는 운영자 행동이므로 운영자 = active 멤버인 모든 팀에 활동 마킹.
    //   기록 대상 player 들의 활동은 별도 로직 필요 (현 단계에서는 운영자만).
    trackTeamMemberActivityForUser(BigInt(ctx.userId)).catch(() => {});
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

  // Phase 5 PR14 — single create 경로도 동일 처리
  trackTeamMemberActivityForUser(BigInt(ctx.userId)).catch(() => {});

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
