/**
 * 2026-05-13 UI-1 (대시보드 체크리스트 hub) — 대회 셋업 진행도 판정 헬퍼.
 * 2026-05-16 PR-Admin-5 — 8 항목 → 7 항목 통합 (#3 종별 정의 + #4 운영 방식 → 통합 #3 "종별 + 운영 방식").
 *
 * 이유(왜):
 *   - 운영자가 8 메뉴 카드 사이에서 "지금 뭘 해야 하는지" 파악이 어려움 (IA 진단 §3).
 *   - dashboard 를 체크리스트로 재구성 → 결정 7 항목의 진행도/잠금/요약을 한 화면에 노출.
 *   - 각 항목의 완료 여부 판정 로직을 page.tsx 에서 분리 → 단위 테스트 + 재사용.
 *   - PR-Admin-5: 종별 정의/운영 방식 두 카드는 같은 페이지(/divisions) → 운영자 클릭 2회 + 같은 페이지 진입 혼란 발생.
 *     통합 1 카드 + 진행도 ("정의 N건 / 운영방식 M건") 표시로 IA 단순화.
 *
 * 항목 7 개 (PM 명세 / PR-Admin-5 통합 후):
 *   1. 기본 정보   — name + startDate + venue_name
 *   2. 시리즈 연결 — series_id != null (선택이지만 단계로 노출)
 *   3. 종별 + 운영 방식 — divisionRules 1건 이상 + 모든 format 박제 + group_* 모드면 settings.group_size/group_count 박제
 *   4. 신청 정책   — maxTeams + entry_fee + auto_approve_teams 박제 (auto_approve 는 boolean — null 만 미설정)
 *   5. 사이트 설정 — tournamentSite 존재 + isPublished
 *   6. 기록 설정   — tournament.settings.default_recording_mode 박제
 *   7. 대진표 생성 — matches 1건 이상
 *
 * 잠금 조건 (통합 후 step 번호 한 단계씩 당김):
 *   - 3 종별 + 운영 방식 ← 1 기본 정보 선행
 *   - 5 사이트            ← 1 기본 정보 선행
 *   - 6 기록 설정         ← 3 종별 + 운영 방식 선행
 *   - 7 대진표            ← 3 종별 + 운영 방식 선행
 *
 * 공개 가드:
 *   - 필수 6 항목 (1·3·4·5·6·7) ALL ✅ 일 때 공개 가능 (2 시리즈 연결은 선택)
 */

import type { Prisma } from "@prisma/client";
import {
  ALLOWED_FORMATS,
  type DivisionFormat,
  showGroupSettings,
} from "@/lib/tournaments/division-formats";

// ─────────────────────────────────────────────────────────────────────────
// 입력 타입 — page.tsx 의 prisma include 와 1:1 매칭 (over-fetch 방지)
// ─────────────────────────────────────────────────────────────────────────

// 체크리스트 8 항목 판정에 필요한 최소 필드만 노출 (다른 곳에서 재사용 가능하도록).
export type ChecklistTournamentInput = {
  name: string;
  startDate: Date | null;
  venue_name: string | null;
  series_id: bigint | null;
  maxTeams: number | null;
  entry_fee: Prisma.Decimal | null;
  auto_approve_teams: boolean | null;
  settings: Prisma.JsonValue | null; // tournament.settings JSON (default_recording_mode 포함)
};

export type ChecklistDivisionRuleInput = {
  format: string | null;
  settings: Prisma.JsonValue | null;
};

export type ChecklistRelationInput = {
  divisionRules: ChecklistDivisionRuleInput[];
  hasTournamentSite: boolean;
  isSitePublished: boolean;
  matchesCount: number;
};

// ─────────────────────────────────────────────────────────────────────────
// 항목별 판정 함수 — 각 함수는 boolean 만 반환 (UI 책임 0)
// ─────────────────────────────────────────────────────────────────────────

/** 1. 기본 정보 — name (필수) + startDate + venue_name 모두 박제. */
export function isBasicInfoComplete(t: ChecklistTournamentInput): boolean {
  // 이유: 사이트 공개 + 매치 일정 산출에 startDate 필수. venue_name 없으면 운영자 안내 불가.
  return Boolean(t.name && t.startDate && t.venue_name);
}

/** 2. 시리즈 연결 — series_id null 아님 (선택 항목, 단계로만 노출). */
export function isSeriesLinked(t: ChecklistTournamentInput): boolean {
  return t.series_id != null;
}

/** 3. 종별 정의 — divisionRules 1건 이상 (대회는 최소 1종별 필요). */
export function areDivisionsDefined(rules: ChecklistDivisionRuleInput[]): boolean {
  return rules.length > 0;
}

/**
 * 4. 운영 방식 — 모든 divisionRules.format 박제 + 조 설정 필요 모드면 settings 채움.
 *
 * 이유:
 *   - format null = 종별 단위 진행 방식 미정 (대회 단위 fallback 가능하지만 UX 상 명시 권장).
 *   - group_stage_* / league_advancement 모드는 group_size / group_count 미박제면 대진표 생성 실패.
 *     → division-formats.ts 의 showGroupSettings() 가드 재사용 (룰 일관성).
 */
export function areDivisionRulesComplete(rules: ChecklistDivisionRuleInput[]): boolean {
  if (rules.length === 0) return false;
  return rules.every((r) => {
    // format null = 미설정 (대회 format fallback 이 가능하지만 체크리스트는 "명시 박제" 기준).
    if (!r.format) return false;
    // ALLOWED_FORMATS 에 속하지 않으면 invalid (보수적으로 미완료 취급).
    if (!ALLOWED_FORMATS.includes(r.format as DivisionFormat)) return false;
    // 조 설정 필요 모드 (group_stage_knockout / full_league_knockout / league_advancement / group_stage_with_ranking)
    // 인 경우 settings.group_size / settings.group_count 양쪽 박제 여부 검증.
    if (showGroupSettings(r.format as DivisionFormat)) {
      const s = r.settings;
      if (!s || typeof s !== "object" || Array.isArray(s)) return false;
      const obj = s as Record<string, unknown>;
      // snake_case 표준 + legacy camelCase fallback (division-formats.ts §2 와 동일 정책)
      const size = obj.group_size ?? obj.groupSize;
      const count = obj.group_count ?? obj.groupCount;
      if (typeof size !== "number" || size <= 0) return false;
      if (typeof count !== "number" || count <= 0) return false;
    }
    return true;
  });
}

/**
 * 5. 신청 정책 — maxTeams + entry_fee + auto_approve_teams 박제.
 *
 * 이유:
 *   - maxTeams null = 정원 미정 (대회 신청 페이지 노출 불가).
 *   - entry_fee null = 참가비 미박제 (0 == 무료 = 박제됨).
 *   - auto_approve_teams 는 boolean — null 만 미박제 (true / false 모두 박제).
 */
export function isRegistrationPolicyComplete(t: ChecklistTournamentInput): boolean {
  return t.maxTeams != null && t.entry_fee != null && t.auto_approve_teams != null;
}

/**
 * 6. 사이트 설정 — tournamentSite 존재 (박제됨) 여부만 검증.
 *
 * 이유 (2026-05-13 UI-5 공개 게이트 도입):
 *   - 기존: `hasTournamentSite && isPublished` (= 이미 공개돼야 ✅).
 *   - UI-5 의 공개 게이트는 "6번 ✅ 일 때 비로소 공개 가능" 흐름.
 *     → 6번이 "이미 공개" 를 요구하면 게이트 자체가 닭과 달걀 (체크리스트 = 0건도 통과 불가).
 *   - 따라서 6번 의미를 "사이트 박제 (subdomain/template 설정)" 로 좁히고, isPublished 는
 *     별도 status (체크리스트 hub 의 site 카드 summary + 공개 버튼 상태) 로 분리.
 *   - hub 의 공개 버튼은 isPublished=false → true 토글 책임 (canPublish 통과 시).
 */
export function isSiteConfigured(r: ChecklistRelationInput): boolean {
  return r.hasTournamentSite;
}

/** 7. 기록 설정 — tournament.settings.default_recording_mode 박제 ("flutter" or "paper"). */
export function isRecordingModeConfigured(t: ChecklistTournamentInput): boolean {
  const s = t.settings;
  if (!s || typeof s !== "object" || Array.isArray(s)) return false;
  const value = (s as Record<string, unknown>).default_recording_mode;
  // 명시적으로 "flutter" or "paper" 박제된 경우만 완료 (null/누락 = 미설정).
  return value === "flutter" || value === "paper";
}

/** 8. 대진표 생성 — matches 1건 이상. */
export function isBracketGenerated(r: ChecklistRelationInput): boolean {
  return r.matchesCount > 0;
}

// ─────────────────────────────────────────────────────────────────────────
// 진행도 종합 계산 — UI 에 전달할 ChecklistItem[] + 합계
// ─────────────────────────────────────────────────────────────────────────

export type ChecklistStatus = "complete" | "in_progress" | "empty" | "locked";

export type ChecklistItem = {
  key: string;
  step: number; // 1~7 (PR-Admin-5: 8→7 축소)
  title: string;
  summary: string; // 한 줄 요약 (예: "i3-U9 / i2-U11")
  status: ChecklistStatus;
  icon: string; // material symbols 이름
  link: string;
  required: boolean; // 공개 필수 항목 여부 (2 시리즈는 false, 나머지 true)
  lockedReason?: string; // status=locked 일 때 안내 문구
  // 2026-05-16 PR-Admin-5 — UI 표시용 진행도 (예: 통합 #3 "종별 + 운영 방식" — "정의 4건 / 운영방식 2건").
  //   undefined 이면 status 만 표시 (기존 동작 유지).
  progress?: { current: number; total: number };
};

export type SetupProgress = {
  completed: number; // ✅ 개수 (locked 제외)
  total: number; // 7 (PR-Admin-5: 8→7 통합)
  items: ChecklistItem[];
  allRequiredComplete: boolean; // 공개 가드 (필수 6 항목 ALL ✅)
  missingRequiredTitles: string[]; // disabled 시 tooltip 용 ("기본 정보, 종별 + 운영 방식, ...")
};

/**
 * 7 항목 진행도 종합 (PR-Admin-5: 8→7 통합).
 *
 * @param tournamentId — 카드 href 생성용 (각 카드의 진입 링크 prefix)
 * @param t — Tournament row (필요 필드만)
 * @param r — relation 요약 (divisionRules / site / matchesCount)
 */
export function calculateSetupProgress(
  tournamentId: string,
  t: ChecklistTournamentInput,
  r: ChecklistRelationInput
): SetupProgress {
  const base = `/tournament-admin/tournaments/${tournamentId}`;

  // 선행 조건 boolean (잠금 조건 산출용) — 잠금 우선 평가.
  const basic = isBasicInfoComplete(t);
  const seriesLinked = isSeriesLinked(t);
  const divsDefined = areDivisionsDefined(r.divisionRules);
  const divsComplete = areDivisionRulesComplete(r.divisionRules);
  const regComplete = isRegistrationPolicyComplete(t);
  const siteComplete = isSiteConfigured(r);
  const recordingComplete = isRecordingModeConfigured(t);
  const bracketComplete = isBracketGenerated(r);

  // 통합 카드 #3 진행도 산출 — "정의 N건 / 운영방식 M건"
  //   - rulesWithFormat = format 박제된 종별 수 (운영방식 박제 진척)
  //   - 통합 카드 status = 종별 0 = empty / 일부 = in_progress / 모두 박제 = complete
  const rulesWithFormatCount = r.divisionRules.filter((d) => !!d.format).length;
  const totalDivisionsCount = r.divisionRules.length;

  // 요약 텍스트 헬퍼 (한 줄 — 모든 카드 동일 톤)
  const venueSummary = t.venue_name ? `장소: ${t.venue_name}` : "장소 미설정";
  const seriesSummary = seriesLinked ? "시리즈 연결됨" : "시리즈 미연결 (선택)";
  // 통합 카드 #3 "종별 + 운영 방식" summary
  //   - 종별 미정의 = "종별 미정의"
  //   - 종별 정의 + 모든 운영 방식 박제 = "종별 N건 모두 운영 방식 박제됨"
  //   - 종별 정의 + 일부 운영 방식 박제 = "종별 N건 / 운영방식 M건"
  const divsCombinedSummary = !divsDefined
    ? "종별 미정의"
    : divsComplete
      ? `종별 ${totalDivisionsCount}건 모두 운영 방식 박제됨`
      : `종별 ${totalDivisionsCount}건 / 운영방식 ${rulesWithFormatCount}건`;
  const regSummary = regComplete
    ? `최대 ${t.maxTeams}팀 · 참가비 ${Number(t.entry_fee).toLocaleString()}원`
    : "정원/참가비/자동승인 미박제";
  const siteSummary = r.hasTournamentSite
    ? r.isSitePublished
      ? "사이트 공개 중"
      : "사이트 박제됨 (비공개)"
    : "사이트 미생성";
  const recordingSummary = recordingComplete
    ? `기본 모드: ${(t.settings as Record<string, unknown>).default_recording_mode === "paper" ? "기록지" : "Flutter"}`
    : "기록 모드 미설정";
  const bracketSummary = bracketComplete
    ? `${r.matchesCount}경기 생성됨`
    : "대진표 미생성";

  // 7 항목 (PR-Admin-5 통합 후) — 잠금 조건 처리 포함.
  //   기존 #3 종별 정의 + #4 운영 방식 → 통합 #3 "종별 + 운영 방식" (key="divisions")
  //   기존 #5~#8 → #4~#7 step renumbering
  const items: ChecklistItem[] = [
    {
      key: "basic",
      step: 1,
      title: "기본 정보",
      summary: basic ? venueSummary : "이름·일정·장소 미박제",
      status: basic ? "complete" : statusFromAnyField(t.name, t.startDate, t.venue_name),
      icon: "info",
      link: `${base}/wizard`,
      required: true,
    },
    {
      key: "series",
      step: 2,
      title: "시리즈 연결",
      summary: seriesSummary,
      status: seriesLinked ? "complete" : "empty",
      icon: "linked_services",
      link: `${base}/wizard`,
      required: false, // 선택 항목
    },
    // ⭐ PR-Admin-5 통합 카드 — 종별 정의 + 운영 방식 (같은 페이지 = /divisions)
    //   사유: 운영자가 같은 페이지로 클릭 2회 진입 혼란 → 1 카드 + 진행도 표시 (정의 N건 / 운영방식 M건)
    //   status: divsComplete (= 종별 정의 ALL + 운영 방식 박제 ALL) 시만 complete
    //   progress: divsDefined 시 운영방식 진척 (rulesWithFormat / totalDivisions) 표시
    {
      key: "divisions",
      step: 3,
      title: "종별 + 운영 방식",
      summary: divsCombinedSummary,
      status: !basic
        ? "locked"
        : divsComplete
          ? "complete"
          : divsDefined
            ? "in_progress"
            : "empty",
      icon: "category",
      link: `${base}/divisions`,
      required: true,
      lockedReason: !basic ? "기본 정보를 먼저 박제하세요" : undefined,
      // 진행도 표시 — 종별 정의된 경우에만 (정의 0이면 progress undefined = 표시 0)
      progress: divsDefined
        ? { current: rulesWithFormatCount, total: totalDivisionsCount }
        : undefined,
    },
    {
      key: "registration",
      step: 4,
      title: "신청 정책",
      summary: regSummary,
      status: regComplete ? "complete" : "empty",
      icon: "how_to_reg",
      // 2026-05-13 UI-1.5 — wizard 의 RegistrationSettingsForm 영역(Step 2 = 참가 설정) 으로 바로 진입.
      //   ?step=N (1-based) 은 [id]/wizard/page.tsx 의 initialStep 로직이 0-based 로 변환해 적용.
      link: `${base}/wizard?step=2`,
      required: true,
    },
    {
      key: "site",
      step: 5,
      title: "사이트 설정",
      summary: siteSummary,
      // 2026-05-13 UI-5: siteComplete (= hasTournamentSite) 면 ✅. isPublished 는 status 분리됨
      //   → 사이트 박제만 완료되면 5번 카드 ✅ (공개는 hub 의 공개 버튼이 별도 책임)
      status: !basic ? "locked" : siteComplete ? "complete" : "empty",
      icon: "language",
      link: `${base}/site`,
      required: true,
      lockedReason: !basic ? "기본 정보를 먼저 박제하세요" : undefined,
    },
    {
      key: "recording",
      step: 6,
      title: "기록 설정",
      summary: recordingSummary,
      status: !divsComplete ? "locked" : recordingComplete ? "complete" : "empty",
      icon: "edit_note",
      link: `${base}/matches`,
      required: true,
      lockedReason: !divsComplete ? "종별 + 운영 방식을 먼저 박제하세요" : undefined,
    },
    {
      key: "bracket",
      step: 7,
      title: "대진표 생성",
      summary: bracketSummary,
      status: !divsComplete ? "locked" : bracketComplete ? "complete" : "empty",
      icon: "account_tree",
      link: `${base}/bracket`,
      required: true,
      lockedReason: !divsComplete ? "종별 + 운영 방식을 먼저 박제하세요" : undefined,
    },
  ];

  // 완료 개수 (locked 제외 — locked 는 "아직 시도 불가" 라 0 으로 카운트)
  const completed = items.filter((i) => i.status === "complete").length;

  // 공개 가드: 필수 7 항목 (required=true) 이 모두 complete 인지.
  const requiredItems = items.filter((i) => i.required);
  const allRequiredComplete = requiredItems.every((i) => i.status === "complete");
  const missingRequiredTitles = requiredItems
    .filter((i) => i.status !== "complete")
    .map((i) => i.title);

  return {
    completed,
    total: items.length,
    items,
    allRequiredComplete,
    missingRequiredTitles,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-13 UI-5 공개 게이트 — 공개 가능 여부 판정 헬퍼
// ─────────────────────────────────────────────────────────────────────────

/**
 * 공개 가능 여부 (필수 7 항목 ALL ✅) 판정.
 *
 * 이유:
 *   - 클라이언트 (체크리스트 hub 의 공개 버튼) + 서버 (POST /site/publish 가드) 양쪽에서
 *     동일한 판정 로직을 단일 source 로 공유.
 *   - calculateSetupProgress() 이미 allRequiredComplete + missingRequiredTitles 산출 →
 *     이를 한 줄로 노출만 (재계산 0).
 *
 * @param progress — calculateSetupProgress() 반환값
 * @returns { ok, missing } — ok=true 면 공개 허용, missing 은 미충족 항목 title 배열
 */
export function canPublish(progress: SetupProgress): {
  ok: boolean;
  missing: string[];
} {
  return {
    ok: progress.allRequiredComplete,
    missing: [...progress.missingRequiredTitles],
  };
}

/**
 * 일부 필드만 박제된 경우 in_progress / 전혀 없으면 empty 판정 헬퍼.
 * (기본 정보 카드 — name 만 있고 startDate 없는 케이스 등을 in_progress 로 노출)
 */
function statusFromAnyField(...fields: Array<unknown>): ChecklistStatus {
  const filledCount = fields.filter((f) => f != null && f !== "").length;
  if (filledCount === 0) return "empty";
  if (filledCount === fields.length) return "complete";
  return "in_progress";
}
