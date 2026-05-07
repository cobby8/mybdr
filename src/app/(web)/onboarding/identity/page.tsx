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

export default async function OnboardingIdentityPage() {
  const auth = await getAuthUser();

  // 비로그인 → /login 로 redirect (after login 복귀)
  if (auth.state !== "active") {
    redirect("/login?redirect=/onboarding/identity");
  }

  // name_verified 단일 SELECT — getAuthUser 의 user select 에는 미포함
  const u = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: { name_verified: true },
  });

  // 5/7 PR2.c — 이미 인증 완료 → 다음 단계 (활동 환경)
  if (u?.name_verified) {
    redirect("/onboarding/environment");
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

      <IdentityStep />
    </div>
  );
}
