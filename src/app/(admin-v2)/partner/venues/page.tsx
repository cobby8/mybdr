// ============================================================
// partner/venues/page.tsx — 내 시설 (정본 partner-pages PT_VENUES 1:1)
//   court_infos(파트너 owner 스코프 = user_id == partners.owner_id) 서버 Prisma 직접 READ.
//   ★백엔드/DB 0변경 · raw fetch 0 · snake → 표시 단일 매핑(jsonb operating_hours verbatim).
//   - 0행/빈상태(scope 없으면 빈 목록) → SchemaList Empty.
//   - "월 예약"/"가동률" = 예약 집계 레이어 미배선(R6-A 범위 외) → "—"(정직). 보고.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import {
  getPartnerContext,
  avColor,
  courtTypeBadge,
  courtStatus,
  fmtOperatingHours,
} from "../_partner-data";
import { VenuesList, type PtVenueRow } from "./_venues";

export const dynamic = "force-dynamic";

export default async function PartnerVenuesPage() {
  const ctx = await getPartnerContext();
  const ownerId = ctx?.ownerId ?? null;

  const courts = ownerId
    ? await prisma.court_infos.findMany({
        where: { user_id: ownerId },
        orderBy: { created_at: "desc" },
        take: 200,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          district: true,
          court_type: true,
          operating_hours: true,
          status: true,
        },
      })
    : [];

  const rows: PtVenueRow[] = courts.map((c, i) => {
    const { label: typeLabel, tone } = courtTypeBadge(c.court_type);
    const { st, sttone } = courtStatus(c.status);
    const region = [c.city, c.district].filter(Boolean).join(" ");
    return {
      id: c.id.toString(),
      name: c.name,
      sub: region || c.address || "—",
      color: avColor(i),
      // badge 셀(type) = r.badge/r.tone 참조
      badge: typeLabel,
      tone,
      // muted/mono 셀 = r[key] 참조
      hours: fmtOperatingHours(c.operating_hours),
      bookings: "—", // 예약 집계 미배선(R6-A 범위 외) — 정직
      rate: "—",
      // status 셀 = r.st/r.sttone 참조
      st,
      sttone,
    };
  });

  return <VenuesList rows={rows} />;
}
