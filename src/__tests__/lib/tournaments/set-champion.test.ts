/**
 * 2026-06-15 — 우승팀 자동 set 유틸 (PR-CHAMPION ①) 회귀 가드.
 *
 * 검증:
 *   1. isFinalsRound PURE (결승 패턴 / 비결승 / null)
 *   2. knockout 결승 승자 → tt.teamId 변환 (★ FK 변환 핵심)
 *   3. round_robin 1위 → tt.teamId 변환
 *   4. group_stage 다조 → null 보류
 *   5. 결승 없음 → null (knockout 폴백도 실패)
 *   6. 이미 champion 있음 → skip (멱등 · 수동 박제 보호)
 *
 * ★ FK 핵심: winner_team_id / calculateLeagueRanking = TournamentTeam.id,
 *   champion_team_id = Team.id → tt.teamId 로 변환되는지 단언.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// calculateLeagueRanking 은 내부에서 @/lib/db/prisma 를 직접 import 하므로 모듈 모킹.
// resolveChampionTeamId 의 리그 분기 테스트에서 ranking 결과를 주입한다.
const mockCalculateLeagueRanking = vi.fn();
vi.mock("@/lib/tournaments/tournament-seeding", () => ({
  calculateLeagueRanking: (...args: unknown[]) => mockCalculateLeagueRanking(...args),
}));

import {
  isFinalsRound,
  resolveChampionTeamId,
  setTournamentChampion,
} from "@/lib/tournaments/set-champion";

type MockClient = {
  tournament: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  tournamentMatch: {
    findMany: ReturnType<typeof vi.fn>;
  };
  tournamentTeam: {
    findUnique: ReturnType<typeof vi.fn>;
  };
};

function makeClient(): MockClient {
  return {
    tournament: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    tournamentMatch: {
      findMany: vi.fn(),
    },
    tournamentTeam: {
      findUnique: vi.fn(),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1. isFinalsRound (PURE)
// ─────────────────────────────────────────────────────────────────────────
describe("isFinalsRound (PURE)", () => {
  it("결승 패턴 → true", () => {
    expect(isFinalsRound("결승")).toBe(true);
    expect(isFinalsRound("Final")).toBe(true);
    expect(isFinalsRound("FINALS")).toBe(true);
    expect(isFinalsRound("Championship")).toBe(true);
    expect(isFinalsRound("결승전")).toBe(true); // 부분 포함
  });

  it("비결승/null/빈문자 → false", () => {
    expect(isFinalsRound("8강")).toBe(false);
    expect(isFinalsRound("조별리그")).toBe(false);
    expect(isFinalsRound(null)).toBe(false);
    expect(isFinalsRound(undefined)).toBe(false);
    expect(isFinalsRound("")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2~5. resolveChampionTeamId (포맷별)
// ─────────────────────────────────────────────────────────────────────────
describe("resolveChampionTeamId", () => {
  let client: MockClient;

  beforeEach(() => {
    client = makeClient();
    mockCalculateLeagueRanking.mockReset();
  });

  it("knockout 결승 승자 → tt.teamId 변환 (★FK)", async () => {
    // 결승 매치: winner_team_id=999 (= TournamentTeam.id)
    client.tournamentMatch.findMany.mockResolvedValueOnce([
      {
        winner_team_id: BigInt(999),
        roundName: "결승",
        round_number: 5,
        next_match_id: null,
        scheduledAt: new Date("2026-06-10"),
      },
      {
        winner_team_id: BigInt(888),
        roundName: "4강",
        round_number: 4,
        next_match_id: BigInt(100),
        scheduledAt: new Date("2026-06-09"),
      },
    ]);
    // TournamentTeam.id=999 → teamId=42 (= Team.id)
    client.tournamentTeam.findUnique.mockResolvedValueOnce({ teamId: BigInt(42) });

    const result = await resolveChampionTeamId(
      client as never,
      "t-1",
      "single_elimination",
    );

    // ★ winner_team_id(999) 가 아니라 tt.teamId(42) 가 반환돼야 함 (FK 변환)
    expect(result).toBe(BigInt(42));
    expect(client.tournamentTeam.findUnique).toHaveBeenCalledWith({
      where: { id: BigInt(999) },
      select: { teamId: true },
    });
  });

  it("knockout roundName 없음 → next_match_id null 폴백 (round_number 최대)", async () => {
    client.tournamentMatch.findMany.mockResolvedValueOnce([
      {
        winner_team_id: BigInt(777),
        roundName: null, // 라운드명 미박제
        round_number: 3, // 최종전 (최대)
        next_match_id: null, // 다음 경기 없음
        scheduledAt: new Date("2026-06-10"),
      },
      {
        winner_team_id: BigInt(666),
        roundName: null,
        round_number: 2,
        next_match_id: BigInt(50),
        scheduledAt: new Date("2026-06-09"),
      },
    ]);
    client.tournamentTeam.findUnique.mockResolvedValueOnce({ teamId: BigInt(55) });

    const result = await resolveChampionTeamId(
      client as never,
      "t-1",
      "full_league_knockout",
    );

    // 폴백: next_match_id null + round_number 최대(3) 매치의 winner(777) → teamId(55)
    expect(result).toBe(BigInt(55));
    expect(client.tournamentTeam.findUnique).toHaveBeenCalledWith({
      where: { id: BigInt(777) },
      select: { teamId: true },
    });
  });

  it("round_robin 1위 → tt.teamId 변환", async () => {
    // calculateLeagueRanking: rank 1 의 tournamentTeamId=321 (= TournamentTeam.id)
    mockCalculateLeagueRanking.mockResolvedValueOnce([
      { tournamentTeamId: BigInt(321), rank: 1 },
      { tournamentTeamId: BigInt(654), rank: 2 },
    ]);
    client.tournamentTeam.findUnique.mockResolvedValueOnce({ teamId: BigInt(7) });

    const result = await resolveChampionTeamId(client as never, "t-1", "round_robin");

    // ★ tournamentTeamId(321) → teamId(7) 변환
    expect(result).toBe(BigInt(7));
    expect(mockCalculateLeagueRanking).toHaveBeenCalledWith("t-1");
    expect(client.tournamentTeam.findUnique).toHaveBeenCalledWith({
      where: { id: BigInt(321) },
      select: { teamId: true },
    });
  });

  it("group_stage 다조 → null 보류", async () => {
    const result = await resolveChampionTeamId(client as never, "t-1", "group_stage");
    expect(result).toBeNull();
    // 다조는 매치/팀 조회 자체를 하지 않음 (즉시 보류)
    expect(client.tournamentMatch.findMany).not.toHaveBeenCalled();
  });

  it("knockout 결승 승자 없음 → null", async () => {
    // winner_team_id NOT NULL 매치가 0건 (결승 미정)
    client.tournamentMatch.findMany.mockResolvedValueOnce([]);

    const result = await resolveChampionTeamId(
      client as never,
      "t-1",
      "single_elimination",
    );
    expect(result).toBeNull();
    expect(client.tournamentTeam.findUnique).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. setTournamentChampion (멱등)
// ─────────────────────────────────────────────────────────────────────────
describe("setTournamentChampion (멱등)", () => {
  let client: MockClient;

  beforeEach(() => {
    client = makeClient();
    mockCalculateLeagueRanking.mockReset();
  });

  it("이미 champion 있음 → skip (멱등 · update 미호출)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({
      champion_team_id: BigInt(100), // 이미 박제됨
      format: "single_elimination",
    });

    const result = await setTournamentChampion(client as never, "t-1");

    expect(result.status).toBe("skipped");
    expect(result.championTeamId).toBe("100");
    // ★ 멱등 — 기존 champion 보호, update 절대 호출 안 함
    expect(client.tournament.update).not.toHaveBeenCalled();
    expect(client.tournamentMatch.findMany).not.toHaveBeenCalled();
  });

  it("champion 없음 + knockout 결승 승자 있음 → set (champion=Team.id UPDATE)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({
      champion_team_id: null,
      format: "single_elimination",
    });
    client.tournamentMatch.findMany.mockResolvedValueOnce([
      {
        winner_team_id: BigInt(999),
        roundName: "결승",
        round_number: 5,
        next_match_id: null,
        scheduledAt: new Date("2026-06-10"),
      },
    ]);
    client.tournamentTeam.findUnique.mockResolvedValueOnce({ teamId: BigInt(42) });

    const result = await setTournamentChampion(client as never, "t-1");

    expect(result.status).toBe("set");
    expect(result.championTeamId).toBe("42");
    // ★ champion_team_id = Team.id(42) 로 UPDATE (mvp 미접촉)
    expect(client.tournament.update).toHaveBeenCalledWith({
      where: { id: "t-1" },
      data: { champion_team_id: BigInt(42) },
    });
  });

  it("champion 없음 + 우승팀 산출 불가 → no-champion (update 미호출)", async () => {
    client.tournament.findUnique.mockResolvedValueOnce({
      champion_team_id: null,
      format: "group_stage", // 다조 보류
    });

    const result = await setTournamentChampion(client as never, "t-1");

    expect(result.status).toBe("no-champion");
    expect(result.championTeamId).toBeNull();
    expect(client.tournament.update).not.toHaveBeenCalled();
  });

  it("tournament 미존재 → not-found", async () => {
    client.tournament.findUnique.mockResolvedValueOnce(null);

    const result = await setTournamentChampion(client as never, "t-1");

    expect(result.status).toBe("not-found");
    expect(client.tournament.update).not.toHaveBeenCalled();
  });
});
