/**
 * 2026-05-16 PR-G5.8 swiss generator — DB INSERT 영역 (idempotent 가드 포함).
 *
 * 도메인 컨텍스트:
 *   PURE 페어링 산출 = swiss-helpers.ts (planSwissRound1 / planSwissNextRound).
 *   본 모듈 = DB INSERT 영역 (generateSwissRound1) + 후속 PR stub (generateSwissNextRound).
 *
 * 옵션 B (PM 결재 — 2026-05-16):
 *   - generateSwissRound1 = 풀구현 (idempotent + match_number 연속 + match_code v4 + bracket_version)
 *   - generateSwissNextRound = 501 stub throw (운영 진입 시점에 별도 PR 박제)
 *   - 사유: swiss = 동적 라운드 생성 특성 / 운영 사용 0 / spec 변경 위험 ↓ 보수적 진입
 *
 * 설계 원칙:
 *   1) plan/generate 분리 (lessons.md §22 의무) — PURE 호출만
 *   2) 운영 회귀 0 — 신규 함수만 / 기존 single_elim/dual/NBA-seed 분기 영향 0
 *   3) idempotent 가드 — 기존 swiss 매치 0건 검증 (NBA-seed 패턴 동일)
 *   4) match_number 연속성 — 리그 매치와 연속 (lastMatch+1 부터)
 *   5) match_code v4 자동 부여 — applyMatchCodeFields 호출 (NBA-seed 패턴 동일)
 *
 * 사용처:
 *   - bracket/route.ts POST 의 format === "swiss" 분기 (R1 박제)
 *   - admin/tournaments/[id]/swiss/next-round/route.ts (R2~ 501 stub — 후속 PR)
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { applyMatchCodeFields } from "@/lib/tournaments/match-code";
import { planSwissRound1, type SwissTeam } from "@/lib/tournaments/swiss-helpers";

// ─────────────────────────────────────────────────────────────────────────
// DB I/O — generateSwissRound1
// ─────────────────────────────────────────────────────────────────────────

/**
 * swiss R1 매치 DB 박제 (idempotent 가드 포함).
 *
 * 흐름:
 *   1) 중복 생성 방지 — 기존 round_number != null 매치 있으면 throw ALREADY_EXISTS
 *   2) ranking 입력 (seedNumber 순) → planSwissRound1 으로 R1 매치 spec 산출
 *   3) match_number = 기존 최댓값 + 1 부터 (리그 매치 연속성)
 *   4) applyMatchCodeFields 로 매치 코드 v4 자동 부여 (NBA-seed 패턴 동일)
 *   5) createMany 일괄 INSERT
 *   6) BYE 매치 (status="bye") — winner_team_id 사후 UPDATE (자동 1승)
 *
 * @param tournamentId 대회 ID
 * @param ranking      seedNumber 순 정렬된 팀 목록
 * @returns 생성된 매치 수 (BYE 포함)
 *
 * @throws ALREADY_EXISTS — 기존 매치 있을 때
 * @throws TEAMS_INSUFFICIENT — 2팀 미만일 때
 */
export async function generateSwissRound1(
  tournamentId: string,
  ranking: SwissTeam[],
): Promise<number> {
  // 1) 중복 생성 방지 (NBA-seed 패턴 동일 가드)
  const existing = await prisma.tournamentMatch.count({
    where: { tournamentId, round_number: { not: null } },
  });
  if (existing > 0) {
    throw Object.assign(new Error("ALREADY_EXISTS"), {
      code: "ALREADY_EXISTS",
      existing,
    });
  }

  if (ranking.length < 2) {
    throw Object.assign(
      new Error("스위스 라운드 생성에 필요한 팀이 부족합니다 (최소 2팀)."),
      { code: "TEAMS_INSUFFICIENT" },
    );
  }

  // 2) seedNumber UPDATE — 시드 뱃지 표시용 (NBA-seed 패턴 동일)
  // 사유: TournamentTeam.seedNumber 는 caller (bracket route) 가 산출 후 본 함수에 ranking 으로 전달
  //       UI 표시용 영구 박제는 본 함수에서 수행
  for (const r of ranking) {
    await prisma.tournamentTeam.update({
      where: { id: r.tournamentTeamId },
      data: { seedNumber: r.seedNumber },
    });
  }

  // 3) match_number 시작값 — 리그 매치와 연속 (NBA-seed 패턴 동일)
  const lastMatch = await prisma.tournamentMatch.findFirst({
    where: { tournamentId },
    orderBy: { match_number: "desc" },
    select: { match_number: true },
  });
  const startMatchNumber = (lastMatch?.match_number ?? 0) + 1;

  // 4) plan PURE 호출 — DB I/O 0 / R1 매치 spec 산출
  const { matches, byeTeamIds } = planSwissRound1({
    teamCount: ranking.length,
    seedingTeams: ranking,
    startMatchNumber,
  });

  // 5) PlannedSwissMatch → Prisma createMany payload 변환
  // 사유: swiss = 실팀 INSERT 만 (placeholder-helpers 라벨 미박제 — 도메인 결정)
  //       BYE 매치도 status="bye" + winner_team_id (homeTeamId) 사후 UPDATE
  const matchData: Prisma.TournamentMatchCreateManyInput[] = matches.map((m) => ({
    tournamentId,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    round_number: m.round_number,
    bracket_position: m.bracket_position,
    roundName: m.roundName,
    match_number: m.match_number,
    // BYE 매치는 winner_team_id = homeTeamId 자동 박제 (사후 UPDATE 회피)
    ...(m.status === "bye" && m.homeTeamId
      ? { winner_team_id: m.homeTeamId }
      : {}),
    // settings = JsonNull (swiss = placeholder-helpers 라벨 미박제 — 운영 정합)
    settings: Prisma.JsonNull,
  }));

  // 6) 매치 코드 v4 자동 부여 (NBA-seed 패턴 동일)
  const tournamentMeta = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: {
      short_code: true,
      region_code: true,
      categories: true,
      startDate: true,
    },
  });
  const matchDataWithCode = tournamentMeta
    ? applyMatchCodeFields(matchData, tournamentMeta)
    : matchData;

  // 7) 일괄 INSERT
  await prisma.tournamentMatch.createMany({ data: matchDataWithCode });

  // 8) byeTeamIds 가 있으면 caller 가 standings 계산 시 자동 1승 반영 가능
  //    (status="bye" + winner_team_id 박제로 충분 — 후속 처리 불필요)
  void byeTeamIds; // noop — 향후 디버깅 / 검증용 (lint suppress)

  return matchData.length;
}

// ─────────────────────────────────────────────────────────────────────────
// DB I/O — generateSwissNextRound (501 STUB — 옵션 B)
// ─────────────────────────────────────────────────────────────────────────

/**
 * swiss R2~ 매치 DB 박제 — **501 STUB (옵션 B)**.
 *
 * ⚠️ 본 함수는 PR-G5.8 옵션 B 결정 (2026-05-16) 에 따라 미구현 stub.
 *   사유:
 *     1) 운영 사용 0 — swiss tournament 운영 진입 사례 미존재
 *     2) spec 변경 위험 ↓ — 운영 진입 시점에 실제 요구사항 확정 후 박제
 *     3) PURE 페어링 (planSwissNextRound) 는 박제 완료 → vitest 검증 가능
 *     4) endpoint skeleton (501 응답) 도 박제 → 향후 PR 진입점 명확화
 *
 * 운영 진입 시 박제 흐름 (후속 PR):
 *   1) 이전 라운드 종료 검증 (모든 R(N-1) 매치 status="completed")
 *   2) getSwissStandings 헬퍼 호출 — wins/losses/buchholz/pointDiff/opponentIds 산출
 *   3) planSwissNextRound 호출 — R(N) 페어링 산출
 *   4) match_number 연속 + match_code v4 + createMany
 *   5) BYE 자동 1승 처리
 *   6) bracket_version 박제
 *
 * @throws Error — 항상 throw (501 응답 신호)
 */
export async function generateSwissNextRound(
  tournamentId: string,
  roundNumber: number,
): Promise<number> {
  void tournamentId;
  void roundNumber;
  throw new Error(
    "PR-G5.8 후속 PR — generateSwissNextRound 미구현 (운영 진입 시점에 박제). " +
      "현재 옵션 B 결정으로 PURE 페어링 (planSwissNextRound) 만 박제됨.",
  );
}
