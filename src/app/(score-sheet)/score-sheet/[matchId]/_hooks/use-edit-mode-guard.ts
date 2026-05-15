/**
 * useEditModeGuard — score-sheet 수정 모드 / read-only 가드 단일 source.
 *
 * 2026-05-15 (PR-D-3 / P1-1 분해) — 전수조사 P1-1 form 분해 3단계.
 *   기존 score-sheet-form 안 17개+ 위치에 산재한 `if (isCompleted && !isEditMode) return;`
 *   패턴 + isCompleted 정의 + isEditMode useState 를 훅 단일 source 로 통합.
 *
 * 동작:
 *   - isCompleted = match.status === "completed"
 *   - isEditMode  = setIsEditMode 로 토글 (default false)
 *   - isReadOnly  = isCompleted && !isEditMode (가드 단일 표현)
 *
 * 사용:
 *   const { isCompleted, isEditMode, setIsEditMode, isReadOnly } = useEditModeGuard(match);
 *   if (isReadOnly) return; // handler 가드 단일 표현
 *
 * 박제 룰 (보존 의무):
 *   - 진행 매치 (isCompleted=false) = isReadOnly=false → 기존 동작 보존.
 *   - 종료 매치 + isEditMode=false = isReadOnly=true → 모든 차단 분기 유지.
 *   - 종료 매치 + isEditMode=true = isReadOnly=false → 사용자 명시 동의 후 수정 가능.
 */

import { useState } from "react";

interface MatchStatusInput {
  status?: string | null;
}

export interface EditModeGuardResult {
  /** match.status === "completed". 종료 매치 진입 시 true. */
  isCompleted: boolean;
  /** 사용자 명시 동의 후 수정 모드 진입. default false. */
  isEditMode: boolean;
  /** 수정 모드 진입 setter — toolbar "수정 모드" 버튼 클릭 시 호출. */
  setIsEditMode: (next: boolean) => void;
  /**
   * isCompleted && !isEditMode. 핸들러 가드 단일 표현.
   *   if (isReadOnly) return; 으로 통일.
   */
  isReadOnly: boolean;
}

export function useEditModeGuard(match: MatchStatusInput): EditModeGuardResult {
  const [isEditMode, setIsEditMode] = useState(false);
  const isCompleted = match.status === "completed";
  const isReadOnly = isCompleted && !isEditMode;
  return { isCompleted, isEditMode, setIsEditMode, isReadOnly };
}
