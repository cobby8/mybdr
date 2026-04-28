import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { SeriesCreateForm } from "./_form/series-create-form";

/* ============================================================
 * /series/new — 시리즈 생성 위저드 (UI 전용 박제)
 *
 * 이유(왜):
 *   BDR v2 신규 시안 SeriesCreate.jsx 를 그대로 박제.
 *   tournament_series 테이블은 이미 존재하지만, 운영자 권한
 *   가드 + 색상/엠블럼 업로드 + 첫 회차 자동 생성 등 부가 흐름이
 *   아직 정해지지 않아 이번 페이즈는 UI 만 배치.
 *   제출 시 alert("준비 중") + 완료 화면 분기만 동작.
 *
 * 권한 가드:
 *   - getWebSession() 으로 로그인만 검증. 미로그인 시 /login 리다이렉트.
 *   - 실제 운영자 권한(organizations.owner_id, user.role 등)은 추후 강화.
 *   - 컨벤션: redirect 파라미터 이름은 mybdr 기존 패턴(`?redirect=...`)
 *     을 따른다. (PM prompt 의 `?next=` 대신)
 *
 * 구조:
 *   - server page: 세션 가드 + Metadata + 클라이언트 폼 임포트
 *   - 클라이언트 폼: _form/series-create-form.tsx (StepWizard 셸 사용)
 * ============================================================ */

export const metadata: Metadata = {
  title: "새 시리즈 만들기 | MyBDR",
  description:
    "정기 대회 시리즈를 5분 만에 개설하세요. 이름·첫 회차·공개 범위만 정하면 끝.",
};

export default async function SeriesNewPage() {
  // 왜 세션 가드: 시리즈 생성은 로그인 필수. 비로그인 사용자에게는
  // 로그인 후 본 페이지로 자동 복귀되도록 redirect 쿼리 전달.
  const session = await getWebSession();
  if (!session) {
    redirect("/login?redirect=/series/new");
  }

  // TODO(권한 강화): 현재는 로그인만 통과하면 진입 가능.
  //   실제 운영자 권한(organizations.owner_id 또는 user.role)
  //   체크는 백로그(scratchpad)로 분리. 권한 부족 시
  //   /organizations/apply 안내 카드 노출 흐름 검토.

  return <SeriesCreateForm />;
}
