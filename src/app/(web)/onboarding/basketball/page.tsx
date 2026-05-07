/**
 * /onboarding/basketball — 5/7 PR2.b (Onboarding 10단계 — 3/10 농구 정보)
 *
 * 이유 (왜):
 *   environment (2단계) 완료 후. 포지션 5종 + 신장 + 5단계 실력 + 선출 여부 입력.
 *   ⚠️ 등번호는 본 단계에서 제외 — 팀 가입 시 별도 신청 (사용자 룰 5/5 PR1).
 *
 * 어떻게:
 *   - server component: 가드 + 단계 검증
 *   - 1단계 (name_verified) 미완료 → /onboarding/identity
 *   - 2단계 (preferred_regions / preferred_game_types) 미완료 → /onboarding/environment
 *   - 본 단계 핵심 데이터 (position + height + skill_level) 입력됨 → / 또는 /onboarding/done
 *   - 미입력 시 BasketballStep 클라이언트 폼
 */
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { BasketballStep } from "./_components/basketball-step";

export const dynamic = "force-dynamic";

export default async function OnboardingBasketballPage() {
  const auth = await getAuthUser();

  if (auth.state !== "active") {
    redirect("/login?redirect=/onboarding/basketball");
  }

  const u = await prisma.user.findUnique({
    where: { id: auth.user!.id },
    select: {
      name_verified: true,
      preferred_regions: true,
      preferred_game_types: true,
      position: true,
      height: true,
      skill_level: true,
      is_elite: true,
    },
  });

  // 1단계 미완료 → 거기로
  if (!u?.name_verified) {
    redirect("/onboarding/identity");
  }

  // 2단계 미완료 → 거기로
  const hasRegions = Array.isArray(u.preferred_regions) && u.preferred_regions.length > 0;
  const hasGameTypes =
    Array.isArray(u.preferred_game_types) && u.preferred_game_types.length > 0;
  if (!hasRegions || !hasGameTypes) {
    redirect("/onboarding/environment");
  }

  // 본 단계 (3단계) 핵심 3종 모두 입력됨 → 완료, 홈으로
  // (선출 여부는 선택 항목 — 핵심 검증에 포함 X)
  const hasCore =
    !!(u.position && u.position.trim()) &&
    typeof u.height === "number" &&
    u.height > 0 &&
    !!(u.skill_level && u.skill_level.trim());
  if (hasCore) {
    redirect("/");
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
          STEP 3 / 10
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--ink)" }}>
          농구 정보
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
          포지션과 실력 정보를 알려주세요.
          <br />
          매칭 정확도가 한 단계 더 올라갑니다.
        </p>
      </header>

      <BasketballStep
        initialPosition={u.position ?? ""}
        initialHeight={u.height ?? null}
        initialSkillLevel={u.skill_level ?? ""}
        initialIsElite={!!u.is_elite}
      />
    </div>
  );
}
