import { beforeEach, describe, expect, it, vi } from "vitest";

const updateTeamStandingsMock = vi.fn();
const advanceWinnerMock = vi.fn();
const progressDualMatchMock = vi.fn();
const advanceDivisionPlaceholdersMock = vi.fn();
const advanceTournamentPlaceholdersMock = vi.fn();
const checkAndAutoCompleteTournamentMock = vi.fn();
const setTournamentChampionMock = vi.fn();

const prismaMock = {
  tournament: {
    findUnique: vi.fn(),
  },
  tournamentMatch: {
    findUnique: vi.fn(),
  },
  tournamentDivisionRule: {
    count: vi.fn(),
  },
  $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaMock)),
};

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/tournaments/update-standings", () => ({
  advanceWinner: advanceWinnerMock,
  updateTeamStandings: updateTeamStandingsMock,
}));

vi.mock("@/lib/tournaments/dual-progression", () => ({
  progressDualMatch: progressDualMatchMock,
}));

vi.mock("@/lib/tournaments/division-advancement", () => ({
  advanceDivisionPlaceholders: advanceDivisionPlaceholdersMock,
  advanceTournamentPlaceholders: advanceTournamentPlaceholdersMock,
}));

vi.mock("@/lib/tournaments/auto-complete", () => ({
  checkAndAutoCompleteTournament: checkAndAutoCompleteTournamentMock,
}));

vi.mock("@/lib/tournaments/set-champion", () => ({
  setTournamentChampion: setTournamentChampionMock,
}));

describe("finalizeMatchCompletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateTeamStandingsMock.mockResolvedValue(undefined);
    advanceWinnerMock.mockResolvedValue(undefined);
    progressDualMatchMock.mockResolvedValue(undefined);
    advanceDivisionPlaceholdersMock.mockResolvedValue(undefined);
    advanceTournamentPlaceholdersMock.mockResolvedValue(undefined);
    checkAndAutoCompleteTournamentMock.mockResolvedValue({ changed: false });
    setTournamentChampionMock.mockResolvedValue(null);
    prismaMock.tournamentDivisionRule.count.mockResolvedValue(1);
  });

  it("종별 듀얼토너먼트 경기면 대회 전체 포맷과 무관하게 듀얼 진출을 처리한다", async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ format: "group_stage_knockout" });
    prismaMock.tournamentMatch.findUnique.mockResolvedValue({
      settings: { stage: "dual_group", division_code: "U40" },
      winner_team_id: BigInt(10),
    });

    const { finalizeMatchCompletion } = await import(
      "@/lib/tournaments/finalize-match-completion"
    );

    const result = await finalizeMatchCompletion(
      BigInt(100),
      "tournament-1",
      "admin-patch",
      { winnerTeamId: BigInt(10) },
    );

    expect(result.steps.advance).toBe("dual");
    expect(progressDualMatchMock).toHaveBeenCalledWith(
      prismaMock,
      BigInt(100),
      BigInt(10),
    );
    expect(advanceWinnerMock).not.toHaveBeenCalled();
    expect(advanceDivisionPlaceholdersMock).toHaveBeenCalledWith(
      prismaMock,
      "tournament-1",
      "U40",
    );
  });
});
