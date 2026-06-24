import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AdminTournamentList,
  type AdminTournamentRow,
} from "./_components/admin-tournament-list";

export const dynamic = "force-dynamic";

/**
 * 본인 운영 대회 목록 — /tournament-admin/tournaments
 *
 * 2026-06-24 IA 단순화:
 *   - "대회 운영자 도구" 허브를 제거하고 대회 관리 목록을 진입점으로 고정.
 *   - 생성은 헤더의 단일 "+ 새 대회 만들기" 액션만 유지.
 *   - Prisma 쿼리 / super_admin 분기 / 권한 필터 = 비즈 0 변경.
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
      {/* AdminPageHeader 보존 — 목록 화면의 단일 생성 CTA 만 노출 */}
      <AdminPageHeader
        eyebrow={`ADMIN · 대회 운영${isSuper ? " · SUPER" : ""}`}
        title={headerLabel}
        subtitle={`${isSuper ? "전체" : "내가 운영하는"} 대회를 상태별로 관리합니다.`}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 관리" },
          { label: headerLabel },
        ]}
        actions={
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            className="btn btn--primary"
            style={{ textDecoration: "none" }}
          >
            + 새 대회 만들기
          </Link>
        }
      />

      {/* PR-1C-7: 상태 탭 + 검색 + 카드 list (클라이언트 필터 / 새 fetch ❌) */}
      <AdminTournamentList rows={rows} />
    </div>
  );
}
