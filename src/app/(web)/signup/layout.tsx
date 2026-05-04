import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";

// SEO: 회원가입 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "회원가입 | MyBDR",
  description: "MyBDR에 가입하고 농구 매칭 서비스를 이용하세요.",
};

// 2026-05-05 fix (옵션 A-1): signup layout 가드 누락 보완 — login/layout 패턴 대칭 적용.
//   본질: signup 은 가드 0 (metadata 만) — 이미 로그인된 정상 회원이 /signup 진입 시
//         헤더는 기존 사용자 닉네임 + 본문은 가입 폼 노출 = 혼란 UX.
//   회귀 패턴: errors.md 2026-05-05 "layout 가드 status 검증 누락" 본질 동일.
//             "인증 가드 5개소 일괄 점검" 룰의 누락 1개소 = signup.
//   fix: 정상 회원 (status==="active") 만 / 로 redirect, 탈퇴/미존재 = signup 노출.
//        → 탈퇴 회원이 다른 계정 가입 시 가능 (signupAction 시작부 cookies.delete 와 무모순).
//
// (login/layout 과 대칭 — fa5bd90 패턴 동일 적용)
export default async function SignupLayout({ children }: { children: React.ReactNode }) {
  const session = await getWebSession();
  if (session) {
    // 정상 회원만 redirect — 그 외는 signup 페이지 노출.
    let isActiveUser = false;
    try {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(session.sub) },
        select: { status: true },
      });
      // user 존재 + status !== "withdrawn" = 정상 회원
      isActiveUser = !!user && user.status !== "withdrawn";
    } catch {
      // DB 실패 = 안전하게 signup 노출 (사용자 차단 ❌)
      isActiveUser = false;
    }
    if (isActiveUser) {
      redirect("/");
    }
  }
  return children;
}
