import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * PATCH /api/web/admin/referee-evaluations/[id]/status
 *   심판 평가 상태 전이 엔드포인트(R6-C 신규 모델 RefereeEvaluation 전용).
 *
 * 이유(왜): 평가 리포트는 super 전역 콘솔에서 검토 → 확정/검토필요 표시만 수행.
 *          전역 스코프라 협회 IDOR 불필요, super 가드 1개로 충분.
 *
 * 상태 전이(화이트리스트):
 *   submitted     → confirmed, review_needed
 *   review_needed → confirmed
 *   confirmed     → (변경 없음)
 *
 * 보안: super_admin 만. (전역 콘솔 스코프)
 */

export const dynamic = "force-dynamic";

// Zod4 — 옵션객체 금지. mutation 타깃 = confirmed/review_needed 2종.
const patchSchema = z.object({
  status: z.enum(["confirmed", "review_needed"]),
});

// 전이 화이트리스트(키 = 현재 상태, 값 = 허용 전이).
const TRANSITIONS: Record<string, string[]> = {
  submitted: ["confirmed", "review_needed"],
  review_needed: ["confirmed"],
  confirmed: [],
};

function parseIdParam(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 인증 + super 가드
  const session = await getWebSession();
  if (!session) {
    return apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED");
  }
  if (!isSuperAdmin(session)) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }

  const { id } = await params;
  const evalId = parseIdParam(id);
  if (evalId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  // body 파싱 + Zod 검증
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }
  const { status: nextStatus } = parsed.data;

  try {
    const ev = await prisma.refereeEvaluation.findUnique({
      where: { id: evalId },
      select: { id: true, status: true },
    });
    if (!ev) {
      return apiError("평가를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 동일 상태 전이 거부
    if (ev.status === nextStatus) {
      return apiError("현재 상태와 동일합니다.", 400, "SAME_STATUS");
    }

    // 전이 화이트리스트 검증
    const allowed = TRANSITIONS[ev.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      return apiError(
        `'${ev.status}' → '${nextStatus}' 전이는 허용되지 않습니다.`,
        400,
        "INVALID_TRANSITION"
      );
    }

    const updated = await prisma.refereeEvaluation.update({
      where: { id: evalId },
      data: { status: nextStatus },
      select: { id: true, status: true, updated_at: true },
    });

    return apiSuccess({
      evaluation: updated,
      previous_status: ev.status,
    });
  } catch (error) {
    console.error("[admin/referee-evaluations/[id]/status] PATCH 실패:", error);
    return apiError("상태 변경에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
