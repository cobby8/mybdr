// 듀얼토너먼트 매치 종료 시 다음 매치 자동 진출 처리
//
// 사용 컨텍스트:
//   matches PATCH route 에서 `status === "completed"` + winner 확정 시 호출 (Phase C).
//   본 함수는 다음 매치의 home/away 슬롯에 winner/loser teamId 를 UPDATE 한다.
//
// 단일 책임 원칙:
//   - 점수/승자 결정: matches PATCH route 가 처리 (winner_team_id UPDATE 등)
//   - 다음 매치 슬롯 채우기: 본 함수가 처리
//   - 점수 atomic 증가: score-updater.ts 가 처리
//
// 자동 진출 매핑은 generator 단계에서 next_match_id / next_match_slot / settings.loserNextMatchId
// / settings.loserNextMatchSlot 에 저장되어 있다 (createMany 후 UPDATE 단계).

import { Prisma } from "@prisma/client";
import { recordMatchAudit } from "./match-audit";

/**
 * 매치 settings JSON 구조 (loser 진출 추적용).
 * generator 단계에서 caller(route) 가 INSERT 후 UPDATE 로 채워야 한다.
 *
 * - winner 진출 = 표준 컬럼 (next_match_id / next_match_slot)
 * - loser 진출 = settings JSON (조별 G1·G2 만 — 패자전으로 진출)
 */
interface DualMatchSettings {
  loserNextMatchId?: string | number | null; // BigInt 직렬화 안전성 위해 string|number 허용
  loserNextMatchSlot?: "home" | "away" | null;
  // 슬롯 라벨도 같이 저장됨 (generator 의 _homeSlotLabel/_awaySlotLabel)
  homeSlotLabel?: string | null;
  awaySlotLabel?: string | null;
  // 다른 필드는 통과 (기존 settings 보존)
  [key: string]: unknown;
}

/**
 * 듀얼토너먼트 매치 종료 시 winner/loser 자동 진출.
 *
 * 동작:
 *   1) 완료된 매치 조회 (next_match_id / next_match_slot / settings / homeTeamId / awayTeamId)
 *   2) loserTeamId 결정 (home/away 중 winner 가 아닌 쪽)
 *   3) winner → next_match_id 의 home/away 슬롯 UPDATE
 *   4) loser → settings.loserNextMatchId 의 home/away 슬롯 UPDATE (있을 때만)
 *
 * 안전성:
 *   - tx 트랜잭션 내에서 호출 권장 (caller 가 점수 UPDATE 와 같은 트랜잭션으로 묶음)
 *   - 다음 매치가 이미 같은 슬롯에 다른 팀이 채워져 있으면 덮어쓴다
 *     (재실행 안전 — 점수 정정 시나리오)
 *   - next_match 가 null 이면 (결승/3·4위전 패자 등) 그냥 skip
 *
 * @param tx - Prisma transaction client
 * @param matchId - 완료된 매치의 id (BigInt)
 * @param winnerTeamId - 승자 팀 id
 * @returns 갱신된 다음 매치들의 정보 (디버깅/로깅용)
 */
export async function progressDualMatch(
  tx: Prisma.TransactionClient,
  matchId: bigint,
  winnerTeamId: bigint,
): Promise<{
  winnerAdvancedTo: { matchId: string; slot: "home" | "away" } | null;
  loserAdvancedTo: { matchId: string; slot: "home" | "away" } | null;
}> {
  // 1) 완료된 매치 조회
  const match = await tx.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      homeTeamId: true,
      awayTeamId: true,
      next_match_id: true,
      next_match_slot: true,
      settings: true,
    },
  });

  if (!match) {
    throw new Error(`progressDualMatch: 매치 ${matchId} 를 찾을 수 없습니다.`);
  }

  // 2) 승자/패자 ID 결정
  // home 또는 away 둘 중 winnerTeamId 와 일치하는 쪽이 winner, 나머지가 loser
  const homeIsWinner = match.homeTeamId === winnerTeamId;
  const awayIsWinner = match.awayTeamId === winnerTeamId;

  if (!homeIsWinner && !awayIsWinner) {
    throw new Error(
      `progressDualMatch: winnerTeamId(${winnerTeamId}) 가 매치 ${matchId} 의 home(${match.homeTeamId}) 또는 away(${match.awayTeamId}) 와 일치하지 않습니다.`,
    );
  }

  const loserTeamId = homeIsWinner ? match.awayTeamId : match.homeTeamId;

  let winnerAdvancedTo: { matchId: string; slot: "home" | "away" } | null = null;
  let loserAdvancedTo: { matchId: string; slot: "home" | "away" } | null = null;

  // 3) 승자 진출 처리
  // next_match_id 와 next_match_slot 둘 다 있어야 진출 가능
  if (match.next_match_id && match.next_match_slot) {
    const winnerSlot = match.next_match_slot as "home" | "away";
    if (winnerSlot !== "home" && winnerSlot !== "away") {
      throw new Error(
        `progressDualMatch: next_match_slot 값이 잘못되었습니다 (${match.next_match_slot}). "home" 또는 "away" 여야 합니다.`,
      );
    }

    // home/away 컬럼 동적 선택 (Prisma 데이터 객체 키)
    const targetField = winnerSlot === "home" ? "homeTeamId" : "awayTeamId";
    const oppositeField = winnerSlot === "home" ? "awayTeamId" : "homeTeamId";

    // 자가 치유 가드 (2026-05-02 errors.md "양쪽 같은 팀" 회귀 방지):
    // next_match 의 반대 슬롯에 이미 같은 winnerTeamId 가 있으면, 잘못된 set 흔적 → NULL 정정
    // (정상 흐름: 같은 팀이 자기 자신과 진출은 dual_tournament 에서 발생 불가)
    const nextMatch = await tx.tournamentMatch.findUnique({
      where: { id: match.next_match_id },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (nextMatch && nextMatch[oppositeField] === winnerTeamId) {
      console.warn(
        `[progressDualMatch] next_match ${match.next_match_id} ${oppositeField} 에 ` +
          `같은 winnerTeamId(${winnerTeamId}) 가 있음 — 잘못된 흔적, NULL 정정`,
      );
      await tx.tournamentMatch.update({
        where: { id: match.next_match_id },
        data: { [oppositeField]: null },
      });
      // audit: 자가 치유 (반대 슬롯 NULL 정정) — source matchId 명시 (추적성)
      await recordMatchAudit(
        tx,
        match.next_match_id,
        { [oppositeField]: nextMatch[oppositeField] },
        { [oppositeField]: null },
        "system",
        `progressDualMatch self-heal (source match ${matchId}, winnerTeamId=${winnerTeamId}, ${oppositeField} NULL 정정)`,
        null,
      );
    }

    await tx.tournamentMatch.update({
      where: { id: match.next_match_id },
      data: { [targetField]: winnerTeamId },
    });
    // audit: winner 진출
    await recordMatchAudit(
      tx,
      match.next_match_id,
      { [targetField]: nextMatch?.[targetField] ?? null },
      { [targetField]: winnerTeamId },
      "system",
      `progressDualMatch winner 진출 (source match ${matchId})`,
      null,
    );

    winnerAdvancedTo = {
      matchId: match.next_match_id.toString(),
      slot: winnerSlot,
    };
  }

  // 4) 패자 진출 처리 (settings.loserNextMatchId 있을 때만)
  // 적용 케이스: 조별 G1·G2 (패자전 진출) / 조별 G3 (조별 최종전 home 진출 — 승자전 패자)
  // 미적용 케이스: 조별 G4·최종전 (탈락) / 8강·4강 (탈락) / 결승
  const settings = (match.settings as DualMatchSettings | null) ?? null;
  const loserNextMatchIdRaw = settings?.loserNextMatchId;
  const loserNextMatchSlot = settings?.loserNextMatchSlot;

  if (loserNextMatchIdRaw != null && loserNextMatchSlot && loserTeamId != null) {
    if (loserNextMatchSlot !== "home" && loserNextMatchSlot !== "away") {
      throw new Error(
        `progressDualMatch: settings.loserNextMatchSlot 값이 잘못되었습니다 (${loserNextMatchSlot}). "home" 또는 "away" 여야 합니다.`,
      );
    }

    // settings 의 BigInt 직렬화 안전성: string/number 모두 BigInt 로 변환
    let loserNextMatchId: bigint;
    try {
      loserNextMatchId = BigInt(loserNextMatchIdRaw);
    } catch {
      throw new Error(
        `progressDualMatch: settings.loserNextMatchId 를 BigInt 로 변환할 수 없습니다 (${loserNextMatchIdRaw}).`,
      );
    }

    const targetField = loserNextMatchSlot === "home" ? "homeTeamId" : "awayTeamId";
    const oppositeField = loserNextMatchSlot === "home" ? "awayTeamId" : "homeTeamId";

    // loser 도 동일 자가 치유 가드
    const loserNextMatch = await tx.tournamentMatch.findUnique({
      where: { id: loserNextMatchId },
      select: { homeTeamId: true, awayTeamId: true },
    });
    if (loserNextMatch && loserNextMatch[oppositeField] === loserTeamId) {
      console.warn(
        `[progressDualMatch] loser_next_match ${loserNextMatchId} ${oppositeField} 에 ` +
          `같은 loserTeamId(${loserTeamId}) 가 있음 — 잘못된 흔적, NULL 정정`,
      );
      await tx.tournamentMatch.update({
        where: { id: loserNextMatchId },
        data: { [oppositeField]: null },
      });
      // audit: 자가 치유 (loser 반대 슬롯 NULL 정정) — source matchId 명시
      await recordMatchAudit(
        tx,
        loserNextMatchId,
        { [oppositeField]: loserNextMatch[oppositeField] },
        { [oppositeField]: null },
        "system",
        `progressDualMatch self-heal loser (source match ${matchId}, loserTeamId=${loserTeamId}, ${oppositeField} NULL 정정)`,
        null,
      );
    }

    await tx.tournamentMatch.update({
      where: { id: loserNextMatchId },
      data: { [targetField]: loserTeamId },
    });
    // audit: loser 진출
    await recordMatchAudit(
      tx,
      loserNextMatchId,
      { [targetField]: loserNextMatch?.[targetField] ?? null },
      { [targetField]: loserTeamId },
      "system",
      `progressDualMatch loser 진출 (source match ${matchId})`,
      null,
    );

    loserAdvancedTo = {
      matchId: loserNextMatchId.toString(),
      slot: loserNextMatchSlot,
    };
  }

  return { winnerAdvancedTo, loserAdvancedTo };
}
