import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleOAuthLogin } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return Response.json({ error: "No code" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  // 2026-06-29 CSRF 검증: 시작점(/api/auth/login)이 발급한 oauth_state 쿠키 ↔ query state 비교.
  //   불일치/누락 = 위조(CSRF) 요청으로 간주하고 거부.
  const state = req.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;
  // 1회용 삭제(성공 경로): next/headers cookieStore.delete — handleOAuthLogin이 세션 쿠키를
  //   set하는 것과 동일 메커니즘으로 redirect 응답에 주입됨(운영 검증된 경로).
  cookieStore.delete("oauth_state");
  if (!savedState || savedState !== state) {
    // 실패 경로: 반환하는 redirect 응답에 oauth_state 삭제를 명시 부착(redirect+쿠키 Next 함정 방어).
    const res = NextResponse.redirect(`${baseUrl}/login?error=invalid_state`);
    res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
    return res;
  }

  try {
    // 1. 토큰 교환
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/callback/google`,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[Google] Token error:", tokenData);
      return Response.redirect(`${baseUrl}/login?error=google_token`);
    }

    // 2. 유저 정보
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    return handleOAuthLogin({
      provider: "google",
      uid: userData.id,
      email: userData.email || null,
      nickname: userData.name || null,
      profileImage: userData.picture || null,
      phone: null, // 구글은 전화번호 미제공
    });
  } catch (e) {
    console.error("[Google] OAuth error:", e);
    return Response.redirect(`${baseUrl}/login?error=google_fail`);
  }
}
