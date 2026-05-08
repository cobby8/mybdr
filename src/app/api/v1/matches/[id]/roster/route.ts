import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
// PR5: 매치 시점 jersey 우선순위 적용
import { resolveMatchJerseysBatch } from "@/lib/jersey/resolve";
// 2026-05-09: 공식 기록 도메인 = 실명 우선 헬퍼 통일 (conventions.md)
import { getDisplayName } from "@/lib/utils/player-display-name";

// GET /api/v1/matches/:id/roster
// 경기 홈/어웨이 선수 명단 반환 (기록원 권한 필요)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeTeam: {
          select: {
            id: true,
            players: {
              where: { is_active: true },
              select: {
                id: true,
                jerseyNumber: true,
                isStarter: true,
                position: true,
                // 2026-05-09: 실명 우선 폴백 (user_id=NULL 케이스 = TTP 등록명 사용)
                player_name: true,
                users: {
                  select: { id: true, name: true, nickname: true },
                },
              },
              orderBy: [{ isStarter: "desc" }, { jerseyNumber: "asc" }],
            },
          },
        },
        awayTeam: {
          select: {
            id: true,
            players: {
              where: { is_active: true },
              select: {
                id: true,
                jerseyNumber: true,
                isStarter: true,
                position: true,
                // 2026-05-09: 실명 우선 폴백 (user_id=NULL 케이스 = TTP 등록명 사용)
                player_name: true,
                users: {
                  select: { id: true, name: true, nickname: true },
                },
              },
              orderBy: [{ isStarter: "desc" }, { jerseyNumber: "asc" }],
            },
          },
        },
      },
    });

    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    // PR5: 양 팀 ttp 묶어서 매치 시점 jersey 일괄 결정
    const homePlayers = match.homeTeam?.players ?? [];
    const awayPlayers = match.awayTeam?.players ?? [];
    const ttpEntries = [...homePlayers, ...awayPlayers].map((p) => ({
      ttpId: p.id,
      ttpJersey: p.jerseyNumber,
      teamJersey: null as number | null, // roster 응답 = ttp 기준, team_members 미조회
    }));
    const jerseyMap = await resolveMatchJerseysBatch(matchId, ttpEntries);

    const mapPlayer = (p: {
      id: bigint;
      jerseyNumber: number | null;
      isStarter: boolean | null;
      position: string | null;
      player_name: string | null;
      users: { id: bigint; name: string | null; nickname: string | null } | null;
    }) => ({
      id: Number(p.id),
      // 2026-05-09: 공식 기록 = 실명 우선 헬퍼 통일 (conventions.md)
      // 우선순위: User.name → User.nickname → ttp.player_name → '#{jersey}' → '선수'
      name: getDisplayName(p.users, { player_name: p.player_name, jerseyNumber: p.jerseyNumber }, "선수"),
      // PR5: override → ttp 우선순위 적용 (orderBy 는 ttp 그대로 — DB 정렬은 영구 번호 기준)
      jersey_number: jerseyMap.get(p.id) ?? p.jerseyNumber,
      is_starter: p.isStarter ?? false,
      position: p.position,
    });

    return apiSuccess({
      home_players: homePlayers.map(mapPlayer),
      away_players: awayPlayers.map(mapPlayer),
    });
  } catch (err) {
    console.error("[GET /api/v1/matches/[id]/roster]", err);
    return apiError("Internal server error", 500);
  }
}
