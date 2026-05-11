/**
 * Next.js Middleware — minimal scope.
 *
 * 2026-05-12 신규 — 로그인 redirect 흐름 통합 fix.
 *
 * 왜 (이유):
 *   - Next.js App Router 의 server layout 은 현재 pathname 을 props 로 못 받음.
 *   - admin / tournament-admin layout 이 미로그인 사용자를 `/login` 으로 보낼 때
 *     현재 경로를 알아야 `?redirect=...` 쿼리로 담아 전달 가능.
 *   - 헤더에 `x-pathname` 을 주입하면 layout 이 `headers().get("x-pathname")` 으로 읽어 사용.
 *
 * 방법 (어떻게):
 *   - matcher 로 `/admin/*` 과 `/tournament-admin/*` 만 매칭 — 다른 라우트 영향 0.
 *   - Flutter v1 (`/api/v1/*`) / 일반 웹 (`/games`, `/teams` 등) 영향 0 (matcher 제외).
 *   - 헤더 주입만 하고 NextResponse.next() 통과 — 로직 / 인증 / 리라이트 0.
 *
 * 보안:
 *   - 헤더 주입은 클라이언트 → 서버 단방향. 사용자 조작 불가능 (Next.js 내부 처리).
 *   - 외부 요청이 `x-pathname` 헤더를 보내도 middleware 가 덮어쓰므로 신뢰 가능.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // 사용자 조작 방지 — request 헤더에 x-pathname 을 명시 set (덮어쓰기)
  // layout 의 headers() 에서 이 값을 읽어 buildLoginRedirect 호출.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);
  // 쿼리스트링도 전달 — 예: `/tournament-admin/wizard?step=2` 같은 경우 보존
  if (req.nextUrl.search) {
    requestHeaders.set("x-search", req.nextUrl.search);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

/**
 * matcher — 본 middleware 가 실행될 경로.
 *
 * 포함:
 *   - `/admin` + `/admin/<...>`     (admin layout 가드)
 *   - `/tournament-admin` + `/tournament-admin/<...>`  (tournament-admin layout 가드)
 *
 * 제외 (matcher 가 아예 매칭 안 함 — 성능 영향 0):
 *   - `/api/*` — Flutter v1 + 웹 API
 *   - `/_next/*` — Next.js 정적 / RSC
 *   - 일반 페이지 (`/`, `/games`, `/teams`, `/login`, `/signup` 등)
 *   - 정적 파일 (`/*.png` `/*.svg` 등)
 */
export const config = {
  matcher: ["/admin", "/admin/:path*", "/tournament-admin", "/tournament-admin/:path*"],
};
