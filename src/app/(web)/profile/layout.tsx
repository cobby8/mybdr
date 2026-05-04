import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";

// SEO: 내 프로필 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "내 프로필 | MyBDR",
  description: "내 프로필, 경기 기록, 능력치를 확인하고 관리하세요.",
};

// [2026-05-01 v2.3 마이페이지 hub 시안 정합] ProfileShell 제거.
//   - /profile 루트는 MyPage hub (3-tier 카드) — 자체 layout 보유
//   - /profile/edit, /profile/billing 등 깊은 페이지는 단독 (sidebar 0)
//   - 옛 ProfileShell 의 ProfileSideNav 220px aside 는 v2.3 시안에서 폐기
//
// [2026-05-04 P4 fix] 인증 가드 추가 (보안 강화).
//   왜: /profile/* sub-page 대부분이 "use client" 라 SSR 가드 부재.
//       비로그인 사용자가 /profile/edit, /profile/billing 등 직접 진입 시 빈 페이지 + client API 401 노출.
//       (실제 데이터 노출은 0 — withWebAuth 가 401 — 그러나 UX 가 어색).
//       layout 단일 가드 = sub-page 가드 누락 영구 차단.
//   어떻게: server component 에서 getWebSession() → null 이면 /login?redirect=/profile redirect.
//          /profile 루트 페이지의 자체 비로그인 안내 UI 는 더 이상 도달 불가 — UX 개선 (로그인 페이지로 직행).
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getWebSession();
  if (!session) {
    // 비로그인 → /login + redirect 쿼리 (로그인 후 /profile 으로 복귀)
    redirect("/login?redirect=/profile");
  }
  return <>{children}</>;
}
