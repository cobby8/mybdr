"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * TeamFollowButtonV2
 * ─────────────────────────────────────────────────────────
 * Phase 10-4 — 팀 팔로우 토글 버튼 (Hero 우측 CTA 1번 자리)
 *
 * 이유(왜): 시안의 "팔로우" 버튼은 Hero 우측 CTA 자리. 클릭 시 즉시 토글 UX가 필요해
 * 낙관적 업데이트(setFollowing) 후 API 호출, 실패 시 롤백.
 *
 * 방법(어떻게):
 * - props.initialFollowing: SSR 에서 미리 계산해 깜빡임 제거
 * - 비로그인이면 /login?returnTo=/teams/:id 로 보냄
 * - POST /api/web/teams/:id/follow → followed:true
 * - DELETE /api/web/teams/:id/follow → followed:false
 *
 * 표시:
 * - following=false → "팔로우" (active CTA, 흰 반투명 배경)
 * - following=true  → "팔로우 중" (선택된 상태, 좀 더 진한 배경)
 */

type Props = {
  teamId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
  ink: string; // accent 위 텍스트색
};

export function TeamFollowButtonV2({
  teamId,
  initialFollowing,
  isLoggedIn,
  ink,
}: Props) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    // 비로그인 → /login 으로 안내 (returnTo 부착)
    if (!isLoggedIn) {
      router.push(`/login?returnTo=/teams/${teamId}`);
      return;
    }
    if (loading) return;

    // 낙관적 토글 — 실패 시 롤백
    const prev = following;
    const next = !prev;
    setFollowing(next);
    setLoading(true);

    try {
      const res = await fetch(`/api/web/teams/${teamId}/follow`, {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        // 409(이미 팔로우 중) 는 결과적으로 next=true 와 동일하므로 유지
        if (next && res.status === 409) {
          // already following — keep next=true
        } else {
          // 그 외 에러는 롤백
          setFollowing(prev);
        }
      } else {
        // 서버 상태 동기화 (팔로워 수 등은 후속 작업이지만 미래 대비)
        router.refresh();
      }
    } catch {
      setFollowing(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={following}
      className="btn"
      style={{
        // 팔로우 중일 때는 좀 더 진한 배경으로 토글 상태 시각화
        background: following ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.16)",
        color: ink,
        borderColor: "rgba(255,255,255,0.35)",
        opacity: loading ? 0.7 : 1,
        cursor: loading ? "wait" : "pointer",
      }}
    >
      <span className="material-symbols-outlined text-base">
        {following ? "favorite" : "favorite_border"}
      </span>
      <span className="ml-1.5">{following ? "팔로우 중" : "팔로우"}</span>
    </button>
  );
}
