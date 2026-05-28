import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// PR-1C-7 박제 (A1 AdminTournamentAdminList) — 4 옵션 진입 panel + 상태 탭 + 카드 list
import { AdminEntryCta } from "./_components/admin-entry-cta";
import {
  AdminTournamentList,
  type AdminTournamentRow,
} from "./_components/admin-tournament-list";

export const dynamic = "force-dynamic";

/**
 * 본인 운영 대회 목록 — /tournament-admin/tournaments
 *
 * 2026-05-28 PR-1C-7 (A1 진입점 통합) 박제:
 *   - 단일 hero "+ 새 대회 만들기" Link → 4 옵션 인라인 panel (AdminEntryCta)
 *     · Quick / 단계별 / PDF 요강 / 협회(super_admin) = 운영 실제 라우트 매핑
 *   - <Card> 카드 리스트 → 시안 aen-tabs(상태 탭) + aen-row(카드) (AdminTournamentList)
 *   - Prisma 쿼리 / super_admin 분기 / 데이터 패칭 = 비즈 0 변경 (시각만)
 *
 * 2026-05-15 Admin-7-A 박제 (이전):
 *   - raw <h1> + Link → AdminPageHeader (eyebrow/breadcrumbs/actions)
 */

export default async function TournamentAdminTournamentsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  // 2026-05-11 — 권한 시스템 정리 6번째 super_admin 우회 fix (사용자 결재 4건).
  // - super_admin: 모든 대회 표시 (제한 X)
  // - 일반 운영자: 본인이 organizer 인 대회 OR 위임받은 TAM (is_active) 대회 합산
  const isSuper = isSuperAdmin(session);
  const userId = BigInt(session.sub);

  const tournaments = await prisma.tournament
    .findMany({
      where: isSuper
        ? {}
        : {
            OR: [
              { organizerId: userId },
              { adminMembers: { some: { userId, isActive: true } } },
            ],
          },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  // 클라이언트 컴포넌트 직렬화 — BigInt id / Date 를 string 으로 변환 (새 fetch ❌)
  const rows: AdminTournamentRow[] = tournaments.map((t) => ({
    id: String(t.id),
    name: t.name,
    status: t.status ?? null,
    startDate: t.startDate ? t.startDate.toISOString() : null,
    format: t.format ?? null,
  }));

  // 헤더 라벨 분기 — super_admin 진입 시 "전체 대회" / 일반 "내 대회"
  const headerLabel = isSuper ? "전체 대회" : "내 대회";

  return (
    <div>
      {/* AdminPageHeader 보존 — eyebrow + breadcrumbs (actions 의 단일 CTA 는 hero panel 로 이동) */}
      <AdminPageHeader
        eyebrow={`ADMIN · 대회 운영${isSuper ? " · SUPER" : ""}`}
        title={headerLabel}
        subtitle={`${isSuper ? "전체" : "내가 운영하는"} 대회를 상태별로 관리합니다.`}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 운영자 도구" },
          { label: headerLabel },
        ]}
      />

      {/* PR-1C-7: 단일 hero CTA → 4 옵션 인라인 panel (협회 옵션 = super_admin 전용) */}
      <AdminEntryCta isSuperAdmin={isSuper} />

      {/* PR-1C-7: 상태 탭 + 검색 + 카드 list (클라이언트 필터 / 새 fetch ❌) */}
      <AdminTournamentList rows={rows} />
    </div>
  );
}
