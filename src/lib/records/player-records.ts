/**
 * player-records.ts — 선수 기록(Records) 서버 헬퍼
 * ─────────────────────────────────────────────────────────
 * 이유(왜): /users/[id] "기록" 탭은 경기별/대회별/시즌별 3 단위를 보여준다.
 *   전부 MatchPlayerStat(공식가드) 1회 조회 → JS 가공으로 산출(신규 DB 0).
 *   profile-tabs 가 SSR prefetch 방식이므로 API 신설 대신 서버 직주입(결재 Q4).
 *
 * 방법(어떻게): userId 의 TournamentTeamPlayer(클레임) 연결 매치 stat 을 모아
 *   - games   : 매치별 raw 박스(정수) + 상대/대회/결과
 *   - tournaments: tournamentId groupBy 평균(aggregateBox) + 승–패
 *   - seasons : scheduledAt 연도 groupBy 평균
 *   로 가공. 키는 시안 statCols 가 읽는 snake_case 그대로(서버 직주입이라 apiSuccess 미경유).
 *
 * 공식가드: officialMatchNestedFilter() 필수(미래/비공식 매치 집계 금지 — 재발 방지).
 * 평점(rating)은 매치 단위 소스 부재 → null('–'). (결재 Q1)
 * 선수 식별: tournamentTeamPlayer.userId(클레임)만 개인 집계. (설계 §5 주의6)
 */

import { prisma } from "@/lib/db/prisma";
import { officialMatchNestedFilter } from "@/lib/tournaments/official-match";
import { toRawBox, aggregateBox, type BoxAvg } from "@/lib/records/match-stat-aggregate";
// 2026-06-16: PBP 기반 출전시간 (라이브와 단일 source). minutesPlayed(999 버그/전자기록지 0) 미사용.
import {
  getMatchMinutesBySec,
  buildMatchMinutesMeta,
} from "@/lib/records/match-minutes";

// ── 경기별 행(raw 정수 박스 + 메타) ──
export interface PlayerGameRow {
  match_id: string;
  date: string; // ISO (시안은 slice(5) 로 MM.DD 표시)
  opponent: string;
  opponent_team_id: string | null;
  tournament: string;
  tournament_id: string | null;
  result: "W" | "L" | null;
  // raw 박스(정수)
  min: number;
  pts: number;
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  pm: number;
  rating: null;
}

// ── 대회별 행(평균 박스 + 승패) ──
export interface PlayerTournamentRow extends BoxAvg {
  tournament_id: string;
  tournament: string;
  period: string;
  wins: number;
  losses: number;
}

// ── 시즌별 행(평균 박스) ──
export interface PlayerSeasonRow extends BoxAvg {
  season_year: number;
}

export interface PlayerRecordsResult {
  claimed: boolean; // ttp 연동(클레임) 여부 — false 면 미연동 안내
  games: PlayerGameRow[];
  tournaments: PlayerTournamentRow[];
  seasons: PlayerSeasonRow[];
}

// 매치 stat select 1행 형태 (toRawBox 입력 + 메타)
interface StatRow {
  minutesPlayed: number | null;
  points: number | null;
  fieldGoalsMade: number | null;
  fieldGoalsAttempted: number | null;
  threePointersMade: number | null;
  threePointersAttempted: number | null;
  freeThrowsMade: number | null;
  freeThrowsAttempted: number | null;
  offensive_rebounds: number | null;
  defensive_rebounds: number | null;
  total_rebounds: number | null;
  assists: number | null;
  steals: number | null;
  blocks: number | null;
  turnovers: number | null;
  personal_fouls: number | null;
  plusMinus: number | null;
  tournamentTeamPlayer: { id: bigint; tournamentTeamId: bigint | null } | null;
  tournamentMatch: {
    id: bigint;
    scheduledAt: Date | null;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    winner_team_id: bigint | null;
    status: string | null;
    settings: import("@prisma/client").Prisma.JsonValue | null;
    homeTeam: { team: { id: bigint; name: string } | null } | null;
    awayTeam: { team: { id: bigint; name: string } | null } | null;
    tournament: { id: string; name: string } | null;
  } | null;
}

const fmtMonth = (d: Date): string =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;

/**
 * 선수 기록 3 단위 DTO 산출.
 * @param userId User.id
 */
export async function getPlayerRecords(userId: bigint): Promise<PlayerRecordsResult> {
  // 1) 클레임(ttp 연동) 여부 — 1건이라도 있으면 claimed
  const ttpCount = await prisma.tournamentTeamPlayer
    .count({ where: { userId } })
    .catch(() => 0);

  if (ttpCount === 0) {
    return { claimed: false, games: [], tournaments: [], seasons: [] };
  }

  // 2) 공식 매치 stat 전건 (공식가드 필수)
  const rows = (await prisma.matchPlayerStat
    .findMany({
      where: {
        tournamentTeamPlayer: { userId },
        // 공식가드 + 비공개 대회(is_public=false) 매치 제외.
        // { not: false }: 공개(true)·미설정(null) 통과, 비공개(false)만 제외(회귀 0).
        tournamentMatch: {
          ...officialMatchNestedFilter(),
          tournament: { is_public: { not: false } },
        },
      },
      select: {
        minutesPlayed: true,
        points: true,
        fieldGoalsMade: true,
        fieldGoalsAttempted: true,
        threePointersMade: true,
        threePointersAttempted: true,
        freeThrowsMade: true,
        freeThrowsAttempted: true,
        offensive_rebounds: true,
        defensive_rebounds: true,
        total_rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        turnovers: true,
        personal_fouls: true,
        plusMinus: true,
        tournamentTeamPlayer: { select: { id: true, tournamentTeamId: true } },
        tournamentMatch: {
          select: {
            id: true,
            scheduledAt: true,
            homeTeamId: true,
            awayTeamId: true,
            winner_team_id: true,
            // 2026-06-16: PBP 출전시간 공용 함수용 — status(cap 분기) / settings(paper 판별)
            status: true,
            settings: true,
            homeTeam: { select: { team: { select: { id: true, name: true } } } },
            awayTeam: { select: { team: { select: { id: true, name: true } } } },
            tournament: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { tournamentMatch: { scheduledAt: "desc" } },
    })
    .catch(() => [])) as StatRow[];

  // tournamentMatch 가 NULL 이면 제외 (안전)
  const valid = rows.filter((r) => r.tournamentMatch != null);

  // 2026-06-16: PBP 기반 출전초 일괄 산출 (라이브와 단일 source). 전자기록지/PBP없음 매치는 결과 제외 → min '–'.
  //   매치 중복 제거(선수 1행/매치) → buildMatchMinutesMeta 가 매치별 home/away 로스터 cap 처리.
  const matchMetaInput = Array.from(
    new Map(
      valid.map((r) => {
        const m = r.tournamentMatch!;
        return [
          m.id.toString(),
          {
            id: m.id,
            homeTeamId: m.homeTeamId,
            awayTeamId: m.awayTeamId,
            status: m.status,
            settings: m.settings,
          },
        ];
      }),
    ).values(),
  );
  const minutesMeta = await buildMatchMinutesMeta(matchMetaInput);
  const minutesBySec = await getMatchMinutesBySec(
    matchMetaInput.map((m) => m.id),
    minutesMeta,
  );
  // (StatRow) → 출전초. ttp.id + matchId 로 조회. 부재 시 null → toRawBox min=0.
  const minSecOf = (r: StatRow): number | null => {
    const m = r.tournamentMatch;
    const ttpId = r.tournamentTeamPlayer?.id;
    if (!m || ttpId == null) return null;
    return minutesBySec.get(Number(m.id))?.get(ttpId) ?? null;
  };

  // 3) games — 매치별 raw 행
  const games: PlayerGameRow[] = valid.map((r) => {
    const m = r.tournamentMatch!;
    const myTtId = r.tournamentTeamPlayer?.tournamentTeamId ?? null;
    const side: "home" | "away" | null =
      myTtId != null && myTtId === m.homeTeamId
        ? "home"
        : myTtId != null && myTtId === m.awayTeamId
          ? "away"
          : null;
    // 결과(W/L) — winner_team_id vs 내 팀(TournamentTeam.id). 무승부/미확정 = null
    const myTtForWin = side === "home" ? m.homeTeamId : side === "away" ? m.awayTeamId : null;
    const result: "W" | "L" | null =
      m.winner_team_id != null && myTtForWin != null
        ? m.winner_team_id === myTtForWin
          ? "W"
          : "L"
        : null;
    // 상대팀(반대 side)
    const oppTeam =
      side === "home" ? m.awayTeam?.team : side === "away" ? m.homeTeam?.team : null;
    const box = toRawBox(r, { minOverrideSec: minSecOf(r) });
    return {
      match_id: m.id.toString(),
      date: m.scheduledAt ? m.scheduledAt.toISOString() : "",
      opponent: oppTeam?.name ?? "상대 미정",
      opponent_team_id: oppTeam?.id != null ? oppTeam.id.toString() : null,
      tournament: m.tournament?.name ?? "-",
      tournament_id: m.tournament?.id ?? null,
      result,
      ...box,
      rating: null,
    };
  });

  // 4) tournaments — tournamentId groupBy 평균 + 승패
  const byTn = new Map<
    string,
    { name: string; boxes: ReturnType<typeof toRawBox>[]; dates: Date[]; w: number; l: number }
  >();
  for (let i = 0; i < valid.length; i++) {
    const r = valid[i];
    const m = r.tournamentMatch!;
    const tid = m.tournament?.id;
    if (!tid) continue;
    let e = byTn.get(tid);
    if (!e) {
      e = { name: m.tournament?.name ?? "-", boxes: [], dates: [], w: 0, l: 0 };
      byTn.set(tid, e);
    }
    e.boxes.push(toRawBox(r, { minOverrideSec: minSecOf(r) }));
    if (m.scheduledAt) e.dates.push(m.scheduledAt);
    const g = games[i];
    if (g.result === "W") e.w++;
    else if (g.result === "L") e.l++;
  }
  const tournaments: PlayerTournamentRow[] = [...byTn.entries()].map(([tid, e]) => {
    const sorted = e.dates.slice().sort((a, b) => a.getTime() - b.getTime());
    const period =
      sorted.length === 0
        ? "-"
        : fmtMonth(sorted[0]) === fmtMonth(sorted[sorted.length - 1])
          ? fmtMonth(sorted[0])
          : `${fmtMonth(sorted[0])} ~ ${fmtMonth(sorted[sorted.length - 1])}`;
    return {
      tournament_id: tid,
      tournament: e.name,
      period,
      wins: e.w,
      losses: e.l,
      ...aggregateBox(e.boxes),
    };
  });

  // 5) seasons — scheduledAt 연도 groupBy 평균
  const bySeason = new Map<number, ReturnType<typeof toRawBox>[]>();
  for (const r of valid) {
    const m = r.tournamentMatch!;
    if (!m.scheduledAt) continue;
    const y = m.scheduledAt.getFullYear();
    const arr = bySeason.get(y) ?? [];
    arr.push(toRawBox(r, { minOverrideSec: minSecOf(r) }));
    bySeason.set(y, arr);
  }
  const seasons: PlayerSeasonRow[] = [...bySeason.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, boxes]) => ({ season_year: year, ...aggregateBox(boxes) }));

  return { claimed: true, games, tournaments, seasons };
}
