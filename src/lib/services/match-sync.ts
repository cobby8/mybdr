/**
 * 단일 매치 동기화 core 서비스 — Flutter sync route + 웹 종이 기록지 BFF 공용.
 *
 * 2026-05-11 — Phase 1-B 신규 (sync route refactor 추출).
 *
 * 배경:
 *   - 사용자 결재 (decisions.md [2026-05-11] §1) = "sync API 재사용 + BFF wrap" 단일 source 박제 path.
 *   - sync route 의 core 비즈니스 로직 (점수 update + status 전환 + winner 자동 결정 +
 *     BUG-04 quarterScores 보정 + dual_tournament 자동 진출 + advanceWinner + updateTeamStandings +
 *     waitUntil(triggerMatchBriefPublish) + player_stats upsert + play_by_plays upsert) 을
 *     별도 서비스 함수로 추출하여 양쪽 caller (Flutter sync route, 웹 BFF) 가 동일 path 호출.
 *
 * 단일 책임 (caller 별 분리):
 *   - 본 서비스: core sync 로직만 담당 (input 은 zod parse 완료된 검증 데이터)
 *   - caller (sync route): zod 검증 + JWT/API token 권한 + 모드 가드 + 응답 wrap
 *   - caller (BFF Phase 1-B): zod 검증 + 웹 세션 권한 + 모드 가드 + audit 박제 + 응답 wrap
 *
 * 단순 추출 원칙:
 *   - 기존 sync route handler 의 동작 (응답 데이터 / 부작용 / 에러 처리) 을 100% 그대로 유지.
 *   - 신규 audit 박제 / 사이드 이펙트 추가 X — 본 turn 은 refactor 만 (결과 0 변경 보장).
 *   - BFF 가 호출할 때 추가로 박제할 audit 는 BFF 가 별도 호출 (service 외부 책임).
 */

import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
// 2026-05-16 영구 fix (PR-G5.5-followup-B): post-process 5종 호출 통합 헬퍼
//   기존 분산 호출 (updateTeamStandings / advanceWinner / progressDualMatch /
//   advanceDivisionPlaceholders / advanceTournamentPlaceholders / checkAndAutoCompleteTournament)
//   = finalize-match-completion.ts 단일 source 로 통합. 신규 매치 종료 path 박제 시 1줄 호출만.
import {
  finalizeMatchCompletion,
  type FinalizeMatchCompletionResult,
} from "@/lib/tournaments/finalize-match-completion";
// 2026-05-09: 알기자 자동 발행 — sync path 가 updateMatchStatus 헬퍼 우회로 trigger 미호출되던 문제 fix.
//   waitUntil 로 wrap (Vercel serverless 응답 종료 후 process abort 방지).
//   본 헬퍼 외 호출 — status 전환 시점 (existing.status !== "completed") 검증 필요 → finalizeMatchCompletion 미포함.
import { waitUntil } from "@vercel/functions";
import { triggerMatchBriefPublish } from "@/lib/news/auto-publish-match-brief";
// 2026-05-23 — PR-5 F1 (errors.md [2026-05-21] 점수 4 source 시스템 차원 결함 fix):
//   매치 종료 시점 (status='completed' 신규 전환) quarterScores 자동 갱신.
//   paper 매치 = skip (DB.QS = SSOT 보존 / LIVE API L933 패턴 답습).
//   Flutter 매치 + PBP 합 → QS 자동 갱신 → LIVE 표시 / standings / cross-check 4 source 정합.
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
import {
  computeQuarterScoresFromPbp,
  shouldAutoSyncQuarterScores,
  type QuarterScoresJson,
} from "@/lib/tournaments/quarter-scores-sync";

// ============================================================================
// 입력 타입 — zod parse 결과 type 과 동치 (caller 가 검증 후 전달)
// ============================================================================

/**
 * 단일 매치 sync 본체 (server_id + 점수 + status + quarter_scores 등).
 * sync route 의 singleMatchSyncSchema.match 와 동일 구조.
 */
export interface MatchSyncInput {
  server_id: number;
  home_score: number;
  away_score: number;
  status: string; // SYNC_ALLOWED_STATUSES enum 멤버 (caller 가 zod 검증)
  current_quarter?: number;
  quarter_scores?: unknown; // JSON — 구조 검증은 BUG-04 보정 단계에서 처리
  mvp_player_id?: number | null;
  started_at?: string | null;
  ended_at?: string | null;
}

/**
 * 선수별 boxscore 스탯 — 22 필드 + 부가 (fouled_out / ejected / quarter_stats_json).
 */
export interface PlayerStatInput {
  tournament_team_player_id: number;
  tournament_team_id: number;
  is_starter: boolean;
  minutes_played: number;
  points: number;
  field_goals_made: number;
  field_goals_attempted: number;
  two_pointers_made: number;
  two_pointers_attempted: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  offensive_rebounds: number;
  defensive_rebounds: number;
  total_rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  personal_fouls: number;
  technical_fouls: number;
  unsportsmanlike_fouls: number;
  plus_minus: number;
  quarter_stats_json?: string | null;
  fouled_out: boolean;
  ejected: boolean;
}

/**
 * Play-by-play 이벤트 — Flutter PBP 22 필드 + 부가 (description / flags).
 */
export interface PlayByPlayInput {
  local_id: string;
  tournament_team_player_id: number | null;
  tournament_team_id: number;
  quarter: number;
  game_clock_seconds: number;
  shot_clock_seconds?: number | null;
  action_type: string;
  action_subtype?: string | null;
  is_made?: boolean | null;
  points_scored: number;
  court_x?: number | null;
  court_y?: number | null;
  court_zone?: number | null;
  shot_distance?: number | null;
  home_score_at_time: number;
  away_score_at_time: number;
  assist_player_id?: number | null;
  rebound_player_id?: number | null;
  block_player_id?: number | null;
  steal_player_id?: number | null;
  fouled_player_id?: number | null;
  sub_in_player_id?: number | null;
  sub_out_player_id?: number | null;
  is_flagrant: boolean;
  is_technical: boolean;
  is_fastbreak: boolean;
  is_second_chance: boolean;
  is_from_turnover: boolean;
  description?: string | null;
}

/**
 * 기존 매치 row — caller 가 mode 가드 등으로 이미 SELECT 한 경우 재사용 (1B-2 신규).
 *
 * 본 service 는 다음 필드만 사용 — 더 많은 필드가 있어도 무시.
 *   - id, tournamentId, homeTeamId, awayTeamId, winner_team_id, status, started_at
 *   - settings (2026-05-23 F1 추가 — recording mode 판정용)
 *
 * Prisma 타입 `TournamentMatch` 와 그대로 호환 (full row 전달 가능).
 */
export interface ExistingMatchForSync {
  id: bigint;
  tournamentId: string;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  winner_team_id: bigint | null;
  status: string | null;
  // 2026-05-17 fix A — status='in_progress' 전환 시 started_at NULL 박제 가드용 (auto-register 윈도우 정확성)
  started_at: Date | null;
  // 2026-05-23 F1 — quarterScores 자동 갱신 paper 분기 판정용 (getRecordingMode 입력).
  //   optional = caller 미제공 시 service 가 findFirst (line 396) 통해 자동 채움 → 회귀 0.
  //   기존 caller (score-sheet BFF / 양면 호출자) 는 미박제 그대로 통과 (Prisma row 가 settings 자동 SELECT).
  settings?: Prisma.JsonValue | null;
}

/**
 * syncSingleMatch 호출 인자.
 *
 * `existingMatch` (1B-2 신규, optional):
 *   - 주어지면 service 가 내부 `findFirst` 를 건너뜀 (SELECT 1회 감소).
 *   - caller (BFF) 가 권한/모드 가드용으로 이미 SELECT 한 row 그대로 전달.
 *   - 미제공 시 기존 동작 (service 가 findFirst 1회) — 하위 호환.
 */
export interface SyncSingleMatchParams {
  tournamentId: string;
  match: MatchSyncInput;
  player_stats?: PlayerStatInput[];
  play_by_plays?: PlayByPlayInput[];
  existingMatch?: ExistingMatchForSync;
}

// ============================================================================
// 응답 타입 — sync route 응답 envelope (apiSuccess 입력) 와 동일
// ============================================================================

export type SyncPostProcessStatus = "ok" | "partial_failure" | "skipped";

export interface SyncSingleMatchSuccess {
  ok: true;
  /** apiSuccess() 본문에 그대로 spread 가능한 데이터 */
  data: {
    server_match_id: number;
    player_count: number;
    play_by_play_count: number;
    synced_at: string;
    post_process_status: SyncPostProcessStatus;
    warnings?: string[];
  };
}

export type SyncSingleMatchErrorCode = "MATCH_NOT_FOUND" | "INTERNAL_ERROR";

export interface SyncSingleMatchFailure {
  ok: false;
  code: SyncSingleMatchErrorCode;
  message: string;
}

export type SyncSingleMatchResult = SyncSingleMatchSuccess | SyncSingleMatchFailure;

// ============================================================================
// 순수 헬퍼 (테스트용 export) — DB 의존성 없음, 분기 로직만 검증 가능
// ============================================================================

/**
 * BUG-04 quarter score 합산 정합 보정 — 합 ≠ 점수면 quarterScores 합 우선.
 *
 * 이유: Flutter 앱이 quarter_scores 와 home_score/away_score 를 별도 전송 시
 *      race condition / 캐싱 버그로 둘이 어긋날 수 있음. 정답은 quarter 합 (PBP 무관).
 *
 * @param matchInput 매치 sync 입력 (home_score/away_score/quarter_scores)
 * @returns 보정된 (homeScore, awayScore) — quarter_scores 없거나 일치 시 원본 그대로
 */
export function correctScoresFromQuarters(matchInput: {
  home_score: number;
  away_score: number;
  quarter_scores?: unknown;
}): { homeScore: number; awayScore: number } {
  let correctedHomeScore = matchInput.home_score;
  let correctedAwayScore = matchInput.away_score;
  if (!matchInput.quarter_scores) {
    return { homeScore: correctedHomeScore, awayScore: correctedAwayScore };
  }
  const qs = matchInput.quarter_scores as {
    home?: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] };
    away?: { q1?: number; q2?: number; q3?: number; q4?: number; ot?: number[] };
  };
  if (qs.home && qs.away) {
    const sumQuarters = (side: {
      q1?: number;
      q2?: number;
      q3?: number;
      q4?: number;
      ot?: number[];
    }) => {
      const base =
        (side.q1 ?? 0) + (side.q2 ?? 0) + (side.q3 ?? 0) + (side.q4 ?? 0);
      const otSum = (side.ot ?? []).reduce((a: number, b: number) => a + b, 0);
      return base + otSum;
    };
    const qsHome = sumQuarters(qs.home);
    const qsAway = sumQuarters(qs.away);
    if (qsHome !== matchInput.home_score || qsAway !== matchInput.away_score) {
      correctedHomeScore = qsHome;
      correctedAwayScore = qsAway;
    }
  }
  return { homeScore: correctedHomeScore, awayScore: correctedAwayScore };
}

/**
 * winner_team_id 자동 결정 — status="completed" + winner 미결정 + 양 팀 존재 시.
 *
 * 동점이면 null 반환 (수동 결정 필요 — advanceWinner / progressDualMatch 모두 null 시 skip).
 *
 * @param params status / 보정된 점수 / 기존 winner / home/away teamId
 * @returns 결정된 winnerTeamId (또는 기존 값 유지)
 */
export function decideWinnerTeamId(params: {
  status: string;
  homeScore: number;
  awayScore: number;
  existingWinnerTeamId: bigint | null;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
}): bigint | null {
  // 기존 winner 가 있으면 그대로 보존 (idempotent)
  if (params.existingWinnerTeamId) return params.existingWinnerTeamId;
  // completed 가 아니면 결정 X
  if (params.status !== "completed") return null;
  // 양 팀 미설정 = 결정 불가
  if (!params.homeTeamId || !params.awayTeamId) return null;
  // 점수 비교
  if (params.homeScore > params.awayScore) return params.homeTeamId;
  if (params.awayScore > params.homeScore) return params.awayTeamId;
  // 동점 → null
  return null;
}

/**
 * boxscore percentage + efficiency 계산.
 *
 * NBA 표준 — 시도 0 이면 % = 0 (0/0 NaN 방지). efficiency = 전통 PER 공식.
 *
 * @param stat 선수 boxscore raw (made/attempted/포인트/리바운드/스틸/블록/턴오버)
 * @returns 계산된 percentage 4종 + efficiency
 */
export function computeStatRates(stat: {
  field_goals_made: number;
  field_goals_attempted: number;
  three_pointers_made: number;
  three_pointers_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  two_pointers_made: number;
  two_pointers_attempted: number;
  points: number;
  total_rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}): {
  fgPct: number;
  tpPct: number;
  ftPct: number;
  twoPct: number;
  efficiency: number;
} {
  const fga = stat.field_goals_attempted;
  const tpa = stat.three_pointers_attempted;
  const fta = stat.free_throws_attempted;
  const twopa = stat.two_pointers_attempted;
  const fgPct = fga > 0 ? (stat.field_goals_made / fga) * 100 : 0;
  const tpPct = tpa > 0 ? (stat.three_pointers_made / tpa) * 100 : 0;
  const ftPct = fta > 0 ? (stat.free_throws_made / fta) * 100 : 0;
  const twoPct = twopa > 0 ? (stat.two_pointers_made / twopa) * 100 : 0;
  const efficiency =
    stat.points +
    stat.total_rebounds +
    stat.assists +
    stat.steals +
    stat.blocks -
    (fga - stat.field_goals_made) -
    (fta - stat.free_throws_made) -
    stat.turnovers;
  return { fgPct, tpPct, ftPct, twoPct, efficiency };
}

/**
 * reset 감지 — Flutter 앱이 매치를 처음부터 다시 시작한 케이스.
 *
 * status=scheduled + player_stats 없음 + play_by_plays 없음 → 서버 PBP/stats 전체 삭제.
 *
 * @param params status / stats 길이 / plays 길이
 * @returns true = reset 케이스 (caller 가 deleteMany 수행)
 */
export function isMatchReset(params: {
  status: string;
  playerStatsLength: number;
  playByPlaysLength: number;
}): boolean {
  return (
    params.status === "scheduled" &&
    params.playerStatsLength === 0 &&
    params.playByPlaysLength === 0
  );
}

// ============================================================================
// core 함수 — 단일 매치 동기화
// ============================================================================

/**
 * 단일 매치 sync core 로직 — caller (sync route / BFF) 가 검증/권한 통과 후 호출.
 *
 * 동작 순서 (기존 sync route handler 와 동일 — 결과 0 변경):
 *   1. 매치 존재 확인 (`tournamentMatch.findFirst`) — 404 처리
 *   2. tournament.format 조회 (dual_tournament 분기용)
 *   3. winner_team_id 사전 init (BUG-04 보정 후 결정)
 *   4. quarterScores 합산 정합 보정 (BUG-04) — 합 ≠ 점수면 quarterScores 합 우선
 *   5. status=completed 시 winner_team_id 자동 결정 (home/away 비교 — 동점은 null)
 *   6. tournamentMatch.update — 점수 + status + quarterScores + winner + 메타
 *   7. completed 신규 전환 시 waitUntil(triggerMatchBriefPublish) — 알기자 자동 발행
 *   8. reset 감지 (status=scheduled + stats/PBP 미포함) → PBP + matchPlayerStat deleteMany
 *   9. player_stats upsert (병렬) — percentage 자동 계산 + efficiency
 *   10. play_by_plays upsert (병렬) — incoming local_id 외 삭제 (운영자 수동 보정 보호)
 *   11. completed 시 post-process — advanceWinner (single elim 전용) / progressDualMatch (dual) /
 *       updateTeamStandings — Promise.allSettled 로 부분 실패 warnings[] 수집
 *   12. 응답 데이터 반환 (envelope 없음 — caller 가 apiSuccess wrap)
 *
 * 부작용:
 *   - prisma.tournamentMatch.update + matchPlayerStat.upsert + play_by_plays.upsert
 *   - completed 신규 전환 시 waitUntil(triggerMatchBriefPublish) — fire-and-forget
 *   - completed 시 advance / standings / dual progression — Promise.allSettled
 *
 * 에러 처리:
 *   - 매치 미존재 → `{ ok: false, code: "MATCH_NOT_FOUND" }` (caller 가 404 응답)
 *   - 그 외 throw → caller 가 catch 후 500 응답
 *
 * @param params 검증된 sync 데이터 + tournamentId
 * @returns SyncSingleMatchResult — caller 가 apiSuccess/apiError wrap
 */
export async function syncSingleMatch(
  params: SyncSingleMatchParams
): Promise<SyncSingleMatchResult> {
  const { tournamentId, match, player_stats, play_by_plays, existingMatch } = params;

  // 1) 매치 존재 확인 — caller 가 existingMatch 전달 시 SELECT skip (1B-2 신규 / 하위 호환).
  // 이유: BFF (또는 sync route) 가 권한/모드 가드용으로 이미 SELECT 한 row 그대로 활용 → DB round trip 1회 감소.
  //   기존 sync route 동작 (existingMatch 미제공) = findFirst 1회 그대로 (회귀 0).
  // 검증: existingMatch 가 주어져도 tournamentId 일치 확인 (IDOR 보호 — caller 가 잘못된 row 전달 케이스 차단).
  let existing: ExistingMatchForSync | null = null;
  if (existingMatch) {
    // caller 가 mode 가드용 SELECT 한 row 재사용 — id/tournamentId 일치 검증 (IDOR 가드).
    if (
      existingMatch.id === BigInt(match.server_id) &&
      existingMatch.tournamentId === tournamentId
    ) {
      existing = existingMatch;
    }
    // 불일치 시 안전하게 fallback (findFirst 재실행 — 아래 if 블록 진입).
  }
  if (!existing) {
    // 기존 sync route line 122~127 동등 — existingMatch 미제공 또는 불일치 시 SELECT.
    existing = await prisma.tournamentMatch.findFirst({
      where: { id: BigInt(match.server_id), tournamentId },
    });
  }
  if (!existing) {
    return {
      ok: false,
      code: "MATCH_NOT_FOUND",
      message: "Match not found in tournament",
    };
  }

  const matchId = BigInt(match.server_id);
  const now = new Date();

  // 2) tournament.format 1회 조회 — dual_tournament 분기용
  // 기존 sync route line 141~144 동등 (SELECT only).
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { format: true },
  });

  // 3-4) BUG-04 보정 — 헬퍼 위임 (순수 함수, 테스트 가능)
  // 기존 sync route line 153~178 동등.
  const { homeScore: correctedHomeScore, awayScore: correctedAwayScore } =
    correctScoresFromQuarters(match);
  if (
    correctedHomeScore !== match.home_score ||
    correctedAwayScore !== match.away_score
  ) {
    // 보정 발생 시 운영 모니터링 로그 (기존 sync route 와 동일 — 형식 보존).
    console.warn(
      `[match-sync] BUG-04: quarterScores mismatch matchId=${match.server_id}` +
        ` qs=${correctedHomeScore}-${correctedAwayScore} vs score=${match.home_score}-${match.away_score}. Using quarterScores.`
    );
  }

  // 5) winner_team_id 자동 결정 — 헬퍼 위임 (순수 함수, 테스트 가능)
  // 기존 sync route line 183~192 동등.
  const winnerTeamId = decideWinnerTeamId({
    status: match.status,
    homeScore: correctedHomeScore,
    awayScore: correctedAwayScore,
    existingWinnerTeamId: existing.winner_team_id,
    homeTeamId: existing.homeTeamId,
    awayTeamId: existing.awayTeamId,
  });

  // 6-pre) 2026-05-23 F1 (errors.md [2026-05-21] 점수 4 source 시스템 차원 결함 fix):
  //   매치 종료 시점 (status='completed' 신규 전환) quarterScores 자동 갱신.
  //   - paper 매치 = skip (DB.QS = SSOT 보존 / LIVE API L933 패턴 답습)
  //   - Flutter 매치 + PBP 1+ + completed 신규 전환 → PBP made events 합으로 QS 박제
  //   - 그 외 = input.quarter_scores 보존 (라이브 / 재진입 / 신규 매치 박제 흐름 보존)
  //
  //   효과: Flutter 매치 D 분류 (QS=0/0) 신규 박제 차단. 기존 58건은 별도 backfill PR-6.
  const recordingMode = getRecordingMode({ settings: existing.settings ?? null });
  const shouldSync = shouldAutoSyncQuarterScores({
    recordingMode,
    newStatus: match.status,
    previousStatus: existing.status ?? "scheduled",
    pbpCount: play_by_plays?.length ?? 0,
  });
  let autoQuarterScores: QuarterScoresJson | undefined = undefined;
  if (shouldSync && play_by_plays && existing.homeTeamId !== null) {
    // homeTeamId Number 변환 — PBP input 의 tournament_team_id 도 number 타입
    autoQuarterScores = computeQuarterScoresFromPbp(
      play_by_plays,
      Number(existing.homeTeamId)
    );
  }

  // 6) tournamentMatch.update — 점수 + status + winner + 메타
  // 기존 sync route line 195~218 동등.
  //
  // 2026-05-23 F1 변경: autoQuarterScores 가 박제되면 input.quarter_scores 무시.
  //   룰: Flutter app 의 QS=0/0 박제는 PBP 합으로 덮어쓰기 / paper 매치는 위에서 skip 되었으므로
  //        score-sheet BFF 박제 QS 그대로 보존 (autoQuarterScores=undefined).
  const effectiveQuarterScores = autoQuarterScores ?? match.quarter_scores;

  // 2026-06-14 completed 역전 차단 가드:
  //   이미 completed 박제된 매치를 Flutter sync 가 scheduled/live/in_progress 로 되돌리는 사고 방지.
  //   룰: existing 이 completed 인데 들어온 match.status 가 completed 아니면 → completed 유지(역전 무시).
  //   정방향(scheduled→...→completed) · completed→completed 재sync 는 그대로 허용(회귀 0).
  //   존스(L528) 알기자 trigger 는 match.status === "completed" 조건이라 역전 차단 시 발동 안 함(정상).
  const effectiveStatus =
    existing.status === "completed" && match.status !== "completed"
      ? "completed"
      : match.status;
  if (effectiveStatus !== match.status) {
    console.warn(
      `[sync-guard] match ${matchId} completed 역전 차단: ${existing.status}→${match.status} 무시, completed 유지`
    );
  }
  await prisma.tournamentMatch.update({
    where: { id: matchId },
    data: {
      homeScore: correctedHomeScore,
      awayScore: correctedAwayScore,
      status: effectiveStatus,
      ...(winnerTeamId && winnerTeamId !== existing.winner_team_id
        ? { winner_team_id: winnerTeamId }
        : {}),
      // I-01: current_quarter는 quarter_scores JSON 내부에 함께 보관 (DB 컬럼 미존재)
      quarterScores: effectiveQuarterScores
        ? JSON.parse(
            JSON.stringify({
              ...(effectiveQuarterScores as Record<string, unknown>),
              ...(match.current_quarter != null && {
                current_quarter: match.current_quarter,
              }),
            })
          )
        : match.current_quarter != null
          ? { current_quarter: match.current_quarter }
          : undefined,
      mvp_player_id: match.mvp_player_id ? BigInt(match.mvp_player_id) : undefined,
      // 2026-05-17 fix A (강남구협회장배 #203 사고 영구 차단):
      //   클라이언트 started_at 미전송 + status='in_progress' 전환 + 기존 started_at NULL 시
      //   서버 NOW() 자동 박제. (auto-register 윈도우 가드의 ref 정확성 보장)
      //   기존 동작 보존: started_at 있으면 클라이언트 값 우선 / 다른 status 영향 0.
      started_at: match.started_at
        ? new Date(match.started_at)
        : (match.status === "in_progress" && existing.started_at === null
            ? new Date()
            : undefined),
      ended_at: match.ended_at ? new Date(match.ended_at) : undefined,
    },
  });

  // 7) 알기자 자동 발행 — completed 신규 전환 시점만 trigger.
  // 기존 sync route line 224~226 동등.
  if (existing.status !== "completed" && match.status === "completed") {
    waitUntil(triggerMatchBriefPublish(matchId));
  }

  // 8) 경기 리셋 감지: 헬퍼 위임 (순수 함수, 테스트 가능)
  // 기존 sync route line 230~239 동등.
  const isReset = isMatchReset({
    status: match.status,
    playerStatsLength: player_stats?.length ?? 0,
    playByPlaysLength: play_by_plays?.length ?? 0,
  });
  if (isReset) {
    await Promise.all([
      prisma.play_by_plays.deleteMany({ where: { tournament_match_id: matchId } }),
      prisma.matchPlayerStat.deleteMany({ where: { tournamentMatchId: matchId } }),
    ]);
    console.log(
      `[match-sync] Reset detected matchId=${match.server_id} — cleared PBP & stats`
    );
  }

  // 9) 선수 스탯 upsert (병렬 처리) — % / efficiency 는 헬퍼 위임 (순수 함수, 테스트 가능).
  // 기존 sync route line 242~304 동등.
  if (player_stats && player_stats.length > 0) {
    // 2026-05-21 F3-α (errors.md [2026-05-21] paper 모드 3가지 특수 결함 — C 분류 fix):
    //   PBP `deleteMany NOT IN incoming local_id` 패턴 답습. incoming ttp 외 stale stat 삭제.
    //   재현 케이스 = 강남구 매치 159/164/186 (paper) 운영 audit 분석:
    //     score-sheet submit 30+회 반복 호출 시 다른 ttp set 전송 → 이전 박제 ttp 잔존 → MPS 누적
    //     (ex: 매치 159 홈 MPS 9점 vs PBP 7점 = 2점 stale stat)
    //   회귀 보장: incoming ttp = upsert (기존 동작) / incoming 외 = 삭제 (이전 잔존 정정).
    //   isReset 분기 (status='scheduled' + stats/PBP 0건) 에서는 이미 line 498 에서 전체 deleteMany 수행.
    const incomingTtpIds = player_stats.map((s) => BigInt(s.tournament_team_player_id));
    await prisma.matchPlayerStat.deleteMany({
      where: {
        tournamentMatchId: matchId,
        NOT: { tournamentTeamPlayerId: { in: incomingTtpIds } },
      },
    });

    const statPromises = player_stats.map((stat) => {
      const { fgPct, tpPct, ftPct, twoPct, efficiency } = computeStatRates(stat);

      const statData = {
        isStarter: stat.is_starter,
        minutesPlayed: stat.minutes_played,
        points: stat.points,
        fieldGoalsMade: stat.field_goals_made,
        fieldGoalsAttempted: stat.field_goals_attempted,
        field_goal_percentage: fgPct,
        threePointersMade: stat.three_pointers_made,
        threePointersAttempted: stat.three_pointers_attempted,
        three_point_percentage: tpPct,
        freeThrowsMade: stat.free_throws_made,
        freeThrowsAttempted: stat.free_throws_attempted,
        free_throw_percentage: ftPct,
        two_pointers_made: stat.two_pointers_made,
        two_pointers_attempted: stat.two_pointers_attempted,
        two_point_percentage: twoPct,
        offensive_rebounds: stat.offensive_rebounds,
        defensive_rebounds: stat.defensive_rebounds,
        total_rebounds: stat.total_rebounds,
        assists: stat.assists,
        steals: stat.steals,
        blocks: stat.blocks,
        turnovers: stat.turnovers,
        personal_fouls: stat.personal_fouls,
        technicalFouls: stat.technical_fouls,
        unsportsmanlikeFouls: stat.unsportsmanlike_fouls,
        plusMinus: stat.plus_minus,
        quarterStatsJson: stat.quarter_stats_json ?? null,
        efficiency,
        fouled_out: stat.fouled_out,
        ejected: stat.ejected,
      };

      return prisma.matchPlayerStat.upsert({
        where: {
          tournamentMatchId_tournamentTeamPlayerId: {
            tournamentMatchId: matchId,
            tournamentTeamPlayerId: BigInt(stat.tournament_team_player_id),
          },
        },
        create: {
          tournamentMatchId: matchId,
          tournamentTeamPlayerId: BigInt(stat.tournament_team_player_id),
          ...statData,
        },
        update: statData,
      });
    });
    await Promise.all(statPromises);
  }

  // 10) Play-by-Play 동기화
  // 기존 sync route line 307~378 동등.
  // 운영자 수동 보정 PBP 보호 (이중 가드: local_id "manual-fix-" prefix + description "[수동 보정]" prefix).
  if (play_by_plays && play_by_plays.length > 0) {
    const incomingLocalIds = play_by_plays.map((pbp) => pbp.local_id);
    await prisma.play_by_plays.deleteMany({
      where: {
        tournament_match_id: matchId,
        NOT: {
          OR: [
            { local_id: { in: incomingLocalIds } },
            { local_id: { startsWith: "manual-fix-" } },
            { description: { startsWith: "[수동 보정]" } },
          ],
        },
      },
    });

    // Team-owned PBP rows (timeout, team turnover, team rebound, bench tech)
    // do not belong to an individual player. Flutter may send null, while
    // older clients used 0 as a sentinel; both are stored as null.
    const validPbps = play_by_plays.filter(
      (pbp) =>
        pbp.tournament_team_id > 0 &&
        (pbp.tournament_team_player_id === null ||
          pbp.tournament_team_player_id >= 0)
    );
    const pbpPromises = validPbps.map((pbp) => {
      const playerId =
        pbp.tournament_team_player_id && pbp.tournament_team_player_id > 0
          ? BigInt(pbp.tournament_team_player_id)
          : null;
      const pbpData = {
        tournament_match_id: matchId,
        tournament_team_player_id: playerId,
        tournament_team_id: BigInt(pbp.tournament_team_id),
        quarter: pbp.quarter,
        game_clock_seconds: pbp.game_clock_seconds,
        shot_clock_seconds: pbp.shot_clock_seconds ?? null,
        action_type: pbp.action_type,
        action_subtype: pbp.action_subtype ?? null,
        is_made: pbp.is_made ?? null,
        points_scored: pbp.points_scored,
        court_x: pbp.court_x ?? null,
        court_y: pbp.court_y ?? null,
        court_zone: pbp.court_zone ?? null,
        shot_distance: pbp.shot_distance ?? null,
        home_score_at_time: pbp.home_score_at_time,
        away_score_at_time: pbp.away_score_at_time,
        assist_player_id: pbp.assist_player_id ? BigInt(pbp.assist_player_id) : null,
        rebound_player_id: pbp.rebound_player_id ? BigInt(pbp.rebound_player_id) : null,
        block_player_id: pbp.block_player_id ? BigInt(pbp.block_player_id) : null,
        steal_player_id: pbp.steal_player_id ? BigInt(pbp.steal_player_id) : null,
        fouled_player_id: pbp.fouled_player_id ? BigInt(pbp.fouled_player_id) : null,
        sub_in_player_id: pbp.sub_in_player_id ? BigInt(pbp.sub_in_player_id) : null,
        sub_out_player_id: pbp.sub_out_player_id ? BigInt(pbp.sub_out_player_id) : null,
        is_flagrant: pbp.is_flagrant,
        is_technical: pbp.is_technical,
        is_fastbreak: pbp.is_fastbreak,
        is_second_chance: pbp.is_second_chance,
        is_from_turnover: pbp.is_from_turnover,
        description: pbp.description ?? null,
        updated_at: now,
      };

      const createData = {
        local_id: pbp.local_id,
        ...pbpData,
        created_at: now,
      } as Prisma.play_by_playsUncheckedCreateInput;
      const updateData = pbpData as Prisma.play_by_playsUncheckedUpdateInput;

      return prisma.play_by_plays.upsert({
        where: { local_id: pbp.local_id },
        create: createData,
        update: updateData,
      });
    });
    await Promise.all(pbpPromises);
  }

  // 11) 경기 완료 시 통합 post-process 헬퍼 호출 (2026-05-16 영구 fix)
  //
  // 기존 (147 LOC 분산):
  //   updateTeamStandings → advanceWinner/progressDualMatch + advanceDivisionPlaceholders/
  //   advanceTournamentPlaceholders + checkAndAutoCompleteTournament 직접 호출
  //
  // 변경 (헬퍼 1회 호출):
  //   finalizeMatchCompletion 이 위 5종 통합 호출 (분기 로직 + try/catch + warnings 100% 보존).
  //   회귀 0 — match-sync.ts L622~748 블록을 그대로 추출한 헬퍼.
  //
  // 신규 path (Flutter status PATCH / batch-sync) 도 본 헬퍼 호출 = 단일 source 박제.
  const warnings: string[] = [];
  let postProcessStatus: SyncPostProcessStatus = "skipped";

  if (match.status === "completed") {
    let finalizeResult: FinalizeMatchCompletionResult | null = null;
    try {
      finalizeResult = await finalizeMatchCompletion(
        matchId,
        tournamentId,
        "match-sync-service",
        { winnerTeamId },
      );
    } catch (err) {
      // 헬퍼 자체 throw 는 사실상 발생 X (내부 try/catch + Promise.allSettled)
      // 방어적 처리 — 응답 자체는 성공 유지 (warnings 박제만).
      console.error(
        `[match-sync:post-process] finalizeMatchCompletion threw matchId=${match.server_id}:`,
        err,
      );
      warnings.push("매치 종료 후처리 실패 — 관리자에게 문의하세요");
    }

    if (finalizeResult) {
      warnings.push(...finalizeResult.warnings);
      postProcessStatus = finalizeResult.status === "ok" ? "ok" : "partial_failure";
    } else {
      postProcessStatus = "partial_failure";
    }
  }

  // 12) 응답 데이터 반환 — caller (sync route) 가 apiSuccess wrap.
  return {
    ok: true,
    data: {
      server_match_id: Number(match.server_id),
      player_count: player_stats?.length ?? 0,
      play_by_play_count: play_by_plays?.length ?? 0,
      synced_at: now.toISOString(),
      post_process_status: postProcessStatus,
      ...(warnings.length > 0 && { warnings }),
    },
  };
}
