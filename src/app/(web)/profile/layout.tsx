import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";

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
//       layout 단일 가드 = sub-page 가드 누락 영구 차단.
//
// [2026-05-05 fix (옵션 B-PR1)] getAuthUser() 단일 헬퍼 위임.
//   기존 getWebSession + prisma.user.findUnique + NEXT_REDIRECT rethrow 패턴을 단일 헬퍼로 통합.
//   탈퇴/미존재 시 getAuthUser 내부에서 cookies.delete 자동 호출 → 1회 진입으로 영구 cleanup.
//
// 동작:
//   - state==="anonymous" → /login?redirect=/profile (비로그인 + 로그인 후 복귀)
//   - state==="withdrawn" 또는 "missing" → /login?withdrawn=expired (쿠키 자동 cleanup 됨)
//   - state==="active" → 통과
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser();

  // 비로그인 → /login + redirect 쿼리 (로그인 후 /profile 으로 복귀)
  if (auth.state === "anonymous") {
    redirect("/login?redirect=/profile");
  }

  // 탈퇴 회원 / DB 미존재 → /login (쿠키는 getAuthUser 가 이미 자동 삭제)
  if (auth.state === "withdrawn" || auth.state === "missing") {
    redirect("/login?withdrawn=expired");
  }

  // state==="active" 통과
  return <>{children}</>;
}
