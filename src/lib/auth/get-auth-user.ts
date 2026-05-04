import { cookies } from "next/headers";
import { cache } from "react";
import { getWebSession, WEB_SESSION_COOKIE } from "./web-session";
import { prisma } from "@/lib/db/prisma";
import type { JwtPayload } from "./jwt";

/**
 * 인증 상태 4종.
 * - anonymous: 쿠키 없음 또는 JWT 검증 실패
 * - active: 정상 회원 (status === "active" 또는 명시적 비-withdrawn)
 * - withdrawn: 탈퇴 회원 (status === "withdrawn") — 쿠키 자동 cleanup
 * - missing: JWT 살아있지만 DB user 없음 (관리자 hard delete 등) — 쿠키 자동 cleanup
 */
export type AuthState = "anonymous" | "active" | "withdrawn" | "missing";

/**
 * 인증 단일 진입점 — getAuthUser() 결과 형식.
 *
 * `state` 한 필드로 4 케이스 분기. user 는 active/withdrawn 일 때만 존재 (missing 은 user=undefined).
 */
export interface AuthUser {
  state: AuthState;
  session?: JwtPayload;
  user?: {
    id: bigint;
    nickname: string | null;
    status: string | null;
  };
}

/**
 * 인증 단일 진입점 (옵션 B-PR1, 2026-05-05).
 *
 * 이유 (왜):
 *   - 5/5 사용자 신고 본질: 탈퇴 회원 쿠키 7일 잔존 시 매번 layout 가드에 의존.
 *     사용자가 다른 브라우저에서 탈퇴 → 같은 브라우저 쿠키 잔존 케이스에서
 *     모든 layout 진입마다 DB SELECT + status 검증 반복.
 *   - 가드가 5개소 (web/login/signup/profile layout + me API) 분산 → 신규 가드 추가 시
 *     같은 패턴 반복 + 누락 회귀 패턴 (errors.md 2026-05-05 fa5bd90 → signup 누락).
 *
 * 어떻게:
 *   1. JWT verify + DB user.status SELECT + status 분기 → 단일 함수로 캡슐화.
 *   2. React.cache 로 동일 요청 내 dedup → 4 layout 동시 호출해도 DB 1회.
 *   3. state === "withdrawn" 또는 "missing" 시 cookies.delete 자동 호출 — 사용자가
 *      페이지 진입 1회만으로 잘못된 쿠키 영구 제거. layout 가드에 의존하지 않음.
 *
 * 보장:
 *   - DB SELECT 실패 = 안전하게 anonymous 반환 (가드는 비로그인 처리).
 *   - cookies.delete 실패 (read-only context) = silent fail. 다음 layer (가드) 가 처리.
 *   - 사용 위치 = server component layout / server action 만. route handler 는
 *     기존 withWebAuth 유지 (별도 PR 에서 통합 검토).
 */
export const getAuthUser = cache(async (): Promise<AuthUser> => {
  // 1) JWT verify — 쿠키 없거나 검증 실패면 anonymous
  const session = await getWebSession();
  if (!session) {
    return { state: "anonymous" };
  }

  // 2) DB user.status SELECT — 실패 시 안전하게 anonymous 처리 (가드는 비로그인 처리)
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: BigInt(session.sub) },
      select: { id: true, nickname: true, status: true },
    });
  } catch {
    // DB 실패 = 인증 실패로 간주 (안전 우선). 가드는 비로그인 처리.
    return { state: "anonymous", session };
  }

  // 3) user 없음 = JWT 살아있는데 DB 미존재 (관리자 hard delete 등) → 쿠키 cleanup
  if (!user) {
    await tryDeleteSessionCookie();
    return { state: "missing", session };
  }

  // 4) 탈퇴 회원 → 쿠키 cleanup + state="withdrawn"
  if (user.status === "withdrawn") {
    await tryDeleteSessionCookie();
    return { state: "withdrawn", session, user };
  }

  // 5) 정상 회원
  return { state: "active", session, user };
});

/**
 * 쿠키 자동 cleanup — server component layout 에서 호출 가능 (Next.js 15 async cookies API).
 *
 * 이유: 잘못된 쿠키 (탈퇴/미존재) 가 7일 만료 전까지 살아있으면 매번 layout 가드 의존.
 *       1회 진입으로 영구 제거하여 회귀 차단.
 *
 * 안전: read-only context (Server Component 가 streaming 후 phase 등) 에서 throw 가능 →
 *      try/catch silent fail. 다음 layer 가 처리하므로 무해.
 */
async function tryDeleteSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(WEB_SESSION_COOKIE);
  } catch {
    // mutation 실패 (read-only context 등) — 무시. 다음 layer 가 처리.
  }
}
