/**
 * 웹 종이 기록지 제출 BFF.
 *
 * 2026-05-11 — Phase 1-B-2 신규 (decisions.md [2026-05-11] §1 — sync API 재사용 + BFF wrap).
 *
 * 단계:
 *   1. `requireScoreSheetAccess(matchId)` — 권한 가드 (recorder/organizer/admin/super) + match SELECT
 *   2. `getRecordingMode(match)` — paper 가 아니면 403 RECORDING_MODE_FLUTTER
 *   3. body zod 검증 (422 시 apiError)
 *   4. `syncSingleMatch({ ..., existingMatch: match })` — service 호출 (SELECT 2→1 통합)
 *   5. `tournament_match_audits` 박제 (source = "web-score-sheet")
 *   6. 응답 = `apiSuccess({ match_id, status, home_score, away_score })` (snake_case 자동 변환)
 *
 * 단일 source 보장:
 *   - Flutter sync 와 동일 `syncSingleMatch` 호출 → 라이브/박스스코어/통산/알기자 자동 trigger.
 *   - waitUntil(triggerMatchBriefPublish) — completed 신규 전환 시 자동 발화.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { requireScoreSheetAccess } from "@/lib/auth/require-score-sheet-access";
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
import { syncSingleMatch } from "@/lib/services/match-sync";

// zod schema — 종이 기록지 제출 input
// 이유: Flutter sync API 의 player_stats / play_by_plays 는 본 turn 미지원 (Phase 2 진입).
//   본 PR = 점수 + 쿼터 + status + 비고 + 헤더 입력자(audit context용) 만.
const quarterScoreEntrySchema = z.object({
  q1: z.number().int().min(0).max(199).default(0),
  q2: z.number().int().min(0).max(199).default(0),
  q3: z.number().int().min(0).max(199).default(0),
  q4: z.number().int().min(0).max(199).default(0),
  ot: z.array(z.number().int().min(0).max(199)).max(4).default([]),
});

const submitSchema = z.object({
  home_score: z.number().int().min(0).max(199),
  away_score: z.number().int().min(0).max(199),
  quarter_scores: z.object({
    home: quarterScoreEntrySchema,
    away: quarterScoreEntrySchema,
  }),
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

  // 4) service 호출 — 단일 source (Flutter sync 와 동일 path)
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
      // 본 turn 은 선수 stat / PBP 미지원 (Phase 2 진입)
      player_stats: undefined,
      play_by_plays: undefined,
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

    // 5) notes UPDATE (별도 — service 는 notes 미지원).
    // 사용자가 비고 입력 시 박제. 사용자 입력 빈 문자열 = 기존 값 유지 (overwrite 안 함).
    if (input.notes !== undefined && input.notes.trim().length > 0) {
      await prisma.tournamentMatch.update({
        where: { id: match.id },
        data: { notes: input.notes },
      });
    }

    // 6) audit 박제 — source = "web-score-sheet"
    // before/after diff 박제 (TRACKED_FIELDS 자동 감지) — recordMatchAudit 헬퍼 직접 사용 X (service 의 update 가 이미 끝났음).
    // 본 turn 은 직접 INSERT — context 에 score-sheet 정보 명시 (input.recorder 등 audit context 활용).
    // 이유: service 내부 update 시점에는 recordMatchAudit 미호출 (sync route 와 동일 동작 보존 — refactor 회귀 0).
    //   BFF 가 별도 박제 = caller 책임 분리 (Phase 1-B-1 reviewer 의 design 선택).
    const auditContext =
      `score-sheet 입력 by ${user.nickname ?? "익명"}` +
      ` / 점수 ${input.home_score}-${input.away_score} / status ${input.status}` +
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
      ...(syncResult.data.warnings && { warnings: syncResult.data.warnings }),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[score-sheet] 제출 실패 matchId=${match.id}:`, errMsg, err);
    return apiError("제출 처리 중 오류가 발생했습니다.", 500, "INTERNAL_ERROR");
  }
}
