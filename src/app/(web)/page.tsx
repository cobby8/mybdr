import type { Metadata } from "next";

// SEO: 홈 페이지 메타데이터
export const metadata: Metadata = {
  title: "MyBDR | 농구 매칭 플랫폼",
  description: "픽업 게임, 팀 대결, 대회까지 — 농구인을 위한 올인원 매칭 플랫폼",
};

/* ============================================================
 * 홈페이지 — BDR v2 디자인 적용 (Phase 1)
 *
 * 레이아웃 (v2 Home.jsx 시안 기준 — 5/9 Phase 1 A: HomeHeader 추가 후 8섹션):
 * 1. HomeHeader — eyebrow + h1 + 통계 1줄 + 검색/모집글 작성 CTA  ⭐ 5/9 Phase 1 A
 *    └ 시안 Home.jsx line 43~75 박제 (server component / props: members, onlineNow)
 * 2. HeroCarousel — 4종 슬라이드(대회/게임/MVP/정적) 자동회전 카로셀
 *    └ prefetchHeroSlides()가 데이터 0건이어도 정적 fallback 1개 보장
 * 3. MySummaryHero — 개인화 hero (4 카드 슬라이드)        ⭐ 5/9 P0 부활
 *    └ /api/web/profile + /api/web/profile/stats (비로그인=EmptyCard CTA)
 * 4. RecommendedGames — 추천/인기 경기 (가로 스크롤 캐러셀)  ⭐ 5/9 P0 부활
 *    └ /api/web/recommended-games (비로그인=일반 "추천 경기" 제목)
 * 5. RecommendedVideos — BDR 추천 유튜브 영상 (NBA 2K 스타일)  (5/9 1차 부활)
 * 6. 2컬럼 grid
 *    - CardPanel "공지·인기글" : prefetchCommunity 상위 5건 → HotPostRow
 *    - CardPanel "열린 대회"   : prefetchOpenTournaments → TournamentRow
 * 7. "방금 올라온 글" 섹션 : prefetchCommunity 상위 10건 → BoardRow
 * 8. StatsStrip — 4열 통계 (전체회원/지금접속/누적경기/활동팀) ⭐ 5/9 최하단 이동
 *    └ 시안 CommunityPulse(사이드바) → 모바일 stack 시 본문 아래 패턴 매핑
 *
 * 5/9 P0 부활 사유: BDR v2 Phase 1 (2026-04-24 d6bc22c) 일괄 제거 후
 * 시안에 있는 핵심 매치 매칭 가치 (개인화 + 추천 경기) 가 운영에서 빠진 상태.
 * 컴포넌트 + API 라우트 모두 살아있음 → page.tsx import 만 추가.
 * 나머지 components/home/* 파일은 미사용 상태로 보존 (삭제하지 않음).
 *
 * API/DB/route.ts 변경 없음. 서비스 레이어(home.ts)에 prefetchOpenTournaments
 * 추가만 있음. Promise.allSettled로 부분 실패 허용.
 * 5/9 부활 3 컴포넌트 (MySummaryHero / RecommendedGames / RecommendedVideos)
 * 모두 "use client" + useSWR 자체 fetch → SSR prefetch 영향 0.
 * ============================================================ */

// 왜 PromoCard 제거: 단일 promo 영역을 4종 슬라이드 카로셀로 교체 (4단계).
// PromoCard 컴포넌트 파일 자체는 무수정 보존 — 다른 페이지에서 재사용 가능성.
import { getWebSession } from "@/lib/auth/web-session";
import { HeroCarousel } from "@/components/bdr-v2/hero-carousel";
// 2026-05-09 Phase 1 A — 시안 Home.jsx line 43~75 박제 (eyebrow + h1 + CTA 2개 + 통계 1줄)
// server component / props 만 받음 → DB 추가 패칭 0 (statsData 재활용).
import { HomeHeader } from "@/components/bdr-v2/home-header";
import { StatsStrip } from "@/components/bdr-v2/stats-strip";
import { BoardRow } from "@/components/bdr-v2/board-row";
import { HotPostRow } from "@/components/bdr-v2/hot-post-row";
import { TournamentRow } from "@/components/bdr-v2/tournament-row";
import { CardPanel } from "@/components/bdr-v2/card-panel";
// 2026-05-04 가입 흐름 통합 (F5): 가입 직후 미완성 사용자 대상 CTA 카드.
// useSWR("/api/web/me") 자체 fetch + localStorage 7일 dismiss → server component 영향 0.
import { ProfileCtaCard } from "@/components/home/profile-cta-card";
// 2026-05-09 RecommendedVideos 부활: NBA 2K 스타일 헤더 ("HIGHLIGHTS") + useSWR
// /api/web/youtube/recommend (Redis cache + cron warming) 자체 패칭 → server prefetch 무관.
import { RecommendedVideos } from "@/components/home/recommended-videos";
// 2026-05-09 P0 부활: BDR v2 Phase 1 (2026-04-24 d6bc22c) 에서 빠졌던 시안 핵심 컴포넌트 2종.
// 둘 다 "use client" + useSWR 자체 패칭 → server prefetch 무관.
// MySummaryHero: /api/web/profile + /api/web/profile/stats (비로그인 = EmptyCard CTA)
// RecommendedGames: /api/web/recommended-games (비로그인 = userName null → "추천 경기" 일반 제목)
import { MySummaryHero } from "@/components/home/my-summary-hero";
import { RecommendedGames } from "@/components/home/recommended-games";
import {
  prefetchStats,
  prefetchCommunity,
  prefetchOpenTournaments,
  prefetchHeroSlides,
} from "@/lib/services/home";

/* 2026-05-02: 사용자별 hero 슬라이드 (대회 0건 시 fallback) 위해 dynamic 으로 변경.
   대회 진행 중일 때는 unstable_cache 가 60초 캐시 → 사용자별 분기는 거의 없으나,
   비로그인/로그인 분기 위해 SSG/ISR 비활성. */
export const dynamic = "force-dynamic";

/* -- 유틸: ISO 날짜 → "MM-DD" 짧은 포맷 (BoardRow의 date 컬럼용) -- */
function formatShortDate(iso: string | null): string {
  if (!iso) return "";
  // "2026-04-22T..." → "04-22"
  return iso.slice(5, 10);
}

/* -- 유틸: 24시간 이내 작성 여부 (NEW 뱃지 표시용) -- */
function isWithin24h(iso: string | null): boolean {
  if (!iso) return false;
  const diff = Date.now() - new Date(iso).getTime();
  return diff >= 0 && diff < 24 * 60 * 60 * 1000;
}

/* -- 유틸: 카테고리 코드 → 한글 라벨 매핑 (기존 community 규약과 맞춤) -- */
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

/* -- 유틸: 대회 상태 코드 → TournamentRow level 약어 (좌측 accent 블록용) --
 * 왜: v2 Home.jsx 시안의 "열린 대회" 좌측 54×54 accent 블록은 4~5자 영문
 * 약어로 상태를 보여줌. status 원코드를 그대로 쓰면 너무 길어지므로 매핑. */
function tournamentLevelLabel(status: string | null): string {
  if (status === "registration") return "OPEN";
  if (status === "in_progress") return "LIVE";
  return "INFO";
}

/* -- 유틸: 인덱스 → accent 색상 로테이션 --
 * PM 지정 3색 순환. 4번째 이상은 다시 0번부터 반복 (시안의 시각 리듬 유지).
 * CSS 변수가 없는 환경을 대비해 #f59e0b / #0ea5e9은 리터럴 fallback 제공. */
const TOURNAMENT_ACCENTS = [
  "var(--accent)",
  "#f59e0b",
  "var(--accent-2, #0ea5e9)",
] as const;
function tournamentAccent(idx: number): string {
  return TOURNAMENT_ACCENTS[idx % TOURNAMENT_ACCENTS.length];
}

export default async function HomePage() {
  // 2026-05-02: 사용자별 hero 슬라이드 위해 session 조회 (login 사용자만 내경기 fallback)
  const session = await getWebSession().catch(() => null);
  const userId = session ? BigInt(session.sub) : undefined;

  // 4개 데이터를 병렬 프리페치 — 하나 실패해도 나머지는 정상 반영
  const [statsResult, communityResult, tournamentsResult, heroResult] =
    await Promise.allSettled([
      prefetchStats(),
      prefetchCommunity(),
      prefetchOpenTournaments(),
      prefetchHeroSlides(userId), // 진행 중 대회 우선 + 대회 0건 시 사용자 슬라이드
    ]);

  // 성공한 결과만 추출 (실패 시 undefined → 빈 상태 fallback)
  const statsData =
    statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const communityData =
    communityResult.status === "fulfilled" ? communityResult.value : undefined;
  const tournamentsData =
    tournamentsResult.status === "fulfilled"
      ? tournamentsResult.value
      : undefined;
  // hero 슬라이드: prefetchHeroSlides 내부에서 정적 fallback 1개를 항상 보장하므로
  // rejected 시에만 빈 배열. 빈 배열이면 카로셀 렌더 skip.
  const heroSlides = heroResult.status === "fulfilled" ? heroResult.value : [];

  // 공지·인기글: prefetchCommunity 상위 5건 (DB에 별도 "인기" 플래그가 없으므로
  // 최신 정렬 기준 상위 5건을 공지/인기 섹션에 매핑. 추후 likes 기준 정렬 가능)
  const hotPosts = communityData?.posts?.slice(0, 5) ?? [];

  // 방금 올라온 글: prefetchCommunity 상위 10건
  const latestPosts = communityData?.posts?.slice(0, 10) ?? [];

  // 열린 대회 리스트: 최대 5개 (공지·인기글과 높이 맞춤)
  const openTournaments = tournamentsData?.tournaments?.slice(0, 5) ?? [];

  return (
    // page: v2 globals.css의 .page 쉘 — max-width + 중앙 정렬 + 기본 상하 여백
    // (이전 "pb-10"은 좌우 maxw/gutter 제한이 없어 콘텐츠가 전폭으로 퍼져 시안과 어긋났음)
    <div className="page">
      {/* 0. 프로필 완성 CTA — Hero 카로셀 위 최상단 배치
       * 이유: 가입 흐름 1-step 단순화 (F1) 결과 신규 가입자는 포지션/지역/실력 미입력.
       *      Hero 보다 위에 두어 가장 먼저 시야에 노출 + 완성 후 X 닫기 시 7일 억제.
       *      비로그인 / 이미 완성 / dismiss 시 자체적으로 null 반환 (조건부 렌더). */}
      <ProfileCtaCard />

      {/* 1. HomeHeader — eyebrow + h1 + 통계 1줄 + CTA 2개 (5/9 Phase 1 A)
       * 시안 Home.jsx line 43~75 박제. server component / props 만 사용.
       * onlineNow 는 DB 실시간 카운트 미보유 → null 전달 시 컴포넌트 내부에서
       * "지금 접속 중" 부분 자동 생략 (placeholder 가짜 숫자 띄우지 않음). */}
      <HomeHeader members={statsData?.user_count ?? 0} onlineNow={null} />

      {/* 2. Hero 카로셀 — 4종 슬라이드(대회/게임/MVP/정적) 자동회전 5초 간격
       * prefetchHeroSlides가 정적 fallback 1개를 항상 보장하지만, 만일의 rejected
       * 케이스(heroSlides=[])에 대비해 length>0 가드 추가. */}
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      {/* 3. MySummaryHero — 개인화 hero (4 카드 슬라이드) ⭐ 5/9 P0 부활
       * HeroCarousel 직후 배치 — 사용자 개인화 흐름 (글로벌 hero → 내 hero).
       * 컴포넌트 자체가 헤더 없이 카드 슬라이드만 렌더 → CardPanel 래퍼 없이 직접 렌더.
       * 비로그인 사용자: 컴포넌트 내부 분기로 EmptyCard(CTA) 자동 노출. */}
      <section style={{ marginTop: 24 }}>
        <MySummaryHero />
      </section>

      {/* 4. RecommendedGames — 추천/인기 경기 (가로 스크롤 캐러셀) ⭐ 5/9 P0 부활
       * 컴포넌트 자체 TossSectionHeader ("추천 경기" / 비로그인=일반) 보유 →
       * CardPanel 래퍼 없이 직접 렌더 (RecommendedVideos 패턴 동일).
       * /api/web/recommended-games 자체 패칭 → SSR prefetch 무관.
       * 비로그인: user_name null → 헤더 "추천 경기" 일반 제목 + fallback 카드 4개. */}
      <section style={{ marginTop: 24 }}>
        <RecommendedGames />
      </section>

      {/* 5. RecommendedVideos — BDR 추천 유튜브 영상 (NBA 2K 스타일) (5/9 1차 부활)
       * 컴포넌트 자체 "HIGHLIGHTS" 헤더 보유 → CardPanel 래퍼 없이 직접 렌더.
       * useSWR 클라이언트 패칭이라 server component prefetch 영향 0.
       * marginTop:24 으로 StatsStrip 과 BDR v2 다른 섹션과 동일 간격. */}
      <section style={{ marginTop: 24 }}>
        <RecommendedVideos />
      </section>

      {/* 6. 2컬럼 그리드 — 공지·인기글 + 열린 대회 (모바일 1열) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 공지·인기글 패널 — HotPostRow 방식 (시안 3열 grid 간략 리스트)
         * v2 Home.jsx L44~53 HOT_POSTS 구조: 56px 배지 / 1fr 제목 / auto 조회수.
         * "방금 올라온 글"의 풀 테이블(6열)과 정보 밀도가 달라 별도 컴포넌트 사용. */}
        <CardPanel
          title="공지 · 인기글"
          moreHref="/community"
          noPadding
        >
          {hotPosts.length === 0 ? (
            <div
              style={{
                padding: "28px 18px",
                textAlign: "center",
                color: "var(--ink-dim)",
                fontSize: 13,
              }}
            >
              아직 게시글이 없습니다.
            </div>
          ) : (
            // 외부 `.board` 래퍼 불필요 — HotPostRow가 자체 grid 소유
            <div>
              {hotPosts.map((post) => (
                <HotPostRow
                  key={post.id}
                  category={communityCategoryLabel(post.category)}
                  title={post.title}
                  commentsCount={post.comments_count}
                  views={post.view_count}
                  /* 공지 카테고리만 red 배지로 강조 — 시안 매칭 */
                  isNotice={post.category === "notice"}
                  href={`/community/${post.public_id ?? post.id}`}
                />
              ))}
            </div>
          )}
        </CardPanel>

        {/* 열린 대회 패널 — TournamentRow 방식 (시안 3-column 카드형)
         * BoardRow의 6열 테이블과 달리, 좌측 54×54 accent 블록 + 중앙 본문 +
         * 우측 LIVE 배지 구조. 인덱스별 accent 색상 로테이션 적용. */}
        <CardPanel title="열린 대회" moreHref="/tournaments" noPadding>
          {openTournaments.length === 0 ? (
            <div
              style={{
                padding: "28px 18px",
                textAlign: "center",
                color: "var(--ink-dim)",
                fontSize: 13,
              }}
            >
              접수중인 대회가 없습니다.
            </div>
          ) : (
            <div style={{ padding: "0 14px" }}>
              {openTournaments.map((tournament, idx) => {
                // 부제(meta) 구성: 장소 · 날짜 · 접수현황을 " · "로 연결
                const metaParts = [
                  tournament.venue_name || tournament.city,
                  tournament.start_date
                    ? new Date(tournament.start_date).toLocaleDateString(
                        "ko-KR",
                        { month: "numeric", day: "numeric" }
                      )
                    : null,
                  tournament.max_teams
                    ? `${tournament.team_count}/${tournament.max_teams}팀`
                    : `${tournament.team_count}팀`,
                ].filter(Boolean);

                return (
                  <TournamentRow
                    key={tournament.id}
                    accent={tournamentAccent(idx)}
                    level={tournamentLevelLabel(tournament.status)}
                    title={tournament.name}
                    edition={
                      tournament.edition_number
                        ? `Vol.${tournament.edition_number}`
                        : undefined
                    }
                    meta={metaParts.join(" · ")}
                    status={tournament.status ?? ""}
                    href={`/tournaments/${tournament.id}`}
                  />
                );
              })}
            </div>
          )}
        </CardPanel>
      </div>

      {/* 7. 방금 올라온 글 — 별도 섹션, 위 그리드와 24px 간격 */}
      <section style={{ marginTop: 24 }}>
        {/* 섹션 헤더 — CardPanel과 다른 자유 형태 (시안 재현) */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
            방금 올라온 글
          </h3>
          <a href="/community" style={{ fontSize: 12 }}>
            전체 보기 ›
          </a>
        </div>

        {/* .board 풀 스타일 테이블 — 헤더 행 포함 */}
        {latestPosts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "32px 18px",
              textAlign: "center",
              color: "var(--ink-dim)",
              fontSize: 13,
            }}
          >
            아직 게시글이 없습니다.
          </div>
        ) : (
          <div className="board">
            {/* 테이블 헤더 — .board__head 그리드 컬럼과 동일 */}
            <div className="board__head">
              <div>번호</div>
              <div>제목</div>
              <div>게시판</div>
              <div>작성자</div>
              <div>날짜</div>
              <div>조회</div>
            </div>
            {latestPosts.map((post, idx) => (
              /* categoryBadge prop 제거 이유: BoardRow의 3열(게시판 이름)에
               * 이미 카테고리 라벨이 표시되므로 제목 앞 배지는 중복 표시.
               * 시안도 "방금 올라온 글"은 테이블 한 줄(배지 없음) 스타일 */
              <BoardRow
                key={post.id}
                num={idx + 1}
                title={post.title}
                board={communityCategoryLabel(post.category)}
                author={post.author_nickname}
                date={formatShortDate(post.created_at)}
                views={post.view_count}
                commentsCount={post.comments_count}
                isNew={isWithin24h(post.created_at)}
                href={`/community/${post.public_id ?? post.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* 8. StatsStrip — 통계 4열 (시안 CommunityPulse 사이드바 → 모바일 최하단 매핑)
       * 5/9 위치 변경: HeroCarousel 직후 → page 최하단.
       * 이유: 시안 Home.jsx 의 CommunityPulse(line 176)가 우측 사이드바 안에 있고
       *       모바일에서 home__split { 1열 stack } 으로 본문 아래로 떨어지는 패턴 매핑.
       * 지금 접속자 수는 DB에 실시간 카운트가 없어 placeholder "-" 표시 */}
      <section style={{ marginTop: 24 }}>
        <StatsStrip
          items={[
            { label: "전체 회원", value: statsData?.user_count ?? 0 },
            { label: "지금 접속", value: "-" },
            { label: "누적 경기", value: statsData?.match_count ?? 0 },
            { label: "활동 팀", value: statsData?.team_count ?? 0 },
          ]}
        />
      </section>
    </div>
  );
}
