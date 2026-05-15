/**
 * 2026-05-16 PR-G5.5-NBA-seed — nba-seed-knockout.ts PURE 함수 검증.
 *
 * 검증 범위 (DB I/O 없는 planNbaSeedKnockout 만):
 *   1) 8팀 NBA 표준 — 1R 4매치 / 페어링 (1·8 / 4·5 / 3·6 / 2·7)
 *   2) 6팀 BYE 2건 — 1R 2매치 (4·5 / 3·6) + 시드 1·2 자동 2R 진출
 *   3) 12팀 BYE 4건 — 1R 4매치 + 시드 1·2·3·4 자동 2R 진출
 *   4) 16팀 표준 — 1R 8매치 NBA 양분
 *   5) placeholder-helpers 통과 — 라벨 정규식 매칭 100% (인라인 박제 금지 검증)
 */
import { describe, it, expect } from "vitest";
import { planNbaSeedKnockout } from "@/lib/tournaments/nba-seed-knockout";
import { parseSlotLabel } from "@/lib/tournaments/placeholder-helpers";

// 헬퍼: 시드 1..N 더미 팀 (tournamentTeamId = bigint 1·2·…)
function mkTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    tournamentTeamId: BigInt(i + 1),
    seedNumber: i + 1,
  }));
}

describe("planNbaSeedKnockout — 8팀 NBA 표준 (1R 4매치)", () => {
  it("페어링 (1·8 / 4·5 / 2·7 / 3·6) + bracketSize=8 / totalRounds=3 (양분 순)", () => {
    const result = planNbaSeedKnockout({
      teams: mkTeams(8),
      knockoutSize: 8,
    });

    expect(result.bracketSize).toBe(8);
    expect(result.totalRounds).toBe(3);
    expect(result.byeSeeds).toHaveLength(0);

    // 1R 매치 = 4건
    const r1 = result.matches.filter((m) => m.round_number === 1);
    expect(r1).toHaveLength(4);

    // 페어링 검증 — bracket_position 순서대로 NBA 양분 트리
    // 양분 순: 첫 트리 절반 = (1,8)(4,5) / 두 번째 트리 절반 = (2,7)(3,6)
    expect(r1[0].homeTeamId).toBe(BigInt(1));
    expect(r1[0].awayTeamId).toBe(BigInt(8));
    expect(r1[1].homeTeamId).toBe(BigInt(4));
    expect(r1[1].awayTeamId).toBe(BigInt(5));
    expect(r1[2].homeTeamId).toBe(BigInt(2));
    expect(r1[2].awayTeamId).toBe(BigInt(7));
    expect(r1[3].homeTeamId).toBe(BigInt(3));
    expect(r1[3].awayTeamId).toBe(BigInt(6));

    // 2R 매치 = 2건 (준결승) / 3R 매치 = 1건 (결승)
    expect(result.matches.filter((m) => m.round_number === 2)).toHaveLength(2);
    expect(result.matches.filter((m) => m.round_number === 3)).toHaveLength(1);

    // 라벨 검증 — "1번 시드" / "8번 시드" (placeholder-helpers 통과)
    expect(r1[0].homeSlotLabel).toBe("1번 시드");
    expect(r1[0].awaySlotLabel).toBe("8번 시드");
  });

  it("roundName 정확 (8강 → 준결승 → 결승)", () => {
    const result = planNbaSeedKnockout({ teams: mkTeams(8), knockoutSize: 8 });
    expect(result.matches.find((m) => m.round_number === 1)?.roundName).toBe("8강");
    expect(result.matches.find((m) => m.round_number === 2)?.roundName).toBe("준결승");
    expect(result.matches.find((m) => m.round_number === 3)?.roundName).toBe("결승");
  });
});

describe("planNbaSeedKnockout — 6팀 BYE 2건", () => {
  it("bracketSize=8 / 1R 2매치 (4·5 / 3·6) / 시드 1·2 자동 2R 진출 (양분 순)", () => {
    const result = planNbaSeedKnockout({
      teams: mkTeams(6),
      knockoutSize: 6,
    });

    expect(result.bracketSize).toBe(8);
    expect(result.totalRounds).toBe(3);
    expect(result.byeSeeds).toEqual([1, 2]);

    // 1R 매치 = 2건 (BYE 페어 2건 생략)
    // 양분 순서: pair0=BYE pair1=(4,5) pair2=BYE pair3=(3,6) → r1 = [(4,5), (3,6)]
    const r1 = result.matches.filter((m) => m.round_number === 1);
    expect(r1).toHaveLength(2);
    expect(r1[0].homeTeamId).toBe(BigInt(4));
    expect(r1[0].awayTeamId).toBe(BigInt(5));
    expect(r1[1].homeTeamId).toBe(BigInt(3));
    expect(r1[1].awayTeamId).toBe(BigInt(6));

    // 2R 매치 = 2건 (준결승) — 시드 1 / 시드 2 자동 박제
    const r2 = result.matches.filter((m) => m.round_number === 2);
    expect(r2).toHaveLength(2);
    // 2R bracket_position 0 = pair0 (BYE 시드 1) + pair1 (실팀 4·5 승자) → home=시드1 / away=NULL
    expect(r2[0].homeTeamId).toBe(BigInt(1));
    expect(r2[0].homeSlotLabel).toBe("1번 시드");
    expect(r2[0].awayTeamId).toBeNull();
    // 2R bracket_position 1 = pair2 (BYE 시드 2) + pair3 (실팀 3·6 승자) → home=시드2 / away=NULL
    expect(r2[1].homeTeamId).toBe(BigInt(2));
    expect(r2[1].homeSlotLabel).toBe("2번 시드");
    expect(r2[1].awayTeamId).toBeNull();
  });
});

describe("planNbaSeedKnockout — 12팀 BYE 4건", () => {
  it("bracketSize=16 / 1R 4매치 / 시드 1·2·3·4 자동 2R 진출", () => {
    const result = planNbaSeedKnockout({
      teams: mkTeams(12),
      knockoutSize: 12,
    });

    expect(result.bracketSize).toBe(16);
    expect(result.totalRounds).toBe(4);
    // BYE 시드 = 13·14·15·16 빈 자리 페어의 실팀 = 시드 1·2·3·4
    expect(result.byeSeeds.sort()).toEqual([1, 2, 3, 4]);

    // 1R 매치 = 4건 (8 페어 - 4 BYE = 4 실팀 매치)
    const r1 = result.matches.filter((m) => m.round_number === 1);
    expect(r1).toHaveLength(4);

    // 2R 매치 = 4건 (8강) — 일부 매치는 BYE 자동 박제
    const r2 = result.matches.filter((m) => m.round_number === 2);
    expect(r2).toHaveLength(4);

    // BYE 자동 진출 시드 1·2·3·4 가 2R 어딘가에 박제됨 검증
    const r2TeamIds = r2
      .flatMap((m) => [m.homeTeamId, m.awayTeamId])
      .filter((id): id is bigint => id !== null)
      .map((id) => Number(id));
    expect(r2TeamIds.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
  });
});

describe("planNbaSeedKnockout — 16팀 표준 (1R 8매치)", () => {
  it("페어링 NBA 양분 트리 / 시드 1·2 결승 가능 경로 (양분 순)", () => {
    const result = planNbaSeedKnockout({
      teams: mkTeams(16),
      knockoutSize: 16,
    });

    expect(result.bracketSize).toBe(16);
    expect(result.totalRounds).toBe(4); // 16 → 8 → 4 → 2 (결승)
    expect(result.byeSeeds).toHaveLength(0);

    const r1 = result.matches.filter((m) => m.round_number === 1);
    expect(r1).toHaveLength(8);

    // 16팀 양분 순: [1,16][8,9][4,13][5,12][2,15][7,10][3,14][6,11]
    // 시드 1 = 페어 0 / 시드 2 = 페어 4 → 양분 보장 (결승까지 못 만남)
    expect(r1[0].homeTeamId).toBe(BigInt(1));
    expect(r1[0].awayTeamId).toBe(BigInt(16));
    expect(r1[4].homeTeamId).toBe(BigInt(2));
    expect(r1[4].awayTeamId).toBe(BigInt(15));

    // 결승 = 1매치
    expect(result.matches.filter((m) => m.round_number === 4)).toHaveLength(1);
  });
});

describe("planNbaSeedKnockout — placeholder-helpers 통과 검증 (인라인 박제 금지 룰)", () => {
  it("1R 모든 매치 라벨 = parseSlotLabel 역파싱 100% 매칭", () => {
    const result = planNbaSeedKnockout({ teams: mkTeams(8), knockoutSize: 8 });
    const r1 = result.matches.filter((m) => m.round_number === 1);

    // 8팀 NBA 양분 순 1R 페어 = (1·8 / 4·5 / 2·7 / 3·6)
    const expectedSeeds: Array<[number, number]> = [[1, 8], [4, 5], [2, 7], [3, 6]];
    r1.forEach((m, i) => {
      const homeParsed = parseSlotLabel(m.homeSlotLabel);
      const awayParsed = parseSlotLabel(m.awaySlotLabel);
      expect(homeParsed).toEqual({ kind: "seed_number", seedNumber: expectedSeeds[i][0] });
      expect(awayParsed).toEqual({ kind: "seed_number", seedNumber: expectedSeeds[i][1] });
    });
  });

  it("6팀 BYE — 2R 자동 진출 라벨도 placeholder-helpers 통과", () => {
    const result = planNbaSeedKnockout({ teams: mkTeams(6), knockoutSize: 6 });
    const r2 = result.matches.filter((m) => m.round_number === 2);

    // 2R bracket_position 0 home = "1번 시드" (BYE 자동 진출)
    // 2R bracket_position 1 home = "2번 시드" (BYE 자동 진출 — 양분 순서)
    expect(parseSlotLabel(r2[0].homeSlotLabel)).toEqual({ kind: "seed_number", seedNumber: 1 });
    expect(parseSlotLabel(r2[1].homeSlotLabel)).toEqual({ kind: "seed_number", seedNumber: 2 });
  });

  it("bronzeMatch 옵션 — 준결승 패자 라벨 (match_loser kind)", () => {
    const result = planNbaSeedKnockout({
      teams: mkTeams(8),
      knockoutSize: 8,
      bronzeMatch: true,
    });
    const bronze = result.matches.find((m) => m.bracket_position === 99);
    expect(bronze).toBeDefined();
    expect(bronze?.roundName).toBe("3/4위전");
    // 라벨 검증 — 준결승 1·2 경기 패자 (placeholder-helpers match_loser 통과)
    expect(parseSlotLabel(bronze!.homeSlotLabel)).toEqual({
      kind: "match_loser",
      roundName: "준결승",
      matchNumber: 1,
    });
    expect(parseSlotLabel(bronze!.awaySlotLabel)).toEqual({
      kind: "match_loser",
      roundName: "준결승",
      matchNumber: 2,
    });
  });

  it("teams.length < 2 → throw", () => {
    expect(() => planNbaSeedKnockout({ teams: mkTeams(1), knockoutSize: 4 })).toThrow(/최소 2/);
    expect(() => planNbaSeedKnockout({ teams: [], knockoutSize: 4 })).toThrow(/최소 2/);
  });
});
