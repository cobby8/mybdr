// 2026-05-03: AppNav 메뉴 NEW 뱃지 데이터 API
// MVP: 경기 LIVE + 커뮤니티 NEW (24h 내 새 글 / BDR NEWS 신규)
// 추후 확장: 대회 NEW / 팀 가입 신청 카운트 / 랭킹 갱신일 등.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 운영 영향 0 — SELECT count 만, 캐시 30s.
export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 병렬 카운트 — 라이브 매치 + 24h 신규 커뮤니티 + 카테고리별
    const [liveMatchCount, newCommunityCount, byCategory] = await Promise.all([
      // 진행 중 (status="live") 토너먼트 매치 — Flutter 기록원 활동 매치
      prisma.tournamentMatch.count({
        where: { status: "live" },
      }),
      // 24h 내 새 게시물 (모든 카테고리, status=published)
      prisma.community_posts.count({
        where: {
          status: "published",
          created_at: { gte: oneDayAgo },
        },
      }),
      // 카테고리별 24h 카운트 (커뮤니티 사이드바 NEW 뱃지 용)
      prisma.community_posts.groupBy({
        by: ["category"],
        where: {
          status: "published",
          created_at: { gte: oneDayAgo },
        },
        _count: { _all: true },
      }),
    ]);

    // 카테고리별 카운트 → Record<string, number>
    const categoryNew: Record<string, number> = {};
    for (const row of byCategory) {
      if (row.category) categoryNew[row.category] = row._count._all;
    }

    return apiSuccess({
      liveMatchCount,
      newCommunityCount,
      categoryNew,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[nav-badges]", e);
    return apiError("nav-badges fetch 실패", 500);
  }
}
