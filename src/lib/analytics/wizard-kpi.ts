/**
 * 2026-05-15 Phase 7 D — 마법사 KPI 비즈니스 로직 분리.
 *
 * 이유 (Q5=YES):
 *   - route.ts 100 LOC 룰 준수 + 후속 옵션 B (wizard_events 테이블) 진입 시 동일 lib 확장 위해.
 *   - 후속 vitest 가 mock prisma 로 본 함수 직접 테스트 가능 (route + lib 분리).
 *
 * 방법:
 *   - `computeWizardKpi({ from, to, granularity })` 단일 export.
 *   - 4 KPI 병렬 집계 (Promise.all — 운영 DB 왕복 1 batch).
 *   - 응답 키 camelCase 작성 — route 단의 apiSuccess() 가 snake_case 자동 변환 (errors.md 5회 사고).
 *
 * 측정 가능 KPI 4건 (시그널 A/B 추정 한계 인지 — scratchpad §측정 가능 KPI 매트릭스):
 *   1) tournaments_total — 기간 내 createdAt count
 *   2) tournaments_with_series — series_id NOT NULL count (wizard Step 1 추정 시그널)
 *   3) tournaments_with_division_rules — TournamentDivisionRule distinct tournament count (wizard Step 3 추정 시그널)
 *   4) tournaments_published — status="registration_open" count + (updatedAt - createdAt) 평균 분
 */

import { prisma } from "@/lib/db/prisma";

export type Granularity = "daily" | "weekly" | "monthly";

export interface WizardKpiInput {
  from: Date;
  to: Date;
  granularity: Granularity;
}

export interface WizardKpiResult {
  range: {
    from: string;
    to: string;
    granularity: Granularity;
    days: number;
  };
  totals: {
    tournamentsTotal: number;
    tournamentsWithSeries: number;
    tournamentsWithDivisionRules: number;
    tournamentsPublished: number;
  };
  rates: {
    seriesAttachmentRate: number;
    divisionRulesUsageRate: number;
    publicationRate: number;
  };
  avgPublicationMinutes: number;
  breakdown: Array<{ date: string; count: number }>;
}

/**
 * 마법사 KPI 집계 — 운영 DB SELECT only (CLAUDE.md §DB 가드 5 = 운영 영향 0).
 *
 * 반환값은 camelCase — 호출자 (route.ts) 의 apiSuccess() 가 snake_case 변환.
 */
export async function computeWizardKpi(
  input: WizardKpiInput,
): Promise<WizardKpiResult> {
  const { from, to, granularity } = input;

  // 기간 일수 계산 — 응답 range 메타 박제용.
  const days = Math.max(
    1,
    Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)),
  );

  // 4 KPI 병렬 집계 — Promise.all 로 DB 왕복 1 batch.
  // 이유: 운영 DB 부하 최소화 + 응답 시간 단축 (개별 await 시 4 RTT → 1 RTT).
  const [
    tournamentsTotal,
    tournamentsWithSeries,
    divisionRulesGroups,
    publishedRows,
    breakdownRaw,
  ] = await Promise.all([
    // 1) 기간 내 전체 대회 수 (createdAt 분포)
    prisma.tournament.count({
      where: { createdAt: { gte: from, lte: to } },
    }),

    // 2) series_id NOT NULL 대회 수 (wizard Step 1 추정 시그널)
    prisma.tournament.count({
      where: {
        createdAt: { gte: from, lte: to },
        series_id: { not: null },
      },
    }),

    // 3) division_rules 박제한 대회 수 (distinct tournament_id)
    //    이유: 한 대회당 종별 row N개 박제됨 → groupBy 로 distinct 카운트.
    prisma.tournamentDivisionRule.groupBy({
      by: ["tournamentId"],
      where: {
        tournament: { createdAt: { gte: from, lte: to } },
      },
    }),

    // 4) status="registration_open" 도달 대회 + 평균 소요 시간
    //    이유: avg(updatedAt - createdAt) 는 Prisma aggregate 미지원 → 개별 row select 후 JS 계산.
    //    소요 시간 ±5분 정확도 (운영자 후속 수정 시 updatedAt 갱신 — scratchpad §잠재 위험).
    prisma.tournament.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: "registration_open",
      },
      select: { createdAt: true, updatedAt: true },
    }),

    // 5) breakdown — granularity 별 생성 분포.
    //    raw SQL (DATE_TRUNC) 보다 안전한 방식: 전체 createdAt row 받아서 JS 집계.
    //    이유: 운영 대회 수 적음 (월 수십 건) → JS 집계 부하 무시 수준. 추후 100배 증가 시 raw SQL 재검토.
    prisma.tournament.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const tournamentsWithDivisionRules = divisionRulesGroups.length;
  const tournamentsPublished = publishedRows.length;

  // 평균 소요 시간 (분) — 0 대회 시 0 fallback (NaN 방지).
  const totalDurationMs = publishedRows.reduce((sum, row) => {
    return sum + (row.updatedAt.getTime() - row.createdAt.getTime());
  }, 0);
  const avgPublicationMinutes = tournamentsPublished > 0
    ? Math.round((totalDurationMs / tournamentsPublished / 1000 / 60) * 10) / 10
    : 0;

  // 비율 계산 — total=0 시 0 fallback (errors.md NaN 회피).
  const safeDiv = (a: number, b: number) =>
    b > 0 ? Math.round((a / b) * 1000) / 1000 : 0;

  // breakdown 집계 — granularity 키별 그룹화.
  const breakdownMap = new Map<string, number>();
  for (const row of breakdownRaw) {
    const key = bucketKey(row.createdAt, granularity);
    breakdownMap.set(key, (breakdownMap.get(key) ?? 0) + 1);
  }
  const breakdown = Array.from(breakdownMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
      granularity,
      days,
    },
    totals: {
      tournamentsTotal,
      tournamentsWithSeries,
      tournamentsWithDivisionRules,
      tournamentsPublished,
    },
    rates: {
      seriesAttachmentRate: safeDiv(tournamentsWithSeries, tournamentsTotal),
      divisionRulesUsageRate: safeDiv(
        tournamentsWithDivisionRules,
        tournamentsTotal,
      ),
      publicationRate: safeDiv(tournamentsPublished, tournamentsTotal),
    },
    avgPublicationMinutes,
    breakdown,
  };
}

/**
 * granularity 별 버킷 키 생성.
 *  - daily  : "YYYY-MM-DD"
 *  - weekly : "YYYY-Www" (ISO week 단순화 — 매주 월요일 기준 날짜로 박제)
 *  - monthly: "YYYY-MM"
 */
function bucketKey(date: Date, granularity: Granularity): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  if (granularity === "monthly") {
    return `${year}-${month}`;
  }
  if (granularity === "weekly") {
    // 주별 = 해당 주의 월요일 날짜로 그룹화 (사용자 친화).
    const d = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
    const dow = d.getUTCDay(); // 0=일~6=토
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    d.setUTCDate(d.getUTCDate() + diffToMonday);
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day2 = String(d.getUTCDate()).padStart(2, "0");
    return `${d.getUTCFullYear()}-${m}-${day2}`;
  }
  // daily (default)
  return `${year}-${month}-${day}`;
}
