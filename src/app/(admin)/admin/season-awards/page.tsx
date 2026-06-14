import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getDisplayName } from "@/lib/utils/player-display-name";
import {
  upsertSeasonAwardAction,
  deleteSeasonAwardAction,
} from "@/app/actions/admin-season-awards";

import { AdminSeasonAwardsContent } from "./admin-season-awards-content";

export const dynamic = "force-dynamic";

/**
 * 시즌 시상(P1-b) 관리자 입력 — 서버 컴포넌트(데이터 패칭 + super_admin 가드).
 *
 * 왜 독립 페이지:
 *   - 코트 제보(/admin/courts) 동형. 입력 폼 부피가 있어 별도 라우트가 깔끔(PM 결재).
 *   - 승인 큐 없음 — 관리자가 곧 source. series 선택 → 카테고리별 수상자 지정.
 */
export default async function AdminSeasonAwardsPage() {
  // super_admin 가드 (admin layout 은 관리 역할 진입만 허용 → 여기서 super_admin 한정)
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/admin?error=no_permission");
  }

  const [seriesList, awards] = await Promise.all([
    // 시즌 셀렉터 옵션 — tournament_series (active·공개)
    prisma.tournament_series.findMany({
      where: { is_public: true, status: "active" },
      select: { id: true, slug: true, name: true },
      orderBy: { created_at: "desc" },
      take: 30,
    }),
    // 기존 시상 레코드 — 시리즈/카테고리/순서 정렬 + 수상자·팀 include
    prisma.season_awards.findMany({
      orderBy: [{ series_id: "desc" }, { category: "asc" }, { display_order: "asc" }],
      take: 200,
      include: {
        recipient: { select: { id: true, nickname: true, name: true } },
        team: { select: { id: true, name: true } },
        series: { select: { name: true, slug: true } },
      },
    }),
  ]);

  // 직렬화 (BigInt/Date → string, camelCase props)
  const serializedSeries = seriesList.map((s) => ({
    id: s.id.toString(),
    slug: s.slug,
    name: s.name,
  }));

  const serializedAwards = awards.map((a) => {
    // payload(Json) 에서 comment/quote 안전 추출
    const payload = (a.payload ?? {}) as Record<string, unknown>;
    const comment = typeof payload.comment === "string" ? payload.comment : null;
    const quote = typeof payload.quote === "string" ? payload.quote : null;
    return {
      id: a.id.toString(),
      seriesId: a.series_id?.toString() ?? null,
      seriesName: a.series?.name ?? null,
      seasonYear: a.season_year,
      category: a.category,
      userId: a.user_id?.toString() ?? null,
      // 선수명단 실명 표시 규칙 (conventions.md 2026-05-01)
      recipientName: a.recipient ? getDisplayName(a.recipient, undefined, `Player#${a.recipient.id}`) : null,
      teamId: a.team_id?.toString() ?? null,
      teamName: a.team?.name ?? null,
      comment,
      quote,
      displayOrder: a.display_order,
    };
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="ADMIN · 콘텐츠"
        title="시즌 시상"
        subtitle={`전체 ${serializedAwards.length}건`}
        breadcrumbs={[{ label: "ADMIN" }, { label: "콘텐츠" }, { label: "시즌 시상" }]}
      />

      <AdminSeasonAwardsContent
        seriesList={serializedSeries}
        awards={serializedAwards}
        upsertAction={upsertSeasonAwardAction}
        deleteAction={deleteSeasonAwardAction}
      />
    </div>
  );
}
