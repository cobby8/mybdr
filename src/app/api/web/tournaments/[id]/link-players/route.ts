import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { linkPlayersToUsers } from "@/lib/tournaments/link-player-user";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/web/tournaments/[id]/link-players
 * 대회의 모든 팀 선수에 대해 userId 자동 연결 (배치)
 * - 대회 관리자 권한 필요
 * - userId가 NULL인 선수만 대상 (이미 연결된 건 건너뜀)
 * - 이름이 정확히 일치하는 팀 멤버 1명만 있을 때 연결
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // 대회 관리자 권한 확인
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // 해당 대회의 모든 TournamentTeam 조회
  const tournamentTeams = await prisma.tournamentTeam.findMany({
    where: { tournamentId: id },
    select: { id: true, team: { select: { name: true } } },
  });

  let totalLinked = 0;
  const results: { team_name: string; linked: number }[] = [];

  // 각 팀별로 userId 자동 연결 실행
  for (const tt of tournamentTeams) {
    const linked = await linkPlayersToUsers(tt.id);
    totalLinked += linked;
    if (linked > 0) {
      results.push({ team_name: tt.team.name, linked });
    }
  }

  return apiSuccess({ total_linked: totalLinked, results });
}
