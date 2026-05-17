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
// 5/9 Phase 2 — ActivityEvent + AllStatsRow 타입 (활동 로그 + 통산 모달용)
import type { ActivityEvent } from "./_v2/activity-log";
import type { AllStatsRow } from "./_v2/stats-detail-modal";

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

  // ---- 병렬 prefetch (12 쿼리) ----
  // 5/9 Phase 1: jerseyNumber fetch (Hero #N 노출 — 사용자 결정 Q3 노출)
  // 5/9 Phase 2 추가: mvpMatches (#10) + teamMemberHistory (#11) + allStatsForModal (#12)
  //   사유: 활동 로그 5종 통합 (match+mvp+team_history+jersey_changed+signup) + 통산 더보기 모달 prefetch
  const [
    user,
    statAgg,
    paperOnlyMinAgg,
    recentGames,
    playerStats,
    followRecord,
    followersCount,
    followingCount,
    userBadges,
    representativeJersey,
    mvpMatches,
    teamHistoryRows,
    allStatsForModal,
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
    // 2026-05-10 NBA 표준 fix: FG%/3P%/FT% 는 _avg (매치별 % 산술평균) 가 아닌 _sum (made/attempted 누적) 기반으로 계산.
    //   사유: 매치별 % 평균 = 시도 0 매치도 동등 weight → 왜곡 (정환조 39.8% vs 실제 9/29=31.0%)
    //   변경: _avg 에서 field_goal_percentage / three_point_percentage 제거. _sum 으로 made/attempted 누적 fetch.
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
          // 2026-05-17 paper 매치는 시간 박제 불가 → 후처리로 분리 계산 (paperOnlyMinAgg)
        },
        _sum: {
          // NBA 표준 % = 누적 메이드 / 누적 시도 (sum 기반 — 매치별 % 평균 X)
          fieldGoalsMade: true,
          fieldGoalsAttempted: true,
          threePointersMade: true,
          threePointersAttempted: true,
          freeThrowsMade: true,
          freeThrowsAttempted: true,
          // 2026-05-17 paper 분리 계산용
          minutesPlayed: true,
        },
        _count: { id: true },
      })
      .catch(() => null),

    // 2-b) paper 매치만 MIN _sum + _count — 통산 MIN 평균에서 제외하기 위한 차감용
    // 2026-05-17 사용자 결재 Q3: paper 매치는 시간 박제 불가 (FIBA 종이 기록지에 출전 시간 칸 없음)
    //   → flutter 매치만으로 MIN 평균 계산: (전체합 - paper합) / (전체수 - paper수)
    prisma.matchPlayerStat
      .aggregate({
        where: {
          tournamentTeamPlayer: { userId: userIdBigInt },
          tournamentMatch: {
            ...officialMatchNestedFilter(),
            settings: { path: ["recording_mode"], equals: "paper" },
          },
        },
        _sum: { minutesPlayed: true },
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

    // 10) MVP 수상 이력 — 활동 로그용 최근 5건 (Q1=A 5종 통합 — mvp 타입)
    // 왜: 사용자 결정 Q1=A — 활동 로그에 MVP 표시. 종료된 매치만 (status='ended' 또는 ended_at != null)
    prisma.tournamentMatch
      .findMany({
        where: {
          mvp_player_id: userIdBigInt,
          // 종료된 매치만 — ended_at NOT NULL 가드 (status 'ended' 외에도 백필 안전)
          ended_at: { not: null },
        },
        select: {
          id: true,
          match_code: true,
          match_number: true,
          ended_at: true,
          scheduledAt: true,
          tournament: {
            select: { name: true, short_code: true },
          },
        },
        orderBy: [
          { ended_at: { sort: "desc", nulls: "last" } },
          { scheduledAt: "desc" },
        ],
        take: 5,
      })
      .catch(() => []),

    // 11) TeamMemberHistory — 활동 로그용 최근 10건 (joined/left/jersey_changed/transferred 등)
    // 왜: 사용자 결정 Q1=A — 팀 가입/탈퇴/이적/등번호 변경 표시
    // take: 10 — 후처리 (signup/match/mvp 와 합쳐 최신 5건만 노출) 위해 여유 fetch
    prisma.teamMemberHistory
      .findMany({
        where: {
          userId: userIdBigInt,
          eventType: {
            in: [
              "joined",
              "left",
              "withdrawn",
              "jersey_changed",
              "jersey_change_approved",
              "transferred_in",
              "transferred_out",
            ],
          },
        },
        select: {
          id: true,
          eventType: true,
          payload: true,
          createdAt: true,
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      .catch(() => []),

    // 12) 전체 matchPlayerStat — 통산 모달 prefetch (Q7=A: findMany 1건 + 클라 groupBy)
    // 왜: 사용자 결정 Q7=A — 평균 사용자 100경기 미만 가정 / Prisma groupBy 한계 회피
    // 평균 사용자 데이터 ~5KB 미만 (1경기당 ~50bytes). 모달 즉시 노출 (prefetch 효과)
    // 2026-05-10: select 확장 — fieldGoalsMade/Attempted/threePointersMade/Attempted/freeThrowsMade/Attempted (sum 기반 NBA % 계산용)
    //             winner_team_id 추가 (승률 NBA 표준 일치 — 라이브 매치 winner=null 케이스 분모 제외)
    prisma.matchPlayerStat
      .findMany({
        where: {
          tournamentTeamPlayer: { userId: userIdBigInt },
          tournamentMatch: officialMatchNestedFilter(),
        },
        select: {
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          minutesPlayed: true,
          // NBA 표준 sum 기반 FG%/3P%/FT% 계산을 위한 made/attempted raw
          fieldGoalsMade: true,
          fieldGoalsAttempted: true,
          threePointersMade: true,
          threePointersAttempted: true,
          freeThrowsMade: true,
          freeThrowsAttempted: true,
          tournamentMatch: {
            select: {
              id: true,
              scheduledAt: true,
              homeScore: true,
              awayScore: true,
              homeTeamId: true,
              awayTeamId: true,
              // 승률 NBA 표준 (winner_team_id 기반 — 확정 매치만 분모) — 5/10 일관성 fix
              winner_team_id: true,
              tournament: {
                select: {
                  id: true,
                  name: true,
                  short_code: true,
                },
              },
            },
          },
          tournamentTeamPlayer: {
            select: { tournamentTeamId: true },
          },
        },
        orderBy: { tournamentMatch: { scheduledAt: "desc" } },
      })
      .catch(() => []),
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
  // 2026-05-10 — DB minutes_played 단위 = 초 (Int). 통산 mpg 표시 단위 = 분 → /60 변환.
  // 박스스코어 (formatGameClock) 는 초 그대로 사용해서 정상이지만 통산 _avg 는 단위 변환 누락이었음.
  // 2026-05-17 사용자 결재 Q3: paper 매치 MIN 합산 제외 → (전체합 - paper합) / (전체수 - paper수)
  //   사유: FIBA 종이 기록지에 출전 시간 칸 없음 = paper 매치 minutesPlayed = 0 박제 → 평균 왜곡 회피
  const totalMinSum = Number(statAgg?._sum?.minutesPlayed ?? 0);
  const paperMinSum = Number(paperOnlyMinAgg?._sum?.minutesPlayed ?? 0);
  const paperCount = paperOnlyMinAgg?._count?.id ?? 0;
  const flutterMinSum = totalMinSum - paperMinSum;
  const flutterCount = gamesPlayed - paperCount;
  const avgMinutes = flutterCount > 0 ? flutterMinSum / flutterCount / 60 : 0;
  // 2026-05-10 NBA 표준 fix — FG%/3P% 는 _sum 누적 메이드/시도 기반 (매치별 % 산술평균 X)
  // 정환조 케이스: 매치별 [100%, 40%, 0%, 50%, 9.1%] 평균 = 39.8% 잘못 / 9÷29 = 31.0% 정답
  const fgMade = Number(statAgg?._sum?.fieldGoalsMade ?? 0);
  const fgAttempted = Number(statAgg?._sum?.fieldGoalsAttempted ?? 0);
  const fgPctSum = fgAttempted > 0 ? (fgMade / fgAttempted) * 100 : 0;
  const threeMade = Number(statAgg?._sum?.threePointersMade ?? 0);
  const threeAttempted = Number(statAgg?._sum?.threePointersAttempted ?? 0);
  const threePctSum = threeAttempted > 0 ? (threeMade / threeAttempted) * 100 : 0;
  const seasonStats = {
    games: gamesPlayed,
    winRate: playerStats?.winRate ?? null,
    ppg: gamesPlayed > 0 ? Number(avgPoints.toFixed(1)) : null,
    rpg: gamesPlayed > 0 ? Number(avgRebounds.toFixed(1)) : null,
    apg: gamesPlayed > 0 ? Number(avgAssists.toFixed(1)) : null,
    // 2026-05-17 mpg = flutter 매치 수 기준 (paper 매치만 있으면 null)
    mpg: flutterCount > 0 ? Number(avgMinutes.toFixed(1)) : null,
    fgPct: fgAttempted > 0 ? Number(fgPctSum.toFixed(1)) : null,
    threePct: threeAttempted > 0 ? Number(threePctSum.toFixed(1)) : null,
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
  // 5/9 Phase 2 — Q2=A fix: gamesPlayed = statAgg._count.id (matchPlayerStat 통일)
  //   사유: user.total_games_participated 카운터가 백필 누락 케이스 발견 ("경기 참가 0" 버그)
  //   통산 카드와 동일 source 로 일관 (errors.md "데이터 소스 분기" 패턴 회피)
  const activity = {
    joinedAt: user.createdAt?.toISOString() ?? null,
    gamesPlayed, // Q2 fix — statAgg._count.id 재활용 (matchPlayerStat 실측)
    gamesHosted: user.total_games_hosted ?? 0,
    lastSeen: null as string | null,
    // lastLoginAt 은 Hero 의 "최근 접속" 에 사용하므로 여기는 null 로 두고 relative 문자열만 Hero 가 계산
  };

  // 5/9 Phase 2 — ActivityEvent[] 변환 (5종 통합 + 시간순 정렬, 최신 5건)
  // 왜: Q1=A — match + mvp + team_joined/left/transferred + jersey_changed + signup
  // 어떻게: 각 source → ActivityEvent 매핑 후 단일 배열 합산 → date desc sort → top 5
  const activityEvents: ActivityEvent[] = [];

  // (a) match 이벤트 — recentGames 의 종료 매치만 (scheduledAt 있고 status=ended)
  for (const g of recentGames) {
    const m = g.tournamentMatch;
    if (!m) continue;
    if (!m.scheduledAt) continue; // NULL 매치 제외 (시간 비교 불가)
    if (m.status !== "ended" && m.status !== "completed") continue; // 종료된 매치만
    const playerTtId = g.tournamentTeamPlayer.tournamentTeamId;
    const playerSide: "home" | "away" | null =
      playerTtId === m.homeTeamId ? "home" : playerTtId === m.awayTeamId ? "away" : null;
    // 결과 (W/L) — 동점이거나 playerSide 모르면 null
    let resultText: string | null = null;
    if (
      playerSide &&
      m.homeScore != null &&
      m.awayScore != null &&
      m.homeScore !== m.awayScore
    ) {
      const homeWins = m.homeScore > m.awayScore;
      const won = (playerSide === "home" && homeWins) || (playerSide === "away" && !homeWins);
      resultText = won ? "W" : "L";
    }
    const homeName = m.homeTeam?.team?.name ?? "?";
    const awayName = m.awayTeam?.team?.name ?? "?";
    activityEvents.push({
      type: "match",
      date: m.scheduledAt.toISOString(),
      matchId: m.id.toString(),
      matchCode: m.match_code ?? null,
      title: `${homeName} vs ${awayName}`,
      subtitle:
        m.homeScore != null && m.awayScore != null ? `${m.homeScore}:${m.awayScore}` : "",
      result: resultText as "W" | "L" | null,
    });
  }

  // (b) mvp 이벤트 — mvpMatches → mvp 타입 매핑
  for (const m of mvpMatches) {
    const date = m.ended_at ?? m.scheduledAt;
    if (!date) continue;
    activityEvents.push({
      type: "mvp",
      date: date.toISOString(),
      matchId: m.id.toString(),
      tournamentName: m.tournament?.name ?? "대회",
    });
  }

  // (c) teamMemberHistory 이벤트 — eventType 분기 매핑
  // payload Json 가드 — { old?:{jersey?:number}, new?:{jersey?:number} } 추정 형식
  for (const h of teamHistoryRows) {
    if (!h.team) continue; // 팀 삭제된 케이스 안전
    const teamId = h.team.id.toString();
    const teamName = h.team.name;
    const dateIso = h.createdAt.toISOString();
    if (h.eventType === "joined") {
      activityEvents.push({ type: "team_joined", date: dateIso, teamId, teamName });
    } else if (h.eventType === "left" || h.eventType === "withdrawn") {
      activityEvents.push({ type: "team_left", date: dateIso, teamId, teamName });
    } else if (h.eventType === "transferred_in") {
      activityEvents.push({
        type: "team_transferred",
        direction: "in",
        date: dateIso,
        teamId,
        teamName,
      });
    } else if (h.eventType === "transferred_out") {
      activityEvents.push({
        type: "team_transferred",
        direction: "out",
        date: dateIso,
        teamId,
        teamName,
      });
    } else if (
      h.eventType === "jersey_changed" ||
      h.eventType === "jersey_change_approved"
    ) {
      // payload 형식 가드 (5/9 reviewer fix) — 실제 형식 = { old: number | null, new: number | null, requestId, requestType, reason }
      // 운영 source: src/app/api/web/teams/[id]/requests/[requestId]/route.ts L233~239
      let oldJersey: number | null = null;
      let newJersey: number | null = null;
      try {
        const p = h.payload as
          | { old?: number | null; new?: number | null }
          | null
          | undefined;
        if (typeof p?.old === "number") oldJersey = p.old;
        if (typeof p?.new === "number") newJersey = p.new;
      } catch {
        /* payload 형식 알 수 없음 — fallback 표시 */
      }
      activityEvents.push({
        type: "jersey_changed",
        date: dateIso,
        teamId,
        teamName,
        oldJersey,
        newJersey,
      });
    }
  }

  // (d) signup 이벤트 (1건) — user.createdAt
  if (user.createdAt) {
    activityEvents.push({ type: "signup", date: user.createdAt.toISOString() });
  }

  // (e) 정렬 (Q8=A: 최신 우선) + 상위 5건
  activityEvents.sort((a, b) => b.date.localeCompare(a.date));
  const top5Events = activityEvents.slice(0, 5);

  // ---- 통산 모달용 raw rows 변환 (Q7=A: 클라에서 groupBy) ----
  // 5/9 Phase 2: matchPlayerStat → AllStatsRow[] (클라 모달이 연도별/대회별 groupBy)
  // BigInt → string 변환 (직렬화) / Decimal → number 변환 / NULL safe
  // 2026-05-10 NBA 표준 fix:
  //   (1) minutes — DB 단위 = 초 → 모달 표시 단위 = 분 (/60 변환). 박스스코어 (formatGameClock) 만 초 사용
  //   (2) won — winner_team_id 기준 (NBA 표준 / 라이브 매치 winner=null 분모 제외) — 상단 통산 winRate 와 일관
  //   (3) FG/3P/FT made/attempted raw 전달 — 모달 buildRow 에서 sum/sum 계산 (매치별 % 평균 X)
  const allStatsRows: AllStatsRow[] = allStatsForModal
    .filter((r) => r.tournamentMatch != null)
    .map((r) => {
      const m = r.tournamentMatch!;
      const playerTtId = r.tournamentTeamPlayer.tournamentTeamId;
      // playerSide 판별 → won 계산 (승률 표시용)
      const playerSide: "home" | "away" | null =
        playerTtId === m.homeTeamId ? "home" : playerTtId === m.awayTeamId ? "away" : null;
      // 2026-05-10 — won 정의 변경: 상단 통산 winRate (winner_team_id 기반) 와 일관
      // 라이브 매치 (winner_team_id NULL) 는 won=false 처리되지만, 모달 buildRow 의 분모는
      // "확정 매치만" 이 아닌 "전체 row" 라 미세 왜곡. 하지만 페이지 상단 winRate 는 별도 source
      // (getPlayerStats / SQL 조건) 라 일치. 모달 표 자체는 다른 row 기반 → 사용자 결재로 일치 우선.
      const matchTtId = playerSide === "home" ? m.homeTeamId : playerSide === "away" ? m.awayTeamId : null;
      const won = m.winner_team_id != null && matchTtId != null && m.winner_team_id === matchTtId;
      return {
        points: Number(r.points ?? 0),
        rebounds: Number(r.total_rebounds ?? 0),
        assists: Number(r.assists ?? 0),
        steals: Number(r.steals ?? 0),
        // /60 변환 — DB 초 → 표시 분 (모달 mpg 회귀 fix)
        minutes: Number(r.minutesPlayed ?? 0) / 60,
        // raw made/attempted 전달 (모달 buildRow 가 sum/sum NBA 표준 % 계산)
        fgMade: Number(r.fieldGoalsMade ?? 0),
        fgAttempted: Number(r.fieldGoalsAttempted ?? 0),
        threeMade: Number(r.threePointersMade ?? 0),
        threeAttempted: Number(r.threePointersAttempted ?? 0),
        ftMade: Number(r.freeThrowsMade ?? 0),
        ftAttempted: Number(r.freeThrowsAttempted ?? 0),
        scheduledAt: m.scheduledAt?.toISOString() ?? null,
        won,
        tournamentId: m.tournament?.id ?? null,
        tournamentName: m.tournament?.name ?? null,
        tournamentShortCode: m.tournament?.short_code ?? null,
      };
    });

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
            // 5/9 Phase 2 추가: 활동 로그 5종 통합 (Q1=A) + 통산 모달 raw rows (Q7=A)
            events={top5Events}
            allStatsRows={allStatsRows}
          />
        }
        games={<RecentGamesTab matches={recentGameRows} />}
      />
    </div>
  );
}
