/**
 * prismaToPaperPBPRow 명시 매핑 헬퍼 단위 테스트 — Phase 23 PR6 (2026-05-15).
 *
 * 왜 (이유):
 *   기존 page.tsx 의 `pbpRows as unknown as PaperPBPRow[]` 캐스팅 (TS strict 우회) → 명시 매핑.
 *   본 vitest = reviewer WARN fix 회귀 가드.
 *
 * 검증 케이스:
 *   1. 정상 케이스 — 11 필드 모두 채워진 행 (shot_made 1점/2점/3점 + foul)
 *   2. NULL 케이스 — Prisma 가 NULL 반환하는 컬럼 (quarter / action_type / is_made 등) nullable 보존
 *   3. bigint vs number id 케이스 — Prisma 가 bigint 반환 (auto-inc id) — 변환 0 보존
 *   4. tournament_team_id / tournament_team_player_id NULL 케이스 (foul 의 우드페이스 등 일부 케이스)
 *   5. 배열 매핑 — `pbpRows.map(prismaToPaperPBPRow)` 동작 검증
 *   6. nullable 전 컬럼 NULL — 엣지 (빈 행)
 *   7. 정상 + NULL 혼합 — 배열 안 일부 row 만 NULL
 *
 * BigInt 리터럴 (Nn) 대신 BigInt(N) 생성자 사용 — tsconfig target ES2017 호환.
 */

import { describe, it, expect } from "vitest";
import {
  prismaToPaperPBPRow,
  type PrismaPlayByPlayRow,
  type PaperPBPRow,
} from "@/lib/score-sheet/running-score-helpers";

describe("prismaToPaperPBPRow — 명시 매핑 (Phase 23 PR6)", () => {
  // 케이스 1: 정상 — 11 필드 모두 채워진 행 (shot_made 2점)
  it("정상 row (shot_made 2점) — 11 필드 그대로 매핑", () => {
    const input: PrismaPlayByPlayRow = {
      id: BigInt(100),
      quarter: 1,
      action_type: "shot_made",
      action_subtype: "2pt",
      is_made: true,
      points_scored: 2,
      home_score_at_time: 5,
      away_score_at_time: 3,
      tournament_team_id: BigInt(11),
      tournament_team_player_id: BigInt(201),
      description: "[종이 기록] 2점 득점",
    };
    const expected: PaperPBPRow = { ...input };
    expect(prismaToPaperPBPRow(input)).toEqual(expected);
  });

  // 케이스 2: NULL — 일부 컬럼 NULL (quarter / action_type / is_made / description)
  it("일부 컬럼 NULL — nullable 보존", () => {
    const input: PrismaPlayByPlayRow = {
      id: BigInt(101),
      quarter: null,
      action_type: null,
      action_subtype: null,
      is_made: null,
      points_scored: null,
      home_score_at_time: null,
      away_score_at_time: null,
      tournament_team_id: null,
      tournament_team_player_id: null,
      description: null,
    };
    const result = prismaToPaperPBPRow(input);
    // 모든 필드가 null 그대로 (fallback 0 / 빈 문자열 변환 0)
    expect(result.id).toBe(BigInt(101));
    expect(result.quarter).toBeNull();
    expect(result.action_type).toBeNull();
    expect(result.action_subtype).toBeNull();
    expect(result.is_made).toBeNull();
    expect(result.points_scored).toBeNull();
    expect(result.home_score_at_time).toBeNull();
    expect(result.away_score_at_time).toBeNull();
    expect(result.tournament_team_id).toBeNull();
    expect(result.tournament_team_player_id).toBeNull();
    expect(result.description).toBeNull();
  });

  // 케이스 3: bigint vs number id — 양쪽 호환
  it("id 가 number 일 때 — number 그대로 보존", () => {
    const input: PrismaPlayByPlayRow = {
      id: 200, // number
      quarter: 2,
      action_type: "shot_made",
      action_subtype: "3pt",
      is_made: true,
      points_scored: 3,
      home_score_at_time: 8,
      away_score_at_time: 5,
      tournament_team_id: 11, // number
      tournament_team_player_id: 202, // number
      description: "[종이 기록] 3점 득점",
    };
    const result = prismaToPaperPBPRow(input);
    expect(result.id).toBe(200);
    expect(result.tournament_team_id).toBe(11);
    expect(result.tournament_team_player_id).toBe(202);
  });

  // 케이스 4: foul row — action_type="foul" 의 특수 케이스 (BFF 가 action_subtype 에 P/T/U/D 박제)
  it("foul row — action_type='foul' + action_subtype='P'", () => {
    const input: PrismaPlayByPlayRow = {
      id: BigInt(102),
      quarter: 1,
      action_type: "foul",
      action_subtype: "P",
      is_made: null,
      points_scored: null,
      home_score_at_time: 5,
      away_score_at_time: 3,
      tournament_team_id: BigInt(11),
      tournament_team_player_id: BigInt(201),
      description: "[종이 기록] P 파울",
    };
    const result = prismaToPaperPBPRow(input);
    expect(result.action_type).toBe("foul");
    expect(result.action_subtype).toBe("P");
    expect(result.is_made).toBeNull();
    expect(result.points_scored).toBeNull();
  });

  // 케이스 5: 배열 매핑 — `pbpRows.map(prismaToPaperPBPRow)` 동작
  it("배열 매핑 — 3개 row 일괄 변환", () => {
    const inputs: PrismaPlayByPlayRow[] = [
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "1pt",
        is_made: true,
        points_scored: 1,
        home_score_at_time: 1,
        away_score_at_time: 0,
        tournament_team_id: BigInt(11),
        tournament_team_player_id: BigInt(201),
        description: "[종이 기록] 1점 득점",
      },
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: true,
        points_scored: 2,
        home_score_at_time: 1,
        away_score_at_time: 2,
        tournament_team_id: BigInt(22),
        tournament_team_player_id: BigInt(301),
        description: "[종이 기록] 2점 득점",
      },
      {
        id: BigInt(3),
        quarter: 2,
        action_type: "foul",
        action_subtype: "T",
        is_made: null,
        points_scored: null,
        home_score_at_time: 1,
        away_score_at_time: 2,
        tournament_team_id: BigInt(11),
        tournament_team_player_id: BigInt(201),
        description: "[종이 기록] T 파울",
      },
    ];
    const results = inputs.map(prismaToPaperPBPRow);
    expect(results).toHaveLength(3);
    expect(results[0].action_subtype).toBe("1pt");
    expect(results[1].action_subtype).toBe("2pt");
    expect(results[2].action_subtype).toBe("T");
    // 원본과 동일 (no mutation)
    expect(results[0]).toEqual(inputs[0]);
    expect(results[1]).toEqual(inputs[1]);
    expect(results[2]).toEqual(inputs[2]);
  });

  // 케이스 6: 정상 + NULL 혼합 — 배열 안 일부 row 만 NULL
  it("배열 안 정상 + NULL 혼합 — 각 row 독립 변환", () => {
    const inputs: PrismaPlayByPlayRow[] = [
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: true,
        points_scored: 2,
        home_score_at_time: 2,
        away_score_at_time: 0,
        tournament_team_id: BigInt(11),
        tournament_team_player_id: BigInt(201),
        description: "[종이 기록] 2점 득점",
      },
      {
        // 손상된 row — 모든 메타 NULL (구버전 박제 잔재)
        id: BigInt(2),
        quarter: null,
        action_type: null,
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: null,
        away_score_at_time: null,
        tournament_team_id: null,
        tournament_team_player_id: null,
        description: null,
      },
    ];
    const results = inputs.map(prismaToPaperPBPRow);
    expect(results).toHaveLength(2);
    expect(results[0].action_type).toBe("shot_made");
    expect(results[1].action_type).toBeNull();
  });

  // 케이스 7: 객체 동일성 — 동일 입력 = 동일 출력 (순수 함수)
  it("순수 함수 — 동일 입력 = 동일 출력", () => {
    const input: PrismaPlayByPlayRow = {
      id: BigInt(99),
      quarter: 3,
      action_type: "shot_made",
      action_subtype: "3pt",
      is_made: true,
      points_scored: 3,
      home_score_at_time: 10,
      away_score_at_time: 7,
      tournament_team_id: BigInt(11),
      tournament_team_player_id: BigInt(201),
      description: "[종이 기록] 3점 득점",
    };
    const r1 = prismaToPaperPBPRow(input);
    const r2 = prismaToPaperPBPRow(input);
    // 동일 값 (deep equal)
    expect(r1).toEqual(r2);
    // 원본 mutation 0
    expect(input.quarter).toBe(3);
  });
});
