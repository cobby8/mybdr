/**
 * GET /api/web/admin/tournaments/previous
 *
 * 새 대회 생성 마법사의 "이전 대회 불러오기" 후보 목록.
 * 운영 경로에 mock 대회를 노출하지 않기 위해 실제 관리 권한이 있는 대회만 읽는다.
 */

import { NextResponse } from "next/server";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value && typeof value === "object" && "toString" in value) {
    const n = Number(String(value));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const GET = withWebAuth(async (_req: Request, ctx: WebAuthContext) => {
  try {
    const where = isSuperAdmin(ctx.session)
      ? {}
      : {
          OR: [
            { organizerId: ctx.userId },
            { adminMembers: { some: { userId: ctx.userId, isActive: true } } },
          ],
        };

    const tournaments = await prisma.tournament.findMany({
      where,
      take: 30,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        status: true,
        format: true,
        startDate: true,
        endDate: true,
        organizer: true,
        host: true,
        sponsors: true,
        logo_url: true,
        banner_url: true,
        venue_name: true,
        venue_address: true,
        city: true,
        places: true,
        schedule_dates: true,
        categories: true,
        div_caps: true,
        div_fees: true,
        entry_fee: true,
        game_rules: true,
        settings: true,
        series_id: true,
        edition_number: true,
        divisionRules: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            code: true,
            label: true,
            feeKrw: true,
            sortOrder: true,
            format: true,
            settings: true,
          },
        },
      },
    });

    const data = tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status ?? "draft",
      format: t.format ?? null,
      startDate: t.startDate?.toISOString() ?? null,
      endDate: t.endDate?.toISOString() ?? null,
      organizer: t.organizer ?? "",
      host: t.host ?? "",
      sponsors: t.sponsors ?? "",
      poster: t.logo_url ?? t.banner_url ?? "",
      venueName: t.venue_name ?? "",
      venueAddress: t.venue_address ?? "",
      city: t.city ?? "",
      places: t.places ?? [],
      scheduleDates: t.schedule_dates ?? [],
      categories: t.categories ?? {},
      divCaps: t.div_caps ?? {},
      divFees: t.div_fees ?? {},
      entryFee: toNumber(t.entry_fee),
      gameRules: t.game_rules ?? {},
      settings: t.settings ?? {},
      seriesId: t.series_id?.toString() ?? null,
      editionNumber: t.edition_number ?? null,
      divisionRules: t.divisionRules.map((r) => ({
        id: r.id.toString(),
        code: r.code,
        label: r.label,
        feeKrw: r.feeKrw,
        sortOrder: r.sortOrder,
        format: r.format ?? null,
        settings: r.settings ?? {},
      })),
    }));

    // apiSuccess()는 JSON 내부 키까지 snake_case로 바꾸므로 gameRules/settings 보존을 위해 직접 반환한다.
    return NextResponse.json({ data });
  } catch {
    return apiError("이전 대회 목록 조회 중 오류가 발생했습니다.", 500);
  }
});
