/**
 * 2026-05-12 Phase 3.5-D — 종별 진행 방식 (format) + 조 설정 (settings) 검증.
 *
 * 검증 범위:
 *   - ALLOWED_FORMATS 신규 enum group_stage_with_ranking 노출
 *   - FORMAT_LABEL 모든 enum 한국어 라벨 존재
 *   - showGroupSettings (조 설정 input 노출 여부)
 *   - showRankingFormat (동순위전 방식 input 노출 여부 — 신규 enum 만)
 *   - validateDivisionSettings (group_size / group_count / ranking_format 검증 룰)
 *   - calculateTotalTeams (총 팀 수 계산)
 */

import { describe, it, expect } from "vitest";
import {
  ALLOWED_FORMATS,
  FORMAT_LABEL,
  showGroupSettings,
  showRankingFormat,
  validateDivisionSettings,
  calculateTotalTeams,
} from "@/lib/tournaments/division-formats";

// ─────────────────────────────────────────────────────────────────────────
// ALLOWED_FORMATS — 신규 enum 노출
// ─────────────────────────────────────────────────────────────────────────

describe("division-formats — ALLOWED_FORMATS", () => {
  it("9개 enum 모두 노출 (Phase 3.5-D 신규 group_stage_with_ranking 포함)", () => {
    expect(ALLOWED_FORMATS).toHaveLength(9);
    expect(ALLOWED_FORMATS).toContain("group_stage_with_ranking");
  });

  it("기존 8개 enum 회귀 0 (single/double/round_robin/dual/2 group/league_advancement/swiss)", () => {
    const expected = [
      "single_elimination",
      "double_elimination",
      "round_robin",
      "dual_tournament",
      "group_stage_knockout",
      "full_league_knockout",
      "league_advancement",
      "swiss",
    ];
    for (const f of expected) {
      expect(ALLOWED_FORMATS).toContain(f);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// FORMAT_LABEL — 한국어 라벨
// ─────────────────────────────────────────────────────────────────────────

describe("division-formats — FORMAT_LABEL", () => {
  it("모든 ALLOWED_FORMATS 에 한국어 라벨 존재", () => {
    for (const f of ALLOWED_FORMATS) {
      expect(FORMAT_LABEL[f]).toBeDefined();
      expect(FORMAT_LABEL[f]).not.toBe("");
    }
  });

  it("신규 enum 한국어 라벨 = '조별리그 + 동순위 순위결정전'", () => {
    expect(FORMAT_LABEL.group_stage_with_ranking).toBe("조별리그 + 동순위 순위결정전");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// showGroupSettings — 조 설정 input 노출 여부
// ─────────────────────────────────────────────────────────────────────────

describe("division-formats — showGroupSettings", () => {
  it("풀리그 기반 6개 enum 시 true (round_robin / dual / group_stage_knockout / full_league_knockout / league_advancement / group_stage_with_ranking)", () => {
    expect(showGroupSettings("round_robin")).toBe(true);
    expect(showGroupSettings("dual_tournament")).toBe(true);
    expect(showGroupSettings("group_stage_knockout")).toBe(true);
    expect(showGroupSettings("full_league_knockout")).toBe(true);
    expect(showGroupSettings("league_advancement")).toBe(true);
    expect(showGroupSettings("group_stage_with_ranking")).toBe(true);
  });

  it("조 개념 없는 3개 enum 시 false (single / double / swiss)", () => {
    expect(showGroupSettings("single_elimination")).toBe(false);
    expect(showGroupSettings("double_elimination")).toBe(false);
    expect(showGroupSettings("swiss")).toBe(false);
  });

  it("null / undefined / 빈 문자열 시 false (대회 format 폴백 시 input 안 노출)", () => {
    expect(showGroupSettings(null)).toBe(false);
    expect(showGroupSettings(undefined)).toBe(false);
    expect(showGroupSettings("")).toBe(false);
  });

  it("정의되지 않은 enum 시 false (안전 가드)", () => {
    expect(showGroupSettings("unknown_format")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// showRankingFormat — 동순위전 방식 input 노출 (신규 enum 만)
// ─────────────────────────────────────────────────────────────────────────

describe("division-formats — showRankingFormat", () => {
  it("group_stage_with_ranking 일 때만 true (다른 enum 은 false)", () => {
    expect(showRankingFormat("group_stage_with_ranking")).toBe(true);
    expect(showRankingFormat("league_advancement")).toBe(false); // linkage_pairs 명시 enum 은 false
    expect(showRankingFormat("round_robin")).toBe(false);
    expect(showRankingFormat("dual_tournament")).toBe(false);
    expect(showRankingFormat(null)).toBe(false);
    expect(showRankingFormat(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// validateDivisionSettings — settings JSON 검증 룰
// ─────────────────────────────────────────────────────────────────────────

describe("division-formats — validateDivisionSettings", () => {
  it("null / undefined / 빈 객체 = OK (선택 입력)", () => {
    expect(validateDivisionSettings(null)).toBeNull();
    expect(validateDivisionSettings(undefined)).toBeNull();
    expect(validateDivisionSettings({})).toBeNull();
  });

  it("group_size 정상 범위 (1~32) = OK", () => {
    expect(validateDivisionSettings({ group_size: 1 })).toBeNull();
    expect(validateDivisionSettings({ group_size: 4 })).toBeNull();
    expect(validateDivisionSettings({ group_size: 32 })).toBeNull();
  });

  it("group_size 범위 외 (음수 / 0 / 33+ / 소수 / 문자) = 에러", () => {
    expect(validateDivisionSettings({ group_size: 0 })?.field).toBe("group_size");
    expect(validateDivisionSettings({ group_size: -1 })?.field).toBe("group_size");
    expect(validateDivisionSettings({ group_size: 33 })?.field).toBe("group_size");
    expect(validateDivisionSettings({ group_size: 4.5 })?.field).toBe("group_size");
    expect(validateDivisionSettings({ group_size: "4" })?.field).toBe("group_size");
  });

  it("group_count 정상 범위 (1~32) = OK", () => {
    expect(validateDivisionSettings({ group_count: 1 })).toBeNull();
    expect(validateDivisionSettings({ group_count: 4 })).toBeNull();
    expect(validateDivisionSettings({ group_count: 16 })).toBeNull();
  });

  it("group_count 범위 외 = 에러", () => {
    expect(validateDivisionSettings({ group_count: 0 })?.field).toBe("group_count");
    expect(validateDivisionSettings({ group_count: 100 })?.field).toBe("group_count");
  });

  it("ranking_format = round_robin / single_elimination 만 OK", () => {
    expect(validateDivisionSettings({ ranking_format: "round_robin" })).toBeNull();
    expect(validateDivisionSettings({ ranking_format: "single_elimination" })).toBeNull();
    expect(validateDivisionSettings({ ranking_format: "double_elimination" })?.field).toBe(
      "ranking_format",
    );
    expect(validateDivisionSettings({ ranking_format: "invalid" })?.field).toBe("ranking_format");
  });

  it("legacy 키 (linkage_pairs / advanceCount / groupSize 카멜케이스) = 검증 안 함 (호환 유지)", () => {
    // 기존 league_advancement 의 settings 형식 — 검증 통과 (기능 영향 0)
    expect(
      validateDivisionSettings({
        linkage_pairs: [
          [1, 2],
          [3, 4],
        ],
        advanceCount: 2,
        groupSize: 4, // legacy camelCase
        groupCount: 2, // legacy camelCase
      }),
    ).toBeNull();
  });

  it("정상 + 비정상 동시 = 첫 위반 에러 반환", () => {
    const result = validateDivisionSettings({ group_size: 4, group_count: 100 });
    expect(result?.field).toBe("group_count");
  });

  it("강남구협회장배 시나리오 (group_stage_with_ranking 4×4=16팀) = OK", () => {
    expect(
      validateDivisionSettings({
        group_size: 4,
        group_count: 4,
        ranking_format: "round_robin",
      }),
    ).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// calculateTotalTeams — 총 팀 수 계산
// ─────────────────────────────────────────────────────────────────────────

describe("division-formats — calculateTotalTeams", () => {
  it("정상 곱 (4×4=16, 3×8=24)", () => {
    expect(calculateTotalTeams(4, 4)).toBe(16);
    expect(calculateTotalTeams(3, 8)).toBe(24);
    expect(calculateTotalTeams(1, 1)).toBe(1);
  });

  it("null / undefined 입력 시 null 반환 (계산 불가)", () => {
    expect(calculateTotalTeams(null, 4)).toBeNull();
    expect(calculateTotalTeams(4, null)).toBeNull();
    expect(calculateTotalTeams(null, null)).toBeNull();
    expect(calculateTotalTeams(undefined, undefined)).toBeNull();
  });

  it("Infinity / NaN 입력 시 null 반환 (안전 가드)", () => {
    expect(calculateTotalTeams(Infinity, 4)).toBeNull();
    expect(calculateTotalTeams(4, NaN)).toBeNull();
  });
});
