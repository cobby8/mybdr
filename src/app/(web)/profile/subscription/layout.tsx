import type { Metadata } from "next";

// SEO: 구독 관리 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "구독 관리 - MyBDR",
  description: "구독 플랜을 확인하고 관리하세요.",
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
