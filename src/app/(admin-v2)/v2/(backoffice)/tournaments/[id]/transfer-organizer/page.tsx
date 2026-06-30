// ============================================================
// (admin-v2)/v2/(backoffice)/tournaments/[id]/transfer-organizer/page.tsx — 운영자 관리 (컷오버 포팅)
//   레거시 (admin)/admin/tournaments/[id]/transfer-organizer/page.tsx 를 admin-v2 백오피스로 1:1 포팅.
//   서버 컴포넌트: 권한 가드 + READ(Prisma 직접)만 담당. 추가/변경 UI 는 _transfer-form(클라).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0.
//     mutation 은 클라가 기존 REST(transfer-organizer · admins · eligible-users) 를 raw fetch 로 호출.
//   ⚠ 권한 — /v2 layout 은 tournament_admin 까지 통과시키지만, 운영자 관리는 레거시와 동일
//     super_admin 전용이다. categories/partner-console 과 동일한 페이지 레벨 super 가드 재현(비super redirect).
//   ⚠ 데이터 — 현 주최자 / 위임 운영자(TAM) / 소속 단체 정보는 레거시 Prisma 쿼리 1:1 보존.
// ============================================================

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { PageHead, Btn } from "@/components/admin-v2";
import { TransferOrganizerForm } from "./_transfer-form";

export const dynamic = "force-dynamic";

export default async function AdminV2OrganizerManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ── 페이지 단위 super_admin 방어 가드 (레거시 동일·비super 차단) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/v2");
  }

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

  // 기존 TAM (위임 운영자) 목록 (레거시 쿼리 1:1)
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
      <PageHead
        eyebrow={`대회 관리자 · ${tournament.name}`}
        title="운영자 관리"
        sub={
          orgInfo ? `${tournament.name} · 소속 단체 ${orgInfo.name}` : tournament.name
        }
        actions={
          <a href="/v2/ta/tournaments" style={{ textDecoration: "none" }}>
            <Btn variant="secondary" size="sm" icon="arrow-left">
              대회 관리
            </Btn>
          </a>
        }
      />

      {/* 현 주최자 카드 */}
      <div className="ts-card ts-card--tight" style={{ marginBottom: 16 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--ink-mute)",
          }}
        >
          현 주최자 (organizer)
        </p>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
          {currentOrganizer?.nickname ?? currentOrganizer?.name ?? "(이름 없음)"}{" "}
          {currentOrganizer?.name &&
            currentOrganizer.name !== currentOrganizer.nickname && (
              <span style={{ fontSize: 14, color: "var(--ink-mute)" }}>
                ({currentOrganizer.name})
              </span>
            )}{" "}
          <span style={{ fontSize: 14, color: "var(--ink-mute)" }}>
            · {currentOrganizer?.email ?? "(이메일 없음)"}
          </span>
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-mute)" }}>
          userId: {tournament.organizerId.toString()}
        </p>
      </div>

      {/* 위임 운영자 (TAM) 목록 */}
      <div className="ts-card ts-card--tight" style={{ marginBottom: 24 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--ink-mute)",
          }}
        >
          위임 운영자 ({tamList.length})
        </p>
        {tamList.length === 0 ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-mute)" }}>
            위임 운영자가 없습니다.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {tamList.map((t) => (
              <li
                key={t.id.toString()}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 14, color: "var(--ink)" }}>
                  <span style={{ fontWeight: 600 }}>
                    {t.user?.nickname ?? t.user?.name ?? "(이름 없음)"}
                  </span>
                  {t.user?.name && t.user.name !== t.user.nickname && (
                    <span style={{ marginLeft: 4, fontSize: 12, color: "var(--ink-mute)" }}>
                      ({t.user.name})
                    </span>
                  )}
                  <span style={{ marginLeft: 8, fontSize: 12, color: "var(--ink-mute)" }}>
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

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--ink-mute)" }}>
        ※ 운영자는 소속 단체 가입자 중에서 선택합니다. 주최자 변경 = Tournament.organizerId UPDATE
        (위험 작업). 운영자 추가 = TournamentAdminMember INSERT.
      </p>
    </div>
  );
}
