/**
 * match-minutes.ts — PBP 기반 출전시간 공용 산출 (라이브 + 기록실 단일 source)
 * ─────────────────────────────────────────────────────────────────────────
 * 이유(왜): 라이브(`/api/live/[id]`) route 가 검증된 PBP 전처리 로직
 *   (findMany → MinutesPbp 매핑 → qLen/numQuarters 추정 → dbStartersByTeam →
 *    calculateMinutes → 종료매치 home/away applyCompletedCap)을 인라인으로 갖고 있었다.
 *   기록실(records) 도 동일 출전시간이 필요하나, MatchPlayerStat.minutesPlayed 는
 *   종이 모드 0 하드코딩 + 999 truncate 버그가 있어 신뢰 불가.
 *   → 라이브의 검증된 로직을 그대로 공용 함수로 추출해 양쪽이 같은 알고리즘을 쓴다 (중복 0).
 *
 * 방법(어떻게): 알고리즘 본체는 `minutes-engine.ts` 의 calculateMinutes / applyCompletedCap
 *   를 재사용 (엔진 무변경). 본 함수는 그 전처리(PBP IN 1회 + 선발 stat IN 1회 + 매치별 매핑)
 *   만 담당. N+1 금지 — matchIds 배열 1회 IN 쿼리로 모든 매치 PBP/stat 을 모은다.
 *
 * 출력: Map<matchId(number), Map<ttpId(bigint), 출전초(number)>>
 *   - 종이 매치(recording_mode="paper" 또는 PBP max(game_clock)=0)는 결과 Map 에서 제외
 *     → 호출자(toRawBox)가 min 부재로 처리 → 집계 단계가 null('–') 표기.
 *   - PBP 0건 매치도 결과 Map 에서 제외 (출전시간 산출 불가).
 *
 * 신규 DB 0. SELECT 만 (play_by_plays + matchPlayerStat). 공식가드는 호출자 책임.
 */

import { prisma } from "@/lib/db/prisma";
import {
  calculateMinutes,
  applyCompletedCap,
  type MinutesPbp,
} from "@/lib/live/minutes-engine";
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
import type { Prisma } from "@prisma/client";

/**
 * 매치 메타 — 호출자가 이미 조회해둔 tournamentMatch 행에서 추출.
 *  - status: 종료 매치(completed)만 applyCompletedCap 적용 (라이브는 진행도 그대로).
 *  - settings: recording_mode 판별용 (paper = 결과 제외).
 *  - homeTtpIds / awayTtpIds: cap 을 팀 단위로 적용하기 위한 출전 명단(ttp.id).
 */
export interface MatchMinutesMeta {
  status: string | null;
  settings: Prisma.JsonValue | null;
  homeTtpIds: bigint[];
  awayTtpIds: bigint[];
}

/**
 * 매치 행 배열 → MatchMinutesMeta 맵 구성 (기록실 consumer 편의 헬퍼).
 *
 * 종료 매치 LRM cap 은 팀 단위 full 로스터(ttp.id)가 있어야 정확하다. 기록실 route 는
 *   보통 매치별 home/away tournamentTeamId 만 갖고 있으므로, 본 헬퍼가
 *   TournamentTeamPlayer IN 1회로 각 팀의 ttp.id 명단을 일괄 채워 메타를 만든다.
 *
 * @param matches `{ id, homeTeamId(=tournamentTeamId), awayTeamId(=tournamentTeamId), status, settings }`
 * @returns Map<matchId(string), MatchMinutesMeta>
 *
 * 성능: tournamentTeamPlayer IN 1회 (N+1 금지).
 */
export async function buildMatchMinutesMeta(
  matches: Array<{
    id: bigint;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    status: string | null;
    settings: Prisma.JsonValue | null;
  }>,
): Promise<Map<string, MatchMinutesMeta>> {
  const metaById = new Map<string, MatchMinutesMeta>();
  if (matches.length === 0) return metaById;

  // 등장한 모든 tournamentTeam id 집합 → ttp 로스터 일괄 SELECT
  const teamIds = new Set<bigint>();
  for (const m of matches) {
    if (m.homeTeamId != null) teamIds.add(m.homeTeamId);
    if (m.awayTeamId != null) teamIds.add(m.awayTeamId);
  }
  const rosterByTeam = new Map<string, bigint[]>();
  if (teamIds.size > 0) {
    const ttps = await prisma.tournamentTeamPlayer.findMany({
      where: { tournamentTeamId: { in: Array.from(teamIds) } },
      select: { id: true, tournamentTeamId: true },
    });
    for (const t of ttps) {
      const key = t.tournamentTeamId.toString();
      let arr = rosterByTeam.get(key);
      if (!arr) {
        arr = [];
        rosterByTeam.set(key, arr);
      }
      arr.push(t.id);
    }
  }

  for (const m of matches) {
    metaById.set(m.id.toString(), {
      status: m.status,
      settings: m.settings,
      homeTtpIds: m.homeTeamId != null ? rosterByTeam.get(m.homeTeamId.toString()) ?? [] : [],
      awayTtpIds: m.awayTeamId != null ? rosterByTeam.get(m.awayTeamId.toString()) ?? [] : [],
    });
  }
  return metaById;
}

/** qLen 추정 — 라이브 route L318~330 로직 그대로 (max game_clock = 쿼터 시작). */
function inferQLen(clocks: number[]): number {
  if (clocks.length === 0) return 600;
  const maxClock = Math.max(...clocks);
  if (maxClock < 300 || maxClock > 1200) return 600;
  const candidates = [420, 480, 600, 720];
  let best = 600;
  let bestDiff = Infinity;
  for (const c of candidates) {
    const d = Math.abs(c - maxClock);
    if (d < bestDiff) {
      bestDiff = d;
      best = c;
    }
  }
  return bestDiff <= 30 ? best : maxClock;
}

/**
 * 매치 배열의 ttp별 PBP 출전초 일괄 산출.
 *
 * @param matchIds 대상 매치 id (bigint)
 * @param metaById matchId(string) → MatchMinutesMeta (호출자가 이미 가진 match 행에서 구성)
 * @returns Map<matchId(number), Map<ttpId(bigint), 출전초>>
 *
 * 성능: play_by_plays IN 1회 + matchPlayerStat(isStarter) IN 1회 = 총 2 쿼리 (N+1 금지).
 */
export async function getMatchMinutesBySec(
  matchIds: bigint[],
  metaById: Map<string, MatchMinutesMeta>,
  opts?: {
    // 종이/PBP-clock=0 매치를 결과에서 제외할지.
    //   - true (기본, 기록실): 종이 매치 출전시간 부재 → 결과 제외 → 집계 null('–').
    //   - false (라이브): 라이브 박스스코어는 종이 매치도 PBP 추정 min 을 그대로 표시 →
    //     동작 100% 보존을 위해 제외하지 않음 (추출 전 인라인 로직과 동일).
    excludePaper?: boolean;
  },
): Promise<Map<number, Map<bigint, number>>> {
  const excludePaper = opts?.excludePaper ?? true;
  const result = new Map<number, Map<bigint, number>>();
  if (matchIds.length === 0) return result;

  // 1) PBP IN 1회 — 출전시간 산출에 필요한 컬럼만 (라이브 route select 와 동일 부분집합)
  const allPbps = await prisma.play_by_plays.findMany({
    where: { tournament_match_id: { in: matchIds } },
    select: {
      tournament_match_id: true,
      tournament_team_player_id: true,
      quarter: true,
      action_type: true,
      action_subtype: true,
      game_clock_seconds: true,
      sub_in_player_id: true,
      sub_out_player_id: true,
    },
  });

  // 2) 선발 stat IN 1회 — isStarter=true 행만(메인 path #1 DB starter 주입)
  const starterStats = await prisma.matchPlayerStat.findMany({
    where: { tournamentMatchId: { in: matchIds }, isStarter: true },
    select: {
      tournamentMatchId: true,
      tournamentTeamPlayerId: true,
      tournamentTeamPlayer: { select: { tournamentTeamId: true } },
    },
  });

  // 매치별 PBP 버킷
  const pbpByMatch = new Map<string, typeof allPbps>();
  for (const p of allPbps) {
    if (p.tournament_match_id == null) continue;
    const key = p.tournament_match_id.toString();
    let arr = pbpByMatch.get(key);
    if (!arr) {
      arr = [];
      pbpByMatch.set(key, arr);
    }
    arr.push(p);
  }

  // 매치별 dbStartersByTeam — Map<matchId, Map<teamId, Set<ttpId>>>
  const startersByMatch = new Map<string, Map<bigint, Set<bigint>>>();
  for (const s of starterStats) {
    const matchKey = s.tournamentMatchId.toString();
    const teamId = s.tournamentTeamPlayer?.tournamentTeamId;
    if (teamId == null) continue;
    let byTeam = startersByMatch.get(matchKey);
    if (!byTeam) {
      byTeam = new Map();
      startersByMatch.set(matchKey, byTeam);
    }
    let set = byTeam.get(teamId);
    if (!set) {
      set = new Set();
      byTeam.set(teamId, set);
    }
    set.add(s.tournamentTeamPlayerId);
  }

  for (const matchId of matchIds) {
    const matchKey = matchId.toString();
    const meta = metaById.get(matchKey);
    if (!meta) continue;

    const pbps = pbpByMatch.get(matchKey) ?? [];
    if (pbps.length === 0) continue; // PBP 없음 — 출전시간 산출 불가 → 제외('–')

    // 종이 매치 판별: recording_mode="paper" 또는 PBP max(game_clock)=0 (digital clock 부재)
    //   기록실(excludePaper=true)만 제외. 라이브(false)는 추출 전 동작 보존 — PBP 추정 min 산출.
    if (excludePaper) {
      const isPaper =
        getRecordingMode({ settings: meta.settings }) === "paper" ||
        Math.max(...pbps.map((p) => p.game_clock_seconds ?? 0)) === 0;
      if (isPaper) continue; // 종이 매치 — 출전시간 부재 → 제외('–')
    }

    // qLen / numQuarters 추정 (라이브 route 와 동일)
    const minutesQL = inferQLen(pbps.map((p) => p.game_clock_seconds ?? 0));
    const minutesQs = Math.max(4, ...pbps.map((p) => p.quarter ?? 4));

    const minutesEngineInput: MinutesPbp[] = pbps.map((p) => ({
      ttpId: p.tournament_team_player_id ?? null,
      quarter: p.quarter ?? 1,
      clock: p.game_clock_seconds ?? 0,
      type: p.action_type,
      subtype: p.action_subtype,
      subInId: p.sub_in_player_id ?? null,
      subOutId: p.sub_out_player_id ?? null,
    }));

    const dbStartersByTeam = startersByMatch.get(matchKey);
    const { bySec } = calculateMinutes({
      pbps: minutesEngineInput,
      qLen: minutesQL,
      numQuarters: minutesQs,
      dbStartersByTeam:
        dbStartersByTeam && dbStartersByTeam.size > 0 ? dbStartersByTeam : undefined,
    });

    // 종료 매치만 LRM cap (라이브 route L371~387 그대로 — 팀 단위 분리 후 cap)
    if (meta.status === "completed") {
      const expectedTeamSec = minutesQL * minutesQs * 5;
      const homeMap = new Map<bigint, number>();
      const awayMap = new Map<bigint, number>();
      for (const ttpId of meta.homeTtpIds) {
        if (bySec.has(ttpId)) homeMap.set(ttpId, bySec.get(ttpId)!);
      }
      for (const ttpId of meta.awayTtpIds) {
        if (bySec.has(ttpId)) awayMap.set(ttpId, bySec.get(ttpId)!);
      }
      applyCompletedCap(homeMap, expectedTeamSec, minutesQL, minutesQs);
      applyCompletedCap(awayMap, expectedTeamSec, minutesQL, minutesQs);
      for (const [id, sec] of homeMap) bySec.set(id, sec);
      for (const [id, sec] of awayMap) bySec.set(id, sec);
    }

    result.set(Number(matchId), bySec);
  }

  return result;
}
