import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";

// SEO: 로그인 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "로그인 | MyBDR",
  description: "MyBDR에 로그인하여 경기와 팀을 관리하세요.",
};

// 2026-05-05 fix: 탈퇴 회원 / DB 미존재 회원의 JWT 쿠키 잔존 케이스 가드 보강.
//   본질: 기존 가드는 `if (session) redirect("/")` — JWT 만 검증.
//         탈퇴 회원의 쿠키가 7일 만료 전까지 살아있으면 /login 진입 시 즉시 / 로 redirect.
//         → 사용자 신고: "헤더 로그인 버튼 클릭해도 화면 그대로 — 시도 자체 불가, 쿠키 삭제 후 정상 작동".
//   회귀 패턴: (web)/layout.tsx 는 status 검증 추가했지만 (web)/login/layout.tsx 는 누락.
//   fix: DB user.status 검증 추가 — 정상 회원만 / 로 redirect.
//        탈퇴 회원 / DB 미존재 = login 진입 허용 (다른 계정 로그인 가능 → 쿠키는 새 로그인 시 덮어씀).
//
// 2026-05-05 (옵션 B-PR1): getAuthUser() 단일 헬퍼 위임.
//   기존 직접 getWebSession + prisma.user.findUnique 패턴을 단일 헬퍼로 통합.
//   탈퇴/미존재 시 getAuthUser 내부에서 cookies.delete 자동 호출 → 1회 진입으로 영구 cleanup.
export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUser();
  // 정상 회원 (state==="active") 만 / 로 redirect.
  // anonymous / withdrawn / missing = login 페이지 노출 (다른 계정 로그인 가능).
  if (auth.state === "active") {
    redirect("/");
  }
  return children;
}
