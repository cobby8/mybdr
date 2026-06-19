/* ============================================================
 * PromoteConfirm — M2 wave2 대기열 "승격 확정" 클라 컴포넌트
 *
 * 왜 이 컴포넌트가 있는가:
 *   대기(status=3) 신청자가 빈자리 발생으로 "승격 안내"(promotion_deadline set)를
 *   받았을 때, 마감 전에 직접 "참가 확정"을 눌러야 자리가 확정된다(자동승인 아님 — DATA-BINDING §3).
 *
 * 핵심 동작:
 *   - 카운트다운: (promotion_deadline - now) / 1000 초. 단 표시용일 뿐이다.
 *     ★타이머가 0에 도달해도 버튼을 비활성화하지 않는다. 확정 가부는 오로지 서버가
 *       promotion_deadline 으로 판정한다(클라 시계 신뢰 금지 — DATA-BINDING §2-2/§5).
 *   - POST /api/web/games/[id]/applications/[appId]/confirm 호출.
 *     · 200 → router.refresh() 로 확정 상태 반영
 *     · 410 → 승격 마감 만료(다음 순번에게 넘어감) 안내
 *     · 409 → 그 사이 정원 다시 마감 안내
 *
 * 디자인: 시안 GameDetail ApplyPanel "promoted" 박제 — accent 톤 안내 박스 +
 *   카운트다운(mono) + btn--primary 풀폭 CTA. var(--*) 토큰만, 하드코딩 색상 금지.
 * ============================================================ */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PromoteConfirmProps {
  /** short UUID 또는 전체 UUID — 라우트 [id] */
  gameId: string;
  /** 내 신청 id (라우트 [appId]) */
  applicationId: string;
  /** 승격 마감 ISO 문자열 — 카운트다운 source */
  promotionDeadline: string;
}

// 남은 초 계산 — 음수는 0으로 클램프(표시용. 만료여도 버튼은 유지)
function secondsLeft(deadlineIso: string): number {
  const diff = new Date(deadlineIso).getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

export function PromoteConfirm({
  gameId,
  applicationId,
  promotionDeadline,
}: PromoteConfirmProps) {
  const router = useRouter();
  const [left, setLeft] = useState<number>(() => secondsLeft(promotionDeadline));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  // 1초마다 남은 시간 갱신 — 0 도달 시 인터벌 정리(버튼은 계속 유지).
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => {
      setLeft(secondsLeft(promotionDeadline));
    }, 1000);
    return () => clearInterval(t);
  }, [left, promotionDeadline]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  async function handleConfirm() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/web/games/${gameId}/applications/${applicationId}/confirm`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json()) as { message?: string; error?: string };
      if (res.ok) {
        // 확정 성공 — 서버 상태(status=1) 반영을 위해 새로고침.
        setMessage({ text: data.message ?? "참가가 확정되었습니다.", type: "success" });
        router.refresh();
      } else if (res.status === 410) {
        // 승격 마감 만료 — 다음 순번에게 넘어감. 화면 상태도 갱신.
        setMessage({
          text: data.error ?? "승격 확정 시간이 만료되었습니다. 다음 순번으로 넘어갑니다.",
          type: "error",
        });
        router.refresh();
      } else if (res.status === 409) {
        // 그 사이 정원이 다시 마감됨.
        setMessage({
          text: data.error ?? "정원이 다시 마감되어 확정할 수 없습니다.",
          type: "error",
        });
        router.refresh();
      } else {
        setMessage({ text: data.error ?? "확정 처리 중 오류가 발생했습니다.", type: "error" });
      }
    } catch {
      setMessage({ text: "네트워크 오류가 발생했습니다.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 🔔 자리가 났어요 안내 박스 — accent 톤 (시안 promoted 박제) */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 6,
          // color-mix 로 accent 10% 틴트 — 하드코딩 hex 금지
          background: "color-mix(in srgb, var(--accent) 10%, transparent)",
          borderLeft: "3px solid var(--accent)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: "var(--accent)",
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          🔔 자리가 났어요
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 6 }}>
          대기 1번 → 마감 전에 참가를 확정하세요.
        </div>
        {/* 카운트다운 — mono 폰트. 0 도달 시 "마감 임박"(표시만, 버튼 유지) */}
        <div style={{ fontSize: 13, color: "var(--accent)" }}>
          {left > 0 ? (
            <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>
              {mm}:{ss} 남음
            </span>
          ) : (
            <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>마감 임박</span>
          )}
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${
            message.type === "success"
              ? "text-[var(--ok)]"
              : "text-[var(--danger)]"
          }`}
          style={{ margin: 0 }}
        >
          {message.text}
        </p>
      )}

      {/* 참가 확정하기 — 타이머 0이어도 비활성화하지 않음(서버가 판정).
       *  loading 중에만 일시 비활성. 풀폭 + 44px 터치(btn--xl 톤). */}
      <Button
        variant="cta"
        className="w-full text-lg py-3"
        onClick={handleConfirm}
        disabled={loading}
      >
        {loading ? "확정 중..." : "🏀 참가 확정하기"}
      </Button>

      <div style={{ fontSize: 11, color: "var(--ink-dim)", textAlign: "center" }}>
        시간 초과 시 다음 순번에게 넘어갑니다.
      </div>
    </div>
  );
}
