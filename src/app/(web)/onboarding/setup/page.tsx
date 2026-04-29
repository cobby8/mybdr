/* ============================================================
 * /onboarding/setup — server wrapper
 *
 * 이유(왜):
 *   Phase 10-5 후속 — onboarding 재진입 차단.
 *   기존 단일 "use client" 페이지는 server redirect 가 불가능해
 *   이미 온보딩을 완료한 사용자가 URL 직접 입력 / 뒤로가기 등으로
 *   재진입할 때 위저드를 다시 거치는 어색한 UX 가 발생했다.
 *
 *   server wrapper 에서:
 *     1) 비로그인 → /login?next=/onboarding/setup 로 redirect
 *     2) onboarding_completed_at 이 이미 있으면 → /profile?onboarded=already
 *     3) 그 외에만 client form 렌더
 *
 *   verify 페이지에서 setup 으로 redirect 한 사용자도 이 가드를 통과하므로
 *   verify 단계엔 별도 체크를 두지 않는다 (이중 redirect 로 자연스럽게 처리).
 *
 * 변경 정책:
 *   - POST /api/web/onboarding/complete 0 변경
 *   - 위저드 form 본문 0 변경 (그대로 _components/setup-form.tsx 로 이전)
 * ============================================================ */

import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { OnboardingSetupForm } from "./_components/setup-form";

// 동적 렌더링 강제: 세션 쿠키 + DB 조회를 매 요청마다 실행해야 정확한 redirect 가 가능
export const dynamic = "force-dynamic";

export default async function OnboardingSetupPage() {
  // 1) 비로그인 차단 — 로그인 후 다시 setup 으로 돌아오도록 next 파라미터 동봉
  const session = await getWebSession();
  if (!session) {
    redirect("/login?next=/onboarding/setup");
  }

  // 2) 재진입 차단 — onboarding_completed_at 이 이미 기록돼 있으면 위저드 스킵
  //    select 로 필요한 1개 컬럼만 조회 (가벼운 가드)
  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.sub) },
    select: { onboarding_completed_at: true },
  });

  if (user?.onboarding_completed_at) {
    // ?onboarded=already — /profile 측에서 안내 토스트 등에 활용 가능 (현재는 단순 마커)
    redirect("/profile?onboarded=already");
  }

  // 3) 정상 케이스 — 위저드 form 렌더 (BigInt → string 으로 직렬화 친화)
  return <OnboardingSetupForm currentUserId={String(session.sub)} />;
}
