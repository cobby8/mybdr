import type { Metadata } from "next";
import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CommentForm } from "./comment-form";
import { PostDetailSidebar } from "./_components/post-detail-sidebar";
// v2 박제: 기존 ShareButton/LikeButton 대신 시안 .btn.btn--lg 모양의 v2 버튼 사용
// 데이터 로직(Server Action / 클립보드)은 v1 과 100% 동일 — UI 만 교체
import { ShareButtonV2 } from "./_components/share-button-v2";
import { LikeButtonV2 } from "./_components/like-button-v2";
import { PostActions } from "./_components/post-actions";
import { CommentList } from "./_components/comment-list";
import { CommunityAsideNav } from "../_components/community-aside-nav";
import { getWebSession } from "@/lib/auth/web-session";
// [2026-04-22] 카페 원문 HTML entity 디코드 — Stage A 확장 후속
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
// 2026-05-04: 알기자 (BDR NEWS) 카테고리 본문 자동 링크 (선수/팀 → /users/{id}, /teams/{id})
import { LinkifyNewsBody } from "@/lib/news/linkify-news-body";
import { buildLinkifyEntries } from "@/lib/news/build-linkify-entries";
// 2026-05-04: 알기자 기사 사진 (Hero + 갤러리)
import { NewsPhotoHero, NewsPhotoGallery, type NewsPhotoForGallery } from "@/lib/news/news-photo-gallery";

export const revalidate = 30;

// React cache()로 감싸서 같은 렌더 사이클 내 중복 DB 쿼리 방지
// generateMetadata()와 본문 컴포넌트가 같은 게시글을 조회해도 실제 쿼리는 1회만 실행됨
// 2026-05-09: status 필터 추가 — draft (알기자 검수 대기) URL 직접 입력 시 본문 노출 차단.
// 알기자 검수 대기 게시물은 /admin/news 에서만 접근 가능. /community/[public_id] 진입 = published 만.
const getPost = cache(async (publicId: string) => {
  return prisma.community_posts.findFirst({
    where: { public_id: publicId, status: "published" },
    include: {
      users: {
        select: {
          id: true,
          nickname: true,
          profile_image_url: true,
        },
      },
    },
  }).catch(() => null);
});

// 카페 댓글 타입 (images JSONB 안에 cafe_comments 배열로 저장됨)
interface CafeComment {
  nickname: string;
  text: string;
  date: string;
  is_reply: boolean;
}

// images JSONB에서 카페 댓글 추출
function getCafeComments(images: unknown): CafeComment[] {
  if (!images || typeof images !== "object") return [];
  const obj = images as Record<string, unknown>;
  const comments = obj.cafe_comments;
  if (!Array.isArray(comments)) return [];
  return comments.filter((c): c is CafeComment => !!c && typeof c === "object" && "text" in c);
}

// 카테고리 라벨 매핑 (브레드크럼 + badge--soft 표시용)
const categoryLabelMap: Record<string, string> = {
  general: "자유게시판",
  info: "정보공유",
  review: "대회후기",
  marketplace: "농구장터",
  recruit: "팀원모집",
  qna: "질문답변",
  notice: "공지사항",
  news: "BDR NEWS", // 2026-05-03 알기자
};

// 상대 시간 포맷 (시안은 "2025.04.22" 형식이지만 운영 일관성 위해 기존 상대시간 유지)
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // cache()로 감싼 getPost를 사용 — 본문 컴포넌트와 쿼리 공유
  const post = await getPost(id);

  if (!post) return {};

  const description = post.content?.slice(0, 120) ?? "";
  return {
    title: `${post.title} - BDR 커뮤니티`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: [{ url: "/images/logo.png", width: 600, height: 600, alt: "BDR" }],
    },
  };
}

export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1단계: post와 session을 병렬로 조회 (서로 독립적)
  // cache()된 getPost를 사용하므로 generateMetadata와 쿼리 공유
  const [post, session] = await Promise.all([
    getPost(id),
    getWebSession(),
  ]);
  // 2026-05-04: published 만 노출 (draft/rejected/deleted 모두 차단)
  // 알기자 (BDR NEWS) Phase 2 흐름 = INSERT status=draft → admin/news 검수 → publish
  // 직접 URL 접근으로 draft 노출 방지 (5/4 backfill 7건 사고 박제)
  if (!post || post.status !== "published") return notFound();

  // 카페 크롤링 글쓴이 우선, 없으면 users 테이블
  const displayNickname = post.author_nickname || post.users?.nickname || "익명";
  // 카페 댓글
  const cafeComments = getCafeComments(post.images);

  // 2026-05-04: 알기자 (BDR NEWS) 게시물이면 본문 자동 링크 entries 빌드 + 사진 fetch
  // - category=news + tournament_match_id 둘 다 있을 때만 (외부 글이 news 카테고리일 가능성 0이지만 안전 가드)
  // - admin/news 미리보기 + /news/match/[id] deep link 와 동일 룰 (선수 = 출전+is_active+이름>=2글자)
  const isAlkijaPost = post.category === "news" && !!post.tournament_match_id;
  const [linkifyEntries, newsPhotos] = isAlkijaPost
    ? await Promise.all([
        buildLinkifyEntries(post.tournament_match_id!).catch(() => []),
        prisma.news_photo
          .findMany({
            where: { match_id: post.tournament_match_id! },
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
          .then((rows): NewsPhotoForGallery[] =>
            rows.map((r) => ({
              id: r.id.toString(),
              url: r.url,
              width: r.width,
              height: r.height,
              isHero: r.is_hero,
              displayOrder: r.display_order,
              caption: r.caption,
            })),
          )
          .catch(() => [] as NewsPhotoForGallery[]),
      ])
    : [[] as never[], [] as NewsPhotoForGallery[]];

  // 2단계: post.id가 필요한 댓글 + 좋아요/팔로우를 병렬 실행
  let isLiked = false;
  let isFollowing = false;
  const isLoggedIn = !!session;
  const currentUserId = session?.sub ?? undefined;
  // 본인 게시글인지 확인 (수정/삭제 버튼 표시용)
  const isPostOwner = !!session && post.user_id === BigInt(session.sub);

  // 댓글 쿼리 함수 (post.id 필요하므로 1단계 이후 실행)
  const fetchComments = () => prisma.comments.findMany({
    where: { commentable_type: "CommunityPost", commentable_id: post.id },
    orderBy: { created_at: "asc" },
    include: {
      users: {
        select: {
          nickname: true,
          profile_image_url: true,
        },
      },
    },
  });
  type CommentsResult = Awaited<ReturnType<typeof fetchComments>>;
  const commentsQuery = fetchComments().catch(() => [] as CommentsResult);

  // 로그인 시: 댓글 + 좋아요 + 팔로우를 모두 병렬 실행
  // 비로그인 시: 댓글만 조회
  let comments: CommentsResult;
  if (session) {
    const [fetchedComments, like, follow] = await Promise.all([
      commentsQuery,
      prisma.community_post_likes.findUnique({
        where: {
          community_post_id_user_id: {
            community_post_id: post.id,
            user_id: BigInt(session.sub),
          },
        },
      }).catch(() => null),
      prisma.follows.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: BigInt(session.sub),
            following_id: post.user_id,
          },
        },
      }).catch(() => null),
    ]);
    comments = fetchedComments;
    isLiked = !!like;
    isFollowing = !!follow;
  } else {
    comments = await commentsQuery;
  }

  const categoryKey = post.category ?? "";
  const categoryLabel = categoryLabelMap[categoryKey] ?? categoryKey ?? "기타";
  // DB 댓글 + 카페 댓글 합산 (시안 헤더 카운트 + 본문 헤더 메타에서 사용)
  const totalCommentsCount = comments.filter((c) => c.status !== "deleted").length + cafeComments.length;
  // 좋아요 / 조회수 — null 방어
  const likesCount = post.likes_count ?? 0;
  const viewsCount = post.view_count ?? 0;

  return (
    // 5C-3 박제: 운영 .page > .with-aside 레이아웃 유지(5C-2/원본 답습 — comm-page 신규 클래스 회피).
    // main 안에서 시안 CU2 .cu2-grid (글 본문/댓글 + 추천 사이드) 2열 적용.
    // CommunityAsideNav(좌 게시판 트리)는 그대로 — PostDetail엔 활성 카테고리 개념 없어 null
    <div className="page">
      <div className="with-aside">
        <CommunityAsideNav activeCategory={null} />

        <main>
          {/* breadcrumb — 시안 .crumbs.cu2-crumbs (홈 › 카테고리 › 글 상세) */}
          <nav className="crumbs cu2-crumbs">
            <Link href="/">홈</Link>
            <span className="sep">›</span>
            {/* 카테고리 → /community?category=... 이동 (기존 동작 보존) */}
            <Link href={categoryKey ? `/community?category=${categoryKey}` : "/community"}>
              {categoryLabel}
            </Link>
            <span className="sep">›</span>
            <span className="cur">글 상세</span>
          </nav>

          {/* 시안 .cu2-grid = main(글 본문/댓글) + side(추천) 2열 */}
          <div className="cu2-grid">
            <main className="cu2-main">
              {/* CU2-G 알기자 hero band(대회 cross-domain) = 시안엔 post.tournament 객체 사용.
                  운영엔 대회명 cross-domain 객체 출처 없음(A4 lock·mock 0) → band hide.
                  알기자 사진(NewsPhotoHero)은 본문 안에서 기존 그대로 노출하므로 정보 손실 0. */}

              {/* CU2-A — article (헤더/Body/Reactions/Nav) */}
              <article className="cu2-article">
                {/* 헤더 — cat-badge(5C-2 공유) + 제목 + 작성자/메타 */}
                <header className="cu2-article__head">
                  <div className="cu2-article__badges">
                    {/* 카테고리 배지 — data-cat 으로 색상 분기 (5C-2 cat-badge 재사용) */}
                    <span className="cat-badge" data-cat={categoryKey}>{categoryLabel}</span>
                  </div>
                  <h1 className="cu2-article__title">{decodeHtmlEntities(post.title)}</h1>

                  <div className="cu2-article__meta">
                    {/* 작성자 — 시안 comm-author 톤(5C-2 공유). 이미지/이니셜 분기는 운영 데이터 보존 */}
                    <span className="comm-author">
                      {post.users?.profile_image_url ? (
                        <Image
                          src={post.users.profile_image_url}
                          alt={post.users.nickname ?? ""}
                          width={28}
                          height={28}
                          className="comm-author__av"
                          style={{ width: 28, height: 28, objectFit: "cover" }}
                        />
                      ) : (
                        // 이니셜 박스 — cafe-blue 톤
                        <span className="comm-author__av" style={{ width: 28, height: 28, fontSize: 12 }}>
                          {displayNickname.charAt(0)}
                        </span>
                      )}
                      <span className="comm-author__name">{decodeHtmlEntities(displayNickname)}</span>
                    </span>
                    <span className="cu2-article__meta-sep">·</span>
                    <span>{formatRelativeTime(post.created_at)}</span>
                    <span className="cu2-article__meta-sep">·</span>
                    {/* 조회 / 좋아요 / 댓글 — Material Symbols (시안 그대로) */}
                    <span className="cu2-article__meta-stat" title="조회수">
                      <span className="ico material-symbols-outlined">visibility</span>
                      {viewsCount.toLocaleString()}
                    </span>
                    <span className="cu2-article__meta-stat" title="좋아요수">
                      <span className="ico material-symbols-outlined">favorite</span>
                      {likesCount}
                    </span>
                    <span className="cu2-article__meta-stat" title="댓글수">
                      <span className="ico material-symbols-outlined">chat_bubble</span>
                      {totalCommentsCount}
                    </span>

                    {/* 본인 게시글 = 수정/삭제 (기존 PostActions 그대로 보존) */}
                    {isPostOwner && (
                      <span style={{ marginLeft: 4 }}>
                        <PostActions postPublicId={id} />
                      </span>
                    )}
                  </div>
                </header>

                {/* CU2-B — body. 알기자 linkify/Hero/갤러리 로직 100% 보존, 래퍼만 시안 클래스로 교체.
                    D3: DB block type 미지원 → 줄바꿈 split <p> 그대로 */}
                <div className="cu2-article__body">
                  {/* Hero 사진 — 알기자 게시물 + 사진 1장 이상 시 본문 위 (보존) */}
                  {isAlkijaPost && newsPhotos.length > 0 && (
                    <div style={{ margin: "0 0 20px" }}>
                      <NewsPhotoHero photos={newsPhotos} />
                    </div>
                  )}

                  {/* 본문 (보존) */}
                  {isAlkijaPost && linkifyEntries.length > 0 ? (
                    <LinkifyNewsBody
                      content={decodeHtmlEntities(post.content) ?? ""}
                      entries={linkifyEntries}
                    />
                  ) : (
                    decodeHtmlEntities(post.content)?.split("\n").map((line, i) => (
                      <p key={i} className="cu2-article__p">{line}</p>
                    ))
                  )}

                  {/* 갤러리 — Hero 외 사진 grid (보존) */}
                  {isAlkijaPost && newsPhotos.length > 1 && (
                    <div style={{ margin: "20px 0 0" }}>
                      <NewsPhotoGallery photos={newsPhotos} excludeHero />
                    </div>
                  )}
                </div>

                {/* CU2-C — Reactions. 운영 LikeButtonV2/ShareButtonV2(실동작)는 그대로 보존.
                    시안 cu2-like는 mock onClick이므로 운영 실동작 컴포넌트 우선.
                    신고 = A2 lock(hide) → disabled "준비 중" / 스크랩 = DB 미지원 disabled */}
                <div className="cu2-react">
                  {/* 좋아요 — v2 박제 (데이터 로직 100% 보존) */}
                  <LikeButtonV2
                    postPublicId={id}
                    initialLiked={isLiked}
                    initialCount={likesCount}
                    isLoggedIn={isLoggedIn}
                  />
                  {/* 공유 — v2 박제 */}
                  <ShareButtonV2 />
                  {/* 스크랩 — DB 미지원 → disabled "준비 중" */}
                  <button
                    disabled
                    title="스크랩 준비 중"
                    className="cu2-share"
                    style={{ cursor: "not-allowed", opacity: 0.55 }}
                  >
                    <span className="ico material-symbols-outlined">bookmark</span>
                    스크랩
                  </button>
                  {/* 신고 — A2 lock(hide) → disabled "준비 중" (DB 신고 모델 미연동) */}
                  <button
                    disabled
                    title="신고 준비 중"
                    className="cu2-share"
                    style={{ cursor: "not-allowed", opacity: 0.55 }}
                  >
                    <span className="ico material-symbols-outlined">flag</span>
                    신고
                  </button>
                </div>

                {/* CU2 Nav — 이전/다음 글 (D4: DB 쿼리 추가 X → placeholder "준비 중") */}
                <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
                  <div
                    style={{
                      flex: 1,
                      padding: "14px 18px",
                      borderRight: "1px solid var(--border)",
                      fontSize: 13,
                      color: "var(--ink-dim)",
                    }}
                    title="준비 중"
                  >
                    ← 이전글: 준비 중
                  </div>
                  <div
                    style={{
                      flex: 1,
                      padding: "14px 18px",
                      fontSize: 13,
                      color: "var(--ink-dim)",
                      textAlign: "right",
                    }}
                    title="준비 중"
                  >
                    다음글: 준비 중 →
                  </div>
                </div>
              </article>

              {/* CU2-D — 댓글. 기존 CommentForm/CommentList 그대로(A1 실데이터).
                  시안 .cu2-comments 래퍼 톤만 적용 */}
              <section className="cu2-comments">
                <div className="cu2-comments__h">
                  <h3 className="cu2-comments__h-t">댓글</h3>
                  <span className="cu2-comments__h-n">{totalCommentsCount}</span>
                </div>

                {/* 댓글 입력 — 기존 컴포넌트 그대로 (D6) */}
                <CommentForm postId={id} />

                {/* 댓글 리스트 — DB 댓글 + 카페 댓글 합산 (D7, 보존) */}
                <div style={{ marginTop: 18 }}>
                  <CommentList
                    comments={[
                      // 카페 댓글 (크롤링 원본 — 먼저 표시, HTML entity 디코드 적용)
                      ...cafeComments.map((c, i) => ({
                        id: `cafe-${i}`,
                        userId: "",
                        content: decodeHtmlEntities(c.text),
                        likesCount: 0,
                        createdAt: c.date || "",
                        isPostAuthor: false,
                        nickname: decodeHtmlEntities(c.nickname) || "익명",
                        profileImage: null as string | null,
                        isReply: c.is_reply,
                      })),
                      // DB 댓글 (사이트에서 직접 작성)
                      ...comments
                        .filter((c) => c.status !== "deleted")
                        .map((c) => ({
                          id: c.id.toString(),
                          userId: c.user_id.toString(),
                          content: c.content,
                          likesCount: c.likes_count,
                          createdAt: c.created_at.toISOString(),
                          isPostAuthor: c.user_id === post.user_id,
                          nickname: c.users?.nickname ?? "익명",
                          profileImage: c.users?.profile_image_url ?? null,
                        })),
                    ]}
                    postPublicId={id}
                    currentUserId={currentUserId}
                  />
                </div>
              </section>
            </main>

            {/* CU2-E — sidebar. 시안 추천(작성자 다른 글/카테고리 다른 글)은 mock 추가쿼리 필요 → A4 lock·mock 0 → hide.
                기존 PostDetailSidebar(실데이터: 작성자 카드/실시간 인기글/이벤트)는 그대로 우측 컬럼 배치 */}
            <aside className="cu2-side">
              <PostDetailSidebar
                authorId={post.user_id}
                authorNickname={displayNickname}
                authorImage={post.users?.profile_image_url ?? null}
                isFollowing={isFollowing}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
              />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
