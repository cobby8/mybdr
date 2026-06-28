// ============================================================
// ta/tournaments/page.tsx — 대회 목록 (정본 ta-pages TournamentList 1:1)
//   organizer-scoped(organizer_id OR TournamentAdminMember active). 서버 Prisma
//   직접 READ → 클라(_list)에 표시행 주입. 스칼라 + series.name 만 select →
//   jsonb(settings/divisions/schedule_dates 등) 미접촉(F-2b 함정 원천 회피).
// ============================================================

import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { tournamentStatus, fmtDate } from "../_helpers";
import { TournamentList, type TaTournamentRow } from "./_list";

export const dynamic = "force-dynamic";

export default async function TaTournaments() {
  const session = await getWebSession();
  const userId = session ? BigInt(session.sub) : BigInt(0);
  const isSuper = isSuperAdmin(session);

  const scope = isSuper
    ? {}
    : {
        OR: [
          { organizerId: userId },
          { adminMembers: { some: { userId, isActive: true } } },
        ],
      };

  const tournaments = await prisma.tournament.findMany({
    where: scope,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      city: true,
      district: true,
      venue_name: true,
      venue_address: true,
      teams_count: true,
      organizer: true, // 주최 단체명(BDR-join 확장 텍스트 필드)
      edition_number: true,
      tournament_series: { select: { name: true } },
      users_tournaments_organizer_idTousers: {
        select: { nickname: true, name: true },
      },
    },
  });

  // ── snake → 표시 도메인 단일 매핑 ──
  const rows: TaTournamentRow[] = tournaments.map((t) => {
    const st = tournamentStatus(t.status);
    const orgName =
      t.organizer ||
      t.users_tournaments_organizer_idTousers?.nickname ||
      t.users_tournaments_organizer_idTousers?.name ||
      "주최 미정";
    const seriesName = t.tournament_series?.name ?? null;
    const sub = [seriesName, orgName].filter(Boolean).join(" · ");
    const region = [t.city, t.district].filter(Boolean).join(" ") || "—";
    return {
      id: t.id,
      name: t.name,
      sub, // 정본 "정규대회 · 단체"
      venue: t.venue_name || t.venue_address || "장소 미정",
      region,
      date: fmtDate(t.startDate),
      teams: t.teams_count ?? 0,
      status: st.label,
      statusTone: st.tone,
    };
  });

  return <TournamentList rows={rows} />;
}
