import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import {
  buildMatchRecordResetData,
  resetMatchRecord,
} from "@/lib/services/match-record-reset";

vi.mock("@/lib/tournaments/match-audit", () => ({
  recordMatchAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("match-record-reset", () => {
  it("builds the scheduled zero-state update payload", () => {
    expect(buildMatchRecordResetData()).toEqual({
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      quarterScores: Prisma.JsonNull,
      winner_team_id: null,
      mvp_player_id: null,
      started_at: null,
      ended_at: null,
      summary_brief: Prisma.JsonNull,
    });
  });

  it("clears match records, live scoreboard, lineup, jerseys, and match row", async () => {
    const matchId = BigInt(123);
    const winnerTeamId = BigInt(10);
    const changedBy = BigInt(99);
    const txMock = {
      play_by_plays: { deleteMany: vi.fn().mockResolvedValue({ count: 3 }) },
      matchPlayerStat: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
      liveScoreboard: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
      matchLineupConfirmed: {
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
      matchPlayerJersey: {
        deleteMany: vi.fn().mockResolvedValue({ count: 10 }),
      },
      tournamentMatch: { update: vi.fn().mockResolvedValue({}) },
    };
    const tx = txMock as unknown as Prisma.TransactionClient;

    await resetMatchRecord(tx, {
      matchId,
      before: {
        status: "completed",
        homeScore: 72,
        awayScore: 68,
        winner_team_id: winnerTeamId,
      },
      source: "flutter",
      context: "flutter-record-discard",
      changedBy,
    });

    expect(txMock.play_by_plays.deleteMany).toHaveBeenCalledWith({
      where: { tournament_match_id: matchId },
    });
    expect(txMock.matchPlayerStat.deleteMany).toHaveBeenCalledWith({
      where: { tournamentMatchId: matchId },
    });
    expect(txMock.liveScoreboard.deleteMany).toHaveBeenCalledWith({
      where: { matchId },
    });
    expect(txMock.matchLineupConfirmed.deleteMany).toHaveBeenCalledWith({
      where: { matchId },
    });
    expect(txMock.matchPlayerJersey.deleteMany).toHaveBeenCalledWith({
      where: { tournamentMatchId: matchId },
    });
    expect(txMock.tournamentMatch.update).toHaveBeenCalledWith({
      where: { id: matchId },
      data: buildMatchRecordResetData(),
    });
  });
});
