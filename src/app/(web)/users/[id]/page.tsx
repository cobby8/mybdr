import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";
import { getDisplayName } from "@/lib/utils/player-display-name";
import { USER_DISPLAY_SELECT } from "@/lib/db/select-presets";
// 5/9 NBA 스타일 개선 — 공식 기록 가드 (미래/예약 매치 noise 제거 / 5/2 회귀 패턴 fix)
import { officialMatchNestedFilter } from "@/lib/tournaments/official-match";
// 5/9 신규 — 글로벌 PlayerMatchCard props 타입 (변환 로직에서 사용)
import type { PlayerMatchCardProps } from "@/components/match/PlayerMatchCard";

import { PlayerHero } from "./_v2/player-hero";
import { ProfileTabs } from "./_v2/profile-tabs";
import { OverviewTab } from "./_v2/overview-tab";
import { RecentGamesTab } from "./_v2/recent-games-tab";
import { ActionButtons } from "./_components/action-buttons";

/**
 * 타인 프로필 페이지 (/users/[id]) — v2 재구성 (서버 컴포넌트)
 *
 * 왜 이렇게 작성하나 (PM 확정 D-P1~D-P8 반영):
 * - D-P5: 탭 2개만 (개요 + 최근 경기). 시즌별 평균/vs 전적 탭 제거.
 * - D-P6: 슛존/스카우팅 섹션 제거 → overview 탭은 시즌 스탯 + aside(팀·활동·뱃지).
 * - D-P7: isOwner 면 /profile 로 redirect (본인 진입 시 대시보드 유도).
 * - D-P8: user_badges 쿼리 추가 (읽기만, 서버 컴포넌트 Prisma 직접 호출).
 * - 누락 필드 4개 (bio/gender/evaluation_rating/total_games_hosted) 전부 화면 표시.
 *
 * 어떻게:
 * - Promise.all 병렬 prefetch (8 쿼리) — user+team join / stat aggregate / recent games /
 *   playerStats / follow record / follower/following counts / user_badges.
 * - 클라이언트 탭 스위처(ProfileTabs) 는 overview·games 노드를 prop 으로 받음.
 * - 그라디언트 배경은 소속팀 primaryColor (없으면 var(--bdr-red)) 기반.
 */

// 60초 ISR 유지
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user
    .findUnique({
      where: { id: BigInt(id) },
      select: { ...USER_DISPLAY_SELECT, position: true },
    })
    .catch(() => null);
  if (!user) return { title: "선수 프로필 | MyBDR" };
  // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
  const displayName = getDisplayName(user);
  return {
    title: `${displayName} 프로필 | MyBDR`,
    description: `${displayName}의 경기 기록과 능력치를 확인하세요.`,
  };
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;
  const userIdBigInt = BigInt(id);

  // 세션 먼저 체크 — 본인이면 /profile redirect (D-P7)
  // 2026-05-02: ?preview=1 query 시 본인도 공개 프로필 미리보기 가능 (마이페이지 → 공개 프로필 버튼 흐름)
  const session = await getWebSession();
  const isLoggedIn = !!session;
  const isOwner = !!session && BigInt(session.sub) === userIdBigInt;
  if (isOwner && preview !== "1") {
    redirect("/profile");
  }

  // ---- 병렬 prefetch (9 쿼리) ----
  // 5/9: jerseyNumber fetch 추가 (Hero #N 노출 — 사용자 결정 Q3 노출)
  const [
    user,
    statAgg,
    recentGames,
    playerStats,
    followRecord,
    followersCount,
    followingCount,
    userBadges,
    representativeJersey,
  ] = await Promise.all([
    // 1) user + 소속 팀 (is_public / active 공개 팀만 이후 필터)
    prisma.user
      .findUnique({
        where: { id: userIdBigInt },
        select: {
          id: true,
          name: true,
          nickname: true,
          position: true,
          height: true,
          weight: true,
          city: true,
          district: true,
          bio: true,
          gender: true,
          evaluation_rating: true,
          total_games_hosted: true,
          total_games_participated: true,
          profile_image_url: true,
          xp: true,
          createdAt: true,
          last_login_at: true,
          teamMembers: {
            where: { status: "active" },
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
                  city: true,
                  district: true,
                  is_public: true,
                  status: true,
                  primaryColor: true,
                },
              },
            },
            orderBy: { joined_at: "desc" },
          },
        },
      })
      .catch(() => null),

    // 2) 경기 집계 (PPG/APG/RPG/STL/MIN/FG%/3P% 평균) — Phase 3 공식 기록만
    // 5/9 변경: BPG 제거 + minutesPlayed/field_goal_percentage/three_point_percentage 추가
    //   사유: 사용자 결정 Q4=C-3 (8열 — 경기/승률/PPG/RPG/APG/MIN/FG%/3P%).
    //   BPG = mybdr 데이터 우선순위 낮음. 모바일 4×2 grid 일관성 ↑
    // 5/9 추가: officialMatchNestedFilter 가드로 미래/예약 매치 noise 제거 (5/2 회귀 패턴 fix)
    prisma.matchPlayerStat
      .aggregate({
        where: {
          tournamentTeamPlayer: { userId: userIdBigInt },
          tournamentMatch: officialMatchNestedFilter(),
        },
        _avg: {
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          blocks: true,
          minutesPlayed: true,
          field_goal_percentage: true,
          three_point_percentage: true,
        },
        _count: { id: true },
      })
      .catch(() => null),

    // 3) 최근 경기 10건 (recent games 탭용) — 5/9 카드형 재구성용 select 대폭 확장
    // 추가 필드: blocks/minutesPlayed/field-goal/3pt 슈팅, tournamentTeamPlayer.tournamentTeamId (playerSide 판별),
    //           tournamentMatch.match_code/match_number/group_name/court_number/status/score/homeTeam/awayTeam
    // orderBy 변경: createdAt desc → tournamentMatch.scheduledAt desc (백필 시 역전 가능 회피)
    // officialMatchNestedFilter 가드 추가: 미래/예약 매치 noise 제거
    prisma.matchPlayerStat
      .findMany({
        where: {
          tournamentTeamPlayer: { userId: userIdBigInt },
          tournamentMatch: officialMatchNestedFilter(),
        },
        select: {
          id: true,
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          blocks: true,
          minutesPlayed: true,
          fieldGoalsMade: true,
          fieldGoalsAttempted: true,
          threePointersMade: true,
          threePointersAttempted: true,
          // 본인 팀이 홈/원정 어느 쪽인지 판별 — playerSide 핵심
          tournamentTeamPlayer: {
            select: { tournamentTeamId: true },
          },
          tournamentMatch: {
            select: {
              id: true,
              match_code: true,
              match_number: true,
              group_name: true,
              roundName: true,
              scheduledAt: true,
              court_number: true,
              status: true,
              homeScore: true,
              awayScore: true,
              homeTeamId: true,
              awayTeamId: true,
              // 5/9 fix: TournamentTeam 자체에는 name 컬럼 없음 → team.name 사용 (Team relation)
              homeTeam: {
                select: {
                  id: true,
                  team: { select: { name: true, logoUrl: true } },
                },
              },
              awayTeam: {
                select: {
                  id: true,
                  team: { select: { name: true, logoUrl: true } },
                },
              },
            },
          },
        },
        orderBy: { tournamentMatch: { scheduledAt: "desc" } },
        take: 10,
      })
      .catch(() => []),

    // 4) 승률 계산
    getPlayerStats(userIdBigInt).catch(() => null),

    // 5) 팔로우 여부 (로그인 상태일 때만)
    session
      ? prisma.follows
          .findUnique({
            where: {
              follower_id_following_id: {
                follower_id: BigInt(session.sub),
                following_id: userIdBigInt,
              },
            },
          })
          .catch(() => null)
      : Promise.resolve(null),

    // 6) 팔로워 수
    prisma.follows
      .count({ where: { following_id: userIdBigInt } })
      .catch(() => 0),

    // 7) 팔로잉 수
    prisma.follows
      .count({ where: { follower_id: userIdBigInt } })
      .catch(() => 0),

    // 8) user_badges (D-P8) — 최신 4건
    prisma.user_badges
      .findMany({
        where: { user_id: userIdBigInt },
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

    // 9) 대표 jerseyNumber — 가장 최근 등록된 ttp 의 jersey (Hero #N 노출용)
    // 왜 first? ttp 1명당 N개 (대회별) 등록 가능 → 최근 1건이 "대표" 의미
    prisma.tournamentTeamPlayer
      .findFirst({
        where: { userId: userIdBigInt, jerseyNumber: { not: null } },
        select: { jerseyNumber: true },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null),
  ]);

  if (!user) return notFound();

  const isFollowing = !!followRecord;

  // ---- 레벨 ----
  const level = getProfileLevelInfo(user.xp);

  // ---- 공개 팀 필터 (기존 로직 유지) ----
  const publicTeams = user.teamMembers
    .filter((tm) => {
      const t = tm.team;
      if (!t) return false;
      if (t.status !== "active") return false;
      if (t.is_public === false) return false;
      return true;
    })
    .map((tm) => ({
      id: tm.team.id.toString(),
      name: tm.team.name,
      primaryColor: tm.team.primaryColor,
      logoUrl: tm.team.logoUrl,
    }));

  // 대표 팀 (Hero 그라디언트 / 이름)
  const primaryTeam = publicTeams[0] ?? null;

  // ---- 시즌 스탯 (OverviewTab 8열 — Q4=C-3) ----
  // 5/9 변경: 6열(경기/승률/PPG/APG/RPG/BPG) → 8열(경기/승률/PPG/RPG/APG/MIN/FG%/3P%)
  // 사유: BPG 우선순위 낮음 (mybdr 데이터). MIN/FG%/3P% = NBA 핵심 지표 + 모바일 4×2 grid 일관성
  // _avg 키는 prisma Decimal | null 가능 → Number() 변환 + null safe
  const gamesPlayed = statAgg?._count?.id ?? 0;
  const avgPoints = Number(statAgg?._avg?.points ?? 0);
  const avgRebounds = Number(statAgg?._avg?.total_rebounds ?? 0);
  const avgAssists = Number(statAgg?._avg?.assists ?? 0);
  const avgMinutes = Number(statAgg?._avg?.minutesPlayed ?? 0);
  const avgFgPct = Number(statAgg?._avg?.field_goal_percentage ?? 0);
  const avg3pPct = Number(statAgg?._avg?.three_point_percentage ?? 0);
  const seasonStats = {
    games: gamesPlayed,
    winRate: playerStats?.winRate ?? null,
    ppg: gamesPlayed > 0 ? Number(avgPoints.toFixed(1)) : null,
    rpg: gamesPlayed > 0 ? Number(avgRebounds.toFixed(1)) : null,
    apg: gamesPlayed > 0 ? Number(avgAssists.toFixed(1)) : null,
    mpg: gamesPlayed > 0 ? Number(avgMinutes.toFixed(1)) : null,
    fgPct: gamesPlayed > 0 ? Number(avgFgPct.toFixed(1)) : null,
    threePct: gamesPlayed > 0 ? Number(avg3pPct.toFixed(1)) : null,
  };

  // ---- 최근 경기 변환 (PlayerMatchCard props 매핑) ----
  // 5/9 변경: board__row 단순 행 → 카드형 (대회상세 ScheduleTimeline 패턴)
  // playerSide 판별: ttp.tournamentTeamId === match.homeTeamId/awayTeamId 비교
  // 승/패 (W/L): 본인 팀 기준, status==="completed" 일 때만 의미 있음
  const recentGameRows: PlayerMatchCardProps[] = recentGames
    .filter((g) => g.tournamentMatch != null) // tournamentMatch 가 NULL 인 경우 제외 (안전)
    .map((g) => {
      const m = g.tournamentMatch!;
      const playerTtId = g.tournamentTeamPlayer.tournamentTeamId;
      // 홈/원정 판별 — 매치는 항상 homeTeamId/awayTeamId 모두 NOT NULL 가정 (TBD 매치는 status=scheduled 인데 위에서 제외됨)
      const playerSide: "home" | "away" | null =
        playerTtId === m.homeTeamId
          ? "home"
          : playerTtId === m.awayTeamId
            ? "away"
            : null;

      return {
        matchId: m.id.toString(),
        matchCode: m.match_code ?? null,
        matchNumber: m.match_number ?? null,
        groupName: m.group_name ?? null,
        roundName: m.roundName ?? null,
        scheduledAt: m.scheduledAt?.toISOString() ?? null,
        courtNumber: m.court_number ?? null,
        status: m.status ?? null,
        homeTeamName: m.homeTeam?.team?.name ?? null,
        homeTeamLogoUrl: m.homeTeam?.team?.logoUrl ?? null,
        homeScore: m.homeScore ?? null,
        awayTeamName: m.awayTeam?.team?.name ?? null,
        awayTeamLogoUrl: m.awayTeam?.team?.logoUrl ?? null,
        awayScore: m.awayScore ?? null,
        playerStat: {
          points: g.points ?? 0,
          rebounds: g.total_rebounds ?? 0,
          assists: g.assists ?? 0,
          steals: g.steals ?? 0,
        },
        playerSide,
      };
    });

  // ---- 뱃지 변환 ----
  const badges = userBadges.map((b) => ({
    id: b.id.toString(),
    badgeType: b.badge_type,
    badgeName: b.badge_name,
    earnedAt: b.earned_at.toISOString(),
  }));

  // ---- 활동 요약 (overview aside) ----
  const activity = {
    joinedAt: user.createdAt?.toISOString() ?? null,
    gamesPlayed: user.total_games_participated ?? 0,
    gamesHosted: user.total_games_hosted ?? 0,
    lastSeen: null as string | null,
    // lastLoginAt 은 Hero 의 "최근 접속" 에 사용하므로 여기는 null 로 두고 relative 문자열만 Hero 가 계산
  };

  // ---- Hero / 평점 ----
  const evaluationRating = user.evaluation_rating != null ? Number(user.evaluation_rating) : null;

  // followersCount/followingCount 는 현재 UI 에 노출하지 않지만 반환된 값은 차후 확장용
  void followersCount;
  void followingCount;

  return (
    <div className="page">
      <PlayerHero
        user={{
          nickname: user.nickname,
          name: user.name,
          profile_image_url: user.profile_image_url,
          position: user.position,
          height: user.height,
          weight: user.weight,
          city: user.city,
          district: user.district,
          bio: user.bio,
          gender: user.gender,
          evaluation_rating: evaluationRating,
          createdAt: user.createdAt?.toISOString() ?? null,
          lastLoginAt: user.last_login_at?.toISOString() ?? null,
          // 5/9 신규: 대표 jersey (Q3 = 노출). null 이면 미노출
          jerseyNumber: representativeJersey?.jerseyNumber ?? null,
        }}
        level={level}
        teamColor={primaryTeam?.primaryColor ?? null}
        teamName={primaryTeam?.name ?? null}
        actionSlot={
          // 로그인 상태면 팔로우/메시지, 비로그인이면 안내 없음 (기본 렌더 없음)
          <ActionButtons
            targetUserId={id}
            initialFollowed={isFollowing}
            isLoggedIn={isLoggedIn}
          />
        }
      />

      <ProfileTabs
        overview={
          <OverviewTab
            stats={seasonStats}
            teams={publicTeams}
            badges={badges}
            activity={activity}
            bio={user.bio}
          />
        }
        games={<RecentGamesTab matches={recentGameRows} />}
      />
    </div>
  );
}
