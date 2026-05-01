import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { getDisplayName } from "@/lib/utils/player-display-name";
import { USER_DISPLAY_SELECT } from "@/lib/db/select-presets";

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

  // Flutter 앱 호환: nickname 키 자리에 실명 우선 채움 (response schema 동일)
  const stats = statsRaw.map((s) => ({
    ...s,
    tournamentTeamPlayer: s.tournamentTeamPlayer
      ? {
          id: s.tournamentTeamPlayer.id,
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

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
