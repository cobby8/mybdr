/**
 * /onboarding/setup — 2026-05-04 가입 흐름 통합 (F2-2) 폐기 redirect
 *
 * 이유(왜):
 *   가입 이후 프로필 입력 페이지를 /profile/edit 단일 페이지로 통합.
 *   기존 onboarding 위저드 (Phase 10-5 server wrapper + onboarding_completed_at 가드)
 *   는 더 이상 신규 가입자 흐름에 노출되지 않음.
 *   POST /api/web/onboarding/complete 는 보존 (기존 위저드 진입 사용자 영향 0).
 *   _components/setup-form.tsx 는 unused 가 되지만 본 1차 작업에서 미삭제 (별도 cleanup 큐).
 *
 * 어떻게:
 *   server component + redirect("/profile/edit") — 비로그인/온보딩 완료 가드 모두 제거.
 *   /profile/edit 페이지가 자체 세션 가드 보유.
 */
import { redirect } from "next/navigation";

export default function OnboardingSetupRedirect() {
  redirect("/profile/edit");
}
