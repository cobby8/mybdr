"use client";

import { useEffect, useState } from "react";

/**
 * ForceActionModal — Phase 5 PR15 후속 (UI fix P2-9)
 * ─────────────────────────────────────────────────────────
 * 이유(왜): ghost-candidates-tab 의 window.prompt() / window.alert() 사용을
 *   모바일 디자인 일관성 위해 모달로 교체. window.prompt 는 모바일에서 OS 기본
 *   prompt 가 시안 톤과 어긋나고 placeholder/검증 룰 불가능.
 *
 * 두 모드:
 *  1) "jersey" — 새 등번호 input (0~99 정수, 빈값=미배정) + 사유 textarea (선택)
 *  2) "withdraw" — 사유 textarea (필수, 1자 이상) + 확인 체크박스 패턴
 *
 * 디자인 토큰 — match-jersey-override-modal 패턴 (--color-* 호환 레이어).
 * 모바일 — max-width 460 / padding 16 / iOS 16px input.
 */

type ForceMode = "jersey" | "withdraw";

type Props = {
  open: boolean;
  mode: ForceMode;
  memberLabel: string; // 모달 헤더에 표시 — 닉네임/이름
  busy: boolean;
  onClose: () => void;
  // jersey 모드: newJersey null 가능 (미배정) / withdraw 모드: 사유 필수
  onConfirm: (payload: { newJersey?: number | null; reason: string }) => void;
};

export function ForceActionModal({
  open,
  mode,
  memberLabel,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const [jerseyInput, setJerseyInput] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 열릴 때마다 초기화 — 재오픈 시 클린 상태
  useEffect(() => {
    if (!open) return;
    setJerseyInput("");
    setReasonInput("");
    setError(null);
  }, [open]);

  if (!open) return null;

  function close() {
    if (busy) return; // 처리 중 닫기 방지
    onClose();
  }

  function handleConfirm() {
    setError(null);

    if (mode === "jersey") {
      // 빈 값 = 미배정 (null)
      let newJersey: number | null = null;
      const trimmed = jerseyInput.trim();
      if (trimmed !== "") {
        const n = Number(trimmed);
        if (!Number.isInteger(n) || n < 0 || n > 99) {
          setError("0~99 사이 정수만 입력하세요.");
          return;
        }
        newJersey = n;
      }
      onConfirm({ newJersey, reason: reasonInput.trim() });
      return;
    }

    // withdraw 모드 — 사유 필수
    const reason = reasonInput.trim();
    if (reason.length < 1) {
      setError("사유를 입력해 주세요.");
      return;
    }
    onConfirm({ reason });
  }

  const title = mode === "jersey" ? "강제 등번호 변경" : "강제 탈퇴 처리";
  const confirmLabel = mode === "jersey" ? "변경" : "강제 탈퇴";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="force-action-modal-title"
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          // 디자인 토큰 통일 — 다른 5개 모달 동일 패턴
          background: "var(--color-card)",
          borderRadius: 8,
          padding: 20,
          maxWidth: 460,
          width: "100%",
          border: "1px solid var(--color-border)",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "var(--color-text-primary)",
        }}
      >
        <h2
          id="force-action-modal-title"
          style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--color-text-primary)" }}
        >
          {title}
        </h2>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
          대상:{" "}
          <strong style={{ color: "var(--color-text-primary)" }}>{memberLabel}</strong>
        </p>

        {/* withdraw 모드 — 경고 박스 (danger 톤) */}
        {mode === "withdraw" && (
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-primary)",
              marginBottom: 12,
              padding: "10px 12px",
              background: "color-mix(in srgb, var(--color-error) 8%, transparent)",
              borderRadius: 4,
              borderLeft: "3px solid var(--color-error)",
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: "var(--color-error)" }}>주의:</strong> 강제 탈퇴 후 활동 기록은
            보존되지만 로스터에서 즉시 제외됩니다. 본 작업은 운영자 권한이 필요합니다.
          </div>
        )}

        {/* jersey 모드 — 새 번호 input */}
        {mode === "jersey" && (
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-primary)", display: "block", marginBottom: 4 }}>
              새 등번호 (0~99, 빈값=미배정)
            </span>
            <input
              type="number"
              min={0}
              max={99}
              step={1}
              value={jerseyInput}
              onChange={(e) => setJerseyInput(e.target.value)}
              placeholder="새 번호 또는 비움"
              disabled={busy}
              className="input"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 4,
                border: "1px solid var(--color-border)",
                background: "var(--color-elevated)",
                color: "var(--color-text-primary)",
                // iOS 자동 줌 차단
                fontSize: 16,
              }}
            />
          </label>
        )}

        {/* 사유 textarea — 공통 (jersey=선택, withdraw=필수) */}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-primary)", display: "block", marginBottom: 4 }}>
            사유{" "}
            {mode === "withdraw" ? (
              <span style={{ color: "var(--color-error)" }}>*</span>
            ) : (
              <span style={{ color: "var(--color-text-muted)" }}>(선택)</span>
            )}
          </span>
          <textarea
            maxLength={200}
            rows={3}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder={mode === "withdraw" ? "장기 미활동 처리" : "운영진 강제 변경"}
            disabled={busy}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              color: "var(--color-text-primary)",
              fontSize: 16,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            {reasonInput.trim().length}/200
          </span>
        </label>

        {error && (
          <p
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: "var(--color-error)",
            }}
          >
            {error}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={close}
            disabled={busy}
            className="btn"
            style={{ minWidth: 80 }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className="btn"
            style={{
              minWidth: 100,
              // withdraw=danger / jersey=primary
              background: mode === "withdraw" ? "var(--color-error)" : "var(--color-primary)",
              color: "#fff",
              borderColor: mode === "withdraw" ? "var(--color-error)" : "var(--color-primary)",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "처리 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
