// 매치 시점 jersey 번호 결정 헬퍼 (옵션 C+UI / Phase 1 PR5)
//
// 우선순위 (높음 → 낮음):
//   1) match_player_jersey 의 임시 번호 (해당 매치 + ttp 한정 — W1 라이브 운영자 모달)
//   2) tournament_team_players.jerseyNumber (대회 등록 시점 번호)
//   3) team_members.jersey_number (팀 영구 번호 — fallback, 본 helper 호출자가 SELECT 해서 넘김)
//
// 사용 이유:
//   - 라이브 매치에서 운영자가 임시 변경한 번호가 있으면 그 매치 응답에만 반영 (다른 매치/대회/팀 영구는 그대로)
//   - Flutter v1 응답 스키마(jerseyNumber) 변경 0 — 백엔드만 우선순위 결정 → 자동 정확화
//
// 주의:
//   - team_members.jersey_number 조회는 호출자 책임. (jerseys 도메인 sync 미완성 / scratchpad 5/5 잠재 fix 참조)
//     본 helper 는 호출자가 fallback 으로 넘긴 값만 사용한다.

import { prisma } from "@/lib/db/prisma";

/**
 * 매치 1건 + ttp 1건 단일 조회용. PBP/시즌통계 등 N+1 회피가 어려운 케이스에서만 사용.
 * 다수 ttp 가 한 매치에 속하는 경우는 반드시 `resolveMatchJerseysBatch` 사용.
 *
 * @param matchId tournament_match_id (BigInt)
 * @param ttpId tournament_team_player_id (BigInt)
 * @param fallbackTtpJersey ttp.jerseyNumber 직접 SELECT 한 값 (대회 등록 번호)
 * @param fallbackTeamJersey team_members.jersey_number SELECT 값 (없으면 null)
 */
export async function resolveMatchJersey(
  matchId: bigint,
  ttpId: bigint,
  fallbackTtpJersey: number | null,
  fallbackTeamJersey: number | null,
): Promise<number | null> {
  // match_player_jersey 는 (matchId, ttpId) 복합 unique — single SELECT
  const override = await prisma.matchPlayerJersey.findUnique({
    where: {
      // schema 의 @@unique([tournamentMatchId, tournamentTeamPlayerId], map: "idx_match_player_jersey_unique_player")
      tournamentMatchId_tournamentTeamPlayerId: {
        tournamentMatchId: matchId,
        tournamentTeamPlayerId: ttpId,
      },
    },
    select: { jerseyNumber: true },
  });
  return override?.jerseyNumber ?? fallbackTtpJersey ?? fallbackTeamJersey ?? null;
}

/**
 * 배치 버전 — 매치 1건 + ttp 다수 (PBP/box-score/roster 시 N+1 회피)
 *
 * @returns Map<ttpId, finalJersey> — 각 ttp 별 최종 결정 번호 (null 가능)
 */
export async function resolveMatchJerseysBatch(
  matchId: bigint,
  ttpEntries: Array<{ ttpId: bigint; ttpJersey: number | null; teamJersey: number | null }>,
): Promise<Map<bigint, number | null>> {
  const ttpIds = ttpEntries.map((e) => e.ttpId);

  // 매치 한 건의 모든 임시 번호를 한 번에 SELECT (N+1 회피)
  const overrides = ttpIds.length === 0
    ? []
    : await prisma.matchPlayerJersey.findMany({
        where: {
          tournamentMatchId: matchId,
          tournamentTeamPlayerId: { in: ttpIds },
        },
        select: { tournamentTeamPlayerId: true, jerseyNumber: true },
      });

  // ttpId → override jersey 빠른 lookup 용 Map
  const overrideMap = new Map<bigint, number>(
    overrides.map((o) => [o.tournamentTeamPlayerId, o.jerseyNumber]),
  );

  const result = new Map<bigint, number | null>();
  for (const e of ttpEntries) {
    const ov = overrideMap.get(e.ttpId);
    // 우선순위: override → ttp.jerseyNumber → team_members.jersey_number → null
    result.set(e.ttpId, ov ?? e.ttpJersey ?? e.teamJersey ?? null);
  }
  return result;
}

/**
 * 다중 매치 + 다중 ttp 일괄 처리 (시즌/대회 통계 endpoint 전용)
 *
 * @param entries Array<{ matchId, ttpId, ttpJersey, teamJersey }>
 * @returns Map<`${matchId}:${ttpId}`, finalJersey>
 *
 * 키 형식 = `${matchId}:${ttpId}` (matchId 와 ttpId 가 모두 BigInt 라 직렬화 키 사용)
 */
export async function resolveMatchJerseysMulti(
  entries: Array<{ matchId: bigint; ttpId: bigint; ttpJersey: number | null; teamJersey: number | null }>,
): Promise<Map<string, number | null>> {
  if (entries.length === 0) return new Map();

  // 고유 (matchId, ttpId) 페어만 추출 (중복 stats row 대비)
  const pairKey = (m: bigint, t: bigint) => `${m.toString()}:${t.toString()}`;
  const uniquePairs = new Map<string, { matchId: bigint; ttpId: bigint }>();
  for (const e of entries) {
    uniquePairs.set(pairKey(e.matchId, e.ttpId), { matchId: e.matchId, ttpId: e.ttpId });
  }

  // 모든 매치 한 번에 SELECT — IN 조건으로 묶어서 단일 쿼리
  const matchIds = Array.from(new Set(entries.map((e) => e.matchId.toString()))).map((s) => BigInt(s));
  const ttpIds = Array.from(new Set(entries.map((e) => e.ttpId.toString()))).map((s) => BigInt(s));

  const overrides = await prisma.matchPlayerJersey.findMany({
    where: {
      tournamentMatchId: { in: matchIds },
      tournamentTeamPlayerId: { in: ttpIds },
    },
    select: { tournamentMatchId: true, tournamentTeamPlayerId: true, jerseyNumber: true },
  });

  // (matchId, ttpId) 페어 키 → override jersey 매핑
  const overrideMap = new Map<string, number>(
    overrides.map((o) => [pairKey(o.tournamentMatchId, o.tournamentTeamPlayerId), o.jerseyNumber]),
  );

  const result = new Map<string, number | null>();
  for (const e of entries) {
    const key = pairKey(e.matchId, e.ttpId);
    const ov = overrideMap.get(key);
    result.set(key, ov ?? e.ttpJersey ?? e.teamJersey ?? null);
  }
  return result;
}
