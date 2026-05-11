import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { buildLoginRedirect } from "@/lib/auth/redirect";

/* ============================================================
 * /(web)/series/new — 시리즈 신규 생성 (운영자 페이지로 redirect)
 *
 * 이유(왜):
 *   기존 폼은 alert("준비 중") 만 표시 → DB mutation 0건 (사용자 onboarding 사고).
 *   시리즈 생성은 운영자 작업이므로 /tournament-admin/series/new 단일 진입점으로 통합.
 *   (web)/series/new 는 즉시 admin 페이지로 redirect 한다.
 *
 * 비로그인 시: buildLoginRedirect 로 로그인 후 admin 페이지로 자동 복귀.
 *   (admin layout 의 권한 가드는 super_admin / tournament_admin 만 통과)
 *
 * 회수 후보: 본 페이지의 _form/series-create-form.tsx (dead code, 별도 PR 에서 정리)
 * ============================================================ */

export const metadata: Metadata = {
  title: "새 시리즈 만들기 | MyBDR",
};

export default async function SeriesNewPage() {
  // 비로그인 → 로그인 후 admin 페이지로 복귀하도록 redirect 쿼리 동봉
  const session = await getWebSession();
  if (!session) {
    redirect(buildLoginRedirect("/tournament-admin/series/new"));
  }

  // 로그인 사용자 → 운영자 페이지로 즉시 redirect.
  // admin layout 의 권한 가드(super_admin / tournament_admin)가
  // 권한 없는 사용자를 거른다(이중 가드).
  redirect("/tournament-admin/series/new");
}
