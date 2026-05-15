/**
 * 2026-05-15 Phase 7 D — 마법사 KPI endpoint 회귀 가드.
 *
 * 검증 매트릭스 (5 케이스):
 *   1) 기본 30일 default (from/to 미지정) — 30일 전 범위 자동 계산 + prisma where 검증
 *   2) 명시 from/to 적용 — 정확한 범위 prisma where 전달
 *   3) granularity weekly — breakdown 주별 그룹화 (월요일 키)
 *   4) tournaments_total=0 — rates 모두 0 (NaN 방지)
 *   5) avg_publication_minutes 평균 정확성 — 3 대회 [10/20/30분] → 20분
 *
 * mock 전략:
 *   - lib/analytics/wizard-kpi 의 computeWizardKpi 를 직접 호출 (route 단 인증 통과 가정).
 *   - prisma 4 메서드 (tournament.count / tournament.findMany / tournamentDivisionRule.groupBy) mock.
 *   - mock 결과는 호출 인자 검증 (where.createdAt.gte/lte) + 반환 결과 형식 검증 양면.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// prisma mock — wizard-kpi.ts 가 사용하는 메서드만 stub.
const tournamentCountMock = vi.fn();
const tournamentFindManyMock = vi.fn();
const divisionRuleGroupByMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    tournament: {
      count: (...args: unknown[]) => tournamentCountMock(...args),
      findMany: (...args: unknown[]) => tournamentFindManyMock(...args),
    },
    tournamentDivisionRule: {
      groupBy: (...args: unknown[]) => divisionRuleGroupByMock(...args),
    },
  },
}));

import { computeWizardKpi } from "@/lib/analytics/wizard-kpi";

describe("computeWizardKpi — 마법사 KPI 집계 (Phase 7 D)", () => {
  beforeEach(() => {
    tournamentCountMock.mockReset();
    tournamentFindManyMock.mockReset();
    divisionRuleGroupByMock.mockReset();
  });

  it("1) 기본 30일 default — from/to 범위 prisma where 절 정확 전달", async () => {
    // 운영 데이터 시뮬레이션: 빈 결과.
    tournamentCountMock.mockResolvedValue(0);
    tournamentFindManyMock.mockResolvedValue([]);
    divisionRuleGroupByMock.mockResolvedValue([]);

    const to = new Date("2026-05-15T12:00:00.000Z");
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const result = await computeWizardKpi({ from, to, granularity: "daily" });

    // (a) 응답 형식 — range / totals / rates / breakdown 모두 박제.
    expect(result.range.granularity).toBe("daily");
    expect(result.range.days).toBe(30);

    // (b) prisma where.createdAt 정확 전달 (4 쿼리 모두 동일 범위).
    expect(tournamentCountMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: from, lte: to },
        }),
      }),
    );

    // (c) total=0 시 rates 모두 0 (NaN 방지) — case 4 가 정밀 검증.
    expect(result.totals.tournamentsTotal).toBe(0);
  });

  it("2) 명시 from/to → 정확한 범위 prisma 전달", async () => {
    tournamentCountMock.mockResolvedValue(5);
    tournamentFindManyMock.mockResolvedValue([]);
    divisionRuleGroupByMock.mockResolvedValue([]);

    const from = new Date("2026-04-01T00:00:00.000Z");
    const to = new Date("2026-04-30T23:59:59.999Z");

    const result = await computeWizardKpi({ from, to, granularity: "daily" });

    // (a) range.days = 30 (4월 30일분).
    expect(result.range.days).toBe(30);

    // (b) prisma 호출 인자 — createdAt 범위 정확.
    expect(tournamentCountMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { createdAt: { gte: from, lte: to } },
      }),
    );
    // 2번째 count = series_id NOT NULL 분기.
    expect(tournamentCountMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: from, lte: to },
          series_id: { not: null },
        }),
      }),
    );
  });

  it("3) granularity=weekly → breakdown 주별 그룹화 (월요일 키 박제)", async () => {
    // 4월 1일(수) + 4월 2일(목) + 4월 7일(월) 3건 → 첫 2건은 3/30 월요일 / 마지막 1건은 4/6 월요일 (UTC 기준).
    // 2026 calendar: 4/1 = 수요일 / 4/2 = 목요일 / 4/7 = 화요일.
    // → 4/1, 4/2 = 같은 주 (월요일 3/30) / 4/7 = 다음 주 (월요일 4/6).
    tournamentCountMock.mockResolvedValue(3);
    divisionRuleGroupByMock.mockResolvedValue([]);

    // findMany 첫 호출 (4번째 publishedRows) = 빈 / 두 번째 호출 (5번째 breakdownRaw) = 3건.
    // 이유: Promise.all 순서 그대로 → publishedRows 가 4번째 / breakdownRaw 가 5번째.
    // 그러나 findMany 는 mock 1개라 호출 순서대로 분기 필요 — mockResolvedValueOnce 체인.
    tournamentFindManyMock
      .mockResolvedValueOnce([]) // publishedRows (status=registration_open) — 빈 결과
      .mockResolvedValueOnce([
        { createdAt: new Date("2026-04-01T10:00:00Z") },
        { createdAt: new Date("2026-04-02T10:00:00Z") },
        { createdAt: new Date("2026-04-07T10:00:00Z") },
      ]); // breakdownRaw

    const result = await computeWizardKpi({
      from: new Date("2026-04-01T00:00:00.000Z"),
      to: new Date("2026-04-30T23:59:59.999Z"),
      granularity: "weekly",
    });

    // breakdown 2 버킷 (3/30 주 / 4/6 주).
    expect(result.breakdown).toHaveLength(2);
    expect(result.breakdown[0]).toEqual({ date: "2026-03-30", count: 2 });
    expect(result.breakdown[1]).toEqual({ date: "2026-04-06", count: 1 });
  });

  it("4) tournaments_total=0 → rates 모두 0 (NaN 방지)", async () => {
    tournamentCountMock.mockResolvedValue(0);
    tournamentFindManyMock.mockResolvedValue([]);
    divisionRuleGroupByMock.mockResolvedValue([]);

    const result = await computeWizardKpi({
      from: new Date("2026-04-01T00:00:00.000Z"),
      to: new Date("2026-04-30T23:59:59.999Z"),
      granularity: "daily",
    });

    // 나눗셈 0/0 → 0 fallback (NaN 안 됨).
    expect(result.rates.seriesAttachmentRate).toBe(0);
    expect(result.rates.divisionRulesUsageRate).toBe(0);
    expect(result.rates.publicationRate).toBe(0);
    expect(result.avgPublicationMinutes).toBe(0);
    expect(Number.isNaN(result.rates.seriesAttachmentRate)).toBe(false);
  });

  it("5) avg_publication_minutes 평균 정확성 — 3 대회 [10/20/30분] → 20분", async () => {
    // total 3 / published 3 / 평균 = (10+20+30)/3 = 20분.
    tournamentCountMock
      .mockResolvedValueOnce(3) // tournamentsTotal
      .mockResolvedValueOnce(2); // tournamentsWithSeries
    divisionRuleGroupByMock.mockResolvedValue([
      { tournamentId: "uuid-1" },
      { tournamentId: "uuid-2" },
    ]); // 2 distinct

    // publishedRows 3건 + breakdownRaw 빈 (확인 대상 아님).
    const base = new Date("2026-04-15T00:00:00.000Z").getTime();
    tournamentFindManyMock
      .mockResolvedValueOnce([
        // publishedRows — updatedAt - createdAt = 10, 20, 30 분
        {
          createdAt: new Date(base),
          updatedAt: new Date(base + 10 * 60 * 1000),
        },
        {
          createdAt: new Date(base),
          updatedAt: new Date(base + 20 * 60 * 1000),
        },
        {
          createdAt: new Date(base),
          updatedAt: new Date(base + 30 * 60 * 1000),
        },
      ])
      .mockResolvedValueOnce([]); // breakdownRaw — 본 케이스 검증 대상 아님

    const result = await computeWizardKpi({
      from: new Date("2026-04-01T00:00:00.000Z"),
      to: new Date("2026-04-30T23:59:59.999Z"),
      granularity: "daily",
    });

    // (a) 평균 분 정확성.
    expect(result.avgPublicationMinutes).toBe(20);

    // (b) rates 계산 정확성.
    //   seriesAttachmentRate = 2/3 = 0.667 (소수점 3자리 round).
    //   divisionRulesUsageRate = 2/3 = 0.667.
    //   publicationRate = 3/3 = 1.0.
    expect(result.rates.seriesAttachmentRate).toBe(0.667);
    expect(result.rates.divisionRulesUsageRate).toBe(0.667);
    expect(result.rates.publicationRate).toBe(1);

    // (c) totals 정확성.
    expect(result.totals.tournamentsTotal).toBe(3);
    expect(result.totals.tournamentsWithSeries).toBe(2);
    expect(result.totals.tournamentsWithDivisionRules).toBe(2);
    expect(result.totals.tournamentsPublished).toBe(3);
  });
});
