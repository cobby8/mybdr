import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import {
  getAssociationAdmin,
  requirePermission,
} from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

/**
 * PATCH /api/web/referee-admin/assignments/[id]  — 배정 수정 (role/status/memo)
 * DELETE /api/web/referee-admin/assignments/[id] — 배정 삭제
 *
 * 이유: 이미 등록된 배정의 역할/상태/메모를 조정하거나, 실수로 등록한 배정을 제거.
 *
 * 보안: requirePermission("assignment_manage") + IDOR(우리 협회 소속 심판 배정만 접근).
 */

export const dynamic = "force-dynamic";

// PATCH body 스키마
const patchSchema = z.object({
  role: z.enum(["main", "sub", "recorder", "timer"]).optional(),
  // 상태 전이: assigned/confirmed/declined/cancelled/completed
  status: z
    .enum(["assigned", "confirmed", "declined", "cancelled", "completed"])
    .optional(),
  memo: z.string().max(500).optional().nullable(),
});

// 공통: 배정 조회 + 협회 소속 검증
async function loadOwnedAssignment(
  assignmentId: bigint,
  associationId: bigint
) {
  const a = await prisma.refereeAssignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      referee: { select: { association_id: true } },
    },
  });
  if (!a) return { error: "not_found" as const };
  if (a.referee.association_id !== associationId) {
    return { error: "forbidden" as const };
  }
  return { ok: true as const, assignment: a };
}

// 공통: params.id를 BigInt로 변환
function parseIdParam(idStr: string): bigint | null {
  try {
    return BigInt(idStr);
  } catch {
    return null;
  }
}

// ── PATCH ──
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id } = await params;
  const assignmentId = parseIdParam(id);
  if (assignmentId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  // IDOR 검증
  const loaded = await loadOwnedAssignment(assignmentId, admin.associationId);
  if (loaded.error === "not_found") {
    return apiError("배정을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (loaded.error === "forbidden") {
    return apiError(
      "다른 협회의 배정은 수정할 수 없습니다.",
      403,
      "FORBIDDEN"
    );
  }

  // body 파싱
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
  const data = parsed.data;

  // 아무 필드도 없으면 변경 없음
  if (
    data.role === undefined &&
    data.status === undefined &&
    data.memo === undefined
  ) {
    return apiError("변경할 내용이 없습니다.", 400, "NO_CHANGES");
  }

  try {
    const updated = await prisma.refereeAssignment.update({
      where: { id: assignmentId },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.memo !== undefined && { memo: data.memo }),
      },
      select: {
        id: true,
        referee_id: true,
        tournament_match_id: true,
        role: true,
        status: true,
        memo: true,
        assigned_at: true,
      },
    });
    return apiSuccess({ assignment: updated });
  } catch (error) {
    console.error("[referee-admin/assignments/[id]] PATCH 실패:", error);
    return apiError("배정 수정에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}

// ── DELETE ──
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAssociationAdmin();
  if (!admin) {
    return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
  }
  const denied = requirePermission(admin.role, "assignment_manage");
  if (denied) return denied;

  const { id } = await params;
  const assignmentId = parseIdParam(id);
  if (assignmentId === null) {
    return apiError("유효하지 않은 ID입니다.", 400, "BAD_REQUEST");
  }

  const loaded = await loadOwnedAssignment(assignmentId, admin.associationId);
  if (loaded.error === "not_found") {
    return apiError("배정을 찾을 수 없습니다.", 404, "NOT_FOUND");
  }
  if (loaded.error === "forbidden") {
    return apiError(
      "다른 협회의 배정은 삭제할 수 없습니다.",
      403,
      "FORBIDDEN"
    );
  }

  try {
    await prisma.refereeAssignment.delete({ where: { id: assignmentId } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("[referee-admin/assignments/[id]] DELETE 실패:", error);
    return apiError("배정 삭제에 실패했습니다.", 500, "INTERNAL_ERROR");
  }
}
