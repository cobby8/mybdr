/* ============================================================
 * /profile/complete/preferences — Phase 9 D등급 P3 박제 처리.
 *
 * 왜 redirect만 두는가 (옵션 A):
 *  - 부모 /profile/complete (M5) 이후 "preferences 강제 단계"는 제거됨.
 *    저장 직후 router.push("/") — preferences로 강제 이동하지 않음.
 *    (parent page.tsx line 129 주석: "M5: 저장 후 곧장 홈으로 (preferences 강제 redirect 제거)")
 *  - PreferenceForm은 /profile/settings 허브에서만 호스팅됨.
 *    동일 폼을 온보딩에서 또 노출하면 v2 톤 박제 비용만 발생하고 디자인 부채가 늘어남.
 *  - /profile/preferences 도 동일 패턴으로 settings?tab=preferences 로 redirect 선례가 이미 존재.
 *
 * 외부 링크 호환성:
 *  - 가입 직후 이메일/푸시/북마크에 /profile/complete/preferences 가 박힌 경우를 대비해
 *    페이지 파일 자체는 존치하고 redirect만 수행한다.
 *  - 도착 위치는 /profile/settings?tab=preferences — 사용자는 동일한 PreferenceForm을 만난다.
 *
 * 어떻게:
 *  - Next.js App Router 서버 컴포넌트 redirect() 즉시 이동.
 *    (클라이언트 useRouter 부수 효과 대신 SSR 단계에서 308 처리되어 깔끔함)
 * ============================================================ */

import { redirect } from "next/navigation";

export default function CompletePreferencesLegacyRedirect() {
  // /profile/preferences 와 동일 대상으로 redirect — 일관성 유지
  redirect("/profile/settings?tab=preferences");
}
