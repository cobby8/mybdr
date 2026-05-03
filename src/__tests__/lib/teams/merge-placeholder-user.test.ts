// merge-placeholder-user 헬퍼 함수 단위 테스트
//
// 본체 함수 (mergePlaceholderUser) 는 prisma 의존성이 강해 mock 하면 실제 동작과 괴리.
// → 본체는 운영 통합 작업 시 사후 검증 (이번 세션 18건 통합과 동일 패턴).
// → 여기서는 순수 헬퍼 (isPlaceholderEmail / getMergedNicknamePattern) 만 검증.

import { describe, it, expect } from "vitest";
import {
  isPlaceholderEmail,
  getMergedNicknamePattern,
} from "@/lib/teams/merge-placeholder-user";

describe("isPlaceholderEmail", () => {
  it("@bdr.placeholder 도메인을 placeholder 로 식별한다", () => {
    expect(isPlaceholderEmail("alice@bdr.placeholder")).toBe(true);
    expect(isPlaceholderEmail("bob.test@bdr.placeholder")).toBe(true);
  });

  it("@mybdr.temp 도메인을 placeholder 로 식별한다", () => {
    expect(isPlaceholderEmail("alice@mybdr.temp")).toBe(true);
    expect(isPlaceholderEmail("temp_안원교_1234@mybdr.temp")).toBe(true);
  });

  it("temp_ 시작 email 을 placeholder 로 식별한다", () => {
    expect(isPlaceholderEmail("temp_김영훈_1234567890@somewhere.com")).toBe(true);
  });

  it("placeholder- 시작 email 을 placeholder 로 식별한다", () => {
    expect(isPlaceholderEmail("placeholder-12345@example.com")).toBe(true);
  });

  it("일반 email 은 placeholder 가 아님", () => {
    expect(isPlaceholderEmail("alice@gmail.com")).toBe(false);
    expect(isPlaceholderEmail("dldudrl89@gmail.com")).toBe(false); // 한글자판→영문 케이스
    expect(isPlaceholderEmail("user@naver.com")).toBe(false);
  });

  it("대소문자 구분 없이 식별한다", () => {
    expect(isPlaceholderEmail("ALICE@BDR.PLACEHOLDER")).toBe(true);
    expect(isPlaceholderEmail("Bob@MyBDR.Temp")).toBe(true);
    expect(isPlaceholderEmail("TEMP_KIM_123@server.com")).toBe(true);
  });

  it("null/undefined/빈 문자열 → false", () => {
    expect(isPlaceholderEmail(null)).toBe(false);
    expect(isPlaceholderEmail(undefined)).toBe(false);
    expect(isPlaceholderEmail("")).toBe(false);
  });
});

describe("getMergedNicknamePattern", () => {
  it("realName + _merged_ + phUid 형식을 반환한다", () => {
    expect(getMergedNicknamePattern("이영기", BigInt(2955))).toBe("이영기_merged_2955");
    expect(getMergedNicknamePattern("박백호47", BigInt(2943))).toBe("박백호47_merged_2943");
  });

  it("이름이 영문/숫자/공백 포함이어도 그대로 사용한다 (UNIQUE 풀기 목적)", () => {
    expect(getMergedNicknamePattern("Lee Younggi", BigInt(123))).toBe(
      "Lee Younggi_merged_123",
    );
    expect(getMergedNicknamePattern("Player1", BigInt(999))).toBe("Player1_merged_999");
  });

  it("phUid 가 다르면 다른 nickname 을 생성한다 (UNIQUE 보장)", () => {
    const a = getMergedNicknamePattern("동명이인", BigInt(100));
    const b = getMergedNicknamePattern("동명이인", BigInt(200));
    expect(a).not.toBe(b);
  });
});
