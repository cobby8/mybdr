// 더미 박제 페이지 — 사용자가 저장 시도해도 onClick 없어 저장 안 되는 문제로
// /profile/settings (진짜 동작 페이지)로 영구 redirect.
// 박제 시안은 git history로 보존됨 (a18b426 이전 버전 복원 가능).

import { redirect } from "next/navigation";

export default function SettingsRedirectPage() {
  redirect("/profile/settings");
}
