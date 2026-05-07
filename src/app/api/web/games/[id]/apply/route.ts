import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  applySchema,
  isGuestApply,
  experienceLabel,
} from "@/lib/validation/game-apply";
// 5/7 PR1.5 — 본인인증 게이트
import { requireIdentityVerified } from "@/lib/auth/require-identity-verified";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  // 5/7 PR1.5 — 본인인증 필수 게이트 (옵션 C)
  const identityGuard = await requireIdentityVerified(ctx.userId);
  if (identityGuard instanceof Response) return identityGuard;

  try {
    // 1. body 파싱 — 일반 신청은 빈 body, 게스트 신청은 role:"guest" + 추가 필드.
    // 이유: 두 흐름이 같은 엔드포인트를 공유하므로 zod 로 분기 검증.
    //      Content-Length 0 또는 비-JSON 도 허용 (기존 호출자 호환).
    let parsedBody: unknown = {};
    try {
      const text = await req.text();
      parsedBody = text ? JSON.parse(text) : {};
    } catch {
      parsedBody = {};
    }
    const parseResult = applySchema.safeParse(parsedBody);
    if (!parseResult.success) {
      return apiError("입력값이 올바르지 않습니다.", 400);
    }
    const body = parseResult.data;
    const isGuest = isGuestApply(body);

    // 8자리 short ID → full UUID 변환 (상세페이지와 동일한 처리)
    // TC-042: short UUID는 hex 8자리만 허용 (% 와일드카드 인젝션 방지)
    let game = null;
    if (id.length === 8) {
      if (!/^[a-f0-9]{8}$/.test(id)) {
        return apiError("경기를 찾을 수 없습니다.", 404);
      }
      const rows = await prisma.$queryRaw<{ uuid: string }[]>`
        SELECT uuid::text AS uuid FROM games WHERE uuid::text LIKE ${id + "%"} LIMIT 1
      `;
      const fullUuid = rows[0]?.uuid;
      if (fullUuid) {
        game = await prisma.games.findUnique({ where: { uuid: fullUuid } });
      }
    } else {
      game = await prisma.games.findUnique({ where: { uuid: id } });
    }
    if (!game) return apiError("경기를 찾을 수 없습니다.", 404);

    // 2. 주최자 본인 신청 불가
    if (game.organizer_id === ctx.userId) {
      return apiError("내가 주최한 경기에는 신청할 수 없습니다.", 403);
    }

    // 3. 모집중 상태(1)만 신청 가능
    if (game.status !== 1) {
      return apiError("현재 신청을 받지 않는 경기입니다.", 400);
    }

    // 4. 이미 시작된 경기 신청 불가
    if (game.scheduled_at < new Date()) {
      return apiError("이미 시작된 경기에는 신청할 수 없습니다.", 400);
    }

    // 4-1. 게스트 신청 전용 가드
    // 이유: GUEST 게임(game_type=1)에서 allow_guests 가 명시적으로 false 가 아닐 때만 허용.
    //      약관 동의는 zod 에서 .literal(true) 로 강제되지만, 방어적 이중 체크.
    if (isGuest) {
      if (game.game_type !== 1) {
        return apiError("게스트 신청을 받지 않는 경기입니다.", 400);
      }
      if (game.allow_guests === false) {
        return apiError("호스트가 게스트 신청을 닫았습니다.", 400);
      }
      if (!body.accepted_terms?.insurance || !body.accepted_terms?.cancel) {
        return apiError("필수 약관에 동의해야 합니다.", 400);
      }
    }

    // 5. 중복 신청 사전 확인 (트랜잭션 진입 전 빠른 검사)
    const existing = await prisma.game_applications.findUnique({
      where: { game_id_user_id: { game_id: game.id, user_id: ctx.userId } },
    });
    if (existing) {
      return apiError("이미 참가 신청한 경기입니다.", 409);
    }

    // 6. 신청자 프로필 조회 (호스트에게 전달할 정보)
    const applicant = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        name: true,
        nickname: true,
        phone: true,
        position: true,
        city: true,
        district: true,
        profile_image: true,
      },
    });

    // TC-001: 정원 확인 + 신청 생성 + 카운트 갱신을 원자적 트랜잭션으로 처리
    // current_participants를 조건부 UPDATE로 race condition 방지
    try {
      await prisma.$transaction(async (tx) => {
        // 정원이 있을 때만 원자적 증가 (max_participants 초과 시 0 rows 반환)
        if (game!.max_participants !== null) {
          const reserved = await tx.$executeRaw`
            UPDATE games
            SET current_participants = current_participants + 1, updated_at = NOW()
            WHERE id = ${game!.id}
              AND current_participants < max_participants
          `;
          if (reserved === 0) throw Object.assign(new Error("FULL"), { code: "FULL" });
        } else {
          // 정원 제한 없는 경우 단순 증가
          await tx.games.update({
            where: { id: game!.id },
            data: { current_participants: { increment: 1 } },
          });
        }

        // 게스트 신청이면 추가 필드 포함, 일반은 기존 그대로.
        // accepted_terms 에 accepted_at 타임스탬프를 함께 박아 동의 시점 기록.
        const baseData = {
          game_id: game!.id,
          user_id: ctx.userId,
          status: 0, // pending
          payment_required: (game!.fee_per_person ?? 0) > 0,
          created_at: new Date(),
          updated_at: new Date(),
        };
        if (isGuest) {
          await tx.game_applications.create({
            data: {
              ...baseData,
              is_guest: true,
              position: body.position,
              experience_years: body.experience_years,
              message: body.message ?? null,
              accepted_terms: {
                insurance: body.accepted_terms.insurance,
                cancel: body.accepted_terms.cancel,
                accepted_at: new Date().toISOString(),
              },
            },
          });
        } else {
          await tx.game_applications.create({ data: baseData });
        }
      });
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (err.code === "FULL" || err.message === "FULL") {
        return apiError("정원이 마감된 경기입니다.", 400);
      }
      // P2002: unique constraint violation (동시 중복 신청)
      if ((err as { code?: string }).code === "P2002") {
        return apiError("이미 참가 신청한 경기입니다.", 409);
      }
      throw e;
    }

    // 8. 주최자에게 신청 알림 발송 (fire-and-forget)
    // 이유: 게스트 신청은 일반 신청과 검토 컨텍스트가 다름(포지션·구력·약관 동의 정보).
    //      호스트가 알림만 보고 핵심 정보를 파악하도록 title/content/metadata 분기.
    const guestExpLabel = isGuest ? experienceLabel(body.experience_years) : null;
    createNotification({
      userId: game.organizer_id,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_RECEIVED,
      title: isGuest ? "새 게스트 지원" : "새 참가 신청",
      content: isGuest
        ? `${applicant?.nickname ?? "지원자"}님이 "${game.title}"에 게스트로 지원했습니다 (${body.position}, 구력 ${guestExpLabel}).`
        : `${applicant?.nickname ?? "참가자"}님이 "${game.title}"에 참가 신청했습니다.`,
      actionUrl: `/games/${game.uuid?.slice(0, 8) ?? game.id}`,
      notifiableType: "game",
      notifiableId: game.id,
      metadata: {
        applicant: {
          id: ctx.userId.toString(),
          name: applicant?.name ?? null,
          nickname: applicant?.nickname ?? null,
          phone: applicant?.phone ?? null,
          // 게스트 신청은 본문에서 받은 포지션을 우선 사용 (프로필 미설정 보완)
          position: isGuest ? body.position : applicant?.position ?? null,
          city: applicant?.city ?? null,
          district: applicant?.district ?? null,
          profile_image: applicant?.profile_image ?? null,
        },
        // 게스트 전용 정보 — 일반 신청에서는 null
        guest: isGuest
          ? {
              is_guest: true,
              position: body.position,
              experience_years: body.experience_years,
              experience_label: guestExpLabel,
              message: body.message ?? null,
              accepted_terms: {
                insurance: body.accepted_terms.insurance,
                cancel: body.accepted_terms.cancel,
              },
            }
          : null,
      },
    }).catch(() => {});

    // 9. 신청자에게 신청 완료 알림 발송 (fire-and-forget)
    // 게스트면 별도 안내 문구 (호스트 승인 + 결제/약관 흐름 강조)
    createNotification({
      userId: ctx.userId,
      notificationType: NOTIFICATION_TYPES.GAME_APPLICATION_SUBMITTED,
      title: isGuest ? "게스트 지원 완료" : "참가 신청 완료",
      content: isGuest
        ? `"${game.title}" 경기에 게스트 지원이 완료되었습니다. 호스트 승인 후 확정됩니다.`
        : `"${game.title}" 경기에 참가 신청이 완료되었습니다. 호스트 승인 후 확정됩니다.`,
      actionUrl: `/games/${game.uuid?.slice(0, 8) ?? game.id}`,
      notifiableType: "game",
      notifiableId: game.id,
    }).catch(() => {});

    return apiSuccess({ success: true, message: "참가 신청이 완료되었습니다." });
  } catch {
    return apiError("참가 신청 중 오류가 발생했습니다.", 500);
  }
});
