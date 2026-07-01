"use client";

import { useEffect } from "react";
import Link from "next/link";

/* ProfileIncompleteBanner — 프로필 미완성 안내 배너
 * DS v4 토큰: var(--warn) / var(--primary) / var(--primary-deep) / color-mix()
 * 하드코딩 색상 없음. 인라인 style 표준 (BDR v2 컨벤션).
 */
export function ProfileIncompleteBanner() {
  // 페이지 로드 시 fire-and-forget으로 reminder 기록
  useEffect(() => {
    fetch("/api/web/me/profile-reminder", { method: "PATCH" }).catch(() => {});
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 12,
        background: "color-mix(in srgb, var(--warn) 8%, transparent)",
        padding: "12px 16px",
        border: "1px solid color-mix(in srgb, var(--warn) 25%, transparent)",
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 14, color: "var(--warn)", margin: 0 }}>
        🔔 프로필을 완성하면 경기 신청이 더 편리해요.
      </p>
      <Link
        href="/profile/edit"
        style={{
          flexShrink: 0,
          borderRadius: 8,
          background: "var(--primary)",
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          // DS v4: primary(브랜드) 버튼 배경 위 흰 전경색 → ink-on-brand
          color: "var(--ink-on-brand)",
          textDecoration: "none",
          minHeight: 32,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        지금 완성하기
      </Link>
    </div>
  );
}
