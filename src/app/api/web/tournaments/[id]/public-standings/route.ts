import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
// Phase 3: scheduledAt 가드만 사용 (status는 [completed, in_progress, live] 유지해야 함)
import { pastOrOngoingSchedule } from "@/lib/tournaments/official-match";

type Ctx = { params: Promise<{ id: string }> };

/**
 * 대회 순위 탭 공개 API (인증 불필요)
 * GET /api/web/tournaments/[id]/public-standings
 *
 * 대회 상세 페이지에서 "순위" 탭 클릭 시 호출
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return apiError("Invalid tournament ID", 400);
  }

  // 1) 대회 상태 + 참가팀 + 완료/진행중 경기를 병렬로 조회 (DB 왕복 1회로 최적화)
  const [tournament, teams, matches] = await Promise.all([
    // 대회 상태 조회 (진행 중 vs 종료에 따라 프론트에서 공동순위 로직이 달라짐)
    // 2026-05-17 — settings.points_rule 도 SELECT (강남구 승점 룰 분기 표시).
    prisma.tournament.findUnique({
      where: { id },
      select: { status: true, settings: true },
    }),
    // 2026-05-17 — win_points 컬럼 추가 SELECT (강남구 가산점 박제 / update-standings SET 값).
    prisma.tournamentTeam.findMany({
      where: { tournamentId: id },
      include: { team: { select: { name: true } } },
    }),
    prisma.tournamentMatch.findMany({
      where: {
        tournamentId: id,
        // Phase 3: status는 기존 [completed, in_progress, live] 유지.
        // scheduledAt 가드만 추가해 미래 테스트 데이터 / NULL 날짜 제외.
        ...pastOrOngoingSchedule(),
        status: { in: ["completed", "in_progress", "live"] }, // 완료 + 진행중 + 라이브
        homeTeamId: { not: null },
        awayTeamId: { not: null },
      },
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        status: true,
      },
    }),
  ]);

  // 2) 팀별 전적 집계 (tournament_teams.wins/losses 대신 경기 결과에서 직접 계산)
  const teamStats: Record<
    string,
    { wins: number; losses: number; draws: number; pointsFor: number; pointsAgainst: number }
  > = {};

  for (const m of matches) {
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const homeId = m.homeTeamId.toString();
    const awayId = m.awayTeamId.toString();
    const hs = m.homeScore ?? 0;
    const as_ = m.awayScore ?? 0; // as는 JS 예약어이므로 as_ 사용

    // 초기화
    if (!teamStats[homeId])
      teamStats[homeId] = { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
    if (!teamStats[awayId])
      teamStats[awayId] = { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };

    // 득점/실점 집계 (진행중 경기도 포함)
    teamStats[homeId].pointsFor += hs;
    teamStats[homeId].pointsAgainst += as_;
    teamStats[awayId].pointsFor += as_;
    teamStats[awayId].pointsAgainst += hs;

    // 승패는 완료/라이브 경기에서 집계 (스코어가 확정된 경기)
    if (m.status === "completed" || m.status === "live") {
      if (hs > as_) {
        teamStats[homeId].wins++;
        teamStats[awayId].losses++;
      } else if (as_ > hs) {
        teamStats[awayId].wins++;
        teamStats[homeId].losses++;
      } else {
        teamStats[homeId].draws++;
        teamStats[awayId].draws++;
      }
    }
  }

  // 2026-05-17 강남구 승점 룰 — tournament.settings.points_rule 추출.
  //   "gnba" 박제 시만 강남구 룰 (정렬 1차키 = winPoints / 컴포넌트 P 컬럼 노출).
  //   미박제 / 그 외 대회 = "default" → 모든 팀 winPoints = wins * 3 = 승률 정렬과 동치 → 회귀 0.
  const tournamentSettingsRaw = (tournament?.settings ?? {}) as Record<string, unknown>;
  const pointsRule: "gnba" | "default" =
    tournamentSettingsRaw.points_rule === "gnba" ? "gnba" : "default";

  // 3) 직렬화 + 정렬 (승점 → 득실차 → 다득점).
  //   2026-05-17 — 정렬 1차키 = winPoints (강남구 규정 정합).
  //   default 룰 대회 = winPoints = wins * 3 으로 박제됨 → 승률 정렬과 동치 (회귀 0).
  const serialized = teams
    .map((t) => {
      const tid = t.id.toString();
      const stats = teamStats[tid] ?? {
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
      // 경기 수 = 승 + 패 + 무
      const gamesPlayed = stats.wins + stats.losses + stats.draws;
      // 승률 = 승 / 경기수 (소수 3자리, 0경기면 0)
      const winRate = gamesPlayed > 0
        ? Math.round((stats.wins / gamesPlayed) * 1000) / 1000
        : 0;
      return {
        id: tid,
        teamId: t.teamId.toString(), // Team 테이블의 실제 id (팀 페이지 링크용)
        teamName: t.team.name,
        wins: stats.wins,
        losses: stats.losses,
        draws: stats.draws,
        gamesPlayed,       // 총 경기 수
        winRate,           // 승률 (0~1, 소수 3자리)
        groupName: t.groupName,
        pointsFor: stats.pointsFor,
        pointsAgainst: stats.pointsAgainst,
        pointDifference: stats.pointsFor - stats.pointsAgainst,
        // 2026-05-17 강남구 승점 — DB win_points 박제값 (null = 0 폴백).
        winPoints: t.win_points ?? 0,
      };
    })
    .sort((a, b) => {
      // 2026-05-17 정렬 변경: 승점 desc → 득실차 desc → 다득점 desc.
      // 사유: 강남구 규정 정합 + default 대회는 wins*3 = 자연스럽게 승률 순과 동치.
      if (b.winPoints !== a.winPoints) return b.winPoints - a.winPoints;
      if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
      return b.pointsFor - a.pointsFor;
    });

  // 대회 상태 + 승점 룰 (프론트 컴포넌트 P 컬럼 노출 분기용).
  return apiSuccess({
    teams: serialized,
    tournamentStatus: tournament?.status ?? "draft",
    pointsRule,
  });
}
