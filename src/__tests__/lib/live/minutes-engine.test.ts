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
import { calculateMinutes, applyCompletedCap, type MinutesPbp } from "@/lib/live/minutes-engine";

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

  // 2026-05-03 Tier 2 — DB starter 주입 + endLineup chain 테스트 (케이스 G/H/I)
  it("케이스 G (Tier 2): dbStartersByTeam 주입 시 Q1 starter = DB 값 (PBP 추정 무시)", () => {
    // 시나리오: PBP 만 보면 starter 추정이 [10,11,12,13,14] 이지만
    //          DB 가 [1,2,3,4,5] 로 명시 → DB 우선 사용
    // PBP 구성: 10~14 가 쿼터 시작에 액션 (sub 받은 적 없음 → PBP 추정에서는 starter)
    //          DB 주입: team A=[1,2,3] / team B=[4,5] → union={1..5}
    //          Q1 시뮬은 starter=[1..5] 로 시작. PBP 에 1..5 액션 0건 + sub 0건 →
    //          1..5 가 active 인 채 풀타임(qLen=600s) 누적된다.
    const pbps: MinutesPbp[] = [
      // Q1: PBP 등장 선수 = 10..14 (이들은 모두 sub_in 받은 적 없음)
      { ttpId: ID(10), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(11), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(12), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(13), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(14), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      // 쿼터 끝 표시
      { ttpId: ID(10), quarter: 1, clock: 0, type: "shot", subtype: null, subInId: null, subOutId: null },
    ];

    const dbStartersByTeam = new Map<bigint, Set<bigint>>();
    dbStartersByTeam.set(BigInt(100), new Set([ID(1), ID(2), ID(3)])); // team A
    dbStartersByTeam.set(BigInt(200), new Set([ID(4), ID(5)]));         // team B

    const { bySec } = calculateMinutes({
      pbps,
      qLen: QLEN,
      numQuarters: 1,
      dbStartersByTeam,
    });

    // DB starter [1..5] 가 active 였으므로 Q1 풀타임 600s 누적
    for (let i = 1; i <= 5; i++) {
      expect(bySec.get(ID(i))).toBe(QLEN);
    }
    // PBP 에만 등장한 10~14 는 active 가 아니므로 0 (Map 미등록 또는 0)
    for (let i = 10; i <= 14; i++) {
      expect(bySec.get(ID(i)) ?? 0).toBe(0);
    }
  });

  it("케이스 H (Tier 2): dbStartersByTeam 미주입 시 기존 PBP 추정 동작 (호환성)", () => {
    // 케이스 1 과 동일 시나리오 — 회귀 검증. dbStartersByTeam 옵션 없이 호출.
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
      expect(sec).toBe(QLEN * 4);
      total += sec;
    }
    expect(total).toBe(5 * QLEN * 4);
  });

  it("케이스 I (Tier 2): Q2 endLineup chain — 이전 쿼터 active 5명이 다음 starter 로 사용", () => {
    // 시나리오: Q1 에서 5번 → 6번 swap (영구) 후 그대로 Q2 진입.
    //   Q1 종료 시점 active = {1,2,3,4,6} (5번 빠지고 6번 들어와 있음)
    //   Q2 PBP 액션 = 1번만 (시작/끝). sub 0건 → PBP 만으론 starter=[1번] 1명뿐.
    //   Tier 2 endLineup chain 사용 시 starter = {1,2,3,4,6} (Q1 active 그대로)
    const pbps: MinutesPbp[] = [
      // Q1: starter [1..5] + Q1 중간 5번 → 6번 swap (영구)
      { ttpId: ID(1), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(2), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(3), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(4), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(5), quarter: 1, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      // 5분에 5번 → 6번 swap (영구)
      { ttpId: null, quarter: 1, clock: 300, type: "substitution", subtype: null, subInId: ID(6), subOutId: ID(5) },
      { ttpId: ID(1), quarter: 1, clock: 0, type: "shot", subtype: null, subInId: null, subOutId: null },

      // Q2: PBP 액션 = 1번만 (시작/끝). sub 0건.
      { ttpId: ID(1), quarter: 2, clock: QLEN, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(1), quarter: 2, clock: 0, type: "shot", subtype: null, subInId: null, subOutId: null },
    ];

    const { bySec, byQuarterSec } = calculateMinutes({
      pbps,
      qLen: QLEN,
      numQuarters: 2,
      // dbStartersByTeam 미주입 — Q1 은 PBP 추정으로 [1..5], Q2 는 endLineup chain 으로 {1,2,3,4,6}
    });

    // Q1: 1~4 는 풀타임 600s, 5번 0~5분 = 300s, 6번 5~10분 = 300s
    expect(byQuarterSec.get(ID(1))?.get(1)).toBe(QLEN);
    expect(byQuarterSec.get(ID(5))?.get(1)).toBe(300);
    expect(byQuarterSec.get(ID(6))?.get(1)).toBe(300);

    // Q2: endLineup chain 작동 시 starter = {1,2,3,4,6} → 모두 600s 풀타임
    //     (PBP 추정이었으면 1번만 starter → 1번만 600s 누적)
    expect(byQuarterSec.get(ID(1))?.get(2)).toBe(QLEN);
    expect(byQuarterSec.get(ID(2))?.get(2)).toBe(QLEN); // ← chain 핵심
    expect(byQuarterSec.get(ID(3))?.get(2)).toBe(QLEN);
    expect(byQuarterSec.get(ID(4))?.get(2)).toBe(QLEN);
    expect(byQuarterSec.get(ID(6))?.get(2)).toBe(QLEN); // ← 6번 chain 으로 starter
    // 5번은 Q2 active 아님 → Q2 0 (Q1 만 300s)
    expect(byQuarterSec.get(ID(5))?.get(2) ?? 0).toBe(0);
    expect(bySec.get(ID(5))).toBe(300); // Q1 만
  });

  // 2026-05-03 Tier 3 — starter 첫 segment = qLen 강제 + lastGap 보정 (케이스 J/K)
  it("케이스 J (Tier 3): 첫 PBP clock=414 (qLen=420 기준 6초 늦음) → starter 5명 모두 풀타임 420s", () => {
    // 시나리오: 라이브 매치에서 운영자가 쿼터 시작 직후 PBP 입력을 6초 늦게 시작.
    //   첫 PBP clock=414 < qLen=420.
    //   sub 0건 → starter 5명은 쿼터 처음~끝 풀타임 (다음 쿼터 PBP 존재 → 종료된 쿼터)
    //   기대: starter 5명 모두 sec=420 (qLen 풀타임), firstGap 6초 손실 0
    const QLEN_J = 420;
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      // Q1 첫 PBP — 5명 모두 clock=414 (6초 늦음)
      { ttpId: ID(1), quarter: 1, clock: 414, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(2), quarter: 1, clock: 414, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(3), quarter: 1, clock: 414, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(4), quarter: 1, clock: 414, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(5), quarter: 1, clock: 414, type: "shot", subtype: null, subInId: null, subOutId: null },
      // Q1 끝 (clock=0 까지 입력 정상)
      { ttpId: ID(1), quarter: 1, clock: 0, type: "shot", subtype: null, subInId: null, subOutId: null },
      // Q2 시작 PBP 1건만 — 다음 쿼터 PBP 존재 신호 (Q1 종료된 쿼터로 간주됨)
      { ttpId: ID(1), quarter: 2, clock: QLEN_J, type: "shot", subtype: null, subInId: null, subOutId: null },
    ];

    const { bySec, byQuarterSec } = calculateMinutes({ pbps, qLen: QLEN_J, numQuarters: 4 });

    // Tier 3 핵심: starter 5명 모두 Q1 = 420s 풀타임 (firstGap 6초 손실 0)
    for (const id of starters) {
      expect(byQuarterSec.get(id)?.get(1)).toBe(QLEN_J);
    }
    // 5명 합 = 5 × 420 = 2100s = 35:00 (이전 동작이었으면 ±0 동일하지만 lastGap 누락 시 34:30)
    let totalQ1 = 0;
    for (const id of starters) totalQ1 += byQuarterSec.get(id)?.get(1) ?? 0;
    expect(totalQ1).toBe(5 * QLEN_J); // 정확히 35:00
    // bySec 도 동일 (Q1 만 누적, Q2 는 endLineup chain 으로 풀타임 또 받지만 케이스 J 는 Q1 검증)
    for (const id of starters) {
      expect(bySec.get(id)).toBeGreaterThanOrEqual(QLEN_J); // Q1 풀타임 이상
    }
  });

  it("케이스 K (Tier 3): 마지막 PBP clock=4 + 다음 쿼터 PBP 존재 → 마지막 4초 active 5명 누적", () => {
    // 시나리오: Q1 마지막 PBP clock=4 (lastGap 4초 운영자 입력 누락).
    //   다음 쿼터 (Q2) PBP 존재 → Q1 종료된 쿼터로 간주 → endClock=0 강제
    //   기대: 마지막 4초 active 5명 모두 +4s 추가 누적
    const QLEN_K = 600;
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      // Q1 starter 5명 정상 풀타임 (시작 clock=qLen, 끝 clock=4)
      { ttpId: ID(1), quarter: 1, clock: QLEN_K, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(2), quarter: 1, clock: QLEN_K, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(3), quarter: 1, clock: QLEN_K, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(4), quarter: 1, clock: QLEN_K, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(5), quarter: 1, clock: QLEN_K, type: "shot", subtype: null, subInId: null, subOutId: null },
      // Q1 마지막 PBP clock=4 (4초 lastGap 누락)
      { ttpId: ID(1), quarter: 1, clock: 4, type: "shot", subtype: null, subInId: null, subOutId: null },
      // Q2 시작 PBP — Q1 종료 신호
      { ttpId: ID(1), quarter: 2, clock: QLEN_K, type: "shot", subtype: null, subInId: null, subOutId: null },
    ];

    const { byQuarterSec } = calculateMinutes({ pbps, qLen: QLEN_K, numQuarters: 4 });

    // Tier 3 lastGap 보정: 마지막 4초까지 누적 → starter 5명 모두 Q1 = 600s 풀타임
    // (이전 동작이었으면 endClock=4 → 596s)
    for (const id of starters) {
      expect(byQuarterSec.get(id)?.get(1)).toBe(QLEN_K); // 600s 정확 (596s 가 아님)
    }
  });

  it("케이스 K-2 (Tier 3 회귀 방지): 마지막 쿼터 라이브 진행 중 → endClock 보존 (cap 부풀림 방지)", () => {
    // 시나리오: 마지막 쿼터 (Q4) 진행 중 — clock=200 까지만 PBP. 다음 쿼터 PBP 없음.
    //   기대: Q4 endClock=200 유지 (라이브 진행도만 누적, 0 으로 강제 X)
    //   이 케이스가 깨지면 라이브 매치 부풀림 재발 (5/3 새벽 옵션 D fix 회귀)
    const QLEN_K2 = 600;
    const starters = [ID(1), ID(2), ID(3), ID(4), ID(5)];
    const pbps: MinutesPbp[] = [
      // Q1~Q3 각각 풀타임 정상 (전 쿼터 PBP)
      ...makeQuarterStarters(1, starters, QLEN_K2),
      ...makeQuarterStarters(2, starters, QLEN_K2),
      ...makeQuarterStarters(3, starters, QLEN_K2),
      // Q4 진행 중 — 시작 clock=qLen, 마지막 clock=200 (400초 진행, 200초 잔여)
      { ttpId: ID(1), quarter: 4, clock: QLEN_K2, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(2), quarter: 4, clock: QLEN_K2, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(3), quarter: 4, clock: QLEN_K2, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(4), quarter: 4, clock: QLEN_K2, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(5), quarter: 4, clock: QLEN_K2, type: "shot", subtype: null, subInId: null, subOutId: null },
      { ttpId: ID(1), quarter: 4, clock: 200, type: "shot", subtype: null, subInId: null, subOutId: null },
    ];

    const { byQuarterSec } = calculateMinutes({ pbps, qLen: QLEN_K2, numQuarters: 4 });

    // Q4 = 600 - 200 = 400s (진행도만, 600s 풀타임 X)
    for (const id of starters) {
      expect(byQuarterSec.get(id)?.get(4)).toBe(400); // 라이브 진행도 보존
    }
  });
});

// 2026-05-03 옵션 C — 종료 매치 cap (풀타임 보호) 테스트
describe("applyCompletedCap — 종료 매치 cap (풀타임 보호)", () => {
  it("케이스 A: 합 = qLen × numQ × 5 (만점 매칭)", () => {
    // 5명 모두 partial (sub 누락으로 1800s/명, 합 9000s, 만점 12000s)
    const bySec = new Map<bigint, number>();
    bySec.set(ID(1), 1800);
    bySec.set(ID(2), 1800);
    bySec.set(ID(3), 1800);
    bySec.set(ID(4), 1800);
    bySec.set(ID(5), 1800);
    const expected = QLEN * 4 * 5; // 12000s
    applyCompletedCap(bySec, expected, QLEN, 4);
    let total = 0;
    for (const sec of bySec.values()) total += sec;
    expect(total).toBeCloseTo(expected, 1);
    // 비례 분배 → 모두 동일 (1800 × 12000/9000 = 2400)
    expect(bySec.get(ID(1))).toBeCloseTo(2400, 1);
  });

  it("케이스 B: 풀타임 선수 sec 절대 변경 X (조현철/강동진 케이스)", () => {
    // 풀타임 2명 (각 2400s) + partial 5명 (각 800s = 4000s)
    // 합 = 4800 + 4000 = 8800. 만점 12000 → partial 만 비례 확대 (800 × (12000-4800)/4000 = 1440)
    const bySec = new Map<bigint, number>();
    bySec.set(ID(1), QLEN * 4); // 풀타임 (2400)
    bySec.set(ID(2), QLEN * 4); // 풀타임
    bySec.set(ID(3), 800);
    bySec.set(ID(4), 800);
    bySec.set(ID(5), 800);
    bySec.set(ID(6), 800);
    bySec.set(ID(7), 800);
    const expected = QLEN * 4 * 5;
    applyCompletedCap(bySec, expected, QLEN, 4);
    // 풀타임 sec 절대 변경 X
    expect(bySec.get(ID(1))).toBe(QLEN * 4);
    expect(bySec.get(ID(2))).toBe(QLEN * 4);
    // partial 비례 확대: 800 × (12000-4800)/4000 = 800 × 1.8 = 1440
    expect(bySec.get(ID(3))).toBeCloseTo(1440, 1);
    // 합 만점
    let total = 0;
    for (const sec of bySec.values()) total += sec;
    expect(total).toBeCloseTo(expected, 1);
  });

  it("케이스 C: edge — 풀타임만으로 expected 초과/동일 → 변경 X", () => {
    // 풀타임 5명 = 12000s = expected 정확
    const bySec = new Map<bigint, number>();
    for (let i = 1; i <= 5; i++) bySec.set(ID(i), QLEN * 4);
    const expected = QLEN * 4 * 5;
    applyCompletedCap(bySec, expected, QLEN, 4);
    for (let i = 1; i <= 5; i++) {
      expect(bySec.get(ID(i))).toBe(QLEN * 4); // 변경 X
    }
  });

  // 2026-05-03 LRM (Largest Remainder Method) 정확도 — ±1초 오차 0 보장
  it("케이스 D (LRM): 5명 fractional 분배 시 합계 = expected 정확 일치", () => {
    // 시나리오: raw sum=7000 → ratio=8400/7000=1.2 → fractional 발생 케이스
    // 각 선수 1400s × 1.2 = 1680s (fractional 0이지만, 다른 분포로 fractional 유발)
    // 비대칭 분포 사용: 1500/1400/1400/1400/1300 → ratio=1.2 → 1800/1680/1680/1680/1560
    const bySec = new Map<bigint, number>();
    bySec.set(ID(1), 1500);
    bySec.set(ID(2), 1400);
    bySec.set(ID(3), 1400);
    bySec.set(ID(4), 1400);
    bySec.set(ID(5), 1300);
    const rawSum = 1500 + 1400 + 1400 + 1400 + 1300; // 7000
    const expected = 8400; // ratio = 8400/7000 = 1.2
    applyCompletedCap(bySec, expected, QLEN, 4);
    // 합계가 정확히 expected (toBeCloseTo 가 아니라 toBe — 정확 일치 검증)
    let total = 0;
    for (const sec of bySec.values()) total += sec;
    expect(total).toBe(expected);
    // 모든 값은 정수
    for (const sec of bySec.values()) {
      expect(Number.isInteger(sec)).toBe(true);
    }
    // raw sum 검증 (테스트 의도 명시)
    expect(rawSum).toBe(7000);
  });

  it("케이스 E (LRM): 동일 ratio fractional 케이스 — 합계 정확 + ±1초 분배", () => {
    // 시나리오: 3명 모두 동일 sec → ratio 비례 시 모두 동일 fractional
    // 1000/1000/1000 → expected=3001 → ratio=1.001 → 각 1001 (정수 fractional 0)
    // 더 정확한 fractional 케이스: 1000/1000/1000 → expected=3002 → ratio=3002/3000
    //   = exact 1000.667 → floor=1000, remainder = 3002 - 3000 = 2
    //   → 상위 2명 +1 → [1001, 1001, 1000] = 3002 정확
    const bySec = new Map<bigint, number>();
    bySec.set(ID(1), 1000);
    bySec.set(ID(2), 1000);
    bySec.set(ID(3), 1000);
    const expected = 3002;
    applyCompletedCap(bySec, expected, QLEN, 4);
    let total = 0;
    for (const sec of bySec.values()) total += sec;
    expect(total).toBe(expected); // 정확 일치 (Math.round 였다면 1001×3 = 3003 으로 +1 오차)
    // 각 선수 sec 는 1000 또는 1001 (±1 분배)
    for (const sec of bySec.values()) {
      expect([1000, 1001]).toContain(sec);
    }
    // 정확히 2명만 1001 (remainder=2)
    let count1001 = 0;
    for (const sec of bySec.values()) {
      if (sec === 1001) count1001++;
    }
    expect(count1001).toBe(2);
  });

  it("케이스 F (LRM): 풀타임 + partial 혼합 — partial 내에서만 LRM 적용", () => {
    // 풀타임 2명(2400×2 = 4800) + partial 3명(700/700/700 = 2100)
    // expected = 12000, remaining = 12000-4800 = 7200, partialSum=2100
    // ratio = 7200/2100 ≈ 3.4286 → exact 각 2400 (fractional 0)
    // → floor 2400×3 = 7200 = remaining 정확. remainder=0, +1 분배 0
    // 다른 분포: 800/700/600 = 2100 → ratio ≈ 3.4286
    //   exact: 2742.857 / 2400 / 2057.143
    //   floor: 2742 / 2400 / 2057 = 7199. remainder = 7200 - 7199 = 1
    //   fractional: 0.857 / 0 / 0.143 → 상위 1명(ID3) +1 → 2743/2400/2057 = 7200
    const bySec = new Map<bigint, number>();
    bySec.set(ID(1), QLEN * 4); // 풀타임
    bySec.set(ID(2), QLEN * 4); // 풀타임
    bySec.set(ID(3), 800);
    bySec.set(ID(4), 700);
    bySec.set(ID(5), 600);
    const expected = QLEN * 4 * 5; // 12000
    applyCompletedCap(bySec, expected, QLEN, 4);
    // 풀타임 변경 X
    expect(bySec.get(ID(1))).toBe(QLEN * 4);
    expect(bySec.get(ID(2))).toBe(QLEN * 4);
    // 합계 정확 일치
    let total = 0;
    for (const sec of bySec.values()) total += sec;
    expect(total).toBe(expected);
    // 모두 정수
    for (const sec of bySec.values()) {
      expect(Number.isInteger(sec)).toBe(true);
    }
  });
});
