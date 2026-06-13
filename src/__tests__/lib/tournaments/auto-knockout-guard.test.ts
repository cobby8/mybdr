/**
 * 2026-06-14 KO Sprint1 재발방지 — assertSingleGroupForAutoKnockout PURE 가드 회귀 게이트.
 *
 * 사고: 제10회 BDR YOUNGMAN GAME (6팀 2개조) 결선 자동생성이 조를 무시해
 *       같은 조 팀이 재대결 → 9경기 중복 (errors.md [2026-06-09]/[2026-06-14]).
 *
 * 본 테스트의 핵심 회귀 게이트 2축:
 *   1) 1개조(distinct=1) 또는 조 미지정 → 통과 (기존 full_league_knockout 1개조 경로 100% 보존)
 *   2) 2개조 이상(distinct≥2) → throw (조 무시 시드 자동생성 원천 차단)
 *
 * ⚠️ PURE 함수만 검증 (DB I/O 없는 assertSingleGroupForAutoKnockout) —
 *    guardAutoKnockoutGroups(DB)는 이 PURE에 위임하므로 동작 동일.
 */
import { describe, it, expect } from "vitest";
import { assertSingleGroupForAutoKnockout } from "@/lib/tournaments/tournament-seeding";

describe("assertSingleGroupForAutoKnockout — 1개조 통과 (회귀 게이트: 기존 경로 보존)", () => {
  it("단일 조('A')만 있으면 통과 (throw 안 함)", () => {
    expect(() =>
      assertSingleGroupForAutoKnockout(["A", "A", "A", "A"]),
    ).not.toThrow();
  });

  it("조 미지정(전부 null) — 4차 뉴비리그 같은 1개조 무그룹 대회 → 통과", () => {
    // 1개조 full_league_knockout (BYE 없는 단일조) = groupName 컬럼 미사용
    expect(() =>
      assertSingleGroupForAutoKnockout([null, null, null, null]),
    ).not.toThrow();
  });

  it("빈 문자열 / 공백만 있는 groupName → 조 미지정으로 정규화되어 통과", () => {
    expect(() =>
      assertSingleGroupForAutoKnockout(["", "  ", "", undefined]),
    ).not.toThrow();
  });

  it("일부는 null, 나머지는 모두 동일 조 'B' → distinct=1 → 통과", () => {
    expect(() =>
      assertSingleGroupForAutoKnockout([null, "B", "B", null]),
    ).not.toThrow();
  });

  it("빈 배열(팀 0) → 통과 (가드 대상 아님)", () => {
    expect(() => assertSingleGroupForAutoKnockout([])).not.toThrow();
  });

  it("같은 조명이 trim 차이만 있으면 동일 조로 정규화 → distinct=1 → 통과", () => {
    // " A " 와 "A" 는 같은 조 — trim 후 동일
    expect(() =>
      assertSingleGroupForAutoKnockout([" A ", "A", "A "]),
    ).not.toThrow();
  });
});

describe("assertSingleGroupForAutoKnockout — 2개조 이상 throw (핵심 차단)", () => {
  it("2개조('A','B') → throw (YOUNGMAN GAME 정확히 일치)", () => {
    expect(() =>
      assertSingleGroupForAutoKnockout(["A", "A", "A", "B", "B", "B"]),
    ).toThrow();
  });

  it("2개조 throw 메시지에 차단 사유(재대결/수동/크로스)가 포함", () => {
    expect(() =>
      assertSingleGroupForAutoKnockout(["A", "B"]),
    ).toThrow(/2개조 이상/);
  });

  it("3개조('A','B','C') → throw", () => {
    expect(() =>
      assertSingleGroupForAutoKnockout(["A", "B", "C", "A", "B", "C"]),
    ).toThrow();
  });

  it("null 섞여도 distinct 조가 2개면 throw", () => {
    // 무그룹 팀이 섞여 있어도 실제 조가 2종류면 차단
    expect(() =>
      assertSingleGroupForAutoKnockout([null, "A", "B", null]),
    ).toThrow();
  });
});
