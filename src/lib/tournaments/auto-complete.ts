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
// [KO-9] 결선 매치 카운트 헬퍼 재사용 (KO-1에서 tournament-seeding.ts에 추가됨 — 중복 구현 금지)
import { countKnockoutMatches } from "@/lib/tournaments/tournament-seeding";

/** 이미 종료 상태로 간주하는 토너먼트 status 후보 (재발 방지). */
const TOURNAMENT_FINAL_STATUSES = ["completed", "ended", "closed", "cancelled"];

/**
 * [KO-9 / PURE] "예선 후 결선 별도생성" 구조인 format 목록.
 *
 * 이 두 format은 예선(조별리그/풀리그) 완료 후 결선(knockout)을 별도로 생성한다.
 * 따라서 결선이 아직 생성되지 않은 시점에 예선 매치만 100% 종료되면,
 * total===finished 가 되어 대회가 잘못 자동 종료(completed)된다 → 가드 필요.
 */
const KNOCKOUT_FORMATS = ["full_league_knockout", "group_stage_knockout"];

/**
 * [KO-9 / PURE] format이 "예선 후 결선 별도생성" 구조인지 판정.
 *
 * @param format Tournament.format (null/undefined 가능)
 * @returns KNOCKOUT_FORMATS에 포함되면 true (결선 미생성 가드 대상)
 */
export function isKnockoutFormat(format: string | null | undefined): boolean {
  return KNOCKOUT_FORMATS.includes(format ?? "");
}

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
    select: { status: true, format: true }, // [KO-9] format 추가 — 결선 미생성 가드 판정용
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

  // [KO-9] 결선 미생성 가드:
  //   full_league_knockout/group_stage_knockout 은 예선 완료 후 결선을 별도 생성한다.
  //   결선이 아직 0건인데 예선만 100% 끝나면 total===finished 로 오판해 대회를 자동 종료해버린다.
  //   → 결선 format 인데 결선 매치가 0건이면 자동 종료를 보류(early return)한다.
  //   (결선 없는 format 은 isKnockoutFormat=false → 이 분기를 타지 않아 기존 경로 100% 보존)
  if (isKnockoutFormat(tournament.format) && (await countKnockoutMatches(tournamentId)) === 0) {
    console.warn(
      `[auto-complete] 결선 미생성 — 자동 종료 보류 (tournamentId=${tournamentId}, format=${tournament.format})`
    );
    return { updated: false, reason: "knockout-not-generated", finished, total };
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
