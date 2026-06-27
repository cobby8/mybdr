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

// settings JSON 스키마 (group_size / group_count / ranking_format / advance_per_group 검증).
// 본 zod 는 record 형이므로 추가 키 허용 (legacy linkage_pairs / advanceCount 호환).
// 룰 검증은 lib/tournaments/division-formats.ts validateDivisionSettings 위임 (단위 테스트 커버).
// 2026-05-13 — advance_per_group 추가 (조별 본선 진출 팀 수, group_size 이하 강제)
const settingsSchema = z.record(z.string(), z.unknown()).refine(
  (s) => validateDivisionSettings(s) === null,
  {
    message:
      "settings: group_size/group_count = 1~32 정수, ranking_format = round_robin/single_elimination, advance_per_group = 1~group_size 정수",
  },
);

const patchSchema = z.object({
  format: z.enum(ALLOWED_FORMATS).nullable().optional(),
  settings: settingsSchema.optional(),
  // 2026-06-28 연령 자동 채움(A안) — 출생연도·학년 범위 부분 업데이트.
  //   각 필드 nullable+optional → 전달된 키만 반영, 미전달 키는 기존값 유지(아래 data 조립).
  //   null 명시 = 해당 제한 해제(연령부 없는 일반부/대학부로 전환 등).
  birthYearMin: z.number().int().nullable().optional(),
  birthYearMax: z.number().int().nullable().optional(),
  gradeMin: z.number().int().nullable().optional(),
  gradeMax: z.number().int().nullable().optional(),
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

  // 전달된 필드만 update data 에 담아 부분 업데이트(미전달 필드는 기존값 유지).
  const data: {
    format?: string | null;
    settings?: object;
    birthYearMin?: number | null;
    birthYearMax?: number | null;
    gradeMin?: number | null;
    gradeMax?: number | null;
  } = {};
  if (parsed.data.format !== undefined) data.format = parsed.data.format;
  if (parsed.data.settings !== undefined) data.settings = parsed.data.settings;
  // 2026-06-28 연령 4필드 — undefined(미전달)면 건드리지 않고, null/숫자면 그대로 반영.
  if (parsed.data.birthYearMin !== undefined) data.birthYearMin = parsed.data.birthYearMin;
  if (parsed.data.birthYearMax !== undefined) data.birthYearMax = parsed.data.birthYearMax;
  if (parsed.data.gradeMin !== undefined) data.gradeMin = parsed.data.gradeMin;
  if (parsed.data.gradeMax !== undefined) data.gradeMax = parsed.data.gradeMax;

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
      // 연령 4필드 — 응답 노출(패널 낙관적 갱신용).
      birthYearMin: true,
      birthYearMax: true,
      gradeMin: true,
      gradeMax: true,
    },
  });

  return apiSuccess({
    id: updated.id.toString(),
    code: updated.code,
    format: updated.format,
    settings: updated.settings,
    // apiSuccess 가 snake 변환 → 프론트는 birth_year_min/max·grade_min/max 로 읽음.
    birth_year_min: updated.birthYearMin,
    birth_year_max: updated.birthYearMax,
    grade_min: updated.gradeMin,
    grade_max: updated.gradeMax,
  });
}
