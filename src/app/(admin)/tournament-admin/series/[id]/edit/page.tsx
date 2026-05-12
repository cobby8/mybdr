/**
 * /tournament-admin/series/[id]/edit — 시리즈 편집 페이지.
 *
 * 2026-05-12 (Phase C-3) — name/description/is_public/organization_id 변경 폼.
 *
 * 이유:
 *   - 시리즈 PATCH/DELETE API (PR Phase C) 의 운영 셀프서비스 진입점.
 *   - server component 권한 가드 + client form 분리 (signup/tournament-admin 패턴 일치).
 *
 * 권한:
 *   - server component 에서 1차 가드 (organizer + 단체 owner/admin + super_admin).
 *   - 서버 PATCH API 가 한 번 더 검증 (이중 가드).
 */

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { SeriesEditForm } from "./_components/series-edit-form";

export const dynamic = "force-dynamic";

export default async function SeriesEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  // BigInt 변환 안전화 — 잘못된 path → 404
  let seriesIdBig: bigint;
  try {
    seriesIdBig = BigInt(id);
  } catch {
    notFound();
  }

  let sessionUserId: bigint | null;
  try {
    sessionUserId = BigInt(session.sub);
  } catch {
    sessionUserId = null;
  }
  if (sessionUserId === null) redirect("/tournament-admin/series");

  const series = await prisma.tournament_series.findUnique({
    where: { id: seriesIdBig },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      is_public: true,
      organization_id: true,
      organizer_id: true,
    },
  });

  if (!series) notFound();

  // 권한 가드 — organizer + 단체 owner/admin + super_admin (Q2 결재)
  const isSuper = isSuperAdmin(session);
  const isOrganizer = series.organizer_id === sessionUserId;

  let isOrgEditor = false;
  if (!isSuper && !isOrganizer && series.organization_id !== null) {
    const m = await prisma.organization_members.findFirst({
      where: {
        organization_id: series.organization_id,
        user_id: sessionUserId,
        is_active: true,
        role: { in: ["owner", "admin"] },
      },
      select: { id: true },
    });
    isOrgEditor = !!m;
  }

  if (!isSuper && !isOrganizer && !isOrgEditor) {
    redirect(`/tournament-admin/series/${id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href={`/tournament-admin/series/${id}`}
        className="mb-4 inline-block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)]"
      >
        ← 시리즈로 돌아가기
      </Link>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">시리즈 편집</h1>

      <Card>
        <SeriesEditForm
          seriesId={id}
          initialName={series.name}
          initialDescription={series.description ?? ""}
          initialIsPublic={series.is_public ?? true}
          initialOrganizationId={series.organization_id?.toString() ?? ""}
        />
      </Card>
    </div>
  );
}
