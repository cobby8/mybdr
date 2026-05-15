/**
 * 웹 종이 기록지 제출 BFF.
 *
 * 2026-05-11 — Phase 1-B-2 신규 (decisions.md [2026-05-11] §1 — sync API 재사용 + BFF wrap).
 * 2026-05-12 — Phase 2 확장 (running_score → PBP 변환 + service play_by_plays 전달).
 * 2026-05-13 — Phase 20 fix (사용자 보고 이미지 46 — 라이브 박스스코어 PTS = 0).
 *   running_score + fouls → player_stats 자동 집계 → service 인자 전달 →
 *   MatchPlayerStat upsert → 라이브 박스스코어 PTS 정상 표시.
 *   (buildPlayerStatsFromRunningScore 헬퍼 신규 — vitest 단위 검증 가능하게 export)
 *
 * 단계:
 *   1. `requireScoreSheetAccess(matchId)` — 권한 가드 (recorder/organizer/admin/super) + match SELECT
 *   2. `getRecordingMode(match)` — paper 가 아니면 403 RECORDING_MODE_FLUTTER
 *   3. body zod 검증 (422 시 apiError)
 *   4. running_score → PaperPBPInput[] 변환 → service play_by_plays 인자 (Phase 2 신규)
 *   5. `syncSingleMatch({ ..., existingMatch: match })` — service 호출 (SELECT 2→1 통합)
 *   6. `tournament_match_audits` 박제 (source = "web-score-sheet")
 *   7. 응답 = `apiSuccess({ match_id, status, home_score, away_score })` (snake_case 자동 변환)
 *
 * 단일 source 보장:
 *   - Flutter sync 와 동일 `syncSingleMatch` 호출 → 라이브/박스스코어/통산/알기자 자동 trigger.
 *   - waitUntil(triggerMatchBriefPublish) — completed 신규 전환 시 자동 발화.
 *
 * Phase 2 PBP 박제 룰:
 *   - local_id = `paper-fix-{uuid}` (service manual-fix 보호 룰과 동일 prefix 미사용 — 종이 기록 식별자)
 *   - description = `[종이 기록] N점 득점`
 *   - service 가 매번 deleteMany NOT IN (incoming local_id ∪ manual-fix-*) → 종이 기록은 매번 전체 재박제 idempotent
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { requireScoreSheetAccess } from "@/lib/auth/require-score-sheet-access";
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
import {
  syncSingleMatch,
  type PlayByPlayInput,
  type PlayerStatInput,
} from "@/lib/services/match-sync";
import { marksToPaperPBPInputs } from "@/lib/score-sheet/running-score-helpers";
import { foulsToPBPEvents } from "@/lib/score-sheet/foul-helpers";

// zod schema — 종이 기록지 제출 input
// 이유: Phase 2 = running_score 신규. Phase 1 의 quarter_scores 는 호환성 유지 (없으면 running_score 로부터 자동 산출)
const quarterScoreEntrySchema = z.object({
  q1: z.number().int().min(0).max(199).default(0),
  q2: z.number().int().min(0).max(199).default(0),
  q3: z.number().int().min(0).max(199).default(0),
  q4: z.number().int().min(0).max(199).default(0),
  ot: z.array(z.number().int().min(0).max(199)).max(4).default([]),
});

// Phase 2 — running_score zod schema
//   - position: 1~199 (안전 룰 199 — FIBA 실 상한 160 + 여유)
//   - playerId: 1~ (bigint string)
//   - period: 1~7 (Q1~Q4 + OT1~OT3)
//   - points: 1/2/3
const scoreMarkSchema = z.object({
  position: z.number().int().min(1).max(199),
  playerId: z.string().regex(/^\d+$/, "playerId는 BigInt 문자열"),
  period: z.number().int().min(1).max(7),
  points: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const runningScoreSchema = z.object({
  home: z.array(scoreMarkSchema).max(199),
  away: z.array(scoreMarkSchema).max(199),
  currentPeriod: z.number().int().min(1).max(7),
});

// Phase 3 — fouls zod schema
// Phase 3.5 — type 필드 추가 (P/T/U/D — 사용자 결재 §1)
//   - playerId: bigint string
//   - period: 1~7 (Q1~Q4 + OT1~OT3)
//   - type: "P" | "T" | "U" | "D" (FIBA Article 36-39)
//   - 1팀 1매치 = 12선수 × 5파울 = 60건. 안전 룰 200건 (운영 안전)
const foulMarkSchema = z.object({
  playerId: z.string().regex(/^\d+$/, "playerId는 BigInt 문자열"),
  period: z.number().int().min(1).max(7),
  // Phase 3.5 — 호환성 위해 default "P" 폴백 (구 client 가 type 미전송 시 Personal 처리)
  type: z.enum(["P", "T", "U", "D"]).default("P"),
});

const foulsSchema = z.object({
  home: z.array(foulMarkSchema).max(200),
  away: z.array(foulMarkSchema).max(200),
});

// Phase 4 — timeouts zod schema (FIBA Article 18-19).
//   - period: 1~7 (Q1~Q4 + OT1~OT3)
//   - 1팀 1매치 = 전반 2 + 후반 3 + OT 3개 × 1 = 8건. 안전 룰 10건.
const timeoutMarkSchema = z.object({
  period: z.number().int().min(1).max(7),
});

const timeoutsSchema = z.object({
  home: z.array(timeoutMarkSchema).max(10),
  away: z.array(timeoutMarkSchema).max(10),
});

// Phase 5 — signatures zod schema (FIBA 양식 풋터 8 입력).
//   - 모든 필드 optional (운영자가 일부만 박제 가능)
//   - max 길이는 SignaturesState 의 상수와 일관 (50 / captain 100)
//   - 박제 위치 = match.settings.signatures JSON (timeouts merge 패턴 재사용)
const signaturesSchema = z.object({
  scorer: z.string().max(50).optional(),
  asstScorer: z.string().max(50).optional(),
  timer: z.string().max(50).optional(),
  shotClockOperator: z.string().max(50).optional(),
  refereeSign: z.string().max(50).optional(),
  umpire1Sign: z.string().max(50).optional(),
  umpire2Sign: z.string().max(50).optional(),
  captainSignature: z.string().max(100).optional(),
});

// Phase 19 PR-Stat4 (2026-05-15) — player_stats_input zod schema (6 stat: OR/DR/A/S/B/TO).
//   사용자 결재 Q3 = match_player_stats 직접 박제 (DB 변경 0).
//   shape = Record<playerId, { or, dr, a, s, b, to }> — UI PlayerStatsState 와 동일 shape.
//   playerId = BigInt 문자열 (errors.md 2026-04-17 패턴).
//   각 stat 0~199 안전 룰 (1팀 1매치 50건 안팎 — 199 = 충분히 큰 상한).
const playerStatEntrySchema = z.object({
  or: z.number().int().min(0).max(199).default(0),
  dr: z.number().int().min(0).max(199).default(0),
  a: z.number().int().min(0).max(199).default(0),
  s: z.number().int().min(0).max(199).default(0),
  b: z.number().int().min(0).max(199).default(0),
  to: z.number().int().min(0).max(199).default(0),
});
const playerStatsInputSchema = z.record(
  z.string().regex(/^\d+$/, "playerId는 BigInt 문자열"),
  playerStatEntrySchema
);

// Phase 7-B — lineup zod schema (FIBA 양식 오늘 출전 명단 + 선발 5인).
//   박제 위치 = MatchLineupConfirmed (Flutter 앱 단일 source — Phase PR1~5 와 통합).
//   - starters: 선발 5인 (BigInt 문자열 5개 정확히)
//   - substitutes: 출전 후보 (BigInt 문자열 0~7개)
//   - confirmedById = 기록자 user.id (BFF 가 세션에서 추출)
//
// 룰:
//   - starters.length === 5 강제 (FIBA 표준)
//   - substitutes 와 starters 중복 0 (UI 가 보장하지만 안전망)
//   - 사용자 결재 §2 §3 — 향후 팀장 사전 제출 기능과 같은 모델 사용 (단일 source)
const teamLineupSchema = z.object({
  starters: z
    .array(z.string().regex(/^\d+$/, "ttp id는 BigInt 문자열"))
    .length(5, "선발은 5명 정확히 필요합니다"),
  substitutes: z
    .array(z.string().regex(/^\d+$/, "ttp id는 BigInt 문자열"))
    .max(7, "후보는 최대 7명입니다"),
});

const lineupSchema = z.object({
  home: teamLineupSchema,
  away: teamLineupSchema,
});

// Phase 20 (2026-05-13) — running_score + fouls → player_stats 자동 집계 헬퍼.
//
// 이유:
//   사용자 보고 (이미지 46) — 라이브 박스스코어 PTS = 모두 0. 원인 = score-sheet 제출 시
//   BFF 가 `player_stats: undefined` 로 service 호출 → MatchPlayerStat 0건 → 종료 매치
//   분기에서 stat.points 를 source 로 쓰는 라이브 API (line 712) 가 0 표시.
//
//   Flutter sync 는 자체적으로 player_stats 박제 (Flutter 앱 boxscore 집계 결과 전송) →
//   영향 없음. 본 fix 는 score-sheet path 만 — running_score (1/2/3pt) + fouls (P/T/U)
//   를 player_id 단위 합산하여 service 인자로 전달.
//
// 박제 범위 (Phase 2 기록 가능 항목 기준):
//   - points: 합산 (1/2/3pt 모두 포함)
//   - field_goals_made: 2pt + 3pt 합계 (1pt 자유투 제외)
//   - field_goals_attempted: made 와 동일 (종이 기록 = miss 미박제 → attempted = made)
//   - two_pointers_made / three_pointers_made / free_throws_made: subtype 별 분리 카운트
//   - personal_fouls / technical_fouls / unsportsmanlike_fouls: foul type 별 분리 카운트
//   - 기타 22 stat (리바운드/어시스트/스틸 등) = 0 (종이 기록 미박제 — Phase 2 결재 §scope)
//
// idempotent: 매번 전체 재계산 → service upsert (멱등 — Flutter sync 동작과 동일).
type RunningScoreInput = {
  home: Array<{ position: number; playerId: string; period: number; points: 1 | 2 | 3 }>;
  away: Array<{ position: number; playerId: string; period: number; points: 1 | 2 | 3 }>;
  currentPeriod: number;
};
type FoulsInput = {
  home: Array<{ playerId: string; period: number; type: "P" | "T" | "U" | "D" }>;
  away: Array<{ playerId: string; period: number; type: "P" | "T" | "U" | "D" }>;
};

// Phase 19 PR-Stat4 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) 입력 shape.
//   사용자 결재 Q3 = match_player_stats 직접 박제 (DB 변경 0).
//   UI PlayerStatsState 와 동일 shape (key = playerId string).
type PlayerStatsInput = Record<
  string,
  { or: number; dr: number; a: number; s: number; b: number; to: number }
>;

export function buildPlayerStatsFromRunningScore(params: {
  runningScore?: RunningScoreInput;
  fouls?: FoulsInput;
  // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 입력 (OR/DR/A/S/B/TO).
  //   사용자 결재 Q3 = match_player_stats 직접 박제 (DB 변경 0).
  //   미전송 = 기존 동작 호환 (모든 6 stat 0 박제).
  stats?: PlayerStatsInput;
  homeTeamIdNum: number;
  awayTeamIdNum: number;
}): PlayerStatInput[] {
  const { runningScore, fouls, stats, homeTeamIdNum, awayTeamIdNum } = params;
  // player_id (BigInt string) → 누적 stat
  // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 컬럼 추가 (offensiveRebounds / defensiveRebounds / assists / steals / blocks / turnovers).
  const acc = new Map<
    string,
    {
      tournamentTeamPlayerIdNum: number;
      tournamentTeamIdNum: number;
      points: number;
      twoMade: number;
      threeMade: number;
      ftMade: number;
      personalFouls: number;
      technicalFouls: number;
      unsportsmanlikeFouls: number;
      // Phase 19 PR-Stat4 — 6 stat 누적
      offensiveRebounds: number;
      defensiveRebounds: number;
      assists: number;
      steals: number;
      blocks: number;
      turnovers: number;
    }
  >();

  const ensure = (playerIdStr: string, teamIdNum: number) => {
    let row = acc.get(playerIdStr);
    if (!row) {
      row = {
        tournamentTeamPlayerIdNum: Number(playerIdStr),
        tournamentTeamIdNum: teamIdNum,
        points: 0,
        twoMade: 0,
        threeMade: 0,
        ftMade: 0,
        personalFouls: 0,
        technicalFouls: 0,
        unsportsmanlikeFouls: 0,
        // Phase 19 PR-Stat4 — 6 stat 0 초기값
        offensiveRebounds: 0,
        defensiveRebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
      };
      acc.set(playerIdStr, row);
    }
    return row;
  };

  // 1) running_score 합산 (home / away 각각)
  if (runningScore) {
    for (const m of runningScore.home) {
      const row = ensure(m.playerId, homeTeamIdNum);
      row.points += m.points;
      if (m.points === 1) row.ftMade += 1;
      else if (m.points === 2) row.twoMade += 1;
      else if (m.points === 3) row.threeMade += 1;
    }
    for (const m of runningScore.away) {
      const row = ensure(m.playerId, awayTeamIdNum);
      row.points += m.points;
      if (m.points === 1) row.ftMade += 1;
      else if (m.points === 2) row.twoMade += 1;
      else if (m.points === 3) row.threeMade += 1;
    }
  }

  // 2) fouls 합산 — type 별 카운트 ("D" = Disqualifying 은 personal 로 분류 + ejected 별도)
  if (fouls) {
    for (const f of fouls.home) {
      const row = ensure(f.playerId, homeTeamIdNum);
      if (f.type === "T") row.technicalFouls += 1;
      else if (f.type === "U") row.unsportsmanlikeFouls += 1;
      else row.personalFouls += 1; // P 또는 D
    }
    for (const f of fouls.away) {
      const row = ensure(f.playerId, awayTeamIdNum);
      if (f.type === "T") row.technicalFouls += 1;
      else if (f.type === "U") row.unsportsmanlikeFouls += 1;
      else row.personalFouls += 1; // P 또는 D
    }
  }

  // 3) Phase 19 PR-Stat4 (2026-05-15) — 6 stat 합산 (OR/DR/A/S/B/TO).
  //
  // 이유: 사용자 결재 Q3 = match_player_stats 직접 박제 (DB 변경 0).
  //   UI 의 PlayerStatsState (playerId → {or,dr,a,s,b,to}) 를 acc 에 합산.
  //   team 분기 정보가 없음 (UI 는 양 팀 통합 record) → ensure 호출 시 acc 에 이미 있으면
  //   기존 teamId 유지 / 없으면 home/away 어느 쪽인지 추론 필요.
  //
  // teamId 추론: stats record key 만으로는 home/away 식별 불가.
  //   → 안전 룰: stats 박제는 runningScore 또는 fouls 가 같은 player 에 박제됨을 전제.
  //   → 둘 다 없는 player 의 6 stat 박제 = 매우 예외 (FIBA 종이기록지 흐름상 정상 케이스 X).
  //   → 그런 player 는 home 으로 기본 분류 (UI 에서 입력 안 되는 player 는 stats 도 0 — 안전).
  //   안전망: ensure 호출 시 acc 에 player 가 있으면 기존 teamId 유지 (모순 시 home 폴백).
  if (stats) {
    for (const [playerIdStr, statRow] of Object.entries(stats)) {
      // 기존 row 가 있으면 그 teamId 사용 / 없으면 home 기본 폴백 (예외 케이스 안전망)
      const existing = acc.get(playerIdStr);
      const teamIdNum = existing
        ? existing.tournamentTeamIdNum
        : homeTeamIdNum;
      const row = ensure(playerIdStr, teamIdNum);
      row.offensiveRebounds += statRow.or;
      row.defensiveRebounds += statRow.dr;
      row.assists += statRow.a;
      row.steals += statRow.s;
      row.blocks += statRow.b;
      row.turnovers += statRow.to;
    }
  }

  // 4) PlayerStatInput[] 변환 — 22 stat 의 미박제 항목은 모두 0
  //    field_goals_made = 2pt + 3pt / attempted = made (종이 기록 = miss 무박제)
  //    free_throws_attempted = made (동일)
  // Phase 19 PR-Stat4 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) 박제 wiring.
  //   total_rebounds = or + dr 자동 계산 (FIBA 표준).
  return Array.from(acc.values()).map((row) => {
    const fgMade = row.twoMade + row.threeMade;
    const totalFouls = row.personalFouls + row.technicalFouls + row.unsportsmanlikeFouls;
    return {
      tournament_team_player_id: row.tournamentTeamPlayerIdNum,
      tournament_team_id: row.tournamentTeamIdNum,
      is_starter: false, // lineup 박제는 MatchLineupConfirmed 가 별도 SSOT
      minutes_played: 0, // 종이 기록 = 시간 미박제
      points: row.points,
      field_goals_made: fgMade,
      field_goals_attempted: fgMade, // attempted = made (miss 미박제)
      two_pointers_made: row.twoMade,
      two_pointers_attempted: row.twoMade,
      three_pointers_made: row.threeMade,
      three_pointers_attempted: row.threeMade,
      free_throws_made: row.ftMade,
      free_throws_attempted: row.ftMade,
      // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 박제 (사용자 결재 Q3 = match_player_stats 직접 박제)
      offensive_rebounds: row.offensiveRebounds,
      defensive_rebounds: row.defensiveRebounds,
      total_rebounds: row.offensiveRebounds + row.defensiveRebounds, // FIBA 표준 = or + dr 자동 계산
      assists: row.assists,
      steals: row.steals,
      blocks: row.blocks,
      turnovers: row.turnovers,
      personal_fouls: row.personalFouls,
      technical_fouls: row.technicalFouls,
      unsportsmanlike_fouls: row.unsportsmanlikeFouls,
      plus_minus: 0,
      quarter_stats_json: null,
      fouled_out: totalFouls >= 5,
      ejected: false,
    };
  });
}

const submitSchema = z.object({
  home_score: z.number().int().min(0).max(199),
  away_score: z.number().int().min(0).max(199),
  quarter_scores: z.object({
    home: quarterScoreEntrySchema,
    away: quarterScoreEntrySchema,
  }),
  // Phase 2 신규 — running_score (optional — 미전송 시 Phase 1 호환 동작 = PBP 박제 0)
  running_score: runningScoreSchema.optional(),
  // Phase 3 신규 — fouls (optional — 미전송 시 PBP foul event 박제 0)
  fouls: foulsSchema.optional(),
  // Phase 4 신규 — timeouts (optional — 미전송 시 settings.timeouts 갱신 0)
  //   박제 위치 = match.settings.timeouts JSON (Phase 1-A recording_mode 토글 패턴 재사용)
  timeouts: timeoutsSchema.optional(),
  // Phase 5 신규 — signatures (optional — 미전송 시 settings.signatures 갱신 0)
  //   박제 위치 = match.settings.signatures JSON (Phase 4 timeouts merge 패턴 재사용)
  //   FIBA 양식 풋터 8 입력 (Scorer / Asst Scorer / Timer / Shot Clock Operator /
  //     Referee / Umpire 1 / Umpire 2 / Captain's signature)
  signatures: signaturesSchema.optional(),
  // Phase 7-B 신규 — lineup (optional — 미전송 시 MatchLineupConfirmed upsert skip).
  //   박제 위치 = MatchLineupConfirmed (Flutter 앱 단일 source).
  //   사용자 결재 §2 §3 — 향후 팀장 사전 제출 기능과 같은 모델.
  lineup: lineupSchema.optional(),
  // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 입력 (optional — 미전송 시 6 stat 0 박제).
  //   사용자 결재 Q3 = match_player_stats 직접 박제 (DB 변경 0).
  //   shape = Record<playerId, { or, dr, a, s, b, to }> (UI PlayerStatsState 와 동일).
  //   buildPlayerStatsFromRunningScore 가 본 값을 합산하여 MatchPlayerStat 컬럼 6개에 박제.
  player_stats_input: playerStatsInputSchema.optional(),
  // status: 진행 중 (운영자가 일부만 박제) 또는 완료
  status: z.enum(["in_progress", "completed"]),
  // 헤더 입력 (audit context 박제용 — DB 컬럼 없음)
  referee_main: z.string().max(50).optional(),
  referee_sub1: z.string().max(50).optional(),
  referee_sub2: z.string().max(50).optional(),
  recorder: z.string().max(50).optional(),
  timekeeper: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  const { matchId: matchIdParam } = await context.params;
  const matchIdNum = Number(matchIdParam);
  if (!Number.isFinite(matchIdNum) || matchIdNum <= 0) {
    return apiError("잘못된 매치 ID 입니다.", 400, "INVALID_MATCH_ID");
  }

  // 1) 권한 + 매치/대회 SELECT (settings 포함 — 모드 가드 + service existingMatch 재사용)
  const access = await requireScoreSheetAccess(BigInt(matchIdNum));
  if ("error" in access) return access.error;

  const { user, match, tournament } = access;

  // Phase 23 PR-RO4 (2026-05-15) — 종료 매치 BFF 거부 (사용자 결재 Q8 = MATCH_LOCKED 423 + 수정 모드 우회 분기).
  //
  // 왜 (이유):
  //   클라이언트 차단 (PR-RO1~RO3) 우회 시도 = curl / Postman / 콘솔 fetch.
  //   BFF 가 status="completed" 매치를 거부 = 이중 방어 (사용자 결재 Q8 — 권고안).
  //
  // 어떻게:
  //   - match.status === "completed" 거부 → 423 (Locked) + MATCH_LOCKED 코드.
  //   - 수정 모드 우회는 별도 PR-EDIT3 에서 처리 (본 PR 은 거부만).
  //   - getRecordingMode 가드 직전 (Flutter 모드 가드와 순서 정렬).
  //
  // 운영 동작 보존:
  //   - status != "completed" 매치 (draft / in_progress) = 변경 0 (회귀 0).
  //   - Phase 23 PR4 / PR2~PR6 흐름과 충돌 0 (완료된 매치는 본 분기에서 거부 / 진행 매치는 통과).
  if (match.status === "completed") {
    return apiError(
      "종료된 매치는 수정할 수 없습니다. 수정 모드로 진입해주세요.",
      423,
      "MATCH_LOCKED",
      { match_id: match.id.toString() }
    );
  }

  // 2) 모드 가드 — paper 가 아니면 403 (caller 가 잘못된 매치 접근 차단)
  const mode = getRecordingMode({ settings: match.settings });
  if (mode !== "paper") {
    return apiError(
      "이 매치는 Flutter 기록앱 모드입니다. 운영자가 모드를 전환해야 종이 기록지로 입력할 수 있습니다.",
      403,
      "RECORDING_MODE_FLUTTER",
      { match_id: match.id.toString(), current_mode: mode }
    );
  }

  // 3) body zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([{ message: "Invalid JSON body" }]);
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  const input = parsed.data;

  // 4) Phase 2/3 — running_score / fouls → PBP 변환 (있을 때만)
  // 변환 시 tournament_team_id 필요 → match.homeTeamId / awayTeamId 사용 (match SELECT 에 이미 포함)
  //
  // PBP 통합 source:
  //   - score events (Phase 2) + foul events (Phase 3) 모두 한 배열에 합쳐 service 호출
  //   - service 가 local_id 단위 idempotent (deleteMany NOT IN incoming) — 매번 전체 재박제
  let playByPlays: PlayByPlayInput[] | undefined = undefined;
  const needsTeamCheck = input.running_score || input.fouls;
  if (needsTeamCheck) {
    if (!match.homeTeamId || !match.awayTeamId) {
      return apiError(
        "매치에 양 팀이 배정되지 않았습니다. 운영자에게 문의해주세요.",
        422,
        "TEAMS_NOT_ASSIGNED"
      );
    }
  }

  // 4-1) Phase 2 — running_score → score events
  const scoreEvents: PlayByPlayInput[] = [];
  if (input.running_score) {
    const paperPbps = marksToPaperPBPInputs({
      home: input.running_score.home,
      away: input.running_score.away,
      currentPeriod: input.running_score.currentPeriod,
    });

    // 음수/0 player id 차단 + bigint 변환
    paperPbps.forEach((p) => {
      const playerIdNum = Number(p.tournament_team_player_id_str);
      const teamIdBig =
        p.team_side === "home" ? match.homeTeamId! : match.awayTeamId!;
      scoreEvents.push({
        local_id: p.local_id,
        tournament_team_player_id: playerIdNum,
        tournament_team_id: Number(teamIdBig),
        quarter: p.quarter,
        game_clock_seconds: 0, // 종이 기록 = 시각 미박제 (Phase 4 Time-outs 통합 시 검토)
        shot_clock_seconds: null,
        action_type: p.action_type,
        action_subtype: p.action_subtype,
        is_made: p.is_made,
        points_scored: p.points_scored,
        court_x: null,
        court_y: null,
        court_zone: null,
        shot_distance: null,
        home_score_at_time: p.home_score_at_time,
        away_score_at_time: p.away_score_at_time,
        assist_player_id: null,
        rebound_player_id: null,
        block_player_id: null,
        steal_player_id: null,
        fouled_player_id: null,
        sub_in_player_id: null,
        sub_out_player_id: null,
        is_flagrant: false,
        is_technical: false,
        is_fastbreak: false,
        is_second_chance: false,
        is_from_turnover: false,
        description: p.description,
      });
    });
  }

  // 4-2) Phase 3 — fouls → foul events
  //
  // 박제 룰:
  //   - action_type = "foul" (live API + 통산 stat 호환 — fouls 누적 +1)
  //   - points_scored = 0 (파울 자체는 점수 영향 없음)
  //   - description = "[종이 기록] 선수 N번 PX 파울"
  //   - home_score_at_time / away_score_at_time = 0 (Phase 4+ 자유투 통합 시 보완)
  const foulEvents: PlayByPlayInput[] = [];
  if (input.fouls) {
    const foulPbps = foulsToPBPEvents({
      home: input.fouls.home,
      away: input.fouls.away,
    });
    foulPbps.forEach((p) => {
      const playerIdNum = Number(p.tournament_team_player_id_str);
      const teamIdBig =
        p.team_side === "home" ? match.homeTeamId! : match.awayTeamId!;
      foulEvents.push({
        local_id: p.local_id,
        tournament_team_player_id: playerIdNum,
        tournament_team_id: Number(teamIdBig),
        quarter: p.quarter,
        game_clock_seconds: 0,
        shot_clock_seconds: null,
        action_type: p.action_type,
        action_subtype: null,
        is_made: null,
        points_scored: 0,
        court_x: null,
        court_y: null,
        court_zone: null,
        shot_distance: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        assist_player_id: null,
        rebound_player_id: null,
        block_player_id: null,
        steal_player_id: null,
        fouled_player_id: null,
        sub_in_player_id: null,
        sub_out_player_id: null,
        is_flagrant: false,
        is_technical: false,
        is_fastbreak: false,
        is_second_chance: false,
        is_from_turnover: false,
        description: p.description,
      });
    });
  }

  // 통합 — score + foul events 한 배열 (service idempotent — local_id 단위)
  if (scoreEvents.length > 0 || foulEvents.length > 0) {
    playByPlays = [...scoreEvents, ...foulEvents];
  }

  // 4-3) Phase 20 — running_score + fouls → player_stats 자동 집계.
  //
  // 이유: BFF 가 service 호출 시 player_stats 미전달 → MatchPlayerStat 0건 →
  //   라이브 박스스코어 PTS 모두 0 (사용자 보고 이미지 46). 종이 기록 input 으로부터
  //   player_id 단위 합산하여 service 인자 전달 → MatchPlayerStat upsert → 라이브 정상.
  //
  // 박제 범위: points + FG/3P/FT made + foul type 카운트 (자세한 룰은 헬퍼 docstring 참조).
  let playerStats: PlayerStatInput[] | undefined = undefined;
  // Phase 19 PR-Stat4 (2026-05-15) — 6 stat (OR/DR/A/S/B/TO) 도 함께 합산.
  //   사용자 결재 Q3 = match_player_stats 직접 박제 (DB 변경 0).
  //   running_score / fouls / player_stats_input 중 하나라도 있으면 build 수행.
  const hasAnyStatInput =
    input.running_score || input.fouls || input.player_stats_input;
  if (hasAnyStatInput && match.homeTeamId && match.awayTeamId) {
    const built = buildPlayerStatsFromRunningScore({
      runningScore: input.running_score,
      fouls: input.fouls,
      stats: input.player_stats_input,
      homeTeamIdNum: Number(match.homeTeamId),
      awayTeamIdNum: Number(match.awayTeamId),
    });
    if (built.length > 0) {
      playerStats = built;
    }
  }

  // 5) service 호출 — 단일 source (Flutter sync 와 동일 path)
  // existingMatch 전달 → service 가 findFirst SELECT skip (SELECT 2→1 통합 — Phase 1-B-1 reviewer Minor 권고 처리)
  try {
    const syncResult = await syncSingleMatch({
      tournamentId: match.tournamentId,
      match: {
        server_id: Number(match.id),
        home_score: input.home_score,
        away_score: input.away_score,
        status: input.status,
        quarter_scores: input.quarter_scores,
      },
      // Phase 20 (2026-05-13) — running_score / fouls 가 있으면 player_stats 자동 집계 전달.
      //   사유: MatchPlayerStat 박제 → 라이브 박스스코어 PTS 정상화 (사용자 보고 이미지 46 fix).
      //   미전송 시 = undefined (service 가 stats upsert skip — 기존 동작 호환).
      player_stats: playerStats,
      // Phase 2 — running_score 가 있으면 PBP 박제 / 없으면 기존 동작 (PBP 0)
      play_by_plays: playByPlays,
      // BFF 가 권한 가드용으로 이미 SELECT 한 row 재사용 → service 가 SELECT skip
      existingMatch: {
        id: match.id,
        tournamentId: match.tournamentId,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        winner_team_id: match.winner_team_id,
        status: match.status,
      },
    });

    if (!syncResult.ok) {
      if (syncResult.code === "MATCH_NOT_FOUND") {
        return apiError(syncResult.message, 404, "MATCH_NOT_FOUND");
      }
      return apiError(syncResult.message, 500, "INTERNAL_ERROR");
    }

    // 6) notes UPDATE (별도 — service 는 notes 미지원).
    // 사용자가 비고 입력 시 박제. 사용자 입력 빈 문자열 = 기존 값 유지 (overwrite 안 함).
    if (input.notes !== undefined && input.notes.trim().length > 0) {
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: { notes: input.notes },
      });
    }

    // 6-1) Phase 4 + Phase 5 — settings JSON merge UPDATE (timeouts + signatures 통합).
    //
    // 이유: schema 변경 0 + 기존 settings.recording_mode 키 보존. Phase 1-A withRecordingMode
    //   패턴 재사용 — 객체 spread 로 기존 키 유지. Phase 5 (signatures) 도 같은 패턴 추가.
    //
    // 룰:
    //   - input.timeouts / input.signatures 둘 다 미전송 = 기존 settings 유지 (UPDATE skip)
    //   - 둘 중 하나라도 전송 = 단일 UPDATE 로 통합 처리 (DB 왕복 최소화)
    //   - match.settings 가 객체가 아닌 경우 (null / array / primitive) → 빈 객체에서 시작
    //   - timeouts / signatures 키만 set — 기존 recording_mode 등 모든 키 보존
    if (input.timeouts || input.signatures) {
      const currentSettings = match.settings;
      const baseSettings: Record<string, unknown> =
        currentSettings &&
        typeof currentSettings === "object" &&
        !Array.isArray(currentSettings)
          ? { ...(currentSettings as Record<string, unknown>) }
          : {};
      if (input.timeouts) {
        baseSettings.timeouts = {
          home: input.timeouts.home,
          away: input.timeouts.away,
        };
      }
      if (input.signatures) {
        // 빈 문자열 / undefined 키는 통째 제거하지 않음 — 운영자가 명시적으로 빈 값 박제 가능
        // (예: 사용자가 "Scorer" 만 입력하고 나머지 비움 = 그대로 빈 문자열 박제)
        baseSettings.signatures = { ...input.signatures };
      }
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: { settings: baseSettings as object },
      });
    }

    // 6-2) Phase 7-B — lineup 박제 (MatchLineupConfirmed upsert).
    //
    // 이유: 사용자 결재 §2 §3 — Flutter 앱 단일 source. 기록자가 score-sheet 진입 시점에
    //   입력한 라인업을 박제. 향후 팀장 사전 제출 기능 = 같은 모델 upsert → 단일 source.
    //
    // 룰:
    //   - input.lineup 미전송 = upsert skip (기존 데이터 유지)
    //   - 양 팀 (home/away) 각각 upsert (UNIQUE(matchId, teamSide) 가드)
    //   - confirmedById = 기록자 user.id (Flutter 앱과 동일 컬럼 — Flutter 는 팀장 / 웹은 기록자)
    //   - starters / substitutes = string[] → BigInt[] 변환
    //   - 이미 박제된 라인업 있어도 overwrite (재선택 케이스 = 운영자가 명시적으로 수정)
    if (input.lineup) {
      const lineupTeams: Array<{
        teamSide: "home" | "away";
        starters: string[];
        substitutes: string[];
      }> = [
        {
          teamSide: "home",
          starters: input.lineup.home.starters,
          substitutes: input.lineup.home.substitutes,
        },
        {
          teamSide: "away",
          starters: input.lineup.away.starters,
          substitutes: input.lineup.away.substitutes,
        },
      ];
      // 양 팀 병렬 upsert (UNIQUE 가드 → idempotent)
      await Promise.all(
        lineupTeams.map((team) =>
          prisma.matchLineupConfirmed.upsert({
            where: {
              matchId_teamSide: {
                matchId: match.id,
                teamSide: team.teamSide,
              },
            },
            create: {
              matchId: match.id,
              teamSide: team.teamSide,
              starters: team.starters.map((s) => BigInt(s)),
              substitutes: team.substitutes.map((s) => BigInt(s)),
              confirmedById: user.id,
            },
            update: {
              starters: team.starters.map((s) => BigInt(s)),
              substitutes: team.substitutes.map((s) => BigInt(s)),
              confirmedById: user.id,
            },
          })
        )
      );
    }

    // 7) audit 박제 — source = "web-score-sheet"
    // before/after diff 박제 (TRACKED_FIELDS 자동 감지) — recordMatchAudit 헬퍼 직접 사용 X (service 의 update 가 이미 끝났음).
    // 본 turn 은 직접 INSERT — context 에 score-sheet 정보 명시 (input.recorder 등 audit context 활용).
    // 이유: service 내부 update 시점에는 recordMatchAudit 미호출 (sync route 와 동일 동작 보존 — refactor 회귀 0).
    //   BFF 가 별도 박제 = caller 책임 분리 (Phase 1-B-1 reviewer 의 design 선택).
    const pbpCount = playByPlays?.length ?? 0;
    const scoreCount = scoreEvents.length;
    const foulCount = foulEvents.length;
    // Phase 20 — player_stats 박제 카운트 (audit context 박제용)
    const playerStatCount = playerStats?.length ?? 0;
    // Phase 4 — timeouts 박제 카운트 (audit context 박제용)
    const timeoutHomeCount = input.timeouts?.home.length ?? 0;
    const timeoutAwayCount = input.timeouts?.away.length ?? 0;
    const timeoutTotalCount = timeoutHomeCount + timeoutAwayCount;
    // Phase 5 — signatures 박제 키 개수 (몇 개 입력 채웠는지 — 빈 문자열 / undefined 제외)
    const signatureFilledCount = input.signatures
      ? Object.values(input.signatures).filter(
          (v) => typeof v === "string" && v.trim().length > 0
        ).length
      : 0;
    // Phase 7-B — lineup 박제 (양 팀 upsert) 카운트
    const lineupHomeCount = input.lineup
      ? input.lineup.home.starters.length + input.lineup.home.substitutes.length
      : 0;
    const lineupAwayCount = input.lineup
      ? input.lineup.away.starters.length + input.lineup.away.substitutes.length
      : 0;
    // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 입력 카운트 (audit context 박제용).
    //   playerCount = 6 stat 중 1건 이상 박제된 player 수.
    //   eventCount = 6 stat 의 모든 카운트 합 (총 입력 이벤트).
    let stat6PlayerCount = 0;
    let stat6EventCount = 0;
    if (input.player_stats_input) {
      for (const stat of Object.values(input.player_stats_input)) {
        const total = stat.or + stat.dr + stat.a + stat.s + stat.b + stat.to;
        if (total > 0) {
          stat6PlayerCount += 1;
          stat6EventCount += total;
        }
      }
    }
    const auditContext =
      `score-sheet 입력 by ${user.nickname ?? "익명"}` +
      ` / 점수 ${input.home_score}-${input.away_score} / status ${input.status}` +
      (pbpCount > 0
        ? ` / PBP ${pbpCount}건 (score ${scoreCount} / foul ${foulCount})`
        : "") +
      // Phase 20 — player_stats 자동 집계 박제 카운트 (사용자 보고 이미지 46 fix)
      (playerStatCount > 0 ? ` / Stat ${playerStatCount}명` : "") +
      (timeoutTotalCount > 0
        ? ` / TO ${timeoutTotalCount}건 (home ${timeoutHomeCount} / away ${timeoutAwayCount})`
        : "") +
      (signatureFilledCount > 0
        ? ` / Sig ${signatureFilledCount}건`
        : "") +
      (input.lineup
        ? ` / Lineup home ${lineupHomeCount}명 / away ${lineupAwayCount}명`
        : "") +
      // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 박제 카운트 audit
      (stat6PlayerCount > 0
        ? ` / Stat6 ${stat6PlayerCount}명/${stat6EventCount}건`
        : "") +
      (input.recorder ? ` / 기록원 ${input.recorder}` : "") +
      (input.referee_main ? ` / 1심 ${input.referee_main}` : "");

    await prisma.tournament_match_audits
      .create({
        data: {
          matchId: match.id,
          source: "web-score-sheet",
          context: auditContext.slice(0, 255), // VarChar 255 안전 trim
          changes: {
            // service 가 이미 박제한 update 후 결과를 audit 에 다시 박제
            // (정확한 before/after 는 service 가 SELECT 한 시점 — 본 BFF 가 추가 SELECT 회피하기 위해 input 만 기록)
            input: {
              home_score: input.home_score,
              away_score: input.away_score,
              status: input.status,
              quarter_scores: input.quarter_scores,
              running_score_count: scoreCount,
              fouls_count: foulCount,
              // Phase 20 — player_stats 자동 집계 결과 (MatchPlayerStat upsert)
              player_stat_count: playerStatCount,
              // Phase 4 — timeouts 카운트 박제 (settings.timeouts JSON merge 결과)
              timeouts_home_count: timeoutHomeCount,
              timeouts_away_count: timeoutAwayCount,
              // Phase 5 — signatures 박제 키 개수 (settings.signatures JSON merge 결과)
              signatures_filled_count: signatureFilledCount,
              // Phase 7-B — lineup 박제 결과 (MatchLineupConfirmed upsert)
              lineup_home_count: lineupHomeCount,
              lineup_away_count: lineupAwayCount,
              // Phase 19 PR-Stat4 (2026-05-15) — 6 stat 박제 카운트 (사용자 결재 Q3)
              stat6_player_count: stat6PlayerCount,
              stat6_event_count: stat6EventCount,
            },
          } as object,
          changedBy: user.id,
        },
      })
      .catch((err: unknown) => {
        // audit 박제 실패 = 응답 실패로 번지지 않음 (fire-and-forget — Phase 1-A admin_logs 패턴 동일)
        console.error(
          `[score-sheet] audit 박제 실패 matchId=${match.id}:`,
          err
        );
      });

    // 응답 — apiSuccess 가 자동 snake_case 변환 (errors.md 2026-04-17 5회 재발 함정 회피)
    return apiSuccess({
      match_id: match.id.toString(),
      tournament_id: tournament.id,
      status: input.status,
      home_score: input.home_score,
      away_score: input.away_score,
      synced_at: syncResult.data.synced_at,
      post_process_status: syncResult.data.post_process_status,
      play_by_play_count: pbpCount,
      // Phase 20 — player_stats 자동 집계 결과 (MatchPlayerStat upsert)
      player_stat_count: playerStatCount,
      ...(syncResult.data.warnings && { warnings: syncResult.data.warnings }),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[score-sheet] 제출 실패 matchId=${match.id}:`, errMsg, err);
    return apiError("제출 처리 중 오류가 발생했습니다.", 500, "INTERNAL_ERROR");
  }
}
