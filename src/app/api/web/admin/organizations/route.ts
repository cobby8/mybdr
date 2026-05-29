/**
 * GET /api/web/admin/organizations — 관리자용 단체 목록 조회
 *
 * 쿼리 파라미터:
 * - status: "pending" | "approved" | "rejected" | "" (전체)
 *
 * super_admin 또는 org_admin만 접근 가능
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
import { canManageOrganizations } from "@/lib/auth/org-permission";

export async function GET(req: NextRequest) {
  // 관리자 인증 필수
  const session = await getWebSession();
  if (!session || !canManageOrganizations(session)) {
    return apiError("관리자 권한이 필요합니다", 403, "FORBIDDEN");
  }

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status") || "";

  // 상태 필터 조건 구성
  const where = statusFilter ? { status: statusFilter } : undefined;

  const organizations = await prisma.organizations.findMany({
    where,
    orderBy: [{ status: "asc" }, { created_at: "desc" }], // pending 우선 정렬
    take: 200,
    include: {
      owner: {
        select: { id: true, nickname: true, email: true },
      },
      _count: {
        select: { members: true, series: true },
      },
    },
  });

  const result = organizations.map((org) => ({
    id: org.id.toString(),
    name: org.name,
    slug: org.slug,
    region: org.region,
    status: org.status,
    apply_note: org.apply_note,
    contact_email: org.contact_email,
    // OA1 박제(BO1) — 모달 신청 정보 표시용 추가 컬럼 (OU3 신청 form 동일 컬럼)
    // 조회 전용 노출, schema 변경 없음
    description: org.description,
    website_url: org.website_url,
    rejection_reason: org.rejection_reason,
    owner: {
      id: org.owner.id.toString(),
      nickname: org.owner.nickname || "이름없음",
      email: org.owner.email,
    },
    series_count: org._count.series,
    members_count: org._count.members,
    created_at: org.created_at.toISOString(),
    approved_at: org.approved_at?.toISOString() || null,
  }));

  return apiSuccess({ organizations: result });
}
