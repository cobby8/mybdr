/* ============================================================
 * /profile — v3 마이페이지 hub (서버 컴포넌트)
 *
 * Phase 13 박제 (2026-05-01) — 출처: Dev/design/BDR-current/screens/MyPage.jsx
 * 룰: claude-project-knowledge/00-master-guide.md 13 룰 + 06-self-checklist.md
 *
 * 왜:
 * - 기존 좌측 320px aside (HeroCard) + 우측 main (SeasonStats/UpcomingGames/ActivityTimeline) 구조에서
 *   3-tier 카드 hub (Tier1 큰4 / Tier2 중간4 / Tier3 작은2) + aside (D-N/팀/최근활동/도움) 로 재구성.
 * - /profile 단일 hub 진입점에서 16+ 깊은 페이지(/profile/*) 로 분기.
 *
 * 어떻게:
 * - 8 쿼리 병렬 prefetch 구조 보존 (Promise.all + Prisma 직접 호출).
 * - HeroCard / SeasonStats / UpcomingGames / ActivityTimeline / TeamSideCard / BadgesSideCard
 *   import 제거 (이 페이지에서만 사용 — 다른 페이지 영향 없음 grep 검증 완료).
 * - 시안의 setRoute(...) 라우팅 → Next.js Link href 10건 매핑.
 * - 시안 mock data (sparkline 12주 / activity bars 13주) 는 hub 카드 시각요소이므로 그대로 유지.
 *   진짜 데이터는 P1 깊은 페이지 (/profile/growth, /profile/activity) 에서 표시.
 *
 * 운영 데이터 매핑:
 *   user.nickname / user.name / user.position → 시안 hero
 *   level (getProfileLevelInfo) → user.level (L.N)
 *   isPro (subscription_status === "active") → PRO 배지
 *   isVerified (profile_completed) → 본인인증 ✓
 *   primaryTeam (teamMembers[0]) → 시안 team (이름/색상/태그)
 *   nextGame (game_applications + games scheduled_at > now) → D-N countdown
 *   unreadCount (notifications status="unread") → tier2 알림 카운트
 *   activities (posts + applications merge desc 5건) → aside 최근 활동 5건
 *   seasonStatsData (career averages) → tier1 basketball 카드 PPG/APG/RPG/RTG
 *
 * 보안/규칙:
 * - 세션 userId 기반 본인 데이터만 조회 (IDOR 없음).
 * - BigInt → string, Date → ISO 변환 모두 여기서 처리.
 * - API/route.ts/Prisma 스키마 0 변경 (PM 규칙).
 * ============================================================ */

import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";
// 2026-05-05 Phase 2 PR8 — 휴면 만료 lazy 복구 hook (본인 시야 진입 시 자동 active)
import { checkAndExpireDormant } from "@/lib/team-members/check-dormant-expiry";
// 2026-05-05 Phase 5 PR14 — 활동 추적 (마이페이지 진입 = 로그인/활동 5종 중 #5)
import { trackTeamMemberActivityForUser } from "@/lib/team-members/track-activity";
// Phase 12 §G: 모바일 백버튼 (사용자 보고 — 깊은 페이지 복귀 동선)

// Phase 13 hub 전용 스타일 (BDR-current/mypage.css 1:1 카피)
import "./mypage.css";

// PR2: 다중 팀 목록 카드 (마이페이지 aside)
import { TeamsListCard, type TeamsListItem } from "./_v2/teams-list-card";
// 2026-05-05 Phase 3 PR10+PR11 — 본인 pending 이적 진행 카드 (client)
// 이유: 양쪽 팀장 승인 진척도 시각화. 본인 시야에서만 의미. server SELECT 추가 0
//   (마운트 시 fetch — 다른 SSR 부하 회피).
import { TransferProgressCard } from "./_v2/transfer-progress-card";

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
    nextGameApp,
    playerStats,
    unreadCount,
    recentPosts,
    recentApplications,
    userBadges,
  ] = await Promise.all([
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
          profile_completed: true,
        },
      })
      .catch(() => null),

    // PR2: 다중 팀 목록 표시용으로 SELECT 확장
    // (city/district/name_en/name_primary/logoUrl/jerseyNumber 추가)
    prisma.teamMember
      .findMany({
        where: { userId, status: "active" },
        select: {
          jerseyNumber: true,
          team: {
            select: {
              id: true,
              name: true,
              name_en: true,
              name_primary: true,
              city: true,
              district: true,
              primaryColor: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { joined_at: "desc" },
        take: 10,
      })
      .catch(() => []),

    prisma.game_applications
      .findFirst({
        where: {
          user_id: userId,
          games: { scheduled_at: { gt: now } },
        },
        include: {
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
      })
      .catch(() => null),

    getPlayerStats(userId).catch(() => null),

    prisma.notifications
      .count({ where: { user_id: userId, status: "unread" } })
      .catch(() => 0),

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
    return (
      <div style={{ minHeight: "40vh", display: "grid", placeItems: "center" }}>
        <p style={{ color: "var(--ink-mute)" }}>프로필을 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 2026-05-05 PR8 — 본인 휴면 만료 lazy 복구
  // 이유: 본인이 가입 중인 팀들 중 dormant row 가 있고 until 이 지났으면 자동 active 복귀.
  //   별도 SELECT 1쿼리 (대다수 사용자는 dormant row 0건 → 즉시 종료).
  //   복귀가 발생해도 위 teamMembers 응답에는 반영되지 않으므로 다음 새로고침에 active 표시.
  try {
    const dormantRows = await prisma.teamMember.findMany({
      where: { userId, status: "dormant" },
      select: { teamId: true },
      take: 20, // 비정상 데이터 안전망
    });
    if (dormantRows.length > 0) {
      // 병렬 실행 — 각 row 독립적
      await Promise.all(
        dormantRows.map((r) => checkAndExpireDormant(r.teamId, userId).catch(() => false)),
      );
    }
  } catch {
    // silent — 페이지 로딩 영향 X
  }

  // 2026-05-05 Phase 5 PR14 — 본인 모든 active 팀 활동 갱신 (마이페이지 = 로그인 활동)
  // 이유: 보고서 §3-2 활동 5종 중 #5 (로그인). 마이페이지 진입 = 로그인 직후 또는 활성 사용자.
  //   updateMany 1회 (5분 throttle 통과 시) — 운영 부하 최소.
  trackTeamMemberActivityForUser(userId).catch(() => {});

  // ---- Hero 데이터 변환 ----
  const level = getProfileLevelInfo(user.xp);
  const isPro = user.subscription_status === "active";
  const isVerified = !!user.profile_completed;
  const evaluationRating = user.evaluation_rating != null ? Number(user.evaluation_rating) : null;

  // 닉네임 fallback — 닉네임 없으면 이름, 없으면 "사용자"
  const displayNickname = user.nickname ?? user.name ?? "사용자";
  const displayName = user.name ?? "—";
  const positionLabel = user.position ?? "—";

  // ---- Team 데이터 ----
  // hero / avatar 그라디언트는 첫 팀 (joined_at desc 최신) 기준 — 기존 동작 유지
  const primaryTeam = teamMembers[0]?.team
    ? {
        id: teamMembers[0].team.id.toString(),
        name: teamMembers[0].team.name,
        primaryColor: teamMembers[0].team.primaryColor ?? "var(--accent)",
        // tag = 팀 이름 첫 2글자 (영문이면 대문자)
        tag: (teamMembers[0].team.name ?? "TM").slice(0, 2).toUpperCase(),
      }
    : null;

  // PR2: 다중 팀 목록 (TeamsListCard 용 매핑)
  // 이유: name_primary 가 'en' 이면 영문을 메인 표시, 한글을 보조. 기본값 'ko'.
  const teamsList: TeamsListItem[] = teamMembers
    .filter((m) => m.team != null)
    .map((m) => {
      const t = m.team!;
      const isEnPrimary = t.name_primary === "en" && t.name_en && t.name_en.trim();
      const teamName = isEnPrimary ? t.name_en! : t.name;
      const teamNameSecondary = isEnPrimary
        ? t.name // primary=en → 한글 보조
        : t.name_en && t.name_en.trim()
          ? t.name_en // primary=ko + 영문 있으면 보조
          : null;
      // tag = 영문 이니셜 우선 (팀 카드 컨벤션과 일관) — 없으면 한글 첫 2글자
      const tagBase = (t.name_en && t.name_en.trim()) || t.name;
      return {
        teamId: t.id.toString(),
        teamName,
        teamNameSecondary,
        city: t.city,
        district: t.district,
        logoUrl: t.logoUrl,
        primaryColor: t.primaryColor,
        jerseyNumber: m.jerseyNumber ?? null,
        tag: tagBase.slice(0, 2).toUpperCase(),
      };
    });

  // 팀 색상 기반 ink (대비) — 토큰 fallback 패턴 (mypage.css 의 --ink-on-accent 와 동일)
  const teamInk = "var(--ink-on-accent, #fff)";
  // 아바타 그라디언트 색상 — 팀 있으면 팀 색, 없으면 BDR Red
  const avatarBg = primaryTeam
    ? `linear-gradient(145deg, ${primaryTeam.primaryColor}, color-mix(in srgb, ${primaryTeam.primaryColor} 30%, var(--bg)))`
    : `linear-gradient(145deg, var(--accent), color-mix(in srgb, var(--accent) 30%, var(--bg)))`;

  // ---- SeasonStats 매핑 (basketball 카드 4-stat) ----
  const career = playerStats?.careerAverages ?? null;
  const fmtStat = (v: number | null | undefined, decimals = 1): string =>
    v == null ? "—" : v.toFixed(decimals);
  const ppg = fmtStat(career?.avgPoints, 1);
  const apg = fmtStat(career?.avgAssists, 1);
  const rpg = fmtStat(career?.avgRebounds, 1);
  // RTG = 평가 점수 (시안은 1684 같은 정수) — evaluation_rating 정수화
  const rtg = evaluationRating != null ? Math.round(evaluationRating).toLocaleString() : "—";

  // ---- 다음 경기 (D-N countdown) ----
  const nextGame = nextGameApp?.games
    ? {
        id: nextGameApp.games.uuid?.slice(0, 8) ?? nextGameApp.game_id.toString(),
        title: nextGameApp.games.title ?? "예정된 경기",
        scheduledAt: nextGameApp.games.scheduled_at,
        venueName: nextGameApp.games.venue_name ?? "장소 미정",
      }
    : null;

  const dDays = nextGame?.scheduledAt
    ? Math.max(0, Math.round((nextGame.scheduledAt.getTime() - now.getTime()) / 86400000))
    : null;

  // ---- 최근 활동 5건 (posts + applications merge) ----
  type RecentItem = {
    key: string;
    date: string; // "MM.DD"
    tag: "match" | "post" | "team" | "win" | "loss";
    label: string;
    target: string;
  };
  const fmtDate = (d: Date): string => {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}.${dd}`;
  };
  const postRecents: RecentItem[] = recentPosts.map((p) => ({
    key: `post-${p.id.toString()}`,
    date: fmtDate(p.created_at),
    tag: "post",
    label: "게시글",
    target: p.title ?? "제목 없음",
  }));
  const appRecents: RecentItem[] = recentApplications.map((a) => ({
    key: `app-${a.id.toString()}`,
    date: fmtDate(a.created_at),
    tag: "match",
    label: "경기 신청",
    target: a.games?.title ?? "경기",
  }));
  const recent = [...postRecents, ...appRecents]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // ---- Tier 카드 정의 (시안 1:1 + 운영 라우트) ----
  // Tier 1 큰 카드 4종
  const tier1ProfileItems = [
    { label: "닉네임", value: displayNickname, mono: true },
    { label: "실명", value: displayName, mono: false },
    { label: "포지션", value: positionLabel, mono: false },
    {
      label: "본인인증",
      value: isVerified ? "✓ 인증완료" : "미인증",
      mono: false,
      verified: isVerified,
    },
  ];

  // Tier 1 basketball stats
  const basketballStats = [
    { label: "PPG", value: ppg },
    { label: "APG", value: apg },
    { label: "RPG", value: rpg },
    { label: "RTG", value: rtg },
  ];

  // 본인 공개 프로필 — /users/[id]?preview=1
  // 2026-05-02: ?preview=1 query 추가 — users/[id]/page.tsx 의 isOwner→/profile redirect (D-P7) 우회.
  // 본인이 다른 사람 시점으로 자기 공개 프로필 미리보기 가능.
  const publicProfileHref = `/users/${user.id.toString()}?preview=1`;

  return (
    <div className="page mypage">
      {/* 2026-05-04: 메인 페이지에서 PageBackButton 제거 (BottomNav 가 홈 이동 대체) */}

      {/* HERO STRIP — identity ribbon */}
      <header className="mypage__hero">
        <div className="mypage__hero-id">
          <div
            className="mypage__avatar"
            style={{
              background: avatarBg,
              color: teamInk,
            }}
          >
            {primaryTeam?.tag ?? displayNickname.slice(0, 2).toUpperCase()}
          </div>
          <div className="mypage__id-text">
            <div className="eyebrow">MY PAGE · 마이페이지</div>
            <h1 className="mypage__name">
              {displayNickname}
              <span className="mypage__name-suffix"> 의 농구</span>
            </h1>
            <div className="mypage__id-meta">
              {primaryTeam && (
                <>
                  <span>{primaryTeam.name}</span>
                  <span className="mypage__dot" />
                </>
              )}
              <span>{positionLabel}</span>
              <span className="mypage__dot" />
              <span className="t-mono">통산</span>
            </div>
            <div className="mypage__id-badges">
              <span className="badge badge--red">L.{level?.level ?? 1}</span>
              {isPro && <span className="badge badge--soft">PRO 멤버</span>}
              {isVerified && <span className="badge badge--ok">✓ 본인인증</span>}
            </div>
          </div>
        </div>
        <div className="mypage__hero-actions">
          <Link href="/profile/edit" className="btn btn--sm">
            프로필 편집
          </Link>
          <Link href="/notifications" className="btn btn--sm">
            알림
            {unreadCount > 0 && <span className="mypage__count-pip">{unreadCount}</span>}
          </Link>
          <Link href={publicProfileHref} className="btn btn--sm btn--primary">
            공개 프로필 →
          </Link>
        </div>
      </header>

      {/* MAIN GRID: hub + aside */}
      <div className="mypage__grid">
        {/* HUB */}
        <div className="mypage-hub">
          <div className="mypage-hub__intro">
            <h2 className="mypage-hub__title">내 활동을 한곳에서</h2>
            <p className="mypage-hub__sub">
              프로필·농구·활동·설정·결제를 한곳에서 빠르게 관리하세요.
            </p>
          </div>

          {/* TIER 1 — 큰 카드 4종 */}
          <section className="mypage-hub__tier mypage-hub__tier-1">
            {/* 1-1. 프로필 */}
            <Link href="/profile/edit" className="mypage-card mypage-card--lg">
              <div className="mypage-card__head">
                <span className="mypage-card__icon">👤</span>
                <div className="mypage-card__heading">
                  <h3>프로필</h3>
                </div>
              </div>
              <ul className="mypage-card__items">
                {tier1ProfileItems.map((m, i) => (
                  <li key={i}>
                    <span className="mypage-card__item-label">{m.label}</span>
                    <span
                      className={`mypage-card__item-value${m.mono ? " t-mono" : ""}`}
                    >
                      {"verified" in m ? (
                        m.verified ? (
                          <span className="badge badge--ok" style={{ fontSize: 10 }}>
                            ✓ 인증완료
                          </span>
                        ) : (
                          <span className="badge badge--warn" style={{ fontSize: 10 }}>
                            미인증
                          </span>
                        )
                      ) : (
                        m.value
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mypage-card__cta">프로필 편집 →</div>
            </Link>

            {/* 1-2. 내 농구 */}
            <Link href="/profile/basketball" className="mypage-card mypage-card--lg">
              <div className="mypage-card__head">
                <span className="mypage-card__icon">🏀</span>
                <div className="mypage-card__heading">
                  <h3>내 농구</h3>
                </div>
              </div>
              <div className="mypage-card__statgrid">
                {basketballStats.map((s) => (
                  <div key={s.label} className="mypage-card__stat">
                    <div className="mypage-card__stat-value">{s.value}</div>
                    <div className="mypage-card__stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mypage-card__cta">경기 기록 →</div>
            </Link>

            {/* 1-3. 내 성장 (sparkline 시각 요소 — 진짜 데이터는 P1 /profile/growth) */}
            <Link href="/profile/growth" className="mypage-card mypage-card--lg">
              <div className="mypage-card__head">
                <span className="mypage-card__icon">📈</span>
                <div className="mypage-card__heading">
                  <h3>내 성장</h3>
                </div>
              </div>
              <Spark values={[2.1, 2.4, 2.0, 2.6, 2.8, 2.9, 3.1, 3.2, 3.0, 3.4, 3.6, 3.8]} />
              <div className="mypage-card__cta">성장 추이 →</div>
            </Link>

            {/* 1-4. 내 활동 (12주 막대 시각 요소 — 진짜 데이터는 P1 /profile/activity) */}
            <Link href="/profile/activity" className="mypage-card mypage-card--lg">
              <div className="mypage-card__head">
                <span className="mypage-card__icon">⚡</span>
                <div className="mypage-card__heading">
                  <h3>내 활동</h3>
                </div>
              </div>
              <div className="mypage-card__act-bars">
                {[3, 5, 2, 7, 4, 6, 8, 3, 5, 9, 4, 7, 12].map((v, i) => (
                  <div
                    key={i}
                    className="mypage-card__act-bar"
                    style={{ height: `${10 + v * 4}px` }}
                  />
                ))}
              </div>
              <div className="mypage-card__cta">활동 타임라인 →</div>
            </Link>
          </section>

          {/* TIER 2 — 중간 카드 4종 */}
          <section className="mypage-hub__tier mypage-hub__tier-2">
            <Link href="/profile/bookings" className="mypage-card mypage-card--md">
              <div className="mypage-card__md-head">
                <span className="mypage-card__icon">📅</span>
                <h3>예약 이력</h3>
              </div>
              <div className="mypage-card__md-arrow">→</div>
            </Link>

            <Link href="/profile/weekly-report" className="mypage-card mypage-card--md">
              <div className="mypage-card__md-head">
                <span className="mypage-card__icon">📰</span>
                <h3>주간 리포트</h3>
                <span className="badge badge--new" style={{ marginLeft: "auto" }}>
                  NEW
                </span>
              </div>
              <div className="mypage-card__md-arrow">→</div>
            </Link>

            <Link href="/notifications" className="mypage-card mypage-card--md">
              <div className="mypage-card__md-head">
                <span className="mypage-card__icon">🔔</span>
                <h3>알림</h3>
                {unreadCount > 0 && (
                  <span className="mypage-card__pill">{unreadCount}</span>
                )}
              </div>
              <div className="mypage-card__md-arrow">→</div>
            </Link>

            <Link href="/profile/achievements" className="mypage-card mypage-card--md">
              <div className="mypage-card__md-head">
                <span className="mypage-card__icon">🏆</span>
                <h3>배지·업적</h3>
                {userBadges.length > 0 && (
                  <span className="mypage-card__md-meta">{userBadges.length}개</span>
                )}
              </div>
              <div className="mypage-card__md-arrow">→</div>
            </Link>
          </section>

          {/* TIER 3 — 작은 카드 2종 */}
          <section className="mypage-hub__tier mypage-hub__tier-3">
            <Link href="/profile/settings" className="mypage-card mypage-card--sm">
              <span className="mypage-card__icon mypage-card__icon--sm">⚙</span>
              <div className="mypage-card__sm-text">
                <div className="mypage-card__sm-title">설정</div>
                <div className="mypage-card__sm-meta">계정·알림·개인정보·공개</div>
              </div>
              <div className="mypage-card__md-arrow">→</div>
            </Link>

            <Link href="/profile/billing" className="mypage-card mypage-card--sm">
              <span className="mypage-card__icon mypage-card__icon--sm">💳</span>
              <div className="mypage-card__sm-text">
                <div className="mypage-card__sm-title">결제·멤버십</div>
                <div className="mypage-card__sm-meta">
                  {isPro ? "BDR+ PRO 활성" : "결제 내역·구독"}
                </div>
              </div>
              <div className="mypage-card__md-arrow">→</div>
            </Link>
          </section>

          {/* IA Footnote — 16+ 페이지 색인 (collapsed) */}
          <details className="mypage-index">
            <summary>전체 페이지 색인 (16 + 외부 5)</summary>
            <div className="mypage-index__grid">
              {[
                ["/profile", "대시보드"],
                ["/profile/edit", "프로필 편집"],
                ["/profile/settings", "설정"],
                ["/profile/activity", "내 활동"],
                ["/profile/bookings", "예약 이력"],
                ["/profile/billing", "결제 내역"],
                ["/profile/achievements", "업적·배지"],
                ["/profile/growth", "성장 추이"],
                ["/profile/weekly-report", "주간 리포트"],
                ["/profile/complete", "프로필 완성"],
                ["/profile/notification-settings", "알림 설정"],
                ["/profile/payments", "결제"],
                ["/profile/preferences", "선호"],
                ["/profile/subscription", "멤버십"],
                ["/profile/basketball", "농구 데이터"],
                ["/profile/complete/preferences", "취향"],
                ["/games/my-games", "내 신청 내역", "ext"],
                ["/community/new", "글 작성", "ext"],
                ["/safety", "안전·차단", "ext"],
                ["/stats", "통계 분석", "ext"],
                ["/refund", "환불 정책", "ext"],
              ].map(([href, label, kind], i) => (
                <Link
                  key={i}
                  href={href as string}
                  className={`mypage-index__row${kind ? " mypage-index__row--ext" : ""}`}
                >
                  <span className="t-mono">{href}</span>
                  <span>{label}</span>
                  {kind && (
                    <span className="badge" style={{ fontSize: 9 }}>
                      EXT
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </details>
        </div>

        {/* ASIDE */}
        <aside className="mypage__aside">
          {/* 다음 경기 — D-N countdown */}
          {nextGame ? (
            <div className="card mypage-aside-card">
              <div className="mypage-aside-card__head">
                <span className="eyebrow" style={{ fontSize: 10 }}>
                  다음 경기
                </span>
              </div>
              <div className="mypage-next">
                <div className="mypage-next__d">D-{dDays ?? 0}</div>
                <div className="mypage-next__body">
                  <div className="mypage-next__title">{nextGame.title}</div>
                  <div className="mypage-next__meta">
                    {nextGame.venueName}
                    {nextGame.scheduledAt && (
                      <>
                        {" · "}
                        {nextGame.scheduledAt.toLocaleDateString("ko-KR", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </div>
                  <Link
                    href={`/games/${nextGame.id}`}
                    className="btn btn--sm"
                    style={{ marginTop: 8, width: "100%", display: "block", textAlign: "center" }}
                  >
                    경기 상세 →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="card mypage-aside-card">
              <div className="mypage-aside-card__head">
                <span className="eyebrow" style={{ fontSize: 10 }}>
                  다음 경기
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-mute)", padding: "8px 0" }}>
                예정된 경기가 없어요.
              </div>
              <Link href="/games" className="btn btn--sm" style={{ width: "100%", display: "block", textAlign: "center" }}>
                경기 둘러보기 →
              </Link>
            </div>
          )}

          {/* 2026-05-05 Phase 3 PR10+PR11 — 본인 pending 이적 진행 카드 (있으면 표시) */}
          <TransferProgressCard />

          {/* 소속 팀 — PR2: 다중 팀 목록 카드 (0팀 빈 상태 포함) */}
          <TeamsListCard teams={teamsList} />

          {/* 최근 활동 5건 */}
          {recent.length > 0 && (
            <div className="card mypage-aside-card">
              <div className="mypage-aside-card__head">
                <span className="eyebrow" style={{ fontSize: 10 }}>
                  최근 활동
                </span>
                <Link href="/profile/activity" className="mypage-aside-card__more">
                  전체
                </Link>
              </div>
              <ul className="mypage-recent">
                {recent.map((r) => (
                  <li key={r.key} className="mypage-recent__row">
                    <span className="mypage-recent__date t-mono">{r.date}</span>
                    <span className={`mypage-recent__tag mypage-recent__tag--${r.tag}`} />
                    <span className="mypage-recent__label">{r.label}</span>
                    <span className="mypage-recent__target">{r.target}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 도움말 */}
          <div className="card mypage-aside-card mypage-aside-card--help">
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              도움이 필요하세요?
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 10 }}>
              계정 / 결제 / 환불 문의는 24시간 이내 답변드려요.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Link
                href="/help"
                className="btn btn--sm"
                style={{ flex: 1, textAlign: "center" }}
              >
                도움말
              </Link>
              <Link
                href="/safety"
                className="btn btn--sm"
                style={{ flex: 1, textAlign: "center" }}
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

/* ============================================================
 * Spark — 시안 inline sparkline (내 성장 카드 시각 요소)
 *
 * 출처: BDR-current/screens/MyPage.jsx L344-363
 * 용도: hub 카드의 시각적 hint — 진짜 12주 데이터는 P1 /profile/growth 에서.
 * Server Component 호환 (SVG 만 사용).
 * ============================================================ */
function Spark({ values }: { values: number[] }) {
  const w = 220;
  const h = 44;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  const pts = values
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = pad + (values.length - 1) * step;
  const lastY =
    h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2);
  return (
    <svg
      className="mypage-card__spark"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="3" fill="var(--accent)" />
    </svg>
  );
}
