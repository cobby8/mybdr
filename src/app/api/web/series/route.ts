import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { usableSubscriptionWhere } from "@/lib/membership/entitlements";

function generateSlug(name: string): string {
  const ascii = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  const base = ascii || "series";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    const body = await req.json() as Record<string, unknown>;
    const name = (body.name as string)?.trim();
    const description = (body.description as string)?.trim() || null;
    const customSlug = (body.slug as string)?.trim();
    // 단체 소속 시리즈 생성 시 organization_id 연결 (선택적)
    const organizationId = body.organization_id ? BigInt(body.organization_id as string) : null;

    if (!name) {
      return apiError("시리즈 이름은 필수입니다.", 400);
    }

    // 단체 소속 시리즈 생성 시: 해당 단체의 멤버(owner/admin)인지 검증
    if (organizationId) {
      const membership = await prisma.organization_members.findFirst({
        where: {
          organization_id: organizationId,
          user_id: ctx.userId,
          is_active: true,
          role: { in: ["owner", "admin"] }, // owner 또는 admin만 시리즈 생성 가능
        },
      });
      // 슈퍼관리자는 모든 단체에 시리즈 생성 가능
      if (!membership && ctx.session.role !== "super_admin") {
        return apiError("해당 단체의 관리 권한이 없습니다.", 403);
      }
      // 단체가 approved 상태인지 확인
      const org = await prisma.organizations.findUnique({
        where: { id: organizationId },
        select: { status: true },
      });
      if (!org || org.status !== "approved") {
        return apiError("승인된 단체에만 시리즈를 생성할 수 있습니다.", 400);
      }
    }

    // 슈퍼관리자는 구독 체크 우회
    if (ctx.session.role !== "super_admin") {
      const sub = await prisma.user_subscriptions.findFirst({
        where: {
          user_id: ctx.userId,
          feature_key: "tournament_create",
          ...usableSubscriptionWhere(),
        },
      });
      if (!sub) {
        return apiError("UPGRADE_REQUIRED", 402);
      }
    }

    // slug 결정 및 중복 방지
    let slug = customSlug
      ? customSlug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
      : generateSlug(name);

    const existing = await prisma.tournament_series.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 5)}`;
    }

    const series = await prisma.tournament_series.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        slug,
        description,
        organizer_id: ctx.userId,
        organization_id: organizationId,  // nullable: 기존 시리즈 호환
        status: "active",
        is_public: true,
        tournaments_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // 단체 소속이면 series_count 증가
    if (organizationId) {
      await prisma.organizations.update({
        where: { id: organizationId },
        data: { series_count: { increment: 1 } },
      });
    }

    return apiSuccess({
      success: true,
      id: series.id.toString(),
      uuid: series.uuid,
      slug: series.slug,
      name: series.name,
    });
  } catch {
    return apiError("시리즈 생성 중 오류가 발생했습니다.", 500);
  }
});
