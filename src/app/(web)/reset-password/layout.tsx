import type { Metadata } from "next";

// SEO: 비밀번호 재설정 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "비밀번호 재설정 - MyBDR",
  description: "새 비밀번호를 설정하세요.",
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
