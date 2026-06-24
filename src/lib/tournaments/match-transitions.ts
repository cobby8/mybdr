/**
 * 매치 상태 전환 테이블 (TC-NEW-012).
 * 모든 가능한 상태 전환의 단일 소스.
 */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:     ["scheduled", "cancelled"],
  scheduled:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  bye:         [],
  completed:   [],
  cancelled:   ["scheduled"],
};

/**
 * 기록원(Recorder) API에서 허용하는 전환의 서브셋.
 * 기록원은 scheduled -> in_progress, in_progress -> completed/cancelled 만 가능.
 *
 * 2026-06-21: 태블릿 구버전 앱 미동기화 경기 업로드 구제 — 전이 완화 + 재시도 멱등.
 *   - scheduled->completed 직접 전이 허용(선행 in_progress PATCH 없이 종료된 경기 흡수)
 *   - in_progress->in_progress / completed->completed 멱등 허용(재시도 시 400 방지)
 */
export const RECORDER_TRANSITIONS: Record<string, string[]> = {
  scheduled:   ["scheduled", "in_progress", "completed", "cancelled"],
  in_progress: ["scheduled", "completed", "in_progress", "cancelled"],
  completed:   ["completed"], // 재시도 멱등(이미 완료된 경기 재업로드 시 400 방지)
};
