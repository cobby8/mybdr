/**
 * /api/web/admin/categories/[id] — 종별 마스터 부분수정·삭제 (Track B, 관리자 전용)
 *
 * PATCH  : name/divisions/ages/sort_order 부분 수정 (최소 1키 필요)
 * DELETE : 하드 삭제 (FK 참조 0건 — 대회는 category 를 문자열명으로만 보유, §0)
 *
 * 가드: getWebSession + isSuperAdmin → 비통과 403.
 * 검증: Zod (부분 수정 — 전부 optional + 최소 1키 refine).
 * 중복: name @unique 충돌 → P2002 try/catch → 409 DUPLICATE_NAME.
 * 부재: 대상 없으면 → P2025 try/catch → 404 NOT_FOUND.
 * 감사: adminLog("category.update" / "category.delete", "AdminCategory", ...).
 *
 * ⚠ apiSuccess 응답 키 자동 snake_case 변환 (errors.md 2026-04-17).
 * schema 변경 0 / api/v1 미접촉. (mybdr 표준 부분수정 = PATCH 채택)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

type RouteCtx = { params: Promise<{ id: string }> };

// 디비전/연령 태그 배열 — route.ts 와 동일 규칙 (각 1~40자 · 최대 50 · 중복 차단 · 빈배열 허용).
const TagArr = z
  .array(z.string().trim().min(1).max(40))
  .max(50)
  .refine((arr) => new Set(arr).size === arr.length, {
    message: "중복 항목이 있습니다",
  });

// 부분 수정 스키마: 전부 optional. 단, 최소 1키는 있어야 의미가 있으므로 refine 으로 강제.
const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    divisions: TagArr.optional(),
    ages: TagArr.optional(),
    sort_order: z.number().int().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "수정할 필드가 없습니다",
  });

function serialize(c: {
  id: bigint;
  name: string;
  divisions: unknown;
  ages: unknown;
  sortOrder: number;
}) {
  return {
    id: c.id.toString(),
    name: c.name,
    divisions: c.divisions,
    ages: c.ages,
    sortOrder: c.sortOrder, // apiSuccess → sort_order
  };
}

// BigInt 변환 가드 — 숫자 아닌 id 는 즉시 400.
function parseId(id: string): bigint | null {
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 가드 ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const categoryId = parseId(id);
  if (categoryId == null) {
    return apiError("잘못된 ID 입니다", 400, "BAD_REQUEST");
  }

  // ── Zod 검증 ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
  }
  const { name, divisions, ages, sort_order } = parsed.data;

  // ── 부분 수정 data 구성 (undefined 키는 제외 → 미전송 필드 보존) ──
  const data: Prisma.AdminCategoryUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (divisions !== undefined) data.divisions = divisions;
  if (ages !== undefined) data.ages = ages;
  if (sort_order !== undefined) data.sortOrder = sort_order;

  try {
    const updated = await prisma.adminCategory.update({
      where: { id: categoryId },
      data,
    });

    await adminLog("category.update", "AdminCategory", {
      resourceId: updated.id.toString(),
      description: `종별 수정 '${updated.name}'`,
      changesMade: parsed.data,
    });

    return apiSuccess(serialize(updated));
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002 = name 중복, P2025 = 대상 미존재
      if (e.code === "P2002") {
        return apiError("이미 존재하는 종별 이름입니다", 409, "DUPLICATE_NAME");
      }
      if (e.code === "P2025") {
        return apiError("존재하지 않는 종별입니다", 404, "NOT_FOUND");
      }
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteCtx) {
  // ── super_admin 가드 ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const categoryId = parseId(id);
  if (categoryId == null) {
    return apiError("잘못된 ID 입니다", 400, "BAD_REQUEST");
  }

  try {
    // 하드 삭제 — FK 참조 0건 (대회는 category 문자열명만 보유, §0). 고아 문자열 무해.
    const deleted = await prisma.adminCategory.delete({
      where: { id: categoryId },
    });

    await adminLog("category.delete", "AdminCategory", {
      resourceId: deleted.id.toString(),
      description: `종별 삭제 '${deleted.name}'`,
      severity: "warning", // 마스터 데이터 삭제 — 경고 등급
      previousValues: {
        name: deleted.name,
        divisions: deleted.divisions,
        ages: deleted.ages,
      },
    });

    return apiSuccess({ id: deleted.id.toString() });
  } catch (e) {
    // P2025 = 대상 미존재
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return apiError("존재하지 않는 종별입니다", 404, "NOT_FOUND");
    }
    throw e;
  }
}
