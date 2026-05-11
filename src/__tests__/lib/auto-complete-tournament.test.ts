/**
 * 2026-05-12 — 대회 자동 종료 헬퍼 회귀 가드.
 *
 * checkAndAutoCompleteTournament 6 케이스:
 *   1. 매치 0건 → no-op (no-matches)
 *   2. 미완료 매치 1건+ → no-op (incomplete)
 *   3. 모든 매치 completed → UPDATE (auto-completed)
 *   4. completed + cancelled mix → UPDATE
 *   5. 이미 tournament.status='completed' → no-op (already-final)
 *   6. tournament 미존재 → no-op (tournament-not-found)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkAndAutoCompleteTournament } from "@/lib/tournaments/auto-complete";

type MockClient = {
  tournament: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  tournamentMatch: {
    count: ReturnType<typeof vi.fn>;
  };
};

function makeClient(): MockClient {
  return {
    tournament: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tournamentMatch: {
      count: vi.fn(),
    },
  };
}

describe("checkAndAutoCompleteTournament", () => {
  let client: MockClient;

  beforeEach(() => {
    client = makeClient();
  });

  it("매치 0건 → no-op (no-matches)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "in_progress" });
    client.tournamentMatch.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(false);
    expect(result.reason).toBe("no-matches");
    expect(client.tournament.update).not.toHaveBeenCalled();
  });

  it("미완료 매치 1건+ → no-op (incomplete)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "in_progress" });
    client.tournamentMatch.count.mockResolvedValueOnce(10).mockResolvedValueOnce(9);

    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(false);
    expect(result.reason).toBe("incomplete-9/10");
    expect(client.tournament.update).not.toHaveBeenCalled();
  });

  it("모든 매치 completed → UPDATE (auto-completed)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "in_progress" });
    client.tournamentMatch.count.mockResolvedValueOnce(10).mockResolvedValueOnce(10);
    client.tournament.update.mockResolvedValueOnce({ id: "t-1", status: "completed" });

    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(true);
    expect(result.reason).toBe("auto-completed-10/10");
    expect(client.tournament.update).toHaveBeenCalledWith({
      where: { id: "t-1" },
      data: { status: "completed" },
    });
  });

  it("completed + cancelled mix → UPDATE (둘 다 final 로 카운트)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "live" });
    // tournamentMatch.count 가 status in [completed, cancelled, forfeit] 으로 박제
    client.tournamentMatch.count.mockResolvedValueOnce(5).mockResolvedValueOnce(5);
    client.tournament.update.mockResolvedValueOnce({ id: "t-1", status: "completed" });

    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(true);
    expect(client.tournament.update).toHaveBeenCalled();
  });

  it("이미 tournament.status='completed' → no-op (already-final)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "completed" });

    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(false);
    expect(result.reason).toBe("already-final-completed");
    expect(client.tournamentMatch.count).not.toHaveBeenCalled();
    expect(client.tournament.update).not.toHaveBeenCalled();
  });

  it("tournament 미존재 → no-op (tournament-not-found)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce(null);

    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-missing"
    );
    expect(result.updated).toBe(false);
    expect(result.reason).toBe("tournament-not-found");
    expect(client.tournament.update).not.toHaveBeenCalled();
  });

  it("status='ended' → no-op (already-final 추가 status 케이스)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "ended" });
    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(false);
    expect(result.reason).toBe("already-final-ended");
  });

  it("status='cancelled' → no-op (already-final 추가 status 케이스)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({ status: "cancelled" });
    const result = await checkAndAutoCompleteTournament(
      client as never,
      "t-1"
    );
    expect(result.updated).toBe(false);
    expect(result.reason).toBe("already-final-cancelled");
  });
});
