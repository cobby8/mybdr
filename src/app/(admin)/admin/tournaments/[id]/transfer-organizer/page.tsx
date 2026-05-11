/**
 * 2026-05-12 Phase 4 행정 메뉴 — 대회 운영자 변경 페이지.
 *
 * 진입: /admin/tournaments → 모달 → "운영자 변경"
 * 권한: super_admin
 *
 * 흐름:
 *   1) 현 organizer 정보 표시
 *   2) 신규 organizer 검색 (email / nickname)
 *   3) 선택 → 변경 사유 입력 → submit
 *   4) Tournament.organizerId UPDATE + admin_logs severity=warning 박제
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { TransferOrganizerForm } from "./transfer-organizer-form";

export const dynamic = "force-dynamic";

export default async function TransferOrganizerPage({
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
    },
  });
  if (!tournament) notFound();

  const currentOrganizer = tournament.users_tournaments_organizer_idTousers;

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
          운영자 변경
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {tournament.name}
        </p>
      </div>

      {/* 현 운영자 카드 */}
      <div
        className="mb-6 rounded-[4px] border p-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}
      >
        <p
          className="mb-2 text-xs font-semibold uppercase"
          style={{ color: "var(--color-text-muted)", letterSpacing: "0.04em" }}
        >
          현 운영자
        </p>
        <p className="text-base font-medium">
          {currentOrganizer?.nickname ?? currentOrganizer?.name ?? "(이름 없음)"}{" "}
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            · {currentOrganizer?.email ?? "(이메일 없음)"}
          </span>
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          userId: {tournament.organizerId.toString()}
        </p>
      </div>

      {/* 변경 폼 (client) */}
      <TransferOrganizerForm
        tournamentId={id}
        currentOrganizerId={tournament.organizerId.toString()}
      />

      <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
        ※ 운영자 변경 시 신규 운영자에게 대회 전체 운영 권한이 이관됩니다.
        admin_logs 에 warning 레벨로 박제됩니다.
      </p>
    </div>
  );
}
