/**
 * 2026-05-15 PR-G5.5-followup — Tournament 단위 placeholder applier 단위 검증.
 *
 * 검증 범위 (planner 설계 4 케이스):
 *   1. 정상 — 단판 결승 (3팀×2조 standings → A1+B1 row UPDATE 1건)
 *   2. idempotent — 이미 채워짐 skip (homeTeamId/awayTeamId 모두 NULL 아니면 fetch 진입 X)
 *   3. notes 형식 위반 — error 박제 (parseAdvancement null 반환)
 *   4. 절반 NULL — home 만 UPDATE / away 보존 (운영자 수동 변경 보호)
 *
 * 본 함수는 DB 접근 (prisma.tournamentTeam.findMany / tournamentMatch.findMany / update)
 * → PrismaClient mock 박제 (in-memory fake) 패턴 채택.
 *
 * 사유 mock 채택:
 *   - 기존 division-placeholder-plan.test.ts = 순수 plan 함수 검증 (DB mock 불필요)
 *   - 본 함수 = standings 계산 + placeholder 매핑 + UPDATE → DB I/O 검증 필수
 */
import { describe, it, expect, vi } from "vitest";
import { advanceTournamentPlaceholders, getTournamentStandings } from "@/lib/tournaments/division-advancement";

// ─────────────────────────────────────────────────────────────────────────
// In-memory fake PrismaClient
// ─────────────────────────────────────────────────────────────────────────
// 사유: vi.mock("@prisma/client") 보다 fake 객체가 가독성 ↑ + 검증 assertion 단순.
//   findMany / update 만 mock — 실제 사용 메서드 한정.

type FakeTeam = {
  id: bigint;
  groupName: string | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  points_for: number | null;
  points_against: number | null;
  point_difference: number | null;
  team: { name: string } | null;
};

type FakeMatch = {
  id: bigint;
  notes: string | null;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
};

type UpdateCall = {
  id: bigint;
  data: { homeTeamId?: bigint; awayTeamId?: bigint };
};

/**
 * fake prisma builder — 4 케이스 시나리오 박제.
 *
 * @param teams - TournamentTeam findMany 반환값
 * @param matches - TournamentMatch findMany 반환값 (placeholder 만)
 */
function buildFakePrisma(teams: FakeTeam[], matches: FakeMatch[]) {
  const updateCalls: UpdateCall[] = [];
  // 사후 검증용 in-memory 상태 mutation (절반 NULL 케이스 검증 시 사용)
  const matchesById = new Map(matches.map((m) => [m.id.toString(), { ...m }]));

  const fake = {
    tournamentTeam: {
      findMany: vi.fn(async () => teams),
    },
    tournamentMatch: {
      findMany: vi.fn(async () => {
        // 함수 실행 시점에 현 상태 (절반 NULL home/away 검증 위해)
        return Array.from(matchesById.values()).filter(
          (m) => m.homeTeamId === null || m.awayTeamId === null,
        );
      }),
      update: vi.fn(async (args: { where: { id: bigint }; data: { homeTeamId?: bigint; awayTeamId?: bigint } }) => {
        updateCalls.push({ id: args.where.id, data: args.data });
        // matchesById mutation (사후 검증 시 사용)
        const existing = matchesById.get(args.where.id.toString());
        if (existing) {
          if (args.data.homeTeamId !== undefined) existing.homeTeamId = args.data.homeTeamId;
          if (args.data.awayTeamId !== undefined) existing.awayTeamId = args.data.awayTeamId;
        }
        return { id: args.where.id };
      }),
    },
  };

  return { fake, updateCalls, matchesById };
}

// 4차 BDR 뉴비리그 시나리오 — A조/B조 각 3팀 (standings 박제값 다름 → rank 1/2/3)
// 사유: target=ES2017 호환을 위해 BigInt 리터럴 (100n) 대신 BigInt(100) 호출 사용.
const A1_ID = BigInt(100);
const A2_ID = BigInt(101);
const A3_ID = BigInt(102);
const B1_ID = BigInt(200);
const B2_ID = BigInt(201);
const B3_ID = BigInt(202);
const MATCH_232_ID = BigInt(232);
const MATCH_300_ID = BigInt(300);
const MANUAL_AWAY_ID = BigInt(999);

const NEWBIE4_TEAMS: FakeTeam[] = [
  // A조 — wins desc 정렬 시 A1=id100 (2승) / A2=id101 (1승) / A3=id102 (0승)
  { id: A1_ID, groupName: "A", wins: 2, losses: 0, draws: 0, points_for: 50, points_against: 30, point_difference: 20, team: { name: "Alpha" } },
  { id: A2_ID, groupName: "A", wins: 1, losses: 1, draws: 0, points_for: 40, points_against: 40, point_difference: 0, team: { name: "Bravo" } },
  { id: A3_ID, groupName: "A", wins: 0, losses: 2, draws: 0, points_for: 30, points_against: 50, point_difference: -20, team: { name: "Charlie" } },
  // B조 — B1=id200 (2승) / B2=id201 / B3=id202
  { id: B1_ID, groupName: "B", wins: 2, losses: 0, draws: 0, points_for: 55, points_against: 35, point_difference: 20, team: { name: "Delta" } },
  { id: B2_ID, groupName: "B", wins: 1, losses: 1, draws: 0, points_for: 42, points_against: 42, point_difference: 0, team: { name: "Echo" } },
  { id: B3_ID, groupName: "B", wins: 0, losses: 2, draws: 0, points_for: 28, points_against: 48, point_difference: -20, team: { name: "Foxtrot" } },
];

const TOURNAMENT_ID = "443f23f8-0000-41d4-bcbd-1843f7e16e1f";

// ─────────────────────────────────────────────────────────────────────────
// getTournamentStandings — category 필터 제거 + groupRank 박제
// ─────────────────────────────────────────────────────────────────────────

describe("getTournamentStandings — category 무관 Tournament 단위 standings", () => {
  it("groupName 기준 분류 + wins/pd/pf 정렬 + groupRank 박제", async () => {
    const { fake } = buildFakePrisma(NEWBIE4_TEAMS, []);
    const standings = await getTournamentStandings(fake as unknown as Parameters<typeof getTournamentStandings>[0], TOURNAMENT_ID);

    expect(standings).toHaveLength(6);
    // A조 standings 순서 = id100 → id101 → id102 (wins desc)
    expect(standings[0]).toMatchObject({ tournamentTeamId: A1_ID.toString(), groupName: "A", groupRank: 1, teamName: "Alpha" });
    expect(standings[1]).toMatchObject({ tournamentTeamId: A2_ID.toString(), groupName: "A", groupRank: 2 });
    expect(standings[2]).toMatchObject({ tournamentTeamId: A3_ID.toString(), groupName: "A", groupRank: 3 });
    // B조 standings
    expect(standings[3]).toMatchObject({ tournamentTeamId: B1_ID.toString(), groupName: "B", groupRank: 1, teamName: "Delta" });
    expect(standings[4]).toMatchObject({ tournamentTeamId: B2_ID.toString(), groupName: "B", groupRank: 2 });
    expect(standings[5]).toMatchObject({ tournamentTeamId: B3_ID.toString(), groupName: "B", groupRank: 3 });

    // findMany category 필터 없음 검증 (where 절에 tournamentId 만)
    expect(fake.tournamentTeam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tournamentId: TOURNAMENT_ID } }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// advanceTournamentPlaceholders — 4 케이스 (planner spec)
// ─────────────────────────────────────────────────────────────────────────

describe("advanceTournamentPlaceholders — Tournament 단위 placeholder applier", () => {
  it("케이스 1: 정상 — 단판 결승 (A1+B1 row UPDATE 1건)", async () => {
    // 4차 뉴비리그 매치 232 시나리오 — homeTeamId/awayTeamId 모두 NULL + notes "A조 1위 vs B조 1위"
    const matches: FakeMatch[] = [
      {
        id: MATCH_232_ID,
        notes: "A조 1위 vs B조 1위",
        homeTeamId: null,
        awayTeamId: null,
      },
    ];
    const { fake, updateCalls, matchesById } = buildFakePrisma(NEWBIE4_TEAMS, matches);

    const result = await advanceTournamentPlaceholders(
      fake as unknown as Parameters<typeof advanceTournamentPlaceholders>[0],
      TOURNAMENT_ID,
    );

    expect(result.tournamentId).toBe(TOURNAMENT_ID);
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.standings).toHaveLength(6); // A조 3 + B조 3

    // UPDATE 호출 검증 — A1=100 / B1=200 매핑 정확
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toEqual({
      id: MATCH_232_ID,
      data: { homeTeamId: A1_ID, awayTeamId: B1_ID },
    });

    // 사후 상태 검증 — 매치 232 row 가 A1/B1 으로 채워짐
    const after = matchesById.get(MATCH_232_ID.toString());
    expect(after?.homeTeamId).toBe(A1_ID);
    expect(after?.awayTeamId).toBe(B1_ID);
  });

  it("케이스 2: idempotent — 이미 채워진 매치 fetch 제외 (where 절 OR NULL)", async () => {
    // 시나리오 — 매치 232 가 이미 실팀 박제 (A1/B1 채움 완료)
    const matches: FakeMatch[] = [
      {
        id: MATCH_232_ID,
        notes: "A조 1위 vs B조 1위",
        homeTeamId: A1_ID,
        awayTeamId: B1_ID,
      },
    ];
    const { fake, updateCalls } = buildFakePrisma(NEWBIE4_TEAMS, matches);

    const result = await advanceTournamentPlaceholders(
      fake as unknown as Parameters<typeof advanceTournamentPlaceholders>[0],
      TOURNAMENT_ID,
    );

    // fetch 진입 자체 안 됨 (where OR null 필터) → updated=0 / skipped=0 / UPDATE 호출 0
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);
    expect(updateCalls).toHaveLength(0);
    expect(fake.tournamentMatch.update).not.toHaveBeenCalled();
  });

  it("케이스 3: notes 형식 위반 — parseAdvancement null → error 박제 + skip", async () => {
    // 시나리오 — notes 가 ADVANCEMENT_REGEX 미매칭 ("결승전" 단순 텍스트)
    const matches: FakeMatch[] = [
      {
        id: MATCH_300_ID,
        notes: "결승전",
        homeTeamId: null,
        awayTeamId: null,
      },
    ];
    const { fake, updateCalls } = buildFakePrisma(NEWBIE4_TEAMS, matches);

    const result = await advanceTournamentPlaceholders(
      fake as unknown as Parameters<typeof advanceTournamentPlaceholders>[0],
      TOURNAMENT_ID,
    );

    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      matchId: "300",
      reason: expect.stringContaining("notes 파싱 실패"),
    });
    // UPDATE 호출 0 — 운영 DB 영향 0 (notes 위반 = 안전 fail)
    expect(updateCalls).toHaveLength(0);
  });

  it("케이스 4: 절반 NULL — home 만 UPDATE / away 기존 실팀 보존 (운영자 수동 변경 보호)", async () => {
    // 시나리오 — 운영자가 away 만 수동으로 채웠고 home 은 placeholder 상태
    // 기대: home 만 UPDATE / away 는 그대로 보존
    const matches: FakeMatch[] = [
      {
        id: MATCH_232_ID,
        notes: "A조 1위 vs B조 1위",
        homeTeamId: null, // ← applier 가 A1=100 으로 채움
        awayTeamId: MANUAL_AWAY_ID, // ← 운영자 수동 박제 — 보존 의무
      },
    ];
    const { fake, updateCalls, matchesById } = buildFakePrisma(NEWBIE4_TEAMS, matches);

    const result = await advanceTournamentPlaceholders(
      fake as unknown as Parameters<typeof advanceTournamentPlaceholders>[0],
      TOURNAMENT_ID,
    );

    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);

    // UPDATE data 검증 — homeTeamId 만 set / awayTeamId 미포함 (보존)
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].data).toEqual({ homeTeamId: A1_ID });
    expect(updateCalls[0].data).not.toHaveProperty("awayTeamId");

    // 사후 상태 — home=A1(100) 새 박제 / away=999 그대로
    const after = matchesById.get(MATCH_232_ID.toString());
    expect(after?.homeTeamId).toBe(A1_ID);
    expect(after?.awayTeamId).toBe(MANUAL_AWAY_ID);
  });
});
