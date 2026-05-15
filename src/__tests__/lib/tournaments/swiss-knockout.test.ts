/**
 * 2026-05-16 PR-G5.8 swiss generator — swiss-helpers.ts PURE 함수 검증.
 *
 * 검증 범위 (DB I/O 없는 plan 함수만):
 *   1) planSwissRound1 — 8팀 시드 매칭 정합 (1+5, 2+6, 3+7, 4+8)
 *   2) planSwissRound1 — 16팀 시드 매칭 정합 (1+9, ..., 8+16)
 *   3) planSwissRound1 — 7팀 (홀수) BYE 처리 (시드 7 자동 1승)
 *   4) getSwissRoundCount — 8팀=3 / 16팀=4 / 32팀=5 / 12팀=4
 *   5) planSwissNextRound — R2 standings 기반 매칭 (최근 대전 회피)
 *   6) planSwissNextRound — R3 동점자 그룹 매칭 (모두 만난 경우 relax 룰)
 *   7) planSwissNextRound — Buchholz tiebreak 정합 (동승자 정렬)
 *   8) 라운드 수 산출 + 라벨 형식 검증 ("스위스 R1" / "스위스 R2")
 *
 * 옵션 B (PR-G5.8 결정 — 2026-05-16):
 *   - generateSwissRound1 (DB I/O) 는 vitest 검증 대상 X (운영 진입 시점 별도 PR)
 *   - generateSwissNextRound = 501 stub throw 검증만 별도 (선택)
 *   - 본 테스트 = PURE 페어링 알고리즘 정확성 검증에 집중
 */
import { describe, it, expect } from "vitest";
import {
  planSwissRound1,
  planSwissNextRound,
  getSwissRoundCount,
  type SwissTeam,
  type SwissStanding,
} from "@/lib/tournaments/swiss-helpers";
import { generateSwissNextRound } from "@/lib/tournaments/swiss-knockout";

// 헬퍼: 시드 1..N 더미 팀 (tournamentTeamId = bigint 1·2·…)
function mkSwissTeams(n: number): SwissTeam[] {
  return Array.from({ length: n }, (_, i) => ({
    tournamentTeamId: BigInt(i + 1),
    seedNumber: i + 1,
  }));
}

// 헬퍼: standings 더미 (wins/losses/buchholz/pointDiff/opponentIds)
function mkStanding(opts: {
  id: number;
  wins: number;
  losses?: number;
  buchholz?: number;
  pd?: number;
  name?: string;
  opponents?: number[];
}): SwissStanding {
  return {
    tournamentTeamId: BigInt(opts.id),
    wins: opts.wins,
    losses: opts.losses ?? 0,
    buchholz: opts.buchholz ?? 0,
    pointDifference: opts.pd ?? 0,
    teamName: opts.name ?? `T${opts.id}`,
    opponentIds: (opts.opponents ?? []).map((n) => BigInt(n)),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 1) planSwissRound1 — 8팀 시드 매칭
// ─────────────────────────────────────────────────────────────────────────

describe("planSwissRound1 — 8팀 시드 양분 분배", () => {
  it("페어링 (1+5, 2+6, 3+7, 4+8) — half=4 양분 분배", () => {
    const result = planSwissRound1({
      teamCount: 8,
      seedingTeams: mkSwissTeams(8),
    });

    // BYE 0건 (짝수)
    expect(result.byeTeamIds).toHaveLength(0);

    // R1 매치 = 4건
    const r1 = result.matches.filter((m) => m.round_number === 1);
    expect(r1).toHaveLength(4);
    // 모두 status="scheduled" (BYE 없음)
    expect(r1.every((m) => m.status === "scheduled")).toBe(true);

    // 페어링 — 양분 분배 룰 (i + half)
    expect(r1[0].homeTeamId).toBe(BigInt(1));
    expect(r1[0].awayTeamId).toBe(BigInt(5));
    expect(r1[1].homeTeamId).toBe(BigInt(2));
    expect(r1[1].awayTeamId).toBe(BigInt(6));
    expect(r1[2].homeTeamId).toBe(BigInt(3));
    expect(r1[2].awayTeamId).toBe(BigInt(7));
    expect(r1[3].homeTeamId).toBe(BigInt(4));
    expect(r1[3].awayTeamId).toBe(BigInt(8));

    // 라벨 형식 검증 — "스위스 R1"
    expect(r1[0].roundName).toBe("스위스 R1");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2) planSwissRound1 — 16팀 시드 매칭
// ─────────────────────────────────────────────────────────────────────────

describe("planSwissRound1 — 16팀 시드 양분 분배", () => {
  it("페어링 (1+9, 2+10, ..., 8+16) — half=8 양분 분배", () => {
    const result = planSwissRound1({
      teamCount: 16,
      seedingTeams: mkSwissTeams(16),
    });

    expect(result.byeTeamIds).toHaveLength(0);

    const r1 = result.matches.filter((m) => m.round_number === 1);
    expect(r1).toHaveLength(8);

    // 8쌍 모두 검증 — i + half (half=8)
    for (let i = 0; i < 8; i++) {
      expect(r1[i].homeTeamId).toBe(BigInt(i + 1));
      expect(r1[i].awayTeamId).toBe(BigInt(i + 1 + 8));
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3) planSwissRound1 — 7팀 (홀수) BYE 처리
// ─────────────────────────────────────────────────────────────────────────

describe("planSwissRound1 — 7팀 (홀수) lowest seed BYE", () => {
  it("페어링 (1+4, 2+5, 3+6) + 시드 7 BYE (자동 1승)", () => {
    const result = planSwissRound1({
      teamCount: 7,
      seedingTeams: mkSwissTeams(7),
    });

    // BYE 1건 — 시드 7 (lowest)
    expect(result.byeTeamIds).toHaveLength(1);
    expect(result.byeTeamIds[0]).toBe(BigInt(7));

    // 매치 = 3 (실매치) + 1 (BYE) = 4건
    expect(result.matches).toHaveLength(4);

    // 실매치 3건 — half=3 (floor(7/2))
    const realMatches = result.matches.filter((m) => m.status === "scheduled");
    expect(realMatches).toHaveLength(3);
    expect(realMatches[0].homeTeamId).toBe(BigInt(1));
    expect(realMatches[0].awayTeamId).toBe(BigInt(4));
    expect(realMatches[1].homeTeamId).toBe(BigInt(2));
    expect(realMatches[1].awayTeamId).toBe(BigInt(5));
    expect(realMatches[2].homeTeamId).toBe(BigInt(3));
    expect(realMatches[2].awayTeamId).toBe(BigInt(6));

    // BYE 매치 1건 — 시드 7 home / away NULL / status="bye"
    const byeMatch = result.matches.find((m) => m.status === "bye");
    expect(byeMatch).toBeDefined();
    expect(byeMatch!.homeTeamId).toBe(BigInt(7));
    expect(byeMatch!.awayTeamId).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4) getSwissRoundCount — log2(N) 올림
// ─────────────────────────────────────────────────────────────────────────

describe("getSwissRoundCount — ceil(log2(N))", () => {
  it("8팀=3 / 16팀=4 / 32팀=5 / 12팀=4 / 2팀=1", () => {
    expect(getSwissRoundCount(8)).toBe(3);
    expect(getSwissRoundCount(16)).toBe(4);
    expect(getSwissRoundCount(32)).toBe(5);
    expect(getSwissRoundCount(12)).toBe(4); // ceil(log2(12)) = ceil(3.58) = 4
    expect(getSwissRoundCount(2)).toBe(1);
  });

  it("teamCount < 2 throw", () => {
    expect(() => getSwissRoundCount(1)).toThrow();
    expect(() => getSwissRoundCount(0)).toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5) planSwissNextRound — R2 standings 기반 (최근 대전 회피)
// ─────────────────────────────────────────────────────────────────────────

describe("planSwissNextRound — R2 동승자 매칭 + 최근 대전 회피", () => {
  it("8팀 R1 종료 후 R2 — 4승자끼리 / 4패자끼리 매칭 (R1 페어 회피)", () => {
    // R1 결과 가정: (1+5)→1승, (2+6)→2승, (3+7)→3승, (4+8)→4승
    // 승자 (1,2,3,4) / 패자 (5,6,7,8) — 모두 wins=1 또는 wins=0
    const standings: SwissStanding[] = [
      // 승자 4팀 (wins=1) — opponentIds = R1 상대
      mkStanding({ id: 1, wins: 1, opponents: [5] }),
      mkStanding({ id: 2, wins: 1, opponents: [6] }),
      mkStanding({ id: 3, wins: 1, opponents: [7] }),
      mkStanding({ id: 4, wins: 1, opponents: [8] }),
      // 패자 4팀 (wins=0) — opponentIds = R1 상대
      mkStanding({ id: 5, wins: 0, opponents: [1] }),
      mkStanding({ id: 6, wins: 0, opponents: [2] }),
      mkStanding({ id: 7, wins: 0, opponents: [3] }),
      mkStanding({ id: 8, wins: 0, opponents: [4] }),
    ];

    const result = planSwissNextRound({
      standings,
      roundNumber: 2,
    });

    expect(result.byeTeamIds).toHaveLength(0);
    expect(result.matches).toHaveLength(4);

    // 모두 R2 / "스위스 R2" 라벨
    expect(result.matches.every((m) => m.round_number === 2)).toBe(true);
    expect(result.matches[0].roundName).toBe("스위스 R2");

    // 매칭 검증: 동승자끼리 + 최근 대전 회피
    // 승자 1+2 매칭 (둘 다 wins=1, opponents 교집합 0) — 페어 [1,2]
    // 승자 3+4 매칭 — 페어 [3,4]
    // 패자 5+6 매칭 — 페어 [5,6]
    // 패자 7+8 매칭 — 페어 [7,8]
    expect(result.matches[0].homeTeamId).toBe(BigInt(1));
    expect(result.matches[0].awayTeamId).toBe(BigInt(2));
    expect(result.matches[1].homeTeamId).toBe(BigInt(3));
    expect(result.matches[1].awayTeamId).toBe(BigInt(4));
    expect(result.matches[2].homeTeamId).toBe(BigInt(5));
    expect(result.matches[2].awayTeamId).toBe(BigInt(6));
    expect(result.matches[3].homeTeamId).toBe(BigInt(7));
    expect(result.matches[3].awayTeamId).toBe(BigInt(8));
  });

  it("최근 대전 회피 — 1+2 가 이미 만났으면 1+3 페어로 우회", () => {
    // 가정: 4팀 R2 / 1+2 가 이미 만남 → 1+3 매칭 (회피)
    const standings: SwissStanding[] = [
      mkStanding({ id: 1, wins: 1, opponents: [2] }), // 1+2 이미 대전
      mkStanding({ id: 2, wins: 1, opponents: [1] }),
      mkStanding({ id: 3, wins: 1, opponents: [4] }),
      mkStanding({ id: 4, wins: 1, opponents: [3] }),
    ];

    const result = planSwissNextRound({
      standings,
      roundNumber: 2,
    });

    expect(result.matches).toHaveLength(2);
    // 1번 팀 = 첫 후보 (이미 만난 2 회피) → 3 과 매칭
    expect(result.matches[0].homeTeamId).toBe(BigInt(1));
    expect(result.matches[0].awayTeamId).toBe(BigInt(3));
    // 남은 2번과 4번 매칭
    expect(result.matches[1].homeTeamId).toBe(BigInt(2));
    expect(result.matches[1].awayTeamId).toBe(BigInt(4));
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6) planSwissNextRound — relax 룰 (모두 만난 경우)
// ─────────────────────────────────────────────────────────────────────────

describe("planSwissNextRound — relax 룰 (모두 만난 경우 강제 매칭)", () => {
  it("2팀 모두 이미 만났으면 강제 재대전 (relax fallback)", () => {
    // 마지막 라운드 폴백 케이스 — 2팀밖에 안 남았는데 이미 만났으면 강제 매칭
    const standings: SwissStanding[] = [
      mkStanding({ id: 1, wins: 1, opponents: [2] }),
      mkStanding({ id: 2, wins: 1, opponents: [1] }),
    ];

    const result = planSwissNextRound({
      standings,
      roundNumber: 3,
    });

    // relax 룰 진입 — 강제 매칭 1건
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].homeTeamId).toBe(BigInt(1));
    expect(result.matches[0].awayTeamId).toBe(BigInt(2));
    expect(result.matches[0].round_number).toBe(3);
    expect(result.matches[0].roundName).toBe("스위스 R3");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7) planSwissNextRound — Buchholz tiebreak 정합
// ─────────────────────────────────────────────────────────────────────────

describe("planSwissNextRound — Buchholz tiebreak 정렬", () => {
  it("동승자 (wins 동일) → buchholz desc 정렬 → 점수차 desc → 팀명 asc", () => {
    // 4팀 모두 wins=1 / buchholz 만 다름
    // 정렬 결과: id=2 (buchholz=10) → id=4 (8) → id=1 (5) → id=3 (3)
    // 페어: (2,4) (1,3) — 모두 만난 적 없음
    const standings: SwissStanding[] = [
      mkStanding({ id: 1, wins: 1, buchholz: 5, name: "C팀" }),
      mkStanding({ id: 2, wins: 1, buchholz: 10, name: "A팀" }),
      mkStanding({ id: 3, wins: 1, buchholz: 3, name: "D팀" }),
      mkStanding({ id: 4, wins: 1, buchholz: 8, name: "B팀" }),
    ];

    const result = planSwissNextRound({
      standings,
      roundNumber: 2,
    });

    expect(result.matches).toHaveLength(2);
    // buchholz 순 정렬 후 페어링: (2,4) 와 (1,3)
    expect(result.matches[0].homeTeamId).toBe(BigInt(2)); // buchholz 10
    expect(result.matches[0].awayTeamId).toBe(BigInt(4)); // buchholz 8
    expect(result.matches[1].homeTeamId).toBe(BigInt(1)); // buchholz 5
    expect(result.matches[1].awayTeamId).toBe(BigInt(3)); // buchholz 3
  });

  it("buchholz 동점 → pointDifference desc tiebreak", () => {
    // 4팀 wins/buchholz 동점 / pd 만 다름
    const standings: SwissStanding[] = [
      mkStanding({ id: 1, wins: 1, buchholz: 5, pd: 10 }),
      mkStanding({ id: 2, wins: 1, buchholz: 5, pd: 30 }),
      mkStanding({ id: 3, wins: 1, buchholz: 5, pd: 5 }),
      mkStanding({ id: 4, wins: 1, buchholz: 5, pd: 20 }),
    ];

    const result = planSwissNextRound({
      standings,
      roundNumber: 2,
    });

    // 정렬 결과: id=2(30) → id=4(20) → id=1(10) → id=3(5)
    expect(result.matches[0].homeTeamId).toBe(BigInt(2));
    expect(result.matches[0].awayTeamId).toBe(BigInt(4));
    expect(result.matches[1].homeTeamId).toBe(BigInt(1));
    expect(result.matches[1].awayTeamId).toBe(BigInt(3));
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8) 라벨 형식 + match_number 연속성 검증
// ─────────────────────────────────────────────────────────────────────────

describe("PR-G5.8 통합 — match_number 연속성 + 라벨 형식", () => {
  it("startMatchNumber=10 → R1 매치 번호 10·11·12·13 (8팀)", () => {
    const result = planSwissRound1({
      teamCount: 8,
      seedingTeams: mkSwissTeams(8),
      startMatchNumber: 10,
    });

    expect(result.matches[0].match_number).toBe(10);
    expect(result.matches[1].match_number).toBe(11);
    expect(result.matches[2].match_number).toBe(12);
    expect(result.matches[3].match_number).toBe(13);
  });

  it("R1 매치 라벨 = '스위스 R1' / R2 라벨 = '스위스 R2'", () => {
    const r1 = planSwissRound1({ teamCount: 4, seedingTeams: mkSwissTeams(4) });
    expect(r1.matches.every((m) => m.roundName === "스위스 R1")).toBe(true);

    const standings: SwissStanding[] = [
      mkStanding({ id: 1, wins: 1, opponents: [3] }),
      mkStanding({ id: 2, wins: 1, opponents: [4] }),
      mkStanding({ id: 3, wins: 0, opponents: [1] }),
      mkStanding({ id: 4, wins: 0, opponents: [2] }),
    ];
    const r2 = planSwissNextRound({ standings, roundNumber: 2 });
    expect(r2.matches.every((m) => m.roundName === "스위스 R2")).toBe(true);
  });

  it("generateSwissNextRound = 501 stub (옵션 B 결정 — 운영 진입 시점에 풀구현)", async () => {
    // 사유: 풀구현이 옵션 B 범위 밖 — throw 검증으로 stub 명시
    await expect(generateSwissNextRound("test-id", 2)).rejects.toThrow(
      /PR-G5.8 후속 PR/,
    );
  });
});
