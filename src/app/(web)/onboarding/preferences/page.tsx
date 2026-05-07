/**
 * /onboarding/preferences — 5/7 PR4 (Onboarding 4~10 선택 단계 통합)
 *
 * 이유 (왜):
 *   사용자 결정 — 선택 단계 7개 (사진/자기소개/스타일/빈도/목표/테마/알림) 를 단일 페이지에
 *   통합. 단계 분리는 사용자 피로 ↑ (10번 클릭). 한 페이지에서 자유롭게 입력 + skip 가능.
 *
 * 어떻게:
 *   - server component: 1~3단계 미완료면 거기로 redirect
 *   - 이미 본 페이지 통과한 사용자 (모두 입력됨) — onboarding_step >= 10 → /
 *   - 미완료 시 PreferencesStep 클라이언트 폼 (대량 입력)
 *
 * 진입 흐름:
 *   identity → environment → basketball → preferences → / (홈)
 *
 * skip: "나중에 입력" 버튼 — onboarding_step=10 으로 표시 (입력 0 + 페이지만 통과)
 */
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { PreferencesStep } from "./_components/preferences-step";

export const dynamic = "force-dynamic";

export default async function OnboardingPreferencesPage() {
  const auth = await getAuthUser();

  if (auth.state !== "active") {
    redirect("/login?redirect=/onboarding/preferences");
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
      profile_image_url: true,
      profile_image: true,
      bio: true,
      styles: true,
      goals: true,
      play_frequency: true,
      onboarding_step: true,
    },
  });

  // 1~3단계 가드
  if (!u?.name_verified) redirect("/onboarding/identity");

  const hasRegions = Array.isArray(u.preferred_regions) && u.preferred_regions.length > 0;
  const hasGameTypes =
    Array.isArray(u.preferred_game_types) && u.preferred_game_types.length > 0;
  if (!hasRegions || !hasGameTypes) redirect("/onboarding/environment");

  const hasCore =
    !!(u.position && u.position.trim()) &&
    typeof u.height === "number" &&
    u.height > 0 &&
    !!(u.skill_level && u.skill_level.trim());
  if (!hasCore) redirect("/onboarding/basketball");

  // 본 페이지 통과 표시 — onboarding_step >= 10 = 사용자가 한 번 진입했음
  if ((u.onboarding_step ?? 0) >= 10) {
    redirect("/");
  }

  return (
    <div
      className="page"
      style={{
        maxWidth: 720,
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
          STEP 4-10 / 10 (선택)
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "var(--ink)" }}>
          맞춤 설정
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
          사진 · 자기소개 · 스타일 · 빈도 · 목표 등 추가 정보를 입력하면
          <br />
          매칭 정확도와 활동 점수가 한 단계 더 올라갑니다. <strong>모두 선택 사항</strong>입니다.
        </p>
      </header>

      <PreferencesStep
        initialBio={u.bio ?? ""}
        initialStyles={Array.isArray(u.styles) ? u.styles : []}
        initialGoals={Array.isArray(u.goals) ? u.goals : []}
        initialFrequency={u.play_frequency ?? ""}
      />
    </div>
  );
}
