// Phase 10-5 — 온보딩 완료 endpoint
//
// 이유(왜):
//   /onboarding/setup 위저드는 6단계로 클라이언트 state 만 모은다.
//   기존엔 DB 컬럼이 없어 박제 상태였고 완료 시점에 아무것도 저장하지 않았다.
//   Phase 10-5 에서 users 테이블에 styles / active_areas / goals /
//   play_frequency / onboarding_completed_at 5개 컬럼을 추가하여 저장 활성화.
//
// 정책:
//   - 인증 필수 (withWebAuth) — 비로그인은 401.
//   - 입력 검증: completeOnboardingSchema(zod) 화이트리스트.
//   - 멱등(idempotent): 다시 호출되면 onboarding_completed_at 갱신 + 값 덮어쓰기.
//     (재진입 차단은 후속 작업으로 분리, 본 단계에선 저장만 책임)
//   - 알림 토글은 기존 notification_settings JSON 의 키와 매핑하여 병합 저장.
//
// 응답: 갱신된 user 핵심 필드만 (apiSuccess → 자동 snake_case).
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError } from "@/lib/api/response";
import { completeOnboardingSchema } from "@/lib/validation/onboarding";

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    // 1) body 파싱 — 모든 필드 optional 이므로 빈 body 도 허용한다.
    let raw: unknown = {};
    try {
      const text = await req.text();
      raw = text ? JSON.parse(text) : {};
    } catch {
      raw = {};
    }

    // 2) zod 화이트리스트 검증 — 잘못된 enum / 한도 초과는 즉시 400
    const parsed = completeOnboardingSchema.safeParse(raw);
    if (!parsed.success) {
      return apiError("입력값이 올바르지 않습니다.", 400);
    }
    const data = parsed.data;

    // 3) 알림 설정 병합 — 기존 notification_settings 와 새 토글을 합친다.
    //    위저드 키(games/tournaments/messages/marketing) 가
    //    /api/web/profile/notification-settings 의 키(game/tournament/...) 와
    //    살짝 다르므로 양쪽 모두에 동시에 기록해 호환성을 유지한다.
    //    Prisma Json 입력 타입(InputJsonValue) 으로 명시 캐스팅.
    let mergedNotifications: Prisma.InputJsonValue | undefined;
    if (data.notification_settings) {
      const current = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { notification_settings: true },
      });
      const prev = (current?.notification_settings ?? {}) as Record<string, boolean>;
      const onboardingKeys = data.notification_settings;
      mergedNotifications = {
        ...prev,
        // 위저드 키 그대로 저장 (시안 설계 보존)
        games: onboardingKeys.games,
        tournaments: onboardingKeys.tournaments,
        messages: onboardingKeys.messages,
        marketing: onboardingKeys.marketing,
        // /profile/notification-settings 호환 키도 같이 갱신
        // (game/tournament 단수형. team/community 는 messages 토글로 매핑)
        game: onboardingKeys.games,
        tournament: onboardingKeys.tournaments,
        team: onboardingKeys.messages,
        community: onboardingKeys.messages,
      };
    }

    // 4) DB 업데이트 — undefined 키는 보내지 않아 부분 업데이트 보장
    const updated = await prisma.user.update({
      where: { id: ctx.userId },
      data: {
        // 1단계 — 포지션/신장 (기존 컬럼 재사용)
        ...(data.position !== undefined && { position: data.position }),
        ...(data.height !== undefined && { height: data.height }),
        // 2단계 — 실력 (기존 preferred_skill_levels 가 아닌 새 컬럼은 없으므로
        //         시안 라벨을 그대로 position 옆 별도 컬럼에 저장하지 않고,
        //         users.bio 유지를 위해 별도 컬럼은 도입하지 않는다.
        //         level 은 클라이언트에 보존되며 추후 활용 — 본 단계에선 저장하지 않음.)
        // 3~5단계 — 신규 컬럼
        styles: data.styles,
        active_areas: data.active_areas,
        goals: data.goals,
        ...(data.play_frequency !== undefined && {
          play_frequency: data.play_frequency,
        }),
        // 6단계 — 알림 (병합한 경우만 갱신)
        ...(mergedNotifications && {
          notification_settings: mergedNotifications,
        }),
        // 완료 시각 — 매 호출마다 갱신 (재호출 시 최신 시각으로 덮어쓰기)
        onboarding_completed_at: new Date(),
      },
      select: {
        id: true,
        position: true,
        height: true,
        styles: true,
        active_areas: true,
        goals: true,
        play_frequency: true,
        onboarding_completed_at: true,
      },
    });

    return apiSuccess({
      user: {
        ...updated,
        // BigInt → string (JSON 직렬화)
        id: updated.id.toString(),
        onboarding_completed_at:
          updated.onboarding_completed_at?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("[onboarding/complete POST]", error);
    return apiError("온보딩 저장 실패", 500);
  }
});
