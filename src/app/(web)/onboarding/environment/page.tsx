/**
 * /onboarding/environment — 5/7 PR2.a (Onboarding 10단계 — 2/10 활동 환경)
 *
 * 이유 (왜):
 *   identity (1단계) 완료 후 진입. 17 시도 + 5 게임유형 입력 → 매칭 정확도 ↑.
 *   profile/edit §6 활동 환경 섹션과 같은 데이터 (preferred_regions / preferred_game_types).
 *   onboarding 단독 페이지에서 단계별 강제 + 게이미피케이션 진입점.
 *
 * 어떻게:
 *   - server component: getAuthUser + prisma SELECT (name_verified + 환경 2종)
 *   - 가드:
 *     · anonymous → /login
 *     · name_verified=false → /onboarding/identity (이전 단계 미완료)
 *     · 환경 2종 모두 입력됨 → /onboarding/basketball (이미 완료)
 *   - 미입력 시 EnvironmentStep 클라이언트 폼 마운트
 */
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { EnvironmentStep } from "./_components/environment-step";

export const dynamic = "force-dynamic";

export default async function OnboardingEnvironmentPage() {
  const auth = await getAuthUser();

  if (auth.state !== "active") {
    redirect("/login?redirect=/onboarding/environment");
  }

  const u = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: {
      name_verified: true,
      preferred_regions: true,
      preferred_game_types: true,
    },
  });

  // 1단계 (본인인증) 미완료 → 거기로
  if (!u?.name_verified) {
    redirect("/onboarding/identity");
  }

  // 이미 환경 2종 모두 입력 → 다음 단계 (3단계)
  const hasRegions = Array.isArray(u.preferred_regions) && u.preferred_regions.length > 0;
  const hasGameTypes =
    Array.isArray(u.preferred_game_types) && u.preferred_game_types.length > 0;
  if (hasRegions && hasGameTypes) {
    redirect("/onboarding/basketball");
  }

  // 초기값 — 일부 입력된 상태 호환
  const initialRegions = Array.isArray(u.preferred_regions)
    ? (u.preferred_regions as unknown as string[])
    : [];
  const initialGameTypes = Array.isArray(u.preferred_game_types)
    ? (u.preferred_game_types as unknown as string[])
    : [];

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
          STEP 2 / 10
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--ink)" }}>
          활동 환경
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
          어디서 · 어떤 농구를 즐기시나요?
          <br />
          맞춤 매칭 정확도가 올라갑니다.
        </p>
      </header>

      <EnvironmentStep
        initialRegions={initialRegions}
        initialGameTypes={initialGameTypes}
      />
    </div>
  );
}
