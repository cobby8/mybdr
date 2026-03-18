import { NextRequest } from "next/server";
import { handleOAuthLogin } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return Response.json({ error: "No code" }, { status: 400 });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

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
