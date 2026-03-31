import type { Metadata } from "next";

// SEO: 결제 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "결제 - MyBDR",
  description: "요금제를 선택하고 결제하세요.",
};

export default function PricingCheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
