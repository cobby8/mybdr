/**
 * 2026-05-15 PR-G5.3 / G5.4 — placeholder 매치 plan 순수 함수 검증.
 *
 * 검증 범위:
 *   - planLeagueAdvancementPlaceholders (G5.3)
 *   - planGroupStageRankingPlaceholders (G5.4)
 *   - 강남구협회장배 4 종별 운영 케이스 100% 재현
 */
import { describe, it, expect } from "vitest";
import {
  planLeagueAdvancementPlaceholders,
  planGroupStageRankingPlaceholders,
} from "@/lib/tournaments/division-advancement";

describe("planLeagueAdvancementPlaceholders — G5.3 (강남구 i3-U9 케이스)", () => {
  it("4팀 × 2조 + linkage [[1,2]] → 4건 placeholder (4·3·2·1위 순)", () => {
    const specs = planLeagueAdvancementPlaceholders({
      groupSize: 4,
      groupCount: 2,
      linkagePairs: [[1, 2]],
    });
    expect(specs).toHaveLength(4);
    // 시간 순 = 낮은 순위 일찍 (운영 자료 i3-U9 패턴)
    expect(specs[0]).toMatchObject({ rank: 4, groupHome: "A", groupAway: "B", matchIndex: 0 });
    expect(specs[0].notes).toBe("A조 4위 vs B조 4위");
    expect(specs[1]).toMatchObject({ rank: 3, matchIndex: 1 });
    expect(specs[2]).toMatchObject({ rank: 2, matchIndex: 2 });
    expect(specs[3]).toMatchObject({ rank: 1, matchIndex: 3 });
    expect(specs[3].notes).toBe("A조 1위 vs B조 1위");
  });

  it("3팀 × 2조 + linkage [[1,2]] → 3건 (3·2·1위 순)", () => {
    const specs = planLeagueAdvancementPlaceholders({
      groupSize: 3,
      groupCount: 2,
      linkagePairs: [[1, 2]],
    });
    expect(specs).toHaveLength(3);
    expect(specs.map((s) => s.rank)).toEqual([3, 2, 1]);
  });

  it("4조 케이스 — linkage [[1,2],[3,4]] = A↔B + C↔D", () => {
    const specs = planLeagueAdvancementPlaceholders({
      groupSize: 4,
      groupCount: 4,
      linkagePairs: [[1, 2], [3, 4]],
    });
    expect(specs).toHaveLength(8); // 4 위 × 2 페어
    // 첫 페어 (A↔B) 4건 먼저 + 둘째 페어 (C↔D) 4건
    expect(specs[0].groupHome).toBe("A");
    expect(specs[0].groupAway).toBe("B");
    expect(specs[4].groupHome).toBe("C");
    expect(specs[4].groupAway).toBe("D");
    expect(specs[7].notes).toBe("C조 1위 vs D조 1위");
  });

  it("notes 100% ADVANCEMENT_REGEX 호환 (자동 채움 보장)", () => {
    const regex = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;
    const specs = planLeagueAdvancementPlaceholders({
      groupSize: 4,
      groupCount: 2,
      linkagePairs: [[1, 2]],
    });
    for (const spec of specs) {
      expect(regex.test(spec.notes)).toBe(true);
    }
  });

  it("방어 — groupSize < 2 / linkagePairs 빈 배열 → 빈 결과", () => {
    expect(planLeagueAdvancementPlaceholders({ groupSize: 0, groupCount: 2, linkagePairs: [[1, 2]] })).toEqual([]);
    expect(planLeagueAdvancementPlaceholders({ groupSize: 1, groupCount: 2, linkagePairs: [[1, 2]] })).toEqual([]);
    expect(planLeagueAdvancementPlaceholders({ groupSize: 4, groupCount: 2, linkagePairs: [] })).toEqual([]);
  });

  it("방어 — linkagePair 형식 위반 (길이 ≠ 2 / 0 이하) skip", () => {
    expect(planLeagueAdvancementPlaceholders({
      groupSize: 4, groupCount: 2,
      linkagePairs: [[1, 2, 3]], // 잘못된 페어 (3 원소)
    })).toEqual([]);
    expect(planLeagueAdvancementPlaceholders({
      groupSize: 4, groupCount: 2,
      linkagePairs: [[0, 1]], // 0 인덱스
    })).toEqual([]);
  });
});

describe("planGroupStageRankingPlaceholders — G5.4 (강남구 i3-U11/U14/i3w-U12 케이스)", () => {
  it("3팀 × 2조 → 3건 (3·2·1위 순) — 강남구 i3-U11/U14/i3w-U12 패턴", () => {
    const specs = planGroupStageRankingPlaceholders({ groupSize: 3, groupCount: 2 });
    expect(specs).toHaveLength(3);
    expect(specs.map((s) => s.rank)).toEqual([3, 2, 1]);
    expect(specs[0].notes).toBe("A조 3위 vs B조 3위");
    expect(specs[2].notes).toBe("A조 1위 vs B조 1위");
  });

  it("2조 케이스 = league_advancement linkage=[[1,2]] 와 동일 결과 (G5.3 위임)", () => {
    const la = planLeagueAdvancementPlaceholders({ groupSize: 4, groupCount: 2, linkagePairs: [[1, 2]] });
    const gsr = planGroupStageRankingPlaceholders({ groupSize: 4, groupCount: 2 });
    expect(gsr).toEqual(la);
  });

  it("groupCount > 2 → 후속 PR (현재 빈 결과)", () => {
    // 본 PR 범위 = 2조만 / 후속 PR = N×N 동순위전 풀리그
    expect(planGroupStageRankingPlaceholders({ groupSize: 3, groupCount: 4 })).toEqual([]);
  });

  it("방어 — groupSize < 2 → 빈 결과", () => {
    expect(planGroupStageRankingPlaceholders({ groupSize: 0, groupCount: 2 })).toEqual([]);
    expect(planGroupStageRankingPlaceholders({ groupSize: 1, groupCount: 2 })).toEqual([]);
  });
});

describe("강남구협회장배 4 종별 운영 케이스 100% 재현 검증", () => {
  it("i3-U9 (league_advancement 4팀×2조) = 4건 placeholder", () => {
    const specs = planLeagueAdvancementPlaceholders({
      groupSize: 4, groupCount: 2, linkagePairs: [[1, 2]],
    });
    expect(specs.map((s) => s.notes)).toEqual([
      "A조 4위 vs B조 4위",
      "A조 3위 vs B조 3위",
      "A조 2위 vs B조 2위",
      "A조 1위 vs B조 1위",
    ]);
  });

  it("i3-U11 / i3-U14 / i3w-U12 (group_stage_with_ranking 3팀×2조) = 각 3건", () => {
    const specs = planGroupStageRankingPlaceholders({ groupSize: 3, groupCount: 2 });
    expect(specs.map((s) => s.notes)).toEqual([
      "A조 3위 vs B조 3위",
      "A조 2위 vs B조 2위",
      "A조 1위 vs B조 1위",
    ]);
  });
});
