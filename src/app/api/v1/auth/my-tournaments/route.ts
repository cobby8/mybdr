import { NextRequest } from "next/server";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { apiSuccess } from "@/lib/api/response";
import { getMyTournaments } from "@/lib/services/tournament";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

// FR-022: 내 토너먼트 목록 API
// 주최자 / admin member / 기록원 / super_admin / recorder_admin 모두 포함
// 2026-05-16 — recorder_admin 전역 기록원 관리자 흡수 (Flutter 기록앱 my-tournaments 모든 대회 노출)
async function handler(_req: NextRequest, ctx: AuthContext) {
  const userId = BigInt(ctx.userId);
  // hasAllAccess = super_admin OR recorder_admin (둘 다 모든 대회 노출)
  const hasAllAccess = isSuperAdmin(ctx.payload) || isRecorderAdmin(ctx.payload);

  const data = await getMyTournaments(userId, hasAllAccess);

  return apiSuccess({ success: true, data });
}

export const GET = withErrorHandler(withAuth(handler));
