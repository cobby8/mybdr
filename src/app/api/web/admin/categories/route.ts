/**
 * /api/web/admin/categories — 종별 마스터(admin_categories) 목록·생성 (Track B, 관리자 전용)
 *
 * GET  : 종별 전체 목록 (sort_order asc, id asc)
 * POST : 종별 신규 생성 (name 필수 · divisions/ages 빈배열 허용 · sort_order 미지정 시 max+1)
 *
 * 가드: getWebSession + isSuperAdmin → 비통과 403.
 * 검증: Zod (name 필수 trim · divisions/ages string[] 중복 차단 · sort_order Int optional).
 * 중복: name @unique 충돌 → Prisma P2002 try/catch → 409 DUPLICATE_NAME.
 * 감사: adminLog("category.create", "AdminCategory", ...).
 *
 * ⚠ apiSuccess 는 응답 키 자동 snake_case 변환 (errors.md 2026-04-17).
 *   → 프론트 접근자는 snake (c.sort_order). server prisma 는 camel (c.sortOrder).
 * schema 변경 0 / api/v1 미접촉. (모델 AdminCategory 는 커밋 367c1d8 에서 이미 생성)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

// 디비전/연령 태그 배열 — 각 항목 1~40자 trim · 최대 50개 · 중복 차단.
// 빈배열([]) 은 허용 (일반부/대학부 ages=[] 가 정상값).
const TagArr = z
  .array(z.string().trim().min(1).max(40))
  .max(50)
  .refine((arr) => new Set(arr).size === arr.length, {
    message: "중복 항목이 있습니다",
  });

// 생성 스키마: name 필수, divisions/ages/sort_order 옵션(미지정 시 기본값 보정).
const createSchema = z.object({
  name: z.string().trim().min(1).max(80),
  divisions: TagArr.optional(),
  ages: TagArr.optional(),
  sort_order: z.number().int().optional(),
});

// 직렬화: BigInt id → string. divisions/ages 는 Json(string[]) 그대로.
// 키는 apiSuccess 가 snake 로 변환하므로 여기서는 camel 로 둬도 무방하나,
// 명시적으로 응답 형태를 고정하기 위해 camel 객체를 만든다.
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
    sortOrder: c.sortOrder, // apiSuccess → sort_order 로 변환됨
  };
}

export async function GET() {
  // ── super_admin 가드 ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  // ── 목록 조회: sort_order 우선, 동률은 id 오름차순 ──
  const rows = await prisma.adminCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  return apiSuccess({ categories: rows.map(serialize) });
}

export async function POST(req: NextRequest) {
  // ── super_admin 가드 ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    return apiError("super_admin 권한이 필요합니다", 403, "FORBIDDEN");
  }

  // ── Zod 검증 ──
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다", 400, "BAD_REQUEST");
  }
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("요청 값이 올바르지 않습니다", 400, "VALIDATION_ERROR");
  }
  const { name, divisions, ages, sort_order } = parsed.data;

  // ── sort_order 미지정 시 현재 max + 1 (목록 끝에 추가) ──
  let order = sort_order;
  if (order == null) {
    const max = await prisma.adminCategory.aggregate({
      _max: { sortOrder: true },
    });
    order = (max._max.sortOrder ?? -1) + 1;
  }

  // ── 생성: name @unique 충돌은 P2002 로 잡아 409 변환 ──
  try {
    const created = await prisma.adminCategory.create({
      data: {
        name,
        divisions: divisions ?? [], // 미지정 → 빈배열
        ages: ages ?? [],
        sortOrder: order,
      },
    });

    // ── 감사 로그 ──
    await adminLog("category.create", "AdminCategory", {
      resourceId: created.id.toString(),
      description: `종별 생성 '${created.name}'`,
      changesMade: { name, divisions: divisions ?? [], ages: ages ?? [] },
    });

    return apiSuccess(serialize(created), 201);
  } catch (e) {
    // P2002 = unique 제약 위반(name 중복)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return apiError("이미 존재하는 종별 이름입니다", 409, "DUPLICATE_NAME");
    }
    throw e;
  }
}
