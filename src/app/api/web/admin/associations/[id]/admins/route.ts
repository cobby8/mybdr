/**
 * /api/web/admin/associations/[id]/admins
 *
 * AssociationAdmin 지정 — Phase 6 PR1 협회 마법사 Step 2 (2026-05-15).
 *
 * 왜:
 *   - 협회에 사무국장/임원/팀장 등 9 role 사용자를 매핑.
 *   - schema: AssociationAdmin.user_id @unique → 1인 1협회 (중복 시 upsert 로 같은 row 갱신).
 *   - Q3 결재 = 기존 user 선택만 (이메일 invite 미적용).
 *
 * 어떻게:
 *   - getAssociationAdmin() 재사용 — super_admin / association_admin 만 통과.
 *   - association_id (route param) + user_id (body) 모두 존재 확인 (404).
 *   - associationAdmin.upsert({ where: { user_id } }) — 1인 1협회 룰 보존 (다른 협회 소속 시 갱신).
 *   - role 기본 "secretary_general" (schema default) — 본 PR1 spec 따라 user_id 단순 지정.
 *
 * 응답 (snake_case 자동):
 *   - 200 { association_admin: { id, user_id, association_id, role, created_at } }
 *   - 403 FORBIDDEN (비로그인 / 권한 부족)
 *   - 404 NOT_FOUND (association_id / user_id 부재)
 *   - 422 VALIDATION_ERROR
 *   - 500 INTERNAL_ERROR
 */

import { z } from "zod";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// Zod schema — user_id (BigInt 문자열) + role (9 role 중 하나, optional default secretary_general).
// 시안 Step 2 spec 그대로 박제 — schema 변경 0.
const AssignAdminSchema = z.object({
  user_id: z.string().min(1), // BigInt 문자열 (apiSuccess 자동 변환과 정합)
  role: z
    .enum([
      "secretary_general",
      "president",
      "vice_president",
      "director",
      "staff",
      "referee_chief",
      "referee_clerk",
      "game_chief",
      "game_clerk",
    ])
    .optional(),
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

    // 2) route param 검증 — association_id BigInt 변환 안전 처리.
    const { id: associationIdStr } = await params;
    let associationId: bigint;
    try {
      associationId = BigInt(associationIdStr);
    } catch {
      return apiError("협회를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 3) Zod body 검증.
    const body = await req.json().catch(() => null);
    const parsed = AssignAdminSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }
    const { user_id: userIdStr, role } = parsed.data;
    let userId: bigint;
    try {
      userId = BigInt(userIdStr);
    } catch {
      return apiError("사용자를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 4) Association 존재 확인 — 없으면 404.
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { id: true },
    });
    if (!association) {
      return apiError("협회를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 5) User 존재 확인 — 없으면 404 (Q3 = 기존 user 검색만).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return apiError("사용자를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 6) upsert — user_id @unique (1인 1협회 룰). 중복 시 association_id/role 갱신.
    //    이유: 사용자가 다른 협회 사무국장이었다면 본 협회로 이동 (운영자 의도 명시).
    const associationAdmin = await prisma.associationAdmin.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        association_id: associationId,
        role: role ?? "secretary_general",
      },
      update: {
        association_id: associationId,
        // role 명시 시 갱신, 미명시 시 기존 role 보존 (undefined → Prisma skip).
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        user_id: true,
        association_id: true,
        role: true,
        created_at: true,
      },
    });

    // BigInt → string + snake_case 자동 변환.
    return apiSuccess({ association_admin: associationAdmin });
  } catch {
    return apiError("협회 관리자를 지정할 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
