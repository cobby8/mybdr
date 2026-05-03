// 2026-05-03: Phase E2 — BDR NEWS 매치별 단신 상세 페이지
// /news/match/[matchId]. published 알기자 게시물 본문 + LinkifyNewsBody + 매치 정보 사이드바.

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { LinkifyNewsBody } from "@/lib/news/linkify-news-body";
// 2026-05-04: 헬퍼 분리 (community/news/match/admin 3곳 일관성) — buildLinkifyEntries
import { buildLinkifyEntries } from "@/lib/news/build-linkify-entries";
// 2026-05-04: 알기자 기사 사진 (Hero + 갤러리)
import { NewsPhotoHero, NewsPhotoGallery, type NewsPhotoForGallery } from "@/lib/news/news-photo-gallery";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const post = await prisma.community_posts.findFirst({
    where: {
      category: "news",
      status: "published",
      tournament_match_id: BigInt(matchId),
    },
    select: { title: true, content: true },
  });
  if (!post) return { title: "BDR NEWS — 기사 없음" };
  const desc = (post.content ?? "").replace(/\n+/g, " ").slice(0, 140);
  return {
    title: `${post.title} — BDR NEWS`,
    description: desc,
    openGraph: { title: post.title, description: desc },
  };
}

export default async function NewsMatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const matchIdBig = BigInt(matchId);

  const post = await prisma.community_posts.findFirst({
    where: {
      category: "news",
      status: "published",
      tournament_match_id: matchIdBig,
    },
    select: {
      id: true,
      title: true,
      content: true,
      created_at: true,
      view_count: true,
      likes_count: true,
      comments_count: true,
      tournament_match_id: true,
    },
  });

  if (!post) notFound();

  // view_count +1 (best effort, fire-and-forget)
  void prisma.community_posts
    .update({
      where: { id: post.id },
      data: { view_count: { increment: 1 } },
    })
    .catch(() => {});

  // 매치 사이드바 정보 (얕은 select — players 미포함, linkify 는 헬퍼로 별도 처리)
  // 2026-05-04: linkify 인라인 코드 → buildLinkifyEntries 헬퍼로 통합 (community/news/match/admin 3곳 일관)
  // 2026-05-04: 알기자 사진도 같이 fetch (Promise.all 병렬)
  const [match, linkifyEntries, newsPhotoRows] = await Promise.all([
    prisma.tournamentMatch.findUnique({
      where: { id: matchIdBig },
      select: {
        id: true,
        match_number: true,
        group_name: true,
        roundName: true,
        scheduledAt: true,
        homeScore: true,
        awayScore: true,
        tournament: { select: { id: true, name: true } },
        homeTeam: {
          select: {
            team: { select: { id: true, name: true, logoUrl: true } },
          },
        },
        awayTeam: {
          select: {
            team: { select: { id: true, name: true, logoUrl: true } },
          },
        },
      },
    }),
    buildLinkifyEntries(matchIdBig).catch(() => []),
    prisma.news_photo
      .findMany({
        where: { match_id: matchIdBig },
        orderBy: [{ is_hero: "desc" }, { display_order: "asc" }],
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          is_hero: true,
          display_order: true,
          caption: true,
        },
      })
      .catch(() => []),
  ]);
  const newsPhotos: NewsPhotoForGallery[] = newsPhotoRows.map((r) => ({
    id: r.id.toString(),
    url: r.url,
    width: r.width,
    height: r.height,
    isHero: r.is_hero,
    displayOrder: r.display_order,
    caption: r.caption,
  }));

  const homeName = match?.homeTeam?.team?.name ?? "홈";
  const awayName = match?.awayTeam?.team?.name ?? "어웨이";
  const homeId = match?.homeTeam?.team?.id;
  const awayId = match?.awayTeam?.team?.id;

  return (
    <main className="mx-auto max-w-screen-lg px-4 py-6">
      {/* 빵부스러기 */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-[var(--color-text-dim)]">
        <Link href="/news" className="hover:underline">
          BDR NEWS
        </Link>
        <span>›</span>
        <span>매치 #{match?.match_number ?? matchId}</span>
      </nav>

      {/* 기사 본문 */}
      <article className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-6 lg:p-8">
        {/* 카테고리 */}
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-white">
            BDR NEWS
          </span>
          <span className="text-[var(--color-text-dim)]">
            {new Date(post.created_at).toLocaleString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* 제목 */}
        <h1 className="mb-3 text-2xl lg:text-3xl font-bold tracking-tight">
          {post.title}
        </h1>

        {/* 작성자 (알기자 뱃지) */}
        <div className="mb-6 flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--bg-elev1)] px-2 py-1 text-[var(--color-accent)] font-medium">
            🤖 알기자
          </span>
          <span className="text-[var(--color-text-dim)]">BDR NEWS AI</span>
        </div>

        {/* 매치 헤드라인 */}
        {match && (
          <div className="mb-6 rounded-md border border-[var(--color-border)] bg-[var(--bg-elev1)] p-4">
            <div className="flex items-center justify-between gap-4">
              <Link
                href={homeId ? `/teams/${homeId}` : "#"}
                className="flex-1 text-center"
              >
                <div className="text-base font-semibold hover:text-[var(--color-accent)]">
                  {homeName}
                </div>
                <div className="mt-1 text-3xl font-bold tabular-nums">
                  {match.homeScore ?? 0}
                </div>
              </Link>
              <div className="text-xl text-[var(--color-text-dim)]">vs</div>
              <Link
                href={awayId ? `/teams/${awayId}` : "#"}
                className="flex-1 text-center"
              >
                <div className="text-base font-semibold hover:text-[var(--color-accent)]">
                  {awayName}
                </div>
                <div className="mt-1 text-3xl font-bold tabular-nums">
                  {match.awayScore ?? 0}
                </div>
              </Link>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--color-text-dim)]">
              {match.tournament && (
                <Link
                  href={`/tournaments/${match.tournament.id}`}
                  className="hover:underline"
                >
                  {match.tournament.name}
                </Link>
              )}
              {match.roundName && <span>· {match.roundName}</span>}
              {match.group_name && <span>· {match.group_name}조</span>}
            </div>
          </div>
        )}

        {/* 2026-05-04: Hero 사진 — 본문 위 (있을 때만) */}
        {newsPhotos.length > 0 && (
          <div className="mb-5">
            <NewsPhotoHero photos={newsPhotos} />
          </div>
        )}

        {/* 본문 (linkify) */}
        <LinkifyNewsBody
          content={post.content ?? ""}
          entries={linkifyEntries}
          className="text-base leading-relaxed text-[var(--color-text)]"
        />

        {/* 2026-05-04: 갤러리 — Hero 외 사진 (본문 아래) */}
        {newsPhotos.length > 1 && (
          <div className="mt-5">
            <NewsPhotoGallery photos={newsPhotos} excludeHero />
          </div>
        )}

        {/* 메타 + 액션 */}
        <div className="mt-6 flex items-center gap-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-text-dim)]">
          <span>👁 {(post.view_count ?? 0) + 1}</span>
          <span>❤ {post.likes_count}</span>
          <span>💬 {post.comments_count}</span>
          {match && (
            <Link
              href={`/live/${match.id}`}
              className="ml-auto text-[var(--color-accent)] hover:underline"
            >
              매치 상세 →
            </Link>
          )}
        </div>

        {/* 주의 안내 */}
        <p className="mt-4 text-xs text-[var(--color-text-dim)]">
          이 기사는 AI 기자 알기자가 매치 종료 후 자동으로 작성하고 운영자 검수를
          거쳐 발행됩니다. 사실 오류 발견 시 신고해 주세요.
        </p>
      </article>

      <div className="mt-6 text-center">
        <Link
          href="/news"
          className="inline-block rounded border border-[var(--color-border)] px-4 py-2 text-sm hover:bg-[var(--color-bg-hover)]"
        >
          ← 다른 기사 보기
        </Link>
      </div>
    </main>
  );
}
