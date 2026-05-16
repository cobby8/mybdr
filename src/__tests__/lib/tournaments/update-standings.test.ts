/**
 * 2026-05-16 영구 fix (PR-G5.5-followup-B) — updateTeamStandings SET 방식 검증.
 *
 * 배경 (errors.md 6회째 회귀):
 *   기존 increment 방식 → 동일 매치 다중 path 호출 시 N배 박제 (은평 PA 17→34 사고).
 *   본 영구 fix = SET 방식 변환 → idempotent + race 안전 + 외부 스크립트 안전.
 *
 * 검증 5 케이스 (PM 박제 spec):
 *   1. 단일 매치 종료 → 양 팀 정확한 stats
 *   2. **동일 매치 2회 호출 → idempotent** ⭐ (1차 사고 회귀 방지 핵심)
 *   3. 매치 3건 종료 → 합산 정확
 *   4. 매치 점수 수정 후 재호출 → SET 으로 정정
 *   5. 다른 종별 매치 영향 0 (격리)
 *
 * mock 패턴: vi.doMock("@/lib/db/prisma", ...) — match-sync.test.ts L370~ 동일.
 * 사유: updateTeamStandings 는 prisma 모듈을 직접 import → 동적 mock 후 import.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// 테스트 전후 mock reset
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
// 공통 타입 + helper — 매치 / 팀 in-memory 박제 + mock prisma 빌더
// ─────────────────────────────────────────────────────────────────────────

type MockMatch = {
  id: bigint;
  tournamentId: string;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  homeScore: number | null;
  awayScore: number | null;
  winner_team_id: bigint | null;
  status: string;
  settings: Record<string, unknown> | null;
};

type MockTeam = {
  id: bigint;
  tournamentId: string;
  teamId: bigint;
  wins: number;
  losses: number;
  draws: number;
  points_for: number;
  points_against: number;
  point_difference: number;
};

type UpdateManyCall = {
  where: { tournamentId: string; teamId: bigint };
  data: {
    wins: number;
    losses: number;
    draws: number;
    points_for: number;
    points_against: number;
    point_difference: number;
  };
};

/**
 * mock prisma 빌더 — 매치 리스트 + 팀 리스트 in-memory 박제.
 *
 * 동작:
 *   - tournamentMatch.findUnique: id 매칭 매치 반환
 *   - tournamentMatch.findMany: where 조건 (tournamentId + status + winner_team_id + settings.division_code) 필터
 *   - tournamentTeam.updateMany: where 매칭 팀 in-place mutation + updateCalls 박제
 *   - $transaction: Promise.all (순서 보존)
 */
function buildMockPrisma(matches: MockMatch[], teams: MockTeam[]) {
  const updateCalls: UpdateManyCall[] = [];
  const teamsState = teams.map((t) => ({ ...t })); // 사후 검증용 mutation

  const fake = {
    tournamentMatch: {
      findUnique: vi.fn(async (args: { where: { id: bigint } }) => {
        const m = matches.find((x) => x.id === args.where.id);
        return m ?? null;
      }),
      findMany: vi.fn(async (args: {
        where: {
          tournamentId: string;
          status?: string;
          winner_team_id?: { not: null } | null;
          settings?: { path: string[]; equals: string };
        };
      }) => {
        return matches.filter((m) => {
          if (m.tournamentId !== args.where.tournamentId) return false;
          if (args.where.status && m.status !== args.where.status) return false;
          // winner_team_id 필터: { not: null } 또는 null
          if (args.where.winner_team_id !== undefined) {
            if (args.where.winner_team_id === null) {
              if (m.winner_team_id !== null) return false;
            } else if (
              typeof args.where.winner_team_id === "object" &&
              "not" in args.where.winner_team_id &&
              args.where.winner_team_id.not === null
            ) {
              if (m.winner_team_id === null) return false;
            }
          }
          // settings.division_code 필터 (Prisma Json path)
          if (args.where.settings) {
            const path = args.where.settings.path;
            const expected = args.where.settings.equals;
            if (path.length === 1 && path[0] === "division_code") {
              const actual = m.settings?.division_code;
              if (actual !== expected) return false;
            }
          }
          return true;
        });
      }),
    },
    tournamentTeam: {
      updateMany: vi.fn(async (args: UpdateManyCall) => {
        updateCalls.push({
          where: { ...args.where },
          data: { ...args.data },
        });
        // in-place mutation (사후 검증)
        for (const t of teamsState) {
          if (t.tournamentId === args.where.tournamentId && t.teamId === args.where.teamId) {
            t.wins = args.data.wins;
            t.losses = args.data.losses;
            t.draws = args.data.draws;
            t.points_for = args.data.points_for;
            t.points_against = args.data.points_against;
            t.point_difference = args.data.point_difference;
          }
        }
        return { count: 1 };
      }),
    },
    // $transaction — 배열 형식 (Promise.all 동등 동작)
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops);
    }),
  };

  return { fake, updateCalls, teamsState };
}

// ─────────────────────────────────────────────────────────────────────────
// 고정 데이터 — 강남구 i3-U9 패턴 (4팀 / 종별 division_code="i3-U9")
// ─────────────────────────────────────────────────────────────────────────

const TID = "tournament-test-uuid-0001";
const DIV = "i3-U9";
const T_A = BigInt(100); // 팀 A
const T_B = BigInt(200); // 팀 B
const T_C = BigInt(300); // 팀 C
const T_D = BigInt(400); // 팀 D (다른 종별 격리 검증용)
const M_1 = BigInt(1001); // 매치 1: A vs B
const M_2 = BigInt(1002); // 매치 2: A vs C
const M_3 = BigInt(1003); // 매치 3: B vs C
const M_OTHER = BigInt(2001); // 다른 종별 매치

function makeTeam(teamId: bigint, tournamentId = TID): MockTeam {
  return {
    id: teamId * BigInt(10),
    tournamentId,
    teamId,
    wins: 0,
    losses: 0,
    draws: 0,
    points_for: 0,
    points_against: 0,
    point_difference: 0,
  };
}

function findTeam(teamsState: MockTeam[], teamId: bigint) {
  return teamsState.find((t) => t.teamId === teamId);
}

// ─────────────────────────────────────────────────────────────────────────
// 케이스 1: 단일 매치 종료 → 양 팀 정확한 stats
// ─────────────────────────────────────────────────────────────────────────

describe("updateTeamStandings — 케이스 1: 단일 매치 종료", () => {
  it("A(20) vs B(15) 홈 승 → A wins=1/PF=20/PA=15 / B losses=1/PF=15/PA=20", async () => {
    const matches: MockMatch[] = [
      {
        id: M_1,
        tournamentId: TID,
        homeTeamId: T_A,
        awayTeamId: T_B,
        homeScore: 20,
        awayScore: 15,
        winner_team_id: T_A,
        status: "completed",
        settings: { division_code: DIV },
      },
    ];
    const teams: MockTeam[] = [makeTeam(T_A), makeTeam(T_B)];
    const { fake, updateCalls, teamsState } = buildMockPrisma(matches, teams);

    vi.doMock("@/lib/db/prisma", () => ({ prisma: fake }));
    const { updateTeamStandings } = await import("@/lib/tournaments/update-standings");
    await updateTeamStandings(M_1);

    // 양 팀 UPDATE 호출
    expect(updateCalls).toHaveLength(2);

    // A 팀 (홈 승)
    const aTeam = findTeam(teamsState, T_A);
    expect(aTeam).toMatchObject({
      wins: 1,
      losses: 0,
      draws: 0,
      points_for: 20,
      points_against: 15,
      point_difference: 5,
    });

    // B 팀 (원정 패)
    const bTeam = findTeam(teamsState, T_B);
    expect(bTeam).toMatchObject({
      wins: 0,
      losses: 1,
      draws: 0,
      points_for: 15,
      points_against: 20,
      point_difference: -5,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 케이스 2: 동일 매치 2회 호출 → idempotent ⭐
// ─────────────────────────────────────────────────────────────────────────

describe("updateTeamStandings — 케이스 2: idempotent (1차 사고 회귀 방지)", () => {
  it("동일 매치 3회 호출 → wins/losses/PF/PA 변화 0 (1회 = 3회 결과 동일)", async () => {
    const matches: MockMatch[] = [
      {
        id: M_1,
        tournamentId: TID,
        homeTeamId: T_A,
        awayTeamId: T_B,
        homeScore: 17,
        awayScore: 12,
        winner_team_id: T_A,
        status: "completed",
        settings: { division_code: DIV },
      },
    ];
    const teams: MockTeam[] = [makeTeam(T_A), makeTeam(T_B)];
    const { fake, teamsState } = buildMockPrisma(matches, teams);

    vi.doMock("@/lib/db/prisma", () => ({ prisma: fake }));
    const { updateTeamStandings } = await import("@/lib/tournaments/update-standings");

    // 3회 호출 (race / batch-sync 재전송 / 외부 스크립트 시뮬레이션)
    await updateTeamStandings(M_1);
    await updateTeamStandings(M_1);
    await updateTeamStandings(M_1);

    // 결과 = 1회 호출과 동일 (SET 방식이라 누적 X — 은평 PA 17→34 사고 차단)
    expect(findTeam(teamsState, T_A)).toMatchObject({
      wins: 1, losses: 0, draws: 0,
      points_for: 17, points_against: 12, point_difference: 5,
    });
    expect(findTeam(teamsState, T_B)).toMatchObject({
      wins: 0, losses: 1, draws: 0,
      points_for: 12, points_against: 17, point_difference: -5,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 케이스 3: 매치 3건 종료 → 합산 정확
// ─────────────────────────────────────────────────────────────────────────

describe("updateTeamStandings — 케이스 3: 매치 3건 합산", () => {
  it("A vs B (A승 20-15) / A vs C (A승 18-10) / B vs C (B승 12-8) → 매치 3 후 trigger 시 B 합산 정확", async () => {
    // 매치 3건 모두 완료 상태
    const matches: MockMatch[] = [
      {
        id: M_1, tournamentId: TID, homeTeamId: T_A, awayTeamId: T_B,
        homeScore: 20, awayScore: 15, winner_team_id: T_A,
        status: "completed", settings: { division_code: DIV },
      },
      {
        id: M_2, tournamentId: TID, homeTeamId: T_A, awayTeamId: T_C,
        homeScore: 18, awayScore: 10, winner_team_id: T_A,
        status: "completed", settings: { division_code: DIV },
      },
      {
        id: M_3, tournamentId: TID, homeTeamId: T_B, awayTeamId: T_C,
        homeScore: 12, awayScore: 8, winner_team_id: T_B,
        status: "completed", settings: { division_code: DIV },
      },
    ];
    const teams: MockTeam[] = [makeTeam(T_A), makeTeam(T_B), makeTeam(T_C)];
    const { fake, teamsState } = buildMockPrisma(matches, teams);

    vi.doMock("@/lib/db/prisma", () => ({ prisma: fake }));
    const { updateTeamStandings } = await import("@/lib/tournaments/update-standings");

    // 매치 3 (B vs C) trigger → B + C 합산 SET
    await updateTeamStandings(M_3);

    // B 팀: 매치 1 패 (PF=15 PA=20) + 매치 3 승 (PF=12 PA=8) = wins=1 losses=1 PF=27 PA=28
    expect(findTeam(teamsState, T_B)).toMatchObject({
      wins: 1, losses: 1, draws: 0,
      points_for: 27, points_against: 28, point_difference: -1,
    });

    // C 팀: 매치 2 패 (PF=10 PA=18) + 매치 3 패 (PF=8 PA=12) = wins=0 losses=2 PF=18 PA=30
    expect(findTeam(teamsState, T_C)).toMatchObject({
      wins: 0, losses: 2, draws: 0,
      points_for: 18, points_against: 30, point_difference: -12,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 케이스 4: 매치 점수 수정 후 재호출 → SET 으로 정정
// ─────────────────────────────────────────────────────────────────────────

describe("updateTeamStandings — 케이스 4: 매치 점수 수정 후 정정", () => {
  it("A vs B (A승 20-15) 박제 후 → 점수 수정 (B승 12-20) → 재호출 시 SET 으로 정정", async () => {
    const matches: MockMatch[] = [
      {
        id: M_1, tournamentId: TID, homeTeamId: T_A, awayTeamId: T_B,
        homeScore: 20, awayScore: 15, winner_team_id: T_A,
        status: "completed", settings: { division_code: DIV },
      },
    ];
    const teams: MockTeam[] = [makeTeam(T_A), makeTeam(T_B)];
    const { fake, teamsState } = buildMockPrisma(matches, teams);

    vi.doMock("@/lib/db/prisma", () => ({ prisma: fake }));
    const { updateTeamStandings } = await import("@/lib/tournaments/update-standings");

    // 1차 호출 — A 승
    await updateTeamStandings(M_1);
    expect(findTeam(teamsState, T_A)).toMatchObject({ wins: 1, losses: 0, points_for: 20, points_against: 15 });
    expect(findTeam(teamsState, T_B)).toMatchObject({ wins: 0, losses: 1, points_for: 15, points_against: 20 });

    // 점수 수정 (관리자가 admin PATCH 로 점수 교정) — 매치 데이터 변경
    matches[0].homeScore = 12;
    matches[0].awayScore = 20;
    matches[0].winner_team_id = T_B;

    // 2차 호출 — B 승으로 정정
    await updateTeamStandings(M_1);

    // A 팀: 패배로 정정 (SET 방식이라 wins=0 으로 reset / increment 였으면 wins=1 누적)
    expect(findTeam(teamsState, T_A)).toMatchObject({
      wins: 0, losses: 1, draws: 0,
      points_for: 12, points_against: 20, point_difference: -8,
    });
    // B 팀: 승리로 정정
    expect(findTeam(teamsState, T_B)).toMatchObject({
      wins: 1, losses: 0, draws: 0,
      points_for: 20, points_against: 12, point_difference: 8,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 케이스 5: 다른 종별 매치 영향 0 (격리)
// ─────────────────────────────────────────────────────────────────────────

describe("updateTeamStandings — 케이스 5: 종별 격리", () => {
  it("종별 'i3-U9' 매치 trigger → 다른 종별 'i4-U10' 매치는 합산 영향 0", async () => {
    // 같은 tournament 에 두 종별 (i3-U9 / i4-U10) 매치 공존
    // 팀 A 가 두 종별에 모두 참가 (가상 시나리오) — 격리 검증
    const matches: MockMatch[] = [
      // i3-U9 매치: A vs B (A 승 20-15)
      {
        id: M_1, tournamentId: TID, homeTeamId: T_A, awayTeamId: T_B,
        homeScore: 20, awayScore: 15, winner_team_id: T_A,
        status: "completed", settings: { division_code: "i3-U9" },
      },
      // i4-U10 매치: A vs D (A 패 5-30) — 다른 종별 → 합산 제외 의무
      {
        id: M_OTHER, tournamentId: TID, homeTeamId: T_A, awayTeamId: T_D,
        homeScore: 5, awayScore: 30, winner_team_id: T_D,
        status: "completed", settings: { division_code: "i4-U10" },
      },
    ];
    const teams: MockTeam[] = [makeTeam(T_A), makeTeam(T_B), makeTeam(T_D)];
    const { fake, teamsState } = buildMockPrisma(matches, teams);

    vi.doMock("@/lib/db/prisma", () => ({ prisma: fake }));
    const { updateTeamStandings } = await import("@/lib/tournaments/update-standings");

    // i3-U9 매치 trigger → A 팀의 stats 는 i3-U9 매치만 합산 (i4-U10 격리)
    await updateTeamStandings(M_1);

    // A 팀: i3-U9 매치만 (20-15 승) — i4-U10 패배 포함 시 PF=25 PA=45 인데 격리되어 PF=20 PA=15 유지
    expect(findTeam(teamsState, T_A)).toMatchObject({
      wins: 1, losses: 0, draws: 0,
      points_for: 20, points_against: 15, point_difference: 5,
    });

    // B 팀: 정상 (i3-U9 매치만)
    expect(findTeam(teamsState, T_B)).toMatchObject({
      wins: 0, losses: 1, draws: 0,
      points_for: 15, points_against: 20, point_difference: -5,
    });

    // D 팀: i4-U10 trigger 가 아니므로 영향 0 (초기값 유지)
    expect(findTeam(teamsState, T_D)).toMatchObject({
      wins: 0, losses: 0, draws: 0,
      points_for: 0, points_against: 0, point_difference: 0,
    });
  });
});
