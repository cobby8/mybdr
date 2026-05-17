/**
 * standings-points 헬퍼 단위 테스트 (2026-05-17 박제).
 *
 * 검증 케이스:
 * - 강남구 i2 (20/30점차 분기)
 * - 강남구 i3 (10/15점차 분기)
 * - 강남구 i3w (i3 룰 동일 적용)
 * - default 룰 (= 모든 점수차 3 vs 0)
 * - 무승부 / NULL score = 0 vs 0
 */

import { describe, it, expect } from "vitest";
import { calculateMatchPoints } from "@/lib/tournaments/standings-points";

describe("calculateMatchPoints", () => {
  describe("강남구 (pointsRule=gnba) i2 종별", () => {
    it("1점차 = 승자 3점 / 패자 0점", () => {
      const result = calculateMatchPoints({
        homeScore: 21,
        awayScore: 20,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("19점차 (경계 아래) = 승자 3점", () => {
      const result = calculateMatchPoints({
        homeScore: 30,
        awayScore: 11,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("20점차 (경계) = 승자 2점", () => {
      const result = calculateMatchPoints({
        homeScore: 25,
        awayScore: 5,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 2, awayPoints: 0 });
    });

    it("29점차 = 승자 2점", () => {
      const result = calculateMatchPoints({
        homeScore: 35,
        awayScore: 6,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 2, awayPoints: 0 });
    });

    it("30점차 (경계) = 승자 1점", () => {
      const result = calculateMatchPoints({
        homeScore: 39,
        awayScore: 9,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 1, awayPoints: 0 });
    });

    it("50점차 = 승자 1점", () => {
      const result = calculateMatchPoints({
        homeScore: 50,
        awayScore: 0,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 1, awayPoints: 0 });
    });

    it("away 승리 + 37점차 = away 1점", () => {
      const result = calculateMatchPoints({
        homeScore: 2,
        awayScore: 39,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 1 });
    });
  });

  describe("강남구 (pointsRule=gnba) i3 종별", () => {
    it("9점차 (경계 아래) = 승자 3점", () => {
      const result = calculateMatchPoints({
        homeScore: 12,
        awayScore: 3,
        divisionCode: "i3-U9",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("10점차 (경계) = 승자 2점", () => {
      const result = calculateMatchPoints({
        homeScore: 14,
        awayScore: 4,
        divisionCode: "i3-U9",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 2, awayPoints: 0 });
    });

    it("14점차 = 승자 2점", () => {
      const result = calculateMatchPoints({
        homeScore: 18,
        awayScore: 4,
        divisionCode: "i3-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 2, awayPoints: 0 });
    });

    it("15점차 (경계) = 승자 1점", () => {
      const result = calculateMatchPoints({
        homeScore: 22,
        awayScore: 7,
        divisionCode: "i3-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 1, awayPoints: 0 });
    });

    it("30점차 = 승자 1점", () => {
      const result = calculateMatchPoints({
        homeScore: 37,
        awayScore: 7,
        divisionCode: "i3-U14",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 1, awayPoints: 0 });
    });

    it("away 승리 + 12점차 = away 2점 (i3-U9 매치 164 케이스)", () => {
      const result = calculateMatchPoints({
        homeScore: 9,
        awayScore: 21,
        divisionCode: "i3-U9",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 2 });
    });
  });

  describe("강남구 (pointsRule=gnba) i3w 종별 (i3 룰 동일 적용)", () => {
    it("22점차 = 승자 1점 (i3w 매치 199 케이스)", () => {
      const result = calculateMatchPoints({
        homeScore: 31,
        awayScore: 9,
        divisionCode: "i3w-U12",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 1, awayPoints: 0 });
    });

    it("3점차 = 승자 3점 (i3w 매치 204 케이스)", () => {
      const result = calculateMatchPoints({
        homeScore: 24,
        awayScore: 27,
        divisionCode: "i3w-U12",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 3 });
    });
  });

  describe("default 룰 (= 강남구 외 대회)", () => {
    it("1점차 = 승자 3점", () => {
      const result = calculateMatchPoints({
        homeScore: 21,
        awayScore: 20,
        divisionCode: "i2-U11",
        pointsRule: "default",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("20점차 = 승자 3점 (가산점 분기 없음)", () => {
      const result = calculateMatchPoints({
        homeScore: 25,
        awayScore: 5,
        divisionCode: "i2-U11",
        pointsRule: "default",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("30점차 = 승자 3점", () => {
      const result = calculateMatchPoints({
        homeScore: 39,
        awayScore: 9,
        divisionCode: "i2-U11",
        pointsRule: "default",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("divisionCode null + default = 승자 3점", () => {
      const result = calculateMatchPoints({
        homeScore: 30,
        awayScore: 5,
        divisionCode: null,
        pointsRule: "default",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });
  });

  describe("edge case", () => {
    it("무승부 = 0 vs 0", () => {
      const result = calculateMatchPoints({
        homeScore: 10,
        awayScore: 10,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 0 });
    });

    it("homeScore null = 0 vs 0", () => {
      const result = calculateMatchPoints({
        homeScore: null,
        awayScore: 10,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 0 });
    });

    it("awayScore null = 0 vs 0", () => {
      const result = calculateMatchPoints({
        homeScore: 20,
        awayScore: null,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 0 });
    });

    it("두 score 모두 null = 0 vs 0", () => {
      const result = calculateMatchPoints({
        homeScore: null,
        awayScore: null,
        divisionCode: "i2-U11",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 0, awayPoints: 0 });
    });

    it("강남구 + divisionCode null = default 룰 동작 (가산점 X)", () => {
      const result = calculateMatchPoints({
        homeScore: 50,
        awayScore: 0,
        divisionCode: null,
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });

    it("강남구 + 비 i2/i3 divisionCode = 기본 3점", () => {
      const result = calculateMatchPoints({
        homeScore: 50,
        awayScore: 0,
        divisionCode: "m1-A",
        pointsRule: "gnba",
      });
      expect(result).toEqual({ homePoints: 3, awayPoints: 0 });
    });
  });
});
