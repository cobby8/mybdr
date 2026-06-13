// 2026-05-03: Phase E1 — BDR NEWS 매거진 메인 (/news)
// 2026-06-14: IU2 v2.30 박제 — UI 렌더링을 _v2/news-content.tsx 클라 컴포넌트로 교체.
//   데이터 소스(community_posts category=news, status=published) · where/select 무변경.
//   카테고리 chip(client) 동작을 위해 페이지네이션 → take 60 단일 fetch 로 전환
//   (where/select 동일 · schema/api 0 변경). 카드 그리드 UI 만 시안 톤으로 교체.

import { prisma } from "@/lib/db/prisma";

import { NewsContent, type NewsItem } from "./_v2/news-content";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 1분 캐시 (Phase 2 발행은 즉시 반영 X 허용)

export const metadata = {
  title: "BDR NEWS — 알기자",
  description: "BDR 동호회 매치 단신 기사. AI 기자 알기자가 작성합니다.",
};

// 본문 미리보기 (줄바꿈 정리 후 첫 120자) — 기존 page.tsx 로직 그대로 유지
function makePreview(content: string | null): string {
  return (content ?? "").replace(/\n+/g, " ").slice(0, 120);
}

// 표시용 날짜 "6월 14일" (기존 toLocaleDateString 동일)
function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default async function NewsHomePage() {
  // ---- 발행 알기자 기사 prefetch (status=published 최신순) ----
  // 기존 where/select 유지. 카테고리 chip(client 필터)·트렌딩 spotlight 를 위해
  // 페이지네이션 대신 60건 단일 fetch (시안 시뮬레이션 규모 수준).
  const posts = await prisma.community_posts
    .findMany({
      where: { category: "news", status: "published" },
      orderBy: { created_at: "desc" },
      take: 60,
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        view_count: true,
        likes_count: true,
        comments_count: true,
        tournament_match_id: true,
        tournament_id: true,
        period_type: true,
      },
    })
    .catch(() => []);

  // NEW badge 기준 — created_at 이 7일 이내 (신규 컬럼 X · 서버 UI 판정만)
  const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  // ---- 직렬화 + period_type → 카테고리 파생 (운영 데이터 기반, mock 금지) ----
  const items: NewsItem[] = posts.map((p) => {
    // period_type="match" (매치 단신) / 그 외(round·daily 종합 기사)는 "매거진"
    const cat: NewsItem["cat"] = p.period_type === "match" ? "match" : "magazine";
    return {
      id: p.id.toString(),
      title: p.title,
      preview: makePreview(p.content),
      date: fmtDate(p.created_at),
      isNew: now - new Date(p.created_at).getTime() < NEW_WINDOW_MS,
      views: p.view_count ?? 0,
      likes: p.likes_count,
      comments: p.comments_count,
      matchId: p.tournament_match_id ? p.tournament_match_id.toString() : null,
      cat,
    };
  });

  return <NewsContent items={items} />;
}
