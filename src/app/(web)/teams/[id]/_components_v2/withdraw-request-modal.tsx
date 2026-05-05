"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * WithdrawRequestModal — Phase 2 PR9
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 본인 탈퇴 신청 흐름. 팀 페이지 로스터 본인 row 의 액션 메뉴에서
 *   "탈퇴 신청" 클릭 → 모달 진입 → POST /api/web/teams/:id/requests
 *   (requestType='withdraw', payload={}, reason — 5자 이상 필수).
 * 승인 시 team_members.status='withdrawn' UPDATE — 명단 자동 제외 + history 영구 보존
 *   (활동 기록 유지). 재가입은 별도 가입 신청 흐름.
 *
 * UX:
 *  - 경고 박스 (강조 톤): "탈퇴 후 팀 활동 기록은 보존되며 명단에서 제외됩니다.
 *    재가입은 별도 신청 필요."
 *  - 사유 textarea (필수, 5자 이상, 200자 이내)
 *  - "탈퇴 신청" 버튼 (danger 색)
 *
 * 모바일 호환: position fixed + clickOutside close + max-width 460
 */

type Props = {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const REASON_MIN = 5;
const REASON_MAX = 200;

export function WithdrawRequestModal({ teamId, open, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reasonInput, setReasonInput] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!open) return;
    setReasonInput("");
    setMessage(null);
  }, [open]);

  function close() {
    if (loading) return;
    onClose();
  }

  async function handleSubmit() {
    setMessage(null);

    const reason = reasonInput.trim();
    // 사유 필수 (탈퇴는 신중한 결정 — 사유 5자 이상)
    if (reason.length < REASON_MIN) {
      setMessage({ text: `사유를 ${REASON_MIN}자 이상 입력해 주세요.`, type: "error" });
      return;
    }
    if (reason.length > REASON_MAX) {
      setMessage({ text: `사유는 ${REASON_MAX}자 이내로 입력해 주세요.`, type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "withdraw",
          payload: {}, // withdraw 는 payload 빈 객체 (서버 zod strict)
          reason,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          text: "탈퇴 신청이 완료됐습니다. 팀장 승인을 기다려 주세요.",
          type: "success",
        });
        onSuccess();
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 800);
      } else {
        const err = json?.error ?? json?.message ?? "오류가 발생했습니다.";
        setMessage({ text: err, type: "error" });
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const reasonLen = reasonInput.trim().length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-request-modal-title"
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
          // 디자인 토큰 통일 — match-jersey-override-modal 패턴 (--color-* 호환 레이어)
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
          id="withdraw-request-modal-title"
          style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--color-text-primary)" }}
        >
          탈퇴 신청
        </h2>
        <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 12 }}>
          팀장 승인 후 팀 명단에서 제외됩니다.
        </p>

        {/* 경고 박스 — danger 톤 (--color-error 사용) */}
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
          <strong style={{ color: "var(--color-error)" }}>주의:</strong> 탈퇴 후 팀 활동 기록은
          보존되지만 로스터/관리 권한에서 제외됩니다. 재가입은 별도 가입 신청이 필요합니다.
        </div>

        {/* 사유 textarea — 필수 / placeholder 5단어 이내 + "예) " 제거 */}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-primary)", display: "block", marginBottom: 4 }}>
            탈퇴 사유 <span style={{ color: "var(--color-error)" }}>* (5자 이상 필수)</span>
          </span>
          <textarea
            maxLength={REASON_MAX}
            rows={4}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="개인 사정으로 활동 중단"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--color-border)",
              background: "var(--color-elevated)",
              color: "var(--color-text-primary)",
              // iOS 자동 줌 차단
              fontSize: 16,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: reasonLen < REASON_MIN ? "var(--color-error)" : "var(--color-text-muted)",
            }}
          >
            {reasonLen}/{REASON_MAX} (최소 {REASON_MIN}자)
          </span>
        </label>

        {message && (
          <p
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: message.type === "success" ? "var(--color-success)" : "var(--color-error)",
            }}
          >
            {message.text}
          </p>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="btn"
            style={{ minWidth: 80 }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || reasonLen < REASON_MIN}
            className="btn"
            style={{
              minWidth: 100,
              background: "var(--color-error)",
              color: "#fff",
              borderColor: "var(--color-error)",
              opacity: loading || reasonLen < REASON_MIN ? 0.6 : 1,
            }}
          >
            {loading ? "신청 중..." : "탈퇴 신청"}
          </button>
        </div>
      </div>
    </div>
  );
}
