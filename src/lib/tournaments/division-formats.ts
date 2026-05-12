/**
 * 2026-05-12 Phase 3.5-D — 종별 진행 방식 (format) + 조 설정 (settings) 헬퍼 모음.
 *
 * 분리 사유:
 *   - division-rules route.ts (server) 와 divisions/page.tsx (client) 양쪽에서 동일 enum / 검증 사용
 *   - vitest 단위 검증 가능 (route.ts 는 NextRequest 의존성으로 단위 테스트 어려움)
 *
 * 신규 enum: group_stage_with_ranking
 *   의미: 각 조 풀리그 (group_size 팀 × group_count 조) → 모든 조 동순위끼리 자동 매칭
 *         (1위×N팀 동순위전 / 2위×N팀 동순위전 / ...)
 *   league_advancement 와 차이: settings.linkage_pairs 명시 불필요
 *     (group_size / group_count 만 박제 → 모든 동순위 자동 매칭)
 */

// ─────────────────────────────────────────────────────────────────────────
// 진행 방식 (format) enum
// ─────────────────────────────────────────────────────────────────────────

export const ALLOWED_FORMATS = [
  "single_elimination",
  "double_elimination",
  "round_robin",
  "dual_tournament",
  "group_stage_knockout",
  "full_league_knockout",
  "league_advancement", // i3-U9 링크제 (각조 동순위전 — settings.linkage_pairs 명시)
  "group_stage_with_ranking", // ⭐ Phase 3.5-D — 조별리그 + 동순위 순위결정전 (자동 매칭)
  "swiss",
] as const;

export type DivisionFormat = (typeof ALLOWED_FORMATS)[number];

// 2026-05-13 한국 생활체육 농구 표준 용어 통일 (사용자 결재 §A):
//   - single_elimination — "싱글 엘리미네이션" → "토너먼트" (한국 생활체육 표준)
//   - round_robin       — "풀리그 (Round Robin)" → "풀리그"
//   - double_elimination — "더블 엘리미네이션" → "더블 토너먼트"
//   - swiss             — "스위스 라운드" (일반 명칭 유지)
//   - 나머지 (dual_tournament / group_stage_knockout / full_league_knockout / league_advancement /
//     group_stage_with_ranking) — 이미 한국식 → 변경 0
// enum 값 자체는 DB 호환성 유지 (변경 X — 라벨만 한국화).
export const FORMAT_LABEL: Record<DivisionFormat, string> = {
  single_elimination: "토너먼트", // single_elimination — 토너먼트(싱글)
  double_elimination: "더블 토너먼트", // double_elimination — 더블 토너먼트
  round_robin: "풀리그", // round_robin — 풀리그
  dual_tournament: "듀얼 토너먼트",
  group_stage_knockout: "조별리그 + 토너먼트",
  full_league_knockout: "풀리그 + 토너먼트",
  league_advancement: "링크제 (각조 동순위전)",
  group_stage_with_ranking: "조별리그 + 동순위 순위결정전",
  swiss: "스위스 라운드",
};

// ─────────────────────────────────────────────────────────────────────────
// 조 설정 (group_size / group_count) 노출 가드
// ─────────────────────────────────────────────────────────────────────────

/**
 * 풀리그 기반 진행 방식 (조 단위 풀리그 / 본선 / 동순위전) 만 조 크기·개수 입력 활성.
 * 싱글/더블/스위스 = 조 개념 없음 → input 숨김.
 */
const GROUP_SETTING_FORMATS = new Set<DivisionFormat>([
  "round_robin",
  "dual_tournament",
  "group_stage_knockout",
  "full_league_knockout",
  "league_advancement",
  "group_stage_with_ranking",
]);

export function showGroupSettings(format: string | null | undefined): boolean {
  if (!format) return false;
  return GROUP_SETTING_FORMATS.has(format as DivisionFormat);
}

/**
 * 동순위 순위결정전 방식 (ranking_format) input 노출 대상.
 * group_stage_with_ranking 만 활성 (다른 enum 은 의미 없음).
 */
export function showRankingFormat(format: string | null | undefined): boolean {
  return format === "group_stage_with_ranking";
}

/**
 * 2026-05-13 — 조별 본선 진출 팀 수 (advance_per_group) input 노출 대상.
 *
 * 사유: 조별리그/풀리그 → 토너먼트 본선으로 이어지는 enum 에서만 의미 있음.
 *   - group_stage_knockout / full_league_knockout / dual_tournament = 조 N위까지 본선 진출
 *   - league_advancement = linkage_pairs 명시로 매칭 (advance_per_group 무의미)
 *   - group_stage_with_ranking = 모든 순위 동순위전 (advance_per_group 무의미)
 *   - round_robin / single_elimination / double_elimination / swiss = 본선 분리 없음
 */
const ADVANCE_PER_GROUP_FORMATS = new Set<DivisionFormat>([
  "group_stage_knockout",
  "full_league_knockout",
  "dual_tournament",
]);

export function shouldShowAdvancePerGroup(format: string | null | undefined): boolean {
  if (!format) return false;
  return ADVANCE_PER_GROUP_FORMATS.has(format as DivisionFormat);
}

/**
 * advance_per_group 기본값 — 한국 생활체육 표준 (조 1·2위 진출).
 */
export const ADVANCE_PER_GROUP_DEFAULT = 2;

// ─────────────────────────────────────────────────────────────────────────
// settings JSON 검증 (group_size / group_count / ranking_format)
// ─────────────────────────────────────────────────────────────────────────

export type DivisionSettingsValidationError = {
  field: "group_size" | "group_count" | "ranking_format" | "advance_per_group";
  message: string;
};

/**
 * settings JSON 의 신규 키 (group_size / group_count / ranking_format / advance_per_group) 검증.
 *
 * 룰:
 *   - group_size / group_count = 1~32 정수 (음수/소수/0/문자 거부)
 *   - ranking_format = "round_robin" / "single_elimination" 둘 중 하나
 *   - advance_per_group = 1~32 정수 + group_size 가 박제돼 있으면 advance_per_group <= group_size
 *     (조 크기보다 많은 팀이 본선 진출할 수 없음)
 *   - 키 자체가 없으면 OK (선택 입력)
 *   - legacy 키 (linkage_pairs / advanceCount 등) 는 검증 안 함 (호환 유지)
 *
 * @returns 첫 위반 에러 또는 null (통과)
 */
export function validateDivisionSettings(
  settings: Record<string, unknown> | null | undefined,
): DivisionSettingsValidationError | null {
  if (!settings) return null;

  const gs = settings.group_size;
  if (gs !== undefined && gs !== null) {
    if (typeof gs !== "number" || !Number.isInteger(gs) || gs < 1 || gs > 32) {
      return { field: "group_size", message: "group_size 는 1~32 정수여야 합니다" };
    }
  }

  const gc = settings.group_count;
  if (gc !== undefined && gc !== null) {
    if (typeof gc !== "number" || !Number.isInteger(gc) || gc < 1 || gc > 32) {
      return { field: "group_count", message: "group_count 는 1~32 정수여야 합니다" };
    }
  }

  const rf = settings.ranking_format;
  if (rf !== undefined && rf !== null) {
    if (rf !== "round_robin" && rf !== "single_elimination") {
      return {
        field: "ranking_format",
        message: "ranking_format 는 round_robin / single_elimination 둘 중 하나여야 합니다",
      };
    }
  }

  // 2026-05-13 — advance_per_group 검증 (조별 본선 진출 팀 수)
  const apg = settings.advance_per_group;
  if (apg !== undefined && apg !== null) {
    if (typeof apg !== "number" || !Number.isInteger(apg) || apg < 1 || apg > 32) {
      return {
        field: "advance_per_group",
        message: "advance_per_group 는 1~32 정수여야 합니다",
      };
    }
    // group_size 가 함께 박제돼 있으면 advance_per_group <= group_size 강제
    // (조 크기보다 많은 팀이 본선에 진출할 수 없음)
    if (typeof gs === "number" && Number.isInteger(gs) && apg > gs) {
      return {
        field: "advance_per_group",
        message: "advance_per_group 는 group_size 이하여야 합니다 (조 크기 초과 진출 불가)",
      };
    }
  }

  return null;
}

/**
 * 총 팀 수 계산 (group_size × group_count).
 * 둘 중 하나라도 빈 값이면 null.
 */
export function calculateTotalTeams(
  groupSize: number | null | undefined,
  groupCount: number | null | undefined,
): number | null {
  if (groupSize == null || groupCount == null) return null;
  if (!Number.isFinite(groupSize) || !Number.isFinite(groupCount)) return null;
  return groupSize * groupCount;
}
