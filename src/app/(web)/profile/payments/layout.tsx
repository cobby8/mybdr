import type { Metadata } from "next";

// SEO: 결제 내역 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "결제 내역 - MyBDR",
  description: "결제 내역을 확인하고 관리하세요.",
};

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
