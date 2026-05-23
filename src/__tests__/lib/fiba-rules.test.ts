/**
 * 2026-05-21 — PR-3 F5 FIBA 룰 가드 PURE 헬퍼 회귀 방지.
 *
 * 검증 범위 (위임 §F5 — 6 케이스):
 *   F1. OT1 (quarter=5) 70-70 winner=null completed → ❌ FIBA_OT1_TIE_REQUIRES_OT2
 *   F2. OT1 (quarter=5) 70-72 winner=away completed → ✅ ok (정상 OT1 종료)
 *   F3. OT2 (quarter=6) 70-70 winner=null completed → ✅ ok (운영자 OT2 박제 의도)
 *   F4. regulation (quarter=4) 70-70 winner=null completed → ❌ FIBA_TIE_WITHOUT_WINNER
 *   F5. in_progress 70-70 winner=null → ✅ ok (진행 중 동점 정상)
 *   F6. OT1 70-70 winner=home completed (운영자 결정) → ✅ ok (winner 있으면 통과)
 *
 * 보너스 검증:
 *   - winnerTeamId 가 bigint / string / number 모두 hasWinner 판정 정확
 *   - currentQuarter 미박제 시 regulation 처리 (FIBA_TIE_WITHOUT_WINNER)
 */

import { describe, it, expect } from "vitest";
import { assertCompletedMatchFiba } from "@/lib/tournaments/fiba-rules";

describe("fiba-rules — assertCompletedMatchFiba (F1~F6 위임 6 케이스)", () => {
  // F1: 매치 124 OT2 사고 재발 방지 = 핵심 케이스
  // 사유: OT1 70-70 자동 종료 = FIBA Article 17.2 위반 → OT2 박제 의무 안내
  it("F1: OT1 (quarter=5) 70-70 winner=null completed → FIBA_OT1_TIE_REQUIRES_OT2 차단", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: null,
      currentQuarter: 5, // OT1
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FIBA_OT1_TIE_REQUIRES_OT2");
      expect(result.message).toContain("OT1");
      expect(result.message).toContain("OT2");
    }
  });

  // F2: 정상 OT1 종료 (점수차 있음 + winner 결정) — 회귀 0 보장
  it("F2: OT1 70-72 winner=away completed → ok (정상 OT1 종료)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 72,
      status: "completed",
      winnerTeamId: BigInt(456), // away team id
      currentQuarter: 5,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(true);
  });

  // F3: OT2 박제 흐름 보존 — 운영자가 OT2 박제 중 또는 매치 124 같은 사후 박제 케이스
  // 사유: OT2+ 동점 + winner NULL = 가드 통과 (별도 안내는 Sprint 2)
  it("F3: OT2 (quarter=6) 70-70 winner=null completed → ok (OT2+ 통과 룰)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: null,
      currentQuarter: 6, // OT2
      recordingMode: "paper",
    });
    expect(result.ok).toBe(true);
  });

  // F4: regulation 동점 + winner NULL = FIBA 위반 (Q4 동점은 OT 진입 의무)
  it("F4: regulation (quarter=4) 70-70 winner=null completed → FIBA_TIE_WITHOUT_WINNER 차단", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: null,
      currentQuarter: 4, // Q4
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FIBA_TIE_WITHOUT_WINNER");
      expect(result.message).toContain("winner");
    }
  });

  // F5: in_progress 동점 = 진행 중 정상 (다음 점수 박제 시 변경) — 가드 활성 X
  it("F5: in_progress 70-70 winner=null → ok (진행 중 동점 정상)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "in_progress",
      winnerTeamId: null,
      currentQuarter: 5,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(true);
  });

  // F6: OT1 동점 + winner 운영자 결정 = 통과 (수동 추첨 / 사용자 결재 케이스)
  // 사유: 운영자가 OT1 동점에서 winner 명시 박제 시 가드 통과 — FIBA 룰 외 운영 결정 보존
  it("F6: OT1 70-70 winner=home completed → ok (운영자 결정 보존)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: BigInt(123), // home team id (운영자 명시 박제)
      currentQuarter: 5,
      recordingMode: "paper",
    });
    expect(result.ok).toBe(true);
  });
});

describe("fiba-rules — winnerTeamId hasWinner 판정 (보너스 검증)", () => {
  // bigint / string / number 모두 truthy 처리 — 양면 호출자가 어떤 타입을 넘기든 정확 판정
  it("winnerTeamId = BigInt(123) → hasWinner=true (OT1 통과)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: BigInt(123),
      currentQuarter: 5,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(true);
  });

  it("winnerTeamId = '123' (string) → hasWinner=true (OT1 통과)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: "123",
      currentQuarter: 5,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(true);
  });

  it("winnerTeamId = 123 (number) → hasWinner=true (OT1 통과)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: 123,
      currentQuarter: 5,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(true);
  });

  it("winnerTeamId = '' (빈 문자열) → hasWinner=false (OT1 차단)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: "",
      currentQuarter: 5,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(false);
  });

  it("winnerTeamId = 0 (number) → hasWinner=false (regulation 차단)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 70,
      awayScore: 70,
      status: "completed",
      winnerTeamId: 0,
      currentQuarter: 4,
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(false);
  });
});

describe("fiba-rules — currentQuarter 미박제 케이스", () => {
  it("currentQuarter undefined + 동점 + winner null + completed → FIBA_TIE_WITHOUT_WINNER (regulation 처리)", () => {
    // 사유: currentQuarter 미박제 = 0 폴백 → quarter <= 4 분기 → regulation 위반
    const result = assertCompletedMatchFiba({
      homeScore: 60,
      awayScore: 60,
      status: "completed",
      winnerTeamId: null,
      // currentQuarter 미박제
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("FIBA_TIE_WITHOUT_WINNER");
    }
  });

  it("점수차 매치 (currentQuarter 미박제) → ok (정상 종료)", () => {
    const result = assertCompletedMatchFiba({
      homeScore: 75,
      awayScore: 82,
      status: "completed",
      winnerTeamId: BigInt(456),
      recordingMode: "flutter",
    });
    expect(result.ok).toBe(true);
  });
});
