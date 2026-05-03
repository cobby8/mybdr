import { prisma } from "@/lib/db/prisma";

/**
 * 경기 결과 기록 후 승자 진출 처리
 * TournamentMatch.winner_team_id → next_match_id의 빈 슬롯에 배치
 *
 * ⚠️ single elim 전용. dual_tournament 는 progressDualMatch 가 진출 처리 (loser bracket 포함).
 * (2026-05-03 가드 추가: dual 매치에 본 함수가 호출되어 home/away 모두 winner 로 set 되는
 *  무한 루프 corrupt 발생 — sync route 의 진입 차단과 더불어 함수 자체에도 이중 가드.)
 */
export async function advanceWinner(matchId: bigint): Promise<void> {
  // dual_tournament 가드 — format 만 조회하여 본 함수 대상 외이면 즉시 종료
  const matchForGuard = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { tournament: { select: { format: true } } },
  });
  if (matchForGuard?.tournament?.format === "dual_tournament") return;

  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      next_match_id: true,
      winner_team_id: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      tournamentId: true,
    },
  });

  if (!match?.next_match_id || !match.winner_team_id) return;

  const nextMatch = await prisma.tournamentMatch.findUnique({
    where: { id: match.next_match_id },
    select: { homeTeamId: true, awayTeamId: true },
  });
  if (!nextMatch) return;

  // 빈 슬롯에 승자 배치 (home 먼저, 이미 채워졌으면 away)
  const slot = nextMatch.homeTeamId === null ? "homeTeamId" : "awayTeamId";

  await prisma.tournamentMatch.update({
    where: { id: match.next_match_id },
    data: { [slot]: match.winner_team_id },
  });
}

/**
 * 경기 완료 시 팀 전적 업데이트 (tournament_teams.wins/losses)
 */
export async function updateTeamStandings(
  matchId: bigint,
): Promise<void> {
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
    },
  });

  if (!match || match.homeTeamId === null || match.awayTeamId === null) return;
  if (match.homeScore === null || match.awayScore === null) return;

  // TC-NEW-025: 무승부(winner_team_id === null)와 잘못된 데이터(neither team) 구별
  const winnerId = match.winner_team_id;
  const homeWon = winnerId !== null && winnerId === match.homeTeamId;
  const awayWon = winnerId !== null && winnerId === match.awayTeamId;
  const isDraw = winnerId === null;

  // winner_team_id가 있지만 home/away 어느 쪽도 아닌 경우 → 데이터 오류, 전적 갱신 중단
  if (winnerId !== null && !homeWon && !awayWon) {
    console.error(`[updateTeamStandings] matchId=${matchId}: winner_team_id(${winnerId})가 home(${match.homeTeamId}) / away(${match.awayTeamId}) 어느 쪽도 아닙니다. 전적 갱신을 건너뜁니다.`);
    return;
  }

  await prisma.$transaction([
    prisma.tournamentTeam.updateMany({
      where: { tournamentId: match.tournamentId, teamId: match.homeTeamId },
      data: {
        wins: homeWon ? { increment: 1 } : undefined,
        losses: awayWon ? { increment: 1 } : undefined,
        draws: isDraw ? { increment: 1 } : undefined,
        points_for: { increment: match.homeScore },
        points_against: { increment: match.awayScore },
        point_difference: { increment: match.homeScore - match.awayScore },
      },
    }),
    prisma.tournamentTeam.updateMany({
      where: { tournamentId: match.tournamentId, teamId: match.awayTeamId },
      data: {
        wins: awayWon ? { increment: 1 } : undefined,
        losses: homeWon ? { increment: 1 } : undefined,
        draws: isDraw ? { increment: 1 } : undefined,
        points_for: { increment: match.awayScore },
        points_against: { increment: match.homeScore },
        point_difference: { increment: match.awayScore - match.homeScore },
      },
    }),
  ]);
}
