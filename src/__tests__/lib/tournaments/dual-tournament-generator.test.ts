/**
 * 2026-05-16 PR-G5.2 — dual-tournament-generator.ts placeholder-helpers 통과 검증.
 *
 * 검증 범위 (DB I/O 없는 PURE generateDualTournament):
 *   1) 8팀 입력 → throw (16팀 의무)
 *   2) sequential baseline 27 매치 라벨 형식 (D·E·F 군 group_rank / match_winner)
 *   3) adjacent 5/2 운영 라벨 BEFORE/AFTER 비교 (회귀 0 검증)
 *   4) 3·4위전 미운영 보존 (matches.length=27 / loserNextMatch null 케이스)
 *   5) parseSlotLabel round-trip 통과 (강남구 사고 차단 패턴 — 인라인 박제 0 검증)
 */
import { describe, it, expect } from "vitest";
import {
  generateDualTournament,
  type DualGroupAssignment,
} from "@/lib/tournaments/dual-tournament-generator";
import { parseSlotLabel } from "@/lib/tournaments/placeholder-helpers";

// ── 헬퍼: 16팀 더미 조 배정 (시드 1~16 = bigint 1~16) ────────────────────────
function mkAssignment(): DualGroupAssignment {
  return {
    A: [BigInt(1), BigInt(2), BigInt(3), BigInt(4)],
    B: [BigInt(5), BigInt(6), BigInt(7), BigInt(8)],
    C: [BigInt(9), BigInt(10), BigInt(11), BigInt(12)],
    D: [BigInt(13), BigInt(14), BigInt(15), BigInt(16)],
  };
}

const TOURNAMENT_ID = "test-tournament-uuid";

describe("generateDualTournament — 16팀 의무 검증", () => {
  it("8팀 입력 → throw '듀얼토너먼트는 16팀이 필요합니다'", () => {
    // 사용자 실수 케이스: 4조 × 2팀 = 8팀 입력 (TypeScript 튜플 타입 우회 — runtime 방어 검증)
    const invalid = {
      A: [BigInt(1), BigInt(2)],
      B: [BigInt(3), BigInt(4)],
      C: [BigInt(5), BigInt(6)],
      D: [BigInt(7), BigInt(8)],
    } as unknown as DualGroupAssignment;

    expect(() => generateDualTournament(invalid, TOURNAMENT_ID)).toThrow(
      /듀얼토너먼트는 16팀이 필요합니다/,
    );
  });
});

describe("generateDualTournament — sequential baseline 라벨 검증 (D·E·F 군)", () => {
  it("27 매치 생성 + 8강 (D군) / 4강 (E군) / 결승 (F군) 라벨 정확", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID, "sequential");
    expect(matches).toHaveLength(27);

    // 8강 = matches[20~23] (D 군 — group_rank kind)
    // sequential SPEC: QF1 = A1+D2 / QF2 = B1+C2 / QF3 = C1+B2 / QF4 = D1+A2
    expect(matches[20]._homeSlotLabel).toBe("A조 1위");
    expect(matches[20]._awaySlotLabel).toBe("D조 2위");
    expect(matches[21]._homeSlotLabel).toBe("B조 1위");
    expect(matches[21]._awaySlotLabel).toBe("C조 2위");
    expect(matches[22]._homeSlotLabel).toBe("C조 1위");
    expect(matches[22]._awaySlotLabel).toBe("B조 2위");
    expect(matches[23]._homeSlotLabel).toBe("D조 1위");
    expect(matches[23]._awaySlotLabel).toBe("A조 2위");

    // 4강 = matches[24~25] (E 군 — match_winner kind / roundName="8강")
    // SF1 = QF1+QF2 / SF2 = QF3+QF4
    expect(matches[24]._homeSlotLabel).toBe("8강 1경기 승자");
    expect(matches[24]._awaySlotLabel).toBe("8강 2경기 승자");
    expect(matches[25]._homeSlotLabel).toBe("8강 3경기 승자");
    expect(matches[25]._awaySlotLabel).toBe("8강 4경기 승자");

    // 결승 = matches[26] (F 군 — match_winner kind / roundName="4강")
    expect(matches[26]._homeSlotLabel).toBe("4강 1경기 승자");
    expect(matches[26]._awaySlotLabel).toBe("4강 2경기 승자");
  });

  it("조별 G3 (A 군) / G4 (B 군) / 최종전 (C 군) 라벨 정확 — A 조 기준", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID, "sequential");

    // A 조 G3 (matches[2]) — A 군 (group_match_result, matchSlot=G1·G2, result=winner)
    expect(matches[2]._homeSlotLabel).toBe("A조 1경기 승자");
    expect(matches[2]._awaySlotLabel).toBe("A조 2경기 승자");

    // A 조 G4 (matches[3]) — B 군 (group_match_result, matchSlot=G1·G2, result=loser)
    expect(matches[3]._homeSlotLabel).toBe("A조 1경기 패자");
    expect(matches[3]._awaySlotLabel).toBe("A조 2경기 패자");

    // A 조 최종전 (matches[16]) — C 군 (group_match_result, matchSlot=G3 loser / G4 winner)
    expect(matches[16]._homeSlotLabel).toBe("A조 승자전 패자");
    expect(matches[16]._awaySlotLabel).toBe("A조 패자전 승자");
  });
});

describe("generateDualTournament — adjacent 5/2 운영 라벨 BEFORE/AFTER 비교 (회귀 0)", () => {
  // 5/2 동호회최강전 운영 baseline (옵션 X 보존)
  // 8강 SPEC: QF1=B1+A2 / QF2=D1+C2 / QF3=A1+B2 / QF4=C1+D2
  it("adjacent 모드 — 8강 4 매치 라벨 = 인라인 박제 시절과 100% 일치 (D 군)", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID, "adjacent");
    expect(matches).toHaveLength(27);

    // BEFORE (인라인 박제 시절) = `${spec.home.group}조 1위` / `${spec.away.group}조 2위`
    // AFTER (helpers 통과) = buildSlotLabel({ kind: "group_rank", group, rank })
    // 두 결과가 100% 일치해야 회귀 0
    expect(matches[20]._homeSlotLabel).toBe("B조 1위");
    expect(matches[20]._awaySlotLabel).toBe("A조 2위");
    expect(matches[21]._homeSlotLabel).toBe("D조 1위");
    expect(matches[21]._awaySlotLabel).toBe("C조 2위");
    expect(matches[22]._homeSlotLabel).toBe("A조 1위");
    expect(matches[22]._awaySlotLabel).toBe("B조 2위");
    expect(matches[23]._homeSlotLabel).toBe("C조 1위");
    expect(matches[23]._awaySlotLabel).toBe("D조 2위");
  });

  it("adjacent 모드 — 4강 / 결승 라벨 = sequential 과 동일 (E·F 군 SPEC 공통)", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID, "adjacent");
    expect(matches[24]._homeSlotLabel).toBe("8강 1경기 승자");
    expect(matches[24]._awaySlotLabel).toBe("8강 2경기 승자");
    expect(matches[26]._homeSlotLabel).toBe("4강 1경기 승자");
    expect(matches[26]._awaySlotLabel).toBe("4강 2경기 승자");
  });
});

describe("generateDualTournament — 3·4위전 미운영 보존 (decisions.md 결정 4)", () => {
  it("matches.length=27 (3·4위전 추가 0) + 4강 패자 next 없음 + 8강 패자 next 없음", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID);
    // 27 매치 = 조별 16 + 조별 최종전 4 + 8강 4 + 4강 2 + 결승 1 (3·4위전 0)
    expect(matches).toHaveLength(27);

    // 4강 (matches[24~25]) — 패자 = 공동 3위 / next 없음
    expect(matches[24]._loserNextMatchIndex).toBeNull();
    expect(matches[24]._loserNextMatchSlot).toBeNull();
    expect(matches[25]._loserNextMatchIndex).toBeNull();
    expect(matches[25]._loserNextMatchSlot).toBeNull();

    // 8강 (matches[20~23]) — 패자 = 공동 5위 / next 없음
    for (let i = 20; i <= 23; i++) {
      expect(matches[i]._loserNextMatchIndex).toBeNull();
      expect(matches[i]._loserNextMatchSlot).toBeNull();
    }

    // 조 최종전 (matches[16~19]) — 패자 = 조 3위 / next 없음 (3·4위전 미운영)
    for (let i = 16; i <= 19; i++) {
      expect(matches[i]._loserNextMatchIndex).toBeNull();
      expect(matches[i]._loserNextMatchSlot).toBeNull();
    }
  });
});

describe("generateDualTournament — placeholder-helpers 통과 검증 (강남구 사고 차단)", () => {
  it("27 매치 × 2 슬롯 = 54 라벨 — null 제외 모두 parseSlotLabel 매칭 100%", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID);

    let totalLabels = 0;
    let nullLabels = 0;
    let parsedLabels = 0;
    const unparsedLabels: string[] = [];

    for (const match of matches) {
      for (const label of [match._homeSlotLabel, match._awaySlotLabel]) {
        totalLabels++;
        if (label === null) {
          nullLabels++;
          continue;
        }
        const parsed = parseSlotLabel(label);
        if (parsed === null) {
          unparsedLabels.push(label);
        } else {
          parsedLabels++;
        }
      }
    }

    // null 라벨 = G1·G2 home/away 4 매치 × 4 조 × 2 슬롯 = 16 (실팀이라 라벨 불필요)
    expect(nullLabels).toBe(16);
    // unparsed = 0 (모든 박제 라벨 parseSlotLabel 통과 — 강남구 사고 패턴 차단)
    expect(unparsedLabels).toEqual([]);
    // parsed + null = 총 라벨 수 (검증)
    expect(parsedLabels + nullLabels).toBe(totalLabels);
    expect(totalLabels).toBe(54); // 27 × 2
  });

  it("group_match_result kind round-trip — A 조 G3·G4·최종전 6 라벨", () => {
    const matches = generateDualTournament(mkAssignment(), TOURNAMENT_ID);

    // A 조 G3 (matches[2]) / G4 (matches[3]) / 최종전 (matches[16])
    const labels = [
      matches[2]._homeSlotLabel, // "A조 1경기 승자"
      matches[2]._awaySlotLabel, // "A조 2경기 승자"
      matches[3]._homeSlotLabel, // "A조 1경기 패자"
      matches[3]._awaySlotLabel, // "A조 2경기 패자"
      matches[16]._homeSlotLabel, // "A조 승자전 패자"
      matches[16]._awaySlotLabel, // "A조 패자전 승자"
    ];

    const expected = [
      { kind: "group_match_result", group: "A", matchSlot: "G1", result: "winner" },
      { kind: "group_match_result", group: "A", matchSlot: "G2", result: "winner" },
      { kind: "group_match_result", group: "A", matchSlot: "G1", result: "loser" },
      { kind: "group_match_result", group: "A", matchSlot: "G2", result: "loser" },
      { kind: "group_match_result", group: "A", matchSlot: "G3", result: "loser" },
      { kind: "group_match_result", group: "A", matchSlot: "G4", result: "winner" },
    ];

    labels.forEach((label, idx) => {
      expect(parseSlotLabel(label)).toEqual(expected[idx]);
    });
  });
});
