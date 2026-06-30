import type { Metadata } from "next";
import Link from "next/link";

// SEO: 홈 페이지 메타데이터
export const metadata: Metadata = {
  title: "MyBDR | 농구 매칭 플랫폼",
  description: "픽업 게임, 팀 대결, 대회까지 — 농구인을 위한 올인원 매칭 플랫폼",
};

/* ============================================================
 * 홈페이지 — BDR PUB-1 박제 (2026-06-30)
 *
 * 시안 정본: Dev/design/BDR-current/screens/Home.jsx
 * 레이아웃:
 *   1. Hero 헤더 — eyebrow + h1 + 부제(통계) + 우측 CTA
 *   2. LiveChipRow — 진행 중 라이브 매치 (0건이면 hide)
 *   3. ProfileCtaCard — 프로필 미완성 CTA (비로그인/완성 시 null)
 *   4. HeroBento — 좌(HeroCarousel) / 우(빠른 진입 2×2 grid)
 *   5. RecommendedVideos — BDR 추천 유튜브 영상
 *   6. RecommendedRail "열린 대회" — openTournaments 가로 스크롤
 *   7. home__split 2컬럼
 *      - 좌: home__notice-pop (공지 + 인기글) + HomeBoardFeed (탭 필터)
 *      - 우: home__aside (ProfileWidget + CommunityPulse)
 *
 * 데이터 패칭: prefetchStats / prefetchCommunity / prefetchOpenTournaments
 *             prefetchHeroSlides / getLiveChips — 모두 기존 유지. 신규 fetch 0.
 * 셸(DualSideNav): 미터치 (PUB-0b 기가동 중).
 * ============================================================ */

import { getWebSession } from "@/lib/auth/web-session";
import { HeroCarousel } from "@/components/bdr-v2/hero-carousel";
import { LiveChipRow } from "@/components/bdr-v2/live-chip-row";
import { getLiveChips } from "@/lib/services/live-chips";
import { RecommendedRail } from "@/components/bdr-v2/recommended-rail";
import { ProfileWidget } from "@/components/home/profile-widget";
import { ProfileCtaCard } from "@/components/home/profile-cta-card";
import { RecommendedVideos } from "@/components/home/recommended-videos";
import { HomeBoardFeed } from "@/components/home/home-board-feed";
import {
  prefetchStats,
  prefetchCommunity,
  prefetchOpenTournaments,
  prefetchHeroSlides,
} from "@/lib/services/home";

export const dynamic = "force-dynamic";

/* -- 유틸: ISO 날짜 → "M월 D일" (대회 날짜 포맷) -- */
function formatKorDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

/* -- 유틸: 대회 status → 상태 라벨 + 배지 클래스 -- */
function tournamentStatusMeta(
  status: string | null
): { label: string; cls: string } {
  if (
    status === "in_progress" ||
    status === "live" ||
    status === "ongoing"
  )
    return { label: "진행중", cls: "badge--red" };
  if (
    status === "registration" ||
    status === "registration_open" ||
    status === "open" ||
    status === "active" ||
    status === "published"
  )
    return { label: "접수중", cls: "badge--ok" };
  if (
    status === "completed" ||
    status === "ended" ||
    status === "closed"
  )
    return { label: "종료", cls: "badge--ghost" };
  return { label: "예정", cls: "badge--soft" };
}

/* -- 유틸: 인덱스 → accent 색상 로테이션 (Poster 그라디언트용) -- */
const BENTO_ACCENTS = [
  "var(--accent)",
  "var(--cafe-blue-deep)",
  "var(--ok, #16a34a)",
] as const;
function tournamentAccent(idx: number): string {
  return BENTO_ACCENTS[idx % BENTO_ACCENTS.length];
}

/* -- 유틸: 카테고리 코드 → 한글 라벨 -- */
function communityCategoryLabel(category: string | null): string {
  if (!category) return "자유";
  const map: Record<string, string> = {
    free: "자유",
    notice: "공지",
    qna: "Q&A",
    match: "경기",
    team: "팀",
    tournament: "대회",
  };
  return map[category] ?? category;
}

/* ============================================================
 * TourneyMiniCard — 시안 Home.jsx L466~493 카피
 * openTournaments 가로 스크롤 카드 (Poster → CSS 그라디언트 대체)
 * ============================================================ */
function TourneyMiniCard({
  tournament,
  accent,
}: {
  tournament: {
    id: string;
    name: string;
    format?: string | null;
    edition_number?: number | null;
    status: string | null;
    start_date: string | null;
    venue_name: string | null;
    city: string | null;
    max_teams: number | null;
    team_count: number;
  };
  accent: string;
}) {
  const { label: statusLabel, cls: statusCls } = tournamentStatusMeta(
    tournament.status
  );
  const location = tournament.venue_name || tournament.city || "";
  const date = formatKorDate(tournament.start_date);
  const capacity = tournament.max_teams
    ? `${tournament.team_count}/${tournament.max_teams}팀`
    : `${tournament.team_count}팀`;

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        textDecoration: "none",
        height: "100%",
        scrollSnapAlign: "start",
      }}
    >
      {/* Poster 대체: CSS 그라디언트 110px */}
      <div
        style={{
          height: 110,
          background: `linear-gradient(135deg, ${accent}, ${accent}AA 60%, var(--bg-elev))`,
          display: "flex",
          alignItems: "flex-end",
          padding: "10px 14px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 16,
            color: "#fff",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textShadow: "0 1px 3px rgba(0,0,0,.4)",
          }}
        >
          {tournament.name}
        </span>
      </div>

      {/* 바디 */}
      <div
        style={{
          padding: "12px 14px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span className={`badge ${statusCls}`}>{statusLabel}</span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--ff-mono)",
              color: "var(--ink-dim)",
              marginLeft: "auto",
            }}
          >
            {capacity}
          </span>
        </div>
        {(location || date) && (
          <div
            style={{
              fontSize: 12,
              color: "var(--ink-mute)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {[location, date].filter(Boolean).join(" · ")}
          </div>
        )}
        {tournament.format && (
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
              marginTop: "auto",
            }}
          >
            {tournament.format}
          </div>
        )}
      </div>
    </Link>
  );
}

/* ============================================================
 * HomeNoticeCard — 시안 Home.jsx L530~578 (NoticeCard) 카피
 * 공지사항 목록 (category=notice 우선, 없으면 최신글 대체)
 * ============================================================ */
function HomeNoticeCard({
  posts,
}: {
  posts: Array<{
    id: string;
    public_id: string | null;
    title: string;
    category: string | null;
    created_at: string | null;
  }>;
}) {
  const notices = posts.filter((p) => p.category === "notice").slice(0, 4);
  // 공지 없으면 최신 글 4건으로 대체 (Empty State 방지)
  const items = notices.length > 0 ? notices : posts.slice(0, 4);

  return (
    <section
      className="card"
      style={{ padding: 0, display: "flex", flexDirection: "column" }}
    >
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 14,
              background: "var(--accent)",
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 14 }}>공지사항</span>
        </div>
        <Link
          href="/community?category=notice"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            textDecoration: "none",
          }}
        >
          전체 보기 →
        </Link>
      </header>
      <div style={{ flex: 1 }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              color: "var(--ink-dim)",
              fontSize: 13,
            }}
          >
            공지사항이 없습니다.
          </div>
        ) : (
          items.map((p, i) => (
            <Link
              key={p.id}
              href={`/community/${p.public_id ?? p.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "10px 16px",
                borderBottom:
                  i < items.length - 1 ? "1px solid var(--border)" : "none",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 6px",
                  background:
                    p.category === "notice"
                      ? "var(--accent)"
                      : "var(--bg-alt)",
                  color:
                    p.category === "notice" ? "#fff" : "var(--ink-mute)",
                  borderRadius: 3,
                  letterSpacing: ".04em",
                  flex: "0 0 auto",
                }}
              >
                {communityCategoryLabel(p.category)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.title}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontFamily: "var(--ff-mono)",
                  flex: "0 0 auto",
                }}
              >
                {p.created_at ? p.created_at.slice(5, 10) : ""}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * HomeHotPostsCard — 시안 Home.jsx L583~631 (HotPostsCard) 카피
 * 인기글 (최신순 상위 5건 매핑 — DB likes 정렬 없음)
 * ============================================================ */
function HomeHotPostsCard({
  posts,
}: {
  posts: Array<{
    id: string;
    public_id: string | null;
    title: string;
    comments_count: number;
    view_count: number;
  }>;
}) {
  const hotPosts = posts.slice(0, 5);

  return (
    <section
      className="card"
      style={{ padding: 0, display: "flex", flexDirection: "column" }}
    >
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 14,
              background: "var(--cafe-blue)",
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 14 }}>인기글</span>
        </div>
        <Link
          href="/community"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            textDecoration: "none",
          }}
        >
          전체 보기 →
        </Link>
      </header>
      <div style={{ flex: 1 }}>
        {hotPosts.length === 0 ? (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              color: "var(--ink-dim)",
              fontSize: 13,
            }}
          >
            아직 게시글이 없습니다.
          </div>
        ) : (
          hotPosts.map((p, i) => (
            <Link
              key={p.id}
              href={`/community/${p.public_id ?? p.id}`}
              style={{
                display: "grid",
                gridTemplateColumns: "18px 1fr auto",
                gap: 10,
                alignItems: "center",
                padding: "10px 16px",
                borderBottom:
                  i < hotPosts.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                color: "var(--ink)",
                textDecoration: "none",
              }}
            >
              {/* 순위 번호 */}
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: 11,
                  fontWeight: 800,
                  color: i < 3 ? "var(--accent)" : "var(--ink-dim)",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </span>
              {/* 제목 */}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: i < 3 ? 600 : 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.title}
                {p.comments_count > 0 && (
                  <span
                    style={{
                      color: "var(--accent)",
                      fontWeight: 700,
                      fontSize: 11,
                      marginLeft: 4,
                    }}
                  >
                    [{p.comments_count}]
                  </span>
                )}
              </span>
              {/* 조회수 */}
              <span
                style={{
                  fontSize: 11,
                  color: "var(--ink-dim)",
                  fontFamily: "var(--ff-mono)",
                  flex: "0 0 auto",
                }}
              >
                {p.view_count > 999
                  ? `${(p.view_count / 1000).toFixed(1)}k`
                  : p.view_count}
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * HomeCommunityPulse — 시안 Home.jsx L828~857 (CommunityPulse) 카피
 * 사이드바 통계 2×2 위젯
 * ============================================================ */
function HomeCommunityPulse({
  stats,
}: {
  stats:
    | { user_count: number; match_count: number; team_count: number }
    | undefined;
}) {
  const items: [string, string][] = [
    ["전체 회원", (stats?.user_count ?? 0).toLocaleString()],
    ["지금 접속", "-"],
    ["누적 경기", (stats?.match_count ?? 0).toLocaleString()],
    ["활동 팀", (stats?.team_count ?? 0).toLocaleString()],
  ];

  return (
    <section className="card" style={{ padding: "14px 16px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--ink-dim)",
          marginBottom: 10,
        }}
      >
        커뮤니티 펄스
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
      >
        {items.map(([k, v]) => (
          <div
            key={k}
            style={{
              padding: "10px 12px",
              background: "var(--bg-alt)",
              borderRadius: "var(--radius-chip)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--ff-mono)",
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              {v}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                letterSpacing: ".04em",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              {k}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * HomePage — 메인 서버 컴포넌트
 * ============================================================ */
export default async function HomePage() {
  // 로그인 세션 (사용자별 hero 슬라이드 분기용)
  const session = await getWebSession().catch(() => null);
  const userId = session ? BigInt(session.sub) : undefined;

  // 5개 데이터 병렬 프리페치 — 하나 실패해도 나머지 정상 반영
  const [
    statsResult,
    communityResult,
    tournamentsResult,
    heroResult,
    liveResult,
  ] = await Promise.allSettled([
    prefetchStats(),
    prefetchCommunity(),
    prefetchOpenTournaments(),
    prefetchHeroSlides(userId),
    getLiveChips(),
  ]);

  const statsData =
    statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const communityData =
    communityResult.status === "fulfilled" ? communityResult.value : undefined;
  const tournamentsData =
    tournamentsResult.status === "fulfilled"
      ? tournamentsResult.value
      : undefined;
  const heroSlides =
    heroResult.status === "fulfilled" ? heroResult.value : [];
  const liveChips =
    liveResult.status === "fulfilled" ? liveResult.value : [];

  // 게시글 데이터 분배
  const allPosts = communityData?.posts ?? [];
  const noticePanelPosts = allPosts.slice(0, 8); // 공지+인기글 패널용
  const latestPosts = allPosts.slice(0, 10);      // HomeBoardFeed

  // 열린 대회 (RecommendedRail, 최대 6개)
  const openTournaments = tournamentsData?.tournaments?.slice(0, 6) ?? [];

  // HeroBento 우측 빠른 진입 항목 (시안 Home.jsx L246~264)
  const quickLinks = [
    { href: "/games", icon: "sports_basketball", label: "경기 찾기" },
    { href: "/courts", icon: "location_on", label: "코트 찾기" },
    { href: "/teams", icon: "groups", label: "팀 찾기" },
    { href: "/rankings", icon: "emoji_events", label: "랭킹" },
  ] as const;

  return (
    <div className="page home">

      {/* ======================================================
          1. Hero 헤더 — 시안 Home.jsx L32~61
          ====================================================== */}
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">전국 농구 매칭 플랫폼</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontFamily: "var(--ff-display)",
              fontSize: "var(--fs-h1, 32px)",
              fontWeight: 800,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            오늘도{" "}
            <span style={{ color: "var(--accent)" }}>코트</span>에서 만나요
          </h1>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            전국 {(statsData?.user_count ?? 0).toLocaleString()}명의 플레이어
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "0 0 auto",
          }}
        >
          <Link href="/search" className="btn btn--sm">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              search
            </span>{" "}
            검색
          </Link>
          <Link href="/games/new" className="btn btn--sm btn--accent">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 16 }}
            >
              add
            </span>{" "}
            모집글 작성
          </Link>
        </div>
      </header>

      {/* ======================================================
          2. LiveChipRow — 진행 중 라이브 매치
          Phase 2C UC2 / getLiveChips 공유 모듈
          ====================================================== */}
      <LiveChipRow items={liveChips} />

      {/* ======================================================
          3. ProfileCtaCard — 프로필 미완성 CTA
          비로그인 / 완성 / dismiss 시 null 반환
          ====================================================== */}
      <ProfileCtaCard />

      {/* ======================================================
          4. HeroBento — 시안 Home.jsx L170~275
          좌: HeroCarousel / 우: 빠른 진입 2×2 + 통계 바
          ====================================================== */}
      <div className="home__bento">
        {/* 좌 — HeroCarousel */}
        <div className="home__bento-main">
          {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}
        </div>

        {/* 우 — 빠른 진입 패널 */}
        <div className="card home__bento-panel" style={{ padding: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              flex: 1,
              padding: 8,
            }}
          >
            {quickLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-chip)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ink-soft)",
                  textDecoration: "none",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "var(--cafe-blue)", fontSize: 20 }}
                >
                  {icon}
                </span>
                {label}
              </Link>
            ))}
          </div>

          {/* 하단 통계 바 */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "12px 16px",
              display: "flex",
              gap: 16,
              background: "var(--bg-alt)",
            }}
          >
            {(
              [
                ["전체회원", (statsData?.user_count ?? 0).toLocaleString()],
                ["누적경기", (statsData?.match_count ?? 0).toLocaleString()],
                ["활동팀", (statsData?.team_count ?? 0).toLocaleString()],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} style={{ textAlign: "center", flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--ink)",
                    lineHeight: 1,
                  }}
                >
                  {v}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-dim)",
                    letterSpacing: ".04em",
                    textTransform: "uppercase",
                    marginTop: 3,
                  }}
                >
                  {k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================
          5. RecommendedVideos — BDR 추천 유튜브
          useSWR 자체 패칭 (신규 fetch 아님)
          ====================================================== */}
      <section style={{ marginTop: 24 }}>
        <RecommendedVideos />
      </section>

      {/* ======================================================
          6. RecommendedRail "열린 대회" — 시안 Home.jsx L95~103 카피
          openTournaments → TourneyMiniCard 가로 스크롤
          ====================================================== */}
      {openTournaments.length > 0 && (
        <RecommendedRail
          title="열린 대회"
          eyebrow="TOURNAMENTS"
          more={{ href: "/tournaments" }}
        >
          {openTournaments.map((t, idx) => (
            <TourneyMiniCard
              key={t.id}
              tournament={t}
              accent={tournamentAccent(idx)}
            />
          ))}
        </RecommendedRail>
      )}

      {/* ======================================================
          7. home__split 2컬럼 — 시안 Home.jsx L108~162
          좌: 공지+인기(notice-pop) + 방금올라온글
          우: aside (ProfileWidget + CommunityPulse)
          ====================================================== */}
      <div className="home__split">
        {/* 좌 — 본문 */}
        <div style={{ minWidth: 0 }}>
          {/* 공지 + 인기글 2분할 */}
          <div className="home__notice-pop">
            <HomeNoticeCard posts={noticePanelPosts} />
            <HomeHotPostsCard posts={noticePanelPosts} />
          </div>

          {/* 방금 올라온 글 — 탭 필터 (클라이언트 컴포넌트, 신규 fetch 0) */}
          <HomeBoardFeed posts={latestPosts} />
        </div>

        {/* 우 — 사이드바 */}
        <aside className="home__aside">
          {/* ProfileWidget: 로그인 시 게이미피케이션 / 비로그인 null */}
          <ProfileWidget />
          {/* CommunityPulse: 통계 4개 2×2 */}
          <HomeCommunityPulse stats={statsData} />
        </aside>
      </div>
    </div>
  );
}
