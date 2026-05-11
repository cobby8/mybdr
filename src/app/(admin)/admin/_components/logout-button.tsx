"use client";

/**
 * Admin 로그아웃 버튼 — POST /api/web/logout + full reload to "/".
 *
 * 2026-05-11 — admin 마이페이지 Phase 1 (사용자 결재 §3).
 *
 * 이유 (왜):
 *   - admin 영역에 자체 로그아웃 진입점 0 — 현재 "사이트로 돌아가기" → (web) 마이페이지 →
 *     로그아웃 (3 hop). 1 hop 으로 단축.
 *   - 5/5 errors.md fix 패턴: cookies().set 만으로는 일부 케이스 Set-Cookie 헤더 미반영 →
 *     /api/web/logout 가 NextResponse.cookies.set 으로 명시 응답 (이미 박제됨).
 *     클라이언트는 `window.location.href = "/"` full reload 필수 — layout SSR 재실행 →
 *     쿠키 삭제 인식 → 로그인 페이지 진입 가능.
 *
 * 어떻게:
 *   1. fetch POST → 응답 200 확인.
 *   2. window.location.href = "/" — full reload (router.push 안 됨, SSR layout 재실행 필요).
 *   3. 로딩 중 disabled + "로그아웃 중..." 표시.
 *   4. 에러 시 alert + 버튼 복원.
 *
 * 사용:
 *   - 우상단 UserMenu 드롭다운 안
 *   - 모바일 드로어 상단 사용자 카드
 *   - 마이페이지 자체 (선택)
 */

import { useState } from "react";

export interface LogoutButtonProps {
  // 버튼 스타일 variant — 드롭다운 항목 / 드로어 카드 / 단독 버튼
  variant?: "menu-item" | "drawer-card" | "standalone";
  // 클릭 후 닫기 콜백 (드롭다운 / 드로어 닫기) — 선택
  onBeforeLogout?: () => void;
}

export function LogoutButton({
  variant = "menu-item",
  onBeforeLogout,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);

  // 로그아웃 처리 핸들러
  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    onBeforeLogout?.(); // 드롭다운/드로어 사전 닫기 (UX — 사용자 피드백 즉시)
    try {
      const res = await fetch("/api/web/logout", { method: "POST" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      // full reload — layout SSR 재실행 → 쿠키 삭제 인식 → /login 자동 진입
      // 사유: router.push("/") 는 클라이언트 라우팅 → layout SSR 미재실행 → 헤더 stale.
      window.location.href = "/";
    } catch {
      setLoading(false);
      // 사용자 친화 안내 — 실패 시 새로고침 유도
      alert("로그아웃에 실패했습니다. 새로고침 후 다시 시도해주세요.");
    }
  }

  // variant 별 className — 디자인 토큰만 사용 (var(--*))
  // menu-item: 드롭다운 안 (왼쪽 정렬, padding 작음)
  // drawer-card: 드로어 안 (전폭, padding 큼)
  // standalone: 단독 버튼 (border + bg)
  let className = "";
  if (variant === "menu-item") {
    className =
      "flex w-full items-center gap-2 px-4 py-2 text-sm text-left transition-colors hover:bg-[var(--color-elevated)] disabled:opacity-50 disabled:cursor-not-allowed";
  } else if (variant === "drawer-card") {
    className =
      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-[var(--color-elevated)] disabled:opacity-50 disabled:cursor-not-allowed";
  } else {
    className =
      "inline-flex items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-elevated)] disabled:opacity-50 disabled:cursor-not-allowed";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={className}
      style={{ color: "var(--color-text-primary)" }}
    >
      {/* Material Symbols Outlined — lucide-react 금지 (디자인 룰) */}
      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
        logout
      </span>
      <span>{loading ? "로그아웃 중..." : "로그아웃"}</span>
    </button>
  );
}
