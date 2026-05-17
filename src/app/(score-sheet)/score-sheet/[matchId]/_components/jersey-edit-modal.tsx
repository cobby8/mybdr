/**
 * JerseyEditModal — 매치 시점 임시 등번호 입력/해제 모달.
 *
 * 2026-05-17 (사용자 보고 — 종이기록지 내부 임시번호 부여 UI 박제).
 *
 * 왜 (이유):
 *   score-sheet team-section No. cell 클릭 → 본 모달 open. 운영자가 매치 한정 임시 번호 박제.
 *   기존 동작 (라이브 운영자 모달 = `/admin` 영역) 은 그대로 보존. score-sheet 안에서도
 *   같은 BFF (`/api/web/tournaments/{id}/matches/{matchId}/jersey-override`) 호출 = 단일 source.
 *
 * 방법 (어떻게):
 *   - 입력 1칸 (number 0~99 / FIBA Article 4.4.2 범위)
 *   - 저장 = POST upsert / "해제" = DELETE (기존 임시 번호 있을 때만 활성)
 *   - 저장 직후 onConfirm 콜백 → 부모가 router.refresh() (server SELECT 재호출 = roster 갱신)
 *   - 라이브 페이지는 3초 polling 으로 자동 반영 (route /live/[id] 의 jerseyMap 재계산)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ (위험 액션 = primary 빨강 = "해제" 버튼만 예외 허용)
 *   - 터치 영역 44px+ (input 44px / 버튼 44px)
 *   - 모바일 iOS input font-size 16px+ (자동 줌 방지)
 */

"use client";

import { useEffect, useState } from "react";

interface JerseyEditModalProps {
  /** 모달 표시 여부 — false 면 null 반환 (DOM 미마운트). */
  open: boolean;
  /** 컨텍스트 — 어느 선수 박제 중인지 (UI 헤더 표시). */
  playerName: string;
  /** 현재 등번호 (TTP 원본 또는 기존 임시 번호 — 입력 칸 초기값). null = 미박제. */
  currentJersey: number | null;
  /** 기존 임시 번호 박제 여부 — true 시 "해제" 버튼 활성 (DELETE 호출). */
  hasOverride: boolean;
  /** 저장 콜백 — newJersey 전달. 부모가 POST + router.refresh() 처리. */
  onConfirm: (newJersey: number) => Promise<void>;
  /** 임시 번호 해제 콜백 — 부모가 DELETE + router.refresh() 처리. */
  onRelease: () => Promise<void>;
  /** 취소 (ESC / 외부 클릭 / 취소 버튼). */
  onCancel: () => void;
}

export function JerseyEditModal({
  open,
  playerName,
  currentJersey,
  hasOverride,
  onConfirm,
  onRelease,
  onCancel,
}: JerseyEditModalProps) {
  // 입력 state — 모달 open 시 currentJersey 로 초기화 (사용자가 즉시 수정 가능).
  //   number | "" — 빈 칸 허용 (사용자가 다 지웠을 때 0 강제 회피).
  const [value, setValue] = useState<number | "">(currentJersey ?? "");
  // 저장/해제 진행 중 = 버튼 disabled (중복 클릭 방어).
  const [busy, setBusy] = useState(false);

  // open 토글 시 입력 초기화 (다른 선수 클릭 시 이전 값 잔존 방지).
  useEffect(() => {
    if (open) {
      setValue(currentJersey ?? "");
      setBusy(false);
    }
  }, [open, currentJersey]);

  // ESC 키 = 취소 (foul-type-modal / bench-tech-modal 패턴 일관).
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel, busy]);

  if (!open) return null;

  // 입력 검증 — 0~99 정수 (BFF zod 와 동일 범위 — 사전 차단).
  const isValid =
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 99;
  // 현재 값이 기존 값과 동일 = 저장 의미 없음 (UX 가드).
  const isUnchanged = typeof value === "number" && value === currentJersey;

  async function handleSave() {
    if (!isValid || busy) return;
    setBusy(true);
    try {
      // value 는 위 isValid 가드로 number 보장.
      await onConfirm(value as number);
    } finally {
      setBusy(false);
    }
  }

  async function handleRelease() {
    if (!hasOverride || busy) return;
    setBusy(true);
    try {
      await onRelease();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
      onClick={busy ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="jersey-edit-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-[4px] p-4"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 컨텍스트 (선수명 + 안내) */}
        <div className="mb-3">
          <h2
            id="jersey-edit-modal-title"
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            매치 임시 등번호
          </h2>
          <p
            className="mt-1 text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {playerName}
          </p>
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            * 이 매치 한정 — 다른 매치 / 팀 영구 번호 영향 0.
            {hasOverride && (
              <>
                <br />
                * 현재 임시 번호 박제됨 — 변경 또는 &quot;해제&quot;로 원본 복귀.
              </>
            )}
          </p>
        </div>

        {/* 입력 칸 — number 0~99 */}
        <div className="mb-3">
          <label
            htmlFor="jersey-edit-input"
            className="mb-1 block text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            등번호 (0~99)
          </label>
          <input
            id="jersey-edit-input"
            type="number"
            min={0}
            max={99}
            step={1}
            inputMode="numeric"
            // 모바일 자동 줌 방지 = fontSize 16px+ (iOS 룰)
            className="w-full rounded-[4px] px-3 py-2"
            style={{
              backgroundColor: "var(--color-elevated)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontSize: "16px",
              minHeight: "44px",
              touchAction: "manipulation",
            }}
            value={value === "" ? "" : value}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setValue("");
                return;
              }
              const n = Number.parseInt(raw, 10);
              if (Number.isFinite(n)) {
                // 범위 클램프 (음수 / 100+ 즉시 잘라냄 — UX 친절)
                setValue(Math.max(0, Math.min(99, n)));
              }
            }}
            disabled={busy}
            aria-label={`${playerName} 등번호 입력`}
            autoFocus
          />
          {!isValid && value !== "" && (
            <p
              className="mt-1 text-[11px]"
              style={{ color: "var(--color-warning)" }}
            >
              0~99 사이 정수만 박제 가능합니다.
            </p>
          )}
        </div>

        {/* 버튼 row — 좌: 해제 (있을 때만) / 우: 취소 + 저장 */}
        <div className="flex items-center justify-between gap-2">
          {/* 해제 — 기존 임시 번호 있을 때만 표시 (예외적 빨강 — 위험 액션 강조) */}
          <div>
            {hasOverride && (
              <button
                type="button"
                onClick={handleRelease}
                disabled={busy}
                className="rounded-[4px] px-3 py-2 text-xs font-medium disabled:opacity-50"
                style={{
                  border: "1px solid var(--color-primary)",
                  color: "var(--color-primary)",
                  minHeight: "44px",
                  touchAction: "manipulation",
                }}
                aria-label="임시 번호 해제"
              >
                해제
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-[4px] px-3 py-2 text-xs disabled:opacity-50"
              style={{
                border: "1px solid var(--color-border)",
                color: "var(--color-text-muted)",
                minHeight: "44px",
                touchAction: "manipulation",
              }}
              aria-label="등번호 박제 취소"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isUnchanged || busy}
              className="rounded-[4px] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                minHeight: "44px",
                touchAction: "manipulation",
              }}
              aria-label="등번호 저장"
            >
              {busy ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
