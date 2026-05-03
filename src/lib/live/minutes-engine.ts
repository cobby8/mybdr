/**
 * minutes-engine — 출전시간 계산 엔진
 *
 * ## 알고리즘 설계 (2026-05-03 정리)
 *
 * ### 메인 path (사용자 제안 — 정확도 ~99%)
 *   1. Q1 starter = DB isStarter (MatchPlayerStat.isStarter, Flutter sync)
 *   2. Q2~ starter = 직전 쿼터 endLineup chain (시뮬 종료 시 active 5명)
 *   3. Boundary 강제: starter firstSegment = qLen / 다음 쿼터 PBP 있으면 endClock=0
 *   4. LRM cap (종료 매치): 양팀 합 = expected 정확화 (Largest Remainder)
 *
 * ### Fallback (안전망 — 실측 발동 0회, 미래 데이터 보장용)
 *   - Q1 isStarter 5명 미만 → inferStartersFromPbp() (PBP 등장 + sub_out 기반 추정)
 *   - Q2~ endLineup 비현실 (3명 미만 / 7명 초과) → inferStartersFromPbp()
 *
 * ### 정확도
 *   - 종료 매치: LRM cap 으로 양팀 합 100% 정확
 *   - 라이브 매치: starter DB 입력 시 ~99% / 미입력 시 fallback 으로 ~85%
 */

export type MinutesPbp = {
  ttpId: bigint | null;          // tournament_team_player_id
  quarter: number;
  clock: number;                  // game_clock_seconds (쿼터 시작 = qLen, 종료 = 0)
  type: string;                   // action_type (특히 'substitution')
  subtype: string | null;         // action_subtype ("in:X,out:Y" 형태)
  subInId: bigint | null;         // sub_in_player_id 컬럼 (있으면 우선)
  subOutId: bigint | null;        // sub_out_player_id 컬럼
};

export type MinutesInput = {
  pbps: MinutesPbp[];
  qLen: number;                   // quarter length (sec) — 보통 420/480/600/720
  numQuarters: number;            // 4 (정규) or 5+ (OT 포함)
  // 메인 path #1: Q1 starter 를 DB 에서 직접 주입 (MatchPlayerStat.isStarter 출처).
  // 형식: Map<teamId, Set<ttp_id>> — calculateMinutes 는 모든 Set 을 union 하여 사용.
  // 미주입 시 inferStartersFromPbp() fallback (호환성).
  dbStartersByTeam?: Map<bigint, Set<bigint>>;
};

export type MinutesResult = {
  bySec: Map<bigint, number>;                        // ttpId → 총 출전 초
  byQuarterSec: Map<bigint, Map<number, number>>;    // ttpId → quarter → 초
};

/**
 * PBP-only fallback — DB isStarter 미주입 또는 endLineup 비현실 시에만 호출.
 * 메인 path 는 dbStartersByTeam + endLineup chain 사용 권장.
 *
 * 알고리즘:
 *   - sub_out 등장 선수 (= 그 시점 ON-COURT 였음)
 *   - 첫 sub 이전 등장 선수 (= 시작부터 ON-COURT 였을 가능성)
 *   - 두 set 의 union 을 starter 후보로 반환
 *
 * 핵심: swap 케이스 (5번 out → 6번 in → 5번 in 으로 다시 복귀) 에서
 *   5번을 starter 로 잡아야 정확. "sub_in 받은 적 있다" 만으로 제외하면 오류.
 */
function inferStartersFromPbp(qPbps: MinutesPbp[]): Set<bigint> {
  // sub_in/out 파싱: 컬럼 우선, 없으면 action_subtype "in:X,out:Y" 정규식
  type Sub = { clock: number; inId: bigint; outId: bigint };
  const subs: Sub[] = [];
  for (const p of qPbps) {
    if (p.type !== "substitution") continue;
    let inId = p.subInId;
    let outId = p.subOutId;
    if (!inId || !outId) {
      const m = p.subtype?.match(/^in:(\d+),out:(\d+)$/);
      if (m) {
        inId = inId ?? BigInt(m[1]);
        outId = outId ?? BigInt(m[2]);
      }
    }
    if (inId && outId) {
      subs.push({ clock: p.clock, inId, outId });
    }
  }

  // 쿼터 내 등장 선수 (PBP 액션 + sub 양쪽)
  const everSeen = new Set<bigint>();
  for (const p of qPbps) {
    if (p.ttpId) everSeen.add(p.ttpId);
  }
  for (const s of subs) {
    everSeen.add(s.inId);
    everSeen.add(s.outId);
  }

  // 첫 sub 이전 (clock > firstSubClock) 에 액션을 한 선수 — starter 확정
  const firstSubClock = subs.length > 0 ? subs[0].clock : -1;
  const subInIds = new Set(subs.map((s) => s.inId));
  const subOutIds = new Set(subs.map((s) => s.outId));
  const seenBeforeFirstSub = new Set<bigint>();
  if (firstSubClock >= 0) {
    for (const p of qPbps) {
      if (!p.ttpId) continue;
      if (p.clock > firstSubClock) seenBeforeFirstSub.add(p.ttpId);
    }
  }

  // starter 후보 union
  const starters = new Set<bigint>();
  for (const id of everSeen) {
    // (a) sub_in 받은 적 없음 → starter (풀타임 또는 sub_out 만 됨)
    if (!subInIds.has(id)) {
      starters.add(id);
      continue;
    }
    // (b) sub_in 받았지만 한 번이라도 sub_out 도 됨 → 코트에 있던 선수 (starter 후보)
    //     + 첫 sub 이전에 액션도 있으면 starter 확정 (swap 케이스 대응)
    if (subOutIds.has(id) && seenBeforeFirstSub.has(id)) {
      starters.add(id);
    }
  }
  return starters;
}

export function calculateMinutes(input: MinutesInput): MinutesResult {
  const { pbps, qLen, numQuarters, dbStartersByTeam } = input;
  const result = new Map<bigint, number>();
  const resultByQ = new Map<bigint, Map<number, number>>();

  // 메인 path #1: DB starter union (양팀 합집합) 사전 계산
  //   왜 union: Q1 시뮬은 ttp 단위로만 동작. 팀 분리는 호출자(route.ts)가 cap 단계에서 수행.
  //   비현실 검증 (size < 5 또는 > 12) 통과 시만 사용.
  const dbStartersUnion = (() => {
    if (!dbStartersByTeam || dbStartersByTeam.size === 0) return null;
    const u = new Set<bigint>();
    for (const set of dbStartersByTeam.values()) {
      for (const id of set) u.add(id);
    }
    if (u.size < 5 || u.size > 12) return null;
    return u;
  })();

  // 메인 path #2: 직전 쿼터 endLineup chain — 쿼터별 종료 시점 active set 보존
  const prevEndLineupByQ = new Map<number, Set<bigint>>();

  // 메인 path #3 (lastGap 보정): 어느 쿼터에 PBP 가 있는지 사전 수집.
  //   "이 쿼터의 다음 쿼터에 PBP 가 1건이라도 있으면" 이 쿼터는 종료된 쿼터로 간주
  //   → endClock=0 강제 (lastGap 보정). 라이브 마지막 쿼터는 endClock=lastPbpClock 유지.
  const quartersWithPbp = new Set<number>();
  for (const p of pbps) quartersWithPbp.add(p.quarter);

  // 쿼터별 누적 헬퍼 — total + byQuarter 동시 갱신
  const addSec = (id: bigint, q: number, sec: number) => {
    if (sec <= 0) return;
    result.set(id, (result.get(id) ?? 0) + sec);
    let qMap = resultByQ.get(id);
    if (!qMap) {
      qMap = new Map();
      resultByQ.set(id, qMap);
    }
    qMap.set(q, (qMap.get(q) ?? 0) + sec);
  };

  for (let q = 1; q <= numQuarters; q++) {
    // 쿼터별 PBP 추출 + 시간순 정렬 (clock 큰 쪽 = 쿼터 시작 → 작은 쪽 = 쿼터 종료)
    const qPbps = pbps
      .filter((p) => p.quarter === q)
      .sort((a, b) => b.clock - a.clock);

    if (qPbps.length === 0) continue; // 시작 안 된 쿼터

    // sub PBP 파싱 (시뮬용) — inferStartersFromPbp 와 동일 룰 (컬럼 우선 + subtype 폴백)
    type Sub = { clock: number; inId: bigint; outId: bigint };
    const subs: Sub[] = [];
    for (const p of qPbps) {
      if (p.type !== "substitution") continue;
      let inId = p.subInId;
      let outId = p.subOutId;
      if (!inId || !outId) {
        const m = p.subtype?.match(/^in:(\d+),out:(\d+)$/);
        if (m) {
          inId = inId ?? BigInt(m[1]);
          outId = outId ?? BigInt(m[2]);
        }
      }
      if (inId && outId) {
        subs.push({ clock: p.clock, inId, outId });
      }
    }

    // === Q1 starter 결정 ===
    let starters: Set<bigint>;
    if (q === 1) {
      if (dbStartersUnion) {
        // 메인 path #1: DB isStarter (PBP 추정 무시)
        starters = new Set(dbStartersUnion);
      } else {
        // Fallback: PBP 추정 (실측 발동 0회 — 미래 안전망)
        starters = inferStartersFromPbp(qPbps);
      }
    } else {
      // === Q2+ starter 결정 ===
      const prevEndLineup = prevEndLineupByQ.get(q - 1);
      if (prevEndLineup && prevEndLineup.size >= 3 && prevEndLineup.size <= 7) {
        // 메인 path #2: endLineup chain (작전타임 교체 발생률 ~2.5%)
        starters = new Set(prevEndLineup);
      } else {
        // Fallback: PBP 추정
        starters = inferStartersFromPbp(qPbps);
      }
    }

    // === 메인 path #3: Boundary 강제 ===
    // starter 첫 segment 시작 = qLen (firstGap 회복)
    // 다음 쿼터에 PBP 있으면 endClock=0 (lastGap 회복)
    const active = new Set<bigint>(starters);
    // starter active 시작 시각 = 무조건 qLen.
    //   왜: 첫 PBP clock=414 (qLen=420 기준 6초 늦음) 이어도 starter 5명은 쿼터 시작
    //   (game_clock=qLen) 부터 코트에 있던 것이 농구 규칙상 자명. firstGap (qLen → 첫 PBP clock)
    //   을 starter 시간에 포함해야 정확. 이상치 방어: 첫 PBP clock > qLen 같은 데이터 오류는 무시.
    let lastClock = qLen;

    for (const sub of subs) {
      // sub 시점 직전까지 active 전원에게 segment 시간 누적
      const delta = lastClock - sub.clock;
      if (delta > 0) {
        for (const id of active) {
          addSec(id, q, delta);
        }
      }
      // sub 적용: out 제거, in 추가
      active.delete(sub.outId);
      active.add(sub.inId);
      lastClock = sub.clock;
    }

    // 쿼터 종료까지 잔여 segment (lastGap 보정)
    //   - 다음 쿼터 PBP 존재 (= 이 쿼터 분명 종료) → endClock=0 강제
    //     debugger 분석상 lastGap p90=34s 라 평균적으로 active 5명 × 30s = 150s/팀 회복 가능
    //   - 다음 쿼터 PBP 없음 (= 마지막 쿼터, 라이브 진행 중일 수 있음) → endClock=lastPbpClock
    //     라이브 cap 부풀림 방지 — 진행도만큼만 누적
    //   주의: 마지막 쿼터가 종료 매치여도 endClock=lastPbpClock → 후속 applyCompletedCap 이 만점 보정함
    const hasNextQuarterPbp = quartersWithPbp.has(q + 1);
    const endClock = hasNextQuarterPbp ? 0 : qPbps[qPbps.length - 1].clock;
    const remaining = lastClock - endClock;
    if (remaining > 0) {
      for (const id of active) {
        addSec(id, q, remaining);
      }
    }

    // 다음 쿼터 starter chain 용 — 이 쿼터 종료 시점 active set 저장
    prevEndLineupByQ.set(q, new Set(active));
  }

  return { bySec: result, byQuarterSec: resultByQ };
}

/**
 * 메인 path #4: LRM cap — 종료 매치만 적용.
 * 양팀 합이 expected (qLen × 4 × 5 + OT) 와 정확히 일치하도록 보정.
 * Largest Remainder Method 로 ±1초 오차 0 보장.
 *
 * 핵심 원칙:
 *   1. 라이브 매치 cap X (호출자가 status='completed' 일 때만 호출)
 *   2. 풀타임 선수 sec 절대 변경 X (sub 0건 = qLen×numQ 만점)
 *   3. 풀타임 외 선수만 LRM 분배로 cap 매칭
 *
 * 입력:
 *   bySec       — 한 팀 선수들의 sec map (호출자가 home/away 로 분리 후 호출)
 *   expected    — 한 팀 코트시간 합 (qLen × numQuarters × 5)
 *   qLen        — 쿼터 길이 (풀타임 임계값 산출)
 *   numQuarters — 쿼터 수 (풀타임 임계값 산출)
 *
 * 동작: bySec in-place 수정 (Map mutation)
 */
export function applyCompletedCap(
  bySec: Map<bigint, number>,
  expected: number,
  qLen: number,
  numQuarters: number,
): void {
  // 풀타임 임계값: qLen×numQ - 5초 (sub 미세 오차 흡수)
  const fullTimeThreshold = qLen * numQuarters - 5;

  // 풀타임 / 풀타임 외 분리
  let fullTimeSum = 0;
  let partialSum = 0;
  const partialIds: bigint[] = [];
  for (const [id, sec] of bySec) {
    if (sec >= fullTimeThreshold) {
      fullTimeSum += sec; // 풀타임 — 변경 X
    } else {
      partialSum += sec;
      partialIds.push(id);
    }
  }

  // 풀타임 외 선수에게 분배 가능한 잔여 sec
  const remainingForPartial = expected - fullTimeSum;
  // edge case: 풀타임 합이 expected 초과/동일 또는 partial 0 → cap 적용 무의미 (그대로)
  if (remainingForPartial <= 0 || partialSum <= 0) return;

  // Largest Remainder Method (LRM) — 합계가 정확히 remainingForPartial 와 일치하도록 보정
  // 왜 LRM:
  //   기존 Math.round 단순 비례 시 누적 round 오차로 양팀 합 ±1초 발생 (예: 139:59 / 140:01).
  //   LRM 은 floor 후 fractional 큰 순 +1 분배로 합계를 정확히 expected 와 일치시킨다.
  // 동작:
  //   1. 각 선수 exact = sec × ratio 계산
  //   2. floor 적용 (정수 초)
  //   3. 잔여 = expected - sum(floor) (≥0 정수)
  //   4. fractional (exact - floor) 큰 순으로 정렬 → 상위 잔여 명에게 +1
  const ratio = remainingForPartial / partialSum;
  const exactValues = new Map<bigint, number>();
  const floorValues = new Map<bigint, number>();
  let floorSum = 0;
  for (const id of partialIds) {
    const exact = (bySec.get(id) ?? 0) * ratio;
    const floor = Math.floor(exact);
    exactValues.set(id, exact);
    floorValues.set(id, floor);
    floorSum += floor;
  }
  // 잔여 = expected - floor 합계 (0 이상 정수)
  const remainder = remainingForPartial - floorSum;
  // fractional 큰 순 정렬 → 상위 remainder 명에게 +1 분배
  const sortedByFraction = partialIds.slice().sort((a, b) => {
    const fracA = exactValues.get(a)! - floorValues.get(a)!;
    const fracB = exactValues.get(b)! - floorValues.get(b)!;
    return fracB - fracA;
  });
  // 일단 모두 floor 값으로 set
  for (const id of partialIds) {
    bySec.set(id, floorValues.get(id)!);
  }
  // 상위 remainder 명에게 +1
  for (let i = 0; i < remainder; i++) {
    const id = sortedByFraction[i];
    bySec.set(id, (bySec.get(id) ?? 0) + 1);
  }
}
