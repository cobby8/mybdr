import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// 세션 확인 + 프로필 이미지 엔드포인트
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { profile_image: true, profile_image_url: true },
  }).catch(() => null);

  return apiSuccess({
    id: ctx.session.sub,
    email: ctx.session.email,
    name: ctx.session.name,
    role: ctx.session.role,
    profileImage: user?.profile_image_url || user?.profile_image || null,
  });
});
