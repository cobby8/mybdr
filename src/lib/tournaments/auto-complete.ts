/**
 * 2026-05-12 — 대회 자동 종료 트리거 (사용자 보고: 결승 끝난 대회 "진행중" 잔존).
 *
 * 배경 (이미지 29):
 *   - "제21회 몰텐배 동호회최강전" = 결승전까지 완료된 매치 / status='in_progress' 잔존
 *   - 운영자가 대회 status 수동 'completed' 변경 빈번히 누락 → 진행률 100% 시 자동 처리 필요
 *
 * 동작:
 *   - 토너먼트의 모든 매치가 종료 상태 (completed / cancelled) 면 tournament.status = 'completed' UPDATE
 *   - match-sync.ts post-process 에서 매번 매치 종료 시 호출 (멱등)
 *   - 매치 수 0 (placeholder/dummy 대회) = no-op
 *   - 이미 종료 상태 (completed/ended/closed/cancelled) = no-op
 *
 * 트리거 시점:
 *   - match-sync 의 post-process (status='completed' 박제 직후, Promise.allSettled 병렬)
 *   - score-sheet submit / Flutter sync route 양쪽 단일 path 통합
 */

import type { Prisma, PrismaClient } from "@prisma/client";

/** 이미 종료 상태로 간주하는 토너먼트 status 후보 (재발 방지). */
const TOURNAMENT_FINAL_STATUSES = ["completed", "ended", "closed", "cancelled"];

/** 매치가 종료 상태로 간주되는 status 후보 (forfeit/walkover 도 포함). */
const MATCH_FINAL_STATUSES = ["completed", "cancelled", "forfeit"];

export interface AutoCompleteResult {
  updated: boolean;
  reason: string;
  finished?: number;
  total?: number;
}

/**
 * 토너먼트의 모든 매치가 종료 상태인지 확인 → 대회 status 자동 'completed' UPDATE.
 *
 * @param client PrismaClient 또는 TransactionClient
 * @param tournamentId Tournament.id (UUID String)
 * @returns { updated, reason } — 트리거 호출자가 logging/audit 박제 가능
 */
export async function checkAndAutoCompleteTournament(
  client: PrismaClient | Prisma.TransactionClient,
  tournamentId: string
): Promise<AutoCompleteResult> {
  // 1. 토너먼트 status 확인 — 이미 종료면 no-op
  const tournament = await client.tournament.findUnique({
    where: { id: tournamentId },
    select: { status: true },
  });
  if (!tournament) {
    return { updated: false, reason: "tournament-not-found" };
  }
  if (TOURNAMENT_FINAL_STATUSES.includes(tournament.status ?? "")) {
    return { updated: false, reason: `already-final-${tournament.status}` };
  }

  // 2. 매치 카운트 (전체 + 종료된 매치)
  const [total, finished] = await Promise.all([
    client.tournamentMatch.count({ where: { tournamentId } }),
    client.tournamentMatch.count({
      where: {
        tournamentId,
        status: { in: MATCH_FINAL_STATUSES },
      },
    }),
  ]);

  if (total === 0) {
    return { updated: false, reason: "no-matches", finished: 0, total: 0 };
  }
  if (finished < total) {
    return {
      updated: false,
      reason: `incomplete-${finished}/${total}`,
      finished,
      total,
    };
  }

  // 3. 100% 완료 → 자동 종료 UPDATE
  await client.tournament.update({
    where: { id: tournamentId },
    data: { status: "completed" },
  });

  return {
    updated: true,
    reason: `auto-completed-${finished}/${total}`,
    finished,
    total,
  };
}
