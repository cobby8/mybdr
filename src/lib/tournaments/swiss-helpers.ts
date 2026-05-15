/**
 * 2026-05-16 PR-G5.8 swiss generator — 스위스 라운드 페어링 PURE 함수.
 *
 * 도메인 컨텍스트:
 *   스위스 라운드 = 동승자끼리 매칭하는 라운드 시스템 (체스 표준).
 *     - 라운드 수 = ceil(log2(N))  (예: 8팀 → 3R / 16팀 → 4R / 12팀 → 4R)
 *     - R1 = 시드 기반 페어링 (1+N/2+1, 2+N/2+2, …) — 양분 분배 룰
 *     - R2~RN = 점수 기반 동승자 매칭 + 최근 대전 회피 + Buchholz tiebreak
 *
 * 설계 원칙:
 *   1) plan/generate 분리 (lessons.md §22 의무) — 본 모듈 = PURE 만 (DB I/O 0)
 *   2) generate (DB INSERT) 는 swiss-knockout.ts 분리
 *   3) BYE 처리 = 홀수 팀 시 lowest seed (또는 lowest standing) 자동 1승
 *   4) 운영 회귀 0 — 신규 함수만 / 기존 시그니처 변경 0
 *
 * 사용처:
 *   - swiss-knockout.ts 의 generateSwissRound1 / generateSwissNextRound 가 호출
 *   - opt-in 진입 (settings.bracket.format === "swiss")
 */

// ─────────────────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────────────────

/**
 * 시드 1·2·3·… 순서로 정렬된 팀 입력 — caller (route) 가 ranking 계산 후 전달.
 * tournamentTeamId = bigint (DB FK 호환).
 */
export interface SwissTeam {
  tournamentTeamId: bigint;
  seedNumber: number; // 1·2·3·… (시드 번호 — R1 페어링 기준)
}

/**
 * R(N) 페어링 산출용 standings 입력 — caller (getSwissStandings) 가 산출 후 전달.
 *
 * 사유: R(N) 은 R(N-1) 종료 결과 (wins / 점수차 / opponentIds) 를 입력으로
 *       동승자 매칭 + 최근 대전 회피를 수행. PURE 함수가 DB 조회 의존 없이 자급.
 */
export interface SwissStanding {
  tournamentTeamId: bigint;
  wins: number;            // 누적 승수
  losses: number;          // 누적 패수
  buchholz: number;        // 상대팀 누적 승수 합 (Dutch 시스템 tiebreak)
  pointDifference: number; // 누적 점수차 (2차 tiebreak)
  teamName: string;        // 정렬 안정성 (3차 tiebreak — 가나다순)
  opponentIds: bigint[];   // 이미 만난 상대 (최근 대전 회피)
}

/**
 * plan 결과 매치 spec — DB I/O 없이 생성.
 *
 * caller (generateSwissRound1) 가 createMany payload 로 변환.
 *
 * BYE 매치: status="bye" + winner_team_id 는 home (자동 승) — 이 결정은 generate 단계에서 처리.
 */
export interface PlannedSwissMatch {
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  status: "scheduled" | "bye";
  homeScore: number;
  awayScore: number;
  round_number: number;
  bracket_position: number;
  roundName: string;
  match_number: number;
  // swiss = 실팀 INSERT 만 (동적 페어링) → settings 라벨 미박제 (UI = 팀명 직접 표시)
  // → placeholder-helpers 의존 0 (도메인 결정 — planner 분석 §4 결론)
}

export interface PlanSwissResult {
  matches: PlannedSwissMatch[];
  /** BYE 받은 팀 ID 목록 (자동 1승 처리용) */
  byeTeamIds: bigint[];
}

// ─────────────────────────────────────────────────────────────────────────
// PURE 함수 — 라운드 수 산출
// ─────────────────────────────────────────────────────────────────────────

/**
 * swiss 라운드 수 산출 = ceil(log2(N)).
 *
 * 사유: 체스 표준 — N팀 중 1팀 우승 결정에 필요한 최소 라운드 수.
 *   - 8팀 → 3R (2^3 = 8)
 *   - 16팀 → 4R (2^4 = 16)
 *   - 12팀 → 4R (ceil(log2(12)) = ceil(3.58) = 4)
 *   - 32팀 → 5R
 *   - 2팀 → 1R (최소값)
 *
 * @param teamCount 참가 팀 수 (최소 2)
 * @returns 권장 라운드 수
 */
export function getSwissRoundCount(teamCount: number): number {
  if (teamCount < 2) {
    throw new Error(`getSwissRoundCount: teamCount=${teamCount} 는 최소 2 이상이어야 합니다.`);
  }
  return Math.ceil(Math.log2(teamCount));
}

// ─────────────────────────────────────────────────────────────────────────
// PURE 함수 — R1 페어링
// ─────────────────────────────────────────────────────────────────────────

/**
 * swiss R1 페어링 산출 (PURE) — 시드 기반 양분 분배.
 *
 * 알고리즘 (체스 Dutch 시스템 표준):
 *   - sortedSeeds = teams (caller 가 seedNumber asc 순으로 정렬해 전달)
 *   - half = floor(N / 2)
 *   - i in 0..half-1: pair(sortedSeeds[i], sortedSeeds[i + half])
 *   - 즉 (1+half+1, 2+half+2, …) 형태로 상위 시드 vs 하위 시드 매칭
 *   - N 홀수: 마지막 lowest seed 팀 = BYE (자동 1승 / status="bye")
 *
 * 예:
 *   - 8팀: half=4 → (1+5, 2+6, 3+7, 4+8)
 *   - 16팀: half=8 → (1+9, 2+10, …, 8+16)
 *   - 7팀: half=3 → (1+4, 2+5, 3+6) + 시드 7 BYE
 *
 * @param input.teamCount 참가 팀 수
 * @param input.seedingTeams 시드 순 정렬된 팀 목록
 * @param input.startMatchNumber 매치 번호 시작값 (default 1)
 * @returns matches + byeTeamIds
 */
export function planSwissRound1(input: {
  teamCount: number;
  seedingTeams: SwissTeam[];
  startMatchNumber?: number;
}): PlanSwissResult {
  const { teamCount, seedingTeams, startMatchNumber = 1 } = input;

  if (teamCount < 2) {
    throw new Error("planSwissRound1: 토너먼트 생성에 필요한 팀이 부족합니다 (최소 2팀).");
  }
  if (seedingTeams.length !== teamCount) {
    throw new Error(
      `planSwissRound1: seedingTeams.length=${seedingTeams.length} 와 teamCount=${teamCount} 불일치.`,
    );
  }

  // 1) 시드 순 정렬 보장 (caller 가 보장하지만 안전 가드)
  const sorted = [...seedingTeams].sort((a, b) => a.seedNumber - b.seedNumber);

  // 2) 양분 분배 — half = floor(N / 2)
  // 사유: 상위 시드 vs 하위 시드 페어링 = 1R 실력차 분배 룰
  const half = Math.floor(teamCount / 2);
  const matches: PlannedSwissMatch[] = [];
  const byeTeamIds: bigint[] = [];
  let nextMatchNumber = startMatchNumber;

  for (let i = 0; i < half; i++) {
    const home = sorted[i];
    const away = sorted[i + half];
    matches.push({
      homeTeamId: home.tournamentTeamId,
      awayTeamId: away.tournamentTeamId,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: 1,
      bracket_position: i,
      roundName: "스위스 R1",
      match_number: nextMatchNumber++,
    });
  }

  // 3) 홀수 팀 — lowest seed (마지막 인덱스) BYE 처리
  // 사유: 체스 표준 = 가장 낮은 시드 팀이 자동 1승 (BYE)
  if (teamCount % 2 === 1) {
    const byeTeam = sorted[teamCount - 1]; // lowest seed = 마지막
    byeTeamIds.push(byeTeam.tournamentTeamId);
    matches.push({
      homeTeamId: byeTeam.tournamentTeamId,
      awayTeamId: null, // BYE = away 슬롯 NULL
      status: "bye",
      homeScore: 0,
      awayScore: 0,
      round_number: 1,
      bracket_position: half,
      roundName: "스위스 R1",
      match_number: nextMatchNumber++,
    });
  }

  return { matches, byeTeamIds };
}

// ─────────────────────────────────────────────────────────────────────────
// PURE 함수 — R(N) 페어링 (R2 이후)
// ─────────────────────────────────────────────────────────────────────────

/**
 * 정렬 비교 — Dutch 시스템 표준 4단계 tiebreak.
 *
 * 우선순위:
 *   1) wins desc (승수 많은 순)
 *   2) buchholz desc (상대팀 승수 합 — 강한 상대와 만난 팀 우대)
 *   3) pointDifference desc (점수차)
 *   4) teamName asc (안정성 — 가나다 순)
 */
function compareSwissStandings(a: SwissStanding, b: SwissStanding): number {
  if (a.wins !== b.wins) return b.wins - a.wins;
  if (a.buchholz !== b.buchholz) return b.buchholz - a.buchholz;
  if (a.pointDifference !== b.pointDifference) return b.pointDifference - a.pointDifference;
  return a.teamName.localeCompare(b.teamName);
}

/**
 * swiss R(N) 페어링 산출 (PURE) — Dutch 시스템 (동승자 매칭 + 최근 대전 회피).
 *
 * 알고리즘:
 *   1) standings 정렬 (compareSwissStandings — 4단계 tiebreak)
 *   2) unmatched = [...sorted]
 *   3) while unmatched.length >= 2:
 *      a) home = unmatched.shift()
 *      b) awayCandidate = first team in unmatched where !home.opponentIds.includes(it)
 *      c) awayCandidate 있으면 pair / unmatched 에서 제거
 *      d) 없으면 relax 룰 = unmatched[0] 강제 매칭 (이미 만난 상대 — 마지막 라운드 폴백)
 *   4) 홀수 팀 = unmatched 마지막 1팀 (lowest standing) = BYE
 *
 * 사유 (lessons.md §22 + Wikipedia Dutch 시스템 룰):
 *   - 동점자끼리 우선 매칭 (실력 정합)
 *   - 최근 대전 회피 = swiss 의 핵심 룰 (재대전 차단)
 *   - Buchholz tiebreak = 강한 상대와 만난 팀에게 가산점 (공정성)
 *
 * @param input.standings 이전 라운드 종료 standings
 * @param input.roundNumber 본 라운드 번호 (예: 2)
 * @param input.startMatchNumber 매치 번호 시작값 (default 1)
 * @returns matches + byeTeamIds
 */
export function planSwissNextRound(input: {
  standings: SwissStanding[];
  roundNumber: number;
  startMatchNumber?: number;
}): PlanSwissResult {
  const { standings, roundNumber, startMatchNumber = 1 } = input;

  if (standings.length < 2) {
    throw new Error("planSwissNextRound: 페어링에 필요한 팀이 부족합니다 (최소 2팀).");
  }
  if (roundNumber < 2) {
    throw new Error(
      `planSwissNextRound: roundNumber=${roundNumber} 는 2 이상이어야 합니다 (R1 = planSwissRound1 사용).`,
    );
  }

  // 1) standings 4단계 tiebreak 정렬
  const sorted = [...standings].sort(compareSwissStandings);

  // 2) 페어링 산출 — Dutch 시스템 greedy 매칭
  const unmatched = [...sorted];
  const matches: PlannedSwissMatch[] = [];
  const byeTeamIds: bigint[] = [];
  let nextMatchNumber = startMatchNumber;
  let bracketPos = 0;

  while (unmatched.length >= 2) {
    const home = unmatched.shift()!;

    // 최근 대전 회피 — 이미 만난 적 없는 첫 후보
    let awayIdx = unmatched.findIndex(
      (cand) => !home.opponentIds.some((opp) => opp === cand.tournamentTeamId),
    );

    // relax 룰 — 모두 이미 만났으면 unmatched[0] 강제 매칭 (마지막 라운드 폴백)
    if (awayIdx === -1) awayIdx = 0;

    const away = unmatched.splice(awayIdx, 1)[0];

    matches.push({
      homeTeamId: home.tournamentTeamId,
      awayTeamId: away.tournamentTeamId,
      status: "scheduled",
      homeScore: 0,
      awayScore: 0,
      round_number: roundNumber,
      bracket_position: bracketPos++,
      roundName: `스위스 R${roundNumber}`,
      match_number: nextMatchNumber++,
    });
  }

  // 3) 홀수 팀 처리 — 마지막 unmatched (lowest standing) = BYE
  // 사유: Dutch 시스템 표준 = 가장 낮은 standing 팀 자동 1승 (이미 BYE 받은 팀 회피 룰은 후속 PR)
  if (unmatched.length === 1) {
    const byeTeam = unmatched[0];
    byeTeamIds.push(byeTeam.tournamentTeamId);
    matches.push({
      homeTeamId: byeTeam.tournamentTeamId,
      awayTeamId: null,
      status: "bye",
      homeScore: 0,
      awayScore: 0,
      round_number: roundNumber,
      bracket_position: bracketPos,
      roundName: `스위스 R${roundNumber}`,
      match_number: nextMatchNumber++,
    });
  }

  return { matches, byeTeamIds };
}
