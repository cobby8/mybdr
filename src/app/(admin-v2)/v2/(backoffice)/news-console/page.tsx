// ============================================================
// (admin-v2)/v2/(backoffice)/news-console/page.tsx — BDR NEWS 검수 콘솔 (컷오버 포팅)
//   레거시 (admin)/admin/news/page.tsx 를 admin-v2 백오피스로 1:1 포팅.
//   서버 컴포넌트: 권한 가드 + READ(Prisma 직접·레거시 쿼리 1:1)만 담당.
//   목록/상세/액션 UI 는 _console(클라), 사진 관리는 _photo-manager(클라·옵션 B).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0.
//     · 검수 5액션 = 기존 server action(admin-news.ts) 그대로 import → props 전달.
//     · 사진 업로드/삭제 = 기존 REST(/api/web/upload/news-photo) 를 클라가 호출.
//     · linkify = 기존 헬퍼(buildLinkifyEntriesBatch + LinkifyNewsBody) 재사용.
//   ⚠ 권한 — /v2 layout 은 tournament_admin 까지 통과시키지만, 알기자 검수는 레거시
//     requireAdmin(user.isAdmin) 과 동일하게 운영자(isAdmin) 전용이다.
//     레거시 가드(DB user.isAdmin)를 페이지 레벨에서 재현 → 비권한 /v2 redirect(신규 로직 0).
//   ⚠ READ 는 레거시 page.tsx 와 동일한 select·orderBy·status 필터·카운트·사진·linkify 매핑.
// ============================================================

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import {
  publishNewsAction,
  rejectNewsAction,
  regenerateNewsAction,
  regenerateSummaryBriefAction,
  editNewsAction,
} from "@/app/actions/admin-news";
// 매치별 LinkifyEntry[] 일괄 빌더 — 레거시와 동일 헬퍼(N+1 방지)
import { buildLinkifyEntriesBatch } from "@/lib/news/build-linkify-entries";
import { NewsConsole, type NewsPost } from "./_console";

export const dynamic = "force-dynamic";

export default async function AdminV2NewsConsolePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // ── 페이지 단위 isAdmin 방어 가드 (레거시 requireAdmin 의 user.isAdmin 체크 재현) ──
  // /v2 layout 은 tournament_admin 도 통과시키므로, 운영자(isAdmin)가 아니면 백오피스 홈으로 되돌린다.
  const session = await getWebSession();
  if (!session?.sub) redirect("/v2");
  const dbUser = await prisma.user.findUnique({
    where: { id: BigInt(session.sub) },
    select: { isAdmin: true },
  });
  if (!dbUser?.isAdmin) redirect("/v2");

  // 상태 필터 — 레거시와 동일(published/rejected 외 전부 draft). 서버에서 status 별로 읽는다.
  const { status: statusFilter } = await searchParams;
  const status =
    statusFilter === "published" || statusFilter === "rejected" ? statusFilter : "draft";

  // 카테고리 = "news" 만 조회 (레거시 page.tsx 쿼리 1:1).
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

  // 매치별 LinkifyEntry[] + 사진 (레거시 page.tsx 1:1 — 배치 조회로 N+1 방지)
  const matchIds = posts
    .map((p) => p.tournament_match_id)
    .filter((m): m is bigint => m !== null);
  const [linkifyMap, photos] = await Promise.all([
    buildLinkifyEntriesBatch(matchIds),
    // 알기자 기사 사진 — 매치별 N장 (hero 우선·display_order 순). 레거시 쿼리 동일.
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

  // matchId(string) → photos[] map (camel 직렬화)
  const photosByMatch = new Map<
    string,
    Array<{
      id: string;
      url: string;
      width: number | null;
      height: number | null;
      isHero: boolean;
      displayOrder: number;
      caption: string | null;
    }>
  >();
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

  // BigInt → string 직렬화 (Server → Client) + linkify entries + photos (레거시 매핑 1:1)
  const serialized: NewsPost[] = posts.map((p) => {
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
    <NewsConsole
      posts={serialized}
      currentStatus={status}
      counts={{ draft: draftCount, published: publishedCount, rejected: rejectedCount }}
      // 검수 5액션 — 레거시 server action 그대로 전달(백엔드 0변경)
      publishAction={publishNewsAction}
      rejectAction={rejectNewsAction}
      regenerateAction={regenerateNewsAction}
      regenerateSummaryAction={regenerateSummaryBriefAction}
      editAction={editNewsAction}
    />
  );
}
