/**
 * /profile/complete — 2026-05-04 가입 흐름 통합 (F2-1) 폐기 redirect
 *
 * 이유(왜):
 *   가입 이후 프로필 입력 페이지를 /profile/edit 단일 페이지로 통합.
 *   기존 4-step 위저드 (포지션/키/지역/사진) 는 더 이상 신규 가입자 흐름에 노출되지 않음.
 *   본 redirect 는 외부 링크 / 북마크 / 시안 docs 의 옛 경로 보호용 (당분간 유지).
 *   추후 별도 cleanup 큐에서 라우트 자체 제거 예정.
 *
 * 어떻게:
 *   server component + redirect("/profile/edit") — 사용자 client 도달 전 즉시 발동.
 *   기존 시안 박제 (POSITIONS / RegionPicker / 슬라이더 / drop zone) 모두 폐기.
 */
import { redirect } from "next/navigation";

export default function ProfileCompleteRedirect() {
  redirect("/profile/edit");
}
