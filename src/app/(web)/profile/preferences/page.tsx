/* ============================================================
 * /profile/preferences — M1 Day 8 이후 레거시 경로.
 *
 * 왜:
 *  - 좌측 네비의 "설정" 항목은 이제 /profile/settings 허브 (Phase 5 7섹션)로 통합됨.
 *  - 2026-05-01 (Phase A-3): 시안 v2.3 재구성으로 settings 에 feed 섹션 신설 →
 *    redirect 대상도 ?section=feed 로 변경 (사용자 결정 Q1=①).
 *  - 외부 링크/북마크/과거 이메일 링크 호환을 위해 페이지 파일 자체는 존치하되 redirect만 수행.
 *
 * 어떻게:
 *  - Next.js App Router의 서버 컴포넌트 redirect()로 즉시 이동.
 *  - 신규 ?section=feed 우선. 기존 ?tab=preferences 폴백은 section-key.ts 의 resolveSection 이
 *    "feed" 로 매핑하므로 외부 북마크 호환 보존.
 * ============================================================ */

import { redirect } from "next/navigation";

export default function PreferencesLegacyRedirect() {
  redirect("/profile/settings?section=feed");
}
