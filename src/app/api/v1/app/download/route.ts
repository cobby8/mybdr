import { NextResponse } from "next/server";

/**
 * GET /api/v1/app/download
 * [AUTOUPDATE-D] 비공개 GitHub 릴리스(cobby8/bdr_stat_v3)의 APK 를 중계한다.
 *
 * 왜 프록시인가:
 *   - APK 를 공개 저장소에 올리지 않고 비공개 릴리스에 두기 위해(소스/바이너리 비노출).
 *   - 앱(ota_update)은 다운로드 시 인증 헤더를 보내지 못하므로, 이 엔드포인트는 열려 있되
 *     실제 파일 주소는 서버 토큰으로 받은 ~5분짜리 서명 URL 이라 발견·재사용이 어렵다.
 *   - 75MB 바이너리를 함수로 직접 스트리밍하면 Vercel 한도 초과 → "리다이렉트" 방식 필수.
 *
 * 흐름: (1) 태그로 릴리스 asset 조회 → (2) asset 다운로드 요청 시 GitHub 가 302 로 서명
 *   S3 URL 반환(Location) → (3) 그 URL 로 앱을 302 리다이렉트(ota_update 가 따라가 받음).
 *
 * 필요 env: GH_RELEASE_TOKEN = 비공개 cobby8/bdr_stat_v3 Contents 읽기 권한 PAT.
 * 배포마다: TAG / ASSET_NAME 을 version/route.ts 의 LATEST 와 일치시킨다.
 */

export const runtime = "nodejs"; // fetch redirect:"manual" 사용
export const dynamic = "force-dynamic"; // 서명 URL 은 매번 새로(캐시 금지)

const OWNER = "cobby8";
const REPO = "bdr_stat_v3";
const TAG = "v0.1.7";
const ASSET_NAME = "bdr-0.1.7.apk";

export async function GET() {
  const token = process.env.GH_RELEASE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GH_RELEASE_TOKEN not set" },
      { status: 500 },
    );
  }

  // (1) 태그로 릴리스 조회 → asset 찾기
  const relRes = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!relRes.ok) {
    return NextResponse.json(
      { error: "release lookup failed", status: relRes.status },
      { status: 502 },
    );
  }
  const rel = (await relRes.json()) as { assets?: { name: string; url: string }[] };
  const asset = (rel.assets ?? []).find((a) => a.name === ASSET_NAME);
  if (!asset) {
    return NextResponse.json({ error: "asset not found" }, { status: 404 });
  }

  // (2) asset 다운로드 요청 → GitHub 가 302 로 단기 서명 S3 URL 반환(Location 추출)
  const dlRes = await fetch(asset.url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/octet-stream",
    },
    redirect: "manual",
  });
  const location = dlRes.headers.get("location");
  if (!location) {
    return NextResponse.json(
      { error: "no signed url", status: dlRes.status },
      { status: 502 },
    );
  }

  // (3) 앱을 서명 URL 로 리다이렉트(ota_update 가 따라가 다운로드)
  return NextResponse.redirect(location, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
