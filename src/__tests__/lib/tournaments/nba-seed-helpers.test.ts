/**
 * 2026-05-16 PR-G5.5-NBA-seed — nba-seed-helpers.ts 단위 검증.
 *
 * 검증 범위:
 *   - nbaSeedPairs — 양분 트리 페어링 (2^N 만 허용)
 *   - nbaSeedPairsWithBye — BYE 처리 (teamCount < bracketSize)
 *   - isByePair — BYE 페어 판정
 *   - 양분 검증 — 시드 1·2 가 결승까지 못 만남 보장 (트리 양분)
 */
import { describe, it, expect } from "vitest";
import {
  nbaSeedPairs,
  nbaSeedPairsWithBye,
  isByePair,
} from "@/lib/tournaments/nba-seed-helpers";

describe("nbaSeedPairs — NBA 표준 양분 트리 페어링", () => {
  it("4슬롯 → [[1,4],[2,3]] (작은 트리 검증)", () => {
    expect(nbaSeedPairs(4)).toEqual([
      [1, 4],
      [2, 3],
    ]);
  });

  it("8슬롯 → [[1,8],[4,5],[2,7],[3,6]] (NBA 양분 트리 8강)", () => {
    // 양분 의미: 시드 1·8·4·5 가 4강에서 만남 (페어 0+1) / 시드 2·7·3·6 가 별도 4강 (페어 2+3)
    // → 시드 1 과 시드 2 = 결승에서 만남 보장 (양분 트리 핵심 속성)
    // 표시 순서는 알고리즘 양분 결과 기준 — NBA bracket 표시 관행 (1/4/3/2) 이 아닌 양분 순 (1/4/2/3)
    expect(nbaSeedPairs(8)).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);
  });

  it("16슬롯 → 알고리즘 양분 트리 (16강)", () => {
    // 16팀 양분: [1,16][8,9][4,13][5,12][2,15][7,10][3,14][6,11]
    // 양분 검증: 시드 1·2 = 페어 0 / 페어 4 → 결승까지 못 만남 보장
    expect(nbaSeedPairs(16)).toEqual([
      [1, 16],
      [8, 9],
      [4, 13],
      [5, 12],
      [2, 15],
      [7, 10],
      [3, 14],
      [6, 11],
    ]);
  });

  it("32슬롯 → 16 페어 / 시드 1·2 트리 양분 보장", () => {
    const pairs = nbaSeedPairs(32);
    expect(pairs).toHaveLength(16);
    expect(pairs[0]).toEqual([1, 32]); // 시드 1 첫 페어
    // 시드 2 = 양분 트리 절반 시작 위치 (페어 8) — 결승까지 시드 1 과 못 만남
    expect(pairs[8]).toEqual([2, 31]);
    // 모든 페어 합 = 33 (양분 트리 보장)
    for (const [a, b] of pairs) {
      expect(a + b).toBe(33);
    }
  });

  it("2의 제곱이 아닌 입력 → throw", () => {
    expect(() => nbaSeedPairs(6)).toThrow(/2의 제곱/);
    expect(() => nbaSeedPairs(10)).toThrow(/2의 제곱/);
    expect(() => nbaSeedPairs(0)).toThrow(/2의 제곱/);
    expect(() => nbaSeedPairs(1)).toThrow(/2의 제곱/);
  });
});

describe("nbaSeedPairsWithBye — BYE 자동 처리 (2^N 올림)", () => {
  it("8팀 (size = bracketSize) → BYE 0건 / 모두 실팀 페어 (양분 순)", () => {
    const pairs = nbaSeedPairsWithBye(8);
    expect(pairs).toEqual([
      [1, 8],
      [4, 5],
      [2, 7],
      [3, 6],
    ]);
    // BYE 페어 0
    expect(pairs.filter(isByePair)).toHaveLength(0);
  });

  it("6팀 → bracketSize=8 / BYE 2건 (시드 7·8 자리)", () => {
    // 6팀: 시드 1·2 가 BYE 받음 (페어에 7·8 시드가 null 로 들어감)
    // 양분 순서: pair0=[1,8→null] / pair1=[4,5] / pair2=[2,7→null] / pair3=[3,6]
    const pairs = nbaSeedPairsWithBye(6);
    expect(pairs).toHaveLength(4);
    expect(pairs[0]).toEqual([1, null]); // 1 vs (8) — 8은 BYE
    expect(pairs[1]).toEqual([4, 5]);    // 4 vs 5 — 실팀 매치
    expect(pairs[2]).toEqual([2, null]); // 2 vs (7) — 7은 BYE
    expect(pairs[3]).toEqual([3, 6]);    // 3 vs 6 — 실팀 매치
    // BYE 페어 = 2건
    expect(pairs.filter(isByePair)).toHaveLength(2);
  });

  it("12팀 → bracketSize=16 / BYE 4건 (시드 13·14·15·16 자리)", () => {
    const pairs = nbaSeedPairsWithBye(12);
    expect(pairs).toHaveLength(8);
    // BYE 페어 = 4건 (시드 13·14·15·16 빈 자리)
    const byePairs = pairs.filter(isByePair);
    expect(byePairs).toHaveLength(4);
    // 실팀 매치 = 4건 (8개 페어 - 4 BYE)
    expect(pairs.filter((p) => !isByePair(p))).toHaveLength(4);
    // 시드 1·2 는 BYE (상위 시드가 BYE 받음 보장)
    const realSeedsInBye = byePairs.map((p) => p[0] ?? p[1]);
    expect(realSeedsInBye).toContain(1);
    expect(realSeedsInBye).toContain(2);
  });

  it("16팀 (size = bracketSize) → BYE 0건", () => {
    const pairs = nbaSeedPairsWithBye(16);
    expect(pairs).toHaveLength(8);
    expect(pairs.filter(isByePair)).toHaveLength(0);
  });

  it("teamCount < 2 → throw", () => {
    expect(() => nbaSeedPairsWithBye(1)).toThrow(/최소 2/);
    expect(() => nbaSeedPairsWithBye(0)).toThrow(/최소 2/);
  });
});

describe("isByePair — BYE 페어 판정", () => {
  it("한쪽 null = BYE", () => {
    expect(isByePair([1, null])).toBe(true);
    expect(isByePair([null, 8])).toBe(true);
  });

  it("양쪽 실팀 = false", () => {
    expect(isByePair([1, 8])).toBe(false);
    expect(isByePair([4, 5])).toBe(false);
  });

  it("양쪽 null = true (데이터 오류 케이스 — 안전 판정)", () => {
    expect(isByePair([null, null])).toBe(true);
  });
});
