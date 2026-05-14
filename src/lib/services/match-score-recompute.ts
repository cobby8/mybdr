/**
 * Match Score Recompute — 매치 점수 자동 보정 (Phase C: status route safety net)
 *
 * 왜 필요한가:
 * - Flutter app 이 매치 종료 시 `/sync` 호출을 빠뜨리는 경우, `tournament_matches.homeScore` /
 *   `awayScore` / `quarterScores` 가 0 으로 남는 sync 누락 버그가 운영에서 반복 발생 (예: 매치 #132).
 * - Phase B 에서 live API 의 응답 fallback 은 추가했지만 (live route), DB row 자체는 0 그대로.
 * - Phase A 에서 과거 누락 10건은 일괄 backfill 완료. Phase C 는 "앞으로 새로 발생할 매치도
 *   자동 보정" — status="completed" 전환 시점에 백엔드가 PBP/playerStats 로 자동 계산해서
 *   DB 에 박제.
 *
 * 단일 source-of-truth:
 * - live API L1131 의 3단 fallback (Phase B) + Phase A backfill 스크립트의 source 결정 로직
 *   과 **동일한 우선순위** 사용. 신규 헬퍼가 단일 진입점.
 *
 * 우선순위 (Phase B 와 일관):
 *   1. 기존 match.homeScore > 0 → "skip" (이미 박제됨 / 변경 0 — 멱등성 보장)
 *   2. playerStats 팀별 pts 합 > 0 → "playerStats" source
 *   3. PBP made shot points_scored 합 → "pbp" source (computeScoreFromPbp 재사용)
 *
 * quarterScores JSON:
 * - 항상 PBP 기반으로 재계산 (live API L820~845 와 동일 구조 = QS type)
 * - playerStats 에는 quarter 정보가 없으므로 PBP 만이 유일한 source
 * - PBP = 0 이면 quarterScores 변경 ❌ (기존 값 유지)
 *
 * winner_team_id:
 * - 새 homeScore vs awayScore 비교 결과로 재결정
 * - 동점이면 null (별도 결정 필요)
 * - 기존 winner_team_id 와 다르면 변경
 *
 * 멱등성:
 * - 다시 호출해도 homeScore > 0 이면 skip — 변경 0 (안전한 재호출 가능)
 * - 변경된 필드만 UPDATE — 이미 박제된 필드 건드리지 않음
 *
 * 트랜잭션:
 * - Prisma TransactionClient 또는 PrismaClient 모두 받음
 * - applyScoreSafetyNet 는 같은 tx 안에서 SELECT + UPDATE + audit 박제 모두 처리 → 부분 실패 시 rollback
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  computeScoreFromPbp,
  type PbpRowForScore,
} from "@/lib/tournaments/score-from-pbp";
import { recordMatchAudit } from "@/lib/tournaments/match-audit";

// quarterScores JSON 구조 — live API L823 의 QS type 과 정확히 동일.
// Phase B 와 일관 보장 — 운영 quarter_scores 컬럼 default JSON 도 동일 키 셋.
export type QuarterScoresShape = {
  home: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
  away: { q1: number; q2: number; q3: number; q4: number; ot: number[] };
};

// 자동 보정 결과 — 어느 source 를 사용했는지 + 변경된 필드 표시.
export type RecomputeResult = {
  /** 사용 source — "skip" 이면 이미 박제됨 (변경 0) */
  source: "skip" | "playerStats" | "pbp";
  /** 계산된 home/away 총점 (skip 시 기존 값) */
  homeScore: number;
  awayScore: number;
  /** PBP 기반 재계산된 quarterScores (PBP=0 이면 null — 변경 ❌) */
  quarterScores: QuarterScoresShape | null;
  /** 점수 비교로 재결정된 winner_team_id (동점=null) */
  winnerTeamId: bigint | null;
  /** 각 필드가 실제로 변경 필요한지 (UPDATE 데이터 빌드용) */
  changed: {
    homeScore: boolean;
    awayScore: boolean;
    quarterScores: boolean;
    winnerTeamId: boolean;
  };
};

/**
 * 매치 점수를 PBP/playerStats 기반으로 재계산 (read-only).
 *
 * UPDATE 는 하지 않음 — 호출자가 결과를 보고 직접 처리하거나 applyScoreSafetyNet 사용.
 *
 * @param tx       PrismaClient 또는 TransactionClient
 * @param matchId  TournamentMatch.id
 * @returns        RecomputeResult — 매치 없으면 null
 */
export async function computeRecomputedScore(
  tx: PrismaClient | Prisma.TransactionClient,
  matchId: bigint,
): Promise<RecomputeResult | null> {
  // 1. 매치 헤더 + playerStats + PBP 병렬 SELECT.
  //    - 매치 헤더: homeScore/awayScore/quarterScores/winner_team_id/homeTeamId/awayTeamId
  //    - playerStats: 팀별 points 합산 source
  //    - play_by_plays: 3단 fallback + quarterScores 재계산 source
  const match = await tx.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      quarterScores: true,
      winner_team_id: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
  if (!match) return null;

  // 우선순위 1단계: 이미 박제된 매치는 skip — 변경 0 (멱등성).
  // homeScore > 0 만 가드 — Phase A 케이스에서 homeScore=0 + awayScore=0 같이 sync 누락 패턴.
  // (homeScore=0 이지만 awayScore>0 인 케이스는 부정상 — 보정 진입해서 재계산하는게 안전)
  const homeScoreCur = match.homeScore ?? 0;
  if (homeScoreCur > 0) {
    return {
      source: "skip",
      homeScore: homeScoreCur,
      awayScore: match.awayScore ?? 0,
      quarterScores: null,
      winnerTeamId: match.winner_team_id,
      changed: {
        homeScore: false,
        awayScore: false,
        quarterScores: false,
        winnerTeamId: false,
      },
    };
  }

  // homeTeamId / awayTeamId 둘 다 있어야 보정 가능. 어느 하나 없으면 source 결정 불가.
  if (!match.homeTeamId || !match.awayTeamId) {
    return {
      source: "skip",
      homeScore: 0,
      awayScore: 0,
      quarterScores: null,
      winnerTeamId: match.winner_team_id,
      changed: {
        homeScore: false,
        awayScore: false,
        quarterScores: false,
        winnerTeamId: false,
      },
    };
  }

  // playerStats / PBP 병렬 조회.
  const [playerStatsRows, pbpRows] = await Promise.all([
    // playerStats — tournamentTeamId 별 points 합산용. tournamentTeamPlayer.tournamentTeamId
    // 필요 (어느 팀 소속인지) → include 로 join.
    tx.matchPlayerStat.findMany({
      where: { tournamentMatchId: matchId },
      select: {
        points: true,
        tournamentTeamPlayer: {
          select: { tournamentTeamId: true },
        },
      },
    }),
    // PBP — computeScoreFromPbp 가 요구하는 5 필드만 SELECT.
    tx.play_by_plays.findMany({
      where: { tournament_match_id: matchId },
      select: {
        quarter: true,
        action_type: true,
        is_made: true,
        points_scored: true,
        tournament_team_id: true,
      },
    }),
  ]);

  // 우선순위 2단계: playerStats 팀별 points 합 > 0 → "playerStats" source.
  // tournamentTeamPlayer.tournamentTeamId 가 homeTeamId/awayTeamId 와 매칭.
  const homeIdNum = Number(match.homeTeamId);
  const awayIdNum = Number(match.awayTeamId);
  let psHome = 0;
  let psAway = 0;
  for (const s of playerStatsRows) {
    const ttId = s.tournamentTeamPlayer?.tournamentTeamId;
    if (ttId == null) continue;
    const pts = s.points ?? 0;
    if (pts <= 0) continue;
    if (Number(ttId) === homeIdNum) psHome += pts;
    else if (Number(ttId) === awayIdNum) psAway += pts;
  }

  // PBP 항상 재계산 — quarterScores JSON 의 유일한 source. computeScoreFromPbp 헬퍼 재사용.
  // 운영 일관성: live API L1143 + Phase A backfill 과 같은 함수 호출.
  const pbpForScore: PbpRowForScore[] = pbpRows.map((p) => ({
    quarter: p.quarter,
    action_type: p.action_type,
    is_made: p.is_made,
    points_scored: p.points_scored,
    tournament_team_id: p.tournament_team_id,
  }));
  const pbpScore = computeScoreFromPbp(pbpForScore, match.homeTeamId, match.awayTeamId);

  // source 결정 — playerStats 둘 중 하나라도 > 0 이면 playerStats, 아니면 PBP.
  // (열혈농구단 #98 패턴 = playerStats / 몰텐배 #132 패턴 = PBP)
  let source: "playerStats" | "pbp";
  let resolvedHome: number;
  let resolvedAway: number;
  if (psHome > 0 || psAway > 0) {
    source = "playerStats";
    resolvedHome = psHome;
    resolvedAway = psAway;
  } else {
    source = "pbp";
    resolvedHome = pbpScore.home;
    resolvedAway = pbpScore.away;
  }

  // quarterScores 빌드 — PBP 기반 (Phase B live API L838~845 와 동일 구조).
  // PBP 가 1행이라도 있으면 quarterScores 박제 / 0행이면 null (변경 X).
  let quarterScoresOut: QuarterScoresShape | null = null;
  if (pbpRows.length > 0) {
    const qMap = pbpScore.quarters;
    quarterScoresOut = {
      home: {
        q1: qMap[1]?.home ?? 0,
        q2: qMap[2]?.home ?? 0,
        q3: qMap[3]?.home ?? 0,
        q4: qMap[4]?.home ?? 0,
        ot: [],
      },
      away: {
        q1: qMap[1]?.away ?? 0,
        q2: qMap[2]?.away ?? 0,
        q3: qMap[3]?.away ?? 0,
        q4: qMap[4]?.away ?? 0,
        ot: [],
      },
    };
    // OT (Q5+) — 키 정렬해서 순차 push.
    for (const q of Object.keys(qMap).map(Number).filter((n) => n > 4).sort()) {
      quarterScoresOut.home.ot.push(qMap[q].home);
      quarterScoresOut.away.ot.push(qMap[q].away);
    }
  }

  // winner_team_id 재결정 — 새 점수 비교 결과.
  // 동점이면 null (Phase A apply 와 동일 룰).
  let winnerTeamIdOut: bigint | null;
  if (resolvedHome > resolvedAway) winnerTeamIdOut = match.homeTeamId;
  else if (resolvedAway > resolvedHome) winnerTeamIdOut = match.awayTeamId;
  else winnerTeamIdOut = null; // 동점 — 별도 결정 필요

  // changed 플래그 — 기존 DB 값과 비교해서 실제로 변경 필요한지.
  const awayScoreCur = match.awayScore ?? 0;
  const changedHome = resolvedHome !== homeScoreCur;
  const changedAway = resolvedAway !== awayScoreCur;
  // winner — BigInt 비교 안전: 둘 다 null 이면 변경 X / 한쪽만 null 또는 값 다르면 변경.
  const winnerCurStr = match.winner_team_id?.toString() ?? null;
  const winnerNewStr = winnerTeamIdOut?.toString() ?? null;
  const changedWinner = winnerCurStr !== winnerNewStr;
  // quarterScores — PBP 가 있으면서 (quarterScoresOut != null) 기존 DB JSON 과 다르면 변경.
  // 기존 DB JSON 의 단순 비교 — JSON.stringify 로 직렬화 비교 (필드 순서가 같다는 가정 안전).
  let changedQuarter = false;
  if (quarterScoresOut !== null) {
    const beforeJson = JSON.stringify(match.quarterScores ?? null);
    const afterJson = JSON.stringify(quarterScoresOut);
    changedQuarter = beforeJson !== afterJson;
  }

  return {
    source,
    homeScore: resolvedHome,
    awayScore: resolvedAway,
    quarterScores: quarterScoresOut,
    winnerTeamId: winnerTeamIdOut,
    changed: {
      homeScore: changedHome,
      awayScore: changedAway,
      quarterScores: changedQuarter,
      winnerTeamId: changedWinner,
    },
  };
}

/**
 * 매치 종료 시 score 보정 + UPDATE + audit 박제 (status="completed" hook 용).
 *
 * - skip / 변경 0 → 아무 동작 안 함 (null 반환)
 * - 변경 발생 → UPDATE + recordMatchAudit("system", context) 박제
 *
 * 트랜잭션 안전:
 * - tx 안에서 SELECT(before) + UPDATE + audit 박제 모두 실행
 * - audit 박제 실패 → 트랜잭션 rollback (UPDATE 도 무효화)
 *
 * @param tx       Prisma.TransactionClient (status route 의 prisma.$transaction 안에서 호출)
 * @param matchId  TournamentMatch.id
 * @param context  audit context (기본: "status-completed-safety-net")
 * @returns        RecomputeResult (skip 포함) / 매치 없으면 null
 */
export async function applyScoreSafetyNet(
  tx: Prisma.TransactionClient,
  matchId: bigint,
  context: string = "status-completed-safety-net",
): Promise<RecomputeResult | null> {
  const result = await computeRecomputedScore(tx, matchId);
  if (!result) return null;
  // skip 이거나 모든 changed=false → UPDATE/audit 진입 X.
  // (homeScore=0 + playerStats=0 + PBP=0 케이스도 여기서 걸러짐 — 변경 0)
  const anyChanged =
    result.changed.homeScore ||
    result.changed.awayScore ||
    result.changed.quarterScores ||
    result.changed.winnerTeamId;
  if (!anyChanged) return result;

  // UPDATE 데이터 빌드 — 변경된 필드만 (이미 박제된 필드는 건드리지 않음).
  const updateData: Prisma.TournamentMatchUpdateInput = {};
  if (result.changed.homeScore) updateData.homeScore = result.homeScore;
  if (result.changed.awayScore) updateData.awayScore = result.awayScore;
  if (result.changed.quarterScores && result.quarterScores) {
    updateData.quarterScores = result.quarterScores as unknown as Prisma.InputJsonValue;
  }
  if (result.changed.winnerTeamId) {
    // winner_team_id 컬럼 (snake_case) — Prisma update 시 raw field 명 사용.
    // schema 의 winner_team_id 는 mapping 없이 그대로 — TypeScript 키도 winner_team_id.
    (updateData as Record<string, unknown>).winner_team_id = result.winnerTeamId;
  }

  // audit 용 before 스냅샷 — recordMatchAudit 가 TRACKED_FIELDS 비교에 사용.
  const before = await tx.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
    },
  });
  if (!before) return null;

  // UPDATE — 변경 필드만.
  await tx.tournamentMatch.update({
    where: { id: matchId },
    data: updateData,
  });

  // audit 박제 — recordMatchAudit 의 TRACKED_FIELDS 중 변경된 것만 after 에 명시.
  // (after 에 명시 안 된 필드는 변경 비교 X — recordMatchAudit 내부 룰)
  const auditAfter: Record<string, unknown> = {};
  const auditBefore: Record<string, unknown> = {};
  if (result.changed.homeScore) {
    auditAfter.homeScore = result.homeScore;
    auditBefore.homeScore = before.homeScore;
  }
  if (result.changed.awayScore) {
    auditAfter.awayScore = result.awayScore;
    auditBefore.awayScore = before.awayScore;
  }
  if (result.changed.winnerTeamId) {
    auditAfter.winner_team_id = result.winnerTeamId;
    auditBefore.winner_team_id = before.winner_team_id;
  }
  // quarterScores 는 TRACKED_FIELDS 에 없음 — audit 박제 ❌ (변경 사실만 result 로 호출자에게 전달).

  if (Object.keys(auditAfter).length > 0) {
    await recordMatchAudit(
      tx,
      matchId,
      auditBefore,
      auditAfter,
      "system",
      context,
      null,
    );
  }

  return result;
}
