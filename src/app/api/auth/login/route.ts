import { NextRequest } from "next/server";
import { getOAuthStartUrl } from "@/lib/auth/oauth";

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as "kakao" | "naver" | "google";
  if (!provider || !["kakao", "naver", "google"].includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }
  return Response.redirect(getOAuthStartUrl(provider));
}
