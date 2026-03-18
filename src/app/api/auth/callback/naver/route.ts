import { NextRequest } from "next/server";
import { handleOAuthLogin } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return Response.json({ error: "No code" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  try {
    // 1. 토큰 교환
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        code,
        state: req.nextUrl.searchParams.get("state") || "",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[Naver] Token error:", tokenData);
      return Response.redirect(`${baseUrl}/login?error=naver_token`);
    }

    // 2. 유저 정보
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const r = userData.response || {};

    return handleOAuthLogin({
      provider: "naver",
      uid: r.id,
      email: r.email || null,
      nickname: r.nickname || r.name || null,
      profileImage: r.profile_image || null,
      phone: r.mobile || null,
    });
  } catch (e) {
    console.error("[Naver] OAuth error:", e);
    return Response.redirect(`${baseUrl}/login?error=naver_fail`);
  }
}
