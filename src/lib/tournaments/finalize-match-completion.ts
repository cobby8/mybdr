/**
 * 매치 종료 통합 헬퍼 — 2026-05-16 영구 fix (PR-G5.5-followup-B).
 *
 * 컨텍스트 (errors.md "sync path 헬퍼 우회 lessons" 5회째 회귀):
 *   매치 status='completed' UPDATE path 5종 (admin PATCH / Flutter sync 단건 /
 *   batch-sync / score-sheet BFF / Flutter v1 status PATCH) 마다 post-process
 *   호출 누락/중복/순서 불일치 → 강남구 i3-U9 standings=0 사고 (2026-05-16) 등 재발.
 *
 * 해결 (옵션 B — 단일 통합 헬퍼):
 *   본 헬퍼 = 모든 매치 종료 path 가 호출하는 단일 source 박제.
 *   신규 path 박제 시 본 헬퍼 1줄 호출만 추가 = 6회째 회귀 영구 차단.
 *
 * 동작 (match-sync.ts:622~748 post-process 블록 100% 그대로 추출 — 회귀 0):
 *   1. updateTeamStandings (sequential — placeholder advancer 가 ranking 의존)
 *   2. advanceWinner (single-elim) OR progressDualMatch (dual_tournament)
 *   3. advanceDivisionPlaceholders (divisionCode 있음) OR advanceTournamentPlaceholders
 *      (없음 + division_rule=0 — 4차 뉴비리그 패턴)
 *   4. checkAndAutoCompleteTournament (모든 매치 종료 시 tournament 자동 종료)
 *
 * 단계 2~4 = Promise.allSettled 병렬 (standings 박제 후 ranking 기반 매핑 안전).
 *
 * ⚠️ caller 책임:
 *   - 본 헬퍼 자체는 idempotent 아님 — 같은 매치 두 번 호출하면 standings 두 번 increment.
 *   - caller (admin PATCH route 등) 에서 alreadyCompleted 가드 의무.
 *   - 단, match-sync.ts service path 는 자체 가드 (existing.status === "completed" 분기 skip) 보유.
 *
 * ⚠️ triggerMatchBriefPublish (알기자 자동 발행) 는 본 헬퍼 미포함:
 *   - 사유: status 전환 시점 (existing.status !== "completed") 검증 필요.
 *   - 기존 caller (match-sync.ts L475 / match.ts L482 / batch-sync L78) 에서 그대로 호출 유지.
 */

import { prisma } from "@/lib/db/prisma";
import { advanceWinner, updateTeamStandings } from "@/lib/tournaments/update-standings";
import { progressDualMatch } from "@/lib/tournaments/dual-progression";
import {
  advanceDivisionPlaceholders,
  advanceTournamentPlaceholders,
} from "@/lib/tournaments/division-advancement";
import { checkAndAutoCompleteTournament } from "@/lib/tournaments/auto-complete";

/**
 * 매치 종료 path 식별자 — 사고 추적성 (audit log / warning context).
 */
export type FinalizeMatchCaller =
  | "match-sync-service" // match-sync.ts (Flutter sync 단건 / 웹 BFF 경유)
  | "admin-patch" // admin PATCH route
  | "flutter-batch-sync" // Flutter v1 batch-sync route
  | "flutter-status-patch" // Flutter v1 /matches/:id/status PATCH (updateMatchStatus)
  | "web-score-sheet"; // 웹 종이 기록지 BFF (현재 match-sync-service 경유 — 미사용)

export interface FinalizeMatchCompletionOptions {
  /**
   * dual_tournament 분기에서 사용할 winner_team_id.
   * undefined → 헬퍼 내부에서 SELECT (idempotent — 이미 박제된 winner_team_id 그대로 사용).
   */
  winnerTeamId?: bigint | null;
}

export interface FinalizeMatchCompletionResult {
  matchId: string; // BigInt → string (응답 직렬화 안전)
  tournamentId: string;
  status: "ok" | "partial_failure";
  warnings: string[];
  // 진단용 — 분기/실행 흐름 추적 (Phase 1 vs Phase 2~4 어느 단계 실패인지)
  steps: {
    standings: "ok" | "failed" | "skipped";
    advance: "winner" | "dual" | "skipped" | "failed";
    placeholder: "division" | "tournament" | "skipped" | "failed";
    autoComplete: "ok" | "failed" | "no-change";
  };
}

/**
 * 매치 종료 통합 헬퍼.
 *
 * @param matchId - 매치 ID (BigInt)
 * @param tournamentId - 매치가 속한 대회 UUID
 * @param caller - 호출자 식별 (사고 추적용 — 로그 prefix 박제)
 * @param options - winnerTeamId override (caller 가 이미 결정한 값 전달 가능)
 */
export async function finalizeMatchCompletion(
  matchId: bigint,
  tournamentId: string,
  caller: FinalizeMatchCaller,
  options: FinalizeMatchCompletionOptions = {},
): Promise<FinalizeMatchCompletionResult> {
  const warnings: string[] = [];
  const steps: FinalizeMatchCompletionResult["steps"] = {
    standings: "skipped",
    advance: "skipped",
    placeholder: "skipped",
    autoComplete: "no-change",
  };
  const logPrefix = `[finalize-match:${caller}] matchId=${matchId.toString()}`;

  // ─────────────────────────────────────────────────────────────────────
  // 단계 1: updateTeamStandings sequential
  //   사유: 후속 placeholder advancer 가 wins/point_difference 기반 ranking 매핑 → DB 박제 완료 보장 필수.
  //   match-sync.ts L634~642 동일 (try/catch + warnings 수집).
  // ─────────────────────────────────────────────────────────────────────
  try {
    await updateTeamStandings(matchId);
    steps.standings = "ok";
  } catch (err) {
    console.error(`${logPrefix} updateTeamStandings failed:`, err);
    warnings.push("전적 갱신 실패 — 관리자에게 문의하세요");
    steps.standings = "failed";
  }

  // ─────────────────────────────────────────────────────────────────────
  // 단계 2~4 준비: tournament format + match settings SELECT (분기 결정)
  //   분기:
  //     - tournament.format = "dual_tournament" → progressDualMatch (winnerTeamId 필요)
  //     - 그 외 → advanceWinner (single-elim next_match_id 진출)
  //     - settings.division_code 있음 → advanceDivisionPlaceholders
  //     - 없음 + division_rule=0 → advanceTournamentPlaceholders (4차 뉴비리그 패턴)
  //   match-sync.ts L630/L652~688 동일.
  // ─────────────────────────────────────────────────────────────────────
  const [tournament, matchRow] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { format: true },
    }),
    prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { settings: true, winner_team_id: true },
    }),
  ]);

  const isDual = tournament?.format === "dual_tournament";
  const settingsRaw = (matchRow?.settings ?? {}) as Record<string, unknown>;
  const divisionCode =
    typeof settingsRaw.division_code === "string" ? settingsRaw.division_code : null;
  // caller 가 winnerTeamId 전달 안 했으면 DB 박제값 사용 (idempotent — 이미 service 가 박제 완료)
  const winnerTeamId = options.winnerTeamId ?? matchRow?.winner_team_id ?? null;

  // ─────────────────────────────────────────────────────────────────────
  // 단계 2~4: 병렬 실행 (standings 박제 후 ranking 기반 매핑 안전)
  //   tasks 순서 보존 — cursor 로 결과 추출 (match-sync.ts L695~745 동일).
  // ─────────────────────────────────────────────────────────────────────
  const tasks: Promise<unknown>[] = [];

  // 2-a) advanceWinner OR progressDualMatch
  let advanceKind: "winner" | "dual" | "skipped" = "skipped";
  if (!isDual) {
    tasks.push(advanceWinner(matchId));
    advanceKind = "winner";
  } else if (winnerTeamId) {
    // dual_tournament + winner_team_id 있음 → progressDualMatch (자체 트랜잭션 wrap)
    // 사유: progressDualMatch 는 Prisma.TransactionClient 인자 — caller 가 $transaction 으로 묶음.
    tasks.push(
      prisma.$transaction(async (tx) => {
        await progressDualMatch(tx, matchId, winnerTeamId);
      }),
    );
    advanceKind = "dual";
  }

  // 2-b) placeholder advancer (divisionCode 분기)
  let placeholderKind: "division" | "tournament" | "skipped" = "skipped";
  if (divisionCode) {
    // divisionCode 있음 → advanceDivisionPlaceholders (강남구 i3-U9 등 4 종별 패턴)
    tasks.push(advanceDivisionPlaceholders(prisma, tournamentId, divisionCode));
    placeholderKind = "division";
  } else {
    // divisionCode 없음 → division_rule count 확인
    // ruleCount=0 → advanceTournamentPlaceholders (4차 뉴비리그 등 Tournament 단위)
    // ruleCount>0 → advanceTournamentPlaceholders 호출 X (다른 종별 룰 영향 차단)
    const ruleCount = await prisma.tournamentDivisionRule.count({
      where: { tournamentId },
    });
    if (ruleCount === 0) {
      tasks.push(advanceTournamentPlaceholders(prisma, tournamentId));
      placeholderKind = "tournament";
    }
  }

  // 2-c) 대회 자동 종료 (모든 매치 종료 시 tournament.status='completed' UPDATE)
  //   멱등 (이미 종료 / 매치 0건 / 미완료 매치 1건+ = no-op).
  tasks.push(checkAndAutoCompleteTournament(prisma, tournamentId));

  // 병렬 실행 — Promise.allSettled (한 단계 실패가 다른 단계 차단 X)
  const results = await Promise.allSettled(tasks);

  // cursor 로 결과 매핑 (tasks push 순서 = [advance?, placeholder?, autoComplete])
  let cursor = 0;
  const advanceResult = advanceKind !== "skipped" ? results[cursor++] : null;
  const placeholderResult = placeholderKind !== "skipped" ? results[cursor++] : null;
  const autoCompleteResult = results[cursor++];

  // 결과 평가 + warnings 수집 (match-sync.ts L705~745 동일 패턴)
  if (advanceResult) {
    if (advanceResult.status === "rejected") {
      console.error(
        `${logPrefix} ${advanceKind === "dual" ? "progressDualMatch" : "advanceWinner"} failed:`,
        advanceResult.reason,
      );
      warnings.push(
        advanceKind === "dual"
          ? "듀얼토너먼트 자동 진출 실패 — 관리자에게 문의하세요"
          : "승자 진출 처리 실패 — 관리자에게 문의하세요",
      );
      steps.advance = "failed";
    } else {
      steps.advance = advanceKind;
    }
  }

  if (placeholderResult) {
    if (placeholderResult.status === "rejected") {
      const fnName =
        placeholderKind === "division"
          ? `advanceDivisionPlaceholders (div=${divisionCode})`
          : "advanceTournamentPlaceholders (tournament-level)";
      console.error(`${logPrefix} ${fnName} failed:`, placeholderResult.reason);
      warnings.push("순위전 placeholder 자동 매핑 실패 — 관리자에게 문의하세요");
      steps.placeholder = "failed";
    } else {
      steps.placeholder = placeholderKind;
    }
  }

  if (autoCompleteResult) {
    if (autoCompleteResult.status === "rejected") {
      // 자동 종료 실패는 warnings 미추가 (운영자 노이즈 — 매치 처리 자체와 무관, 수동 종료 가능)
      console.error(
        `${logPrefix} checkAndAutoCompleteTournament failed tournamentId=${tournamentId}:`,
        autoCompleteResult.reason,
      );
      steps.autoComplete = "failed";
    } else if (
      autoCompleteResult.status === "fulfilled" &&
      autoCompleteResult.value &&
      typeof autoCompleteResult.value === "object" &&
      "updated" in autoCompleteResult.value &&
      (autoCompleteResult.value as { updated: boolean }).updated === true
    ) {
      // 자동 종료 trigger 발생 — 로그 박제 (운영 추적용)
      console.log(
        `${logPrefix} auto-completed tournamentId=${tournamentId} reason=${
          (autoCompleteResult.value as { reason?: string }).reason ?? "(none)"
        }`,
      );
      steps.autoComplete = "ok";
    }
  }

  return {
    matchId: matchId.toString(),
    tournamentId,
    status: warnings.length === 0 ? "ok" : "partial_failure",
    warnings,
    steps,
  };
}

