/**
 * 대회 종료 페이지 — 스탯 리더 집계 헬퍼 (B안 §1 / 0 스키마)
 *
 * 왜 필요한가:
 *   종료 뷰 "대회결과" 탭의 03 스탯 리더 카드는 부문별(득점/리바운드/어시스트/3점)
 *   대회 누적 TOP3 선수를 보여준다. 시안 C_LEADERS mock 을 실데이터로 대체한다.
 *
 * 0 스키마 원칙:
 *   - 신규 컬럼/테이블 0. 기존 match_player_stats 컬럼만 SELECT.
 *   - points / total_rebounds / assists / threePointersMade (전부 schema 기보유 + 인덱스 O)
 *
 * 집계 경로 (전부 읽기 전용):
 *   1. 본 대회 완료 매치 id 목록 = tournamentMatch.findMany (tournamentId 직접 컬럼 + 공식 기록 가드)
 *   2. matchPlayerStat.groupBy(by: tournamentTeamPlayerId, _sum: 4부문) — 매치 id IN 필터
 *   3. 부문별 desc 정렬 → 상위 3 ttpId 추출 → ttp.findMany 로 선수명·팀명 매핑
 *
 * 단위 표기:
 *   시안은 PPG(평균)이나 운영은 games_played 가 ttp 단위라 매치 IN 집합과 게임수가 어긋날 수
 *   있어 0 나눗셈/왜곡 위험이 있다. 따라서 1차는 "대회 누적 합" 으로 표기하고
 *   단위 라벨도 누적에 맞춰 PTS/REB/AST/3PM 로 명시한다 (시안 PPG/RPG/APG/3PM 에서 누적 의미로 조정).
 */

import { prisma } from "@/lib/db/prisma";
import { officialMatchNestedFilter } from "@/lib/tournaments/official-match";

/** 한 부문 한 선수의 집계 row */
export interface StatLeaderRow {
  /** 선수 표시명 (ttp.player_name → users.nickname/name 폴백) */
  playerName: string;
  /** 소속 팀명 (ttp.tournamentTeam.team.name) — 없으면 null */
  teamName: string | null;
  /** 대회 누적 합산값 */
  value: number;
  /** TournamentTeamPlayer.id (string) — key 안정성용 */
  ttpId: string;
}

/** 부문 단위 (4부문) */
export interface StatLeaderCategory {
  /** 부문명 (시안 라벨) */
  cat: "득점" | "리바운드" | "어시스트" | "3점";
  /** 단위 라벨 (누적 합 의미) */
  unit: "PTS" | "REB" | "AST" | "3PM";
  /** 상위 TOP3 (값 0 인 부문은 제외됨) */
  rows: StatLeaderRow[];
}

export type StatLeaders = StatLeaderCategory[];

/** 부문 메타 — groupBy _sum 키와 시안 라벨/단위 매핑 */
const CATEGORIES: {
  cat: StatLeaderCategory["cat"];
  unit: StatLeaderCategory["unit"];
  /** _sum 결과 접근 키 (Prisma 필드명) */
  field: "points" | "total_rebounds" | "assists" | "threePointersMade";
}[] = [
  { cat: "득점", unit: "PTS", field: "points" },
  { cat: "리바운드", unit: "REB", field: "total_rebounds" },
  { cat: "어시스트", unit: "AST", field: "assists" },
  { cat: "3점", unit: "3PM", field: "threePointersMade" },
];

/**
 * 본 대회의 스탯 리더 4부문 TOP3 집계.
 * @param tournamentId 대회 UUID (TournamentMatch.tournamentId 직접 컬럼)
 * @returns 데이터 있는 부문 배열 / 전체 0 → null (카드 자동 hide)
 */
export async function getStatLeaders(
  tournamentId: string,
): Promise<StatLeaders | null> {
  // 1) 본 대회 완료(공식 기록) 매치 id 목록
  //    officialMatchNestedFilter = status in (completed,live) + scheduledAt 과거/not null (미래 테스트 방어)
  const matches = await prisma.tournamentMatch.findMany({
    where: {
      tournamentId,
      ...officialMatchNestedFilter(),
    },
    select: { id: true },
  });
  if (matches.length === 0) return null; // 완료 매치 0 → 스탯 없음
  const matchIds = matches.map((m) => m.id);

  // 2) 선수(ttp)별 4부문 누적 합 — 단일 groupBy 1쿼리
  //    매치 id IN 필터로 본 대회 기록만 집계 (다른 대회 ttp 혼입 0)
  const grouped = await prisma.matchPlayerStat.groupBy({
    by: ["tournamentTeamPlayerId"],
    where: { tournamentMatchId: { in: matchIds } },
    _sum: {
      points: true,
      total_rebounds: true,
      assists: true,
      threePointersMade: true,
    },
  });
  if (grouped.length === 0) return null; // 스탯 기록 0 → 카드 hide

  // 3) 부문별 desc 정렬 → 상위 3 (값 > 0 인 선수만) ttpId 수집
  //    먼저 전체 부문에서 등장하는 ttpId 를 모아 1회 findMany 로 이름·팀 매핑 (N+1 회피)
  type Ranked = { ttpId: bigint; value: number };
  const perCategory: Record<string, Ranked[]> = {};
  const neededTtpIds = new Set<bigint>();

  for (const c of CATEGORIES) {
    const ranked = grouped
      .map((g) => ({
        ttpId: g.tournamentTeamPlayerId,
        value: g._sum[c.field] ?? 0,
      }))
      .filter((r) => r.value > 0) // 0 기록 선수는 리더 후보 아님
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    perCategory[c.cat] = ranked;
    for (const r of ranked) neededTtpIds.add(r.ttpId);
  }

  if (neededTtpIds.size === 0) return null; // 모든 부문 값 0 → hide

  // 4) ttpId → 선수명·팀명 매핑 (1쿼리)
  const ttps = await prisma.tournamentTeamPlayer.findMany({
    where: { id: { in: Array.from(neededTtpIds) } },
    select: {
      id: true,
      player_name: true,
      users: { select: { nickname: true, name: true } },
      tournamentTeam: { select: { team: { select: { name: true } } } },
    },
  });
  const ttpMap = new Map(ttps.map((t) => [t.id.toString(), t]));

  // 5) 부문별 결과 조립 (rows 0 인 부문은 제외)
  const result: StatLeaders = [];
  for (const c of CATEGORIES) {
    const ranked = perCategory[c.cat] ?? [];
    if (ranked.length === 0) continue; // 데이터 없는 부문 hide

    const rows: StatLeaderRow[] = ranked.map((r) => {
      const ttp = ttpMap.get(r.ttpId.toString());
      // 표시명: ttp.player_name 우선 → 연결 user nickname/name → 폴백
      const playerName =
        ttp?.player_name ??
        ttp?.users?.nickname ??
        ttp?.users?.name ??
        "선수";
      const teamName = ttp?.tournamentTeam?.team?.name ?? null;
      return {
        playerName,
        teamName,
        value: r.value,
        ttpId: r.ttpId.toString(),
      };
    });

    result.push({ cat: c.cat, unit: c.unit, rows });
  }

  return result.length > 0 ? result : null;
}
