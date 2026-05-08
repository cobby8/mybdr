/**
 * /tournaments/[id]/join — 본인인증 가드용 server layout (5/8 PR3).
 *
 * 이유 (왜):
 *   page.tsx 가 "use client" 단일 client component 라 server-side 가드 호출 불가.
 *   client 안에서 useEffect + router.push 로 redirect 시 이미 페이지 마운트 후이므로
 *   "페이지 진입 차단" UX 가 깨짐 (PR3 의 옵션 B 의도와 어긋남).
 *
 *   server layout 으로 가드 삽입 = page 마운트 전 server 단계에서 redirect 가능.
 *   라우트 그룹 영향 0 — children 만 그대로 패스스루.
 *
 * 어떻게:
 *   - server component (default — async)
 *   - 첫 줄에 `requireIdentityForPage(...)` 호출
 *   - 통과 시 children 그대로 렌더 (기존 page.tsx UI 영향 0)
 *
 * 보장:
 *   - mock 모드 default — 환경변수 미설정 시 가드 noop, 기존 동작 100% 유지
 *   - 기존 client page.tsx 의 PR1.5.b useEffect redirect 도 보존 (이중 보호)
 *
 * 참조: `Dev/pr3-layout-guard-design-2026-05-08.md` §3 (구현 단계 3)
 */
import { requireIdentityForPage } from "@/lib/auth/require-identity-for-page";

export default async function TournamentJoinLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // params 가 Promise (Next 15) — id 추출 후 returnTo 구성
  const { id } = await params;

  // 본인인증 미완료 사용자 강제 redirect (mock 모드 default → noop).
  //   활성 시 → /onboarding/identity?returnTo=/tournaments/{id}/join
  await requireIdentityForPage(`/tournaments/${id}/join`);

  // 통과 시 기존 page.tsx 그대로 렌더 (UI 변경 0)
  return <>{children}</>;
}
