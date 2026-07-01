import { Prisma } from "@prisma/client";
import { recordMatchAudit, type AuditSource } from "@/lib/tournaments/match-audit";

export type MatchRecordResetBefore = {
  status: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winner_team_id: bigint | null;
};

export type MatchRecordResetOptions = {
  resetLineups?: boolean;
  resetJerseys?: boolean;
};

export function buildMatchRecordResetData() {
  return {
    status: "scheduled",
    homeScore: 0,
    awayScore: 0,
    quarterScores: Prisma.JsonNull,
    winner_team_id: null,
    mvp_player_id: null,
    started_at: null,
    ended_at: null,
    summary_brief: Prisma.JsonNull,
  } satisfies Prisma.TournamentMatchUncheckedUpdateInput;
}

export async function resetMatchRecord(
  tx: Prisma.TransactionClient,
  params: {
    matchId: bigint;
    before: MatchRecordResetBefore;
    source: AuditSource;
    context: string;
    changedBy: bigint | null;
    options?: MatchRecordResetOptions;
  }
) {
  const { matchId, before, source, context, changedBy, options } = params;

  // 가드1 2차방어 (2026-07-01 준결승 306 재발 방지):
  // completed 매치의 record-discard 는 확정 결과 + 라이브 3테이블을 파괴한다.
  // reset 라우트에서 1차로 409 차단하지만, 향후 다른 호출자가 생겨도 재파괴를 원천 봉쇄하는
  // 서비스 레벨 최종 방어선. 삭제(deleteMany)를 시작하기 '전'에 throw 해야 자식 테이블이
  // 보존된다 (throw 시 tx rollback). completed 만 차단 — 그 외 상태는 그대로 진행.
  if (before.status === "completed") {
    throw new Error(
      `resetMatchRecord: completed 매치는 폐기할 수 없습니다 (matchId=${matchId}, context=${context})`
    );
  }

  const resetLineups = options?.resetLineups ?? true;
  const resetJerseys = options?.resetJerseys ?? true;

  const deletes: Promise<unknown>[] = [
    tx.play_by_plays.deleteMany({ where: { tournament_match_id: matchId } }),
    tx.matchPlayerStat.deleteMany({ where: { tournamentMatchId: matchId } }),
    tx.liveScoreboard.deleteMany({ where: { matchId } }),
  ];

  if (resetLineups) {
    deletes.push(tx.matchLineupConfirmed.deleteMany({ where: { matchId } }));
  }
  if (resetJerseys) {
    deletes.push(
      tx.matchPlayerJersey.deleteMany({
        where: { tournamentMatchId: matchId },
      })
    );
  }

  await Promise.all(deletes);

  await tx.tournamentMatch.update({
    where: { id: matchId },
    data: buildMatchRecordResetData(),
  });

  await recordMatchAudit(
    tx,
    matchId,
    before,
    {
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      winner_team_id: null,
    },
    source,
    context,
    changedBy
  );
}
