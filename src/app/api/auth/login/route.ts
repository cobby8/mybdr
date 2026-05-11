import { NextRequest, NextResponse } from "next/server";
import { getOAuthStartUrl } from "@/lib/auth/oauth";
// 2026-05-12 로그인 redirect 통합 — open redirect 방어 단일 source
import { isValidRedirect } from "@/lib/auth/redirect";

/**
 * OAuth 로그인 시작점.
 *
 * redirect 쿼리 파라미터가 있으면 `bdr_redirect` 쿠키에 저장하여
 * 콜백 (handleOAuthLogin) 에서 로그인 완료 후 해당 경로로 복귀할 수 있게 한다.
 *
 * 2026-05-12: 로컬 isValidRedirect 제거 → `@/lib/auth/redirect` 단일 source 로 통일.
 *   추가 가드: /login / /api/ / 2000자 초과 / protocol-relative URL 모두 차단.
 */
export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as "kakao" | "naver" | "google";
  if (!provider || !["kakao", "naver", "google"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }

  const oauthUrl = getOAuthStartUrl(provider);
  const response = NextResponse.redirect(oauthUrl);

  // redirect 파라미터가 유효하면 쿠키에 저장 (5분 TTL) — OAuth 콜백 이 읽어 복귀 처리.
  const redirectPath = req.nextUrl.searchParams.get("redirect");
  if (isValidRedirect(redirectPath)) {
    response.cookies.set("bdr_redirect", redirectPath, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5분 — OAuth 플로우 완료에 충분한 시간
      path: "/",
    });
  }

  return response;
}
