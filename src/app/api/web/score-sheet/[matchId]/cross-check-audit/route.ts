/**
 * 웹 종이 기록지 cross-check audit 박제 BFF.
 *
 * 2026-05-14 — Phase 23 PR5-A 신규 (PR2+PR3 reviewer 후속 권장).
 *
 * 배경:
 *   - score-sheet 매치 재진입 시 다음 mismatch 가 클라이언트에서 발견될 수 있음:
 *       (1) quarter_scores DB JSON  ≠  PBP 합산 결과
 *       (2) localStorage draft.savedAt > match.updatedAt 인데 DB 에 박제값 있음
 *       (3) PBP 0건이지만 quarter_scores 만 있음 (구버전 매치)
 *   - 현재는 클라이언트가 `console.warn` 만 함 → 운영 모니터링 불가
 *   - 본 endpoint = warning 발생 시 서버에 박제 → 운영자가 audit log 로 추적 가능
 *
 * 동작:
 *   1. `requireScoreSheetAccess` — 권한 가드 (recorder/organizer/admin/super)
 *   2. body Zod 검증 (warning_type 3종 + details optional)
 *   3. `tournament_match_audits` INSERT
 *        - source = "web-score-sheet"
 *        - context = "phase23-cross-check:{warning_type}" (VarChar 255 trim)
 *        - changes = { warning_type, details } JSON
 *        - matchId / changedBy = user.id
 *   4. 응답 = { audit_id } (snake_case 자동 변환)
 *
 * 멱등성:
 *   - 본 PR5-A 는 단순 박제만 (1분 가드 옵션 skip — 가이드 §동작 4).
 *   - 같은 매치 + 같은 warning_type 다중 박제 가능 — 운영자가 빈도 추적 시 유리.
 *
 * 실패 시:
 *   - audit INSERT 실패 → 500 (클라이언트 warn 도메인 → 응답 무시 가능)
 *   - score-sheet 진행 흐름 영향 0 (별도 endpoint — submit 과 독립)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { requireScoreSheetAccess } from "@/lib/auth/require-score-sheet-access";
import type { Prisma } from "@prisma/client";

// ============================================================================
// Zod schema — warning_type 5종 (가이드 §Body 스키마 답습)
// ============================================================================
//   - quarter_scores_mismatch: quarter_scores DB JSON ≠ PBP 합산 결과
//   - draft_dom_conflict     : localStorage draft.savedAt > match.updatedAt 인데 DB 에 박제값
//   - pbp_zero_with_quarter  : PBP 0건이지만 quarter_scores 만 있음 (구버전 매치)
//   - completed_edit_entry   : Phase 23 PR4 — status="completed" 매치 score-sheet 진입 시 박제
//   - completed_edit_resubmit: Phase 23 PR4 — status="completed" 매치 score-sheet 재제출 시 박제
//
// Phase 23 PR4 (2026-05-15) — 사용자 결재 Q3 = 차단 ❌ / UI 경고 + audit 박제.
//   운영자가 완료된 매치도 수정/재제출 가능. 본 endpoint 가 진입/재제출 양쪽 추적.
const crossCheckAuditBodySchema = z.object({
  warning_type: z.enum([
    "quarter_scores_mismatch",
    "draft_dom_conflict",
    "pbp_zero_with_quarter",
    "completed_edit_entry",
    "completed_edit_resubmit",
  ]),
  // 상세 정보 (mismatch 의 구체적 값) — 모두 optional (클라이언트가 부분 박제 가능)
  details: z
    .object({
      // quarter_scores DB JSON 등 (구조 자유 — unknown 으로 받음)
      db_value: z.unknown().nullable().optional(),
      // PBP 에서 합산한 값
      pbp_computed: z.unknown().nullable().optional(),
      // ISO string (draft savedAt / match updatedAt)
      draft_saved_at: z.string().nullable().optional(),
      match_updated_at: z.string().nullable().optional(),
      // 추가 컨텍스트 (자유 record)
      extra: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  // 1) matchId 파싱 + 정수 가드
  const { matchId: matchIdParam } = await context.params;
  const matchIdNum = Number(matchIdParam);
  if (!Number.isFinite(matchIdNum) || matchIdNum <= 0) {
    return apiError("잘못된 매치 ID 입니다.", 400, "INVALID_MATCH_ID");
  }

  // 2) 권한 가드 + 매치 SELECT (submit endpoint 와 동일 헬퍼)
  //    이유: 같은 매치 접근 권한이 있는 운영자만 박제 가능 → IDOR 차단.
  //    매치 접근 없는 사용자 → 401 / 403 (헬퍼가 반환)
  const access = await requireScoreSheetAccess(BigInt(matchIdNum));
  if ("error" in access) return access.error;

  const { user, match } = access;

  // 3) body Zod 검증 (잘못된 warning_type → 422)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([{ message: "Invalid JSON body" }]);
  }

  const parsed = crossCheckAuditBodySchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  const input = parsed.data;

  // 4) audit 박제 — recordMatchAudit 헬퍼 미사용 (헬퍼는 TRACKED_FIELDS before/after diff 용)
  //    본 endpoint = warning 박제 (diff 아님) → 직접 INSERT 가 맞음.
  //
  // 박제 룰:
  //   - source = "web-score-sheet" (AuditSource union 답습 — match-audit.ts L26 정의)
  //   - context = "phase23-cross-check:{warning_type}" + nickname (255자 trim)
  //   - changes = { warning_type, details } JSON
  //   - matchId / changedBy = user.id
  try {
    const contextStr =
      `phase23-cross-check:${input.warning_type}` +
      ` by ${user.nickname ?? "익명"}`;

    const audit = await prisma.tournament_match_audits.create({
      data: {
        matchId: match.id,
        source: "web-score-sheet",
        context: contextStr.slice(0, 255), // VarChar 안전 trim (submit endpoint 패턴 동일)
        changes: {
          warning_type: input.warning_type,
          // details 가 undefined 면 빈 객체로 박제 (JSON 일관성)
          details: input.details ?? {},
        } as Prisma.InputJsonValue,
        changedBy: user.id,
      },
      select: { id: true },
    });

    return apiSuccess({
      audit_id: audit.id.toString(), // BigInt → string (apiSuccess 자동 변환되지만 명시)
    });
  } catch (err) {
    // audit 박제 실패 = 500 (운영 모니터링 endpoint — 클라이언트가 무시 가능)
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(
      `[cross-check-audit] 박제 실패 matchId=${match.id}:`,
      errMsg,
      err
    );
    return apiError("audit 박제 중 오류가 발생했습니다.", 500, "INTERNAL_ERROR");
  }
}
