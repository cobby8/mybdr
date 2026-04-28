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
 * 방법(어떻게):
 * - 멤버십/신청 상태는 서버 컴포넌트(page.tsx)에서 계산해 props로 받는다.
 * - 미신청 상태에서만 활성 버튼. 클릭 시 POST /api/web/teams/:id/join.
 * - 비로그인이면 즉시 /login 으로 보냄 (API가 401 반환하기 전에 UX 단축).
 * - 성공 시 신청 상태로 토글하고 router.refresh()로 서버 상태 동기화.
 *
 * API 스펙(현재 /api/web/teams/[id]/join/route.ts):
 * - body 없음. 자동 수락 팀이면 즉시 멤버, 아니면 pending 신청 생성.
 *
 * 표시 우선순위:
 * 1) 비멤버 + 미신청 → "팀 가입 신청" (활성)
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

  // 핸들러: 비로그인이면 /login, 아니면 가입 신청 API 호출
  async function handleClick() {
    if (!isLoggedIn) {
      // 로그인 후 돌아올 수 있게 returnTo 쿼리 부착
      router.push(`/login?returnTo=/teams/${teamId}`);
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/web/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        // 서버 컴포넌트(멤버수/멤버십)도 갱신
        router.refresh();
      } else {
        const err = json?.error ?? json?.message ?? "오류가 발생했습니다.";
        setMessage({ text: err, type: "error" });
        // 409 "이미 신청한 팀" 응답이면 pending 상태로 동기화
        if (res.status === 409) setPending(true);
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
        onClick={handleClick}
        disabled={loading}
        className="btn btn--primary btn--xl"
        style={{
          width: "100%",
          marginBottom: 8,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "신청 중..." : "팀 가입 신청"}
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
