/**
 * 단체 보관 / 복구 API — Phase E (2026-05-12)
 *
 * 운영자 결재 Q1 적용 — **옵션 A 보존(archived)** 정책:
 *   단체 row 자체를 보존하고 status='archived' 마킹만. 시리즈/대회는 cascade 0 / NULL 분리 X (그대로 유지).
 *   archived 단체는 공개 페이지에서 안내만 노출, 운영자는 복구 가능.
 *
 * 이유 (왜 별도 endpoint):
 *   - 기존 PATCH /api/web/organizations/[id] 는 owner/admin 모두 통과 (요건: 일반 정보 수정).
 *   - archive/복구는 owner 만의 lifecycle 결정 → admin 차단을 명확히 분리.
 *   - 별 audit log 박제 (admin_logs warning) — 강제 변경 이력 추적.
 *
 * 어떻게:
 *   - POST = archive (status='approved' → 'archived'). owner 만 통과.
 *   - DELETE = 복구 (status='archived' → 'approved'). owner 만 통과.
 *   - 양쪽 모두 super_admin 우회 허용 (운영 사고 긴급 fix).
 *   - 시리즈/대회 row 변경 0 (보존 정책).
 *
 * 보안:
 *   - withWebAuth → JWT/세션 필수.
 *   - requireOrganizationOwner → 단체 존재 + owner 검증 → 404/403.
 *   - admin/member/외부인 모두 403.
 */

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  requireOrganizationOwner,
  OrganizationPermissionError,
} from "@/lib/auth/org-permission";
import { adminLog } from "@/lib/admin/log";

/**
 * POST /api/web/organizations/[id]/archive — 단체 보관
 *
 * 흐름:
 *   1) requireOrganizationOwner — owner 또는 super_admin 만 통과
 *   2) 이미 archived 면 409 (멱등 X — 명시적 에러로 사용자 confirm 화면 정합)
 *   3) status 'archived' UPDATE (시리즈/대회 변경 0)
 *   4) admin_logs warning 박제
 */
export const POST = withWebAuth(
  async (
    _req: Request,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext,
  ) => {
    try {
      const { id } = await routeCtx.params;
      const orgId = BigInt(id);

      // owner 검증 — admin/member 도 차단 (Phase E 정책)
      const { organization, via } = await requireOrganizationOwner(
        orgId,
        ctx.userId,
        ctx.session,
      );

      // 이미 archived 면 충돌 — confirm 화면 다시 표시할 수 있도록 409
      if (organization.status === "archived") {
        return apiError("이미 보관된 단체입니다.", 409);
      }

      const previousStatus = organization.status;

      // status 만 변경 — 시리즈/대회 row 변경 0 (보존 정책)
      await prisma.organizations.update({
        where: { id: orgId },
        data: { status: "archived" },
      });

      // 감사 로그 — warning 등급 (사용자 lifecycle 변경)
      await adminLog("organization_archive", "organization", {
        resourceId: orgId,
        targetType: "organization",
        targetId: orgId,
        description: `단체 '${organization.name}' 보관 (via=${via})`,
        previousValues: { status: previousStatus },
        changesMade: { status: "archived" },
        severity: "warning",
      });

      return apiSuccess({
        success: true,
        id: orgId.toString(),
        status: "archived",
      });
    } catch (e) {
      // 권한 검증 실패는 OrganizationPermissionError 로 잡아 status 반영
      if (e instanceof OrganizationPermissionError) {
        return apiError(e.message, e.status);
      }
      // 그 외는 500
      return apiError("단체 보관 중 오류가 발생했습니다.", 500);
    }
  },
);

/**
 * DELETE /api/web/organizations/[id]/archive — 단체 복구 (archived → approved)
 *
 * 흐름:
 *   1) requireOrganizationOwner — owner 또는 super_admin 만 통과
 *   2) archived 가 아니면 409 (사용자 confirm 화면 정합)
 *   3) status 'approved' UPDATE
 *   4) admin_logs warning 박제
 */
export const DELETE = withWebAuth(
  async (
    _req: Request,
    routeCtx: { params: Promise<{ id: string }> },
    ctx: WebAuthContext,
  ) => {
    try {
      const { id } = await routeCtx.params;
      const orgId = BigInt(id);

      const { organization, via } = await requireOrganizationOwner(
        orgId,
        ctx.userId,
        ctx.session,
      );

      // archived 가 아니면 409 — 복구 자체가 의미 없음
      if (organization.status !== "archived") {
        return apiError("보관된 단체가 아닙니다.", 409);
      }

      // 복구 — status='approved' 로 되돌림 (원래 status 보존 X — pending 등 단계 복귀는 별 PR)
      await prisma.organizations.update({
        where: { id: orgId },
        data: { status: "approved" },
      });

      await adminLog("organization_restore", "organization", {
        resourceId: orgId,
        targetType: "organization",
        targetId: orgId,
        description: `단체 '${organization.name}' 복구 (via=${via})`,
        previousValues: { status: "archived" },
        changesMade: { status: "approved" },
        severity: "warning",
      });

      return apiSuccess({
        success: true,
        id: orgId.toString(),
        status: "approved",
      });
    } catch (e) {
      if (e instanceof OrganizationPermissionError) {
        return apiError(e.message, e.status);
      }
      return apiError("단체 복구 중 오류가 발생했습니다.", 500);
    }
  },
);
