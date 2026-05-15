/**
 * 2026-05-13 — GameTimeInput parseGameTime 회귀 방지.
 *
 * 본 테스트는 React DOM 마운트 대신 **순수 함수** 만 검증한다.
 * 이유:
 *   - 프로젝트에 React Testing Library 미설치 (inline-series-form.test.ts 와 동일 패턴).
 *   - 마운트 시 부모 value 가 하드코딩 기본값으로 덮어쓰이던 P0 버그의 핵심은
 *     "value 를 역파싱해서 state 초기값으로 쓰는가" — 즉 parseGameTime 의 정확도에 달림.
 *
 * 검증 범위:
 *   - 표준 프리셋 5종 (5/7/8/10/12분) 정확 파싱
 *   - 4쿼터 ↔ 전후반 / 논스탑 ↔ 올데드 양쪽 매칭
 *   - 매칭 실패 → null (호출부에서 isCustom 모드로 진입하는 신호)
 *   - 빈 문자열 → null
 *   - 옛 데이터/오타 형식 → null (강제 덮어쓰기 차단)
 *   - 양옆 공백 등 변형 → null (정확 매칭 only — 보수적)
 */

import { describe, it, expect } from "vitest";
import {
  parseGameTime,
  TIME_OPTIONS,
  MIN_GAME_MINUTES,
  MAX_GAME_MINUTES,
} from "@/components/tournament/game-time-input";

describe("parseGameTime — 경기시간 문자열 역파싱", () => {
  it("기본 프리셋 '7분 4쿼터 논스탑' 정확 파싱", () => {
    const r = parseGameTime("7분 4쿼터 논스탑");
    expect(r).toEqual({ minutes: 7, period: "4Q", dead: "nonstop" });
  });

  it("'10분 4쿼터 올데드' = 사용자 DB 저장값 시나리오 (P0 회귀 핵심)", () => {
    // 운영자가 직접 10분/올데드로 저장한 값을 wizard 재진입 시 보존해야 함
    const r = parseGameTime("10분 4쿼터 올데드");
    expect(r).toEqual({ minutes: 10, period: "4Q", dead: "alldead" });
  });

  it("전후반 형식 '12분 전후반 올데드' 파싱", () => {
    const r = parseGameTime("12분 전후반 올데드");
    expect(r).toEqual({ minutes: 12, period: "2H", dead: "alldead" });
  });

  it("5분/8분 등 모든 TIME_OPTIONS 표준값 파싱", () => {
    expect(parseGameTime("5분 4쿼터 논스탑")?.minutes).toBe(5);
    expect(parseGameTime("8분 전후반 논스탑")?.minutes).toBe(8);
  });

  it("빈 문자열 → null (신규 wizard 진입 시그널)", () => {
    expect(parseGameTime("")).toBeNull();
  });

  it("정규식 미매칭 형식 → null (옛 데이터 보호 — isCustom 진입 신호)", () => {
    // 영어 / 약식 / 순서 다름 등 비표준 형식은 모두 null
    // 호출부에서 null → setIsCustom(true) 분기 → 사용자 값 보존
    expect(parseGameTime("7min Q4 nonstop")).toBeNull();
    expect(parseGameTime("4쿼터 7분 논스탑")).toBeNull();
    expect(parseGameTime("7 4쿼터 논스탑")).toBeNull();
    expect(parseGameTime("7분 5쿼터 논스탑")).toBeNull(); // 미정의 period
    expect(parseGameTime("7분 4쿼터 하프타임")).toBeNull(); // 미정의 dead
  });
});

describe("TIME_OPTIONS — 프리셋 6종 (2026-05-15 사용자 요청: 6분 추가)", () => {
  it("프리셋 = [5, 6, 7, 8, 10, 12] 순서 보장", () => {
    expect([...TIME_OPTIONS]).toEqual([5, 6, 7, 8, 10, 12]);
  });

  it("6분 추가 확인 (UI 버튼 + parseGameTime 양면)", () => {
    expect(TIME_OPTIONS).toContain(6);
    expect(parseGameTime("6분 4쿼터 논스탑")).toEqual({
      minutes: 6,
      period: "4Q",
      dead: "nonstop",
    });
    expect(parseGameTime("6분 전후반 올데드")).toEqual({
      minutes: 6,
      period: "2H",
      dead: "alldead",
    });
  });
});

describe("분 직접 입력 — MIN/MAX 범위 가드", () => {
  it("MIN=1 / MAX=60 (한국 농구 표준 범위)", () => {
    expect(MIN_GAME_MINUTES).toBe(1);
    expect(MAX_GAME_MINUTES).toBe(60);
  });

  it("프리셋 외 값도 parseGameTime 통과 (정규식 \\d+ 자유)", () => {
    // 사용자가 9분 / 11분 / 15분 등 직접 입력 시 DB 저장값 회귀 검증
    expect(parseGameTime("9분 4쿼터 논스탑")?.minutes).toBe(9);
    expect(parseGameTime("11분 전후반 올데드")?.minutes).toBe(11);
    expect(parseGameTime("20분 4쿼터 논스탑")?.minutes).toBe(20);
  });
});
