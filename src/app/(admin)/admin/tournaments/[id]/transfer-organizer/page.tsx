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
import { TransferOrganizerForm } from "./transfer-organizer-form";

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
      <div className="mb-6">
        <Link
          href="/admin/tournaments"
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          ← 대회 관리
        </Link>
        <h1
          className="mt-1 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          운영자 관리
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {tournament.name}
          {orgInfo && (
            <>
              {" · "}
              <span style={{ color: "var(--color-accent)" }}>소속 단체 {orgInfo.name}</span>
            </>
          )}
        </p>
      </div>

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
