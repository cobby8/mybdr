/**
 * pbpToFouls 역변환 헬퍼 단위 테스트 — Phase 23 PR1 (2026-05-14).
 *
 * 왜 (이유):
 *   `foulsToPBPEvents` (정방향) ↔ `pbpToFouls` (역방향) round-trip 멱등성 검증.
 *   description 정규식 파싱 안정성 + 폴백 동작 검증.
 *
 * 검증 케이스:
 *   1. 빈 배열
 *   2. P / T / U / D 4 종 round-trip
 *   3. description 파싱 실패 → "P" 폴백
 *   4. Q1~Q4 정렬 안정성
 *   5. mixed 매치 안전망 (외 team_id 무시)
 *
 * BigInt 리터럴 (Nn) 대신 BigInt(N) 생성자 사용 — tsconfig target ES2017 호환
 * (score-from-pbp.test.ts 패턴 동일).
 */

import { describe, it, expect } from "vitest";
import {
  foulsToPBPEvents,
  pbpToFouls,
} from "@/lib/score-sheet/foul-helpers";
import type { PaperPBPRow } from "@/lib/score-sheet/running-score-helpers";
import type {
  FoulsState,
  FoulType,
} from "@/lib/score-sheet/foul-types";

const HOME_TEAM_ID = BigInt(1001);
const AWAY_TEAM_ID = BigInt(2002);

const HOME_PLAYER_1 = "5001";
const HOME_PLAYER_2 = "5002";
const AWAY_PLAYER_1 = "6001";

/**
 * 테스트 헬퍼 — 정방향 결과 (PaperFoulPBPInput[]) 를 DB row 형태로 변환.
 *
 * 룰: action_type = "foul" + home_score_at_time / away_score_at_time = 0 (정방향이 0 박제).
 */
function inputsToRows(
  inputs: ReturnType<typeof foulsToPBPEvents>,
  homeTeamId: bigint,
  awayTeamId: bigint,
  startId: number = 1,
): PaperPBPRow[] {
  return inputs.map((inp, i) => ({
    id: BigInt(startId + i),
    quarter: inp.quarter,
    action_type: inp.action_type,
    action_subtype: null,
    is_made: null,
    points_scored: null,
    home_score_at_time: 0,
    away_score_at_time: 0,
    tournament_team_id: inp.team_side === "home" ? homeTeamId : awayTeamId,
    tournament_team_player_id: BigInt(inp.tournament_team_player_id_str),
    description: inp.description,
  }));
}

describe("pbpToFouls — 역변환 헬퍼 (Phase 23 PR1)", () => {
  // 케이스 1: 빈 배열
  it("빈 PBP 배열 → 빈 home/away FoulsState", () => {
    const result = pbpToFouls([], HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(result.home).toEqual([]);
    expect(result.away).toEqual([]);
  });

  // 케이스 2: P / T / U / D 4 종 round-trip
  it("P / T / U / D 4 종 round-trip 멱등성", () => {
    const original: FoulsState = {
      home: [
        { playerId: HOME_PLAYER_1, period: 1, type: "P" },
        { playerId: HOME_PLAYER_1, period: 2, type: "T" },
        { playerId: HOME_PLAYER_2, period: 2, type: "U" },
        { playerId: HOME_PLAYER_2, period: 3, type: "D" },
      ],
      away: [
        { playerId: AWAY_PLAYER_1, period: 1, type: "P" },
        { playerId: AWAY_PLAYER_1, period: 4, type: "T" },
      ],
    };

    // 정방향 — jersey lookup 임시 (등번호 박제는 description 안에 들어가지만 역변환은
    // type 만 추출하므로 lookup 결과 무관)
    const jerseyLookup = (pid: string): string => {
      if (pid === HOME_PLAYER_1) return "5";
      if (pid === HOME_PLAYER_2) return "10";
      if (pid === AWAY_PLAYER_1) return "23";
      return "?";
    };
    const inputs = foulsToPBPEvents(original, jerseyLookup);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);

    // 정방향 정렬은 period ASC → side(home) → index 순 → 같은 side 안 입력 순서 유지
    // → 역변환 후에도 home 측 입력 순서 보존되어야 함
    expect(recovered.home).toEqual(original.home);
    expect(recovered.away).toEqual(original.away);
  });

  // 케이스 3: description 파싱 실패 → "P" 폴백
  it("description 끝 글자 P/T/U/D 매치 실패 → P 폴백 (안전망)", () => {
    const rows: PaperPBPRow[] = [
      // 정상 매치 (끝 글자 = T)
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 T",
      },
      // 매치 실패 (raw SQL 박제 또는 다른 형식)
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_2),
        description: "Foul committed by player",
      },
      // description NULL
      {
        id: BigInt(3),
        quarter: 2,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: null,
      },
      // 한국어 끝 글자 (X 같은 미정의 letter) — 매치 실패 → P 폴백
      {
        id: BigInt(4),
        quarter: 2,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_2),
        description: "[종이 기록] 선수 10번 X",
      },
    ];

    const recovered = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(4);
    expect(recovered.home[0].type).toBe("T"); // 정상 매치
    expect(recovered.home[1].type).toBe("P"); // 영문 문장 → 폴백
    expect(recovered.home[2].type).toBe("P"); // NULL → 폴백
    expect(recovered.home[3].type).toBe("P"); // X → 폴백
  });

  // 케이스 4: Q1~Q4 정렬 안정성
  it("Q1~Q4 정렬 안정성 — period ASC + id ASC", () => {
    // 의도적으로 quarter 순서 섞기
    const rows: PaperPBPRow[] = [
      {
        id: BigInt(1),
        quarter: 3,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 P",
      },
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_2),
        description: "[종이 기록] 선수 10번 T",
      },
      {
        id: BigInt(3),
        quarter: 4,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 U",
      },
      {
        id: BigInt(4),
        quarter: 2,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 P",
      },
    ];

    const recovered = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    // 정렬 결과: Q1 → Q2 → Q3 → Q4 순
    const periods = recovered.home.map((f) => f.period);
    expect(periods).toEqual([1, 2, 3, 4]);
  });

  // 케이스 5: mixed 매치 안전망 — 외 team_id 무시
  it("mixed 매치 — homeTeamId/awayTeamId 외 team_id row 무시", () => {
    const ROGUE_TEAM_ID = BigInt(9999);
    const rows: PaperPBPRow[] = [
      // home 정상
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 P",
      },
      // away 정상
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: AWAY_TEAM_ID,
        tournament_team_player_id: BigInt(AWAY_PLAYER_1),
        description: "[종이 기록] 선수 23번 T",
      },
      // 외 팀 → 무시
      {
        id: BigInt(3),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: ROGUE_TEAM_ID,
        tournament_team_player_id: BigInt(9001),
        description: "[종이 기록] 선수 99번 D",
      },
      // NULL team_id → 무시
      {
        id: BigInt(4),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: null,
        tournament_team_player_id: BigInt(9002),
        description: "[종이 기록] 선수 X번 P",
      },
    ];

    const recovered = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(1);
    expect(recovered.home[0].type).toBe("P");
    expect(recovered.away).toHaveLength(1);
    expect(recovered.away[0].type).toBe("T");
  });

  // 케이스 6 (보너스): shot_made 등 다른 action_type 무시
  it("foul 외 action_type (shot_made / 기타) 무시", () => {
    const rows: PaperPBPRow[] = [
      // foul 정상
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 P",
      },
      // shot_made — foul 헬퍼에서 무시되어야 함
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: true,
        points_scored: 2,
        home_score_at_time: 2,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 2점 득점",
      },
    ];

    const recovered = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(1);
    expect(recovered.home[0].type).toBe("P");
  });

  // 케이스 7 (보너스): BigInt vs string team ID 비교 양쪽 호환
  it("BigInt + string team ID 입력 호환", () => {
    const original: FoulsState = {
      home: [{ playerId: HOME_PLAYER_1, period: 1, type: "T" }],
      away: [{ playerId: AWAY_PLAYER_1, period: 1, type: "U" }],
    };
    const inputs = foulsToPBPEvents(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);

    // bigint 직접 비교
    const recoveredBigInt = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recoveredBigInt.home).toEqual(original.home);

    // string 비교 (Next.js server→client 직렬화 시뮬레이션)
    const recoveredStr = pbpToFouls(
      rows,
      HOME_TEAM_ID.toString(),
      AWAY_TEAM_ID.toString(),
    );
    expect(recoveredStr.home).toEqual(original.home);
    expect(recoveredStr.away).toEqual(original.away);
  });

  // 케이스 8 (보너스): 정방향 → 역방향 → 정방향 = 동일 박제 결과 (3-pass 멱등)
  it("정방향→역방향→정방향 = 동일 박제 결과 (3-pass 멱등)", () => {
    const original: FoulsState = {
      home: [
        { playerId: HOME_PLAYER_1, period: 1, type: "P" },
        { playerId: HOME_PLAYER_2, period: 2, type: "T" },
      ],
      away: [
        { playerId: AWAY_PLAYER_1, period: 3, type: "U" },
      ],
    };

    // 1차 정방향
    const firstInputs = foulsToPBPEvents(original);
    const firstRows = inputsToRows(firstInputs, HOME_TEAM_ID, AWAY_TEAM_ID);

    // 역방향
    const recovered = pbpToFouls(firstRows, HOME_TEAM_ID, AWAY_TEAM_ID);

    // 2차 정방향
    const secondInputs = foulsToPBPEvents(recovered);

    // local_id + description 의 jersey "?" 차이 제외 (jerseyLookup 없으면 "?" 박제)
    // → 핵심 필드만 비교: tournament_team_player_id_str / quarter / foul_type / team_side
    type StableShape = {
      tournament_team_player_id_str: string;
      quarter: number;
      foul_type: FoulType;
      team_side: "home" | "away";
    };
    const stripVolatile = (arr: typeof firstInputs): StableShape[] =>
      arr.map((x) => ({
        tournament_team_player_id_str: x.tournament_team_player_id_str,
        quarter: x.quarter,
        foul_type: x.foul_type,
        team_side: x.team_side,
      }));

    expect(stripVolatile(secondInputs)).toEqual(stripVolatile(firstInputs));
  });

  // 케이스 9 (보너스): tournament_team_player_id NULL row 무시 (안전망)
  it("tournament_team_player_id NULL row 무시", () => {
    const rows: PaperPBPRow[] = [
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: null, // NULL → 무시
        description: "[종이 기록] 선수 ?번 P",
      },
      // 정상 1건
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: 0,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 선수 5번 P",
      },
    ];

    const recovered = pbpToFouls(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(1);
  });
});
