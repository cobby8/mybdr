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

  // 정상 폐기(in_progress) — 자식 테이블 삭제 + 헤더 리셋 정상 동작.
  // (기존엔 before.status="completed" 였으나, 가드1 2차방어로 completed 는 이제 throw 대상 →
  //  정상 삭제 검증은 in_progress 로 수행)
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
        status: "in_progress",
        homeScore: 30,
        awayScore: 28,
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

  // 가드1 2차방어 — completed 매치는 throw + 자식 테이블 삭제·헤더 update 절대 미실행(보존).
  it("blocks reset of a completed match and preserves child tables (guard1 2nd defense)", async () => {
    const matchId = BigInt(306);
    const txMock = {
      play_by_plays: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      matchPlayerStat: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      liveScoreboard: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      matchLineupConfirmed: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      matchPlayerJersey: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      tournamentMatch: { update: vi.fn().mockResolvedValue({}) },
    };
    const tx = txMock as unknown as Prisma.TransactionClient;

    await expect(
      resetMatchRecord(tx, {
        matchId,
        before: {
          status: "completed",
          homeScore: 72,
          awayScore: 47,
          winner_team_id: BigInt(10),
        },
        source: "flutter",
        context: "flutter-record-discard",
        changedBy: BigInt(99),
      })
    ).rejects.toThrow(/completed/);

    // 삭제·update 는 단 한 번도 호출되면 안 된다 (자식 테이블 + 헤더 보존).
    expect(txMock.play_by_plays.deleteMany).not.toHaveBeenCalled();
    expect(txMock.matchPlayerStat.deleteMany).not.toHaveBeenCalled();
    expect(txMock.liveScoreboard.deleteMany).not.toHaveBeenCalled();
    expect(txMock.matchLineupConfirmed.deleteMany).not.toHaveBeenCalled();
    expect(txMock.matchPlayerJersey.deleteMany).not.toHaveBeenCalled();
    expect(txMock.tournamentMatch.update).not.toHaveBeenCalled();
  });
});
