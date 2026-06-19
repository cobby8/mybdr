import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

// M2(매칭 대기열) — 빈자리 트리거 공통 헬퍼.
//
// 언제 호출하나(왜):
//   승인 참가자(status=1)가 점유하던 자리가 비었을 때 = 호스트 거절(1→2) / 본인취소(status=1 취소).
//   호스트 경기 취소(status=4)는 경기 자체가 사라지므로 트리거 대상 아님(스펙 §5).
//
// 무엇을 하나:
//   해당 game 의 대기(status=3) 신청 중 가장 앞 순번(waitlist_position 최소, 아직 미승격) 1명을 골라
//   promotion_deadline = now()+30분 으로 set 하고 GAME_WAITLIST_PROMOTED 알림을 보낸다.
//   ★자동승인 금지 — status 는 3(대기) 그대로 유지. 실제 확정은 confirm API 에서.
//
// 동시성(왜 tx 안에서 돌리나):
//   자리 해제(거절/취소)와 같은 $transaction 안에서 실행하도록 tx 클라이언트를 받는다.
//   또한 "이미 승격 진행 중(promotion_deadline 이 살아있는)" 대기자는 후보에서 제외하여
//   두 개의 좌석 해제가 동시에 일어나도 같은 대기자를 중복 승격하지 않는다.
//
// 알림은 트랜잭션 커밋 이후 fire-and-forget 로 쏘기 위해, 승격 대상 정보를 반환한다.
//   (트랜잭션 안에서 알림을 보내면 롤백 시 유령 알림이 남으므로 분리.)

const PROMOTION_WINDOW_MS = 30 * 60 * 1000; // 승격 확정 마감 = 30분

// 트랜잭션 클라이언트 또는 일반 prisma 어느 쪽이든 받을 수 있도록 최소 타입만 요구
type Db = Prisma.TransactionClient | PrismaClient;

export interface PromotionResult {
  /** 새로 승격 안내한 대기자 user_id (없으면 null) */
  promotedUserId: bigint;
  /** 승격된 신청 application id */
  applicationId: bigint;
  deadline: Date;
}

/**
 * game 의 대기열 1번을 승격 후보로 지정(promotion_deadline set)한다.
 * - 승격할 대기자가 없으면 null 반환.
 * - status 는 3(대기) 유지 — 자동승인 안 함.
 * - 알림 발송은 caller 가 커밋 후 sendPromotionNotice() 로 수행.
 */
export async function promoteNextWaitlist(
  db: Db,
  gameId: bigint
): Promise<PromotionResult | null> {
  const now = new Date();
  const deadline = new Date(now.getTime() + PROMOTION_WINDOW_MS);

  // 1) 대기(status=3) 중 아직 승격 진행 중이 아닌(=promotion_deadline 만료 또는 NULL) 가장 앞 순번 1명.
  //    이유: 이미 살아있는 deadline 을 가진 대기자는 현재 승격 진행 중 → 중복 승격 방지로 제외.
  const candidate = await db.game_applications.findFirst({
    where: {
      game_id: gameId,
      status: 3,
      OR: [{ promotion_deadline: null }, { promotion_deadline: { lt: now } }],
    },
    orderBy: { waitlist_position: "asc" },
    select: { id: true, user_id: true },
  });
  if (!candidate) return null;

  // 2) 마감시각 set (status 는 3 유지). 동시성 안전: id 단건 + status=3 조건부 UPDATE.
  //    조건 불충족(이미 다른 트랜잭션이 처리)이면 0 rows → 승격 무효 처리.
  const updated = await db.game_applications.updateMany({
    where: { id: candidate.id, status: 3 },
    data: { promotion_deadline: deadline, updated_at: now },
  });
  if (updated.count === 0) return null;

  return {
    promotedUserId: candidate.user_id,
    applicationId: candidate.id,
    deadline,
  };
}

/**
 * 승격 안내 알림 발송 (커밋 후 fire-and-forget 용).
 * 이유: 트랜잭션 밖에서 호출해야 롤백 시 유령 알림이 안 남는다.
 */
export function sendPromotionNotice(args: {
  userId: bigint;
  gameId: bigint;
  gameTitle: string | null;
  shortId: string;
  deadline: Date;
}): void {
  createNotification({
    userId: args.userId,
    notificationType: NOTIFICATION_TYPES.GAME_WAITLIST_PROMOTED,
    title: "대기 → 참가 기회",
    content: `"${args.gameTitle ?? "경기"}"에 빈자리가 생겼습니다. 마감 전에 참가를 확정해주세요.`,
    actionUrl: `/games/${args.shortId}`,
    notifiableType: "game",
    notifiableId: args.gameId,
  }).catch(() => {});
}

/**
 * 트랜잭션 밖 단독 호출용 래퍼 — confirm API 만료 시 다음 순번 재발동에 사용.
 * 일반 prisma 로 승격 + 알림까지 한 번에 처리.
 */
export async function triggerWaitlistPromotion(args: {
  gameId: bigint;
  gameTitle: string | null;
  shortId: string;
}): Promise<PromotionResult | null> {
  const result = await promoteNextWaitlist(prisma, args.gameId);
  if (result) {
    sendPromotionNotice({
      userId: result.promotedUserId,
      gameId: args.gameId,
      gameTitle: args.gameTitle,
      shortId: args.shortId,
      deadline: result.deadline,
    });
  }
  return result;
}

/**
 * confirm 만료 처리 — 만료한 대기자를 "다음 순번" 으로 강등 후 재선출.
 *
 * 왜 필요한가(수정 사유):
 *   기존엔 만료 시 promotion_deadline 만 null 로 정리하고 promoteNextWaitlist 를 호출했다.
 *   그런데 후보 선정이 waitlist_position asc 라서, 만료자가 여전히 최앞 순번이면
 *   "만료 → 다음 순번 승격" 스펙과 달리 본인이 즉시 다시 승격(새 30분)되는 미세 편차가 있었다.
 *   (무한 자기승격 위험 — 30분마다 confirm 안 하면 계속 본인 1번 유지)
 *
 * 무엇을 하나(원자적):
 *   ① 만료 신청을 현재 대기열 최대 순번+1 로 재배치(맨 뒤) + promotion_deadline=null 정리.
 *   ② 그 사이를 채우도록 만료자보다 뒤 순번이던 대기자들을 한 칸씩 당김(연속성 유지).
 *   ①②를 같은 트랜잭션으로 묶어 순번 정합을 보장한다.
 *   이후 promoteNextWaitlist 로 다음 순번(이제 최앞이 된 실제 다음 사람)을 승격한다.
 *
 * @returns 새로 승격된 대기자 정보(없으면 null) — caller 가 알림 발송에 사용.
 */
export async function demoteExpiredAndPromoteNext(args: {
  expiredApplicationId: bigint;
  gameId: bigint;
  gameTitle: string | null;
  shortId: string;
}): Promise<PromotionResult | null> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // 만료자의 현재 순번 조회 (재배치 기준).
    const expired = await tx.game_applications.findUnique({
      where: { id: args.expiredApplicationId },
      select: { waitlist_position: true, status: true },
    });
    // 이미 다른 처리로 대기(status=3)가 아니거나 순번이 없으면 단순 정리만.
    if (!expired || expired.status !== 3 || expired.waitlist_position === null) {
      await tx.game_applications.updateMany({
        where: { id: args.expiredApplicationId, status: 3 },
        data: { promotion_deadline: null, updated_at: now },
      });
      return;
    }

    // 현재 대기열 최대 순번 조회 (맨 뒤 = max).
    const agg = await tx.game_applications.aggregate({
      where: { game_id: args.gameId, status: 3 },
      _max: { waitlist_position: true },
    });
    const maxPos = agg._max.waitlist_position ?? expired.waitlist_position;

    // ② 만료자보다 뒤 순번이던 대기자들을 한 칸씩 당김 (빈 자리 메움).
    await tx.game_applications.updateMany({
      where: {
        game_id: args.gameId,
        status: 3,
        waitlist_position: { gt: expired.waitlist_position },
      },
      data: { waitlist_position: { decrement: 1 } },
    });

    // ① 만료자를 맨 뒤(maxPos)로 재배치 + deadline 정리. (위 당김으로 maxPos 자리가 비었음)
    await tx.game_applications.update({
      where: { id: args.expiredApplicationId },
      data: { waitlist_position: maxPos, promotion_deadline: null, updated_at: now },
    });
  });

  // 재배치 후 이제 최앞이 된 실제 다음 순번을 승격 (만료자는 맨 뒤라 후보에서 자연 제외).
  return triggerWaitlistPromotion({
    gameId: args.gameId,
    gameTitle: args.gameTitle,
    shortId: args.shortId,
  });
}
