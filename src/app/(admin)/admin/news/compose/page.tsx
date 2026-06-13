// 2026-06-14: Phase 10 박제 #5 IA1 (AdminNews A안) — 운영자 신규 기사 작성/발행 페이지
//
// 시안 source: Dev/design/BDR-current/screens/AdminNews.jsx (v2.30 · IA1 · super-admin)
//
// 흐름: server wrapper(이 파일) 가 실집계 + 발행이력 + 대회/경기 옵션을 조회 →
//       client(compose-content) 가 시안 UI 1:1 렌더 + createNewsPostAction 호출.
//
// ★ 기존 /admin/news (검수 페이지 + admin-news-content + 5 server action) 보존.
//   본 라우트는 "작성" 전용으로 분리. 신규 테이블/컬럼 0 — community_posts 만 사용.

import { prisma } from "@/lib/db/prisma";
import {
  createNewsPostAction,
  listMatchOptionsAction,
} from "@/app/actions/admin-news";
import { ComposeContent } from "./compose-content";

export const dynamic = "force-dynamic";

export default async function AdminNewsComposePage() {
  // 이달 시작 (이달 발행 count 기준) — 로컬 타임존 기준 1일 0시
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Hero stat 4종 실집계 (mock 0 — 모두 실제 count)
  //   total: category=news 전체 / published / draft / this_month(이달 발행)
  const [total, published, draft, thisMonth, history, tournaments] =
    await Promise.all([
      prisma.community_posts.count({ where: { category: "news" } }),
      prisma.community_posts.count({
        where: { category: "news", status: "published" },
      }),
      prisma.community_posts.count({
        where: { category: "news", status: "draft" },
      }),
      prisma.community_posts.count({
        where: {
          category: "news",
          status: "published",
          updated_at: { gte: monthStart },
        },
      }),
      // 발행 이력 — 최근 기사 12건 실조회 (published + draft 혼합, 최신순)
      prisma.community_posts.findMany({
        where: { category: "news" },
        orderBy: { updated_at: "desc" },
        take: 12,
        select: {
          id: true,
          title: true,
          status: true,
          updated_at: true,
          view_count: true,
          period_type: true,
        },
      }),
      // 대회 옵션 — 최근 대회 30건 (매치 단신 cross-domain 선택용)
      prisma.tournament.findMany({
        orderBy: { startDate: "desc" },
        take: 30,
        select: { id: true, name: true },
      }),
    ]);

  // 발행 이력 serialize (BigInt → string, Date → ISO)
  const historyRows = history.map((h) => ({
    id: h.id.toString(),
    title: h.title,
    // 시안 status 매핑: published → published / 그 외 → draft
    status: h.status === "published" ? "published" : "draft",
    // 시안 cat 메타 — period_type=match 면 match, 아니면 magazine (기본)
    cat: h.period_type === "match" ? "match" : "magazine",
    time: h.updated_at.toISOString(),
    views: h.view_count ?? 0,
  }));

  const tournamentOptions = tournaments.map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return (
    <ComposeContent
      stats={{ total, published, draft, thisMonth }}
      history={historyRows}
      tournamentOptions={tournamentOptions}
      createAction={createNewsPostAction}
      listMatchOptionsAction={listMatchOptionsAction}
    />
  );
}
