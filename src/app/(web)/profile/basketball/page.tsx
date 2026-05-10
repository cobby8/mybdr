import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getPlayerStats } from "@/lib/services/user";
import { getProfileLevelInfo } from "@/lib/profile/gamification";
// 5/9 재구성: server component 전환 — 공개 프로필 패턴 카피 (page.tsx /users/[id])
//   사용자 결정 Q1=K-1 (server component 전환 / SWR client → server)
import { officialMatchNestedFilter } from "@/lib/tournaments/official-match";

// PlayerMatchCard props 타입 (변환 로직)
import type { PlayerMatchCardProps } from "@/components/match/PlayerMatchCard";
// 공개 프로필 컴포넌트 cross-route import (Q5 — 디렉토리 룰 위반 X / 공개+본인 동일 컴포넌트)
import { PlayerHero } from "@/app/(web)/users/[id]/_v2/player-hero";
import { RecentGamesTab } from "@/app/(web)/users/[id]/_v2/recent-games-tab";
import { ActivityLog, type ActivityEvent } from "@/app/(web)/users/[id]/_v2/activity-log";
import type { AllStatsRow } from "@/app/(web)/users/[id]/_v2/stats-detail-modal";

// 본 페이지 client wrapper + 신규 컴포넌트들 (Q3, Q4 채택)
import { CareerStatsSection } from "./_components/career-stats-section";
import {
  MyPendingRequestsCard,
  type PendingRequest,
} from "./_components/my-pending-requests-card";
import {
  NextTournamentMatchCard,
  type NextMatchInfo,
} from "./_components/next-tournament-match-card";

// 운영 페이지 보존 영역 (소속팀 / 참가 대회 / 픽업 게임 / 주간 리포트) — toss 컴포넌트
import { TossCard } from "@/components/toss/toss-card";
import { TossListItem } from "@/components/toss/toss-list-item";
import { TossSectionHeader } from "@/components/toss/toss-section-header";

/**
 * 내 농구 페이지 (/profile/basketball) — 공개프로필 흡수 + 본인 전용 강화 (5/9)
 *
 * 왜 이렇게 작성하나 (사용자 결재 Q1~Q6 일괄 채택):
 *  - Q1=K-1: server component 전환 (SWR client → server / 공개 프로필 패턴 일관)
 *  - Q2=L-1: 10 영역 super-set (공개프로필 흡수 + 본인 전용 추가)
 *  - Q3=M-1: 진행 중 신청 3종 통합 카드 (team_join + team_member_requests + transfer_requests)
 *  - Q4=N-1: 다음 대회 매치 카드
 *  - Q5=Y-2: CareerStatsGrid 글로벌 추출
 *  - Q6=W-1: 시안 박제 운영 동등 갱신 (별도 작업)
 *
 * 어떻게:
 *  - Promise.all 14 쿼리 병렬 (공개 프로필 9 + 본인 전용 5)
 *  - 본인 한정 (where userId = session.sub) — IDOR 0
 *  - PlayerHero / ActivityLog / RecentGamesTab = 공개프로필 컴포넌트 직접 재사용
 *  - StatsDetailModal = client wrapper (CareerStatsSection) 분리
 *  - MyPendingRequestsCard / NextTournamentMatchCard = 신규 본인 전용
 *  - 운영 보존 영역 = 픽업 게임 (game_applications) + 참가 대회 + 주간 리포트
 *
 *  - 비로그인 → /login redirect
 *  - 본인 정보만 노출 (다른 사용자 데이터 노출 0 — IDOR 가드)
 */

// SSR — server component
export const metadata: Metadata = {
  title: "내 농구 | MyBDR",
  description: "본인의 농구 활동·통계·신청 현황을 한 곳에서 확인하세요.",
};

// 경기 상태 라벨 매핑 (운영 영역 ⑨ 픽업 게임 status 라벨)
function getGameStatus(status: number): string {
  switch (status) {
    case 0:
      return "예정";
    case 1:
      return "진행중";
    case 2:
      return "종료";
    default:
      return "예정";
  }
}

export default async function BasketballPage() {
  // ===== 인증 가드 — 비로그인 → /login redirect =====
  const session = await getWebSession();
  if (!session) redirect("/login?redirect=/profile/basketball");
  const userId = BigInt(session.sub);

  // ===== Promise.all 14 쿼리 병렬 prefetch =====
  // 1~9: 공개 프로필 page.tsx 와 동일 (본인 한정 where userId)
  // 10~14: 본인 전용 신규 (pending 3종 + 다음 매치 + 픽업 게임)
  const [
    user,
    statAgg,
    recentGames,
    playerStats,
    representativeJersey,
    mvpMatches,
    teamHistoryRows,
    allStatsForModal,
    tournamentTeamPlayers,
    pendingJoinRequests,
    pendingMemberRequests,
    pendingTransfers,
    nextTournamentMatch,
    gameApplications,
  ] = await Promise.all([
    // 1) user + 소속 팀 (공개 프로필 패턴 카피 + 본인 한정)
    prisma.user
      .findUnique({
        where: { id: userId },
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

    // 2) 통산 8열 aggregate (PPG/RPG/APG/MIN/FG%/3P% — Phase 1 8열)
    // 2026-05-10 NBA 표준 fix: FG%/3P% 매치별 % 평균 → _sum (made/attempted 누적) 기반 sum/sum
    //   사유: 시도 0 매치 동등 weight 왜곡 회피 (정환조 39.8% vs 31.0% 케이스)
    prisma.matchPlayerStat
      .aggregate({
        where: {
          tournamentTeamPlayer: { userId },
          tournamentMatch: officialMatchNestedFilter(),
        },
        _avg: {
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          blocks: true,
          minutesPlayed: true,
        },
        _sum: {
          // NBA 표준 % = 누적 made / 누적 attempted (sum 기반)
          fieldGoalsMade: true,
          fieldGoalsAttempted: true,
          threePointersMade: true,
          threePointersAttempted: true,
          freeThrowsMade: true,
          freeThrowsAttempted: true,
        },
        _count: { id: true },
      })
      .catch(() => null),

    // 3) 최근 경기 10건 (PlayerMatchCard 변환 source)
    prisma.matchPlayerStat
      .findMany({
        where: {
          tournamentTeamPlayer: { userId },
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
          tournamentTeamPlayer: { select: { tournamentTeamId: true } },
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

    // 4) 승률 (getPlayerStats helper)
    getPlayerStats(userId).catch(() => null),

    // 5) 대표 jerseyNumber (Hero 노출용)
    prisma.tournamentTeamPlayer
      .findFirst({
        where: { userId, jerseyNumber: { not: null } },
        select: { jerseyNumber: true },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null),

    // 6) MVP 수상 이력 (활동 로그 mvp 종)
    prisma.tournamentMatch
      .findMany({
        where: {
          mvp_player_id: userId,
          ended_at: { not: null },
        },
        select: {
          id: true,
          match_code: true,
          match_number: true,
          ended_at: true,
          scheduledAt: true,
          tournament: { select: { name: true, short_code: true } },
        },
        orderBy: [
          { ended_at: { sort: "desc", nulls: "last" } },
          { scheduledAt: "desc" },
        ],
        take: 5,
      })
      .catch(() => []),

    // 7) TeamMemberHistory (활동 로그 — 가입/탈퇴/이적/등번호)
    prisma.teamMemberHistory
      .findMany({
        where: {
          userId,
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

    // 8) 통산 모달 prefetch (전체 matchPlayerStat — 클라 groupBy)
    // 2026-05-10: select 확장 — fieldGoalsMade/Attempted/threePointersMade/Attempted/freeThrowsMade/Attempted (sum 기반 NBA % 계산용)
    //             winner_team_id 추가 (승률 NBA 표준 / 라이브 매치 분모 제외)
    prisma.matchPlayerStat
      .findMany({
        where: {
          tournamentTeamPlayer: { userId },
          tournamentMatch: officialMatchNestedFilter(),
        },
        select: {
          points: true,
          total_rebounds: true,
          assists: true,
          steals: true,
          minutesPlayed: true,
          // NBA 표준 sum/sum % 계산용 raw made/attempted
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
              // 승률 NBA 표준 (winner_team_id 기반) — 라이브 매치 분모 제외
              winner_team_id: true,
              tournament: {
                select: { id: true, name: true, short_code: true },
              },
            },
          },
          tournamentTeamPlayer: { select: { tournamentTeamId: true } },
        },
        orderBy: { tournamentMatch: { scheduledAt: "desc" } },
      })
      .catch(() => []),

    // 9) 참가 대회 (운영 보존 — TournamentTeamPlayer + tournament info)
    prisma.tournamentTeamPlayer
      .findMany({
        where: { userId },
        select: {
          id: true,
          tournamentTeam: {
            select: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                  short_code: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      .catch(() => []),

    // 10) 진행 중 신청 — team_join_requests (snake_case 모델)
    prisma.team_join_requests
      .findMany({
        where: { user_id: userId, status: "pending" },
        select: {
          id: true,
          team_id: true,
          preferred_jersey_number: true,
          created_at: true,
          teams: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
      })
      .catch(() => []),

    // 11) 진행 중 신청 — TeamMemberRequest (jersey_change/dormant/withdraw)
    prisma.teamMemberRequest
      .findMany({
        where: { userId, status: "pending" },
        select: {
          id: true,
          requestType: true,
          payload: true,
          createdAt: true,
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),

    // 12) 진행 중 신청 — TransferRequest (양쪽 승인 state)
    prisma.transferRequest
      .findMany({
        where: { userId, finalStatus: "pending" },
        select: {
          id: true,
          fromTeamId: true,
          toTeamId: true,
          createdAt: true,
          fromTeam: { select: { id: true, name: true } },
          toTeam: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),

    // 13) 다음 대회 매치 (가장 가까운 미래 1건)
    // 본인 ttp 가 속한 tournamentTeam 의 home/away 매치 중 scheduledAt > now + status='scheduled'
    prisma.tournamentMatch
      .findFirst({
        where: {
          status: "scheduled",
          scheduledAt: { gte: new Date() },
          OR: [
            { homeTeam: { players: { some: { userId } } } },
            { awayTeam: { players: { some: { userId } } } },
          ],
        },
        select: {
          id: true,
          match_code: true,
          match_number: true,
          group_name: true,
          roundName: true,
          scheduledAt: true,
          court_number: true,
          homeTeamId: true,
          awayTeamId: true,
          tournament: { select: { name: true, short_code: true } },
          homeTeam: {
            select: {
              id: true,
              players: { where: { userId }, select: { id: true } },
              team: { select: { name: true } },
            },
          },
          awayTeam: {
            select: {
              id: true,
              players: { where: { userId }, select: { id: true } },
              team: { select: { name: true } },
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
      })
      .catch(() => null),

    // 14) 픽업 게임 신청 (운영 영역 ⑨ — game_applications + games)
    prisma.game_applications
      .findMany({
        where: { user_id: userId },
        select: {
          id: true,
          status: true,
          created_at: true,
          games: {
            select: {
              id: true,
              title: true,
              scheduled_at: true,
              status: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 5,
      })
      .catch(() => []),
  ]);

  // user 가 없으면 세션 무효 — 로그인으로
  if (!user) redirect("/login?redirect=/profile/basketball");

  // ---- 레벨 (Hero 표시) ----
  const level = getProfileLevelInfo(user.xp);

  // ---- 공개 팀 필터 (소속 팀 풀 리스트) ----
  // 본인 페이지이므로 is_public=false 팀도 본인은 볼 수 있어야 함 → 운영 페이지 정합 위해 status='active' 만 필터
  // (공개 프로필은 추가로 is_public 필터)
  const myTeams = user.teamMembers
    .filter((tm) => tm.team && tm.team.status === "active")
    .map((tm) => ({
      id: tm.team.id.toString(),
      name: tm.team.name,
      primaryColor: tm.team.primaryColor,
      logoUrl: tm.team.logoUrl,
    }));

  // 대표 팀 (Hero 그라디언트)
  const primaryTeam = myTeams[0] ?? null;

  // ---- 통산 8열 stats (CareerStatsGrid props) ----
  const gamesPlayed = statAgg?._count?.id ?? 0;
  const avgPoints = Number(statAgg?._avg?.points ?? 0);
  const avgRebounds = Number(statAgg?._avg?.total_rebounds ?? 0);
  const avgAssists = Number(statAgg?._avg?.assists ?? 0);
  // 2026-05-10 — DB minutes_played 단위 = 초 (Int). 통산 mpg 표시 단위 = 분 → /60 변환.
  // 박스스코어 (formatGameClock) 는 초 그대로 사용해서 정상이지만 통산 _avg 는 단위 변환 누락이었음.
  const avgMinutes = Number(statAgg?._avg?.minutesPlayed ?? 0) / 60;
  // 2026-05-10 NBA 표준 fix — FG%/3P% 는 _sum 누적 메이드/시도 기반 (매치별 % 산술평균 X)
  const fgMadeSum = Number(statAgg?._sum?.fieldGoalsMade ?? 0);
  const fgAttSum = Number(statAgg?._sum?.fieldGoalsAttempted ?? 0);
  const fgPctSum = fgAttSum > 0 ? (fgMadeSum / fgAttSum) * 100 : 0;
  const threeMadeSum = Number(statAgg?._sum?.threePointersMade ?? 0);
  const threeAttSum = Number(statAgg?._sum?.threePointersAttempted ?? 0);
  const threePctSum = threeAttSum > 0 ? (threeMadeSum / threeAttSum) * 100 : 0;
  const careerStats = {
    games: gamesPlayed,
    winRate: playerStats?.winRate ?? null,
    ppg: gamesPlayed > 0 ? Number(avgPoints.toFixed(1)) : null,
    rpg: gamesPlayed > 0 ? Number(avgRebounds.toFixed(1)) : null,
    apg: gamesPlayed > 0 ? Number(avgAssists.toFixed(1)) : null,
    mpg: gamesPlayed > 0 ? Number(avgMinutes.toFixed(1)) : null,
    fgPct: fgAttSum > 0 ? Number(fgPctSum.toFixed(1)) : null,
    threePct: threeAttSum > 0 ? Number(threePctSum.toFixed(1)) : null,
  };

  // ---- 최근 경기 변환 (PlayerMatchCard props) ----
  // 공개 프로필 page.tsx 의 변환 로직 카피 — 본인 한정만 차이
  const recentGameRows: PlayerMatchCardProps[] = recentGames
    .filter((g) => g.tournamentMatch != null)
    .map((g) => {
      const m = g.tournamentMatch!;
      const playerTtId = g.tournamentTeamPlayer.tournamentTeamId;
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

  // ---- 활동 로그 5종 통합 (공개 프로필 패턴 카피) ----
  const activityEvents: ActivityEvent[] = [];
  // (a) match
  for (const g of recentGames) {
    const m = g.tournamentMatch;
    if (!m || !m.scheduledAt) continue;
    if (m.status !== "ended" && m.status !== "completed") continue;
    const playerTtId = g.tournamentTeamPlayer.tournamentTeamId;
    const playerSide: "home" | "away" | null =
      playerTtId === m.homeTeamId ? "home" : playerTtId === m.awayTeamId ? "away" : null;
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
  // (b) mvp
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
  // (c) teamMemberHistory
  for (const h of teamHistoryRows) {
    if (!h.team) continue;
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
    } else if (h.eventType === "jersey_changed" || h.eventType === "jersey_change_approved") {
      let oldJersey: number | null = null;
      let newJersey: number | null = null;
      try {
        const p = h.payload as { old?: number | null; new?: number | null } | null | undefined;
        if (typeof p?.old === "number") oldJersey = p.old;
        if (typeof p?.new === "number") newJersey = p.new;
      } catch {
        /* payload 형식 알 수 없음 — fallback */
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
  // (d) signup
  if (user.createdAt) {
    activityEvents.push({ type: "signup", date: user.createdAt.toISOString() });
  }
  // (e) sort + top 5
  activityEvents.sort((a, b) => b.date.localeCompare(a.date));
  const top5Events = activityEvents.slice(0, 5);

  // ---- 통산 모달용 raw rows 변환 (공개 프로필 패턴 카피) ----
  // 2026-05-10 NBA 표준 fix:
  //   (1) minutes /60 변환 (DB 초 → 표시 분)
  //   (2) won — winner_team_id 기반 (NBA 표준 / 라이브 매치 winner=null 분모 제외)
  //   (3) raw made/attempted 전달 → 모달 buildRow 에서 sum/sum % 계산
  const allStatsRows: AllStatsRow[] = allStatsForModal
    .filter((r) => r.tournamentMatch != null)
    .map((r) => {
      const m = r.tournamentMatch!;
      const playerTtId = r.tournamentTeamPlayer.tournamentTeamId;
      const playerSide: "home" | "away" | null =
        playerTtId === m.homeTeamId ? "home" : playerTtId === m.awayTeamId ? "away" : null;
      // 2026-05-10 — won: winner_team_id 기반 (상단 통산 winRate 와 일관)
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

  // ---- 진행 중 신청 통합 (3 source → PendingRequest[]) ----
  // Q3=M-1: team_join + team_member_requests (jersey/dormant/withdraw) + transfer_requests
  // 정렬: createdAt desc (최신 우선)
  const pendingRequests: PendingRequest[] = [];
  // (a) team_join_requests — 팀 가입 신청
  for (const r of pendingJoinRequests) {
    if (!r.teams) continue;
    pendingRequests.push({
      kind: "team_join",
      id: r.id.toString(),
      teamId: r.teams.id.toString(),
      teamName: r.teams.name,
      requestedAt: r.created_at.toISOString(),
      preferredJersey: r.preferred_jersey_number ?? null,
    });
  }
  // (b) team_member_requests — 등번호/휴면/탈퇴 (requestType 분기)
  for (const r of pendingMemberRequests) {
    if (!r.team) continue;
    const teamId = r.team.id.toString();
    const teamName = r.team.name;
    const requestedAt = r.createdAt.toISOString();
    // payload 가드 — type 별 필드 다름
    const payload = r.payload as Record<string, unknown> | null | undefined;
    if (r.requestType === "jersey_change") {
      // payload: { newJersey?: number, oldJersey?: number, old?: number, new?: number }
      // 다양한 형식 안전 추출
      let oldJersey: number | null = null;
      let newJersey: number | null = null;
      if (payload) {
        const oldV = payload.oldJersey ?? payload.old;
        const newV = payload.newJersey ?? payload.new;
        if (typeof oldV === "number") oldJersey = oldV;
        if (typeof newV === "number") newJersey = newV;
      }
      pendingRequests.push({
        kind: "jersey_change",
        id: r.id.toString(),
        teamId,
        teamName,
        requestedAt,
        oldJersey,
        newJersey,
      });
    } else if (r.requestType === "dormant") {
      // payload: { until?: ISO 또는 null }
      let until: string | null = null;
      if (payload && typeof payload.until === "string") until = payload.until;
      pendingRequests.push({
        kind: "dormant",
        id: r.id.toString(),
        teamId,
        teamName,
        requestedAt,
        until,
      });
    } else if (r.requestType === "withdraw") {
      pendingRequests.push({
        kind: "withdraw",
        id: r.id.toString(),
        teamId,
        teamName,
        requestedAt,
      });
    }
  }
  // (c) transfer_requests — 양쪽 승인 (입단/전출 양면 관점)
  // 본인이 신청자 → 출발 팀(fromTeam)에서 도착 팀(toTeam)으로 가려고 하는 중
  // 단일 row 가 두 사이드 정보 다 가짐 → 사용자 인식 위해 입단(transfer_in) 1건으로 표현
  for (const t of pendingTransfers) {
    if (!t.fromTeam || !t.toTeam) continue;
    pendingRequests.push({
      kind: "transfer_in",
      id: t.id.toString(),
      teamId: t.toTeam.id.toString(),
      teamName: t.toTeam.name,
      requestedAt: t.createdAt.toISOString(),
      fromTeamName: t.fromTeam.name,
    });
  }
  // 정렬 — 최신 우선
  pendingRequests.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

  // ---- 다음 대회 매치 (NextMatchInfo) ----
  // 본인이 home 인지 away 인지 판별 (players { where userId } take 결과로 판별)
  let nextMatchInfo: NextMatchInfo | null = null;
  if (nextTournamentMatch) {
    const m = nextTournamentMatch;
    const isHome = (m.homeTeam?.players?.length ?? 0) > 0;
    const isAway = (m.awayTeam?.players?.length ?? 0) > 0;
    const myTeamSide: "home" | "away" | null = isHome ? "home" : isAway ? "away" : null;
    nextMatchInfo = {
      matchId: m.id.toString(),
      matchCode: m.match_code ?? null,
      matchNumber: m.match_number ?? null,
      groupName: m.group_name ?? null,
      roundName: m.roundName ?? null,
      scheduledAt: m.scheduledAt!.toISOString(), // where 가드로 NOT NULL 보장
      courtNumber: m.court_number != null ? Number(m.court_number) : null,
      tournamentName: m.tournament?.name ?? null,
      tournamentShortCode: m.tournament?.short_code ?? null,
      homeTeamName: m.homeTeam?.team?.name ?? null,
      awayTeamName: m.awayTeam?.team?.name ?? null,
      myTeamSide,
    };
  }

  // ---- Hero / 평점 ----
  const evaluationRating = user.evaluation_rating != null ? Number(user.evaluation_rating) : null;

  // ---- 참가 대회 변환 (운영 영역 ⑦) ----
  // 중복 제거 (한 대회에 여러 ttp 가능 — tournament.id 기준 dedup)
  const tournamentMap = new Map<string, { id: string; name: string; status: string | null }>();
  for (const ttp of tournamentTeamPlayers) {
    const t = ttp.tournamentTeam?.tournament;
    if (!t) continue;
    if (!tournamentMap.has(t.id)) {
      tournamentMap.set(t.id, {
        id: t.id,
        name: t.name,
        status: t.status,
      });
    }
  }
  const tournaments = Array.from(tournamentMap.values()).slice(0, 5);

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 space-y-5">
      {/* 페이지 헤더 — 운영 보존 ([← 마이페이지] / 내 농구) */}
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-surface)]"
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: "var(--color-text-secondary)" }}
          >
            arrow_back
          </span>
        </Link>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
          내 농구
        </h1>
      </div>

      {/* ① 진행 중 신청 카드 (Q3=M-1) — 0건이면 카드 자체 hidden */}
      {pendingRequests.length > 0 && (
        <MyPendingRequestsCard requests={pendingRequests} />
      )}

      {/* ② Hero — 공개 프로필 PlayerHero 직접 재사용 (actionSlot 없음 = 본인 모드) */}
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
          jerseyNumber: representativeJersey?.jerseyNumber ?? null,
        }}
        level={level}
        teamColor={primaryTeam?.primaryColor ?? null}
        teamName={primaryTeam?.name ?? null}
        // actionSlot 미전달 → 본인 페이지 = 팔로우/메시지 버튼 미렌더링 (PlayerHero 자체가 actionSlot 없으면 미노출)
      />

      {/* ③ 통산 8열 + [더보기 →] 모달 (CareerStatsSection client wrapper) */}
      <CareerStatsSection stats={careerStats} allStatsRows={allStatsRows} />

      {/* ④ 활동 로그 5건 (공개 프로필 ActivityLog 직접 재사용) */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          활동
        </div>
        <ActivityLog events={top5Events} />
      </div>

      {/* ⑤ 최근 경기 — PlayerMatchCard 5건 (공개 프로필 RecentGamesTab 직접 재사용) */}
      <div>
        <TossSectionHeader title="최근 경기 (대회)" />
        <RecentGamesTab matches={recentGameRows.slice(0, 5)} />
      </div>

      {/* ⑥ 소속 팀 (운영 보존 — 풀 리스트) */}
      <div>
        <TossSectionHeader title="소속 팀" actionLabel="전체보기" actionHref="/teams" />
        <TossCard className="p-0">
          {myTeams.length > 0 ? (
            myTeams.map((team) => (
              <TossListItem
                key={team.id}
                icon="groups"
                iconBg={team.primaryColor ?? "var(--color-primary)"}
                title={team.name}
                subtitle="소속 중"
                href={`/teams/${team.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span
                className="material-symbols-outlined text-3xl mb-2 block"
                style={{ color: "var(--color-text-disabled)" }}
              >
                group_add
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                소속 팀이 없어요
              </p>
              <Link
                href="/teams"
                className="inline-block mt-2 text-xs font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                팀 찾아보기
              </Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* ⑦ 참가 대회 (운영 보존 — #my-tournaments 앵커 유지) */}
      <div id="my-tournaments">
        <TossSectionHeader
          title="참가 대회"
          actionLabel="전체보기"
          actionHref="/tournaments"
        />
        <TossCard className="p-0">
          {tournaments.length > 0 ? (
            tournaments.map((t) => (
              <TossListItem
                key={t.id}
                icon="emoji_events"
                iconBg="var(--color-tier-gold)"
                title={t.name}
                subtitle={t.status ?? ""}
                href={`/tournaments/${t.id}`}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span
                className="material-symbols-outlined text-3xl mb-2 block"
                style={{ color: "var(--color-text-disabled)" }}
              >
                emoji_events
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                참가한 대회가 없어요
              </p>
              <Link
                href="/tournaments"
                className="inline-block mt-2 text-xs font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                대회 찾아보기
              </Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* ⑧ 다음 대회 매치 카드 (Q4=N-1) — 미래 매치 0건 시 카드 자체 hidden */}
      {nextMatchInfo && <NextTournamentMatchCard match={nextMatchInfo} />}

      {/* ⑨ 픽업 게임 신청 (운영 보존 — game_applications) */}
      <div>
        <TossSectionHeader
          title="픽업 게임 신청"
          actionLabel="전체보기"
          actionHref="/games"
        />
        <TossCard className="p-0">
          {gameApplications.length > 0 ? (
            gameApplications.map((app) => (
              <TossListItem
                key={app.id.toString()}
                icon="sports_basketball"
                iconBg="var(--color-accent)"
                title={app.games?.title ?? "경기"}
                subtitle={
                  app.games?.scheduled_at
                    ? new Date(app.games.scheduled_at).toLocaleDateString("ko-KR")
                    : "일정 미정"
                }
                rightText={app.games ? getGameStatus(app.games.status) : "-"}
                href={app.games ? `/games/${app.games.id.toString()}` : undefined}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <span
                className="material-symbols-outlined text-3xl mb-2 block"
                style={{ color: "var(--color-text-disabled)" }}
              >
                sports_basketball
              </span>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                픽업 게임 신청이 없어요
              </p>
              <Link
                href="/games"
                className="mt-3 inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-light)]"
              >
                <span className="material-symbols-outlined text-base">search</span>
                경기 찾아보기
              </Link>
            </div>
          )}
        </TossCard>
      </div>

      {/* ⑩ 주간 운동 리포트 링크 (운영 보존) */}
      <TossCard className="p-0">
        <TossListItem
          icon="bar_chart"
          iconBg="var(--color-info, #0079B9)"
          title="주간 운동 리포트"
          subtitle="이번주 운동 요약과 지난주 비교"
          href="/profile/weekly-report"
        />
      </TossCard>
    </div>
  );
}
