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

export const FORMAT_LABEL: Record<DivisionFormat, string> = {
  single_elimination: "싱글 엘리미네이션",
  double_elimination: "더블 엘리미네이션",
  round_robin: "풀리그 (Round Robin)",
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

// ─────────────────────────────────────────────────────────────────────────
// settings JSON 검증 (group_size / group_count / ranking_format)
// ─────────────────────────────────────────────────────────────────────────

export type DivisionSettingsValidationError = {
  field: "group_size" | "group_count" | "ranking_format";
  message: string;
};

/**
 * settings JSON 의 신규 키 (group_size / group_count / ranking_format) 검증.
 *
 * 룰:
 *   - group_size / group_count = 1~32 정수 (음수/소수/0/문자 거부)
 *   - ranking_format = "round_robin" / "single_elimination" 둘 중 하나
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
