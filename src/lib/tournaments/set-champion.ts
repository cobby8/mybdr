/**
 * 우승팀 자동 set 유틸 (PR-CHAMPION ① — 2026-06-15)
 *
 * 컨텍스트:
 *   대회가 종료(checkAndAutoCompleteTournament 의 updated:true)되는 순간,
 *   결승 결과(또는 리그 1위)로부터 우승팀을 산출해 tournament.champion_team_id 에 박제한다.
 *
 * ★ FK 주의 (schema 실측):
 *   - tournament.champion_team_id  → **Team.id** 를 참조 (schema L356 fk_rails_18732ad2a6)
 *   - tournament_matches.winner_team_id → **TournamentTeam.id** 를 참조 (schema L749)
 *   - calculateLeagueRanking 의 tournamentTeamId → **TournamentTeam.id**
 *   → 따라서 winner/ranking 으로 얻은 "TournamentTeam.id" 를 그대로 champion 에 넣으면 FK 가 깨진다.
 *     반드시 TournamentTeam.teamId (= Team.id) 로 변환해서 박제한다.
 *
 * 설계 (옵션 B — finalize 통합):
 *   - 판정 로직(isFinalsRound)은 PURE 로 분리 → 테스트 용이.
 *   - resolveChampionTeamId 가 포맷별로 우승 TournamentTeam.id 를 찾아 → teamId 변환 후 반환.
 *   - setTournamentChampion 은 멱등 — 이미 champion 이 박혀 있으면 skip (수동 박제 보호).
 *   - mvp_player_id 는 절대 건드리지 않는다.
 */

import type { PrismaClient } from "@prisma/client";
import { calculateLeagueRanking } from "@/lib/tournaments/tournament-seeding";

/**
 * 결승 라운드명 판정 (PURE).
 *
 * 결승 패턴(소문자 비교): "결승" / "final" / "finals" / "championship".
 * "준결승"(semi-final) 은 "결승" 을 포함하지만, knockout 결승 판정에서는
 * next_match_id 폴백(다음 경기 없음 = 최종전)으로 2차 방어하므로 본 함수는 보조 신호로만 쓴다.
 *
 * @param roundName tournament_matches.round_name (nullable)
 * @returns 결승으로 판정되면 true
 */
export function isFinalsRound(roundName: string | null | undefined): boolean {
  if (!roundName) return false;
  const normalized = roundName.toLowerCase();
  // 결승 패턴 — 하나라도 포함하면 결승 후보
  const patterns = ["결승", "final", "finals", "championship"];
  return patterns.some((p) => normalized.includes(p));
}

/**
 * knockout 계열 format 목록.
 * 결승(최종전) 승자가 우승팀이 되는 포맷.
 */
const KNOCKOUT_FORMATS = new Set([
  "single_elimination",
  "full_league_knockout",
  "group_stage_knockout",
  "dual_tournament",
]);

/**
 * 리그 계열 format 목록.
 * calculateLeagueRanking 1위가 우승팀이 되는 포맷.
 */
const LEAGUE_FORMATS = new Set(["round_robin", "league"]);

/**
 * winner_team_id(=TournamentTeam.id) 를 Team.id 로 변환.
 *
 * 왜 필요한가: champion_team_id 는 Team.id FK 이므로 TournamentTeam.id 를 그대로 넣으면
 *   FK 제약 위반. TournamentTeam → teamId 로 한 단계 변환한다.
 *
 * @returns Team.id (없으면 null)
 */
async function tournamentTeamToTeamId(
  prisma: PrismaClient,
  tournamentTeamId: bigint,
): Promise<bigint | null> {
  const tt = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    select: { teamId: true },
  });
  return tt?.teamId ?? null;
}

/**
 * 우승팀(Team.id)을 포맷별로 산출.
 *
 * 포맷별 전략:
 *   - knockout 계열: 결승 매치의 winner_team_id → teamId 변환.
 *       1차: roundName 결승 + winner_team_id NOT NULL, scheduledAt desc, take 1
 *       2차(폴백): next_match_id NULL + winner_team_id NOT NULL + round_number 최대 (최종전)
 *   - 리그 계열(round_robin/league): calculateLeagueRanking rank===1 의 tournamentTeamId → teamId 변환.
 *   - group_stage(다조): 우승 정의 불명(조 우승 다수) → null 보류.
 *   - 그 외 알 수 없는 포맷: null.
 *
 * @returns 우승팀 Team.id (산출 불가 시 null)
 */
export async function resolveChampionTeamId(
  prisma: PrismaClient,
  tournamentId: string,
  format: string | null | undefined,
): Promise<bigint | null> {
  // ── knockout 계열 ──────────────────────────────────────────────────────
  if (format && KNOCKOUT_FORMATS.has(format)) {
    // 1차: roundName 이 결승 패턴 + 승자 박제된 매치 (최신 scheduledAt 우선)
    const finalsMatches = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        winner_team_id: { not: null },
      },
      select: {
        winner_team_id: true,
        roundName: true,
        round_number: true,
        next_match_id: true,
        scheduledAt: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    // 1차 시도: roundName 이 결승 패턴인 것 중 가장 최근 (scheduledAt desc 정렬 유지)
    const byRoundName = finalsMatches.find((m) => isFinalsRound(m.roundName));
    if (byRoundName?.winner_team_id) {
      return tournamentTeamToTeamId(prisma, byRoundName.winner_team_id);
    }

    // 2차 폴백: next_match_id 가 null(다음 경기 없음 = 최종전) 인 매치 중 round_number 최대
    //   roundName 이 안 박힌 수동/구버전 매치 대응.
    const finalCandidates = finalsMatches.filter((m) => m.next_match_id === null);
    if (finalCandidates.length > 0) {
      // round_number 최대 = 가장 마지막 라운드 (null 은 -Infinity 취급해 뒤로)
      const sorted = [...finalCandidates].sort(
        (a, b) => (b.round_number ?? -Infinity) - (a.round_number ?? -Infinity),
      );
      const top = sorted[0];
      if (top?.winner_team_id) {
        return tournamentTeamToTeamId(prisma, top.winner_team_id);
      }
    }

    // 결승 승자 산출 불가
    return null;
  }

  // ── 리그 계열 (round_robin / league) ───────────────────────────────────
  if (format && LEAGUE_FORMATS.has(format)) {
    const ranking = await calculateLeagueRanking(tournamentId);
    // rank === 1 (1위) 의 tournamentTeamId → teamId 변환
    const first = ranking.find((r) => r.rank === 1);
    if (first) {
      return tournamentTeamToTeamId(prisma, first.tournamentTeamId);
    }
    return null;
  }

  // ── group_stage 다조 / 알 수 없는 포맷 → 보류 ──────────────────────────
  //   조 우승이 다수라 단일 우승팀 정의 불명 → null (수동 결정 영역).
  return null;
}

/**
 * 대회 우승팀 자동 박제 (멱등).
 *
 * 동작:
 *   1. tournament 조회 — 이미 champion_team_id NOT NULL 이면 skip (멱등 · 수동 박제 보호).
 *   2. format 조회 → resolveChampionTeamId 로 우승 Team.id 산출.
 *   3. 값이 있으면 tournament.update({ champion_team_id }). (값 없으면 no-op)
 *   4. mvp_player_id 는 절대 건드리지 않는다.
 *
 * @returns 결과 객체 — skipped/set/no-champion 구분 + championTeamId(string|null)
 */
export async function setTournamentChampion(
  prisma: PrismaClient,
  tournamentId: string,
): Promise<{
  status: "skipped" | "set" | "no-champion" | "not-found";
  championTeamId: string | null;
}> {
  // tournament 조회 — champion 기존값 + format 동시
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { champion_team_id: true, format: true },
  });

  if (!tournament) {
    return { status: "not-found", championTeamId: null };
  }

  // 멱등: 이미 우승팀 박제됨 → skip (수동 박제/재실행 보호)
  if (tournament.champion_team_id !== null) {
    return { status: "skipped", championTeamId: tournament.champion_team_id.toString() };
  }

  // 포맷별 우승팀 Team.id 산출
  const championTeamId = await resolveChampionTeamId(prisma, tournamentId, tournament.format);

  // 산출 불가(결승 미정/다조 보류 등) → no-op
  if (championTeamId === null) {
    return { status: "no-champion", championTeamId: null };
  }

  // 우승팀 박제 — champion_team_id 만 UPDATE (mvp 미접촉)
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: { champion_team_id: championTeamId },
  });

  return { status: "set", championTeamId: championTeamId.toString() };
}
