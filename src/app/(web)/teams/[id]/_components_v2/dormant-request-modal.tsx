"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * DormantRequestModal — Phase 2 PR8
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 본인 휴면 신청 흐름. 팀 페이지 로스터 본인 row 의 액션 메뉴에서
 *   "휴면 신청" 클릭 → 모달 진입 → POST /api/web/teams/:id/requests
 *   (requestType='dormant', payload={until: ISO}, reason?).
 * 휴면 만료 (until < now) 시 lazy hook (`checkAndExpireDormant`) 이 본인 SSR 시점에
 *   자동으로 active 복귀 — 사용자 별도 액션 X.
 *
 * UX 패턴 (jersey 모달 차용):
 *  - until: date input (기본값 +3개월, 최소 +7일, 최대 +12개월)
 *  - 사유 textarea (선택, 100자)
 *  - 안내 박스: "휴면 기간 동안 본인은 로스터에 '휴면' 뱃지로 표시되며 자동 복귀됩니다."
 *  - 신청 버튼 → POST → 성공 시 800ms 토스트 후 닫기 + router.refresh
 *
 * 모바일 호환: position fixed + clickOutside close + max-width 460
 */

type Props = {
  teamId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // 성공 시 부모 pending 상태 갱신 콜백
};

// 기본/제약 값 — 사용자 입력 친화 + 운영 안전
function isoDate(d: Date): string {
  // 날짜 input 호환 — yyyy-MM-dd
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultUntilDate(): string {
  // 기본값 = 오늘 +3개월
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return isoDate(d);
}

function minUntilDate(): string {
  // 최소 = 오늘 +7일 (너무 짧은 휴면 차단)
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return isoDate(d);
}

function maxUntilDate(): string {
  // 최대 = 오늘 +12개월
  const d = new Date();
  d.setMonth(d.getMonth() + 12);
  return isoDate(d);
}

export function DormantRequestModal({ teamId, open, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [untilInput, setUntilInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 모달 열림 시 초기화 — 기본값 +3개월 자동 채움
  useEffect(() => {
    if (!open) return;
    setUntilInput(defaultUntilDate());
    setReasonInput("");
    setMessage(null);
  }, [open]);

  function close() {
    if (loading) return; // 신청 중 닫기 방지
    onClose();
  }

  async function handleSubmit() {
    setMessage(null);

    // until 검증 — 빈값/형식/범위
    const trimmed = untilInput.trim();
    if (!trimmed) {
      setMessage({ text: "복귀 예정일을 선택해 주세요.", type: "error" });
      return;
    }
    const untilD = new Date(trimmed);
    if (Number.isNaN(untilD.getTime())) {
      setMessage({ text: "날짜 형식이 올바르지 않습니다.", type: "error" });
      return;
    }
    const minD = new Date(minUntilDate());
    const maxD = new Date(maxUntilDate());
    if (untilD.getTime() < minD.getTime()) {
      setMessage({ text: "복귀 예정일은 오늘로부터 최소 7일 이후여야 합니다.", type: "error" });
      return;
    }
    if (untilD.getTime() > maxD.getTime()) {
      setMessage({ text: "복귀 예정일은 오늘로부터 최대 12개월 이내여야 합니다.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const reason = reasonInput.trim();
      const res = await fetch(`/api/web/teams/${teamId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "dormant",
          // 서버 zod 가 ISO datetime 또는 date 모두 허용 → date 문자열 그대로 전송
          payload: { until: trimmed },
          ...(reason ? { reason } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          text: "휴면 신청이 완료됐습니다. 팀장 승인을 기다려 주세요.",
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dormant-request-modal-title"
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
          background: "var(--surface)",
          borderRadius: 8,
          padding: 20,
          maxWidth: 460,
          width: "100%",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          id="dormant-request-modal-title"
          style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--ink)" }}
        >
          휴면 신청
        </h2>
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          승인 시 로스터에 <strong style={{ color: "var(--ink)" }}>휴면</strong> 뱃지로 표시됩니다.
        </p>

        {/* 안내 박스 — 자동 복귀 설명 */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            marginBottom: 12,
            padding: "10px 12px",
            background: "var(--surface-2, var(--bg))",
            borderRadius: 4,
            borderLeft: "3px solid var(--info, #0079B9)",
            lineHeight: 1.55,
          }}
        >
          복귀 예정일이 지나면 다음 접속 시 <strong style={{ color: "var(--ink)" }}>자동으로 활동
          상태로 복귀</strong>합니다. 별도 신청은 필요 없습니다.
        </div>

        {/* until date */}
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
            복귀 예정일 <span style={{ color: "var(--danger)" }}>*</span>
          </span>
          <input
            type="date"
            min={minUntilDate()}
            max={maxUntilDate()}
            value={untilInput}
            onChange={(e) => setUntilInput(e.target.value)}
            disabled={loading}
            className="input"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--ink)",
              fontSize: 14,
            }}
          />
          <span style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2, display: "block" }}>
            최소 7일 이후 ~ 최대 12개월 이내
          </span>
        </label>

        {/* 사유 textarea */}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
            사유 (선택, 100자 이내)
          </span>
          <textarea
            maxLength={100}
            rows={3}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="예) 군 입대 / 부상 회복 / 학업"
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--ink)",
              fontSize: 13,
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>
            {reasonInput.trim().length}/100
          </span>
        </label>

        {message && (
          <p
            style={{
              fontSize: 12,
              marginBottom: 12,
              color: message.type === "success" ? "var(--ok)" : "var(--danger)",
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
            disabled={loading}
            className="btn btn--primary"
            style={{ minWidth: 100, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "신청 중..." : "휴면 신청"}
          </button>
        </div>
      </div>
    </div>
  );
}
