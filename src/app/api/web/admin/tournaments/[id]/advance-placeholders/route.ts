/**
 * 2026-05-11 Phase 3-B — 종별 순위전 placeholder 자동 채우기 API.
 *
 * 동작:
 *   - body { divisionCode?: string } 있으면 해당 종만 / 없으면 모든 종 일괄
 *   - standings 계산 → notes 파싱 → homeTeamId/awayTeamId UPDATE
 *
 * 권한:
 *   - canManageTournament (super_admin / organizer / TAM is_active)
 *
 * 사용처:
 *   - 운영자 페이지 "순위전 자동 채우기" 버튼 (수동 trigger)
 *   - 향후 matches PATCH route 통합 (자동 trigger — 별 PR)
 *
 * 응답: apiSuccess() — snake_case 변환
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import {
  advanceDivisionPlaceholders,
  advanceAllDivisions,
} from "@/lib/tournaments/division-advancement";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string }> };

const PostBodySchema = z.object({
  divisionCode: z.string().trim().min(1).max(20).optional(),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  // 1) 권한 검증
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  // 2) body 검증 (optional divisionCode)
  let body: unknown = {};
  try { body = await req.json(); }
  catch { /* body 없어도 OK — 전체 종 일괄 */ }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const { divisionCode } = parsed.data;

  // 3) 실행 (트랜잭션 — standings + placeholder UPDATE 묶음)
  const results = await prisma.$transaction(async (tx) => {
    if (divisionCode) {
      const r = await advanceDivisionPlaceholders(tx, tournamentId, divisionCode);
      return [r];
    }
    return advanceAllDivisions(tx, tournamentId);
  });

  // 4) admin_logs 박제
  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

  await adminLog("tournament.advance_placeholders", "Tournament", {
    resourceId: tournamentId,
    description: `순위전 placeholder 자동 채움 — 종 ${results.length}건 / 매치 update ${totalUpdated} / skip ${totalSkipped} / error ${totalErrors}`,
    changesMade: {
      divisions: results.map((r) => ({
        code: r.divisionCode,
        updated: r.updated,
        skipped: r.skipped,
        errors: r.errors.length,
      })),
    },
    severity: totalErrors > 0 ? "warning" : "info",
  }).catch(() => { /* admin_logs 실패해도 본 작업 영향 0 */ });

  return apiSuccess({
    totalUpdated,
    totalSkipped,
    totalErrors,
    results,
  });
}
