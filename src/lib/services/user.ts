/**
 * User/Profile Service — 사용자 프로필 관련 비즈니스 로직 중앙화
 *
 * Service 함수는 순수 데이터만 반환한다 (NextResponse 사용 금지).
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
// Phase 3: 공식 기록 가드 (nested filter + raw SQL용)
import {
  officialMatchNestedFilter,
  OFFICIAL_MATCH_SQL_CONDITION,
} from "@/lib/tournaments/official-match";

// ---------------------------------------------------------------------------
// Select 상수
// ---------------------------------------------------------------------------

/** 프로필 상세 조회 select (GET /api/web/profile) */
export const PROFILE_DETAIL_SELECT = {
  // 기존 필드 (profile 조회용)
  nickname: true,
  email: true,
  position: true,
  height: true,
  city: true,
  bio: true,
  profile_image_url: true,
  total_games_participated: true,
  // 가입일 (profile-header에서 표시)
  createdAt: true,
  // 신규 필드 (profile/edit 용)
  name: true,
  phone: true,
  birth_date: true,
  district: true,
  weight: true,
  bank_name: true,
  bank_code: true,
  account_number: true,
  account_holder: true,
  // 소셜 로그인 제공자 표시용 (프로필 수정 페이지)
  provider: true,
  // 2026-05-01: 선출 여부 (대회 출전 차단 검증 대상)
  // 2026-05-05 PR1: default_jersey_number 제거 — team_members.jersey_number 단일 source 일원화
  is_elite: true,
  // 5/7: 운영 DB 에 name_verified 컬럼 적용됨 (me API 에서 정상 SELECT 중) — 활성화.
  //   profile/edit 의 verified 필드 잠금 분기에서 사용.
  name_verified: true,
  // 2026-05-02: D-6 EditProfile §2 / §3 / §4 박제 활성화 (사용자 옵션 B)
  dominant_hand: true,
  skill_level: true,
  strengths: true,
  privacy_settings: true,
  instagram_url: true,
  youtube_url: true,
  // 2026-05-04: F3+F4 회원가입 통합 — profile/edit §6 활동 환경 신규 6필드
  // F3 핵심 3종 (지역/게임유형) + skill_level 은 위 §2에 이미 포함. 본 select에 통합 추가.
  preferred_regions: true,        // F3: 17 시도 멀티 (Json 배열)
  preferred_game_types: true,     // F3: 5종 게임유형 멀티 (Json 배열)
  // F4 onboarding 5컬럼 (Phase 10-5)
  styles: true,                   // F4: 12종 스타일 ≤4 (String[])
  active_areas: true,             // F4: 활동지역 (Phase 10-5 onboarding 18종)
  goals: true,                    // F4: 6종 목표 (String[])
  play_frequency: true,           // F4: 4단계 빈도 (String?)
  // F5 자동 갱신 — 핵심 5필드 입력 시 true
  profile_completed: true,
} as const;

/** 게임 상세에서 사용하는 유저 프로필 select */
export const USER_GAME_PROFILE_SELECT = {
  name: true,
  nickname: true,
  phone: true,
  position: true,
  city: true,
  district: true,
  profile_completed: true,
  profileReminderShownAt: true,
  // Phase C (2026-05-02) — ApplyPanel "신청자 정보" 카드 노출용 (시안 GameDetail.jsx L102-106).
  // "L.5 · 가드 · 레이팅 1684" 형태로 본인 정보를 신청 폼 위에 미리 보여 자기 정보 확인을 돕는다.
  // 응답 형식 변경 0 (서버 컴포넌트 직접 호출 — 외부 노출 API 없음).
  skill_level: true,
} as const;

// ---------------------------------------------------------------------------
// Service 함수
// ---------------------------------------------------------------------------

/**
 * 프로필 상세 조회 — 팀, 경기, 대회 이력 포함
 *
 * M1 Day 7 확장: 허브 대시보드에서 쓰이는 3개 필드 병렬 조회 추가
 *  - followersCount: 나를 팔로우하는 사람 수
 *  - followingCount: 내가 팔로우하는 사람 수
 *  - nextGame:     내가 신청한 예정 경기 중 가장 빠른 1건 (미래만)
 *
 * 이유: 기존 4개 쿼리와 독립이라 Promise.all 한 배치에 넣어 latency 영향 0.
 * 기존 필드는 절대 건드리지 않음 (backward compatible).
 */
export async function getProfile(userId: bigint) {
  const now = new Date();

  const [
    user,
    teams,
    gameApplications,
    tournamentTeams,
    followersCount,
    followingCount,
    nextGameApp,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_DETAIL_SELECT,
    }),
    prisma.teamMember.findMany({
      where: { userId, status: "active" },
      include: { team: { select: { id: true, name: true } } },
      take: 10,
    }),
    prisma.game_applications.findMany({
      where: { user_id: userId },
      include: {
        games: {
          select: {
            id: true,
            uuid: true,
            title: true,
            scheduled_at: true,
            status: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10,
    }),
    prisma.tournamentTeamPlayer.findMany({
      where: { userId },
      include: {
        tournamentTeam: {
          include: {
            tournament: {
              select: { id: true, name: true, status: true },
            },
          },
        },
      },
      take: 10,
    }),

    // M1 Day 7: 팔로워/팔로잉 카운트 (실패해도 0으로 폴백 — 허브 렌더 안정성 우선)
    prisma.follows.count({ where: { following_id: userId } }).catch(() => 0),
    prisma.follows.count({ where: { follower_id: userId } }).catch(() => 0),

    // M1 Day 7: 다음 경기 — scheduled_at이 now 이후인 신청 건 중 가장 빠른 1건
    // 승인/대기 상관없이 "예정된 내 경기"로 간주. status=0(scheduled)이 대부분.
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
  ]);

  return {
    user,
    teams,
    gameApplications,
    tournamentTeams,
    followersCount,
    followingCount,
    nextGameApp,
  };
}

/**
 * 프로필 수정
 */
export async function updateProfile(
  userId: bigint,
  data: Record<string, unknown>
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      // 이유: 클라이언트가 PATCH 응답을 그대로 폼 상태에 반영하므로
      //       프로필 수정 페이지에 노출되는 9필드를 모두 응답에 포함시켜야
      //       "저장 후 화면이 입력값을 잃는" 사일런트 폴백을 제거할 수 있음.
      // 비고: 필드명은 schema.prisma User 모델의 컬럼명과 일치
      //       (height/weight/birth_date/district는 @map snake_case).
      nickname: true,
      position: true,
      height: true,
      weight: true,        // 추가 — 몸무게
      city: true,
      district: true,      // 추가 — 활동 지역(구·시군)
      bio: true,
      name: true,
      birth_date: true,    // 추가 — 생년월일
      // 2026-05-01: 선출 여부 (대회 출전 차단 검증)
      // 2026-05-05 PR1: default_jersey_number 제거 — team_members.jersey_number 단일 source 일원화
      is_elite: true,
      // 2026-05-02: D-6 EditProfile §2 / §3 / §4 박제 활성화 응답 select
      dominant_hand: true,
      skill_level: true,
      strengths: true,
      privacy_settings: true,
      instagram_url: true,
      youtube_url: true,
      // 2026-05-04: F3+F4 회원가입 통합 — PATCH 응답에서도 클라가 입력값 유지 가능하도록 select
      preferred_regions: true,
      preferred_game_types: true,
      styles: true,
      active_areas: true,
      goals: true,
      play_frequency: true,
      profile_completed: true,
    },
  });
}

/**
 * 유저 게임 프로필 조회 (게임 상세 페이지용)
 */
export async function getUserGameProfile(userId: bigint) {
  return prisma.user
    .findUnique({
      where: { id: userId },
      select: USER_GAME_PROFILE_SELECT,
    })
    .catch(() => null);
}

/**
 * 프로필 스탯 집계 — 커리어 평균 + 시즌 최고
 */
export async function getPlayerStats(userId: bigint) {
  // 유저의 tournamentTeamPlayer IDs 조회
  const players = await prisma.tournamentTeamPlayer.findMany({
    where: { userId },
    select: { id: true },
  });

  const playerIds = players.map((p) => p.id);
  if (playerIds.length === 0) {
    return { careerAverages: null, seasonHighs: null };
  }

  const [aggregate, maxStats] = await Promise.all([
    prisma.matchPlayerStat.aggregate({
      // Phase 3: nested tournamentMatch 필터로 공식 기록(치러진 경기)만 집계.
      // 미래 Flutter 테스트 데이터(예: 2030년 예약) + NULL 날짜 방어.
      where: {
        tournamentTeamPlayerId: { in: playerIds },
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
      _count: { id: true },
    }),
    prisma.matchPlayerStat.aggregate({
      // Phase 3: 시즌 최고 기록도 동일하게 공식 기록만 (테스트 데이터 제외)
      where: {
        tournamentTeamPlayerId: { in: playerIds },
        tournamentMatch: officialMatchNestedFilter(),
      },
      _max: {
        points: true,
        total_rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
      },
    }),
  ]);

  // --- 승률(Win Rate) 계산 (DB에서 직접 집계) ---
  // 기존: findMany로 N개 레코드 로딩 후 JS filter/count → 느림
  // 개선: SQL로 DB에서 바로 승수/전체 경기수를 count → 데이터 1행만 전송
  let winRate: number | null = null;

  if (aggregate._count.id > 0) {
    // raw SQL로 승률을 DB에서 직접 계산
    // - 결과 확정 경기(winner_team_id IS NOT NULL)만 대상
    // - winner_team_id = 선수 소속팀 ID이면 승리
    // - Phase 3: OFFICIAL_MATCH_SQL_CONDITION 삽입
    //   → status IN (completed, live) + scheduled_at <= NOW() + NOT NULL
    //   → Flutter 미래 테스트 데이터(id=120 사례) 방어
    const winRateResult = await prisma.$queryRaw<
      Array<{ total: bigint; wins: bigint }>
    >`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE tm.winner_team_id = ttp.tournament_team_id
        ) AS wins
      FROM match_player_stats mps
      JOIN tournament_matches tm ON tm.id = mps.tournament_match_id
      JOIN tournament_team_players ttp ON ttp.id = mps.tournament_team_player_id
      WHERE mps.tournament_team_player_id IN (${Prisma.join(playerIds)})
        AND tm.winner_team_id IS NOT NULL
        AND ${Prisma.raw(OFFICIAL_MATCH_SQL_CONDITION)}
    `;

    const { total, wins } = winRateResult[0];
    // bigint -> number 변환 후 승률 계산
    const totalNum = Number(total);
    const winsNum = Number(wins);

    if (totalNum > 0) {
      // 승률 = (승리수 / 전체 확정 경기수) * 100, 소수점 1자리
      winRate = Number(((winsNum / totalNum) * 100).toFixed(1));
    }
  }

  return {
    careerAverages: aggregate._count.id > 0
      ? {
          gamesPlayed: aggregate._count.id,
          avgPoints: Number((aggregate._avg.points ?? 0).toFixed(1)),
          avgRebounds: Number((aggregate._avg.total_rebounds ?? 0).toFixed(1)),
          avgAssists: Number((aggregate._avg.assists ?? 0).toFixed(1)),
          avgSteals: Number((aggregate._avg.steals ?? 0).toFixed(1)),
          avgBlocks: Number((aggregate._avg.blocks ?? 0).toFixed(1)),
        }
      : null,
    seasonHighs: {
      maxPoints: maxStats._max.points ?? 0,
      maxRebounds: maxStats._max.total_rebounds ?? 0,
      maxAssists: maxStats._max.assists ?? 0,
    },
    // 승률 (결과 확정 경기가 없으면 null)
    winRate,
  };
}

/**
 * 이번 달 경기 참가 수 — 활동 링 월간 챌린지용
 */
export async function getMonthlyGames(userId: bigint) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.game_applications.count({
    where: {
      user_id: userId,
      status: 1, // approved
      games: {
        scheduled_at: { gte: monthStart },
      },
    },
  }).catch(() => 0);

  return count;
}

/**
 * 유저 권한 확인 (게임 생성 시)
 */
export async function getUserPermissions(userId: bigint) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { membershipType: true, isAdmin: true },
  });
}
