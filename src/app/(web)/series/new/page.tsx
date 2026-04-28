import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
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
 *   - getWebSession() 으로 로그인 검증. 미로그인 시 /login 리다이렉트.
 *   - organizations.owner_id 검증. 단체 운영자가 아니면 안내 페이지(옵션 2)
 *     를 페이지 내부에서 직접 렌더 — redirect 대신 사용자 혼란 최소화.
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

  // 왜 운영자 권한 체크: 시리즈는 organization 단위 운영(BDR 본부, 지역 협회 등)
  // 이라 spam 위험이 크다. organizations.owner_id 가 현재 세션 user 인 경우만
  // 통과시킨다. findFirst + select id 만 — 존재 여부만 확인하면 충분.
  const ownsOrg = await prisma.organizations.findFirst({
    where: { owner_id: BigInt(session.sub) },
    select: { id: true },
  });

  // 왜 페이지 내부 분기(옵션 2): redirect 시 사용자가 "왜 튕겼지?" 혼란.
  // 안내 카드 + 단체 등록 신청 CTA 로 흐름을 명확히 한다.
  if (!ownsOrg) {
    return (
      <div className="page" style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <div
          className="card"
          style={{
            padding: 32,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* 잠금 아이콘 — Material Symbols Outlined (lucide 금지 컨벤션) */}
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "var(--accent)" }}
          >
            lock
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            운영자 권한이 필요합니다
          </h1>
          <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
            시리즈 생성은 등록된 단체(organization) 운영자만 가능합니다.
            <br />
            단체를 먼저 등록 신청해 주세요.
          </p>
          <Link
            href="/organizations/apply"
            className="btn btn--primary"
            style={{ marginTop: 8 }}
          >
            단체 등록 신청
          </Link>
        </div>
      </div>
    );
  }

  return <SeriesCreateForm />;
}
