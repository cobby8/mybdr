/**
 * pbpToScoreMarks 역변환 헬퍼 단위 테스트 — Phase 23 PR1 (2026-05-14).
 *
 * 왜 (이유):
 *   `marksToPaperPBPInputs` (정방향) ↔ `pbpToScoreMarks` (역방향) round-trip 멱등성 검증.
 *   재진입 자동 로드의 신뢰성 = round-trip 깨지면 박제 데이터 손실 / 점수 왜곡 발생.
 *
 * 검증 케이스:
 *   1. 빈 배열 → 빈 ScoreMark
 *   2. home 만 / away 만 / 양쪽 섞임 (round-trip)
 *   3. Q1~Q4 + Q5 (OT) 5 쿼터 round-trip
 *   4. 1점 / 2점 / 3점 슛 혼합 round-trip
 *   5. 정렬 안정성 (같은 score_at_time + 다른 quarter / 다른 id)
 *   6. mixed 매치 안전망 (homeTeamId/awayTeamId 외 team_id 가진 행 무시)
 *   7. action_type !== "shot_made" 무시 (foul / shot_missed 섞여 있어도)
 *   8. BigInt vs string id 비교 양쪽 호환
 *
 * BigInt 리터럴 (Nn) 대신 BigInt(N) 생성자 사용 — tsconfig target ES2017 호환
 * (score-from-pbp.test.ts 패턴 동일).
 */

import { describe, it, expect } from "vitest";
import {
  pbpToScoreMarks,
  marksToPaperPBPInputs,
  type PaperPBPRow,
} from "@/lib/score-sheet/running-score-helpers";
import type {
  RunningScoreState,
} from "@/lib/score-sheet/running-score-types";

/**
 * 테스트 헬퍼 — 정방향 결과 (PaperPBPInput[]) 를 DB row 형태 (PaperPBPRow) 로 변환.
 *
 * 왜 필요한가:
 *   정방향 `marksToPaperPBPInputs` 는 team_side: "home"|"away" 만 반환 (BFF 가 실제
 *   tournament_team_id 채움). round-trip 검증을 위해 테스트 안에서 그 변환을 시뮬레이션.
 *
 * 룰:
 *   - team_side === "home" → tournament_team_id = HOME_TEAM_ID
 *   - team_side === "away" → tournament_team_id = AWAY_TEAM_ID
 *   - id 는 배열 index + 1 부여 (정렬 안정성 검증용)
 */
function inputsToRows(
  inputs: ReturnType<typeof marksToPaperPBPInputs>,
  homeTeamId: bigint,
  awayTeamId: bigint,
  startId: number = 1,
): PaperPBPRow[] {
  return inputs.map((inp, i) => ({
    id: BigInt(startId + i),
    quarter: inp.quarter,
    action_type: inp.action_type,
    action_subtype: inp.action_subtype,
    is_made: inp.is_made,
    points_scored: inp.points_scored,
    home_score_at_time: inp.home_score_at_time,
    away_score_at_time: inp.away_score_at_time,
    tournament_team_id: inp.team_side === "home" ? homeTeamId : awayTeamId,
    tournament_team_player_id: BigInt(inp.tournament_team_player_id_str),
    description: inp.description,
  }));
}

const HOME_TEAM_ID = BigInt(1001);
const AWAY_TEAM_ID = BigInt(2002);

// 테스트 선수 ID — TournamentTeamPlayer.id 시뮬레이션
const HOME_PLAYER_1 = "5001";
const HOME_PLAYER_2 = "5002";
const AWAY_PLAYER_1 = "6001";
const AWAY_PLAYER_2 = "6002";

describe("pbpToScoreMarks — 역변환 헬퍼 (Phase 23 PR1)", () => {
  // 케이스 1: 빈 배열
  it("빈 PBP 배열 → 빈 home/away + currentPeriod=1", () => {
    const result = pbpToScoreMarks([], HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(result.home).toEqual([]);
    expect(result.away).toEqual([]);
    expect(result.currentPeriod).toBe(1);
  });

  // 케이스 2-a: home 만 round-trip
  it("home 만 마킹된 상태 round-trip 멱등성", () => {
    const original: RunningScoreState = {
      home: [
        { position: 2, playerId: HOME_PLAYER_1, period: 1, points: 2 },
        { position: 5, playerId: HOME_PLAYER_2, period: 1, points: 3 },
        { position: 7, playerId: HOME_PLAYER_1, period: 2, points: 2 },
      ],
      away: [],
      currentPeriod: 2,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);

    expect(recovered.home).toEqual(original.home);
    expect(recovered.away).toEqual([]);
    expect(recovered.currentPeriod).toBe(2); // max period
  });

  // 케이스 2-b: away 만 round-trip
  it("away 만 마킹된 상태 round-trip 멱등성", () => {
    const original: RunningScoreState = {
      home: [],
      away: [
        { position: 3, playerId: AWAY_PLAYER_1, period: 1, points: 3 },
        { position: 5, playerId: AWAY_PLAYER_2, period: 2, points: 2 },
      ],
      currentPeriod: 2,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);

    expect(recovered.home).toEqual([]);
    expect(recovered.away).toEqual(original.away);
    expect(recovered.currentPeriod).toBe(2);
  });

  // 케이스 2-c: 양쪽 섞임 round-trip
  it("home + away 혼합 round-trip 멱등성", () => {
    const original: RunningScoreState = {
      home: [
        { position: 2, playerId: HOME_PLAYER_1, period: 1, points: 2 },
        { position: 5, playerId: HOME_PLAYER_1, period: 1, points: 3 },
        { position: 7, playerId: HOME_PLAYER_2, period: 2, points: 2 },
      ],
      away: [
        { position: 3, playerId: AWAY_PLAYER_1, period: 1, points: 3 },
        { position: 5, playerId: AWAY_PLAYER_2, period: 2, points: 2 },
      ],
      currentPeriod: 2,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);

    expect(recovered.home).toEqual(original.home);
    expect(recovered.away).toEqual(original.away);
  });

  // 케이스 3: Q1~Q5 (OT) 5 쿼터 round-trip
  it("Q1~Q5 (OT 포함) 5 쿼터 round-trip", () => {
    const original: RunningScoreState = {
      home: [
        { position: 18, playerId: HOME_PLAYER_1, period: 1, points: 2 },
        { position: 35, playerId: HOME_PLAYER_2, period: 2, points: 3 },
        { position: 52, playerId: HOME_PLAYER_1, period: 3, points: 2 },
        { position: 70, playerId: HOME_PLAYER_2, period: 4, points: 2 },
        { position: 73, playerId: HOME_PLAYER_1, period: 5, points: 3 }, // OT1
      ],
      away: [
        { position: 16, playerId: AWAY_PLAYER_1, period: 1, points: 2 },
        { position: 33, playerId: AWAY_PLAYER_2, period: 2, points: 2 },
        { position: 50, playerId: AWAY_PLAYER_1, period: 3, points: 3 },
        { position: 68, playerId: AWAY_PLAYER_2, period: 4, points: 1 },
        { position: 70, playerId: AWAY_PLAYER_1, period: 5, points: 2 }, // OT1
      ],
      currentPeriod: 5,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);

    expect(recovered.home).toEqual(original.home);
    expect(recovered.away).toEqual(original.away);
    expect(recovered.currentPeriod).toBe(5);
  });

  // 케이스 4: 1점 / 2점 / 3점 혼합 round-trip
  it("1점/2점/3점 슛 혼합 round-trip — points_scored 정확 복원", () => {
    const original: RunningScoreState = {
      home: [
        { position: 1, playerId: HOME_PLAYER_1, period: 1, points: 1 }, // 자유투 1점
        { position: 3, playerId: HOME_PLAYER_1, period: 1, points: 2 }, // 2점
        { position: 6, playerId: HOME_PLAYER_1, period: 1, points: 3 }, // 3점
      ],
      away: [],
      currentPeriod: 1,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);

    expect(recovered.home).toEqual(original.home);
    expect(recovered.home[0].points).toBe(1);
    expect(recovered.home[1].points).toBe(2);
    expect(recovered.home[2].points).toBe(3);
  });

  // 케이스 5: 정렬 안정성 — 다른 quarter / 다른 id 보조 정렬
  it("정렬 안정성 — quarter 와 id 보조 정렬 작동", () => {
    // 가짜 row 직접 구성 (정방향 거치지 않고) — 의도적으로 id 순서 섞음
    const rows: PaperPBPRow[] = [
      // Q2 (id 1) — 두번째 위치
      {
        id: BigInt(1),
        quarter: 2,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: true,
        points_scored: 2,
        home_score_at_time: 4,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "[종이 기록] 2점 득점",
      },
      // Q1 (id 2) — 첫번째 위치 (id 가 더 크지만 quarter 가 작아서 먼저 와야 함)
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

    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(2);
    // 정렬 결과: Q1(position 2) 먼저, Q2(position 4) 뒤
    expect(recovered.home[0]).toEqual({
      position: 2,
      playerId: HOME_PLAYER_1,
      period: 1,
      points: 2,
    });
    expect(recovered.home[1]).toEqual({
      position: 4,
      playerId: HOME_PLAYER_1,
      period: 2,
      points: 2,
    });
  });

  // 케이스 6: mixed 매치 안전망 — 외 team_id 무시
  it("mixed 매치 — homeTeamId/awayTeamId 외 team_id row 무시", () => {
    const ROGUE_TEAM_ID = BigInt(9999);
    const rows: PaperPBPRow[] = [
      {
        id: BigInt(1),
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
      // 외 팀 (서버 동기화 사고 등) → 무시되어야 함
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "3pt",
        is_made: true,
        points_scored: 3,
        home_score_at_time: 5,
        away_score_at_time: 0,
        tournament_team_id: ROGUE_TEAM_ID,
        tournament_team_player_id: BigInt(9001),
        description: "[종이 기록] 3점 득점",
      },
      // NULL team_id → 무시
      {
        id: BigInt(3),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "1pt",
        is_made: true,
        points_scored: 1,
        home_score_at_time: 6,
        away_score_at_time: 0,
        tournament_team_id: null,
        tournament_team_player_id: BigInt(9002),
        description: "[종이 기록] 1점 득점",
      },
    ];

    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    // 정상 row 1건만 통과
    expect(recovered.home).toHaveLength(1);
    expect(recovered.home[0].position).toBe(2);
    expect(recovered.away).toHaveLength(0);
  });

  // 케이스 7: action_type !== "shot_made" 무시
  it("foul / shot_missed / 기타 action_type 무시", () => {
    const rows: PaperPBPRow[] = [
      // 유효한 shot_made
      {
        id: BigInt(1),
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
      // foul — 무시
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "foul",
        action_subtype: null,
        is_made: null,
        points_scored: null,
        home_score_at_time: null,
        away_score_at_time: null,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_2),
        description: "[종이 기록] 선수 5번 P",
      },
      // shot_missed — 무시 (Flutter 박제 데이터에서 보이기 가능)
      {
        id: BigInt(3),
        quarter: 1,
        action_type: "shot_missed",
        action_subtype: "2pt",
        is_made: false,
        points_scored: 0,
        home_score_at_time: 2,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "shot missed",
      },
      // is_made === false 인 shot_made (안전망) — 무시
      {
        id: BigInt(4),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: false,
        points_scored: 2,
        home_score_at_time: 4,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "weird row",
      },
    ];

    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(1);
    expect(recovered.home[0].position).toBe(2);
  });

  // 케이스 8-a: BigInt 입력 호환
  it("BigInt team ID 입력 호환", () => {
    const original: RunningScoreState = {
      home: [{ position: 2, playerId: HOME_PLAYER_1, period: 1, points: 2 }],
      away: [{ position: 3, playerId: AWAY_PLAYER_1, period: 1, points: 3 }],
      currentPeriod: 1,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);

    // BigInt 직접 비교
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toEqual(original.home);
    expect(recovered.away).toEqual(original.away);
  });

  // 케이스 8-b: string 입력 호환 (Next.js server → client 직렬화 시뮬레이션)
  it("string team ID 입력 호환 (직렬화 시뮬레이션)", () => {
    const original: RunningScoreState = {
      home: [{ position: 2, playerId: HOME_PLAYER_1, period: 1, points: 2 }],
      away: [{ position: 3, playerId: AWAY_PLAYER_1, period: 1, points: 3 }],
      currentPeriod: 1,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);

    // string 비교 (BigInt → toString 후 입력 가정)
    const recovered = pbpToScoreMarks(
      rows,
      HOME_TEAM_ID.toString(),
      AWAY_TEAM_ID.toString(),
    );
    expect(recovered.home).toEqual(original.home);
    expect(recovered.away).toEqual(original.away);
  });

  // 케이스 9 (보너스): 정방향 → 역방향 → 정방향 = 동일 PBP shape 멱등성
  it("정방향→역방향→정방향 = 동일 박제 결과 (3-pass 멱등)", () => {
    const original: RunningScoreState = {
      home: [
        { position: 2, playerId: HOME_PLAYER_1, period: 1, points: 2 },
        { position: 5, playerId: HOME_PLAYER_2, period: 2, points: 3 },
      ],
      away: [
        { position: 3, playerId: AWAY_PLAYER_1, period: 1, points: 3 },
      ],
      currentPeriod: 2,
    };

    // 1차 정방향
    const firstInputs = marksToPaperPBPInputs(original);
    const firstRows = inputsToRows(firstInputs, HOME_TEAM_ID, AWAY_TEAM_ID);

    // 역방향
    const recovered = pbpToScoreMarks(firstRows, HOME_TEAM_ID, AWAY_TEAM_ID);

    // 2차 정방향 — recovered state 그대로 박제
    const secondInputs = marksToPaperPBPInputs(recovered);

    // local_id (uuid) 제외하고 비교 — 박제 시점마다 새로 발급되므로 의미 있는 필드만 검증
    type StableShape = Omit<typeof firstInputs[number], "local_id">;
    const stripLocalId = (arr: typeof firstInputs): StableShape[] =>
      arr.map((x) => {
        const { local_id: _local_id, ...rest } = x;
        return rest;
      });

    expect(stripLocalId(secondInputs)).toEqual(stripLocalId(firstInputs));
  });

  // 케이스 10 (보너스): points_scored 가 1/2/3 외 값 → row 무시
  it("points_scored ∉ {1,2,3} → row 무시 (안전망)", () => {
    const rows: PaperPBPRow[] = [
      {
        id: BigInt(1),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: true,
        points_scored: 4, // 비정상 값
        home_score_at_time: 4,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "weird",
      },
      {
        id: BigInt(2),
        quarter: 1,
        action_type: "shot_made",
        action_subtype: "2pt",
        is_made: true,
        points_scored: 0, // 비정상 값
        home_score_at_time: 4,
        away_score_at_time: 0,
        tournament_team_id: HOME_TEAM_ID,
        tournament_team_player_id: BigInt(HOME_PLAYER_1),
        description: "weird",
      },
      // 정상 1건
      {
        id: BigInt(3),
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

    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(recovered.home).toHaveLength(1);
    expect(recovered.home[0].points).toBe(2);
  });

  // 케이스 11 (보너스): currentPeriod 자동 결정 = max(home/away period, 1)
  it("currentPeriod = max(home/away period 최대값, 1)", () => {
    const original: RunningScoreState = {
      home: [{ position: 2, playerId: HOME_PLAYER_1, period: 3, points: 2 }],
      away: [{ position: 3, playerId: AWAY_PLAYER_1, period: 5, points: 3 }],
      currentPeriod: 5,
    };
    const inputs = marksToPaperPBPInputs(original);
    const rows = inputsToRows(inputs, HOME_TEAM_ID, AWAY_TEAM_ID);
    const recovered = pbpToScoreMarks(rows, HOME_TEAM_ID, AWAY_TEAM_ID);
    // away period 5 가 최대 → currentPeriod = 5
    expect(recovered.currentPeriod).toBe(5);
  });

  // 케이스 12 (보너스): 빈 PBP 시 currentPeriod=1 폴백
  it("빈 PBP 입력 시 currentPeriod=1 폴백", () => {
    const result = pbpToScoreMarks([], HOME_TEAM_ID, AWAY_TEAM_ID);
    expect(result.currentPeriod).toBe(1);
  });
});
