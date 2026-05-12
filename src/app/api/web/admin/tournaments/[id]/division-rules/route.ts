/**
 * 2026-05-12 Phase 3.5 — 종별 진행 방식 (format + settings) 관리 API.
 *
 * 도메인:
 *   - Tournament.format = 단일 enum (대회 전체 1 진행 방식 가정).
 *   - 강남구협회장배 = 6 종별 × 다른 진행 방식 (i3-U9 링크제 / i2-U11 듀얼 / 등)
 *   - TournamentDivisionRule.format 컬럼 (Phase 3.5 신설) → 종별 단위 박제.
 *
 * 엔드포인트:
 *   GET  /api/web/admin/tournaments/[id]/division-rules
 *        → 종별 룰 목록 + format + settings
 *
 *   PATCH /api/web/admin/tournaments/[id]/division-rules/[ruleId]
 *        body: { format?, settings?, groupCount?, ... }
 *        → 단일 종별 룰 UPDATE
 *
 * 권한: canManageTournament (super_admin / organizer / TAM / 단체 admin).
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { apiSuccess, unauthorized, forbidden } from "@/lib/api/response";
// 2026-05-12 Phase 3.5-D — ALLOWED_FORMATS 단일 source of truth (lib/tournaments/division-formats.ts).
import { ALLOWED_FORMATS } from "@/lib/tournaments/division-formats";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) return unauthorized();
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(id, userId, session);
  if (!allowed) return forbidden();

  const rules = await prisma.tournamentDivisionRule.findMany({
    where: { tournamentId: id },
    orderBy: { sortOrder: "asc" },
  });

  return apiSuccess({
    rules: rules.map((r) => ({
      id: r.id.toString(),
      code: r.code,
      label: r.label,
      grade_min: r.gradeMin,
      grade_max: r.gradeMax,
      fee_krw: r.feeKrw,
      sort_order: r.sortOrder,
      format: r.format,
      settings: r.settings,
    })),
    allowed_formats: ALLOWED_FORMATS,
  });
}
