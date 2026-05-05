import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { getDisplayName } from "@/lib/utils/player-display-name";
import { USER_DISPLAY_SELECT } from "@/lib/db/select-presets";
// PR5: 매치 시점 jersey 우선순위 적용 (다중 매치 + 다중 ttp 일괄)
import { resolveMatchJerseysMulti } from "@/lib/jersey/resolve";

// FR-027: 토너먼트 전체 선수 스탯
async function handler(_req: NextRequest, _ctx: AuthContext, tournamentId: string) {
  const statsRaw = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatch: { tournamentId } },
    include: {
      tournamentTeamPlayer: {
        select: {
          id: true,
          jerseyNumber: true,
          position: true,
          player_name: true,
          // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
          users: { select: USER_DISPLAY_SELECT },
        },
      },
    },
  });

  // PR5: 다중 매치 + 다중 ttp 일괄 jersey 결정 (단일 SELECT)
  // stats row 의 (matchId, ttpId) 페어마다 매치 시점 정확값으로 매핑
  const resolveEntries = statsRaw
    .filter((s) => s.tournamentTeamPlayer !== null)
    .map((s) => ({
      matchId: s.tournamentMatchId,
      ttpId: s.tournamentTeamPlayer!.id,
      ttpJersey: s.tournamentTeamPlayer!.jerseyNumber,
      teamJersey: null as number | null, // 본 endpoint 는 team_members 미조회
    }));
  const jerseyMap = await resolveMatchJerseysMulti(resolveEntries);

  // Flutter 앱 호환: nickname 키 자리에 실명 우선 채움 (response schema 동일)
  const stats = statsRaw.map((s) => {
    // PR5: (매치, ttp) 페어 키로 결정값 lookup
    const key = s.tournamentTeamPlayer
      ? `${s.tournamentMatchId.toString()}:${s.tournamentTeamPlayer.id.toString()}`
      : null;
    const resolvedJersey = key
      ? jerseyMap.get(key) ?? s.tournamentTeamPlayer!.jerseyNumber
      : null;
    return {
      ...s,
      tournamentTeamPlayer: s.tournamentTeamPlayer
        ? {
            id: s.tournamentTeamPlayer.id,
            jerseyNumber: resolvedJersey,
            position: s.tournamentTeamPlayer.position,
            users: s.tournamentTeamPlayer.users
              ? {
                  nickname: getDisplayName(
                    s.tournamentTeamPlayer.users,
                    {
                      player_name: s.tournamentTeamPlayer.player_name,
                      // 표시명 폴백도 매치 시점 번호 사용
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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
