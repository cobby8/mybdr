// ============================================================
// org-console/profile/page.tsx — 단체 정보 (정본 org-pages OrgProfile 1:1)
//   서버 컴포넌트 Prisma 직접 READ(organizations) → 클라(_profile). 저장은 클라에서
//   기존 PATCH /api/web/organizations/[id] 재사용(adminFetch) — 신규 API 0.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import { getOrgContext } from "../_org-data";
import { OrgProfile, type OrgProfileData } from "./_profile";

export const dynamic = "force-dynamic";

export default async function OrgConsoleProfilePage() {
  const ctx = await getOrgContext();

  let org: OrgProfileData | null = null;
  if (ctx?.orgId) {
    const row = await prisma.organizations.findUnique({
      where: { id: ctx.orgId },
      select: {
        id: true,
        name: true,
        description: true,
        region: true,
        contact_email: true,
        contact_phone: true,
        logo_url: true,
        banner_url: true,
        status: true,
        is_public: true,
      },
    });
    if (row) {
      org = {
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        region: row.region,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        logoUrl: row.logo_url,
        bannerUrl: row.banner_url,
        status: row.status,
        isPublic: row.is_public,
      };
    }
  }

  // owner/admin(실 소속)만 저장 가능 — super_admin 미리보기(무소속)는 조회만(기존 PATCH API 가
  // organization_members 소속 검증만 하므로 실 멤버십 없인 저장 실패함 · 백엔드 0변경 원칙상 여기서
  // 방어적으로 편집 버튼을 숨김).
  const canEdit = ctx?.role === "owner" || ctx?.role === "admin";

  return <OrgProfile org={org} canEdit={canEdit} />;
}
