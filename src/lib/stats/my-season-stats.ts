/**
 * /stats — 본인 시즌 스탯 집계 헬퍼 (PR-MOCK-TO-REAL ① / 0 스키마 / read-only)
 *
 * 왜 이 파일이 필요한가:
 *   /stats 시안 대시보드(KPI·득점추이·클럽순위·경기로그)는 "본인 시즌 집계"를 요구한다.
 *   설계 실측 결과 UserSeasonStat / ShotZoneStat 테이블은 0행(cron 미동작 — Phase 13+ 예정)이라
 *   직접 SELECT 하면 영구 빈화면이 된다. 따라서 유일한 실 source 인 MatchPlayerStat(2375행)을
 *   findMany 1건으로 끌어와 JS 로 시즌 가공한다. (decisions[2026-05-09] Q7=A 선례 답습)
 *
 * 0 스키마 원칙:
 *   - 신규 컬럼/테이블 0. MatchPlayerStat 기보유 컬럼 + tournamentMatch 관계만 SELECT.
 *   - getPlayerStats(user.ts)는 공개 프로필 등 여러 호출처 공유라 회귀면이 넓다 → 미변경.
 *     본 파일을 신규 분리해 회귀를 격리한다.
 *
 * 왜 findMany 1건 + JS 가공인가:
 *   groupBy 로는 _sum + 시즌 분기(연도) + 승패 판정 + GAME_LOG row 를 한 번에 못 푼다.
 *   실측상 평균 사용자 <100경기(최다 7경기)라 JS 가공 비용은 무시 가능하다.
 *
 * 모든 쿼리 read-only. apiSuccess 미경유(서버 prisma 직접) → 반환은 camelCase 일관.
 */

import { prisma } from "@/lib/db/prisma";
import { officialMatchNestedFilter } from "@/lib/tournaments/official-match";

/** KPI 8칸 + 승률 — 선택 시즌(또는 커리어)의 합산 평균/비율 */
export interface MySeasonTotals {
  /** 시즌 연도 또는 "career" */
  seasonYear: number | "career";
  gamesPlayed: number;
  wins: number;
  losses: number;
  /** 결과 확정 경기 0 → null */
  winRate: number | null;
  /** 경기당 평균 (소수점 1자리) */
  ppg: number;
  apg: number;
  rpg: number;
  spg: number;
  /** 시즌 합산 made/att 비율(%). att 0 → null("-" 표기, 0% 왜곡 금지) */
  fgPct: number | null;
  tpPct: number | null;
  ftPct: number | null;
}

/** 경기 로그 1행 (= MatchPlayerStat 1 row, 매치당 선수 1행) */
export interface MyGameLogRow {
  /** scheduledAt → "MM.DD" */
  date: string;
  /** 상대팀명 (본인팀 아닌 쪽). 없으면 null */
  opponentName: string | null;
  minutes: number;
  points: number;
  rebounds: number;
  assists: number;
  /** "made/att" 문자열 */
  fg: string;
  tp: string;
  /** 승/패/미정 */
  result: "W" | "L" | "-";
}

/** 클럽(팀) 동료 대비 본인 부문 순위 — 시안 "클럽 내 순위" */
export interface MyClubRank {
  label: string;
  /** 본인 등수 (1부터) */
  rank: number;
  /** 비교 모수(동료 포함 N명) */
  of: number;
}

/** 득점 추이(TREND) — 경기별 득점 시계열(오래된→최근) */
export type MyTrendPoint = number;

export interface MySeasonStatsResult {
  /** 선택 시즌 totals. 시즌 기록 0건 → null */
  totals: MySeasonTotals | null;
  /** 선택 시즌 경기 로그(최신순) */
  gameLog: MyGameLogRow[];
  /** 선택 시즌 득점 추이(오래된→최근 순서) */
  trend: MyTrendPoint[];
  /** 클럽 내 순위(부문별). 동료 부족 부문은 생략 */
  clubRanks: MyClubRank[];
  /** 데이터 존재 시즌 연도 목록(내림차순) — 시즌 셀렉터 칩 생성용 */
  seasons: number[];
  /** ttp 0건(출전 이력 없음) 여부 — 빈상태 분기용 */
  hasNoTtp: boolean;
}

/** GAME_LOG 최근 N 경기 */
const GAME_LOG_LIMIT = 12;

/**
 * matchPlayerStat.findMany 의 select 결과 1행 타입.
 * 관계 tournamentMatch 에서 시즌연도/승패/상대팀명 산출에 필요한 필드만 가져온다.
 */
type StatRow = {
  minutesPlayed: number | null;
  points: number | null;
  total_rebounds: number | null;
  assists: number | null;
  steals: number | null;
  fieldGoalsMade: number | null;
  fieldGoalsAttempted: number | null;
  threePointersMade: number | null;
  threePointersAttempted: number | null;
  freeThrowsMade: number | null;
  freeThrowsAttempted: number | null;
  /** 이 stat row 의 ttp(본인 소속) — 승패 판정 시 본인팀 id */
  tournamentTeamPlayerId: bigint;
  tournamentMatch: {
    scheduledAt: Date | null;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    winner_team_id: bigint | null;
    homeTeam: { team: { name: string | null } | null } | null;
    awayTeam: { team: { name: string | null } | null } | null;
  };
};

/** null/undefined 숫자를 0 으로 안전 변환 */
const n = (v: number | null | undefined): number => v ?? 0;

/** 합산 made/att → 백분율(소수1자리). att 0 이면 null(정직 표기) */
function pct(made: number, att: number): number | null {
  if (att <= 0) return null;
  return Number(((made / att) * 100).toFixed(1));
}

/** 경기당 평균(소수1자리). games 0 → 0 */
function perGame(sum: number, games: number): number {
  if (games <= 0) return 0;
  return Number((sum / games).toFixed(1));
}

/**
 * 본인 시즌 스탯 전체 산출.
 *
 * @param userId  세션 user.id (BigInt)
 * @param season  선택 시즌(연도 Int) 또는 "career"(전 시즌 합)
 * @returns       totals/gameLog/trend/clubRanks/seasons. ttp 0 → hasNoTtp=true.
 */
export async function getMySeasonStats(
  userId: bigint,
  season: number | "career",
): Promise<MySeasonStatsResult> {
  // 1) 본인 출전 ttp 목록 (userId → ttp). tournamentTeamId 는 승패/클럽순위 판정용.
  const myTtps = await prisma.tournamentTeamPlayer.findMany({
    where: { userId },
    select: { id: true, tournamentTeamId: true },
  });

  // 출전 이력 0 → 빈상태(시안 mock 노출 ❌)
  if (myTtps.length === 0) {
    return {
      totals: null,
      gameLog: [],
      trend: [],
      clubRanks: [],
      seasons: [],
      hasNoTtp: true,
    };
  }

  const myTtpIds = myTtps.map((t) => t.id);
  // 본인 ttp → 소속 팀(tournamentTeamId) 매핑 — 승패 판정 시 "어느 팀이 내 팀인지"
  const myTeamIdByTtp = new Map<string, bigint>(
    myTtps.map((t) => [t.id.toString(), t.tournamentTeamId]),
  );

  // 2) 본인 전 경기 stat row (공식 기록 가드 + 최신순). 시즌 분기는 JS 에서 처리.
  //    관계 tournamentMatch 에서 시즌연도/승패/상대팀명 산출 필드만 select.
  const rows = (await prisma.matchPlayerStat.findMany({
    where: {
      tournamentTeamPlayerId: { in: myTtpIds },
      tournamentMatch: officialMatchNestedFilter(),
    },
    select: {
      minutesPlayed: true,
      points: true,
      total_rebounds: true,
      assists: true,
      steals: true,
      fieldGoalsMade: true,
      fieldGoalsAttempted: true,
      threePointersMade: true,
      threePointersAttempted: true,
      freeThrowsMade: true,
      freeThrowsAttempted: true,
      tournamentTeamPlayerId: true,
      tournamentMatch: {
        select: {
          scheduledAt: true,
          homeTeamId: true,
          awayTeamId: true,
          winner_team_id: true,
          homeTeam: { select: { team: { select: { name: true } } } },
          awayTeam: { select: { team: { select: { name: true } } } },
        },
      },
    },
    orderBy: { tournamentMatch: { scheduledAt: "desc" } },
  })) as StatRow[];

  // 3) 시즌 목록(연도 distinct, 내림차순) — 셀렉터 칩 생성용.
  //    scheduledAt 가드(officialMatchNestedFilter)로 not null 보장되나 방어적으로 체크.
  const seasonSet = new Set<number>();
  for (const r of rows) {
    const at = r.tournamentMatch.scheduledAt;
    if (at) seasonSet.add(at.getFullYear());
  }
  const seasons = Array.from(seasonSet).sort((a, b) => b - a);

  // 4) 선택 시즌 필터 — "career"면 전체, 연도면 해당 연도만.
  const seasonRows =
    season === "career"
      ? rows
      : rows.filter(
          (r) => r.tournamentMatch.scheduledAt?.getFullYear() === season,
        );

  // 선택 시즌 기록 0건 → totals null(다른 시즌 칩은 노출되므로 seasons 는 유지).
  if (seasonRows.length === 0) {
    return {
      totals: null,
      gameLog: [],
      trend: [],
      clubRanks: [],
      seasons,
      hasNoTtp: false,
    };
  }

  // 5) TOTALS 합산 — 경기당 평균은 sum/games, 슈팅%는 시즌합 made/att 비율(평균의 평균 ❌).
  const games = seasonRows.length;
  let sumPts = 0,
    sumAst = 0,
    sumReb = 0,
    sumStl = 0;
  let fgm = 0,
    fga = 0,
    tpm = 0,
    tpa = 0,
    ftm = 0,
    fta = 0;
  let wins = 0,
    losses = 0,
    decided = 0;

  for (const r of seasonRows) {
    sumPts += n(r.points);
    sumAst += n(r.assists);
    sumReb += n(r.total_rebounds);
    sumStl += n(r.steals);
    fgm += n(r.fieldGoalsMade);
    fga += n(r.fieldGoalsAttempted);
    tpm += n(r.threePointersMade);
    tpa += n(r.threePointersAttempted);
    ftm += n(r.freeThrowsMade);
    fta += n(r.freeThrowsAttempted);

    // 승패 — winner_team_id 가 본인 소속팀(ttp.tournamentTeamId)이면 승. NULL = 미정.
    const myTeamId = myTeamIdByTtp.get(r.tournamentTeamPlayerId.toString());
    const winnerId = r.tournamentMatch.winner_team_id;
    if (winnerId != null && myTeamId != null) {
      decided += 1;
      if (winnerId === myTeamId) wins += 1;
      else losses += 1;
    }
  }

  const totals: MySeasonTotals = {
    seasonYear: season,
    gamesPlayed: games,
    wins,
    losses,
    winRate: decided > 0 ? Number(((wins / decided) * 100).toFixed(1)) : null,
    ppg: perGame(sumPts, games),
    apg: perGame(sumAst, games),
    rpg: perGame(sumReb, games),
    spg: perGame(sumStl, games),
    fgPct: pct(fgm, fga),
    tpPct: pct(tpm, tpa),
    ftPct: pct(ftm, fta),
  };

  // 6) GAME_LOG — 최신순 최근 N. 상대팀 = 본인팀(home/away) 아닌 쪽 팀명.
  const gameLog: MyGameLogRow[] = seasonRows
    .slice(0, GAME_LOG_LIMIT)
    .map((r) => {
      const m = r.tournamentMatch;
      const myTeamId = myTeamIdByTtp.get(r.tournamentTeamPlayerId.toString());
      // 본인팀이 홈이면 상대=어웨이, 아니면 홈. (양쪽 모두 본인팀 아닐 땐 어웨이 fallback)
      const opponentName =
        myTeamId != null && m.homeTeamId === myTeamId
          ? (m.awayTeam?.team?.name ?? null)
          : (m.homeTeam?.team?.name ?? null);

      let result: MyGameLogRow["result"] = "-";
      if (m.winner_team_id != null && myTeamId != null) {
        result = m.winner_team_id === myTeamId ? "W" : "L";
      }

      const at = m.scheduledAt;
      const date = at
        ? `${String(at.getMonth() + 1).padStart(2, "0")}.${String(at.getDate()).padStart(2, "0")}`
        : "--.--";

      return {
        date,
        opponentName,
        minutes: n(r.minutesPlayed),
        points: n(r.points),
        rebounds: n(r.total_rebounds),
        assists: n(r.assists),
        fg: `${n(r.fieldGoalsMade)}/${n(r.fieldGoalsAttempted)}`,
        tp: `${n(r.threePointersMade)}/${n(r.threePointersAttempted)}`,
        result,
      };
    });

  // 7) TREND — 선택 시즌 경기별 득점(오래된→최근). seasonRows 는 최신순이라 reverse.
  const trend: number[] = seasonRows
    .map((r) => n(r.points))
    .slice()
    .reverse();

  // 8) 클럽 내 순위(RANKINGS) — 본인 소속팀 동료 대비 부문 순위.
  //    연결 가능 부문만(득점/어시/리바/3점/자유투 = MatchPlayerStat 보유). 동료 부족 시 생략.
  const clubRanks = await computeClubRanks(myTtps, season);

  return {
    totals,
    gameLog,
    trend,
    clubRanks,
    seasons,
    hasNoTtp: false,
  };
}

/**
 * 클럽(팀) 동료 대비 본인 부문 순위 계산 (read-only).
 *
 * 왜 별도 함수인가:
 *   본인팀(tournamentTeamId)에 속한 모든 ttp 의 시즌 합산을 부문별로 정렬해 본인 등수를 구한다.
 *   본인이 여러 팀에 속할 수 있으므로(여러 대회) 팀별로 묶어 가장 인원이 많은 클럽 기준으로 잡는다.
 *
 * 데이터 부족(동료 1명 이하 또는 해당 부문 기록 전무)인 부문은 생략한다.
 */
async function computeClubRanks(
  myTtps: { id: bigint; tournamentTeamId: bigint }[],
  season: number | "career",
): Promise<MyClubRank[]> {
  // 본인 ttp 가 속한 팀 중 동료가 가장 많은 팀 1곳을 클럽 기준으로 선택.
  // (단순화: 첫 팀이 아니라 "비교 모수가 가장 큰" 팀을 골라야 순위 의미가 산다)
  const teamIds = Array.from(new Set(myTtps.map((t) => t.tournamentTeamId)));
  if (teamIds.length === 0) return [];

  // 각 팀의 전체 ttp(동료 포함) 조회 — 1쿼리.
  const teammates = await prisma.tournamentTeamPlayer.findMany({
    where: { tournamentTeamId: { in: teamIds } },
    select: { id: true, tournamentTeamId: true },
  });

  // 팀별 인원 집계 → 가장 큰 팀을 클럽 기준으로 채택.
  const countByTeam = new Map<string, number>();
  for (const t of teammates) {
    const k = t.tournamentTeamId.toString();
    countByTeam.set(k, (countByTeam.get(k) ?? 0) + 1);
  }
  let bestTeamId: bigint | null = null;
  let bestCount = 0;
  for (const tid of teamIds) {
    const c = countByTeam.get(tid.toString()) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      bestTeamId = tid;
    }
  }
  // 동료가 본인뿐(<2명)이면 순위 무의미 → 생략.
  if (bestTeamId == null || bestCount < 2) return [];

  const clubTtpIds = teammates
    .filter((t) => t.tournamentTeamId === bestTeamId)
    .map((t) => t.id);
  // 본인 ttp(이 클럽 소속) id 집합 — 합산 시 "본인 행" 식별용.
  const myClubTtpIdSet = new Set(
    myTtps
      .filter((t) => t.tournamentTeamId === bestTeamId)
      .map((t) => t.id.toString()),
  );

  // 클럽 전원의 stat 합산 (부문별) — groupBy 1쿼리. 시즌 필터는 매치 연도라
  // groupBy 로 직접 안 잡혀 findMany 후 JS 합산. (클럽 인원 소수라 비용 무시)
  const clubRows = await prisma.matchPlayerStat.findMany({
    where: {
      tournamentTeamPlayerId: { in: clubTtpIds },
      tournamentMatch: officialMatchNestedFilter(),
    },
    select: {
      tournamentTeamPlayerId: true,
      points: true,
      assists: true,
      total_rebounds: true,
      threePointersMade: true,
      freeThrowsMade: true,
      tournamentMatch: { select: { scheduledAt: true } },
    },
  });

  // 부문 정의 — 시안 라벨 + stat 접근자.
  const CATEGORIES: {
    label: string;
    get: (r: (typeof clubRows)[number]) => number;
  }[] = [
    { label: "득점", get: (r) => n(r.points) },
    { label: "어시스트", get: (r) => n(r.assists) },
    { label: "리바운드", get: (r) => n(r.total_rebounds) },
    { label: "3점 성공", get: (r) => n(r.threePointersMade) },
    { label: "자유투 성공", get: (r) => n(r.freeThrowsMade) },
  ];

  // ttpId → 부문별 시즌 합산.
  const sumByTtp = new Map<string, Record<string, number>>();
  for (const r of clubRows) {
    // 선택 시즌 필터(career=전체).
    if (
      season !== "career" &&
      r.tournamentMatch.scheduledAt?.getFullYear() !== season
    ) {
      continue;
    }
    const key = r.tournamentTeamPlayerId.toString();
    const acc = sumByTtp.get(key) ?? {};
    for (const c of CATEGORIES) {
      acc[c.label] = (acc[c.label] ?? 0) + c.get(r);
    }
    sumByTtp.set(key, acc);
  }

  // 부문별로 클럽 전원 합산값 desc 정렬 → 본인 등수/모수 산출.
  const ranks: MyClubRank[] = [];
  for (const c of CATEGORIES) {
    // 해당 부문 기록이 있는(>0) 멤버만 비교 모수에 포함.
    const ranked = Array.from(sumByTtp.entries())
      .map(([ttpId, acc]) => ({ ttpId, value: acc[c.label] ?? 0 }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    if (ranked.length < 2) continue; // 비교 모수 부족 → 부문 생략.

    // 본인 행(여러 ttp 가 같은 클럽일 수 있으나 보통 1) 중 가장 높은 등수 채택.
    let myRank = -1;
    for (let i = 0; i < ranked.length; i++) {
      if (myClubTtpIdSet.has(ranked[i].ttpId)) {
        myRank = i + 1;
        break;
      }
    }
    if (myRank === -1) continue; // 본인이 해당 부문 기록 0 → 생략.

    ranks.push({ label: c.label, rank: myRank, of: ranked.length });
  }

  return ranks;
}
