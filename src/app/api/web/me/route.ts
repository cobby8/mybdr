import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

// 세션 확인 + 프로필 이미지 엔드포인트
export const GET = withWebAuth(async (ctx: WebAuthContext) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: {
      profile_image: true,
      profile_image_url: true,
      // 선호 필터 기본값 판단용: 디비전이 하나라도 설정되어 있으면 preferFilter ON
      preferred_divisions: true,
    },
  }).catch(() => null);

  // preferred_divisions가 비어있지 않으면 선호 필터를 기본 ON으로 설정
  const divisions = (user?.preferred_divisions as string[] | null) ?? [];
  const hasPreferences = divisions.length > 0;

  return apiSuccess({
    id: ctx.session.sub,
    email: ctx.session.email,
    name: ctx.session.name,
    role: ctx.session.role,
    profileImage: user?.profile_image_url || user?.profile_image || null,
    // 선호 설정이 하나라도 있으면 true → preferFilter 기본값으로 사용
    prefer_filter_enabled: hasPreferences,
  });
});
