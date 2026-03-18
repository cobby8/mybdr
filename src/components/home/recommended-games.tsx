"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface RecommendedGame {
  id: string;
  uuid: string | null;
  title: string | null;
  scheduled_at: string | null;
  venue_name: string | null;
  city: string | null;
  game_type: string | null;
  spots_left: number | null;
  match_reason: string | null;
}

interface RecommendedData {
  user_name: string | null;
  games: RecommendedGame[];
}

const TYPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  "0": { label: "픽업",   bg: "rgba(37,99,235,0.12)",  text: "#2563EB" },
  "1": { label: "게스트", bg: "rgba(22,163,74,0.12)",   text: "#16A34A" },
  "2": { label: "연습경기", bg: "rgba(217,119,6,0.12)", text: "#D97706" },
};

export function RecommendedGames() {
  const [data, setData] = useState<RecommendedData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web/recommended-games", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[16px]" />
          ))}
        </div>
      </section>
    );
  }

  const games = data?.games ?? [];
  const userName = data?.user_name;
  const title = userName ? `${userName}님을 위한 추천` : "추천 경기";

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href="/games" prefetch={true} className="text-sm text-[#E31B23]">
          전체보기
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {games.map((g) => {
          const badge = TYPE_BADGE[g.game_type ?? ""] ?? null;
          return (
            <Link key={g.id} href={`/games/${g.uuid?.slice(0, 8) ?? g.id}`} prefetch={true}>
              <div className="flex h-full flex-col justify-between rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] p-3 transition-all hover:bg-[#EEF2FF] hover:-translate-y-0.5 hover:shadow-md">
                {/* 뱃지 + 남은자리 */}
                <div className="mb-1.5 flex items-center gap-1.5">
                  {badge && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  )}
                  {g.spots_left !== null && g.spots_left > 0 && (
                    <span className="rounded-full bg-[#E31B23]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#E31B23]">
                      {g.spots_left}자리
                    </span>
                  )}
                </div>

                {/* 제목 */}
                <h3 className="text-sm font-semibold text-[#111827] line-clamp-1">{g.title}</h3>

                {/* 날짜 · 장소 */}
                <p className="mt-1 text-[11px] text-[#9CA3AF] line-clamp-1">
                  {g.scheduled_at ? new Date(g.scheduled_at).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : ""}
                  {" · "}
                  {g.venue_name ?? g.city ?? "장소 미정"}
                </p>

                {/* 매칭 이유 */}
                {g.match_reason && (
                  <p className="mt-1 text-[10px] font-medium text-[#1B3C87]">{g.match_reason}</p>
                )}
              </div>
            </Link>
          );
        })}
        {games.length === 0 && (
          <div className="col-span-2 rounded-[16px] border border-[#E8ECF0] bg-[#FFFFFF] py-8 text-center text-[#6B7280]">
            추천 경기가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
