"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * TeamJoinButtonV2
 * ─────────────────────────────────────────────────────────
 * 이유(왜): Phase 3 v2 재구성(`1d53893`)에서 기존 가입 신청 UI가 누락되었다.
 * v2 시안의 사이드 카드 1번 카드 상단 CTA(시안의 "게스트 지원" 자리)에
 * 실제 동작하는 "팀 가입 신청"을 복원한다.
 *
 * PR2 (2026-05-05): 가입 신청 시 선호 등번호/포지션 입력 모달 추가.
 *   사용 중 jersey 미리 표시 + 충돌 회피 안내. 승인 단계에서 자동 복사.
 *
 * 방법(어떻게):
 * - 멤버십/신청 상태는 서버 컴포넌트(page.tsx)에서 계산해 props로 받는다.
 * - 미신청 상태에서 클릭 시 모달 열림 → jersey/position 입력 → POST /api/web/teams/:id/join
 * - 모달 열릴 때 GET /api/web/teams/:id/jerseys-in-use 로 사용 중 번호 미리 조회
 * - 비로그인이면 즉시 /login 으로 보냄 (API가 401 반환하기 전에 UX 단축).
 * - 성공 시 신청 상태로 토글하고 router.refresh()로 서버 상태 동기화.
 *
 * 표시 우선순위:
 * 1) 비멤버 + 미신청 → "팀 가입 신청" (활성, 모달)
 * 2) 비멤버 + pending → "신청 완료" (disabled)
 * 3) 멤버 → 렌더 안 함 (page.tsx에서 미렌더 분기)
 */

type Props = {
  teamId: string;
  isLoggedIn: boolean;
  hasPendingRequest: boolean; // 이미 신청한 상태(pending) 여부
};

export function TeamJoinButtonV2({ teamId, isLoggedIn, hasPendingRequest }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // 클라이언트 측 즉시 반영(낙관적 업데이트). 서버 응답 후 router.refresh로 동기화.
  const [pending, setPending] = useState(hasPendingRequest);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // 모달 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [jerseyInput, setJerseyInput] = useState<string>(""); // string 으로 다뤄 빈값/문자 안전
  const [positionInput, setPositionInput] = useState<string>("");
  const [jerseysInUse, setJerseysInUse] = useState<number[] | null>(null);
  const [loadingJerseys, setLoadingJerseys] = useState(false);

  // 모달 열기 — 사용 중 jersey 조회 트리거
  async function openModal() {
    if (!isLoggedIn) {
      router.push(`/login?returnTo=/teams/${teamId}`);
      return;
    }
    setModalOpen(true);
    setMessage(null);
    setLoadingJerseys(true);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/jerseys-in-use`);
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json?.data?.jerseys)) {
        setJerseysInUse(json.data.jerseys as number[]);
      } else {
        setJerseysInUse([]);
      }
    } catch {
      setJerseysInUse([]);
    } finally {
      setLoadingJerseys(false);
    }
  }

  function closeModal() {
    if (loading) return; // 신청 중 닫기 방지
    setModalOpen(false);
    setJerseyInput("");
    setPositionInput("");
    setMessage(null);
  }

  // 신청 제출
  async function handleSubmit() {
    setLoading(true);
    setMessage(null);

    // jersey 입력 검증
    let preferredJersey: number | null = null;
    if (jerseyInput.trim() !== "") {
      const n = Number(jerseyInput);
      if (!Number.isInteger(n) || n < 0 || n > 99) {
        setMessage({ text: "등번호는 0~99 사이 정수만 입력 가능합니다.", type: "error" });
        setLoading(false);
        return;
      }
      // 충돌 사전 안내 (서버에서도 승인 단계에서 차단)
      if (jerseysInUse?.includes(n)) {
        setMessage({
          text: `등번호 #${n} 는 이미 사용 중입니다. 다른 번호로 신청하거나 비워둔 채 신청해 주세요.`,
          type: "error",
        });
        setLoading(false);
        return;
      }
      preferredJersey = n;
    }

    try {
      const res = await fetch(`/api/web/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_jersey_number: preferredJersey,
          preferred_position: positionInput.trim() || null,
        }),
      });
      // apiSuccess/apiError는 envelope 구조. 메시지는 data 또는 error 키에 위치.
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        const text =
          json?.data?.message ??
          json?.message ??
          "가입 신청이 완료되었습니다.";
        setMessage({ text, type: "success" });
        setPending(true);
        setModalOpen(false);
        // 서버 컴포넌트(멤버수/멤버십)도 갱신
        router.refresh();
      } else {
        const err = json?.error ?? json?.message ?? "오류가 발생했습니다.";
        setMessage({ text: err, type: "error" });
        // 409 "이미 신청한 팀" 응답이면 pending 상태로 동기화
        if (res.status === 409 && /이미 가입 신청|이미 팀 멤버/.test(err)) {
          setPending(true);
          setModalOpen(false);
        }
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  // 신청 완료 상태: disabled 폼으로 회색 표시 (시안의 disabled 패턴 일치)
  if (pending) {
    return (
      <div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="btn btn--xl"
          style={{
            width: "100%",
            marginBottom: 8,
            opacity: 0.65,
            cursor: "not-allowed",
          }}
        >
          신청 완료 (승인 대기)
        </button>
        {message && (
          <p
            style={{
              fontSize: 12,
              marginTop: 6,
              color: message.type === "success" ? "var(--ok)" : "var(--danger)",
            }}
          >
            {message.text}
          </p>
        )}
      </div>
    );
  }

  // 활성 상태: primary CTA (시안의 "게스트 지원" 시각 위치)
  return (
    <div>
      <button
        type="button"
        onClick={openModal}
        disabled={loading}
        className="btn btn--primary btn--xl"
        style={{
          width: "100%",
          marginBottom: 8,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        팀 가입 신청
      </button>
      {message && !modalOpen && (
        <p
          style={{
            fontSize: 12,
            marginTop: 6,
            color: message.type === "success" ? "var(--ok)" : "var(--danger)",
          }}
        >
          {message.text}
        </p>
      )}

      {/* 가입 신청 모달 */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="join-modal-title"
          onClick={closeModal}
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
            }}
          >
            <h2
              id="join-modal-title"
              style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "var(--ink)" }}
            >
              팀 가입 신청
            </h2>

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
                    {jerseysInUse.map((n) => `#${n}`).join(", ")}
                  </span>
                </span>
              ) : (
                <span>아직 사용 중인 등번호가 없습니다.</span>
              )}
            </div>

            {/* Jersey input */}
            <label style={{ display: "block", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                선호 등번호 (선택, 0~99)
              </span>
              <input
                type="number"
                min={0}
                max={99}
                step={1}
                value={jerseyInput}
                onChange={(e) => setJerseyInput(e.target.value)}
                placeholder="비워두면 추후 배정"
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

            {/* Position input */}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: "var(--ink)", display: "block", marginBottom: 4 }}>
                선호 포지션 (선택)
              </span>
              <input
                type="text"
                maxLength={20}
                value={positionInput}
                onChange={(e) => setPositionInput(e.target.value)}
                placeholder="PG / SG / SF / PF / C 등"
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

            {/* 에러/안내 메시지 */}
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
                onClick={closeModal}
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
      )}
    </div>
  );
}
