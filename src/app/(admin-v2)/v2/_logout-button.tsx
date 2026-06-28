"use client";

// ============================================================
// _logout-button.tsx — admin-v2 셸 푸터 로그아웃 (자기완결)
//   POST /api/web/logout → window.location.href="/" full reload.
//   레거시(components/admin-toss) Icon 미사용 — admin-v2 kit Icon 만.
//   (logout 은 auth 액션 — "raw fetch 0" 룰은 데이터 fetch 대상)
// ============================================================

import React from "react";
import { Btn } from "@/components/admin-v2";

export function LogoutButton() {
  const [loading, setLoading] = React.useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/web/logout", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // full reload — layout SSR 재실행 → 쿠키 삭제 인식 → /login 진입
      window.location.href = "/";
    } catch {
      setLoading(false);
      alert("로그아웃에 실패했습니다. 새로고침 후 다시 시도해주세요.");
    }
  }

  return (
    <Btn
      variant="ghost"
      size="sm"
      block
      icon="log-out"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </Btn>
  );
}
