// (admin-v2)/v2/page.tsx — /v2 진입 시 대회관리자 콘솔 대시보드로 이동.
//   M2 플레이스홀더 → M3 에서 대회관리자 셸 대시보드를 인덱스로 사용하므로 redirect 로 일원화.
import { redirect } from "next/navigation";

export default function AdminV2HomePage() {
  redirect("/v2/tournament-admin");
}
