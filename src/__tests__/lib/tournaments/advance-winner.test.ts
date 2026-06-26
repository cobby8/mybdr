import { beforeEach, describe, expect, it, vi } from "vitest";

const MATCH_ID = BigInt(1);
const NEXT_MATCH_ID = BigInt(2);
const WINNER_TEAM_ID = BigInt(10);

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

type FindUniqueArgs = {
  where: { id: bigint };
  select?: Record<string, unknown>;
};

type UpdateArgs = {
  where: { id: bigint };
  data: Record<string, unknown>;
};

function mockAdvanceWinnerPrisma(params: {
  source: Record<string, unknown>;
  target?: Record<string, unknown> | null;
  format?: string;
}) {
  const update = vi.fn(async (args: UpdateArgs) => ({
    id: args.where.id,
    ...args.data,
  }));

  const findUnique = vi.fn(async (args: FindUniqueArgs) => {
    if (args.select?.tournament) {
      return { tournament: { format: params.format ?? "single_elimination" } };
    }

    if (args.where.id === params.source.id) return params.source;
    if (params.target && args.where.id === params.target.id) return params.target;
    return null;
  });

  const fake = {
    tournamentMatch: {
      findUnique,
      update,
    },
  };

  vi.doMock("@/lib/db/prisma", () => ({ prisma: fake }));

  return { findUnique, update };
}

describe("advanceWinner", () => {
  it("uses next_match_slot even when another target slot is empty", async () => {
    const { update } = mockAdvanceWinnerPrisma({
      source: {
        id: MATCH_ID,
        next_match_id: NEXT_MATCH_ID,
        next_match_slot: "away",
        winner_team_id: WINNER_TEAM_ID,
      },
      target: {
        id: NEXT_MATCH_ID,
        homeTeamId: null,
        awayTeamId: null,
      },
    });

    const { advanceWinner } = await import("@/lib/tournaments/update-standings");

    await advanceWinner(MATCH_ID);

    expect(update).toHaveBeenCalledWith({
      where: { id: NEXT_MATCH_ID },
      data: { awayTeamId: WINNER_TEAM_ID },
    });
  });

  it("fails instead of falling back to the first empty slot when next_match_slot is missing", async () => {
    const { update } = mockAdvanceWinnerPrisma({
      source: {
        id: MATCH_ID,
        next_match_id: NEXT_MATCH_ID,
        next_match_slot: null,
        winner_team_id: WINNER_TEAM_ID,
      },
      target: {
        id: NEXT_MATCH_ID,
        homeTeamId: null,
        awayTeamId: null,
      },
    });

    const { advanceWinner } = await import("@/lib/tournaments/update-standings");

    await expect(advanceWinner(MATCH_ID)).rejects.toThrow("next_match_slot is required");
    expect(update).not.toHaveBeenCalled();
  });
});
