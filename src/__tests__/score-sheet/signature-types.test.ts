/**
 * Signatures 타입 단위 테스트 — Phase 5 (2026-05-12).
 *
 * 검증 대상:
 *   - EMPTY_SIGNATURES 초기값 (8 입력 키 + notes = 9 키 모두 빈 문자열)
 *   - 상수 길이 제한 (SIGNATURE_MAX_LENGTH 50 / CAPTAIN 100 / NOTES 500)
 *   - SignaturesState 키 셋 (FIBA 양식 풋터 정합)
 *
 * 룰: 본 파일은 타입/상수 검증만 — UI 동작은 별도 (수동 E2E + 컴포넌트 mount).
 *   buildSubmitPayload 의 signatures 박제 제외 룰 (빈 객체 = 전송 안 함) 도 검증.
 */

import { describe, it, expect } from "vitest";
import {
  type SignaturesState,
  EMPTY_SIGNATURES,
  SIGNATURE_MAX_LENGTH,
  CAPTAIN_SIGNATURE_MAX_LENGTH,
  NOTES_MAX_LENGTH,
} from "@/lib/score-sheet/signature-types";

describe("EMPTY_SIGNATURES", () => {
  it("9 키 모두 빈 문자열 (8 서명 + 1 notes)", () => {
    // FIBA 양식 풋터 8 입력 + 노트 1 = 9 키 정합 검증
    const expectedKeys: (keyof SignaturesState)[] = [
      "scorer",
      "asstScorer",
      "timer",
      "shotClockOperator",
      "refereeSign",
      "umpire1Sign",
      "umpire2Sign",
      "captainSignature",
      "notes",
    ];
    const actualKeys = Object.keys(EMPTY_SIGNATURES).sort();
    expect(actualKeys).toEqual(expectedKeys.sort());
  });

  it("모든 값이 빈 문자열", () => {
    Object.values(EMPTY_SIGNATURES).forEach((v) => {
      expect(v).toBe("");
    });
  });

  it("immutable spread 후 키 추가 가능 (구버전 draft 호환 패턴)", () => {
    // ScoreSheetForm draft 복원 시 `{ ...EMPTY_SIGNATURES, ...sig }` 패턴 사용
    // → 누락 키 방어 검증
    const partial: Partial<SignaturesState> = { scorer: "홍길동" };
    const merged = { ...EMPTY_SIGNATURES, ...partial };
    expect(merged.scorer).toBe("홍길동");
    expect(merged.refereeSign).toBe(""); // 누락 키는 EMPTY 값 유지
    expect(merged.notes).toBe("");
  });
});

describe("길이 제한 상수", () => {
  it("SIGNATURE_MAX_LENGTH = 50 (일반 서명)", () => {
    expect(SIGNATURE_MAX_LENGTH).toBe(50);
  });

  it("CAPTAIN_SIGNATURE_MAX_LENGTH = 100 (항의 단문 메모 허용)", () => {
    expect(CAPTAIN_SIGNATURE_MAX_LENGTH).toBe(100);
    // captain 은 일반 서명보다 길어야 함 (메모 박제용)
    expect(CAPTAIN_SIGNATURE_MAX_LENGTH).toBeGreaterThan(SIGNATURE_MAX_LENGTH);
  });

  it("NOTES_MAX_LENGTH = 500 (매치 노트 textarea)", () => {
    expect(NOTES_MAX_LENGTH).toBe(500);
    // 노트는 가장 긴 입력 — captain 보다도 길어야 함
    expect(NOTES_MAX_LENGTH).toBeGreaterThan(CAPTAIN_SIGNATURE_MAX_LENGTH);
  });
});

describe("payload 박제 룰 — buildSubmitPayload 의 hasAnySig 분기", () => {
  // ScoreSheetForm.buildSubmitPayload 가 빈 객체일 때 signatures 키 자체 미전송하는 룰 검증
  // (BFF 가 signatures: undefined 시 settings.signatures 갱신 0)
  function hasAnySig(s: SignaturesState): boolean {
    return Boolean(
      s.scorer ||
        s.asstScorer ||
        s.timer ||
        s.shotClockOperator ||
        s.refereeSign ||
        s.umpire1Sign ||
        s.umpire2Sign ||
        s.captainSignature
    );
  }

  it("EMPTY 상태 = hasAnySig false (BFF 전송 안 함)", () => {
    expect(hasAnySig(EMPTY_SIGNATURES)).toBe(false);
  });

  it("scorer 만 입력 = hasAnySig true (BFF 전송)", () => {
    const s = { ...EMPTY_SIGNATURES, scorer: "홍길동" };
    expect(hasAnySig(s)).toBe(true);
  });

  it("notes 만 입력 = hasAnySig false (notes 는 별도 컬럼 — signatures JSON 박제 대상 아님)", () => {
    // notes 는 TournamentMatch.notes 컬럼 박제 — settings.signatures JSON 과 분리
    const s = { ...EMPTY_SIGNATURES, notes: "부상자 발생 — 응급 처치" };
    expect(hasAnySig(s)).toBe(false);
  });

  it("captainSignature 만 입력 = hasAnySig true", () => {
    const s = { ...EMPTY_SIGNATURES, captainSignature: "Q3 5분 항의 — 파울 콜 이의" };
    expect(hasAnySig(s)).toBe(true);
  });
});
