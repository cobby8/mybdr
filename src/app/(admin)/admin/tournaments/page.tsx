import { redirect } from "next/navigation";

// PR-4 4-A §6-2: 대회 목록 일원화 — /admin/tournaments 목록 제거.
//   목록은 /tournament-admin/tournaments 단일 진입으로 통합. 이 경로 진입 시 즉시 리다이렉트.
//   ⚠ 상세 /admin/tournaments/[id] (+ audit-log · transfer-organizer)는 유지 — 직접 URL 도달.
export default function AdminTournamentsPage() {
  redirect("/tournament-admin/tournaments");
}
