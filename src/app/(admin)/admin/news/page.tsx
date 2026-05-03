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
  editNewsAction,
} from "@/app/actions/admin-news";
import { AdminNewsContent } from "./admin-news-content";

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

  // 매치별 출전 선수 + 양 팀 정보 (linkify 용)
  const matchIds = posts
    .map((p) => p.tournament_match_id)
    .filter((m): m is bigint => m !== null);
  const matches = matchIds.length
    ? await prisma.tournamentMatch.findMany({
        where: { id: { in: matchIds } },
        select: {
          id: true,
          homeTeam: {
            select: {
              team: { select: { id: true, name: true } },
              players: {
                where: { is_active: true },
                select: {
                  userId: true,
                  player_name: true,
                  users: { select: { id: true, name: true, nickname: true } },
                },
              },
            },
          },
          awayTeam: {
            select: {
              team: { select: { id: true, name: true } },
              players: {
                where: { is_active: true },
                select: {
                  userId: true,
                  player_name: true,
                  users: { select: { id: true, name: true, nickname: true } },
                },
              },
            },
          },
        },
      })
    : [];
  const matchInfoMap = new Map<
    string,
    {
      teams: Array<{ id: string; name: string }>;
      players: Array<{ id: string; name: string }>;
    }
  >();
  for (const m of matches) {
    const teams: Array<{ id: string; name: string }> = [];
    const players: Array<{ id: string; name: string }> = [];
    for (const tt of [m.homeTeam, m.awayTeam]) {
      if (!tt) continue;
      if (tt.team) teams.push({ id: tt.team.id.toString(), name: tt.team.name });
      for (const p of tt.players) {
        if (!p.userId) continue;
        const name = p.users?.name || p.player_name || p.users?.nickname;
        if (name && name.trim().length >= 2) {
          players.push({ id: p.userId.toString(), name: name.trim() });
        }
      }
    }
    matchInfoMap.set(m.id.toString(), { teams, players });
  }

  // BigInt → string serialize (Server → Client) + linkify entries
  const serialized = posts.map((p) => {
    const info = p.tournament_match_id
      ? matchInfoMap.get(p.tournament_match_id.toString())
      : null;
    const linkifyEntries: Array<{ name: string; href: string; type: "player" | "team" }> = [];
    if (info) {
      info.teams.forEach((t) =>
        linkifyEntries.push({ name: t.name, href: `/teams/${t.id}`, type: "team" }),
      );
      // 같은 이름 중복 제거 (id 우선 1명)
      const seenNames = new Set<string>();
      info.players.forEach((pl) => {
        if (seenNames.has(pl.name)) return;
        seenNames.add(pl.name);
        linkifyEntries.push({ name: pl.name, href: `/users/${pl.id}`, type: "player" });
      });
    }
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
        editAction={editNewsAction}
      />
    </div>
  );
}
