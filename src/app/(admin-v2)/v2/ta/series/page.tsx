// ============================================================
// ta/series/page.tsx — 정규대회 (정본 ta-pages Series 1:1)
//   ★용어 통일: 코드키 series 유지, 표시는 "정규대회". organizer_id scoped.
//   서버 Prisma 직접 READ → 클라(_series). jsonb(settings) 는 cadence 단일 키만
//   verbatim 참조(재귀 변환 0 · F-2b 함정 회피).
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { fmtDate, avColor } from "../_helpers";
import { SeriesList, type TaSeriesRow } from "./_series";

export const dynamic = "force-dynamic";

export default async function TaSeries() {
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);
  const isSuper = isSuperAdmin(session);

  const series = await prisma.tournament_series.findMany({
    where: isSuper ? {} : { organizer_id: userId },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      status: true,
      tournaments_count: true,
      settings: true,
      organization: { select: { name: true } },
      users: { select: { nickname: true, name: true } },
      // 다음 대회 = 미래 회차 중 가장 이른 1건
      tournaments: {
        where: { startDate: { gte: new Date() } },
        orderBy: { startDate: "asc" },
        take: 1,
        select: { startDate: true },
      },
    },
  });

  const rows: TaSeriesRow[] = series.map((s, i) => {
    // settings jsonb 에서 cadence(주기) 단일 키만 verbatim 참조 — 없으면 미표기.
    const settings = s.settings;
    const cadenceRaw =
      settings && typeof settings === "object" && !Array.isArray(settings)
        ? (settings as Record<string, unknown>).cadence
        : undefined;
    const cadence =
      typeof cadenceRaw === "string" && cadenceRaw ? cadenceRaw : "—";

    return {
      id: s.id.toString(),
      name: s.name,
      org:
        s.organization?.name ||
        s.users?.nickname ||
        s.users?.name ||
        "—",
      cadence,
      editions: s.tournaments_count ?? 0,
      next: s.tournaments[0]?.startDate ? fmtDate(s.tournaments[0].startDate) : "미정",
      active: s.status === "active",
      color: avColor(i),
    };
  });

  return <SeriesList rows={rows} />;
}
