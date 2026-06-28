"use client";

// ============================================================
// referee-console/_logout-button.tsx — 심판 콘솔 셸 푸터 로그아웃 (자기완결)
//   partner/operate _logout-button 과 동일 동작. 콘솔 간 결합 회피 위해 별도 복제.
//   POST /api/web/logout → "/" full reload (layout SSR 재실행 → 로그인 진입).
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
