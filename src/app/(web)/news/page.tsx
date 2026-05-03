// 2026-05-03: Phase E1 — BDR NEWS 매거진 메인
// /news 경로. published 알기자 게시물 카드 그리드.

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60; // 1분 캐시 (Phase 2 발행은 즉시 반영 X 허용)

export const metadata = {
  title: "BDR NEWS — 알기자",
  description: "BDR 동호회 매치 단신 기사. AI 기자 알기자가 작성합니다.",
};

export default async function NewsHomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = 12;

  const [posts, totalCount] = await Promise.all([
    prisma.community_posts.findMany({
      where: { category: "news", status: "published" },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
    }),
    prisma.community_posts.count({
      where: { category: "news", status: "published" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      {/* 헤더 */}
      <header className="mb-6 border-b border-[var(--color-border)] pb-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-bold tracking-tight">BDR NEWS</h1>
          <span className="text-sm text-[var(--color-text-dim)]">
            ✍️ 알기자 · BDR NEWS AI
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-dim)]">
          BDR 동호회 매치 단신 기사. 매치 종료 후 AI 기자 알기자가 자동으로 작성합니다.
        </p>
      </header>

      {/* 카드 그리드 */}
      {posts.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-12 text-center">
          <p className="text-sm text-[var(--color-text-dim)]">
            아직 발행된 기사가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => {
            const href = p.tournament_match_id
              ? `/news/match/${p.tournament_match_id}`
              : `/news`;
            // 본문 미리보기 (첫 100자)
            const preview = (p.content ?? "")
              .replace(/\n+/g, " ")
              .slice(0, 120);
            return (
              <Link
                key={p.id.toString()}
                href={href}
                className="group block rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4 transition hover:border-[var(--color-accent)] hover:shadow-md"
              >
                {/* 카테고리 뱃지 */}
                <div className="mb-2 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-white">
                    BDR NEWS
                  </span>
                  <span className="text-[var(--color-text-dim)]">
                    {new Date(p.created_at).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {/* 제목 */}
                <h2 className="mb-2 text-base font-semibold leading-snug text-[var(--color-text)] line-clamp-2 group-hover:text-[var(--color-accent)]">
                  {p.title}
                </h2>
                {/* 미리보기 */}
                <p className="mb-3 text-sm text-[var(--color-text-dim)] line-clamp-3">
                  {preview}
                </p>
                {/* 메타 */}
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-dim)]">
                  <span>👁 {p.view_count}</span>
                  <span>❤ {p.likes_count}</span>
                  <span>💬 {p.comments_count}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/news?page=${page - 1}`}
              className="rounded border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg-hover)]"
            >
              ← 이전
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-[var(--color-text-dim)]">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/news?page=${page + 1}`}
              className="rounded border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg-hover)]"
            >
              다음 →
            </Link>
          )}
        </nav>
      )}

      {/* 푸터 안내 */}
      <footer className="mt-10 border-t border-[var(--color-border)] pt-4 text-center text-xs text-[var(--color-text-dim)]">
        BDR NEWS는 AI 기자 알기자가 매치 종료 후 자동으로 작성한 기사이며, 운영자 검수 후
        발행됩니다. 사실 오류는{" "}
        <Link href="/help" className="underline">
          문의하기
        </Link>
        로 알려주세요.
      </footer>
    </main>
  );
}
