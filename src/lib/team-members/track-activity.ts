// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 5 PR14 — 팀 멤버 활동 추적 helper (last_activity_at 갱신)
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 보고서 §3 (유령회원 시스템) + 미묘 룰 #3 (5분 throttle).
//   본 helper 가 단일 진입점 → 5종 호출 위치에서 fire-and-forget 으로 호출.
//   - 활동 정의 (§3-2): 팀 페이지 접속 / 대회 출전 / 매치 통계 기록 / 게시판 활동 / 로그인.
//
// 운영 부하 회피 설계 (필수):
//   1. 5분 throttle — 마지막 갱신 < 5분이면 SELECT 만 하고 종료 (UPDATE skip)
//   2. 단일 SELECT + 조건부 UPDATE — 평균 호출 = SELECT 1회, 5분에 한 번만 UPDATE
//   3. fire-and-forget — 활동 추적 실패가 본 흐름을 막지 않음 (호출자가 .catch(noop) 책임)
//   4. UPDATE 실패 silent — 동시 다발 호출 / 다른 흐름 충돌 시 다음 호출에서 재시도
//
// 호출 위치 5종 (보고서 §3-2):
//   1. 팀 페이지 접속 — `(web)/teams/[id]/page.tsx` SSR (본인이 active 멤버일 때)
//   2. 대회 출전 — `api/web/tournaments/[id]/join/route.ts` ttp INSERT 시 (player 별)
//   3. 매치 통계 기록 — `api/v1/matches/[id]/stats/route.ts` POST (Flutter 운영자만 통과 — 의의: 운영자 본인 활동도 추적)
//   4. 게시판 활동 — `api/web/community/route.ts` POST (해당 user 의 모든 active 팀)
//   5. 로그인/마이페이지 — `(web)/profile/page.tsx` SSR (모든 본인 active 팀)
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/prisma";

// 5분 throttle 상수 — 미묘 룰 #3 (보고서 §8)
const THROTTLE_MS = 5 * 60 * 1000;

/**
 * 본인 (team, user) 의 last_activity_at 을 갱신한다.
 *
 * 운영 부하: 평균 SELECT 1회 (대다수 5분 내 재호출). 5분 경계에서만 UPDATE 1회.
 *
 * @param teamId — 팀 ID
 * @param userId — 사용자 ID (본인 시야 보장은 호출자 책임)
 * @returns 갱신 발생 여부 (true=UPDATE 실행 / false=throttle 또는 미가입)
 */
export async function trackTeamMemberActivity(
  teamId: bigint,
  userId: bigint,
): Promise<boolean> {
  try {
    // 1) 멤버십 + 마지막 활동 시각 조회 — 단일 SELECT
    // status 는 'active' 만 — withdrawn/dormant 멤버 활동은 추적 X (보고서 §3 정의)
    const member = await prisma.teamMember.findFirst({
      where: { teamId, userId, status: "active" },
      select: { id: true, last_activity_at: true },
    });
    if (!member) return false;

    // 2) 5분 throttle — 마지막 갱신이 5분 내면 skip (운영 부하 회피)
    const now = Date.now();
    if (member.last_activity_at && now - member.last_activity_at.getTime() < THROTTLE_MS) {
      return false;
    }

    // 3) 갱신 — UPDATE 실패 silent (동시 다발 호출 충돌 등)
    await prisma.teamMember.update({
      where: { id: member.id },
      data: { last_activity_at: new Date(now) },
    });
    return true;
  } catch {
    // fire-and-forget — 호출자도 .catch(noop) 패턴 권장. 본 helper 가 한번 더 안전망.
    return false;
  }
}

/**
 * 본인 모든 active 팀의 활동 시각을 일괄 갱신한다.
 * 호출 위치 — `profile/page.tsx` SSR (로그인 후 본인 마이페이지 진입 시 모든 팀 갱신).
 *
 * 운영 부하: 평균 SELECT 1회 (멤버십 조회) + 5분 경계에서만 UPDATE.
 */
export async function trackTeamMemberActivityForUser(userId: bigint): Promise<void> {
  try {
    // 본인의 모든 active 멤버십 + last_activity_at 일괄 조회
    const members = await prisma.teamMember.findMany({
      where: { userId, status: "active" },
      select: { id: true, last_activity_at: true },
    });
    if (members.length === 0) return;

    const now = Date.now();
    const stale = members
      .filter(
        (m) => !m.last_activity_at || now - m.last_activity_at.getTime() >= THROTTLE_MS,
      )
      .map((m) => m.id);
    if (stale.length === 0) return;

    // updateMany — 한 쿼리로 갱신
    await prisma.teamMember.updateMany({
      where: { id: { in: stale } },
      data: { last_activity_at: new Date(now) },
    });
  } catch {
    // silent — 다음 진입에서 재시도
  }
}
