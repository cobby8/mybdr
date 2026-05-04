/**
 * /profile/complete/preferences — 2026-05-04 가입 흐름 통합 (F2-1) 폐기 redirect
 *
 * 이유(왜):
 *   /profile/complete 와 동일 — 취향 설정 4-step (스킬/스타일/요일·시간/목표) 위저드 폐기.
 *   /profile/edit 단일 페이지에서 모든 프로필·취향 정보 입력 가능.
 *
 * 어떻게:
 *   server component + redirect("/profile/edit") 즉시 발동.
 */
import { redirect } from "next/navigation";

export default function ProfileCompletePreferencesRedirect() {
  redirect("/profile/edit");
}
