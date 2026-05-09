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

    // 2026-05-10 PR5: 사전 라인업 확정 응답 필드 추가
    // 사유: Flutter 기록앱이 매치 시작 시점에 출전 명단 (active) + 주전 (starter) 자동 채움 가능하도록.
    //      옵션 A — 기존 roster 응답에 신규 키 2개만 추가 (Flutter v1 = 신규 키 무시 → 회귀 0).
    // 보안: 기존 requireRecorder 가드가 매치+토너먼트 권한 검증 → 라인업도 동일 가드 안에서 노출.
    // 쿼리: 양 팀 1번에 fetch (where matchId 만 — UNIQUE(matchId, teamSide) index hit, N≤2).
    const lineups = await prisma.matchLineupConfirmed.findMany({
      where: { matchId },
      select: {
        teamSide: true,
        starters: true,
        substitutes: true,
        confirmedAt: true,
      },
    });

    // home / away 각각 분리 — N≤2 라 .find() O(N) 무관
    const homeLineup = lineups.find((l) => l.teamSide === "home");
    const awayLineup = lineups.find((l) => l.teamSide === "away");

    return apiSuccess({
      home_players: homePlayers.map(mapPlayer),
      away_players: awayPlayers.map(mapPlayer),
      // 2026-05-10 PR5: DB row 0건 → null. Flutter v1 = 신규 필드 무시.
      home_lineup_confirmed: buildLineupConfirmed(homeLineup),
      away_lineup_confirmed: buildLineupConfirmed(awayLineup),
    });
  } catch (err) {
    console.error("[GET /api/v1/matches/[id]/roster]", err);
    return apiError("Internal server error", 500);
  }
}

// 2026-05-10 PR5: 사전 라인업 응답 직렬화 헬퍼
// - active_ttp_ids = starters ∪ substitutes (Set 합집합) — 출전 명단 = 주전 + 후보 전체
// - starter_ttp_ids = starters 그대로 — 주전 5명
// - confirmed_at = ISO string (BigInt 직렬화 룰과 동일하게 string 화)
// - 정렬 = ttp.id 오름차순 (Set 처리 후 안정성 위해)
// - row = undefined → null 반환 (라인업 미입력 매치)
// 매핑 룰 사유: snake_case 키 + string ttp_id (PR2 일관성) + apiSuccess BigInt 직렬화 안전
function buildLineupConfirmed(
  row:
    | {
        starters: bigint[];
        substitutes: bigint[];
        confirmedAt: Date;
      }
    | undefined,
) {
  if (!row) return null;

  // starters ∪ substitutes 합집합 (string 변환 후 Set 으로 중복 제거)
  // 사유: 응답 안정성 — 만약 DB 에 이상 값 (중복) 저장돼도 클라이언트는 unique 받음
  const activeSet = new Set(
    [...row.starters, ...row.substitutes].map((b) => b.toString()),
  );
  const active_ttp_ids = Array.from(activeSet).sort();

  // starters 만 별도 — 주전 5명. 정렬은 안정성 (Flutter Set 사용 시 영향 0)
  const starter_ttp_ids = row.starters.map((b) => b.toString()).sort();

  return {
    active_ttp_ids,
    starter_ttp_ids,
    confirmed_at: row.confirmedAt.toISOString(),
  };
}
