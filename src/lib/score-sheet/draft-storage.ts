/**
 * draft-storage — score-sheet localStorage draft IO 순수 함수.
 *
 * 2026-05-15 (PR-D-4a / P1-1 분해) — 전수조사 P1-1 form 분해 4-a 단계.
 *   기존 form 안 4 위치에 산재한 localStorage.getItem/setItem/removeItem 호출 +
 *   직렬화 로직을 순수 함수 단일 source 로 통합. vitest 단위 검증 가능.
 *
 * 박제 룰 (보존 의무):
 *   - DRAFT_KEY_PREFIX = "fiba-score-sheet-draft-" (운영 키 변경 금지 — 기존 draft 손실 방지)
 *   - typeof window 가드 (SSR 안전 — Next.js server component 호출 케이스)
 *   - try-catch (localStorage quota / disabled / private 모드 silent fail)
 *   - savedAt = ISO string (Date.toISOString) — load 시 Date 객체 변환
 *
 * 사용:
 *   const draft = loadDraft(matchId);
 *   if (draft) { ... apply ... }
 *
 *   saveDraft(matchId, { runningScore, fouls, ... });
 *   clearDraft(matchId); // submit 성공 시 / 기록 취소 시
 */

const DRAFT_KEY_PREFIX = "fiba-score-sheet-draft-";

/** localStorage 키 빌더. */
export function draftKey(matchId: string): string {
  return DRAFT_KEY_PREFIX + matchId;
}

/**
 * draft 페이로드 — 운영 박제 형식. 신규 필드 추가 시 backward-compatible 로
 *   default 박제 (load 시 누락 키 fallback). serialize 자유 — caller 책임.
 *
 * 2026-05-16 (PR-Possession-2) — possession 옵셔널 키 박제 (mid-game reload 후
 *   공격권 화살표 + 점프볼 이벤트 복원). PossessionState 타입은 caller (form) 가
 *   복원 시 shape 검증 후 적용 — 본 인터페이스는 unknown 으로 유연 박제.
 */
export interface ScoreSheetDraft {
  /** Date.toISOString — load 시 new Date() 변환 */
  savedAt: string;
  /** form state 박제 — runningScore / fouls / timeouts / signatures / lineup / playerStats / teamA / teamB / header / possession */
  [key: string]: unknown;
}

/**
 * draft 복원 — match.id 기준 localStorage 에서 읽기.
 *   - 키 없음 / 파싱 실패 / SSR = null
 *   - quota / disabled = null (silent fail)
 */
export function loadDraft(matchId: string): ScoreSheetDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(matchId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScoreSheetDraft;
    // savedAt 검증 — 필수 키 누락 시 무효
    if (!parsed.savedAt || typeof parsed.savedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * draft 저장 — match.id 기준 localStorage 에 쓰기.
 *   - quota / disabled = silent fail (운영 UX 보호)
 *   - savedAt 자동 박제 (caller 가 미전달 시) = Date.now().toISOString()
 */
export function saveDraft(matchId: string, draft: Omit<ScoreSheetDraft, "savedAt"> & { savedAt?: string }): void {
  if (typeof window === "undefined") return;
  try {
    const withSavedAt: ScoreSheetDraft = {
      ...draft,
      savedAt: draft.savedAt ?? new Date().toISOString(),
    };
    window.localStorage.setItem(draftKey(matchId), JSON.stringify(withSavedAt));
  } catch {
    // quota / disabled silent fail
  }
}

/**
 * draft 삭제 — submit 성공 시 / 기록 취소 시 / 매치 reset 시 호출.
 */
export function clearDraft(matchId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(matchId));
  } catch {
    // 운영 영향 0
  }
}
