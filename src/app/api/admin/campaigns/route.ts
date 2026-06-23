import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * Admin 캠페인 관리 API
 * GET /api/admin/campaigns — 전체 캠페인 목록
 * POST /api/admin/campaigns — 관리자 캠페인 생성
 */

async function requireAdmin() {
  const session = await getWebSession();
  if (!session || session.role !== "super_admin") return null;
  return session;
}

// 캠페인 목록 조회 (status 필터 지원)
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const campaigns = await prisma.ad_campaigns.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: "desc" },
    include: {
      partner: { select: { id: true, name: true, logo_url: true } },
      _count: { select: { placements: true } },
    },
  });

  return apiSuccess(
    campaigns.map((c) => ({
      id: c.id.toString(),
      uuid: c.uuid,
      partner_id: c.partner_id.toString(),
      partner_name: c.partner.name,
      partner_logo: c.partner.logo_url,
      title: c.title,
      headline: c.headline,
      description: c.description,
      image_url: c.image_url,
      link_url: c.link_url,
      cta_text: c.cta_text,
      status: c.status,
      start_date: c.start_date,
      end_date: c.end_date,
      impressions: c.impressions,
      clicks: c.clicks,
      placements_count: c._count.placements,
      created_at: c.created_at,
    }))
  );
}

function parseBigIntId(value: unknown): bigint | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return /^\d+$/.test(text) ? BigInt(text) : null;
}

function cleanText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanDate(value: unknown): Date | null {
  const text = cleanText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

// 관리자 캠페인 생성 — 기존 ad_campaigns/ad_placements 모델만 사용한다.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("잘못된 요청입니다.", 400);
  }

  const partnerId = parseBigIntId((body as Record<string, unknown>).partner_id);
  const title = cleanText((body as Record<string, unknown>).title);
  const headline = cleanText((body as Record<string, unknown>).headline);
  const linkUrl = cleanText((body as Record<string, unknown>).link_url);

  if (!partnerId || !title || !headline || !linkUrl) {
    return apiError("partner_id, title, headline, link_url은 필수입니다.", 400);
  }

  const partner = await prisma.partners.findUnique({
    where: { id: partnerId },
    select: { id: true, status: true },
  });
  if (!partner) return apiError("파트너를 찾을 수 없습니다.", 404);
  if (partner.status !== "approved") {
    return apiError("승인된 파트너만 캠페인을 생성할 수 있습니다.", 400);
  }

  const allowedPlacements = new Set(["feed", "sidebar", "court_top", "list"]);
  const placements = Array.isArray((body as Record<string, unknown>).placements)
    ? ((body as Record<string, unknown>).placements as unknown[])
        .map((item) => String(item))
        .filter((item) => allowedPlacements.has(item))
    : [];

  const status = cleanText((body as Record<string, unknown>).status) ?? "pending";
  const allowedStatuses = new Set(["draft", "pending", "approved"]);
  const campaign = await prisma.ad_campaigns.create({
    data: {
      partner_id: partner.id,
      title,
      headline,
      description: cleanText((body as Record<string, unknown>).description),
      image_url: cleanText((body as Record<string, unknown>).image_url),
      link_url: linkUrl,
      cta_text: cleanText((body as Record<string, unknown>).cta_text) ?? "자세히 보기",
      status: allowedStatuses.has(status) ? status : "pending",
      start_date: cleanDate((body as Record<string, unknown>).start_date),
      end_date: cleanDate((body as Record<string, unknown>).end_date),
      placements:
        placements.length > 0
          ? {
              create: placements.map((placement, index) => ({
                placement,
                priority: placements.length - index,
                is_active: true,
              })),
            }
          : undefined,
    },
    include: { _count: { select: { placements: true } } },
  });

  return apiSuccess(
    {
      id: campaign.id.toString(),
      uuid: campaign.uuid,
      status: campaign.status,
      placements_count: campaign._count.placements,
    },
    201
  );
}
