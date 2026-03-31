import type { Metadata } from "next";

// SEO: 비밀번호 찾기 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "비밀번호 찾기 - MyBDR",
  description: "이메일을 입력하여 비밀번호를 재설정하세요.",
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
