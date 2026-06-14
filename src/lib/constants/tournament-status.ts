/**
 * 대회 상태 → 한글 레이블 매핑 (단일 소스).
 * 4종 상태로 통일: 준비중 / 접수중 / 진행중 / 종료
 * 홈, 프로필, 대회 목록, admin, tournament-admin 전체에서 공통 사용.
 */
export const TOURNAMENT_STATUS_LABEL: Record<string, string> = {
  // 준비중 (아직 공개/접수 전)
  draft: "준비중",
  upcoming: "준비중",
  // 접수중 (참가 신청 받는 중)
  registration: "접수중",
  registration_open: "접수중",
  active: "접수중",
  published: "접수중",
  open: "접수중",
  opening_soon: "접수중",
  registration_closed: "접수중",
  // 진행중 (대회가 시작된 상태)
  in_progress: "진행중",
  live: "진행중",
  ongoing: "진행중",
  group_stage: "진행중",
  // 종료 (대회가 끝나거나 취소된 상태)
  completed: "종료",
  ended: "종료",
  closed: "종료",
  cancelled: "종료",
};

/**
 * 대회 상태 → 뱃지 variant 매핑.
 * 4종 상태에 맞춘 색상:
 *   준비중 = default (회색), 접수중 = info (파란색),
 *   진행중 = success (초록색), 종료 = secondary (회색)
 */
export const TOURNAMENT_STATUS_BADGE: Record<string, "default" | "success" | "error" | "warning" | "info" | "secondary"> = {
  // 준비중 → 회색
  draft: "default",
  upcoming: "default",
  // 접수중 → 파란색
  registration: "info",
  registration_open: "info",
  active: "info",
  published: "info",
  open: "info",
  opening_soon: "info",
  registration_closed: "info",
  // 진행중 → 초록색
  in_progress: "success",
  live: "success",
  ongoing: "success",
  group_stage: "success",
  // 종료 → 회색(secondary)
  completed: "secondary",
  ended: "secondary",
  closed: "secondary",
  cancelled: "secondary",
};

/**
 * 종료 상태로 간주하는 status 집합.
 * 이 상태들은 시간 경과 여부와 무관하게 "이미 끝/취소" 의미이므로 그대로 둔다.
 * (effectiveTournamentStatus 에서 가드용으로 사용)
 */
const TERMINAL_STATUSES = new Set(["completed", "ended", "closed", "cancelled"]);

/**
 * 시간 경과 기반 보정에서 "건드리면 안 되는" status 집합.
 * - draft/upcoming: 아직 공개/접수 전 → 날짜가 지났다고 자동 종료시키면 오표시.
 * - FINAL/PREOPEN: 운영상 명시 상태(대문자 박제) → 원본 보존.
 * 왜 별도 가드:
 *   DB status 가 in_progress/published 로 박제된 채 종료일만 지난 경우만
 *   "종료"로 보정하면 충분하고, 그 외 상태는 의도된 값일 수 있어 보존한다.
 */
const NO_TIME_OVERRIDE = new Set([
  "draft",
  "upcoming",
  "final", // FINAL (소문자 비교)
  "preopen", // PREOPEN (소문자 비교)
]);

/**
 * 실효(effective) 대회 상태 계산.
 *
 * 왜 필요한가:
 *   - DB status 가 in_progress / published 로 박제된 채 대회 종료일이 지난
 *     레코드들이 있다. 이걸 그대로 라벨링하면 끝난 대회가 "진행중/접수중"으로 보인다.
 *   - 라벨 표시 단계에서만 종료일 경과를 반영해 "종료"로 보정한다.
 *     (DB / 접수(CTA) 로직은 일절 건드리지 않음 — 표시 전용)
 *
 * 규칙:
 *   1) status 가 종료/취소(TERMINAL) 면 그대로 반환 (이미 끝/취소).
 *   2) status 가 draft/upcoming/FINAL/PREOPEN 이면 그대로 반환 (보정 제외).
 *   3) 그 외 상태에서 종료일(endDate, 없으면 startDate)이 지났으면 "completed".
 *      - 종료일 "당일"은 아직 진행 중으로 보고, 당일 23:59:59 까지는 보정 안 함.
 *   4) 종료일/시작일 둘 다 없으면 원본 status 그대로 반환.
 *
 * @param status   DB 원본 status (null 가능)
 * @param startDate 대회 시작일 (Date | string | null)
 * @param endDate   대회 종료일 (Date | string | null). 없으면 startDate 폴백.
 * @returns 보정된 status 문자열 (원본 대소문자 보존, 보정 시에만 "completed")
 */
export function effectiveTournamentStatus(
  status: string | null | undefined,
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
): string {
  const raw = status ?? "";
  const lower = raw.toLowerCase();

  // 규칙 1) 이미 종료/취소 → 원본 보존
  if (TERMINAL_STATUSES.has(lower)) return raw;
  // 규칙 2) 보정 제외 상태(준비중/명시상태) → 원본 보존
  if (NO_TIME_OVERRIDE.has(lower)) return raw;

  // 종료 기준일 결정: endDate 우선, 없으면 startDate 폴백
  const refSrc = endDate ?? startDate;
  // 규칙 4) 날짜 정보 자체가 없으면 보정 불가 → 원본 보존
  if (!refSrc) return raw;

  const ref = refSrc instanceof Date ? refSrc : new Date(refSrc);
  // 파싱 실패(Invalid Date) 시에도 보정하지 않고 원본 보존 (안전)
  if (isNaN(ref.getTime())) return raw;

  // 규칙 3) 종료일 "당일 23:59:59.999" 까지는 진행으로 간주.
  // 왜: 종료일 자정(00:00) 기준으로 비교하면 대회 당일에 "종료"로 떠버린다.
  // 종료일의 하루 끝까지 경과해야 비로소 종료로 보정한다.
  const endOfRefDay = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
    23,
    59,
    59,
    999,
  );

  if (Date.now() > endOfRefDay.getTime()) return "completed";

  // 아직 종료일이 지나지 않음 → 원본 보존
  return raw;
}

/**
 * 대회 형식 → 한글 레이블 매핑.
 */
export const TOURNAMENT_FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
  group_stage: "조별리그",
  group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트", // DB에 대문자로 저장된 레코드 대응
  dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트",
  swiss: "스위스 라운드",
};

/**
 * 대회 형식 약어 레이블 (카드 UI처럼 공간이 좁은 곳에서 사용).
 */
export const TOURNAMENT_FORMAT_LABEL_SHORT: Record<string, string> = {
  single_elimination: "토너먼트",
  double_elimination: "더블 엘리미",
  round_robin: "리그전",
  group_stage: "조별리그",
  group_stage_knockout: "조별+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별+토너먼트",
  dual_tournament: "듀얼토너먼트",
  full_league_knockout: "풀리그+토너먼트",
  swiss: "스위스",
};

/**
 * 각 상태에서 전환 가능한 상태 목록 (admin 상태 변경 드롭다운용).
 * 4종 기준으로 재정의: 준비중→접수중→진행중→종료
 */
export const TOURNAMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  // 준비중 → 접수중 또는 종료(취소)
  draft: ["registration", "cancelled"],
  upcoming: ["registration", "cancelled"],
  // 접수중 → 진행중 또는 종료(취소)
  registration: ["in_progress", "cancelled"],
  registration_open: ["in_progress", "cancelled"],
  active: ["in_progress", "cancelled"],
  published: ["registration", "cancelled"],
  open: ["in_progress", "cancelled"],
  opening_soon: ["registration", "cancelled"],
  registration_closed: ["in_progress", "cancelled"],
  // 진행중 → 종료
  in_progress: ["completed", "cancelled"],
  live: ["completed", "cancelled"],
  ongoing: ["completed", "cancelled"],
  group_stage: ["completed", "cancelled"],
  // 종료 → 되돌리기(초안으로)
  completed: [],
  ended: [],
  closed: [],
  cancelled: ["draft"],
};

/**
 * 대회 상태 색상 매핑 (텍스트 색상용, 대회 상세 페이지 등에서 사용).
 * 4종 통일 기준.
 */
export const TOURNAMENT_STATUS_COLOR: Record<string, string> = {
  // 준비중 → 회색
  draft: "text-[var(--color-text-muted)]",
  upcoming: "text-[var(--color-text-muted)]",
  // 접수중 → 파란색
  registration: "text-[var(--color-info)]",
  registration_open: "text-[var(--color-info)]",
  active: "text-[var(--color-info)]",
  published: "text-[var(--color-info)]",
  open: "text-[var(--color-info)]",
  opening_soon: "text-[var(--color-info)]",
  registration_closed: "text-[var(--color-info)]",
  // 진행중 → 초록색
  in_progress: "text-[var(--color-success)]",
  live: "text-[var(--color-success)]",
  ongoing: "text-[var(--color-success)]",
  group_stage: "text-[var(--color-success)]",
  // 종료 → 회색
  completed: "text-[var(--color-text-muted)]",
  ended: "text-[var(--color-text-muted)]",
  closed: "text-[var(--color-text-muted)]",
  cancelled: "text-[var(--color-text-muted)]",
};
