/**
 * wizard-constants.ts vitest 회귀 가드 — Phase 1 인프라.
 *
 * 검증 범위:
 * - STEPS 배열 길이 / 순서 / 각 step 의 key/label/icon 정확성
 * - stepIndexToKey / stepKeyToIndex 양방향 round-trip
 * - 잘못된 key → 0 fallback (안전 진입)
 * - TOURNAMENT_STATUS_DEFAULT === "draft" (02-db-changes §3 결정 가드)
 * - icon = Material Symbols Outlined 이름 (lucide-react ❌ — CLAUDE.md §디자인 핵심)
 *
 * 박제 룰:
 * - 본 vitest 가 깨지면 Phase 2~7 의 wizard page.tsx stepper 가 잘못된 step 으로 진입.
 *   → STEPS 길이 / 순서 / key 는 회귀 시 즉시 fail (운영 영향 100%).
 */
import { describe, it, expect } from "vitest";

import {
  STEPS,
  TOURNAMENT_STATUS_DEFAULT,
  stepIndexToKey,
  stepKeyToIndex,
  type WizardStepDefinition,
} from "@/lib/tournaments/wizard-constants";
import type { WizardStep } from "@/lib/tournaments/wizard-types";

// =============================================================================
// 케이스 1: STEPS 배열 구조
// =============================================================================

describe("wizard-constants — STEPS 배열", () => {
  it("STEPS 길이 정확히 5 (단체 → 시리즈 → 정보 → 참가설정 → 확인)", () => {
    // 마법사 5단계 = 사용자 결정 fix. 새 step 추가/제거 시 본 vitest fail.
    expect(STEPS).toHaveLength(5);
  });

  it("STEPS 순서: org → series → info → registration → confirm (인덱스 1:1 정합)", () => {
    // 순서 = WizardStep (0~4) 인덱스와 1:1 — 변경 시 wizard-types.ts 도 같이 점검.
    const keys = STEPS.map((s) => s.key);
    expect(keys).toEqual(["org", "series", "info", "registration", "confirm"]);
  });

  it("각 step 의 key/label/icon 박제 (Material Symbols Outlined)", () => {
    // 본 케이스 = 디자인 토큰 룰 (lucide-react ❌ / Material Symbols Outlined ✅) 회귀 가드
    const expected: WizardStepDefinition[] = [
      { key: "org",          label: "단체",         icon: "groups" },
      { key: "series",       label: "시리즈",       icon: "auto_awesome_motion" },
      { key: "info",         label: "대회 정보",    icon: "emoji_events" },
      { key: "registration", label: "참가 설정",    icon: "group_add" },
      { key: "confirm",      label: "확인 및 생성", icon: "check_circle" },
    ];
    expect(STEPS).toEqual(expected);
  });
});

// =============================================================================
// 케이스 2: stepIndexToKey / stepKeyToIndex 헬퍼
// =============================================================================

describe("wizard-constants — stepIndexToKey", () => {
  it("stepIndexToKey(0) === 'org' (시작 step)", () => {
    expect(stepIndexToKey(0)).toBe("org");
  });

  it("stepIndexToKey(4) === 'confirm' (마지막 step)", () => {
    expect(stepIndexToKey(4)).toBe("confirm");
  });

  it("중간 step (1, 2, 3) 매핑 정확", () => {
    expect(stepIndexToKey(1)).toBe("series");
    expect(stepIndexToKey(2)).toBe("info");
    expect(stepIndexToKey(3)).toBe("registration");
  });
});

describe("wizard-constants — stepKeyToIndex", () => {
  it("stepKeyToIndex('org') === 0", () => {
    expect(stepKeyToIndex("org")).toBe(0);
  });

  it("stepKeyToIndex('confirm') === 4", () => {
    expect(stepKeyToIndex("confirm")).toBe(4);
  });

  it("모든 5 key 정합 매핑", () => {
    expect(stepKeyToIndex("series")).toBe(1);
    expect(stepKeyToIndex("info")).toBe(2);
    expect(stepKeyToIndex("registration")).toBe(3);
  });

  it("인식 불가 key (옛 URL / 외부 입력) → 0 fallback (안전 진입)", () => {
    // wizard-constants.ts L72 fallback 가드 검증.
    // 본 분기 = 사용자가 옛 URL (?step=summary 등) 로 진입 시 마법사 부서지지 않도록.
    expect(stepKeyToIndex("unknown" as WizardStepDefinition["key"])).toBe(0);
  });
});

// =============================================================================
// 케이스 3: 양방향 round-trip (전수 검증)
// =============================================================================

describe("wizard-constants — 양방향 round-trip", () => {
  it("stepKeyToIndex(stepIndexToKey(i)) === i for i ∈ [0, 4]", () => {
    // 양방향 헬퍼 정합성 검증 — 둘 중 하나라도 깨지면 마법사 URL 동기화 부서짐.
    for (let i = 0; i <= 4; i++) {
      const idx = i as WizardStep;
      const key = stepIndexToKey(idx);
      expect(stepKeyToIndex(key)).toBe(idx);
    }
  });

  it("stepIndexToKey(stepKeyToIndex(key)) === key for 5 키", () => {
    // 역방향 round-trip
    const allKeys: WizardStepDefinition["key"][] = [
      "org",
      "series",
      "info",
      "registration",
      "confirm",
    ];
    for (const key of allKeys) {
      const idx = stepKeyToIndex(key);
      expect(stepIndexToKey(idx)).toBe(key);
    }
  });
});

// =============================================================================
// 케이스 4: TOURNAMENT_STATUS_DEFAULT
// =============================================================================

describe("wizard-constants — TOURNAMENT_STATUS_DEFAULT", () => {
  it("기본값 = 'draft' (02-db-changes §3 결정)", () => {
    // 마법사 = 정보 입력 단계 → 즉시 공개 X / 사용자가 별도 "접수 오픈" 단계 거침.
    // editions/route.ts 의 "registration_open" 박제 패턴과 의도적 차이 (wizard-constants.ts L52-55).
    expect(TOURNAMENT_STATUS_DEFAULT).toBe("draft");
  });
});
