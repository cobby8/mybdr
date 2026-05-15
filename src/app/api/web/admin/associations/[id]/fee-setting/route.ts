/**
 * /api/web/admin/associations/[id]/fee-setting
 *
 * 협회 배정비 단가표 (AssociationFeeSetting) upsert — Phase 6 PR1 협회 마법사 Step 3 (2026-05-15).
 *
 * 왜:
 *   - 협회별 역할별 (주심/부심/기록/타이머) 기본 배정비 박제 — 배정 생성 시 자동 적용.
 *   - schema: AssociationFeeSetting.association_id @unique → 1협회 1행 (upsert).
 *   - Q4 결재 = schema 그대로 4 정수 (시안 grid 형식은 후속 PR / schema 변경 0).
 *
 * 어떻게:
 *   - getAssociationAdmin() 재사용 — super_admin / association_admin 통과.
 *   - association 존재 확인 (404).
 *   - Zod: 4 정수 (>= 0). 음수 거부 → 422.
 *   - prisma.associationFeeSetting.upsert({ where: { association_id } }) — 1행 1협회 룰.
 *
 * 응답 (snake_case 자동):
 *   - 200 { fee_setting: { id, association_id, fee_main, fee_sub, fee_recorder, fee_timer, updated_at } }
 *   - 403 FORBIDDEN
 *   - 404 NOT_FOUND (association_id 부재)
 *   - 422 VALIDATION_ERROR (음수 fee 등)
 *   - 500 INTERNAL_ERROR
 */

import { z } from "zod";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Zod schema — 4 정수 양수 검증.
// schema 그대로 (Q4) — fee_main/sub/recorder/timer 4 필드. 시안 grid 미적용.
// snake_case body — 프론트 정합 (apiSuccess 응답과 동일 컨벤션).
const FeeSettingSchema = z.object({
  main_fee: z.number().int().min(0),
  sub_fee: z.number().int().min(0),
  recorder_fee: z.number().int().min(0),
  timer_fee: z.number().int().min(0),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1) 인증.
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) route param 검증.
    const { id: associationIdStr } = await params;
    let associationId: bigint;
    try {
      associationId = BigInt(associationIdStr);
    } catch {
      return apiError("협회를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 3) Zod body 검증 — 4 정수 음수 거부.
    const body = await req.json().catch(() => null);
    const parsed = FeeSettingSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }
    const { main_fee, sub_fee, recorder_fee, timer_fee } = parsed.data;

    // 4) Association 존재 확인.
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { id: true },
    });
    if (!association) {
      return apiError("협회를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 5) upsert — association_id @unique (1협회 1행 룰).
    //    이유: 사무국장이 단가표 수정 시 항상 동일 row 갱신 — 운영 단순화.
    const feeSetting = await prisma.associationFeeSetting.upsert({
      where: { association_id: associationId },
      create: {
        association_id: associationId,
        fee_main: main_fee,
        fee_sub: sub_fee,
        fee_recorder: recorder_fee,
        fee_timer: timer_fee,
      },
      update: {
        fee_main: main_fee,
        fee_sub: sub_fee,
        fee_recorder: recorder_fee,
        fee_timer: timer_fee,
      },
      select: {
        id: true,
        association_id: true,
        fee_main: true,
        fee_sub: true,
        fee_recorder: true,
        fee_timer: true,
        updated_at: true,
      },
    });

    return apiSuccess({ fee_setting: feeSetting });
  } catch {
    return apiError("단가표를 저장할 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
