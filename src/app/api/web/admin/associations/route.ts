/**
 * /api/web/admin/associations
 *
 * 협회(Association) 생성 — Phase 6 PR1 협회 마법사 API (2026-05-15).
 *
 * 왜:
 *   - 협회 마법사 Step 1 (협회 본체 생성) 의 백엔드 endpoint.
 *   - super_admin / association_admin 만 호출 가능 (admin-guard 단일 진입점).
 *   - schema 변경 0 — 기존 Association 모델 (name/code/level/region_sido/parent_id) 그대로.
 *
 * 어떻게:
 *   - getAssociationAdmin() 재사용 — super_admin 시 sentinel role 자동 통과 (admin-guard.ts).
 *   - Zod schema (name min 2 / code @unique / level enum / region_sido / parent_id optional) 검증.
 *   - prisma.association.create — code @unique P2002 → 409 + ASSOC_CODE_CONFLICT.
 *   - apiSuccess() = BigInt 자동 toString + snake_case 자동 변환 (errors.md 2026-04-17 5회 사고 함정).
 *
 * 응답 (snake_case 자동):
 *   - 200 { association: { id, name, code, level, region_sido, parent_id, created_at } }
 *   - 403 FORBIDDEN (비로그인 / 일반 사용자)
 *   - 409 ASSOC_CODE_CONFLICT (code @unique 충돌)
 *   - 422 VALIDATION_ERROR (Zod)
 *   - 500 INTERNAL_ERROR
 */

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// 협회 생성 Zod schema — name/code 필수 + level enum 3종 + region_sido/parent_id optional.
// 시안 spec 그대로 박제 — schema 변경 0 (CLAUDE.md DB 정책).
const CreateAssociationSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  level: z.enum(["national", "sido", "pro_league"]),
  region_sido: z.string().min(1).max(20).optional().nullable(),
  parent_id: z.string().optional().nullable(), // BigInt 문자열
  contact: z.string().max(50).optional().nullable(), // 사용자 향후 확장 — schema 에는 미존재 (무시)
  description: z.string().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  try {
    // 1) 인증 — super_admin sentinel 자동 통과 (admin-guard.ts).
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) Zod 검증 — 422 응답 (validationError 단일 헬퍼).
    const body = await req.json().catch(() => null);
    const parsed = CreateAssociationSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }
    const { name, code, level, region_sido, parent_id } = parsed.data;

    // 3) prisma create — code @unique P2002 catch → 409.
    try {
      const association = await prisma.association.create({
        data: {
          name,
          code,
          level,
          region_sido: region_sido ?? null,
          // parent_id 는 BigInt 변환 (Zod 에서 문자열로 받음).
          parent_id: parent_id ? BigInt(parent_id) : null,
        },
        select: {
          id: true,
          name: true,
          code: true,
          level: true,
          region_sido: true,
          parent_id: true,
          created_at: true,
        },
      });

      // apiSuccess → BigInt 자동 toString + snake_case 자동 변환.
      return apiSuccess({ association });
    } catch (err) {
      // Prisma P2002 = unique constraint failed (code @unique).
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return apiError(
          "이미 사용 중인 협회 코드입니다.",
          409,
          "ASSOC_CODE_CONFLICT"
        );
      }
      throw err;
    }
  } catch {
    return apiError("협회를 생성할 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
