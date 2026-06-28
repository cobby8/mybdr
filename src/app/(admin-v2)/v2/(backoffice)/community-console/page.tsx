// ============================================================
// (admin-v2)/v2/community-console/page.tsx — R2-C 커뮤니티 콘솔(BO-3)
//   탭 4(자유/모집/후기/건의). 정본 bo-pages communityConsole 1:1.
//   ⚠ 백엔드 0변경 — 리스트 READ 는 서버 컴포넌트 Prisma 단일 매핑(snake→표시값 1곳).
//   매핑(확정): 자유=community_posts.category="general" / 모집="recruit" /
//   후기="review" / 건의=suggestions(별 모델). 레거시 /admin/{community,suggestions}
//   의 데이터 소스를 동일 Prisma 직접조회로 재현.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import type { AdminBoPostRow, AdminBoSuggestionRow } from "@/lib/admin-v2/data";
import { CommunityConsole } from "./_console";

export const dynamic = "force-dynamic";

// MM.DD (KST 고정) — 서버는 UTC → Asia/Seoul 변환
function md(d: Date): string {
  const p = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const mo = p.find((x) => x.type === "month")?.value ?? "";
  const da = p.find((x) => x.type === "day")?.value ?? "";
  return `${mo}.${da}`;
}

// community_posts.status → 표시 라벨/톤 (published 기본, hide/unhide 액션 = hidden/published)
function postStatus(s: string | null): { badge: string; tone: string } {
  if (s === "published" || s === null) return { badge: "정상", tone: "ok" };
  if (s === "hidden") return { badge: "숨김", tone: "grey" };
  if (s === "deleted") return { badge: "삭제", tone: "danger" };
  if (s === "reported") return { badge: "신고", tone: "danger" };
  return { badge: s, tone: "grey" };
}

// suggestions.status → 표시 라벨/톤 (pending 기본)
function suggestStatus(s: string | null): { st: string; sttone: string } {
  if (s === "pending" || s === null) return { st: "대기", sttone: "warn" };
  if (s === "open" || s === "in_progress") return { st: "처리중", sttone: "primary" };
  if (s === "resolved" || s === "done") return { st: "완료", sttone: "ok" };
  if (s === "rejected" || s === "closed") return { st: "반려", sttone: "mute" };
  return { st: s, sttone: "mute" };
}

export default async function AdminV2CommunityConsole() {
  // 게시판 3종(general/recruit/review) + 건의(suggestions) 병렬 조회 — 전부 READ.
  const postSelect = {
    id: true,
    title: true,
    status: true,
    likes_count: true,
    comments_count: true,
    created_at: true,
    author_nickname: true,
    users: { select: { nickname: true } },
  } as const;
  const postQuery = (category: string) =>
    prisma.community_posts.findMany({
      where: { category },
      orderBy: { created_at: "desc" },
      take: 50,
      select: postSelect,
    });

  const [free, recruit, review, suggestions] = await Promise.all([
    postQuery("general"),
    postQuery("recruit"),
    postQuery("review"),
    prisma.suggestions
      .findMany({
        orderBy: [{ created_at: "desc" }],
        take: 50,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          created_at: true,
          users_suggestions_user_idTousers: { select: { nickname: true } },
        },
      })
      .catch(() => []),
  ]);

  // ── snake → 표시 도메인 단일 매핑 ──
  type PostRecord = (typeof free)[number];
  const mapPosts = (rows: PostRecord[]): AdminBoPostRow[] =>
    rows.map((p) => {
      const { badge, tone } = postStatus(p.status);
      const author = p.users?.nickname || p.author_nickname || "익명";
      return {
        id: p.id.toString(),
        name: p.title,
        sub: `${author} · ${md(p.created_at)}`,
        // 정본 반응 표기 "♡ N · 💬 N"
        engage: `♡ ${p.likes_count} · 💬 ${p.comments_count}`,
        badge,
        tone,
      };
    });

  const suggestionRows: AdminBoSuggestionRow[] = suggestions.map((s) => {
    const { st, sttone } = suggestStatus(s.status);
    const author = s.users_suggestions_user_idTousers?.nickname || "익명";
    return {
      id: s.id.toString(),
      name: s.title,
      sub: `${author} · ${md(s.created_at)}`,
      category: s.category || "일반", // 원값 passthrough(매핑 미정 — 보고)
      tone: "primary",
      st,
      sttone,
    };
  });

  return (
    <CommunityConsole
      free={mapPosts(free)}
      recruit={mapPosts(recruit)}
      review={mapPosts(review)}
      suggestions={suggestionRows}
    />
  );
}
