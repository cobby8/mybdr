import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
// Phase 2C: 팀 상세 히어로에서 한/영 병기 표시
import { getTeamDisplayNames } from "@/lib/utils/team-display";
// Phase 3: 공식 기록 가드 (미래 경기 + NULL 날짜 제외)
import { officialMatchWhere } from "@/lib/tournaments/official-match";
// 팀장 전용 "팀 관리" 버튼 노출 여부 판단에 현재 로그인 세션 필요
import { getWebSession } from "@/lib/auth/web-session";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { getDisplayName } from "@/lib/utils/player-display-name";

// Phase 3 Teams 상세 v2 — 8개 컴포넌트 조립
import { TeamHeroV2 } from "./_components_v2/team-hero-v2";
import { TeamTabsV2, type TeamTabKey, TEAM_TAB_KEYS } from "./_components_v2/team-tabs-v2";
import { OverviewTabV2 } from "./_components_v2/overview-tab-v2";
import { RosterTabV2 } from "./_components_v2/roster-tab-v2";
import { RecentTabV2, computeRecentForm } from "./_components_v2/recent-tab-v2";
import { StatsTabV2 } from "./_components_v2/stats-tab-v2";
import { TeamSideCardV2 } from "./_components_v2/team-side-card-v2";

export const revalidate = 60;

// SEO: 팀 상세 동적 메타데이터 — 기존 유지
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    select: { name: true, city: true },
  }).catch(() => null);
  if (!team) return { title: "팀 상세 | MyBDR" };
  const location = team.city ? ` (${team.city})` : "";
  return {
    title: `${team.name}${location} | MyBDR`,
    description: `${team.name} 팀의 로스터, 전적, 대회 이력을 확인하세요.`,
  };
}

// 팀 고유색 → 유효 accent 추출. 흰색/없음이면 BDR 네이비 fallback (기존 규칙 유지)
function resolveAccent(primary: string | null, secondary: string | null): string {
  if (!primary || primary.toLowerCase() === "#ffffff" || primary.toLowerCase() === "#fff") {
    if (!secondary || secondary.toLowerCase() === "#ffffff" || secondary.toLowerCase() === "#fff") {
      return "#1B3C87";
    }
    return secondary;
  }
  return primary;
}

// tag 추출 — 이유: Phase 3 Teams 목록(team-card-v2)과 동일 규칙으로 통일.
// 영문명 우선 → 없으면 한글명 첫 3글자. 모든 대문자.
function resolveTag(name: string, nameEn: string | null): string {
  const base = (nameEn && nameEn.trim()) || name.slice(0, 3);
  return base.trim().toUpperCase();
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  // v2 탭 키 4종(overview/roster/recent/stats). 알 수 없는 값이면 overview 폴백.
  const currentTab: TeamTabKey =
    (TEAM_TAB_KEYS as string[]).includes(tab ?? "")
      ? (tab as TeamTabKey)
      : "overview";

  // 팀 본조회 — 기존 include(teamMembers) 유지. memberCount 용.
  const team = await prisma.team.findUnique({
    where: { id: BigInt(id) },
    include: {
      teamMembers: {
        where: { status: "active" },
        include: { user: { select: { id: true, nickname: true, name: true } } },
        orderBy: [{ role: "asc" }],
      },
    },
  }).catch(() => null);
  if (!team) return notFound();

  // 기본 표시 데이터 준비
  const accent = resolveAccent(team.primaryColor, team.secondaryColor);
  const tag = resolveTag(team.name, team.name_en);
  const memberCount = team.teamMembers.length;
  // 시/구 조합 → 홈 코트 fallback (DB에 home_court 컬럼이 없기 때문)
  const location = [team.city, team.district].filter(Boolean).join(" ");
  const { primary: teamDisplayPrimary, secondary: teamDisplaySecondary } =
    getTeamDisplayNames(team.name, team.name_en, team.name_primary);

  // 이 팀의 TournamentTeam ID 목록
  const tournamentTeamIds = await prisma.tournamentTeam.findMany({
    where: { teamId: BigInt(id) },
    select: { id: true },
  });
  const ttIds = tournamentTeamIds.map((t) => t.id);

  // 이 팀이 참가한 공식 경기 → 승/패 집계 (기존 유지)
  const completedMatches = ttIds.length > 0 ? await prisma.tournamentMatch.findMany({
    where: officialMatchWhere({
      OR: [{ homeTeamId: { in: ttIds } }, { awayTeamId: { in: ttIds } }],
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    }),
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  }) : [];

  let wins = 0, losses = 0;
  for (const m of completedMatches) {
    const isHome = ttIds.some((ttId) => ttId === m.homeTeamId);
    const myScore = isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0);
    const oppScore = isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0);
    if (myScore > oppScore) wins++;
    else losses++;
  }
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : null;

  // ===== Rating + Rank (v2 Hero / Overview 전용) =====
  // 이유: v2 시안은 "레이팅 N · 전체 N위"를 표시한다. rating 필드가 DB에 없으므로
  // Phase 3 Teams 목록과 동일한 규칙으로 **wins**를 레이팅 값으로 사용하고,
  // wins desc 전체 순위를 rank로 산출한다 (가짜 수치 생성 금지 원칙).
  // 최소 비용으로: wins > 이 팀의 wins 인 팀 수를 세서 +1 = rank.
  const rating = wins;
  const higherCount = await prisma.team.count({
    where: { wins: { gt: wins } },
  }).catch(() => 0);
  const teamRank = higherCount + 1;

  // ===== 최근 폼 5칸 (사이드 카드용) =====
  // 별도 쿼리이지만 recent-tab-v2와 중복 제거를 위해 유틸 함수화.
  const recentForm = await computeRecentForm(BigInt(id));

  // ===== 운영진 여부 — captain/vice/manager 판정 =====
  // 이유(왜): P1-A에서 "팀 관리" 진입 권한을 captain → 운영진 3종으로 확대.
  // team.captainId 단순 비교만으로는 부팀장/매니저를 잡지 못하므로 teamMembers
  // (이미 본조회에 include 되어 있음)에서 role을 확인한다.
  const session = await getWebSession();
  let canManage = false;
  // 가입 신청 UI 제어용 — 로그인 여부 / 멤버 여부 / pending 신청 여부
  // 이유: 사이드 카드의 "팀 가입 신청" 버튼 표시 분기는 SSR에서 결정해야
  // 첫 렌더 부터 정확한 상태를 보여줄 수 있다 (깜빡임 방지).
  const isLoggedIn = !!session?.sub;
  let isMember = false;
  let hasPendingRequest = false;
  // Phase 10-4 — 팔로우 / 매치 신청 활성화에 필요한 SSR 사전 계산
  // isFollowing: 본 페이지 진입 시 팔로우 상태(첫 렌더 깜빡임 제거)
  // myManagedTeams: 본인이 운영진(captain/vice/manager)인 *다른* 팀들 — 매치 신청 모달의 from_team 후보
  let isFollowing = false;
  let myManagedTeams: { id: string; name: string }[] = [];
  if (session?.sub) {
    try {
      const userId = BigInt(session.sub);
      // 이미 active 멤버 목록에 포함되었는지 (팀 본조회의 teamMembers 재활용)
      const myMembership = team.teamMembers.find((m) => m.userId === userId);
      isMember = !!myMembership;
      // 운영진(captain/vice/manager) — 가입 신청/멤버 관리 진입 허용 대상.
      // 추가 쿼리 없이 본조회 결과 재활용 (성능/일관성 모두 이득).
      // A-3 보강 (2026-04-29): team_members.role 외에도 team.captainId 직접 매칭.
      // 이유: 김병곤 사례처럼 captain_id 가 유저로 설정됐지만 team_members 행이
      // 'director' 같은 운영자 외 role 로 등록된 경우 위 조건에서 누락 → manage 진입 불가.
      // captainId 매칭은 1쿼리도 추가 안 됨 (이미 위에서 team 본조회로 select 중).
      canManage =
        team.captainId === userId ||
        (!!myMembership &&
          (myMembership.role === "captain" ||
            myMembership.role === "vice" ||
            myMembership.role === "manager"));
      // pending 가입 신청이 있는지 (멤버가 아닌 경우에만 의미 있음)
      if (!isMember) {
        const pending = await prisma.team_join_requests.findFirst({
          where: { team_id: BigInt(id), user_id: userId, status: "pending" },
          select: { id: true },
        });
        hasPendingRequest = !!pending;
      }

      // Phase 10-4: 팔로우 상태 — 단일 행 조회 (uniq index 활용)
      const followRow = await prisma.team_follows.findUnique({
        where: { team_id_user_id: { team_id: BigInt(id), user_id: userId } },
        select: { id: true },
      });
      isFollowing = !!followRow;

      // Phase 10-4: 본인이 운영진인 다른 팀 목록 — 매치 신청 from_team 후보.
      // 현재 보고 있는 팀(BigInt(id)) 은 제외 (자기 팀에 자기 신청 금지 — API에서도 차단).
      const myMemberships = await prisma.teamMember.findMany({
        where: {
          userId,
          status: "active",
          role: { in: ["captain", "vice", "manager"] },
          teamId: { not: BigInt(id) },
        },
        include: { team: { select: { id: true, name: true } } },
        orderBy: [{ role: "asc" }],
      });
      myManagedTeams = myMemberships
        .filter((m) => m.team) // FK NULL 안전망
        .map((m) => ({ id: m.team.id.toString(), name: m.team.name }));
    } catch {
      canManage = false;
    }
  }

  // 팀장 닉네임 추출 — 사이드 카드 연락 영역 표시용
  const captainMember = team.teamMembers.find((m) => m.role === "captain");
  const captainName =
    captainMember?.user ? getDisplayName(captainMember.user) : null;

  // 창단 연도 — founded_year 우선, 없으면 created_at 연도
  const foundedYear =
    team.founded_year ??
    (team.createdAt ? new Date(team.createdAt).getFullYear() : null);

  // Hero 위 이미지 accent 의 ink(전경색) — 기본 흰색 유지 (충분한 대비 확보)
  const ink = "#FFFFFF";

  // 레이아웃 폭: .page (max-width 1200px) 사용 — 다른 v2 페이지와 폭 통일.
  // page--wide(1440px)은 헤더/푸터(1200px)와 어긋나 팀 페이지가 더 넓게 보였음.
  return (
    <div className="page">
      {/* 브레드크럼 — 기존 유지 */}
      <div style={{ marginBottom: 14 }}>
        <Breadcrumb
          items={[
            { label: "팀", href: "/teams" },
            { label: teamDisplayPrimary },
          ]}
        />
      </div>

      {/* 1) Hero — accent 카드형 블록 */}
      <TeamHeroV2
        accent={accent}
        ink={ink}
        tag={tag}
        teamName={teamDisplayPrimary}
        teamNameSecondary={teamDisplaySecondary}
        foundedYear={foundedYear}
        wins={wins}
        losses={losses}
        winRate={winRate}
        teamId={id}
        canManage={canManage}
        // Phase 10-4 — 팔로우/매치 신청 활성화 props
        isLoggedIn={isLoggedIn}
        isFollowing={isFollowing}
        myManagedTeams={myManagedTeams}
      />

      {/* 2) Tabs — sticky 네비 */}
      <TeamTabsV2 teamId={id} currentTab={currentTab} />

      {/* ===== 본문: 좌측 탭 컨텐츠 + 우측 사이드 카드 =====
          시안 grid: `minmax(0,1fr) 320px` — PC 이상에서만 2열, 모바일은 스택 */}
      <div
        className="grid items-start gap-6 lg:gap-6"
        style={{
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <div className="lg:grid lg:items-start lg:gap-6"
             style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
          {/* 좌측: 탭별 컨텐츠 */}
          <div className="min-w-0">
            <Suspense
              fallback={
                <div
                  className="card"
                  style={{ padding: 40, textAlign: "center", color: "var(--ink-mute)" }}
                >
                  불러오는 중…
                </div>
              }
            >
              {currentTab === "overview" && (
                <OverviewTabV2
                  description={team.description}
                  foundedYear={foundedYear}
                  homeCourt={location}
                  rating={rating}
                  teamRank={teamRank}
                />
              )}
              {currentTab === "roster" && (
                <RosterTabV2 teamId={team.id} accent={accent} />
              )}
              {currentTab === "recent" && (
                <RecentTabV2 teamId={team.id} />
              )}
              {currentTab === "stats" && <StatsTabV2 />}
            </Suspense>
          </div>

          {/* 우측: 사이드 카드 (최근 폼 + 연락) — 모바일에선 본문 아래로 스택 */}
          <div className="mt-6 lg:mt-0">
            <TeamSideCardV2
              recentForm={recentForm}
              captainName={captainName}
              teamId={id}
              // Phase 10-4 — 매치 신청 모달용
              teamName={teamDisplayPrimary}
              myManagedTeams={myManagedTeams}
              isLoggedIn={isLoggedIn}
              isMember={isMember}
              hasPendingRequest={hasPendingRequest}
            />
          </div>
        </div>
      </div>

      {/* 하단: 다른 팀 탐색 유도 — 기존 유지 */}
      <div style={{ marginTop: 32 }}>
        <Link
          href="/teams"
          className="btn"
          style={{ display: "inline-flex", gap: 6 }}
        >
          <span className="material-symbols-outlined text-base">groups</span>
          다른 팀 보기
        </Link>
      </div>
    </div>
  );
}
