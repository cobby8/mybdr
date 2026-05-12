/**
 * 2026-05-13 UI-1 — setup-status.ts (대시보드 체크리스트) 단위 테스트.
 *
 * 검증 범위:
 *   - 8 항목 개별 판정 함수 (isBasicInfoComplete / ... / isBracketGenerated)
 *   - calculateSetupProgress 종합 (0/8, 4/8, 8/8)
 *   - 잠금 조건 (3 미정의 → 4 잠금 / 4 미완료 → 7·8 잠금 / 1 미박제 → 3·6 잠금)
 *   - 공개 가드 (allRequiredComplete) — 2 시리즈는 제외
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

describe("setup-status — isSiteConfigured", () => {
  it("hasTournamentSite + isSitePublished 면 true", () => {
    expect(isSiteConfigured(buildFullRelation())).toBe(true);
  });

  it("hasTournamentSite=true but isSitePublished=false 면 false", () => {
    expect(isSiteConfigured(buildFullRelation({ isSitePublished: false }))).toBe(false);
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

describe("setup-status — calculateSetupProgress 종합", () => {
  const tid = "11111111-1111-1111-1111-111111111111";

  it("모든 항목 박제 = 8/8 + allRequiredComplete=true", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    expect(p.completed).toBe(8);
    expect(p.total).toBe(8);
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
    // 기본 정보 미박제 → 3 종별 정의 / 6 사이트 모두 locked
    const divs = p.items.find((i) => i.key === "divisions");
    const site = p.items.find((i) => i.key === "site");
    expect(divs?.status).toBe("locked");
    expect(site?.status).toBe("locked");
    expect(divs?.lockedReason).toBeTruthy();
  });

  it("기본 정보만 박제 + 종별 미정의 → 4 운영 방식 locked", () => {
    const t = buildFullTournament();
    const r: ChecklistRelationInput = {
      divisionRules: [],
      hasTournamentSite: false,
      isSitePublished: false,
      matchesCount: 0,
    };
    const p = calculateSetupProgress(tid, t, r);
    const rules = p.items.find((i) => i.key === "divisionRules");
    const recording = p.items.find((i) => i.key === "recording");
    const bracket = p.items.find((i) => i.key === "bracket");
    expect(rules?.status).toBe("locked");
    expect(recording?.status).toBe("locked");
    expect(bracket?.status).toBe("locked");
  });

  it("4 운영 방식 미완료 → 7·8 잠금 + 공개 불가", () => {
    const t = buildFullTournament();
    const r = buildFullRelation({
      divisionRules: [
        { format: "group_stage_knockout", settings: {} }, // group_size 미박제
      ],
    });
    const p = calculateSetupProgress(tid, t, r);
    const rules = p.items.find((i) => i.key === "divisionRules");
    const recording = p.items.find((i) => i.key === "recording");
    const bracket = p.items.find((i) => i.key === "bracket");
    expect(rules?.status).toBe("in_progress"); // format 박제됐지만 settings 미박제 → in_progress
    expect(recording?.status).toBe("locked");
    expect(bracket?.status).toBe("locked");
    expect(p.allRequiredComplete).toBe(false);
    expect(p.missingRequiredTitles).toContain("운영 방식");
  });

  it("시리즈 미연결 (2) 만 빠지면 allRequiredComplete=true (선택 항목)", () => {
    const t = buildFullTournament({ series_id: null });
    const r = buildFullRelation();
    const p = calculateSetupProgress(tid, t, r);
    expect(p.completed).toBe(7); // 시리즈 빼고 7개 완료
    expect(p.allRequiredComplete).toBe(true); // 시리즈는 required=false → 공개 가능
    const series = p.items.find((i) => i.key === "series");
    expect(series?.required).toBe(false);
    expect(series?.status).toBe("empty");
  });

  it("진행도 4/8 케이스 — 기본/시리즈/종별/운영방식 박제 + 나머지 미완", () => {
    const t = buildFullTournament({
      maxTeams: null,
      entry_fee: null,
      auto_approve_teams: null,
      settings: null, // 7 기록 미박제
    });
    const r = buildFullRelation({
      hasTournamentSite: false,
      isSitePublished: false,
      matchesCount: 0,
    });
    const p = calculateSetupProgress(tid, t, r);
    expect(p.completed).toBe(4); // 1, 2, 3, 4 완료
    expect(p.allRequiredComplete).toBe(false);
    expect(p.missingRequiredTitles.length).toBeGreaterThan(0);
  });

  it("각 카드의 link 가 tournamentId prefix 포함", () => {
    const p = calculateSetupProgress(tid, buildFullTournament(), buildFullRelation());
    for (const item of p.items) {
      expect(item.link).toContain(tid);
    }
  });
});
