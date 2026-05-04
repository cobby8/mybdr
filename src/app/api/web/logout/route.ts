import { NextResponse } from "next/server";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";

/**
 * POST /api/web/logout
 * 웹 프론트에서 호출하는 로그아웃 엔드포인트
 * - 세션 쿠키를 삭제하고 성공 응답 반환
 * - 프론트(layout, slide-menu, profile)에서 POST로 호출
 * - 카카오 연동 로그아웃은 /api/auth/logout (GET)에서 별도 처리
 *
 * 2026-05-05 fix: cookies().set → response.cookies.set 패턴 변경.
 *   본질: Next.js App Router 의 cookies() API 는 POST + NextResponse.json() 응답에서
 *         일부 케이스 Set-Cookie 헤더 미반영 (서버 측 mutation API).
 *   사용자 신고: "로그인 상태가 아닌데 우측 상단이 로그인 처럼 보이고 로그인 버튼 노출 안됨"
 *   = 로그아웃 클릭 → 응답 200 OK 받음 → 그러나 쿠키 삭제 안 됨 → window.location.href 후
 *     layout SSR = 세션 살아있음 인식 → 헤더 로그인 표시 유지.
 *   fix: /api/auth/logout (GET) 동일 패턴 — NextResponse 객체에 직접 cookies.set.
 *        Set-Cookie 헤더 응답에 명시 포함 → 브라우저가 즉시 쿠키 삭제 인지.
 */
export async function POST() {
  // 세션 쿠키 삭제 옵션: maxAge 0으로 즉시 만료
  const clearOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  const response = NextResponse.json({ success: true });
  // response.cookies.set = Set-Cookie 헤더 명시 포함 (cookies().set 보다 안전)
  response.cookies.set(WEB_SESSION_COOKIE, "", clearOptions);
  return response;
}
