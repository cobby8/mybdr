/**
 * /api/web/admin/associations/[id]/referees
 *
 * 협회 Referee 사전 등록 (배치) — Phase 6 PR3 협회 마법사 Step 4 (2026-05-15).
 *
 * 왜:
 *   - 협회가 심판/기록원/타이머를 사전 등록 — 매칭 후 user_id 채워지면 활성 심판.
 *   - schema: Referee 모델 user_id NULL 허용 (v3 박제) — 사전 등록 흐름 안전.
 *   - Q7 결재 = 자격번호 검증 0 (1차 미검증 박제, 운영자 책임 입력).
 *   - 배치 등록: 빈 배열 허용 (skip 진행 시 created_count=0).
 *
 * 어떻게:
 *   - getAssociationAdmin() 재사용 — super_admin / association_admin 통과.
 *   - association 존재 확인 (404).
 *   - Zod: referees 배열 (name min 2 필수 + license_number/region/contact/role 선택).
 *   - prisma.referee.createMany — 배치 INSERT (verifiedAt 컬럼 미존재 → match_status="unmatched" 박제).
 *   - 응답: created_count + referees(일부 컬럼) — apiSuccess BigInt → string + snake_case 자동.
 *
 * 응답 (snake_case 자동):
 *   - 200 { created_count: number, referees: [...] }
 *   - 403 FORBIDDEN
 *   - 404 NOT_FOUND (association_id 부재)
 *   - 422 VALIDATION_ERROR (name 누락 등)
 *   - 500 INTERNAL_ERROR
 */

import { z } from "zod";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// 단일 referee 입력 — name 만 필수, 나머지 선택.
// snake_case body 의무 — 프론트 정합 (apiSuccess 응답과 동일 컨벤션).
const RefereeItemSchema = z.object({
  name: z.string().min(2).max(50),
  license_number: z.string().max(50).optional().nullable(),
  region: z.string().max(20).optional().nullable(),
  contact: z.string().max(50).optional().nullable(),
  // role 은 schema Referee.role_type (default "referee"). 운영자가 명시 입력 시만 사용.
  role: z.string().max(20).optional().nullable(),
});

// 배치 schema — referees 배열. 빈 배열 허용 (Step 4 skip 진행 시).
const RefereeBatchSchema = z.object({
  referees: z.array(RefereeItemSchema).max(100), // 1회 100건 상한 (운영 안전)
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1) 인증 — admin-guard 단일 진입점 (super_admin sentinel 자동 통과).
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
    const parsed = RefereeBatchSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }
    const { referees } = parsed.data;

    // 4) Association 존재 확인 — 없으면 404 (createMany 호출 안 함).
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { id: true },
    });
    if (!association) {
      return apiError("협회를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 5) 빈 배열 → skip (DB 작업 0건, 200 응답).
    //    이유: Step 4 옵션이라 운영자가 등록 없이 진행해도 정상 흐름.
    if (referees.length === 0) {
      return apiSuccess({ created_count: 0, referees: [] });
    }

    // 6) createMany 배치 INSERT — verifiedAt 컬럼 미존재 (Referee schema).
    //    1차 미검증 박제 (Q7) — match_status="unmatched" + user_id=null + 검증 플래그 없음.
    //    license_number 선택 / @unique 라 동일값 2건 보내면 P2002 → 500 (운영자가 정정).
    const result = await prisma.referee.createMany({
      data: referees.map((r) => ({
        association_id: associationId,
        registered_name: r.name,
        license_number: r.license_number ?? null,
        region_sido: r.region ?? null,
        registered_phone: r.contact ?? null,
        role_type: r.role ?? "referee",
        match_status: "unmatched", // schema default 와 동일 (명시)
        // user_id 명시 0 — schema 가 NULL 허용 (v3) → 사전 등록 흐름 안전
      })),
      skipDuplicates: true, // license_number @unique 충돌 시 skip (1차 미검증 박제 의도)
    });

    // 7) 생성된 referees 일부 컬럼 다시 조회 — 디버깅 / 사용자 확인 용.
    //    createMany 는 result.count 만 반환 (insert id 없음) → association_id 로 최근 N건 조회.
    //    운영 안전: take = 입력 건수 만큼만 (다른 운영자 동시 작업 시 일부 mismatch 가능 — 디버깅 용 한정).
    const created = await prisma.referee.findMany({
      where: { association_id: associationId },
      orderBy: { created_at: "desc" },
      take: referees.length,
      select: {
        id: true,
        association_id: true,
        registered_name: true,
        license_number: true,
        region_sido: true,
        registered_phone: true,
        role_type: true,
        match_status: true,
      },
    });

    // BigInt → string + snake_case 자동 변환 (apiSuccess).
    return apiSuccess({
      created_count: result.count,
      referees: created,
    });
  } catch {
    return apiError("심판 사전 등록에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
