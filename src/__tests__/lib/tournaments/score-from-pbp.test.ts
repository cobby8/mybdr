/**
 * computeScoreFromPbp 단위 테스트 — Phase B fallback 헬퍼.
 *
 * 검증 범위 (8 케이스):
 * 1) 빈 PBP → 모든 0
 * 2) is_made === false 무시
 * 3) quarter 별 합산 정상 (Q1 + Q2)
 * 4) quarter null → 1 fallback
 * 5) points_scored null → 0 처리 (카운트 X)
 * 6) 매치 #132 실측 시나리오 — Q1:15-10 Q2:6-6 Q3:5-2 Q4:13-8 → home=39 / away=26
 * 7) 알 수 없는 team_id → 무시
 * 8) BigInt vs Number 혼용 — Prisma BigInt 입력 정상 매칭
 */
import { describe, it, expect } from "vitest";
import {
  computeScoreFromPbp,
  type PbpRowForScore,
} from "@/lib/tournaments/score-from-pbp";

// 테스트 fixture 생성 헬퍼 — quarter / team / points 만 신경쓰면 됨
// "pts" / "made" key 가 명시적으로 들어왔으면 그 값 그대로 사용 (null / false / 0 도 보존).
// 미명시 시에만 기본값 (made=true, pts=2, quarter=1) 사용.
function row(partial: {
  team: bigint | number | null;
  quarter?: number | null;
  pts?: number | null;
  made?: boolean | null;
  action_type?: string | null;
}): PbpRowForScore {
  return {
    quarter: "quarter" in partial ? partial.quarter ?? null : 1,
    action_type: partial.action_type ?? "made_shot",
    // is_made 는 명시 시 그 값 (false / null 보존), 미명시 시 true
    is_made: "made" in partial ? partial.made ?? null : true,
    // points_scored 는 명시 시 그 값 (0 / null 보존), 미명시 시 2
    points_scored: "pts" in partial ? partial.pts ?? null : 2,
    tournament_team_id: partial.team,
  };
}

describe("computeScoreFromPbp", () => {
  it("1) 빈 PBP → {home: 0, away: 0, quarters: {}}", () => {
    const result = computeScoreFromPbp([], 100, 200);
    expect(result).toEqual({ home: 0, away: 0, quarters: {} });
  });

  it("2) is_made === false 인 행은 무시", () => {
    const pbps: PbpRowForScore[] = [
      row({ team: 100, made: true, pts: 2 }),
      row({ team: 100, made: false, pts: 2 }), // miss — 무시
      row({ team: 100, made: null, pts: 2 }), // null — 무시
      row({ team: 200, made: true, pts: 3 }),
    ];
    const result = computeScoreFromPbp(pbps, 100, 200);
    expect(result.home).toBe(2);
    expect(result.away).toBe(3);
  });

  it("3) quarter 별 합산 — Q1:15-10 + Q2:6-6 → quarters[1].home=15 / quarters[2].home=6 / 합 home=21", () => {
    const pbps: PbpRowForScore[] = [
      // Q1 home 15 (3+3+3+3+3 = 5개 3점)
      row({ team: 100, quarter: 1, pts: 3 }),
      row({ team: 100, quarter: 1, pts: 3 }),
      row({ team: 100, quarter: 1, pts: 3 }),
      row({ team: 100, quarter: 1, pts: 3 }),
      row({ team: 100, quarter: 1, pts: 3 }),
      // Q1 away 10 (2*5)
      row({ team: 200, quarter: 1, pts: 2 }),
      row({ team: 200, quarter: 1, pts: 2 }),
      row({ team: 200, quarter: 1, pts: 2 }),
      row({ team: 200, quarter: 1, pts: 2 }),
      row({ team: 200, quarter: 1, pts: 2 }),
      // Q2 home 6 (2+2+2)
      row({ team: 100, quarter: 2, pts: 2 }),
      row({ team: 100, quarter: 2, pts: 2 }),
      row({ team: 100, quarter: 2, pts: 2 }),
      // Q2 away 6 (3+3)
      row({ team: 200, quarter: 2, pts: 3 }),
      row({ team: 200, quarter: 2, pts: 3 }),
    ];
    const result = computeScoreFromPbp(pbps, 100, 200);
    expect(result.quarters[1]).toEqual({ home: 15, away: 10 });
    expect(result.quarters[2]).toEqual({ home: 6, away: 6 });
    expect(result.home).toBe(21);
    expect(result.away).toBe(16);
  });

  it("4) quarter null → 1 로 fallback", () => {
    const pbps: PbpRowForScore[] = [
      row({ team: 100, quarter: null, pts: 2 }),
      row({ team: 100, quarter: null, pts: 3 }),
    ];
    const result = computeScoreFromPbp(pbps, 100, 200);
    expect(result.quarters[1]).toEqual({ home: 5, away: 0 });
    expect(result.home).toBe(5);
  });

  it("5) points_scored null 또는 0 → 카운트 안 함", () => {
    const pbps: PbpRowForScore[] = [
      row({ team: 100, pts: null }), // null — 무시
      row({ team: 100, pts: 0 }), // 0 — 무시
      row({ team: 100, pts: 2 }), // 정상
    ];
    const result = computeScoreFromPbp(pbps, 100, 200);
    expect(result.home).toBe(2);
  });

  it("6) 매치 #132 실측 시나리오 — Q1:15-10 Q2:6-6 Q3:5-2 Q4:13-8 → home=39, away=26", () => {
    // 실측 박제 분기 합산
    const buildScore = (
      team: number,
      quarter: number,
      total: number,
    ): PbpRowForScore[] => {
      // 단순화 — 모두 2점 / 홀수면 1점 + 2점 분기
      const rows: PbpRowForScore[] = [];
      let remaining = total;
      while (remaining > 0) {
        const pts = remaining >= 2 ? 2 : 1;
        rows.push(row({ team, quarter, pts }));
        remaining -= pts;
      }
      return rows;
    };
    const pbps: PbpRowForScore[] = [
      ...buildScore(245, 1, 15), // home Q1
      ...buildScore(999, 1, 10), // away Q1
      ...buildScore(245, 2, 6), // home Q2
      ...buildScore(999, 2, 6), // away Q2
      ...buildScore(245, 3, 5), // home Q3
      ...buildScore(999, 3, 2), // away Q3
      ...buildScore(245, 4, 13), // home Q4
      ...buildScore(999, 4, 8), // away Q4
    ];
    const result = computeScoreFromPbp(pbps, 245, 999);
    // home Q1+Q2+Q3+Q4 = 15+6+5+13 = 39
    expect(result.home).toBe(39);
    // away = 10+6+2+8 = 26
    expect(result.away).toBe(26);
    // quarter 분기 검증
    expect(result.quarters[1]).toEqual({ home: 15, away: 10 });
    expect(result.quarters[2]).toEqual({ home: 6, away: 6 });
    expect(result.quarters[3]).toEqual({ home: 5, away: 2 });
    expect(result.quarters[4]).toEqual({ home: 13, away: 8 });
  });

  it("7) 알 수 없는 team_id (home/away 둘 다 아님) → 무시", () => {
    const pbps: PbpRowForScore[] = [
      row({ team: 100, pts: 2 }), // home
      row({ team: 200, pts: 3 }), // away
      row({ team: 999, pts: 10 }), // 알 수 없음 — 무시되어야 함
      row({ team: null, pts: 5 }), // null — 무시되어야 함
    ];
    const result = computeScoreFromPbp(pbps, 100, 200);
    expect(result.home).toBe(2);
    expect(result.away).toBe(3);
  });

  it("8) BigInt 입력 — Prisma BigInt vs number homeTeamId 정상 매칭", () => {
    // BigInt 리터럴 (Nn) 대신 BigInt() 생성자 사용 — tsconfig target ES2020 미만 호환 + CLAUDE.md 글로벌 룰
    const homeBig = BigInt(100);
    const awayBig = BigInt(200);
    const pbps: PbpRowForScore[] = [
      // Prisma 가 BigInt 로 반환하는 시나리오
      { quarter: 1, action_type: "made_shot", is_made: true, points_scored: 2, tournament_team_id: homeBig },
      { quarter: 1, action_type: "made_shot", is_made: true, points_scored: 3, tournament_team_id: awayBig },
    ];
    // homeTeamId 도 BigInt 로 호출 (route.ts 의 match.homeTeamId 는 BigInt)
    const result = computeScoreFromPbp(pbps, homeBig, awayBig);
    expect(result.home).toBe(2);
    expect(result.away).toBe(3);

    // 혼용 — pbps 는 BigInt 인데 호출자가 number 로 넘기는 케이스
    const result2 = computeScoreFromPbp(pbps, 100, 200);
    expect(result2.home).toBe(2);
    expect(result2.away).toBe(3);
  });
});
