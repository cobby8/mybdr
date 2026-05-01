/* ============================================================
 * /profile — v2 본인 프로필 대시보드 (서버 컴포넌트)
 *
 * 왜 서버 컴포넌트로 전환:
 * - PM 지시: "서버 컴포넌트에서 Prisma 직접 호출 OK" (D-P2 timeline, D-P8 badges).
 * - 기존 "use client" + useSWR 3개(profile/gamification/stats) 구조는 API 라운드트립 +
 *   snake_case 변환을 거쳐야 해서 profile 응답 select 에 빠진 필드
 *   (gender / evaluation_rating / total_games_hosted) 를 가져오려면 API 수정이 필요.
 *   PM 규칙 "API/route.ts/Prisma 스키마 0 변경" → 페이지에서 Prisma 직접 호출이 유일한 해법.
 *
 * 어떻게:
 * - getWebSession 으로 세션 확보 → 비로그인은 로그인 유도 UI.
 * - Promise.all 로 7 쿼리 병렬 prefetch:
 *   1) user (필요 필드 전부 — bio, gender, evaluation_rating, total_games_hosted, xp 등)
 *   2) 소속 팀 (TeamMember + team 요약)
 *   3) 다음 경기 (game_applications + games scheduled_at > now)
 *   4) 승률/평균 (getPlayerStats)
 *   5) 알림 미확인 수 (notifications.count)
 *   6) 활동 타임라인 — community_posts 최근 5건
 *   7) 활동 타임라인 — game_applications 최근 5건
 *   8) user_badges 최신 4건
 * - 6+7은 클라이언트에서 merge + sort 후 상위 5건만 표시.
 *
 * 보안/규칙:
 * - 세션 userId 기반 본인 데이터만 조회 (IDOR 없음).
 * - BigInt → string 변환, Date → ISO 변환 모두 여기서 처리.
 * - Prisma 직접 호출이지만 서비스 레이어(getPlayerStats, getProfileLevelInfo) 재사용으로 중복 축소.
 * ============================================================ */

import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";
// Phase 12 §G: 모바일 백버튼 (사용자 보고 — 깊은 페이지 복귀 동선)
import { PageBackButton } from "@/components/shared/page-back-button";

// HeroCard import 제거 (2026-05-01 회귀 픽스) — 본문 상단 큰 Hero 배너로 대체
// 우측 aside HeroCard 와 중복 표시되어 사용자 캡처 20 보고 — 제거.
// SeasonStats import 제거 (v2.4 시안 캡처 26: 우측 aside 에 시즌스탯 통산 카드 없음).
//   본문 4 카드 안 "내 농구" 카드에 PPG/APG/RPG 표시로 대체.
import { UpcomingGames } from "./_v2/upcoming-games";
import { ActivityTimeline, type ActivityItem } from "./_v2/activity-timeline";
import { TeamSideCard } from "./_v2/team-side-card";
import { BadgesSideCard } from "./_v2/badges-side-card";
// v2.4 마이페이지 hub — Tier 1 큰 카드 4종 + Tier 2 quick 카드 4종 (의뢰서 §3-2)
import { MyPageHub, type HubTier1Slot } from "./_v2/mypage-hub";

// SSR 세션 기반 페이지 — 캐시 금지 (본인 데이터는 매 요청 최신)
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getWebSession();

  // 비로그인 → 로그인 유도 (기존 UX 유지)
  if (!session) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--ink-dim)", marginBottom: 16, display: "block" }}
          >
            person_off
          </span>
          <p style={{ marginBottom: 16, fontSize: 14, color: "var(--ink-mute)" }}>
            로그인이 필요합니다
          </p>
          <Link href="/login" className="btn btn--accent" style={{ display: "inline-block" }}>
            로그인
          </Link>
        </div>
      </div>
    );
  }

  const userId = BigInt(session.sub);
  const now = new Date();

  // ---- 병렬 prefetch (8 쿼리) ----
  const [
    user,
    teamMembers,
    nextGameApps,
    playerStats,
    unreadCount,
    recentPosts,
    recentApplications,
    userBadges,
  ] = await Promise.all([
    // 1) user 필수 필드 — profile API 보다 확장(gender/evaluation_rating/total_games_hosted/xp/subscription)
    //   v2.3: name_verified(Phase 12 추가) + preferred_jersey_number(시안 "#7")
    prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          nickname: true,
          profile_image_url: true,
          position: true,
          city: true,
          district: true,
          height: true,
          weight: true,
          bio: true,
          gender: true,
          evaluation_rating: true,
          total_games_hosted: true,
          xp: true,
          subscription_status: true,
          // v2.4: 결제·멤버십 큰 카드 — "다음 결제 YYYY.MM.DD" 표시용
          subscription_expires_at: true,
          membershipType: true,
          profile_completed: true,
          // 시안 "인증완료" 뱃지 정합 — Phase 12-1 으로 추가된 본인인증 컬럼
          name_verified: true,
          // 등번호는 User 컬럼이 아닌 TeamMember.jerseyNumber 를 사용
          // (preferred_jersey_number 는 team_join_requests 의 신청 옵션 — User 가입 시점이 아니라 팀 가입 요청 임시값).
        },
      })
      .catch(() => null),

    // 2) 소속 팀 (active만)
    //    v2.3: TeamSideCard 의 "12W 5L" 표시 — team.wins/losses/draws + 시안 "#7" 등번호용 jerseyNumber
    prisma.teamMember
      .findMany({
        where: { userId, status: "active" },
        select: {
          id: true,
          jerseyNumber: true,
          team: {
            select: {
              id: true,
              name: true,
              primaryColor: true,
              logoUrl: true,
              wins: true,
              losses: true,
              draws: true,
            },
          },
        },
        orderBy: { joined_at: "desc" },
        take: 5,
      })
      .catch(() => []),

    // 3) 다가오는 일정 — v2.3 시안 GAMES.slice(0,3) 매칭. scheduled_at > now 가장 빠른 3건
    //    findFirst → findMany 로 변경. 페이지 SSR 에서만 사용 (실시간 불필요).
    prisma.game_applications
      .findMany({
        where: {
          user_id: userId,
          games: { scheduled_at: { gt: now } },
        },
        select: {
          id: true,
          status: true,
          game_id: true,
          games: {
            select: {
              id: true,
              uuid: true,
              title: true,
              scheduled_at: true,
              venue_name: true,
            },
          },
        },
        orderBy: { games: { scheduled_at: "asc" } },
        take: 3,
      })
      .catch(() => []),

    // 4) 승률 / 평균 스탯
    getPlayerStats(userId).catch(() => null),

    // 5) 알림 미확인 수 — 실패 시 0. status="unread" 로 구분 (schema 상 read 여부 필드)
    prisma.notifications
      .count({ where: { user_id: userId, status: "unread" } })
      .catch(() => 0),

    // 6) community_posts 최근 5건 (활동 타임라인용)
    prisma.community_posts
      .findMany({
        where: { user_id: userId, status: "published" },
        select: {
          id: true,
          public_id: true,
          title: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
        take: 5,
      })
      .catch(() => []),

    // 7) game_applications 최근 5건 (활동 타임라인용)
    prisma.game_applications
      .findMany({
        where: { user_id: userId },
        select: {
          id: true,
          created_at: true,
          games: {
            select: {
              id: true,
              uuid: true,
              title: true,
              scheduled_at: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 5,
      })
      .catch(() => []),

    // 8) user_badges 최신 4건
    prisma.user_badges
      .findMany({
        where: { user_id: userId },
        select: {
          id: true,
          badge_type: true,
          badge_name: true,
          earned_at: true,
        },
        orderBy: { earned_at: "desc" },
        take: 4,
      })
      .catch(() => []),
  ]);

  if (!user) {
    // 세션은 있으나 DB 조회 실패 — 드문 엣지
    return (
      <div style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--ink-mute)" }}>프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  // ---- Hero 데이터 변환 ----
  const level = getProfileLevelInfo(user.xp);
  // subscription_status === "active" 이면 PRO
  const isPro = user.subscription_status === "active";
  // v2.3: 시안 "인증완료" — Phase 12 추가된 name_verified 우선, 폴백으로 profile_completed
  const isVerified = !!user.name_verified || !!user.profile_completed;
  // evaluation_rating 은 Decimal → number
  const evaluationRating = user.evaluation_rating != null ? Number(user.evaluation_rating) : null;

  // v2.3: 시안 "#7" — 첫 활성 팀의 등번호 (User 모델에는 jersey 컬럼 없음)
  const primaryTeamMember = teamMembers[0] ?? null;
  const jerseyNumber = primaryTeamMember?.jerseyNumber ?? null;

  const primaryTeam = primaryTeamMember?.team
    ? {
        id: primaryTeamMember.team.id.toString(),
        name: primaryTeamMember.team.name,
        primaryColor: primaryTeamMember.team.primaryColor,
        logoUrl: primaryTeamMember.team.logoUrl,
        // v2.3 TeamSideCard "12W 5L" — 시안 정합. 시즌 레이팅은 DB 없음 (totalGames 표시로 대체)
        wins: primaryTeamMember.team.wins ?? 0,
        losses: primaryTeamMember.team.losses ?? 0,
        draws: primaryTeamMember.team.draws ?? 0,
      }
    : null;

  // ---- SeasonStats 데이터 변환 ----
  const career = playerStats?.careerAverages ?? null;
  const seasonStatsData = {
    games: career?.gamesPlayed ?? 0,
    winRate: playerStats?.winRate ?? null,
    ppg: career?.avgPoints ?? null,
    apg: career?.avgAssists ?? null,
    rpg: career?.avgRebounds ?? null,
    rating: evaluationRating,
  };

  // ---- UpcomingGames 데이터 변환 (v2.3: 1건 → 3건) ----
  //   시안 GAMES.slice(0,3) 매칭. games 가 null 인 신청은 필터 제거.
  const nextGames = nextGameApps
    .filter((app) => app.games != null && app.games.scheduled_at != null)
    .map((app) => ({
      id: app.games!.uuid ?? app.game_id.toString(),
      title: app.games!.title ?? null,
      scheduledAt: app.games!.scheduled_at!.toISOString(),
      venueName: app.games!.venue_name ?? null,
      // 신청 상태 — "approved"/"confirmed" 면 시안의 "참가확정" badge 매핑
      status: app.status ?? null,
    }));

  // ---- Activity 타임라인 merge (posts + applications → created_at desc 상위 5건) ----
  const postItems: ActivityItem[] = recentPosts.map((p) => ({
    key: `post-${p.id.toString()}`,
    createdAt: p.created_at.toISOString(),
    kind: "post" as const,
    action: "게시글 작성",
    target: p.title ?? "제목 없음",
    // 글 상세 링크 — public_id uuid 기반
    href: `/community/${p.public_id}`,
  }));
  const appItems: ActivityItem[] = recentApplications.map((a) => ({
    key: `app-${a.id.toString()}`,
    createdAt: a.created_at.toISOString(),
    kind: "application" as const,
    action: "경기 신청",
    target: a.games?.title ?? "경기",
    // game 상세 링크 — uuid 우선, slice 8자 (기존 패턴)
    href: a.games?.uuid
      ? `/games/${a.games.uuid.slice(0, 8)}`
      : undefined,
  }));
  // 날짜 desc 정렬 후 상위 5개
  const activities = [...postItems, ...appItems]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // ---- Badges 변환 ----
  const badges = userBadges.map((b) => ({
    id: b.id.toString(),
    badgeType: b.badge_type,
    badgeName: b.badge_name,
    earnedAt: b.earned_at.toISOString(),
  }));

  // ---- v2.4 Hub: Tier 1 카드 본문 슬롯 4개 ----
  //   각 카드별로 본문이 다름 (프로필=정보 dl / 내 농구=PPG/APG/RPG / 내 성장=차트 placeholder /
  //   내 활동=막대 그래프). page.tsx 에서 직접 JSX 작성 후 MyPageHub 에 슬롯 props 로 전달.
  const positionLabel = user.position ?? "포지션 미정";
  // 프로필 카드 — 닉네임/실명/포지션/본인인증 4행
  const profileSlot = (
    <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 4, fontSize: 13 }}>
        <dt style={{ color: "var(--ink-dim)", margin: 0 }}>닉네임</dt>
        <dd style={{ margin: 0, color: "var(--ink)" }}>{user.nickname ?? "—"}</dd>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 4, fontSize: 13 }}>
        <dt style={{ color: "var(--ink-dim)", margin: 0 }}>실명</dt>
        <dd style={{ margin: 0, color: "var(--ink)" }}>{user.name ?? "—"}</dd>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 4, fontSize: 13 }}>
        <dt style={{ color: "var(--ink-dim)", margin: 0 }}>포지션</dt>
        <dd style={{ margin: 0, color: "var(--ink)" }}>
          {positionLabel}
          {jerseyNumber != null && ` · #${jerseyNumber}`}
        </dd>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 4, fontSize: 13 }}>
        <dt style={{ color: "var(--ink-dim)", margin: 0 }}>본인인증</dt>
        <dd style={{ margin: 0 }}>
          {/* Phase 12 name_verified 우선. 미인증 시 "미인증" 라벨 */}
          {isVerified ? (
            <span className="badge badge--ok">✓ 인증완료</span>
          ) : (
            <span className="badge badge--warn">미인증</span>
          )}
        </dd>
      </div>
    </dl>
  );

  // 내 농구 카드 — PPG/APG/RPG 3 통계 (의뢰서 §3-3 Tier 1)
  const fmt = (v: number | null | undefined) => (v == null ? "—" : v.toFixed(1));
  const basketballSlot = (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, padding: "8px 0" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--ff-display)", fontWeight: 900, fontSize: 22, color: "var(--ink)" }}>
          {fmt(seasonStatsData.ppg)}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>PPG</div>
      </div>
      <div style={{ textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--ff-display)", fontWeight: 900, fontSize: 22, color: "var(--ink)" }}>
          {fmt(seasonStatsData.apg)}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>APG</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--ff-display)", fontWeight: 900, fontSize: 22, color: "var(--ink)" }}>
          {fmt(seasonStatsData.rpg)}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>RPG</div>
      </div>
    </div>
  );

  // 내 성장 카드 — v2.4 시안 톤: SVG line 그래프 (placeholder 더미 7 포인트)
  //   실 데이터는 /profile/growth 클릭 후 로드 (의뢰서 §6 "API 0 변경" 룰 준수)
  //   더미 폴리라인은 점진적 상승 곡선 (0,60 → 200,10) — 좌하단 → 우상단
  const growthSlot = (
    <div
      style={{
        height: 80,
        background: "var(--bg-alt)",
        borderRadius: 4,
        padding: 8,
        display: "flex",
        alignItems: "center",
      }}
    >
      <svg
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        {/* 시안 톤: var(--accent) stroke 2px, 라인 캡 round (부드러운 끝) */}
        <polyline
          points="0,60 30,55 60,50 90,45 120,30 150,25 180,15 200,10"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  // 내 활동 카드 — 7일 막대 그래프 (placeholder, 실 활동량은 /profile/activity 에서)
  // 막대 높이는 데모 정적값 — 데이터 패칭 0 변경 룰 준수 (의뢰서 §6 보존)
  const activityBars = [40, 60, 30, 80, 70, 50, 90];
  const activitySlot = (
    <div
      style={{
        height: 80,
        background: "var(--bg-alt)",
        borderRadius: 4,
        display: "flex",
        alignItems: "flex-end",
        padding: 6,
        gap: 3,
      }}
    >
      {activityBars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${h}%`,
            background: "var(--accent)",
            opacity: 0.7,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );

  const tier1Slots: HubTier1Slot[] = [
    { id: "profile", body: profileSlot },
    { id: "basketball", body: basketballSlot },
    { id: "growth", body: growthSlot },
    { id: "activity", body: activitySlot },
  ];

  // ---- v2.4 결제·멤버십 큰 카드 데이터 ----
  //   사유: 시안 캡처 27 의 "BDR+ PRO · 다음 결제 YYYY.MM.DD" 표시.
  //   subscription_status === "active" → PRO. 만료일은 subscription_expires_at.
  //   미가입 시 "BDR 베이직 · 무료 플랜" 폴백.
  const billingPlanLabel = isPro ? "BDR+ PRO" : "BDR 베이직";
  let billingSubLabel: string;
  if (isPro && user.subscription_expires_at) {
    // YYYY.MM.DD 형식 (시안 톤). KST locale 자동
    const exp = user.subscription_expires_at;
    const y = exp.getFullYear();
    const m = String(exp.getMonth() + 1).padStart(2, "0");
    const d = String(exp.getDate()).padStart(2, "0");
    billingSubLabel = `다음 결제 ${y}.${m}.${d}`;
  } else if (isPro) {
    billingSubLabel = "구독 활성";
  } else {
    billingSubLabel = "무료 플랜";
  }

  // Hero 카드 메타 (의뢰서 §3-2 + 사용자 캡처 16): 닉네임 + 팀·포지션·#N·시즌 라벨
  const displayName = user.nickname ?? user.name ?? "사용자";
  const heroMetaParts: string[] = [];
  if (primaryTeam) heroMetaParts.push(primaryTeam.name);
  if (user.position) heroMetaParts.push(user.position);
  if (jerseyNumber != null) heroMetaParts.push(`#${jerseyNumber}`);
  // 시즌 라벨 — 의뢰서 캡처 16 "2026 Spring". 향후 시즌 데이터 연결 전까지 정적값
  heroMetaParts.push("2026 Spring");
  const heroMetaLine = heroMetaParts.join(" · ");
  // Hero 아바타 — 팀 약어(3자) 또는 닉네임 이니셜 1자
  const heroInitial = primaryTeam?.name
    ? primaryTeam.name.slice(0, 3).toUpperCase()
    : displayName.trim()[0]?.toUpperCase() ?? "U";
  // v2.4 시안: 96 아바타에 팀 색 → 검정 그라디언트 (Profile.jsx L32). 팀 없거나 어두운 팀 색일 때 BDR Red 폴백.
  // 이유: 캡처 28 — 스티즈 남양주 팀 primaryColor 가 검은색이라 검정→검정 그라디언트 = 검은 단색이 됨.
  // 시안 캡처 26 의 RDM 빨간 그라디언트 톤 보존 위해 어두운 색은 BDR Red 강제.
  const teamColor = primaryTeam?.primaryColor?.toLowerCase().trim();
  const isDarkOrEmpty =
    !teamColor || teamColor === "#000" || teamColor === "#000000" || teamColor === "black" || teamColor === "#111" || teamColor === "#222";
  const heroAvatarBg = isDarkOrEmpty
    ? "linear-gradient(145deg, var(--accent), #1a0508)"
    : `linear-gradient(145deg, ${teamColor}, #000)`;

  return (
    <div className="page">
      {/* Phase 12 §G — 모바일 백버튼 (홈 fallback). 데스크톱 lg+ 에서는 hidden. */}
      <PageBackButton fallbackHref="/" />

      {/* ============ Hero 카드 (전폭, 의뢰서 §3-2 + 캡처 16) ============
          96x96 빨간 그라디언트 아바타 + MY PAGE eyebrow + h1 + 메타 + 뱃지 3 + 버튼 3.
          기존 좌측 사이드 HeroCard 와 다른 — 사용자 캡처 16의 큰 배너 형태. */}
      <section
        className="card"
        style={{
          padding: "28px 24px",
          display: "grid",
          gridTemplateColumns: "120px 1fr",
          gap: 24,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {/* 아바타 — 96x96 그라디언트. v2.4: 팀 primary_color 기반 (없으면 BDR Red) */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            background: heroAvatarBg,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 24,
            border: "3px solid var(--border)",
            letterSpacing: 0.5,
          }}
        >
          {heroInitial}
        </div>

        <div>
          {/* eyebrow */}
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            MY PAGE · 마이페이지
          </div>
          {/* h1 — "닉네임 의 농구" */}
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            <span style={{ color: "var(--accent)" }}>{displayName}</span>
            <span style={{ color: "var(--ink-soft)" }}> 의 농구</span>
          </h1>
          {/* 메타 — 팀 · 포지션 · #등번호 · 시즌 */}
          <div style={{ fontSize: 14, color: "var(--ink-mute)", marginBottom: 12 }}>
            {heroMetaLine}
          </div>
          {/* 뱃지 3종 — Lv / PRO / 본인인증 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {level && (
              <span className="badge badge--red" title={level.title}>
                {level.emoji} L.{level.level}
              </span>
            )}
            {isPro && <span className="badge badge--soft">PRO 멤버</span>}
            {isVerified && <span className="badge badge--ok">✓ 본인인증</span>}
          </div>
          {/* 버튼 3종 — 프로필 편집 / 알림 / 공개 프로필 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Link
              href="/profile/edit"
              className="btn btn--sm"
              style={{ textDecoration: "none" }}
            >
              프로필 편집
            </Link>
            <Link
              href="/notifications"
              className="btn btn--sm"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              알림
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "0 6px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              href={`/users/${user.id.toString()}`}
              className="btn btn--sm"
              style={{ textDecoration: "none" }}
            >
              공개 프로필 →
            </Link>
          </div>
        </div>
      </section>

      {/* ============ 본문 2열: 좌 1fr (마이페이지 hub) | 우 320 sticky aside ============
          v2.4 캡처 16+27 — "좌 1fr (hub + 큰 카드 2종) / 우 320 (다음 경기 + 팀 + 활동 + 뱃지 + 도움)".
          - 좌 본문: 마이페이지 hub (Tier 1 큰 카드 4 + Tier 2 quick 카드 4) + 본문 끝 큰 카드 2종(설정/결제·멤버십)
          - 우 사이드: 다음 경기(UpcomingGames D-N 강조) + 소속 팀(TeamSideCard 시안 톤) + 최근 활동(ActivityTimeline) + 뱃지(BadgesSideCard) + 도움 영역
          - SeasonStats 제거 (v2.4 시안에 없음). 본문 4 카드 안 "내 농구" 가 통산 PPG/APG/RPG 표시.
          모바일은 globals.css .profile-grid 룰이 1열로 stack. */}
      <div
        className="profile-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* ========== 좌측 main — v2.4 마이페이지 hub + 본문 끝 큰 카드 2종 ========== */}
        <div>
          <MyPageHub tier1Slots={tier1Slots} unreadCount={unreadCount} />

          {/* v2.4 시안 캡처 27 — 본문 끝 큰 카드 2종 (설정 / 결제·멤버십).
              데스크톱 2 col → 모바일 1열 (mypage-large-grid 720 분기). */}
          <div
            className="mypage-large-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginTop: 12,
            }}
          >
            {/* 설정 큰 카드 */}
            <Link
              href="/profile/settings"
              className="card"
              style={{
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: "var(--accent)" }}
              >
                settings
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                  설정
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginTop: 2,
                  }}
                >
                  계정·알림·개인정보·공개
                </div>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "var(--ink-dim)" }}
              >
                arrow_forward
              </span>
            </Link>

            {/* 결제·멤버십 큰 카드 — billingPlanLabel + billingSubLabel 동적 표시 */}
            <Link
              href="/profile/billing"
              className="card"
              style={{
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 28, color: "var(--accent)" }}
              >
                credit_card
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                  결제·멤버십
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {billingPlanLabel} · {billingSubLabel}
                </div>
              </div>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18, color: "var(--ink-dim)" }}
              >
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* ========== 우측 aside (sticky) — 다음 경기 + 팀 + 활동 + 뱃지 + 도움 ========== */}
        <aside
          className="profile-aside"
          style={{
            position: "sticky",
            top: 120,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* 2026-05-01 회귀 픽스 — 우측 aside HeroCard 제거.
              2026-04-30 v2.4 — SeasonStats 도 제거 (시안 캡처 26 우측 aside 에 통산 시즌스탯 카드 없음).
              본문 4 카드 안 "내 농구" 카드(PPG/APG/RPG)로 대체. */}

          {/* 다음 경기 — v2.4 D-N 빨간 박스 강조 (의뢰서 §3-3 보조 정보) */}
          <UpcomingGames games={nextGames} />

          {/* 소속 팀 — 1팀 이상일 때만 */}
          {primaryTeam && (
            <TeamSideCard primaryTeam={primaryTeam} totalTeams={teamMembers.length} />
          )}

          {/* 최근 활동 — 5건 (의뢰서 §3-3 보조 정보) */}
          <ActivityTimeline items={activities} />

          {/* 뱃지 — 1개 이상일 때만 */}
          {badges.length > 0 && <BadgesSideCard badges={badges} />}

          {/* v2.4 시안 캡처 27 — 도움 영역 (도움말 + 안전·차단 2 버튼).
              우측 aside 끝에 배치. 비로그인은 본 페이지 진입 자체가 차단되므로 가드 불필요. */}
          <div className="card" style={{ padding: "16px 20px" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 4,
                color: "var(--ink)",
              }}
            >
              도움이 필요하세요?
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginBottom: 12,
              }}
            >
              계정 / 결제 / 환불 문의는 24시간 이내 답변드려요.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link
                href="/help"
                className="btn btn--sm"
                style={{
                  flex: 1,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                도움말
              </Link>
              <Link
                href="/safety"
                className="btn btn--sm"
                style={{
                  flex: 1,
                  textAlign: "center",
                  textDecoration: "none",
                }}
              >
                안전·차단
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
