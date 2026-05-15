/**
 * 2026-05-13 UI-1 — setup-status.ts (대시보드 체크리스트) 단위 테스트.
 * 2026-05-16 PR-Admin-5 — 8 항목 → 7 항목 통합 회귀 가드 (#3 종별 정의 + #4 운영 방식 → 통합 #3).
 *
 * 검증 범위:
 *   - 8 항목 개별 판정 함수 (isBasicInfoComplete / ... / isBracketGenerated) — 함수 시그니처 변경 0
 *   - calculateSetupProgress 종합 (0/7, 3/7, 7/7) — 통합 후 7 항목
 *   - 잠금 조건 (3 종별+운영방식 미완료 → 6·7 잠금 / 1 미박제 → 3·5 잠금)
 *   - 공개 가드 (allRequiredComplete) — 2 시리즈는 제외 / 필수 6 항목 ALL ✅
 *   - PR-Admin-5: 통합 카드 #3 progress 필드 (정의 N건 / 운영방식 M건) + status 분기
 */

import { describe, it, expect } from "vitest";
import {
  isBasicInfoComplete,
  isSeriesLinked,
  areDivisionsDefined,
  areDivisionRulesComplete,
  isRegistrationPolicyComplete,
  isSiteConfigured,
  isRecordingModeConfigured,
  isBracketGenerated,
  calculateSetupProgress,
  canPublish,
  type ChecklistTournamentInput,
  type ChecklistDivisionRuleInput,
  type ChecklistRelationInput,
} from "@/lib/tournaments/setup-status";
import { Prisma } from "@prisma/client";

// 헬퍼 — 완전체 (모든 항목 ✅) 입력 빌더 (테스트별로 일부 필드만 변경)
const buildFullTournament = (
  overrides: Partial<ChecklistTournamentInput> = {}
): ChecklistTournamentInput => ({
  name: "강남구협회장배",
  startDate: new Date("2026-06-01"),
  venue_name: "강남구민체육관",
  series_id: BigInt(1),
  maxTeams: 36,
  entry_fee: new Prisma.Decimal(50000),
  auto_approve_teams: false,
  settings: { default_recording_mode: "flutter" },
  ...overrides,
});

const buildFullRelation = (
  overrides: Partial<ChecklistRelationInput> = {}
): ChecklistRelationInput => ({
  divisionRules: [
    { format: "single_elimination", settings: {} },
    { format: "group_stage_knockout", settings: { group_size: 4, group_count: 2 } },
  ],
  hasTournamentSite: true,
  isSitePublished: true,
  matchesCount: 12,
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────
// 1. 기본 정보
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — isBasicInfoComplete", () => {
  it("name + startDate + venue_name 모두 박제되면 true", () => {
    expect(isBasicInfoComplete(buildFullTournament())).toBe(true);
  });

  it("startDate null 이면 false", () => {
    expect(isBasicInfoComplete(buildFullTournament({ startDate: null }))).toBe(false);
  });

  it("venue_name null 이면 false", () => {
    expect(isBasicInfoComplete(buildFullTournament({ venue_name: null }))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. 시리즈 연결
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — isSeriesLinked", () => {
  it("series_id != null 이면 true", () => {
    expect(isSeriesLinked(buildFullTournament())).toBe(true);
  });

  it("series_id null 이면 false", () => {
    expect(isSeriesLinked(buildFullTournament({ series_id: null }))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. 종별 정의
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — areDivisionsDefined", () => {
  it("divisionRules 1건 이상이면 true", () => {
    expect(areDivisionsDefined([{ format: "single_elimination", settings: {} }])).toBe(
      true
    );
  });

  it("divisionRules 0건이면 false", () => {
    expect(areDivisionsDefined([])).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. 운영 방식 — format + 조 설정 검증
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — areDivisionRulesComplete", () => {
  it("모든 format 박제 + 단순 모드 (single_elimination) 면 true", () => {
    expect(
      areDivisionRulesComplete([{ format: "single_elimination", settings: {} }])
    ).toBe(true);
  });

  it("일부 format null 이면 false", () => {
    expect(
      areDivisionRulesComplete([
        { format: "single_elimination", settings: {} },
        { format: null, settings: {} },
      ])
    ).toBe(false);
  });

  it("group_stage_knockout 인데 group_size/group_count 미박제면 false", () => {
    expect(
      areDivisionRulesComplete([{ format: "group_stage_knockout", settings: {} }])
    ).toBe(false);
  });

  it("group_stage_knockout 에 group_size+group_count 박제되면 true", () => {
    expect(
      areDivisionRulesComplete([
        { format: "group_stage_knockout", settings: { group_size: 4, group_count: 2 } },
      ])
    ).toBe(true);
  });

  it("legacy camelCase (groupSize/groupCount) 도 인정", () => {
    expect(
      areDivisionRulesComplete([
        { format: "group_stage_knockout", settings: { groupSize: 4, groupCount: 2 } },
      ])
    ).toBe(true);
  });

  it("divisionRules 0건이면 false (3 종별 정의 미완)", () => {
    expect(areDivisionRulesComplete([])).toBe(false);
  });

  it("invalid format enum 이면 false (runtime 방어)", () => {
    // format 은 string | null 타입이라 invalid 문자열도 런타임에 들어올 수 있음 → 보수적으로 false 처리.
    const rules: ChecklistDivisionRuleInput[] = [
      { format: "invalid_format_xyz", settings: {} },
    ];
    expect(areDivisionRulesComplete(rules)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. 신청 정책
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — isRegistrationPolicyComplete", () => {
  it("maxTeams + entry_fee + auto_approve_teams 모두 박제되면 true", () => {
    expect(isRegistrationPolicyComplete(buildFullTournament())).toBe(true);
  });

  it("entry_fee=0 (무료) 도 박제로 인정", () => {
    expect(
      isRegistrationPolicyComplete(
        buildFullTournament({ entry_fee: new Prisma.Decimal(0) })
      )
    ).toBe(true);
  });

  it("auto_approve_teams=true 도 박제로 인정", () => {
    expect(
      isRegistrationPolicyComplete(buildFullTournament({ auto_approve_teams: true }))
    ).toBe(true);
  });

  it("maxTeams null 이면 false", () => {
    expect(
      isRegistrationPolicyComplete(buildFullTournament({ maxTeams: null }))
    ).toBe(false);
  });

  it("auto_approve_teams null 이면 false (boolean 미박제)", () => {
    expect(
      isRegistrationPolicyComplete(buildFullTournament({ auto_approve_teams: null }))
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. 사이트 설정
// ─────────────────────────────────────────────────────────────────────────

// 2026-05-13 UI-5 — 6번 카드 의미 변경: "사이트 박제됨" 만 검증 (isPublished 는 무관).
//   이유: 공개 게이트가 "6번 ✅ 일 때 비로소 공개 가능" 흐름. 6번이 "이미 공개" 를 요구하면 닭과 달걀.
describe("setup-status — isSiteConfigured (UI-5 의미 변경)", () => {
  it("hasTournamentSite=true 면 true (isPublished 와 무관)", () => {
    expect(isSiteConfigured(buildFullRelation())).toBe(true);
  });

  it("hasTournamentSite=true + isSitePublished=false 도 true (사이트 박제 = ✅)", () => {
    expect(isSiteConfigured(buildFullRelation({ isSitePublished: false }))).toBe(true);
  });

  it("hasTournamentSite=false 면 false", () => {
    expect(isSiteConfigured(buildFullRelation({ hasTournamentSite: false }))).toBe(
      false
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. 기록 설정
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — isRecordingModeConfigured", () => {
  it("settings.default_recording_mode=flutter 면 true", () => {
    expect(
      isRecordingModeConfigured(
        buildFullTournament({ settings: { default_recording_mode: "flutter" } })
      )
    ).toBe(true);
  });

  it("settings.default_recording_mode=paper 면 true", () => {
    expect(
      isRecordingModeConfigured(
        buildFullTournament({ settings: { default_recording_mode: "paper" } })
      )
    ).toBe(true);
  });

  it("settings null 이면 false", () => {
    expect(isRecordingModeConfigured(buildFullTournament({ settings: null }))).toBe(
      false
    );
  });

  it("settings 에 default_recording_mode 키 없으면 false", () => {
    expect(
      isRecordingModeConfigured(buildFullTournament({ settings: { other: "x" } }))
    ).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. 대진표 생성
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — isBracketGenerated", () => {
  it("matchesCount > 0 이면 true", () => {
    expect(isBracketGenerated(buildFullRelation({ matchesCount: 1 }))).toBe(true);
  });

  it("matchesCount = 0 이면 false", () => {
    expect(isBracketGenerated(buildFullRelation({ matchesCount: 0 }))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// calculateSetupProgress — 종합 + 잠금
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — calculateSetupProgress 종합 (PR-Admin-5: 8→7 통합)", () => {
  const tid = "11111111-1111-1111-1111-111111111111";

  it("모든 항목 박제 = 7/7 + allRequiredComplete=true", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    expect(p.completed).toBe(7);
    expect(p.total).toBe(7);
    expect(p.allRequiredComplete).toBe(true);
    expect(p.missingRequiredTitles).toEqual([]);
  });

  it("빈 대회 (name 만) = locked 항목 다수 + allRequiredComplete=false", () => {
    const t: ChecklistTournamentInput = {
      name: "테스트",
      startDate: null,
      venue_name: null,
      series_id: null,
      maxTeams: null,
      entry_fee: null,
      auto_approve_teams: null,
      settings: null,
    };
    const r: ChecklistRelationInput = {
      divisionRules: [],
      hasTournamentSite: false,
      isSitePublished: false,
      matchesCount: 0,
    };
    const p = calculateSetupProgress(tid, t, r);
    expect(p.completed).toBe(0);
    expect(p.allRequiredComplete).toBe(false);
    // 기본 정보 미박제 → 3 종별+운영방식 / 5 사이트 모두 locked (PR-Admin-5: site step 6→5)
    const divs = p.items.find((i) => i.key === "divisions");
    const site = p.items.find((i) => i.key === "site");
    expect(divs?.status).toBe("locked");
    expect(site?.status).toBe("locked");
    expect(divs?.lockedReason).toBeTruthy();
  });

  it("기본 정보만 박제 + 종별 미정의 → 통합 #3 종별+운영방식 empty + 6·7 locked", () => {
    const t = buildFullTournament();
    const r: ChecklistRelationInput = {
      divisionRules: [],
      hasTournamentSite: false,
      isSitePublished: false,
      matchesCount: 0,
    };
    const p = calculateSetupProgress(tid, t, r);
    const divs = p.items.find((i) => i.key === "divisions");
    const recording = p.items.find((i) => i.key === "recording");
    const bracket = p.items.find((i) => i.key === "bracket");
    // 통합 카드 — basic ✅ / divsDefined ❌ → empty (locked 아님 — 진입 가능)
    expect(divs?.status).toBe("empty");
    // 종별 미정의 → 6·7 모두 locked
    expect(recording?.status).toBe("locked");
    expect(bracket?.status).toBe("locked");
  });

  it("종별+운영방식 일부 미완료 (group_size 미박제) → in_progress + 6·7 잠금 + 공개 불가", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({
      divisionRules: [
        { format: "group_stage_knockout", settings: {} }, // group_size 미박제
      ],
    });
    const p = calculateSetupProgress(tid, t, r);
    const divs = p.items.find((i) => i.key === "divisions");
    const recording = p.items.find((i) => i.key === "recording");
    const bracket = p.items.find((i) => i.key === "bracket");
    // 통합 카드 — divsDefined ✅ + divsComplete ❌ → in_progress
    expect(divs?.status).toBe("in_progress");
    expect(recording?.status).toBe("locked");
    expect(bracket?.status).toBe("locked");
    expect(p.allRequiredComplete).toBe(false);
    expect(p.missingRequiredTitles).toContain("종별 + 운영 방식");
  });

  it("시리즈 미연결 (2) 만 빠지면 allRequiredComplete=true (선택 항목)", () => {
    const t = buildFullTournament({ series_id: null });
    const r = buildFullRelation();
    const p = calculateSetupProgress(tid, t, r);
    expect(p.completed).toBe(6); // 시리즈 빼고 6개 완료 (PR-Admin-5: 7→6)
    expect(p.allRequiredComplete).toBe(true); // 시리즈는 required=false → 공개 가능
    const series = p.items.find((i) => i.key === "series");
    expect(series?.required).toBe(false);
    expect(series?.status).toBe("empty");
  });

  it("진행도 3/7 케이스 — 기본/시리즈/종별+운영방식 박제 + 나머지 미완 (PR-Admin-5: 4/8 → 3/7)", () => {
    const t = buildFullTournament({
      maxTeams: null,
      entry_fee: null,
      auto_approve_teams: null,
      settings: null, // 6 기록 미박제
    });
    const r = buildFullRelation({
      hasTournamentSite: false,
      isSitePublished: false,
      matchesCount: 0,
    });
    const p = calculateSetupProgress(tid, t, r);
    expect(p.completed).toBe(3); // 1, 2, 3 (통합) 완료
    expect(p.allRequiredComplete).toBe(false);
    expect(p.missingRequiredTitles.length).toBeGreaterThan(0);
  });

  it("각 카드의 link 가 tournamentId prefix 포함", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    for (const item of p.items) {
      expect(item.link).toContain(tid);
    }
  });

  // 2026-05-13 UI-1.5 회귀 가드 — 신청 정책(4번) 카드는 wizard 의 RegistrationSettingsForm 영역(Step 2)
  //   으로 바로 진입하도록 ?step=2 query 가 박제되어야 한다. PR-Admin-5: 5번 → 4번 step renumbering.
  it("신청 정책(4) 카드 link 는 ?step=2 query 포함 (UI-1.5 회귀 가드)", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    const regItem = p.items.find((i) => i.key === "registration");
    expect(regItem).toBeDefined();
    expect(regItem?.link).toMatch(/\/wizard\?step=2$/);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // PR-Admin-5 신규 가드 — 통합 카드 #3 "종별 + 운영 방식"
  // ─────────────────────────────────────────────────────────────────────────

  it("PR-Admin-5: items.length === 7 (8→7 축소 회귀 가드)", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    expect(p.items).toHaveLength(7);
  });

  it("PR-Admin-5: 통합 카드 key='divisions' / step=3 / title='종별 + 운영 방식'", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    const divs = p.items.find((i) => i.key === "divisions");
    expect(divs).toBeDefined();
    expect(divs?.step).toBe(3);
    expect(divs?.title).toBe("종별 + 운영 방식");
    expect(divs?.link).toMatch(/\/divisions$/);
    expect(divs?.required).toBe(true);
  });

  it("PR-Admin-5: 통합 카드 progress = { current: 2, total: 4 } (4 종별 중 2 운영방식 박제)", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({
      divisionRules: [
        { format: "single_elimination", settings: {} }, // 박제
        { format: "group_stage_knockout", settings: { group_size: 4, group_count: 2 } }, // 박제
        { format: null, settings: {} }, // 미박제
        { format: null, settings: {} }, // 미박제
      ],
    });
    const p = calculateSetupProgress(tid, t, r);
    const divs = p.items.find((i) => i.key === "divisions");
    expect(divs?.progress).toEqual({ current: 2, total: 4 });
    expect(divs?.status).toBe("in_progress");
  });

  it("PR-Admin-5: 통합 카드 모든 종별 박제 시 progress = { current: N, total: N } + status=complete", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    const divs = p.items.find((i) => i.key === "divisions");
    // buildFullRelation = 2 종별 모두 format 박제 + group_stage_knockout settings 박제
    expect(divs?.progress).toEqual({ current: 2, total: 2 });
    expect(divs?.status).toBe("complete");
  });

  it("PR-Admin-5: 통합 카드 종별 0건 시 progress=undefined (표시 0)", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({ divisionRules: [] });
    const p = calculateSetupProgress(tid, t, r);
    const divs = p.items.find((i) => i.key === "divisions");
    expect(divs?.progress).toBeUndefined();
    expect(divs?.status).toBe("empty"); // basic ✅ + divsDefined ❌ → empty
  });

  it("PR-Admin-5: 기존 #4 'divisionRules' key 제거 (통합 흡수 회귀 가드)", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    const oldKey = p.items.find((i) => i.key === "divisionRules");
    expect(oldKey).toBeUndefined();
  });

  it("PR-Admin-5: step 번호 1~7 연속 (renumbering 회귀 가드)", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    const steps = p.items.map((i) => i.step).sort((a, b) => a - b);
    expect(steps).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// UI-5 공개 게이트 — canPublish 헬퍼
// ─────────────────────────────────────────────────────────────────────────

describe("setup-status — canPublish (UI-5 공개 게이트)", () => {
  const tid = "11111111-1111-1111-1111-111111111111";

  it("필수 7항목 모두 ✅ 면 ok=true, missing=[]", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    const gate = canPublish(p);
    expect(gate.ok).toBe(true);
    expect(gate.missing).toEqual([]);
  });

  it("기본 정보만 박제 = 다수 필수 항목 미충족 → ok=false + missing 다수", () => {
    const t: ChecklistTournamentInput = {
      name: "테스트 대회",
      startDate: new Date("2026-06-01"),
      venue_name: "체육관",
      series_id: null,
      maxTeams: null,
      entry_fee: null,
      auto_approve_teams: null,
      settings: null,
    };
    const r: ChecklistRelationInput = {
      divisionRules: [],
      hasTournamentSite: false,
      isSitePublished: false,
      matchesCount: 0,
    };
    const gate = canPublish(calculateSetupProgress(tid, t, r));
    expect(gate.ok).toBe(false);
    expect(gate.missing.length).toBeGreaterThan(0);
    // PR-Admin-5: 종별+운영방식 통합 / 신청정책/사이트/기록/대진표 = 5개 모두 미충족
    expect(gate.missing).toContain("종별 + 운영 방식");
    expect(gate.missing).toContain("신청 정책");
    expect(gate.missing).toContain("사이트 설정");
    expect(gate.missing).toContain("기록 설정");
    expect(gate.missing).toContain("대진표 생성");
  });

  it("시리즈(선택) 만 빠지면 ok=true (선택 항목은 게이트 무관)", () => {
    const t = buildFullTournament({ series_id: null });
    const r = buildFullRelation();
    const gate = canPublish(calculateSetupProgress(tid, t, r));
    expect(gate.ok).toBe(true);
    expect(gate.missing).toEqual([]);
  });

  it("대진표만 미생성 → ok=false + missing=['대진표 생성']", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({ matchesCount: 0 });
    const gate = canPublish(calculateSetupProgress(tid, t, r));
    expect(gate.ok).toBe(false);
    expect(gate.missing).toContain("대진표 생성");
  });

  it("사이트만 미박제 → ok=false + missing 에 '사이트 설정' 포함", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({ hasTournamentSite: false, isSitePublished: false });
    const gate = canPublish(calculateSetupProgress(tid, t, r));
    expect(gate.ok).toBe(false);
    expect(gate.missing).toContain("사이트 설정");
  });

  it("사이트 박제됨 + isPublished=false 여도 6번은 ✅ (UI-5 의미 변경 — 닭과 달걀 회피)", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({ hasTournamentSite: true, isSitePublished: false });
    const gate = canPublish(calculateSetupProgress(tid, t, r));
    // 6번 = "사이트 박제됨" 이라 ok=true → 공개 버튼이 비공개 → 공개 토글 책임
    expect(gate.ok).toBe(true);
  });

  it("missing 배열은 SetupProgress.missingRequiredTitles 사본 (mutation 안전)", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation({ matchesCount: 0 }));
    const gate = canPublish(p);
    gate.missing.push("외부 수정");
    // 원본 progress.missingRequiredTitles 는 영향 0
    expect(p.missingRequiredTitles).not.toContain("외부 수정");
  });
});
