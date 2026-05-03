// PBP-only 출전시간 산출 엔진 단위 테스트
//
// 7 케이스:
//   1. 종료 매치 (4Q 정상, sub 없음) → 합 = 5 × qLen × 4
//   2. 풀타임 선수 (한 번도 sub_out 안 함) → qLen × 4
//   3. DNP (PBP 미등장) → Map 미등록
//   4. 라이브 (Q2 진행 중) → 합 = 정확 진행도 × 5
//   5. OT (5쿼터)
//   6. 빈 입력
//   7. 컬럼 기반 sub
//
// 주의: tsconfig target=ES2017 라 BigInt 리터럴(`1n`) 사용 불가 → BigInt(1) 형태.

import { describe, it, expect } from "vitest";
import { calculateMinutes, type MinutesPbp } from "@/lib/live/minutes-engine";

const QLEN = 600; // 10분 쿼터
const ID = (n: number) => BigInt(n);

// 헬퍼: starter N명만으로 쿼터 처음~끝 채우는 더미 액션 생성
//   - 쿼터 시작 (clock = qLen) 에 N명 모두 'shot' 1건 → starter 추정용
//   - 쿼터 끝 (clock = endClock) 에 N명 모두 'shot' 1건 → endClock 결정용
function makeQuarterStarters(
  q: number,
  starterIds: bigint[],
  qLen = QLEN,
  endClock = 0,
): MinutesPbp[] {
  const out: MinutesPbp[] = [];
  for (const id of starterIds) {
    out.push({
      ttpId: id, quarter: q, clock: qLen, type: "shot",
      subtype: null, subInId: null, subOutId: null,
    });
  }
  for (const id of starterIds) {
    out.push({
      ttpId: id, quarter: q, clock: endClock, type: "shot",
      subtype: null, subInId: null, subOutId: null,
    });
  }
  return out;
}

describe("calculateMinutes — PBP-only 출전시간 엔진", () => {
  it("케이스 1: 종료 매치 4Q 정상 (sub 없음) → 합 = 5 × qLen × 4", () => {
    // starter 5명이 4쿼터 풀타임. sub 0건.
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      ...makeQuarterStarters(1, starters),
      ...makeQuarterStarters(2, starters),
      ...makeQuarterStarters(3, starters),
      ...makeQuarterStarters(4, starters),
    ];

    const { bySec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 4 });

    let total = 0;
    for (const id of starters) {
      const sec = bySec.get(id) ?? 0;
      expect(sec).toBe(QLEN * 4); // 풀타임 = 600 × 4 = 2400s = 40m
      total += sec;
    }
    expect(total).toBe(5 * QLEN * 4); // 12000s = 200m
  });

  it("케이스 2: 풀타임 선수 (한 번도 sub_out 안 함) → qLen × 4 정확", () => {
    // starter 5명. 6번이 5번 자리에 swap (각 쿼터 5분에 in, 1분에 out)
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [];
    for (let q = 1; q <= 4; q++) {
      pbps.push(...makeQuarterStarters(q, starters));
      pbps.push({
        ttpId: null, quarter: q, clock: 300, type: "substitution",
        subtype: "in:6,out:5", subInId: null, subOutId: null,
      });
      pbps.push({
        ttpId: null, quarter: q, clock: 60, type: "substitution",
        subtype: "in:5,out:6", subInId: null, subOutId: null,
      });
    }

    const { bySec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 4 });

    // 1번 선수는 sub 한 번도 안 됐으므로 풀타임
    expect(bySec.get(ID(1))).toBe(QLEN * 4); // 2400s

    // 5번 선수: 쿼터당 (600-300) + (60-0) = 360s. 4쿼터 = 1440s
    expect(bySec.get(ID(5))).toBe(360 * 4);

    // 6번 선수: 쿼터당 (300-60) = 240s. 4쿼터 = 960s
    expect(bySec.get(ID(6))).toBe(240 * 4);

    // 5+6 합 = 600 × 4 = 한 자리 풀타임
    expect((bySec.get(ID(5)) ?? 0) + (bySec.get(ID(6)) ?? 0)).toBe(QLEN * 4);
  });

  it("케이스 3: DNP (PBP 미등장) → Map 미등록 (=0)", () => {
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps = makeQuarterStarters(1, starters);

    const { bySec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 4 });

    expect(bySec.has(ID(999))).toBe(false);
    expect(bySec.get(ID(999)) ?? 0).toBe(0);
  });

  it("케이스 4: 라이브 (Q2 진행 중, lastClock=400) → 합 = 정확 진행도 × 5", () => {
    // Q1 정상 종료, Q2 는 clock=400 (즉 200초 진행) 까지 PBP 존재
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      ...makeQuarterStarters(1, starters),
      // Q2: 시작 (clock=600) + 진행 중 (clock=400) — endClock = 400
      ...starters.flatMap((id) => [
        {
          ttpId: id, quarter: 2, clock: QLEN, type: "shot",
          subtype: null, subInId: null, subOutId: null,
        } as MinutesPbp,
      ]),
      ...starters.flatMap((id) => [
        {
          ttpId: id, quarter: 2, clock: 400, type: "shot",
          subtype: null, subInId: null, subOutId: null,
        } as MinutesPbp,
      ]),
    ];

    const { bySec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 4 });

    // 1번 선수: Q1 풀(600s) + Q2 진행(600-400=200s) = 800s
    expect(bySec.get(ID(1))).toBe(QLEN + 200);

    // 합: 5명 × 800 = 4000s = Q1 만점(3000) + Q2 진행(1000)
    let total = 0;
    for (const id of starters) total += bySec.get(id) ?? 0;
    expect(total).toBe(5 * (QLEN + 200));
  });

  it("케이스 5: OT (5쿼터) — 5쿼터 정상 처리", () => {
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [];
    for (let q = 1; q <= 5; q++) {
      pbps.push(...makeQuarterStarters(q, starters, QLEN));
    }

    const { bySec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 5 });

    // 5쿼터 풀타임 = 600 × 5 = 3000s
    for (const id of starters) {
      expect(bySec.get(id)).toBe(QLEN * 5);
    }
  });

  it("케이스 6: 빈 입력 → 빈 결과", () => {
    const { bySec } = calculateMinutes({ pbps: [], qLen: QLEN, numQuarters: 4 });
    expect(bySec.size).toBe(0);
  });

  it("케이스 7: 컬럼 기반 sub (subInId/subOutId 직접 사용)", () => {
    // 컬럼이 채워진 케이스 — subtype 미사용
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      ...makeQuarterStarters(1, starters),
      {
        ttpId: null, quarter: 1, clock: 300, type: "substitution",
        subtype: null, subInId: ID(6), subOutId: ID(5),
      },
      {
        ttpId: null, quarter: 1, clock: 60, type: "substitution",
        subtype: null, subInId: ID(5), subOutId: ID(6),
      },
    ];

    const { bySec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 1 });

    // 5번: (600-300) + (60-0) = 360s
    expect(bySec.get(ID(5))).toBe(360);
    // 6번: (300-60) = 240s
    expect(bySec.get(ID(6))).toBe(240);
  });

  it("케이스 8 (보강): 쿼터별 결과 byQuarterSec 정확 분리", () => {
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      ...makeQuarterStarters(1, starters),
      ...makeQuarterStarters(2, starters),
    ];

    const { bySec, byQuarterSec } = calculateMinutes({ pbps, qLen: QLEN, numQuarters: 4 });

    // 1번: Q1 600s + Q2 600s = 1200s
    expect(bySec.get(ID(1))).toBe(QLEN * 2);
    expect(byQuarterSec.get(ID(1))?.get(1)).toBe(QLEN);
    expect(byQuarterSec.get(ID(1))?.get(2)).toBe(QLEN);
    expect(byQuarterSec.get(ID(1))?.get(3)).toBeUndefined(); // Q3 미진행
  });
});
