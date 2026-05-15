/**
 * 2026-05-12 — 운영자 관리 페이지 (사이트 관리자 / super_admin).
 *
 * 변경 (사용자 요청):
 *   - 이름: "운영자 변경" → "운영자 관리" (추가/변경 통합)
 *   - 검색 범위: 전체 user → 소속 단체 멤버만 (organization_members 한정)
 *   - placeholder: "snukobe@gmail.com" → 안내 텍스트
 *   - "운영자 추가" 기능 추가 (기존 변경에 더해 TAM INSERT)
 *
 * 진입: /admin/tournaments → 모달 → "운영자 관리"
 * 권한: super_admin
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TransferOrganizerForm } from "./transfer-organizer-form";

// 2026-05-15 Admin-4-A 박제 (v2.14):
// - h1 직접 → <AdminPageHeader> (eyebrow + breadcrumbs + actions) 시안 패턴
// - 현 주최자 / 위임 운영자 카드 = "읽기 전용" admin-stat-pill 보조
// - 비즈 로직 (Prisma tournament / TournamentAdminMember 조회) 100% 보존
// - TransferOrganizerForm 자체는 미박제 — 이미 신 토큰 (--color-*) 사용 중

export const dynamic = "force-dynamic";

export default async function OrganizerManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");
  if (!isSuperAdmin(session)) notFound();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      organizerId: true,
      users_tournaments_organizer_idTousers: {
        select: { id: true, nickname: true, email: true, name: true },
      },
      tournament_series: {
        select: {
          organization_id: true,
          organization: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!tournament) notFound();

  const currentOrganizer = tournament.users_tournaments_organizer_idTousers;

  // 기존 TAM (위임 운영자) 목록
  const tamList = await prisma.tournamentAdminMember.findMany({
    where: { tournamentId: id, isActive: true },
    include: {
      user: { select: { id: true, nickname: true, email: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const orgInfo = tournament.tournament_series?.organization
    ? {
        id: tournament.tournament_series.organization.id.toString(),
        name: tournament.tournament_series.organization.name,
      }
    : null;

  return (
    <div>
      {/* Admin-4-A 박제 — AdminPageHeader 시안 패턴 (eyebrow + breadcrumbs) */}
      <AdminPageHeader
        eyebrow={`ADMIN · 대회 관리 > ${tournament.name} > 운영자 관리`}
        title="운영자 관리"
        subtitle={
          orgInfo
            ? `${tournament.name} · 소속 단체 ${orgInfo.name}`
            : tournament.name
        }
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 관리" },
          { label: tournament.name },
          { label: "운영자 관리" },
        ]}
        actions={
          <Link href="/admin/tournaments" className="btn btn--sm">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            대회 관리
          </Link>
        }
      />

      {/* 현 주최자 카드 */}
      <div
        className="mb-4 rounded-[4px] border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
        >
          현 주최자 (organizer)
        </p>
        <p className="text-base font-medium">
          {currentOrganizer?.nickname ?? currentOrganizer?.name ?? "(이름 없음)"}{" "}
          {currentOrganizer?.name && currentOrganizer.name !== currentOrganizer.nickname && (
            <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              ({currentOrganizer.name})
            </span>
          )}{" "}
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            · {currentOrganizer?.email ?? "(이메일 없음)"}
          </span>
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          userId: {tournament.organizerId.toString()}
        </p>
      </div>

      {/* 위임 운영자 (TAM) 목록 */}
      <div
        className="mb-6 rounded-[4px] border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
        >
          위임 운영자 ({tamList.length})
        </p>
        {tamList.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            위임 운영자가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {tamList.map((t) => (
              <li
                key={t.id.toString()}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] border p-2"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {t.user?.nickname ?? t.user?.name ?? "(이름 없음)"}
                  </span>
                  {t.user?.name && t.user.name !== t.user.nickname && (
                    <span className="ml-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      ({t.user.name})
                    </span>
                  )}
                  <span className="ml-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    · {t.user?.email ?? "-"} · userId {t.userId.toString()} · role={t.role}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 운영자 관리 폼 (추가/변경 통합) */}
      <TransferOrganizerForm
        tournamentId={id}
        currentOrganizerId={tournament.organizerId.toString()}
        organizationName={orgInfo?.name ?? null}
        hasOrganization={!!orgInfo}
      />

      <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        ※ 운영자는 소속 단체 가입자 중에서 선택합니다.
        주최자 변경 = Tournament.organizerId UPDATE (warning 박제).
        운영자 추가 = TournamentAdminMember INSERT (info 박제).
      </p>
    </div>
  );
}
