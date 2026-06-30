// ============================================================
// (admin-v2)/v2/(backoffice)/partner-console/page.tsx — 협력업체(파트너사) 관리 콘솔 (컷오버 포팅)
//   ⚠ 대상 구분 — 이건 super_admin 이 "파트너사를 승인·관리"하는 콘솔이다.
//     (admin-v2)/partner/* (파트너 본인 포털)과는 완전히 다른 대상 — 그쪽은 건드리지 않는다.
//   레거시 (admin)/admin/partners/page.tsx 를 admin-v2 백오피스로 1:1 포팅.
//   서버 컴포넌트: 권한 가드 + READ(Prisma 직접)만 담당. 목록/상태관리/등록 UI 는 _console(클라).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0.
//     mutation 은 클라가 기존 REST(/api/admin/partners ·[id]) 를 adminFetch 로 호출.
//   ⚠ 권한 — /v2 layout 은 tournament_admin 까지 통과시키지만, 파트너사 관리는 레거시 API 와
//     동일하게 super_admin 전용이다. categories 와 동일한 페이지 레벨 super 가드를 재현(신규 로직 0).
//   ⚠ 직렬화 — server prisma 결과를 camel 로 통일해 클라 타입과 정합(adminFetch 응답도 camel).
// ============================================================

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { PartnerConsole, type PartnerItem } from "./_console";

export const dynamic = "force-dynamic";

export default async function AdminV2PartnerConsolePage() {
  // ── 페이지 단위 super_admin 방어 가드 (레거시 API 가드 동등·기존 헬퍼 재사용) ──
  // /v2 layout 은 tournament_admin 도 통과시키므로, super 가 아니면 백오피스 홈으로 되돌린다.
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/v2");
  }

  // 레거시 GET /api/admin/partners 와 동일 쿼리(전체·최신순·owner·캠페인/멤버 개수).
  // status 필터는 클라 탭에서 처리하므로 여기선 전체를 읽는다(읽기 1회·라운드트립 절감).
  const rows = await prisma.partners
    .findMany({
      orderBy: { created_at: "desc" },
      include: {
        owner: { select: { id: true, nickname: true, email: true } },
        _count: { select: { campaigns: true, members: true } },
      },
    })
    .catch(() => []);

  // 직렬화: BigInt id → string, Date → ISO, snake → camel(클라/adminFetch 응답과 정합).
  const initial: PartnerItem[] = rows.map((p) => ({
    id: p.id.toString(),
    name: p.name,
    logoUrl: p.logo_url,
    websiteUrl: p.website_url,
    contactEmail: p.contact_email,
    status: p.status,
    description: p.description,
    owner: {
      id: p.owner.id.toString(),
      nickname: p.owner.nickname,
      email: p.owner.email,
    },
    campaignsCount: p._count.campaigns,
    membersCount: p._count.members,
    createdAt: p.created_at.toISOString(),
  }));

  return <PartnerConsole partners={initial} />;
}
