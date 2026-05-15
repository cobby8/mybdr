/**
 * 2026-05-15 Phase 7 D — 마법사 KPI endpoint.
 *
 * GET /api/web/admin/analytics/wizard-kpi?from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=daily|weekly|monthly
 *
 * 인증 (이유: 관리자 통계 = 운영 데이터 노출):
 *   - `getAssociationAdmin()` 재사용 — super_admin / recorder_admin sentinel 자동 통과 (admin-guard.ts L138~167).
 *   - association_admin = associationId 가져오지만 본 KPI 는 전역 집계라 associationId 미사용.
 *
 * 응답 (이유: errors.md 5회 사고 박제 — apiSuccess 가 키 자동 snake_case 변환):
 *   - 코드는 camelCase 작성 / 응답 키만 snake_case.
 *
 * default (Q1=최근 30일 / Q2=daily — scratchpad §사용자 결재):
 *   - from = 30일 전 자정 (UTC) / to = 오늘 23:59:59 (UTC) / granularity = "daily"
 */

import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getAssociationAdmin } from "@/lib/auth/admin-guard";
import { computeWizardKpi } from "@/lib/analytics/wizard-kpi";
import { z } from "zod";

export const dynamic = "force-dynamic";

// 쿼리 파라미터 스키마 — zod 가 안전 파싱.
// 이유: 잘못된 날짜 형식 / 미지원 granularity → 422 명확 응답.
const QuerySchema = z.object({
  from: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"))
    .optional(),
  to: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"))
    .optional(),
  granularity: z.enum(["daily", "weekly", "monthly"]).optional(),
});

export async function GET(req: Request) {
  try {
    // 1) 관리자 인증 — 세션 + admin_role / sentinel 분기.
    const admin = await getAssociationAdmin();
    if (!admin) {
      return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
    }

    // 2) 쿼리 파싱 — Zod 안전 검증.
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      from: url.searchParams.get("from") ?? undefined,
      to: url.searchParams.get("to") ?? undefined,
      granularity: url.searchParams.get("granularity") ?? undefined,
    });
    if (!parsed.success) {
      return validationError(parsed.error.issues);
    }

    // 3) default 적용 (Q1=30일 / Q2=daily).
    //   이유: from 파라미터 없을 시 운영 default 응답 — 사용자 호출 편의.
    const now = new Date();
    const to = parsed.data.to
      ? parseDate(parsed.data.to, "to")
      : now;
    const from = parsed.data.from
      ? parseDate(parsed.data.from, "from")
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const granularity = parsed.data.granularity ?? "daily";

    // 4) 범위 검증 — from > to 면 422.
    if (from.getTime() > to.getTime()) {
      return apiError(
        "from 은 to 이전이어야 합니다.",
        422,
        "INVALID_RANGE",
      );
    }

    // 5) KPI 계산 — lib/analytics/wizard-kpi 위임.
    const result = await computeWizardKpi({ from, to, granularity });

    // 6) 응답 — apiSuccess 가 snake_case 자동 변환.
    return apiSuccess(result);
  } catch (e) {
    // 운영 안전: 상세 에러 노출 X (errors.md 광범위 catch 함정 회피 — 명확한 status + code).
    console.error("[wizard-kpi] 집계 실패:", e);
    return apiError("KPI 정보를 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}

/**
 * YYYY-MM-DD 또는 ISO 문자열을 Date 로 변환.
 *  - YYYY-MM-DD 인 경우 to 는 23:59:59 / from 은 00:00:00 UTC 로 정규화 (기간 끝 포함).
 */
function parseDate(value: string, kind: "from" | "to"): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const suffix = kind === "to" ? "T23:59:59.999Z" : "T00:00:00.000Z";
    return new Date(`${value}${suffix}`);
  }
  return new Date(value);
}
