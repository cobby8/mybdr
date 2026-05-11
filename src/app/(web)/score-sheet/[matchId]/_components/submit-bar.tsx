/**
 * 종이 기록지 폼 제출 바.
 *
 * 2026-05-11 — Phase 1-B-2 신규.
 *
 * 기능:
 *   - "매치 종료" 토글 — 체크 시 status="completed" 전송, 미체크 = "in_progress" 전송
 *   - 검증 alert (부모 form 에서 산출한 errors[] 표시)
 *   - "제출" 버튼 (loading + disabled)
 *
 * 사용자 결재 = 옵션 D (decisions §4): 배치 제출 — 최종 1회 sync.
 * 실시간 sync 충돌 회피.
 */

"use client";

export interface SubmitBarProps {
  isCompleted: boolean;
  onToggleCompleted: (next: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: string[];
  hasUnsavedDraft: boolean;
}

export function SubmitBar({
  isCompleted,
  onToggleCompleted,
  onSubmit,
  isSubmitting,
  errors,
  hasUnsavedDraft,
}: SubmitBarProps) {
  const hasErrors = errors.length > 0;
  return (
    <div className="mt-6">
      {/* 검증 alert — block (단순 안내, 제출 차단 X) */}
      {hasErrors && (
        <div
          className="mb-3 rounded-[12px] px-4 py-3 text-sm"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-warning) 12%, transparent)",
            color: "var(--color-warning)",
          }}
        >
          <p className="mb-1 font-medium">⚠ 확인이 필요한 항목</p>
          <ul className="list-disc pl-5">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* draft 안내 — localStorage 저장 표시 (사용자 안심용) */}
      {hasUnsavedDraft && (
        <p className="mb-2 text-xs text-[var(--color-text-muted)]">
          💾 입력 내용이 브라우저에 임시 저장됩니다 (제출 전까지 유지).
        </p>
      )}

      <div
        className="flex items-center justify-between rounded-[12px] p-4"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* 매치 종료 토글 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => onToggleCompleted(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
            disabled={isSubmitting}
          />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            매치 종료 (status = completed)
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            — 체크 시 라이브/박스스코어/알기자/통산 자동 반영
          </span>
        </label>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-[4px] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {isSubmitting ? "제출 중..." : "제출"}
        </button>
      </div>
    </div>
  );
}
