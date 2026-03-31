import type { Metadata } from "next";

// SEO: 결제 완료 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "결제 완료 - MyBDR",
  description: "결제가 성공적으로 완료되었습니다.",
};

export default function PricingSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
