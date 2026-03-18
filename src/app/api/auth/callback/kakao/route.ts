import { NextRequest } from "next/server";
import { handleOAuthLogin } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return Response.json({ error: "No code" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  try {
    // 1. 토큰 교환
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET || "",
        redirect_uri: `${baseUrl}/api/auth/callback/kakao`,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[Kakao] Token error:", tokenData);
      return Response.redirect(`${baseUrl}/login?error=kakao_token`);
    }

    // 2. 유저 정보
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    const kakaoAccount = userData.kakao_account || {};
    const profile = kakaoAccount.profile || {};

    return handleOAuthLogin({
      provider: "kakao",
      uid: String(userData.id),
      email: kakaoAccount.email || null,
      nickname: profile.nickname || null,
      profileImage: profile.profile_image_url || null,
      phone: kakaoAccount.phone_number || null,
    });
  } catch (e) {
    console.error("[Kakao] OAuth error:", e);
    return Response.redirect(`${baseUrl}/login?error=kakao_fail`);
  }
}
