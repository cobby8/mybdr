// Match status constants — single source of truth for all match-related status values
export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  LIVE: "live",
  COMPLETED: "completed",
} as const;

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

// DB/API standard: in_progress. "live" is a legacy app/DB alias only.
export const LIVE_MATCH_STATUSES = [
  MATCH_STATUS.IN_PROGRESS,
  MATCH_STATUS.LIVE,
] as const;

export const OFFICIAL_MATCH_STATUSES = [
  MATCH_STATUS.COMPLETED,
  ...LIVE_MATCH_STATUSES,
] as const;

// 서버에서 허용하는 모든 상태 (sync용)
export const SYNC_ALLOWED_STATUSES = [
  "scheduled",
  "live",
  "in_progress",
  "completed",
] as const;

// 활성 경기 상태 (recorder 목록용)
export const ACTIVE_MATCH_STATUSES = [
  "scheduled",
  "in_progress",
  "live",
] as const;

// 활성 대회 상태
export const ACTIVE_TOURNAMENT_STATUSES = [
  "in_progress",
  "registration_open",
] as const;

export function normalizeMatchStatusForApi(
  status: string | null | undefined,
): string {
  if (status === MATCH_STATUS.LIVE) return MATCH_STATUS.IN_PROGRESS;
  if (status === "finished") return MATCH_STATUS.COMPLETED;
  return status ?? MATCH_STATUS.SCHEDULED;
}

export function isLiveMatchStatus(status: string | null | undefined): boolean {
  return status === MATCH_STATUS.IN_PROGRESS || status === MATCH_STATUS.LIVE;
}

export function isOfficialMatchStatus(status: string | null | undefined): boolean {
  return (
    status === MATCH_STATUS.COMPLETED ||
    status === MATCH_STATUS.IN_PROGRESS ||
    status === MATCH_STATUS.LIVE
  );
}
