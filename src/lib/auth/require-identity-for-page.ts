/**
 * 페이지 진입 가드 — 본인인증 미완료 사용자 onboarding 강제 redirect (PR3 — 2026-05-08).
 *
 * 이유 (왜):
 *   PR1.5.b 클라이언트 안내 (옵션 C — 핵심 액션 클릭 시점 redirect) 위에 추가하는
 *   서버 단 강제 가드 (옵션 B — 페이지 진입 자체 차단).
 *   미인증 사용자가 핵심 페이지 URL 직접 진입 시 페이지 로드 자체를 차단 + onboarding 으로.
 *
 * 사용처 (3 페이지 — PR1.5.b 와 동일 범위):
 *   - `/games/[id]` (server page 첫 줄)
 *   - `/teams/[id]` (server page 첫 줄)
 *   - `/tournaments/[id]/join` (client page 부모 layout 신설 — server wrapper)
 *
 * 동작 순서:
 *   1) `isIdentityGateEnabled()` false (mock 모드) → 즉시 return (noop).
 *      → channel key 환경변수 추가 전까지 운영 영향 0.
 *   2) `getAuthUser()` 결과 `state !== "active"` → 비로그인/탈퇴/미존재 → noop.
 *      → 비로그인 가드는 layout/페이지가 별도로 처리 (이중 가드 방지).
 *   3) `user.name_verified === true` → 통과 (return).
 *   4) 미인증 → `/onboarding/identity?returnTo=<원래경로>` 로 redirect (throw 효과).
 *
 * 보장:
 *   - DB SELECT 1회 (name_verified) — 페이지당 1 호출.
 *   - mock 모드 default — 환경변수 미설정 시 회귀 0 (현재 운영 동일).
 *   - PR1.5.a (서버 endpoint 가드) / PR1.5.b (클라 안내) 와 이중 보호 (충돌 0).
 *
 * 롤백: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 제거 = 즉시 noop 모드.
 *
 * 참조: `Dev/pr3-layout-guard-design-2026-05-08.md` §2.1 / decisions.md [2026-05-08]
 */
import { redirect } from "next/navigation";
import { getAuthUser } from "./get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { isIdentityGateEnabled } from "./identity-gate-flag";

export async function requireIdentityForPage(returnTo: string): Promise<void> {
  // 1) mock 모드 (PortOne 미활성) → 즉시 noop.
  //    환경변수 추가 전까지 가드 OFF — 회귀 0 보장.
  if (!isIdentityGateEnabled()) return;

  // 2) auth 상태 확인 — 비로그인/탈퇴/미존재면 본 가드 책임 외 (layout 가드 위임).
  //    여기서 /login redirect 하지 않는 이유: 가드 중복 (layout 이미 처리) + UX 혼란 (가드 대상 페이지가
  //    비로그인 시 onboarding 보다 /login 우선) 방지.
  const auth = await getAuthUser();
  if (auth.state !== "active") return;

  // 3) name_verified SELECT — getAuthUser cache 의 user select 에는 미포함 → 별도 SELECT.
  //    SELECT 실패 = 안전하게 noop (가드는 PR1.5.a 서버 endpoint 가 마지막 방어선).
  const u = await prisma.user
    .findUnique({
      where: { id: auth.user!.id },
      select: { name_verified: true },
    })
    .catch(() => null);

  // 4) 미인증 → onboarding 강제 진입. returnTo 보존하여 인증 완료 후 원래 페이지 복귀.
  //    redirect() 는 NEXT_REDIRECT 를 throw 하므로 호출 후 코드 실행 안 됨.
  if (!u?.name_verified) {
    redirect(`/onboarding/identity?returnTo=${encodeURIComponent(returnTo)}`);
  }
}
