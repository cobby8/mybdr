/**
 * FIBA 5x5 룰 가드 — completed 매치 박제 시 FIBA 위반 차단.
 *
 * 2026-05-21 — PR-3 F5 신규 (errors.md [2026-05-20] 매치 124 OT2 사고 재발 방지).
 *
 * 왜 (이유):
 *   FIBA Article 17.2 (Tied Score and Extra Periods) — regulation/OT 동점 시 winner 결정 의무.
 *   Flutter 기록앱이 OT1 동점에서 자동 매치 종료 박제 시 winner=NULL completed = FIBA 위반.
 *   매치 124 (라이징이글스 vs 제이크루) = OT1 70-70 자동 종료 박제 후 OT2 박제 누락 사고.
 *
 *   service `syncSingleMatch` 호출 직전 가드로 차단 → 양면 (paper + Flutter) 단일 source.
 *   본 헬퍼는 PURE 함수 — DB I/O 0 / vitest 단위 검증 가능 / 호출자가 input 매핑 후 호출.
 *
 * 방법 (어떻게):
 *   assertCompletedMatchFiba(input) PURE 함수 — DB 의존성 0 / vitest 6 케이스 커버.
 *   호출자 (paper = score-sheet/[matchId]/submit / Flutter = v1/matches/sync + batch-sync) 가
 *   service 호출 직전 check → 위반 시 422 즉시 응답.
 *
 *   currentQuarter 매핑:
 *     - Q1~Q4 = 1~4 (regulation)
 *     - OT1 = 5
 *     - OT2 = 6 (매치 124 사고 케이스 — 통과 룰)
 *     - OT3 = 7 (이론상 / 통과 룰)
 */

// FIBA 가드 입력 — paper / flutter 양면 호출자가 동일 shape 으로 전달.
//
// 필수 필드:
//   - homeScore / awayScore: 매치 헤더 점수 (Q1~Q4 + OT 누적)
//   - status: "completed" 일 때만 가드 활성 (in_progress / scheduled 통과)
//   - winnerTeamId: 운영자 추첨 등 명시 결정 winner 보존 (null = 자동 결정 위임)
//
// 선택 필드:
//   - currentQuarter: OT1 (5) vs OT2+ (6+) 분기. 미박제 시 1 (regulation) 처리.
//   - recordingMode: 사후 분석용 (현재 로직 분기 0 — 양면 동일 룰).
export type FibaCheckInput = {
  homeScore: number;
  awayScore: number;
  status: string;
  winnerTeamId: bigint | string | number | null;
  currentQuarter?: number; // 1~7 (Q1~Q4 = 1~4 / OT1~OT3 = 5~7) / 미박제 시 1 (regulation)
  recordingMode: "flutter" | "paper";
};

// FIBA 가드 결과 — 호출자가 결과 분기:
//   ok: true → 정상 박제 진행
//   ok: false → apiError 422 + code + message 반환 (호출자 책임)
export type FibaCheckResult =
  | { ok: true }
  | {
      ok: false;
      code: "FIBA_TIE_WITHOUT_WINNER" | "FIBA_OT1_TIE_REQUIRES_OT2";
      message: string;
    };

/**
 * FIBA 룰 가드 — completed 매치 박제 시 동점 + winner NULL 조합 차단.
 *
 * 분기 (우선순위 순):
 *   1) status !== "completed" → 통과 (in_progress / scheduled = 진행 중 동점 정상)
 *   2) 동점 + winner 있음 → 통과 (운영자 추첨 등 명시 결정 보존)
 *   3) 동점 + winner NULL + currentQuarter === 5 (OT1) → FIBA_OT1_TIE_REQUIRES_OT2 (위반)
 *   4) 동점 + winner NULL + currentQuarter >= 6 (OT2+) → 통과 (OT2 박제 흐름 보존 — 매치 124)
 *   5) 동점 + winner NULL + currentQuarter <= 4 또는 미박제 → FIBA_TIE_WITHOUT_WINNER (위반)
 *   6) 점수차 있음 → 통과 (정상)
 *
 * @param input FibaCheckInput — paper / flutter 양면 동일 shape
 * @returns FibaCheckResult — ok:true 또는 ok:false + code + message
 */
export function assertCompletedMatchFiba(
  input: FibaCheckInput
): FibaCheckResult {
  // 1) in_progress / scheduled 매치 = 진행 중 동점 정상 → 통과
  // 사유: 진행 중 동점은 정상 상태 (다음 점수 박제 시 변경). 본 가드는 박제 종료 시점 검증만.
  if (input.status !== "completed") return { ok: true };

  const tied = input.homeScore === input.awayScore;
  // winnerTeamId 가 null / undefined / 빈 문자열 / 0 모두 "없음" 으로 간주
  // 사유: Flutter / paper sync 양면이 winner 미박제 시 null 또는 미전달 (양 케이스 통합)
  const hasWinner =
    input.winnerTeamId !== null &&
    input.winnerTeamId !== undefined &&
    input.winnerTeamId !== "" &&
    input.winnerTeamId !== 0;

  // 2) 동점 + winner 있음 (운영자 추첨 결정 등) = 통과 — 수동 결정 보존
  if (tied && hasWinner) return { ok: true };

  // 3) 동점 + winner NULL + currentQuarter=5 (OT1) = FIBA 위반 (OT2 진입 의무)
  // 사유: FIBA Article 17.2 — OT1 동점 시 무한 OT 또는 winner 결정 의무.
  //       매치 124 사고 = OT1 70-70 자동 종료 박제 → 본 가드로 차단.
  if (tied && !hasWinner && input.currentQuarter === 5) {
    return {
      ok: false,
      code: "FIBA_OT1_TIE_REQUIRES_OT2",
      message:
        "OT1 동점 매치는 종료할 수 없습니다. FIBA Article 17.2 — OT2 박제 후 완료해주세요.",
    };
  }

  // 4) 동점 + winner NULL + currentQuarter>=6 (OT2+) = 통과
  // 사유: 운영자가 OT2 박제 진행 중 또는 별도 흐름 보존 (매치 124 사후 박제 케이스).
  //       무한 OT 시 어느 시점 winner 결정 필요하지만, 본 가드는 OT2+ 통과 룰 (Sprint 2 별도 안내).
  if (tied && !hasWinner && (input.currentQuarter ?? 0) >= 6) {
    return { ok: true };
  }

  // 5) 동점 + winner NULL + regulation (currentQuarter <= 4 또는 미박제) = FIBA 위반
  // 사유: 정규 시간 (Q1~Q4) 동점은 FIBA Article 17.2 위반 — 추가 시간 또는 winner 결정 의무.
  if (tied && !hasWinner) {
    return {
      ok: false,
      code: "FIBA_TIE_WITHOUT_WINNER",
      message:
        "동점 매치는 winner 없이 종료할 수 없습니다. 추가 시간 또는 winner 결정 후 완료해주세요.",
    };
  }

  // 6) 점수차 있음 = 정상
  return { ok: true };
}
