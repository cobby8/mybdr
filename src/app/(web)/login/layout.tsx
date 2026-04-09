import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";

// SEO: 로그인 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "로그인 | MyBDR",
  description: "MyBDR에 로그인하여 경기와 팀을 관리하세요.",
};

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // 이미 로그인된 상태면 홈으로 redirect (캐시된 페이지 잔존 방지)
  const session = await getWebSession();
  if (session) {
    redirect("/");
  }
  return children;
}
