import type { Metadata } from "next";

// SEO: 주간 운동 리포트 페이지 메타데이터 (page.tsx가 "use client"이므로 layout에서 설정)
export const metadata: Metadata = {
  title: "주간 운동 리포트 - MyBDR",
  description: "이번 주 운동 기록과 통계를 확인하세요.",
};

export default function WeeklyReportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
