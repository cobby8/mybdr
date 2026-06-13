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
  // 승리 팀 강조 (시안 nm-score__team.is-win) — 점수 동률이면 홈 기준
  const homeWin = (match?.homeScore ?? 0) >= (match?.awayScore ?? 0);

  return (
    // 2026-06-14: IU2 v2.30 박제 — UI 만 .nm-* 시안 톤으로 교체.
    //   데이터 fetch(match/linkify/photos)·view 증가·props 무변경. 마크업만 변경.
    <div className="page">
      <div className="nm-wrap">
        {/* 빵부스러기 */}
        <nav className="nm-crumb">
          <Link href="/news">BDR NEWS</Link>
          <span className="sep">›</span>
          <span>매치 #{match?.match_number ?? matchId}</span>
        </nav>

        {/* 기사 본문 */}
        <article className="nm-article">
          {/* 카테고리 */}
          <div className="nm-article__cat">
            <span className="nw-tag nw-tag--match">매치 단신</span>
            <span className="nw-card__date">
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
          <h1 className="nm-article__title">{post.title}</h1>

          {/* 작성자 (알기자 byline) */}
          <div className="nm-byline">
            <span className="nm-byline__bot">
              <span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>
                smart_toy
              </span>
              알기자
            </span>
            <span className="nm-byline__sub">BDR NEWS AI</span>
          </div>

          {/* 매치 헤드라인 스코어보드 (cross-domain: 팀 → /teams) */}
          {match && (
            <div className="nm-score">
              <div className="nm-score__row">
                <Link
                  href={homeId ? `/teams/${homeId}` : "#"}
                  className={"nm-score__team" + (homeWin ? " is-win" : "")}
                >
                  <div className="nm-score__team-name">{homeName}</div>
                  <div className="nm-score__team-num">{match.homeScore ?? 0}</div>
                </Link>
                <div className="nm-score__vs">vs</div>
                <Link
                  href={awayId ? `/teams/${awayId}` : "#"}
                  className={"nm-score__team" + (!homeWin ? " is-win" : "")}
                >
                  <div className="nm-score__team-name">{awayName}</div>
                  <div className="nm-score__team-num">{match.awayScore ?? 0}</div>
                </Link>
              </div>
              <div className="nm-score__meta">
                {/* cross-domain: 대회 → /tournaments */}
                {match.tournament && (
                  <Link href={`/tournaments/${match.tournament.id}`}>
                    {match.tournament.name}
                  </Link>
                )}
                {match.roundName && <span>· {match.roundName}</span>}
                {match.group_name && <span>· {match.group_name}조</span>}
              </div>
            </div>
          )}

          {/* 2026-05-04: Hero 사진 — 본문 위 (있을 때만). 없으면 placeholder */}
          {newsPhotos.length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              <NewsPhotoHero photos={newsPhotos} />
            </div>
          ) : (
            <div className="nm-cover">
              <span className="ico material-symbols-outlined">image</span>
              <span>경기 사진 (알기자 갤러리)</span>
            </div>
          )}

          {/* 본문 (linkify — 팀/선수 자동 link, .nm-body a.linkify 스타일) */}
          <LinkifyNewsBody
            content={post.content ?? ""}
            entries={linkifyEntries}
            className="nm-body"
            linkClassName="linkify"
          />

          {/* 2026-05-04: 갤러리 — Hero 외 사진 (본문 아래) */}
          {newsPhotos.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <NewsPhotoGallery photos={newsPhotos} excludeHero />
            </div>
          )}

          {/* 메타 + 매치 상세 link (cross-domain: /live) */}
          <div className="nm-meta">
            <span>
              <span className="ico material-symbols-outlined">visibility</span>
              {((post.view_count ?? 0) + 1).toLocaleString()}
            </span>
            <span>
              <span className="ico material-symbols-outlined">favorite</span>
              {post.likes_count}
            </span>
            <span>
              <span className="ico material-symbols-outlined">chat_bubble</span>
              {post.comments_count}
            </span>
            {match && (
              <Link className="nm-meta__more" href={`/live/${match.id}`}>
                매치 상세 →
              </Link>
            )}
          </div>

          {/* 주의 안내 */}
          <p className="nm-note">
            이 기사는 AI 기자 알기자가 매치 종료 후 자동으로 작성하고 운영자 검수를
            거쳐 발행됩니다. 사실 오류 발견 시 신고해 주세요.
          </p>
        </article>

        <div style={{ textAlign: "center", marginTop: 22 }}>
          <Link className="btn" href="/news">
            <span className="ico material-symbols-outlined">arrow_back</span>다른 기사 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
