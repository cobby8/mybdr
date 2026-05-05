"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * JerseyChangeRequestModal
 * ─────────────────────────────────────────────────────────
 * 이유(왜): Phase 2 PR7 — 본인 등번호 변경 신청 흐름. 팀 페이지 로스터에서
 *   본인 row 옆 "번호 변경" 버튼 클릭 → 모달 진입 → 신청 → 팀장 승인 대기.
 *
 * UX 패턴 (PR2 의 team-join-button-v2 모달과 동일):
 *  - 진입 시 GET /api/web/teams/:id/jerseys-in-use 로 사용 중 번호 미리 표시
 *  - 새 번호 0~99 input
 *  - 사유 textarea (선택, 100자 이내 — PR6 zod 는 500 허용하지만 UX 단순화)
 *  - 신청 버튼 → POST /api/web/teams/:id/requests
 *    body: { requestType: "jersey_change", payload: { newJersey }, reason? }
 *  - 성공 시 "팀장 승인 대기 중" 토스트 + onSuccess 콜백
 *
 * 모바일 호환: 기존 모달 패턴 (position fixed + clickOutside close + max-width 420)
 */

type Props = {
  teamId: string;
  currentJersey: number | null; // 본인 현재 등번호 (null = 미배정)
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // 성공 시 부모가 pending 상태 갱신용 콜백
};

export function JerseyChangeRequestModal({
  teamId,
  currentJersey,
  open,
  onClose,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jerseyInput, setJerseyInput] = useState<string>("");
  const [reasonInput, setReasonInput] = useState<string>("");
  const [jerseysInUse, setJerseysInUse] = useState<number[] | null>(null);
  const [loadingJerseys, setLoadingJerseys] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 모달 열림 시 사용 중 jersey 조회 (PR2 jerseys-in-use API 재사용)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingJerseys(true);
    setMessage(null);
    setJerseyInput("");
    setReasonInput("");
    (async () => {
      try {
        const res = await fetch(`/api/web/teams/${teamId}/jerseys-in-use`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(json?.data?.jerseys)) {
          setJerseysInUse(json.data.jerseys as number[]);
        } else {
          setJerseysInUse([]);
        }
      } catch {
        if (!cancelled) setJerseysInUse([]);
      } finally {
        if (!cancelled) setLoadingJerseys(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, teamId]);

  function close() {
    if (loading) return; // 신청 중 닫기 방지
    onClose();
  }

  // 신청 제출 — POST /api/web/teams/:id/requests
  async function handleSubmit() {
    setMessage(null);

    // 새 번호 검증
    const trimmed = jerseyInput.trim();
    if (trimmed === "") {
      setMessage({ text: "새 등번호를 입력해 주세요.", type: "error" });
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n < 0 || n > 99) {
      setMessage({ text: "등번호는 0~99 사이 정수만 입력할 수 있습니다.", type: "error" });
      return;
    }
    // 본인 현재 번호와 같으면 의미 없는 신청
    if (currentJersey !== null && n === currentJersey) {
      setMessage({ text: "현재 번호와 동일합니다.", type: "error" });
      return;
    }
    // 사전 충돌 안내 (서버에서도 재검증)
    if (jerseysInUse?.includes(n)) {
      setMessage({
        text: `등번호 #${n} 는 이미 사용 중입니다. 다른 번호를 선택해 주세요.`,
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const reason = reasonInput.trim();
      const res = await fetch(`/api/web/teams/${teamId}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "jersey_change",
          payload: { newJersey: n },
          ...(reason ? { reason } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({
          text: "번호 변경 신청이 완료됐습니다. 팀장 승인을 기다려 주세요.",
          type: "success",
        });
        onSuccess();
        // 짧은 지연 후 모달 닫기 + 페이지 갱신 (서버 컴포넌트 재계산)
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
      aria-labelledby="jersey-change-modal-title"
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
          maxWidth: 420,
          width: "100%",
          border: "1px solid var(--border)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          id="jersey-change-modal-title"
          style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: "var(--ink)" }}
        >
          등번호 변경 신청
        </h2>
        {/* 현재 번호 안내 — 본인 컨텍스트 인지 */}
        <p style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>
          현재 등번호:{" "}
          <span style={{ color: "var(--ink)", fontWeight: 600 }}>
            {currentJersey !== null ? `#${currentJersey}` : "미배정"}
          </span>
        </p>

        {/* 사용 중 등번호 안내 */}
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-mute)",
            marginBottom: 12,
            padding: "8px 10px",
            background: "var(--surface-2, var(--bg))",
            borderRadius: 4,
            minHeight: 32,
          }}
        >
          {loadingJerseys ? (
            <span>사용 중 등번호 확인 중...</span>
          ) : jerseysInUse && jerseysInUse.length > 0 ? (
            <span>
              팀 내 사용 중 번호:{" "}
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                {jerseysInUse.map((j) => `#${j}`).join(", ")}
              </span>
            </span>
          ) : (
            <span>사용 중인 등번호가 없습니다.</span>
          )}
        </div>

        {/* 새 번호 input */}
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
            새 등번호 (0~99) <span style={{ color: "var(--danger)" }}>*</span>
          </span>
          <input
            type="number"
            min={0}
            max={99}
            step={1}
            value={jerseyInput}
            onChange={(e) => setJerseyInput(e.target.value)}
            placeholder="새로 사용할 번호"
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
        </label>

        {/* 사유 textarea — 선택, 100자 */}
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
            사유 (선택, 100자 이내)
          </span>
          <textarea
            maxLength={100}
            rows={3}
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="예) 좋아하는 선수 번호로 변경"
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

        {/* 메시지 */}
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

        {/* 버튼 */}
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
            style={{ minWidth: 80, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "신청 중..." : "신청"}
          </button>
        </div>
      </div>
    </div>
  );
}
