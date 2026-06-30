// ============================================================
// (admin-v2)/v2/(backoffice)/season-awards/page.tsx — 시즌 시상 콘솔 (컷오버 포팅)
//   레거시 (admin)/admin/season-awards/page.tsx + admin-season-awards-content.tsx 를
//   admin-v2 백오피스로 1:1 포팅. 서버 컴포넌트: super_admin 가드 + READ(Prisma 직접).
//
//   ⚠ 백엔드 0변경 — route/Prisma/스키마/server action 수정 0. 신규 API 0.
//     mutation 은 기존 server action 을 그대로 재사용(props 로 클라에 전달):
//       · upsertSeasonAwardAction / deleteSeasonAwardAction (src/app/actions/admin-season-awards.ts)
//     선수 검색 autocomplete = 기존 GET /api/web/admin/users/search (클라 호출).
//   ⚠ 권한 — 레거시 page.tsx 의 super_admin 가드 그대로 재현(/v2 layout 은 tournament_admin 통과).
//   ⚠ 직렬화 — 레거시 page.tsx 매핑 1:1(BigInt/Date → string, camel props).
// ============================================================

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { getDisplayName } from "@/lib/utils/player-display-name";
import {
  upsertSeasonAwardAction,
  deleteSeasonAwardAction,
} from "@/app/actions/admin-season-awards";

import { SeasonAwardsConsole } from "./_console";

export const dynamic = "force-dynamic";

export default async function AdminV2SeasonAwardsPage() {
  // ── 페이지 단위 super_admin 가드 (레거시 동일·기존 헬퍼 재사용) ──
  const session = await getWebSession();
  if (!isSuperAdmin(session)) {
    redirect("/v2");
  }

  // 레거시 page.tsx 와 동일 쿼리 — 시리즈 옵션 + 기존 시상 목록.
  const [seriesList, awards] = await Promise.all([
    prisma.tournament_series.findMany({
      where: { is_public: true, status: "active" },
      select: { id: true, slug: true, name: true },
      orderBy: { created_at: "desc" },
      take: 30,
    }),
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

  // 직렬화 (레거시 매핑 1:1)
  const serializedSeries = seriesList.map((s) => ({
    id: s.id.toString(),
    slug: s.slug,
    name: s.name,
  }));

  const serializedAwards = awards.map((a) => {
    // payload(Json) 에서 comment/quote 안전 추출 (레거시 동일)
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
    <SeasonAwardsConsole
      seriesList={serializedSeries}
      awards={serializedAwards}
      upsertAction={upsertSeasonAwardAction}
      deleteAction={deleteSeasonAwardAction}
    />
  );
}
