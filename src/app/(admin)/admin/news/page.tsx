// 2026-05-03: Phase D — 알기자 (BDR NEWS) 운영자 검수 페이지
// drafts + published + analytics 통합. /admin/news.
//
// 흐름: 좌 sidebar (drafts/published/rejected 탭) + 우 main (목록 + 미리보기 + 액션 4종)

import { prisma } from "@/lib/db/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  publishNewsAction,
  rejectNewsAction,
  regenerateNewsAction,
  regenerateSummaryBriefAction,
  editNewsAction,
} from "@/app/actions/admin-news";
import { AdminNewsContent } from "./admin-news-content";
// 2026-05-04: 헬퍼 분리 (community/news/match/admin 3곳 일관성) — buildLinkifyEntriesBatch
import { buildLinkifyEntriesBatch } from "@/lib/news/build-linkify-entries";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;
  const status = statusFilter === "published" || statusFilter === "rejected" ? statusFilter : "draft";

  // 카테고리 = "news" 만 조회
  const [posts, draftCount, publishedCount, rejectedCount] = await Promise.all([
    prisma.community_posts.findMany({
      where: { category: "news", status },
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        content: true,
        status: true,
        created_at: true,
        updated_at: true,
        likes_count: true,
        comments_count: true,
        view_count: true,
        tournament_match_id: true,
        tournament_id: true,
        period_type: true,
        period_key: true,
      },
    }),
    prisma.community_posts.count({ where: { category: "news", status: "draft" } }),
    prisma.community_posts.count({ where: { category: "news", status: "published" } }),
    prisma.community_posts.count({ where: { category: "news", status: "rejected" } }),
  ]);

  // 매치별 LinkifyEntry[] (헬퍼 사용 — community/news/match/admin 3곳 일관)
  // 2026-05-04: 인라인 코드 → buildLinkifyEntriesBatch 헬퍼로 통합 (중복 제거)
  const matchIds = posts
    .map((p) => p.tournament_match_id)
    .filter((m): m is bigint => m !== null);
  const [linkifyMap, photos] = await Promise.all([
    buildLinkifyEntriesBatch(matchIds),
    // 2026-05-04: 알기자 기사 사진 — 매치별 N장 (admin/news 검수 페이지에서 업로드/삭제/Hero 지정)
    matchIds.length > 0
      ? prisma.news_photo.findMany({
          where: { match_id: { in: matchIds } },
          orderBy: [{ is_hero: "desc" }, { display_order: "asc" }],
          select: {
            id: true,
            match_id: true,
            url: true,
            width: true,
            height: true,
            is_hero: true,
            display_order: true,
            caption: true,
          },
        })
      : Promise.resolve([]),
  ]);
  // matchId → photos[] map
  const photosByMatch = new Map<string, Array<{
    id: string;
    url: string;
    width: number | null;
    height: number | null;
    isHero: boolean;
    displayOrder: number;
    caption: string | null;
  }>>();
  for (const ph of photos) {
    const key = ph.match_id.toString();
    if (!photosByMatch.has(key)) photosByMatch.set(key, []);
    photosByMatch.get(key)!.push({
      id: ph.id.toString(),
      url: ph.url,
      width: ph.width,
      height: ph.height,
      isHero: ph.is_hero,
      displayOrder: ph.display_order,
      caption: ph.caption,
    });
  }

  // BigInt → string serialize (Server → Client) + linkify entries + photos
  const serialized = posts.map((p) => {
    const linkifyEntries = p.tournament_match_id
      ? linkifyMap.get(p.tournament_match_id.toString()) ?? []
      : [];
    const matchPhotos = p.tournament_match_id
      ? photosByMatch.get(p.tournament_match_id.toString()) ?? []
      : [];
    return {
      id: p.id.toString(),
      title: p.title,
      content: p.content ?? "",
      status: p.status ?? "draft",
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      view_count: p.view_count ?? 0,
      tournament_match_id: p.tournament_match_id?.toString() ?? null,
      tournament_id: p.tournament_id ?? null,
      period_type: p.period_type ?? null,
      period_key: p.period_key ?? null,
      linkifyEntries,
      photos: matchPhotos,
    };
  });

  return (
    <div>
      <AdminPageHeader
        title="BDR NEWS 검수"
        subtitle={`draft ${draftCount} · published ${publishedCount} · rejected ${rejectedCount}`}
      />
      <AdminNewsContent
        posts={serialized}
        currentStatus={status}
        counts={{
          draft: draftCount,
          published: publishedCount,
          rejected: rejectedCount,
        }}
        publishAction={publishNewsAction}
        rejectAction={rejectNewsAction}
        regenerateAction={regenerateNewsAction}
        regenerateSummaryAction={regenerateSummaryBriefAction}
        editAction={editNewsAction}
      />
    </div>
  );
}
