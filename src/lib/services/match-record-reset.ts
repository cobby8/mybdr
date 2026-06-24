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
