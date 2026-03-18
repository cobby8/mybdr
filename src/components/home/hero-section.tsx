"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PersonalHero } from "./personal-hero";

/**
 * 히어로 섹션 — /api/web/dashboard 호출 결과로 로그인 여부를 판단.
 * /api/web/me 중복 호출을 제거하고 PersonalHero가 직접 데이터를 받도록 한다.
 */
export function HeroSection() {
  const [state, setState] = useState<"loading" | "logged-in" | "guest">("loading");
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch("/api/web/dashboard", { credentials: "include" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setDashboardData(data);
          setState("logged-in");
        } else {
          setState("guest");
        }
      })
      .catch(() => setState("guest"));
  }, []);

  if (state === "loading") {
    return (
      <div className="h-[120px] animate-pulse rounded-[20px] bg-gradient-to-br from-[#1B3C87]/10 to-[#E31B23]/5 border border-[#E8ECF0]" />
    );
  }

  if (state === "logged-in" && dashboardData) {
    return <PersonalHero preloadedData={dashboardData} />;
  }

  // 비로그인 → 정적 히어로
  return (
    <section className="rounded-[24px] bg-gradient-to-br from-[#1B3C87]/15 to-[#E31B23]/10 p-8 text-center md:p-12 border border-[#E8ECF0]">
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">
        <span className="text-[#E31B23]">B</span>asketball
        <span className="text-[#E31B23]"> D</span>aily
        <span className="text-[#E31B23]"> R</span>outine
      </h1>
      <p className="mb-6 text-[#6B7280]">농구 경기와 대회를 쉽고 빠르게 찾고, 즐기세요</p>
      <div className="flex justify-center gap-3">
        <Link href="/games" prefetch={true}><Button>경기 찾기</Button></Link>
        <Link href="/tournaments" prefetch={true}><Button variant="secondary">대회 둘러보기</Button></Link>
      </div>
    </section>
  );
}
