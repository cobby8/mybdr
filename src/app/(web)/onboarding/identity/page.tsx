/**
 * /onboarding/identity — 5/7 PR1.1 (Onboarding 10단계 — 1/10 본인인증)
 *
 * 이유(왜):
 *   첫 로그인 사용자 강제 진입점 1단계. mybdr 활동 자격 검증의 기반 (대회 출전 게이트).
 *   기존 IdentityVerifyButton (Phase 12-5 mock) 재사용 — Portone 통합은 PR1 범위 외.
 *
 * 어떻게:
 *   - server component: getAuthUser() 단일 헬퍼 위임 (auth 가드 일관성 — conventions.md 박제)
 *   - 이미 name_verified=true 면 → / 로 redirect (PR2 후 /onboarding/environment 로 변경)
 *   - 미인증이면 IdentityStep 클라이언트 컴포넌트 마운트
 *
 * 후속 PR 의존:
 *   - PR1.2 layout 가드 추가 시 미인증 사용자 자동 redirect 흐름
 *   - PR1.3 onboarding_step UPDATE 통합
 *   - PR2 다음 단계 (/onboarding/environment) 진입 라우트
 */
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { IdentityStep } from "./_components/identity-step";

export const dynamic = "force-dynamic";

export default async function OnboardingIdentityPage({
  searchParams,
}: {
  // 5/8 PR3 — returnTo query 처리 (가드에서 보낸 원래 페이지 보존).
  //   page server component 가 Next.js 15 에서 searchParams 를 Promise 로 받음.
  searchParams?: Promise<{ returnTo?: string }>;
}) {
  const auth = await getAuthUser();

  // 5/8 PR3 — returnTo 추출 + 보안 검증 (open redirect 방지).
  //   "/" 로 시작하는 경로만 허용 — 외부 URL 또는 protocol-relative URL ("//evil.com") 차단.
  const sp = searchParams ? await searchParams : undefined;
  const rawReturnTo = sp?.returnTo;
  const safeReturnTo =
    typeof rawReturnTo === "string" &&
    rawReturnTo.startsWith("/") &&
    !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : null;

  // 비로그인 → /login 로 redirect (after login 복귀 — returnTo 보존하여 인증 완료 후 원래 흐름 복원).
  if (auth.state !== "active") {
    const loginRedirect = safeReturnTo
      ? `/onboarding/identity?returnTo=${encodeURIComponent(safeReturnTo)}`
      : "/onboarding/identity";
    redirect(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
  }

  // name_verified 단일 SELECT — getAuthUser 의 user select 에는 미포함
  const u = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { name_verified: true },
  });

  // 5/7 PR2.c — 이미 인증 완료 → 다음 단계.
  // 5/8 PR3 — returnTo 가 있으면 원래 페이지로 우선 복귀 (가드에서 보낸 케이스).
  //   없으면 기존 onboarding 흐름 유지 (/onboarding/environment).
  if (u?.name_verified) {
    redirect(safeReturnTo ?? "/onboarding/environment");
  }

  return (
    <div
      className="page"
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "32px 16px",
      }}
    >
      <header style={{ marginBottom: 24, textAlign: "center" }}>
        <p
          className="eyebrow"
          style={{
            fontSize: 11,
            color: "var(--ink-mute)",
            marginBottom: 8,
            letterSpacing: "0.08em",
          }}
        >
          STEP 1 / 10
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--ink)" }}>
          본인인증
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
          안전한 농구 활동을 위해 실명 인증이 필요해요.
          <br />
          대회 출전 · 팀 활동 시 본인인증이 완료된 회원만 참여할 수 있습니다.
        </p>
      </header>

      {/* 5/8 PR3 — returnTo 가 있으면 인증 완료 후 그쪽으로 복귀, 없으면 기존 흐름 (/onboarding/environment) */}
      <IdentityStep returnTo={safeReturnTo} />
    </div>
  );
}
