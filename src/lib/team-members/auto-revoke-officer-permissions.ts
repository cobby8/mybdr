// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 4 PR12 — captain 변경 시 운영진 권한 자동 회수 (미묘 룰 #4)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): captain 이 바뀌면 (이적/탈퇴/위임 변경) 기존 captain 이 위임한 권한은
//   더 이상 유효 X — 새 captain 이 자기 기준으로 다시 위임해야 함 (보고서 §8 #4).
// 사용처:
//   - Team.captainId UPDATE 직후 호출 (트랜잭션 안 또는 후처리)
//   - 본 helper 는 단일 작업 (revokedAt UPDATE) — 트랜잭션 외부에서도 호출 가능
//
// 호출 후 알림:
//   - 본 helper 는 알림 발송 안 함 (호출자 책임 — captain 변경 컨텍스트별로 메시지 분기)
//   - 또는 호출자가 본 helper 결과 (수정된 row 수) 받아서 별도 발송
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/prisma";
import { createNotification } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";

/**
 * 본 팀의 모든 활성 운영진 권한 (revokedAt IS NULL) 을 일괄 회수 (revokedAt = now()).
 * @returns 회수된 row 수
 */
export async function autoRevokeOfficerPermissions(
  teamId: bigint,
  options?: { silent?: boolean; teamName?: string },
): Promise<number> {
  const now = new Date();

  // 회수 대상 미리 조회 — 알림 발송 후 일괄 UPDATE
  const targets = await prisma.teamOfficerPermissions.findMany({
    where: { teamId, revokedAt: null },
    select: { id: true, userId: true },
  });

  if (targets.length === 0) return 0;

  // 일괄 회수 (UPDATE)
  await prisma.teamOfficerPermissions.updateMany({
    where: { teamId, revokedAt: null },
    data: { revokedAt: now },
  });

  // 알림 — 위임받은 자들에게 일괄 통보 (silent fail)
  // silent=true 면 알림 skip (호출자가 다른 알림 채널로 처리하는 경우)
  if (!options?.silent) {
    const teamName = options?.teamName ?? "팀";
    for (const t of targets) {
      createNotification({
        userId: t.userId,
        notificationType: NOTIFICATION_TYPES.TEAM_OFFICER_PERMISSION_REVOKED,
        title: `[${teamName}] 운영진 권한 자동 회수`,
        content: `팀장 변경에 따라 모든 운영진 권한이 자동으로 회수되었습니다.`,
        actionUrl: `/teams/${teamId}`,
        notifiableType: "team_officer_permissions",
        notifiableId: t.id,
      }).catch(() => {});
    }
  }

  return targets.length;
}
