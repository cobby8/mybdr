/**
 * 2026-05-12 Phase 3.5-C — 종별 진출 매핑 수동 trigger.
 *
 * 동작:
 *   - division-advancement.ts 의 advanceDivisionPlaceholders 호출
 *   - notes 형식 "A조 N위 vs B조 N위" 박제된 placeholder 매치 → standings 기반 자동 채움
 *   - 링크제 (i3-U9) 동순위전 자동 매핑 시 활용
 *
 * 사용:
 *   - 예선 종료 후 운영자가 divisions 페이지에서 "진출 매핑 실행" 클릭
 *   - 또는 match-sync 자동 trigger (이미 통합됨)
 *
 * 권한: canManageTournament
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { advanceDivisionPlaceholders } from "@/lib/tournaments/division-advancement";
import { apiSuccess, apiError, unauthorized, forbidden } from "@/lib/api/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; ruleId: string }> }
) {
  const { id, ruleId } = await params;
  const session = await getWebSession();
  if (!session) return unauthorized();
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(id, userId, session);
  if (!allowed) return forbidden();

  let ruleIdBig: bigint;
  try {
    ruleIdBig = BigInt(ruleId);
  } catch {
    return apiError("invalid-rule-id", 400);
  }

  const rule = await prisma.tournamentDivisionRule.findUnique({
    where: { id: ruleIdBig },
    select: { tournamentId: true, code: true },
  });
  if (!rule || rule.tournamentId !== id) {
    return apiError("rule-not-found-or-mismatch", 404);
  }

  try {
    const result = await advanceDivisionPlaceholders(prisma, id, rule.code);
    return apiSuccess({
      division_code: result.divisionCode,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      standings: result.standings.map((s) => ({
        tournament_team_id: s.tournamentTeamId,
        team_name: s.teamName,
        group_name: s.groupName,
        wins: s.wins,
        losses: s.losses,
        point_difference: s.pointDifference,
        group_rank: s.groupRank,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[advance-division] failed", { id, code: rule.code, err: msg });
    return apiError(`매핑 실행 실패: ${msg}`, 500);
  }
}
