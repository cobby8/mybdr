import { prisma } from "@/lib/db/prisma";
import type { NotificationType } from "./types";
import { Prisma } from "@prisma/client";
import { sendPushToUser } from "@/lib/services/push";

interface CreateNotificationInput {
  userId: bigint;
  notificationType: NotificationType;
  title: string;
  content?: string;
  actionUrl?: string;
  actionType?: string;
  metadata?: Prisma.InputJsonValue;
  notifiableType?: string;
  notifiableId?: bigint;
  /** 푸시 알림을 함께 보낼지 여부 (기본: true) */
  sendPush?: boolean;
}

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  // 1) DB에 인앱 알림 저장 (기존 로직 유지)
  await prisma.notifications.create({
    data: {
      user_id: input.userId,
      notification_type: input.notificationType,
      title: input.title,
      content: input.content,
      action_url: input.actionUrl,
      action_type: input.actionType,
      metadata: input.metadata ?? Prisma.JsonNull,
      notifiable_type: input.notifiableType,
      notifiable_id: input.notifiableId,
      status: "unread",
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // 2) 웹 푸시 알림도 함께 전송 (sendPush가 false가 아닌 한)
  // 푸시 실패해도 인앱 알림은 이미 저장됐으므로 에러를 무시한다
  if (input.sendPush !== false) {
    sendPushToUser(
      input.userId,
      input.title,
      input.content ?? "",
      input.actionUrl
    ).catch(() => {
      // 푸시 전송 실패는 조용히 무시 — 인앱 알림은 이미 저장됨
    });
  }
}

export async function createNotificationBulk(
  inputs: CreateNotificationInput[]
): Promise<void> {
  if (inputs.length === 0) return;

  // 1) DB에 일괄 저장
  await prisma.notifications.createMany({
    data: inputs.map((input) => ({
      user_id: input.userId,
      notification_type: input.notificationType,
      title: input.title,
      content: input.content,
      action_url: input.actionUrl,
      action_type: input.actionType,
      metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      notifiable_type: input.notifiableType,
      notifiable_id: input.notifiableId,
      status: "unread",
      created_at: new Date(),
      updated_at: new Date(),
    })),
    skipDuplicates: true,
  });

  // 2) 각 유저에게 푸시 알림도 전송 (sendPush가 false가 아닌 것만)
  const pushTargets = inputs.filter((i) => i.sendPush !== false);
  if (pushTargets.length > 0) {
    Promise.allSettled(
      pushTargets.map((input) =>
        sendPushToUser(
          input.userId,
          input.title,
          input.content ?? "",
          input.actionUrl
        )
      )
    ).catch(() => {
      // 전체 실패 무시
    });
  }
}
