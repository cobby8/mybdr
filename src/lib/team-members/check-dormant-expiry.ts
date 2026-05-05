// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 2 PR8 — 휴면 (dormant) 만료 lazy 복구 helper
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 미묘 룰 #2 (보고서 §2-1, §8) — cron 운영 비용 회피를 위해 본인 멤버십이
//   조회되는 시점에만 dormant→active 복귀를 시도. cron 미운영 + 운영 부하 0.
// 호출 위치 (본인 시야 진입점만 — 운영 부하 회피 핵심):
//   - `src/app/(web)/teams/[id]/page.tsx` SSR 본인 멤버 분기
//   - `src/app/(web)/profile/page.tsx` SSR teamMembers 조회 직후
// 운영 부하 회피 설계:
//   1. 본인 멤버십 SELECT 1회 (status='dormant' AND userId=self 만)
//   2. 가장 최근 'dormant' history payload.until 추출 (teamId+userId+eventType IN ['dormant'])
//   3. until < now AND payload.until 유효 → 트랜잭션으로 status='active' UPDATE +
//      history INSERT (eventType='reactivated' / payload {prevUntil, autoExpired:true})
//   4. 그 외 모든 경우 (active / dormant 이지만 until 미도래 / history 손상) → 변경 0
// ⚠ 호출자 책임: 본인 시야에서만 호출 (다른 사용자의 dormant 자동 복귀를 우회 트리거하지 X).
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/prisma";

/**
 * 본인 멤버십이 dormant 이고 가장 최근 'dormant' history.payload.until 이 지났으면
 * 자동으로 status='active' 로 복귀시킨다.
 *
 * @param teamId — 팀 ID
 * @param userId — 본인 사용자 ID (시야 가드 — 호출자가 세션 본인임을 보장)
 * @returns 복귀가 발생했으면 true, 아니면 false
 *
 * 운영 부하: SELECT 2회 + 조건 만족 시만 트랜잭션 1회. 평균 호출당 SELECT 1~2회.
 */
export async function checkAndExpireDormant(
  teamId: bigint,
  userId: bigint,
): Promise<boolean> {
  // 1) 본인 멤버 dormant 여부 — 1차 가드 (대다수 active 회원은 여기서 종료)
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, status: "dormant" },
    select: { id: true },
  });
  if (!member) return false;

  // 2) 가장 최근 'dormant' history 조회 — payload.until 추출
  // 이유: 휴면 신청이 여러 번 있을 수 있으므로 가장 최근 dormant 만 기준
  const lastDormantHistory = await prisma.teamMemberHistory.findFirst({
    where: { teamId, userId, eventType: "dormant" },
    orderBy: { createdAt: "desc" },
    select: { id: true, payload: true },
  });
  if (!lastDormantHistory) return false; // history 손상 시 자동 복귀 X (수동 처리)

  const payload = lastDormantHistory.payload as { until?: string | null } | null;
  const untilStr = payload?.until ?? null;
  if (!untilStr) return false; // until 미설정 시 자동 복귀 X

  const untilDate = new Date(untilStr);
  if (Number.isNaN(untilDate.getTime())) return false;

  const now = new Date();
  if (untilDate.getTime() > now.getTime()) return false; // 아직 만료 전

  // 3) 만료 — 트랜잭션으로 status='active' UPDATE + history 'reactivated' INSERT
  // 이유: 부분 실패 시 일관성 보장. status 만 바뀌고 history 누락되면 재만료 시 추적 불가.
  try {
    await prisma.$transaction([
      prisma.teamMember.updateMany({
        where: { teamId, userId, status: "dormant" },
        data: { status: "active" },
      }),
      prisma.teamMemberHistory.create({
        data: {
          teamId,
          userId,
          eventType: "reactivated",
          payload: {
            prevStatus: "dormant",
            prevUntil: untilStr,
            autoExpired: true,
            sourceHistoryId: lastDormantHistory.id.toString(),
          },
          reason: null,
          createdById: null, // 시스템 자동 처리
        },
      }),
    ]);
    return true;
  } catch {
    // 동시 다발 호출 / 다른 흐름 (강제 변경 등) 충돌 시 silent fail — 다음 진입에서 재시도
    return false;
  }
}
