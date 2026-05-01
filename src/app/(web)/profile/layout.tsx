import type { Metadata } from "next";

// SEO: 내 프로필 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "내 프로필 | MyBDR",
  description: "내 프로필, 경기 기록, 능력치를 확인하고 관리하세요.",
};

// [2026-05-01 v2.3 마이페이지 hub 시안 정합] ProfileShell 제거.
//   - /profile 루트는 MyPage hub (3-tier 카드) — 자체 layout 보유
//   - /profile/edit, /profile/billing 등 깊은 페이지는 단독 (sidebar 0)
//   - 옛 ProfileShell 의 ProfileSideNav 220px aside 는 v2.3 시안에서 폐기
// children passthrough 만 — metadata 보존 위해 layout.tsx 유지.
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
