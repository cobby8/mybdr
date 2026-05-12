/**
 * 2026-05-12 Phase 3.5 — 종별 진행 방식 단일 PATCH.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { apiSuccess, apiError, unauthorized, forbidden, validationError } from "@/lib/api/response";

// 2026-05-12 Phase 3.5-D — ALLOWED_FORMATS / settings 검증 단일 source of truth.
import { ALLOWED_FORMATS, validateDivisionSettings } from "@/lib/tournaments/division-formats";

// settings JSON 스키마 (group_size / group_count / ranking_format 검증).
// 본 zod 는 record 형이므로 추가 키 허용 (legacy linkage_pairs / advanceCount 호환).
// 룰 검증은 lib/tournaments/division-formats.ts validateDivisionSettings 위임 (단위 테스트 커버).
const settingsSchema = z.record(z.string(), z.unknown()).refine(
  (s) => validateDivisionSettings(s) === null,
  { message: "settings: group_size/group_count = 1~32 정수, ranking_format = round_robin/single_elimination" },
);

const patchSchema = z.object({
  format: z.enum(ALLOWED_FORMATS).nullable().optional(),
  settings: settingsSchema.optional(),
});

export async function PATCH(
  req: NextRequest,
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

  // 본 종별 룰이 해당 대회 소속 확인 (IDOR 차단)
  const existing = await prisma.tournamentDivisionRule.findUnique({
    where: { id: ruleIdBig },
    select: { tournamentId: true },
  });
  if (!existing || existing.tournamentId !== id) {
    return apiError("rule-not-found-or-mismatch", 404);
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const data: { format?: string | null; settings?: object } = {};
  if (parsed.data.format !== undefined) data.format = parsed.data.format;
  if (parsed.data.settings !== undefined) data.settings = parsed.data.settings;

  if (Object.keys(data).length === 0) {
    return apiError("no-changes", 400);
  }

  const updated = await prisma.tournamentDivisionRule.update({
    where: { id: ruleIdBig },
    data,
    select: {
      id: true,
      code: true,
      format: true,
      settings: true,
    },
  });

  return apiSuccess({
    id: updated.id.toString(),
    code: updated.code,
    format: updated.format,
    settings: updated.settings,
  });
}
