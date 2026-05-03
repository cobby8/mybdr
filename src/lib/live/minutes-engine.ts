// PBP-only 출전시간 산출 엔진 (2026-05-03)
//
// 왜 분리했나:
//   기존 route.ts 는 quarterStatsJson / minutesPlayed / sub-based MAX 등 여러 source 를
//   섞어 cap/fallback/보정 다중 단계로 처리 → 5/3 라이브 매치 부풀림 + ≥30분 만점 cap 누락 등
//   재발 다수. PBP substitution 은 농구 출전시간의 단일 진실 원천이므로
//   "PBP only" 단일 알고리즘으로 단순화.
//
// 알고리즘:
//   1. 쿼터별로 PBP 를 clock 내림차순(쿼터 시작 → 종료) 정렬
//   2. starter 추정 = 쿼터 내 등장 선수 중 sub_in 으로 들어온 적 없는 선수
//   3. active set = starter 로 초기화 (쿼터 시작 = qLen 초)
//   4. sub PBP 따라 active set 갱신 + 직전 segment 시간을 active 전원에게 누적
//   5. 쿼터 종료 (clock 0 또는 라이브 진행 중 = lastClock) 까지 잔여 누적
//
// 자연 처리 항목:
//   - DNP: PBP 미등장 → Map 미등록 → 0
//   - 풀타임 선수: sub 없음 → 쿼터 시작~종료 전체 누적 (qLen × N쿼터)
//   - 라이브 진행 중 쿼터: lastClock > 0 → progressed 만큼만 누적 (cap 불필요)
//   - OT: numQuarters 5+ 자동 처리

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
  // 2026-05-03 Tier 2 보강: Q1 starter 를 DB 에서 직접 주입 (MatchPlayerStat.isStarter 출처).
  // 왜: PBP 추정은 sub_in/seenBeforeFirstSub 룰 기반으로 92~93% 정확도. DB starter 는
  //      Flutter 가 매치 시작 시 5명 정확히 sync 하므로 100% 정확. 주입 시 Q1 추정 무시.
  // 형식: Map<teamId, Set<ttp_id>> — calculateMinutes 는 모든 Set 을 union 하여 사용.
  // 미주입 (undefined) 또는 union 결과 <5 명 시 기존 PBP 추정 fallback (호환성).
  // Q2 이후는 직전 쿼터 시뮬 끝 active set 을 endLineup chain 으로 자동 사용 (별도 입력 불필요).
  dbStartersByTeam?: Map<bigint, Set<bigint>>;
};

export type MinutesResult = {
  bySec: Map<bigint, number>;                        // ttpId → 총 출전 초
  byQuarterSec: Map<bigint, Map<number, number>>;    // ttpId → quarter → 초
};

export function calculateMinutes(input: MinutesInput): MinutesResult {
  const { pbps, qLen, numQuarters, dbStartersByTeam } = input;
  const result = new Map<bigint, number>();
  const resultByQ = new Map<bigint, Map<number, number>>();

  // 2026-05-03 Tier 2: DB starter (Q1) union — 모든 팀의 isStarter=true ttp_id 합집합.
  // 왜 union: Q1 시뮬은 ttp 단위로만 동작. 팀 분리는 호출자(route.ts)가 cap 단계에서 수행.
  //          union 결과가 양팀 starter 10명(보통)이므로 Q1 active set 의 정답.
  // 자료 무결성: 한 매치당 양팀 합 ≥ 5 명 + 비현실 검증 (3~12명) 통과 시만 사용.
  const dbStartersUnion = (() => {
    if (!dbStartersByTeam || dbStartersByTeam.size === 0) return null;
    const u = new Set<bigint>();
    for (const set of dbStartersByTeam.values()) {
      for (const id of set) u.add(id);
    }
    // 비현실 케이스 (양팀 starter 합 5명 미만 또는 12명 초과) → fallback
    if (u.size < 5 || u.size > 12) return null;
    return u;
  })();

  // 2026-05-03 Tier 2: 직전 쿼터 endLineup chain 용 — 쿼터별 종료 시점 active set 보존.
  //   Q2 이후 starter 추정 시 Q(N-1) 의 active 가 5명±2 (3~7) 면 그대로 다음 starter 로 사용.
  //   비현실(<3 또는 >7) 시 fallback (PBP 추정).
  const prevEndLineupByQ = new Map<number, Set<bigint>>();

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

    // starter 추정 (정확한 룰):
    //   1) "첫 sub_in" 보다 먼저 코트에 있어야만 starter 후보
    //      → 즉 [첫 sub_in 시점 이전에 액션 1건 이상] OR [한 번이라도 sub_out 됨]
    //   2) 쿼터 내내 sub 무관하게 액션만 있는 선수도 starter (풀타임)
    //   3) 어느 sub 에서도 in 으로 등장하지 않은 선수는 무조건 starter
    //
    // 핵심: swap 케이스 (5번 out → 6번 in → 5번 in 으로 다시 복귀) 에서
    //   5번을 starter 로 잡아야 정확. "sub_in 받은 적 있다" 만으로 제외하면 오류.
    const firstSubClock = subs.length > 0 ? subs[0].clock : -1;
    const subInIds = new Set(subs.map((s) => s.inId));
    const subOutIds = new Set(subs.map((s) => s.outId));
    // 쿼터 내 첫 sub 이전 (clock > firstSubClock) 에 액션을 한 선수 — starter 확정
    const seenBeforeFirstSub = new Set<bigint>();
    if (firstSubClock >= 0) {
      for (const p of qPbps) {
        if (!p.ttpId) continue;
        if (p.clock > firstSubClock) seenBeforeFirstSub.add(p.ttpId);
      }
    }
    // PBP 추정 starter (fallback / Q1 미주입 / Q2+ endLineup 비현실 시 사용)
    const pbpEstimatedStarters: bigint[] = [];
    for (const id of everSeen) {
      // (a) sub_in 받은 적 없음 → starter (풀타임 또는 sub_out 만 됨)
      if (!subInIds.has(id)) {
        pbpEstimatedStarters.push(id);
        continue;
      }
      // (b) sub_in 받았지만 한 번이라도 sub_out 도 됨 → 코트에 있던 선수 (starter 후보)
      //     + 첫 sub 이전에 액션도 있으면 starter 확정
      if (subOutIds.has(id) && seenBeforeFirstSub.has(id)) {
        pbpEstimatedStarters.push(id);
      }
    }

    // 2026-05-03 Tier 2: starter 결정 우선순위
    //   Q1: dbStartersUnion 우선 (DB isStarter=true 양팀 합 union) → fallback PBP 추정
    //   Q2+: 직전 쿼터 endLineup (3~7명 범위) → fallback PBP 추정
    let starters: bigint[];
    if (q === 1 && dbStartersUnion) {
      // DB starter 우선 — PBP 추정 무시 (Tier 2 핵심)
      starters = Array.from(dbStartersUnion);
    } else if (q > 1) {
      // endLineup chain — 이전 쿼터 active 5명±2 면 그대로 다음 starter
      const prevEnd = prevEndLineupByQ.get(q - 1);
      if (prevEnd && prevEnd.size >= 3 && prevEnd.size <= 7) {
        starters = Array.from(prevEnd);
      } else {
        starters = pbpEstimatedStarters; // fallback
      }
    } else {
      // Q1 + DB 미주입 → 기존 PBP 추정 (호환성 유지)
      starters = pbpEstimatedStarters;
    }

    // active set 시뮬레이션
    const active = new Set<bigint>(starters);
    let lastClock = qLen; // 쿼터 시작 시점 (clock = qLen)

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

    // 쿼터 종료까지 잔여 segment
    // - 종료 매치: 마지막 PBP clock ≈ 0 → lastClock 부터 0 까지
    // - 라이브 진행 중 쿼터: 마지막 PBP clock > 0 → 그 시점까지만 (이후는 미진행)
    // 단순화: 쿼터의 마지막 PBP 의 clock 을 endClock 으로 사용.
    const endClock = qPbps[qPbps.length - 1].clock;
    const remaining = lastClock - endClock;
    if (remaining > 0) {
      for (const id of active) {
        addSec(id, q, remaining);
      }
    }

    // 2026-05-03 Tier 2: 쿼터 종료 시점 active set 저장 (다음 쿼터 starter chain 용).
    //   active 는 쿼터 마지막 sub 적용 후 lineup → 작전타임 교체 발생률 2.5% (debugger 분석)
    //   라 거의 동일 lineup 이 다음 쿼터 시작.
    prevEndLineupByQ.set(q, new Set(active));
  }

  return { bySec: result, byQuarterSec: resultByQ };
}

// 종료 매치 cap (풀타임 보호) — 2026-05-03 옵션 C
//
// 왜 필요:
//   PBP-only 엔진은 sub 누락/지연 입력 케이스에서 한 팀 합이 만점(qLen×numQ×5)
//   미달 가능 (예: #132 home 137:40 / 만점 140:00). 종료 매치는 만점이 확정값이므로
//   cap 으로 정확화한다.
//
// 핵심 원칙:
//   1. 라이브 매치 cap X (호출자가 status='completed' 일 때만 호출)
//   2. 풀타임 선수 sec 절대 변경 X (sub 0건 = qLen×numQ 만점)
//   3. 풀타임 외 선수만 비례 분배로 cap 매칭
//
// 입력:
//   bySec       — 한 팀 선수들의 sec map (호출자가 home/away 로 분리 후 호출)
//   expected    — 한 팀 코트시간 합 (qLen × numQuarters × 5)
//   qLen        — 쿼터 길이 (풀타임 임계값 산출)
//   numQuarters — 쿼터 수 (풀타임 임계값 산출)
//
// 동작: bySec in-place 수정 (Map mutation)
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
