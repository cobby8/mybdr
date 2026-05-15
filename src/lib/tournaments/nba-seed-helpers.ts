/**
 * 2026-05-16 PR-G5.5-NBA-seed — NBA 표준 시드 페어링 PURE 함수.
 *
 * 도메인 컨텍스트:
 *   기존 `buildKnockoutBracket` (tournament-seeding.ts:128) 은 순차 시드 (1+8, 2+7, 3+6, 4+5).
 *   NBA 표준 (양분 트리) = (1+8, 4+5, 3+6, 2+7) — 시드 1·2 가 결승까지 못 만남 보장.
 *
 * 알고리즘:
 *   - 시작: order = [1]
 *   - 반복: 각 시드 s 에 대해 (sum - s) 를 짝꿍으로 push (sum = order.length * 2 + 1)
 *   - 결과: [1] → [1,2] → [1,4,2,3] → [1,8,4,5,2,7,3,6] → [1,16,8,9,4,13,5,12,2,15,7,10,3,14,6,11]
 *   - 1R 페어링 = 인접한 두 슬롯 묶기 (양분된 트리 자연 배열)
 *
 * BYE 처리:
 *   - bracketSize = 2^N 올림 (예: 6팀 → 8슬롯, 12팀 → 16슬롯)
 *   - seed > teamCount 인 슬롯 = null (BYE 시드)
 *   - 페어 (a, b) 에서 한쪽이 null = 부전승 매치 (1R 생략 / 상위 시드 자동 진출)
 *
 * 사용처:
 *   - `nba-seed-knockout.ts` 의 `planNbaSeedKnockout` 가 호출
 *   - opt-in 진입 (settings.bracket.seedingMode === "nba") — 기본값 sequential 보존
 */

/**
 * 1R 페어링 결과 — null 은 BYE (실팀 0).
 *
 * 예: 8팀 NBA = [[1,8],[4,5],[3,6],[2,7]]
 *     6팀 NBA = [[1,null],[4,5],[3,6],[2,null]]  → BYE 페어 = 부전승 (1·2 자동 진출)
 *     12팀 NBA = [[1,null],[8,9],[4,13]→null쪽 처리...] 양분 결과
 */
export type NbaSeedPair = readonly [number | null, number | null];

/**
 * NBA 표준 양분 트리 시드 페어링 — bracketSize 만큼 슬롯 채우기.
 *
 * @param bracketSize — 2^N 만 허용 (4 / 8 / 16 / 32 …). 비정상 값은 throw.
 * @returns 인접 페어 배열 (`[home, away]` × bracketSize/2)
 *
 * @example
 *   nbaSeedPairs(8)  // [[1,8],[4,5],[3,6],[2,7]]
 *   nbaSeedPairs(16) // [[1,16],[8,9],[5,12],[4,13],[3,14],[6,11],[7,10],[2,15]]
 *   nbaSeedPairs(4)  // [[1,4],[2,3]]
 */
export function nbaSeedPairs(bracketSize: number): Array<[number, number]> {
  // 입력 검증 — 2^N 만 허용 (계산 보장)
  if (bracketSize < 2 || (bracketSize & (bracketSize - 1)) !== 0) {
    throw new Error(`nbaSeedPairs: bracketSize=${bracketSize} 는 2의 제곱이 아닙니다.`);
  }

  // 양분 트리 구성 — [1] → [1,2] → [1,4,2,3] → [1,8,4,5,2,7,3,6] …
  // 각 단계에서 길이 2배 늘어남 + 페어 합 = (현재 길이)*2 + 1
  let order: number[] = [1];
  while (order.length < bracketSize) {
    const next: number[] = [];
    const sum = order.length * 2 + 1; // 페어 시드 합 (예: 8슬롯 만들 때 sum = 9)
    for (const s of order) {
      next.push(s);          // 상위 시드
      next.push(sum - s);    // 짝꿍 (양분 트리 보장)
    }
    order = next;
  }

  // 인접 페어 묶기 — order[0]+order[1], order[2]+order[3], …
  // 사유: 양분 결과의 인접 슬롯이 자연히 1R 페어 = 트리 양분 보장 (시드 1·2 결승 가능 경로)
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < bracketSize / 2; i++) {
    pairs.push([order[2 * i], order[2 * i + 1]]);
  }
  return pairs;
}

/**
 * BYE 처리된 NBA 페어 — `teamCount` 보다 큰 시드는 null.
 *
 * @param teamCount — 실제 팀 수 (1·2 시드 = BYE 받을 상위 팀)
 * @returns 페어 배열 — null 슬롯이 있는 페어 = 부전승 (해당 매치 1R 생략)
 *
 * @example
 *   nbaSeedPairsWithBye(6)  // [[1,null],[4,5],[3,6],[2,null]]
 *   nbaSeedPairsWithBye(8)  // [[1,8],[4,5],[3,6],[2,7]]
 *   nbaSeedPairsWithBye(12) // [[1,null],[8,9],[4,13]→null,[5,12],[3,14]→null,[6,11],[7,10],[2,null]] 패턴
 */
export function nbaSeedPairsWithBye(teamCount: number): NbaSeedPair[] {
  if (teamCount < 2) {
    throw new Error(`nbaSeedPairsWithBye: teamCount=${teamCount} 는 최소 2 이상이어야 합니다.`);
  }

  // bracketSize = 2^ceil(log2(teamCount)) — 다음 2^N 올림
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(teamCount)));
  const pairs = nbaSeedPairs(bracketSize);

  // 시드 > teamCount 면 null 로 치환 (BYE)
  return pairs.map(
    ([a, b]) =>
      [
        a > teamCount ? null : a,
        b > teamCount ? null : b,
      ] as const,
  );
}

/**
 * BYE 페어 판정 — 한쪽 시드만 있는 페어 = 부전승 (1R 매치 생략).
 *
 * @example
 *   isByePair([1, null]) // true → 시드 1 자동 진출
 *   isByePair([4, 5])    // false → 1R 매치 생성
 *   isByePair([null, null]) // true (불가능 케이스 — 두 BYE 가 한 페어 = 데이터 오류)
 */
export function isByePair(pair: NbaSeedPair): boolean {
  return pair[0] === null || pair[1] === null;
}
