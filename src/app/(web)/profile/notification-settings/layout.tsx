import type { Metadata } from "next";

// SEO: 알림 설정 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "알림 설정 - MyBDR",
  description: "알림 수신 설정을 관리하세요.",
};

export default function NotificationSettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
