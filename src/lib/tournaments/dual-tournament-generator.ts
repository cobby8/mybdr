// 듀얼토너먼트(`dual_tournament`) 27 매치 자동 생성기
//
// 포맷 정의: 16팀 → 4조×4팀 미니 더블엘리미 → 조별 1·2위 8팀 → 8강 단판
//          → 4강 (1+2 / 3+4 페어) → 결승. 총 27 매치.
//
// 2026-05-04 사용자 표준 결정 (planner-architect 분석 + 5/2 운영 후):
//   - sequential (default): A1+D2 / B1+C2 / C1+B2 / D1+A2  → 같은 조 출신 결승까지 분리
//   - adjacent (옵션 X 보존): B1+A2 / D1+C2 / A1+B2 / C1+D2  → 5/2 동호회최강전 패턴
//   - 4강 매핑은 양쪽 동일: 4강 1=8강 1+2, 4강 2=8강 3+4
//
// 사용 컨텍스트:
//   bracket route POST 의 dual 분기에서 호출 (Phase B).
//   본 함수는 매치 정의 배열만 반환하고, DB INSERT + next_match_id 2단계
//   UPDATE 는 caller(route) 책임.

import type { SemifinalPairingMode } from "./dual-defaults";
import { DUAL_DEFAULT_PAIRING } from "./dual-defaults";
//
// 매치 생성 후 caller 가 처리해야 할 후처리:
//   1) tx.tournamentMatch.createMany 로 27 건 INSERT (next_match_id 는 null 로)
//   2) 본 함수가 채운 _winnerNextMatchIndex/_loserNextMatchIndex 를 사용해서
//      INSERT 후 받은 실제 BigInt id 들로 next_match_id + settings.loserNextMatchId
//      UPDATE 27 건 (자기 참조 FK 회피, league-generator 패턴 차용)
//
// 참고: bracket-generator.ts (single elim 패턴) / tournament-seeding.ts (slotLabel 패턴)

/**
 * 사용자 수동 입력 조 배정 (settings.bracket.groupAssignment)
 * - 4조 × 4팀 시드 순서대로 TournamentTeam.id 배열
 * - 인덱스 [0]=조내 1번 시드 / [1]=2번 / [2]=3번 / [3]=4번
 * - 사진 그대로 입력: A=[피벗, SYBC, SA, SET-UP], B=[아울스, 크로스오버, 닥터바스켓, 다이나믹], ...
 */
export interface DualGroupAssignment {
  A: [bigint, bigint, bigint, bigint];
  B: [bigint, bigint, bigint, bigint];
  C: [bigint, bigint, bigint, bigint];
  D: [bigint, bigint, bigint, bigint];
}

/**
 * 듀얼토너먼트 매치 1건 정의 (caller 가 DB INSERT 시 사용)
 *
 * - bracket-generator.ts MatchToCreate 와 호환 (homeTeamId/awayTeamId/status/...)
 * - 추가 필드: group_name (A~D) / _winnerNextMatchIndex / _loserNextMatchIndex / 슬롯 라벨
 *
 * `_` prefix 필드는 generator 내부 매핑용 — caller 가 INSERT 후 별도 UPDATE 로 처리한다
 * (자기 참조 FK 라 createMany 시점엔 next_match_id 가 들어갈 수 없음).
 */
export interface DualMatchToCreate {
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  status: string; // "scheduled" — 1라운드 / "pending" — 팀 미정 (조별 G3·G4 + 8강·4강·결승)
  bracketPosition: number;
  bracketLevel: number; // 0=조별 R1·R2 + 최종전 / 1=8강 / 2=4강 / 3=결승
  roundName: string; // 표시용 한글 라벨
  roundNumber: number; // 1=조별 R1 / 2=조별 R2(승자전·패자전) / 3=조별 최종전 / 4=8강 / 5=4강 / 6=결승
  matchNumber: number; // 1부터 순차 (matchData 배열 순서와 일치)
  tournamentId: string;
  group_name: string | null; // "A"/"B"/"C"/"D" (조별 단계) / null (8강 이상)

  // ── caller 후처리용 (INSERT 후 UPDATE) ────────────────────────────────
  _winnerNextMatchIndex: number | null; // 승자 진출할 다음 매치 인덱스 (matchData 배열 인덱스)
  _winnerNextMatchSlot: "home" | "away" | null;
  _loserNextMatchIndex: number | null; // 패자 진출 인덱스 (조별 G1·G2 + 조별 최종전 패자 = 3위, 등 케이스별)
  _loserNextMatchSlot: "home" | "away" | null;
  _homeSlotLabel: string | null; // 빈 슬롯 표시 라벨 (예: "A조 1경기 승자")
  _awaySlotLabel: string | null;
}

/**
 * Stage 라벨 (UI 그룹핑용 헬퍼).
 * round_number 1~6 → 한글 단계명.
 */
export function getDualMatchStageLabel(roundNumber: number): string {
  switch (roundNumber) {
    case 1:
      return "조별 1라운드";
    case 2:
      return "조별 2라운드 (승자전·패자전)";
    case 3:
      return "조별 최종전";
    case 4:
      return "8강";
    case 5:
      return "4강";
    case 6:
      return "결승";
    default:
      return `라운드 ${roundNumber}`;
  }
}

/**
 * 조 배정 입력값 검증.
 * - 4조 × 4팀 = 16팀 모두 존재
 * - 16개 팀 ID 가 unique (한 팀이 두 조에 들어가면 안 됨)
 *
 * 위반 시 Error throw (caller 가 catch 해서 사용자 에러 메시지로).
 */
export function validateGroupAssignment(assignment: DualGroupAssignment): void {
  const all: bigint[] = [
    ...assignment.A,
    ...assignment.B,
    ...assignment.C,
    ...assignment.D,
  ];

  // 1) 16팀 정확히 (각 조 4팀씩)
  if (all.length !== 16) {
    throw new Error(`듀얼토너먼트는 16팀이 필요합니다 (현재 ${all.length}팀).`);
  }

  // 2) 4조 × 4팀 누락 체크 (TypeScript 튜플 타입이라 컴파일타임 보장되지만 런타임 방어)
  for (const groupKey of ["A", "B", "C", "D"] as const) {
    const group = assignment[groupKey];
    if (group.length !== 4) {
      throw new Error(`${groupKey}조 팀 수가 정확히 4가 아닙니다 (${group.length}팀).`);
    }
  }

  // 3) Unique 검증 — bigint 는 Set 에 그대로 들어감 (toString 비교 회피)
  const unique = new Set(all.map((id) => id.toString()));
  if (unique.size !== 16) {
    throw new Error(
      `조 배정에 중복 팀이 있습니다 (unique=${unique.size}, total=16). 한 팀이 두 조에 들어갈 수 없습니다.`,
    );
  }
}

// ── 내부: 8강 매핑 테이블 (페어링 모드별) ───────────────────────────────
// 2026-05-04: 사용자 결정 (5/2 운영 후) — 표준 default = sequential
// dual-defaults.ts QUARTERFINAL_SPECS 와 정합. 본 파일은 generator 자체 인덱싱(1~4) 으로 변환.
type GroupKey = "A" | "B" | "C" | "D";
interface QuarterFinalSpec {
  matchIndex: number; // 8강 매치 번호 (1~4) — bracketPosition 도 동일
  home: { group: GroupKey }; // home = 조 1위 (해당 조 G3 승자)
  away: { group: GroupKey }; // away = 조 2위 (해당 조 최종전 승자)
}

// sequential = 표준 default (사용자 단일 코트 순차 진행 표준)
//   8강 1: A1 vs D2 → 4강 1
//   8강 2: B1 vs C2 → 4강 1
//   8강 3: C1 vs B2 → 4강 2
//   8강 4: D1 vs A2 → 4강 2
const QUARTER_FINAL_SPECS_SEQUENTIAL: QuarterFinalSpec[] = [
  { matchIndex: 1, home: { group: "A" }, away: { group: "D" } },
  { matchIndex: 2, home: { group: "B" }, away: { group: "C" } },
  { matchIndex: 3, home: { group: "C" }, away: { group: "B" } },
  { matchIndex: 4, home: { group: "D" }, away: { group: "A" } },
];

// adjacent = 5/2 동호회최강전 패턴 (옵션 X 보존)
//   8강 1: B1 vs A2 → 4강 1
//   8강 2: D1 vs C2 → 4강 1
//   8강 3: A1 vs B2 → 4강 2
//   8강 4: C1 vs D2 → 4강 2
const QUARTER_FINAL_SPECS_ADJACENT: QuarterFinalSpec[] = [
  { matchIndex: 1, home: { group: "B" }, away: { group: "A" } },
  { matchIndex: 2, home: { group: "D" }, away: { group: "C" } },
  { matchIndex: 3, home: { group: "A" }, away: { group: "B" } },
  { matchIndex: 4, home: { group: "C" }, away: { group: "D" } },
];

// ── 내부: 4강 매핑 테이블 (양쪽 페어링 모드 공통) ──────────────────────────
// 2026-05-04: 사용자 표준 통일 — 4강 1 = 8강 1+2 / 4강 2 = 8강 3+4 (인접 인덱스)
// (이전 NBA 1+4 / 2+3 크로스 → 사용자 의도와 다름, 사용자 명시 표준으로 통일)
interface SemiFinalSpec {
  matchIndex: number; // 4강 매치 번호 (1~2)
  homeFromQfIndex: number; // home 슬롯에 들어갈 8강 매치 인덱스
  awayFromQfIndex: number; // away 슬롯에 들어갈 8강 매치 인덱스
}
const SEMI_FINAL_SPECS: SemiFinalSpec[] = [
  { matchIndex: 1, homeFromQfIndex: 1, awayFromQfIndex: 2 }, // 4강 1: QF1 + QF2
  { matchIndex: 2, homeFromQfIndex: 3, awayFromQfIndex: 4 }, // 4강 2: QF3 + QF4
];

/**
 * 듀얼토너먼트 매치 27건 생성.
 *
 * 매치 순서 (matchData 배열 인덱스):
 *   [0~15]  조별 16건 — 4조 × (G1, G2, G3 승자전, G4 패자전)
 *           - 0~3:   A조 G1, G2, G3, G4
 *           - 4~7:   B조
 *           - 8~11:  C조
 *           - 12~15: D조
 *   [16~19] 조별 최종전 4건 — A, B, C, D 순
 *   [20~23] 8강 4건 — QF1, QF2, QF3, QF4
 *   [24~25] 4강 2건 — SF1, SF2
 *   [26]    결승 1건
 *
 * @param groupAssignment - 4조 × 4팀 시드 순서 배정 (사용자 수동)
 * @param tournamentId    - Tournament.id (UUID)
 * @returns 27건의 DualMatchToCreate (caller 가 DB INSERT + 후처리)
 */
export function generateDualTournament(
  groupAssignment: DualGroupAssignment,
  tournamentId: string,
  // 2026-05-04: pairing 인자 추가 — 표준 default = sequential (사용자 결정)
  // adjacent = 5/2 동호회최강전 옵션 보존 (settings.bracket.semifinalPairing 으로 운영자 변경 가능)
  pairing: SemifinalPairingMode = DUAL_DEFAULT_PAIRING,
): DualMatchToCreate[] {
  // 0) 입력 검증 — 16팀 unique
  validateGroupAssignment(groupAssignment);

  // pairing 모드별 8강 SPEC 선택 (4강 SPEC 은 양쪽 동일)
  const QUARTER_FINAL_SPECS =
    pairing === "adjacent"
      ? QUARTER_FINAL_SPECS_ADJACENT
      : QUARTER_FINAL_SPECS_SEQUENTIAL;

  const matches: DualMatchToCreate[] = [];

  // 조별 단계에서 각 매치의 인덱스를 빠르게 찾기 위한 매핑
  // key: `${group}-${slot}` (slot: G1/G2/G3/G4/FINAL) → matches[] 인덱스
  const groupMatchIndex = new Map<string, number>();

  // ── Step 1: 조별 16 매치 (G1, G2 = R1 / G3 승자전, G4 패자전 = R2) ─────
  // 매치 순서: A→B→C→D 조 순서로 각 조 4매치씩
  const groupKeys: GroupKey[] = ["A", "B", "C", "D"];
  let matchNumberCounter = 1;

  for (const groupKey of groupKeys) {
    const teams = groupAssignment[groupKey];
    const seed1 = teams[0]; // 조내 1번 시드
    const seed2 = teams[1];
    const seed3 = teams[2];
    const seed4 = teams[3];

    // G1: 조내 1·2번 시드 매치 (round_number=1)
    const g1Idx = matches.length;
    matches.push({
      homeTeamId: seed1,
      awayTeamId: seed2,
      status: "scheduled", // 팀이 확정되어 있으므로 바로 scheduled
      bracketPosition: 1,
      bracketLevel: 0, // 조별 단계 (group stage)
      roundName: `${groupKey}조 1경기`,
      roundNumber: 1,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: groupKey,
      _winnerNextMatchIndex: null, // 임시 — Step 1 끝나고 채움 (G3 승자전 home)
      _winnerNextMatchSlot: null,
      _loserNextMatchIndex: null, // 임시 — G4 패자전 home
      _loserNextMatchSlot: null,
      _homeSlotLabel: null, // 팀 확정이라 라벨 불필요
      _awaySlotLabel: null,
    });
    groupMatchIndex.set(`${groupKey}-G1`, g1Idx);

    // G2: 조내 3·4번 시드 매치 (round_number=1)
    const g2Idx = matches.length;
    matches.push({
      homeTeamId: seed3,
      awayTeamId: seed4,
      status: "scheduled",
      bracketPosition: 2,
      bracketLevel: 0,
      roundName: `${groupKey}조 2경기`,
      roundNumber: 1,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: groupKey,
      _winnerNextMatchIndex: null, // G3 승자전 away
      _winnerNextMatchSlot: null,
      _loserNextMatchIndex: null, // G4 패자전 away
      _loserNextMatchSlot: null,
      _homeSlotLabel: null,
      _awaySlotLabel: null,
    });
    groupMatchIndex.set(`${groupKey}-G2`, g2Idx);

    // G3: 승자전 (G1 winner vs G2 winner) — round_number=2
    const g3Idx = matches.length;
    matches.push({
      homeTeamId: null, // 팀 미정 — G1 승자가 들어옴
      awayTeamId: null,
      status: "pending", // 팀 결정 후 scheduled 로 전환 (matches PATCH route 또는 운영 수동)
      bracketPosition: 3,
      bracketLevel: 0,
      roundName: `${groupKey}조 승자전`,
      roundNumber: 2,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: groupKey,
      // 승자전 승자 → 8강 (Step 4에서 채움)
      _winnerNextMatchIndex: null,
      _winnerNextMatchSlot: null,
      // 승자전 패자 → 조별 최종전 home (Step 3에서 채움)
      _loserNextMatchIndex: null,
      _loserNextMatchSlot: null,
      _homeSlotLabel: `${groupKey}조 1경기 승자`,
      _awaySlotLabel: `${groupKey}조 2경기 승자`,
    });
    groupMatchIndex.set(`${groupKey}-G3`, g3Idx);

    // G4: 패자전 (G1 loser vs G2 loser) — round_number=2
    const g4Idx = matches.length;
    matches.push({
      homeTeamId: null,
      awayTeamId: null,
      status: "pending",
      bracketPosition: 4,
      bracketLevel: 0,
      roundName: `${groupKey}조 패자전`,
      roundNumber: 2,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: groupKey,
      // 패자전 승자 → 조별 최종전 away (Step 3에서 채움)
      _winnerNextMatchIndex: null,
      _winnerNextMatchSlot: null,
      // 패자전 패자 → 4위 확정 (next 없음)
      _loserNextMatchIndex: null,
      _loserNextMatchSlot: null,
      _homeSlotLabel: `${groupKey}조 1경기 패자`,
      _awaySlotLabel: `${groupKey}조 2경기 패자`,
    });
    groupMatchIndex.set(`${groupKey}-G4`, g4Idx);

    // 1차 매핑: G1·G2 의 winner/loser 진출 매핑
    // (G3·G4 는 현재 같은 조 안에서 인덱스를 알고 있으므로 즉시 채움)
    matches[g1Idx]._winnerNextMatchIndex = g3Idx;
    matches[g1Idx]._winnerNextMatchSlot = "home";
    matches[g1Idx]._loserNextMatchIndex = g4Idx;
    matches[g1Idx]._loserNextMatchSlot = "home";

    matches[g2Idx]._winnerNextMatchIndex = g3Idx;
    matches[g2Idx]._winnerNextMatchSlot = "away";
    matches[g2Idx]._loserNextMatchIndex = g4Idx;
    matches[g2Idx]._loserNextMatchSlot = "away";
  }

  // ── Step 2: 조별 최종전 4 매치 (round_number=3) ────────────────────────
  // 매칭: G3 패자 (승자전 패자) vs G4 승자 (패자전 승자) = 2위 결정전
  // 매치 순서: A → B → C → D 조 순서로 4건
  for (const groupKey of groupKeys) {
    const finalIdx = matches.length;
    matches.push({
      homeTeamId: null, // G3 패자가 들어옴
      awayTeamId: null, // G4 승자가 들어옴
      status: "pending",
      bracketPosition: 1, // 조별 최종전끼리는 1로 통일 (group_name 으로 구분)
      bracketLevel: 0, // 조별 단계 (group stage 의 마지막 경기)
      roundName: `${groupKey}조 최종전`,
      roundNumber: 3,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: groupKey,
      // 최종전 승자 = 조 2위 → 8강 (Step 4에서 채움)
      _winnerNextMatchIndex: null,
      _winnerNextMatchSlot: null,
      // 최종전 패자 = 조 3위 → next 없음 (3·4위전 미운영)
      _loserNextMatchIndex: null,
      _loserNextMatchSlot: null,
      _homeSlotLabel: `${groupKey}조 승자전 패자`,
      _awaySlotLabel: `${groupKey}조 패자전 승자`,
    });
    groupMatchIndex.set(`${groupKey}-FINAL`, finalIdx);

    // 역방향 매핑: G3 패자 → 최종전 home / G4 승자 → 최종전 away
    const g3Idx = groupMatchIndex.get(`${groupKey}-G3`)!;
    const g4Idx = groupMatchIndex.get(`${groupKey}-G4`)!;
    matches[g3Idx]._loserNextMatchIndex = finalIdx;
    matches[g3Idx]._loserNextMatchSlot = "home";
    matches[g4Idx]._winnerNextMatchIndex = finalIdx;
    matches[g4Idx]._winnerNextMatchSlot = "away";
  }

  // ── Step 3: 8강 4 매치 (round_number=4, bracket_level=1) ──────────────
  // QF1: B1 vs A2 / QF2: A1 vs B2 / QF3: D1 vs C2 / QF4: C1 vs D2
  // home = N조 1위 = N조 G3 승자
  // away = M조 2위 = M조 최종전 승자
  const quarterFinalIndices = new Map<number, number>(); // QF matchIndex(1~4) → matches[] 인덱스
  for (const spec of QUARTER_FINAL_SPECS) {
    const qfIdx = matches.length;
    matches.push({
      homeTeamId: null,
      awayTeamId: null,
      status: "pending",
      bracketPosition: spec.matchIndex, // 1~4
      bracketLevel: 1, // 8강
      roundName: "8강",
      roundNumber: 4,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: null, // 8강부터는 조 구분 없음
      // 8강 승자 → 4강 (Step 4에서 채움)
      _winnerNextMatchIndex: null,
      _winnerNextMatchSlot: null,
      // 8강 패자 → 공동 5위 확정 (next 없음)
      _loserNextMatchIndex: null,
      _loserNextMatchSlot: null,
      _homeSlotLabel: `${spec.home.group}조 1위`,
      _awaySlotLabel: `${spec.away.group}조 2위`,
    });
    quarterFinalIndices.set(spec.matchIndex, qfIdx);

    // 역방향 매핑:
    //   N조 G3 승자 → 이 8강 home
    //   M조 최종전 승자 → 이 8강 away
    const homeG3Idx = groupMatchIndex.get(`${spec.home.group}-G3`)!;
    const awayFinalIdx = groupMatchIndex.get(`${spec.away.group}-FINAL`)!;
    matches[homeG3Idx]._winnerNextMatchIndex = qfIdx;
    matches[homeG3Idx]._winnerNextMatchSlot = "home";
    matches[awayFinalIdx]._winnerNextMatchIndex = qfIdx;
    matches[awayFinalIdx]._winnerNextMatchSlot = "away";
  }

  // ── Step 4: 4강 2 매치 (round_number=5, bracket_level=2) — NBA 크로스 ──
  // SF1: QF1 winner vs QF4 winner / SF2: QF2 winner vs QF3 winner
  const semiFinalIndices = new Map<number, number>(); // SF matchIndex(1~2) → matches[] 인덱스
  for (const spec of SEMI_FINAL_SPECS) {
    const sfIdx = matches.length;
    matches.push({
      homeTeamId: null,
      awayTeamId: null,
      status: "pending",
      bracketPosition: spec.matchIndex, // 1~2
      bracketLevel: 2, // 4강
      roundName: "4강",
      roundNumber: 5,
      matchNumber: matchNumberCounter++,
      tournamentId,
      group_name: null,
      // 4강 승자 → 결승 (Step 5에서 채움)
      _winnerNextMatchIndex: null,
      _winnerNextMatchSlot: null,
      // 4강 패자 → 공동 3위 확정 (3·4위전 미운영, 사진 그대로)
      _loserNextMatchIndex: null,
      _loserNextMatchSlot: null,
      _homeSlotLabel: `8강 ${spec.homeFromQfIndex}경기 승자`,
      _awaySlotLabel: `8강 ${spec.awayFromQfIndex}경기 승자`,
    });
    semiFinalIndices.set(spec.matchIndex, sfIdx);

    // 역방향 매핑: 8강 승자 → 4강 슬롯
    const homeQfIdx = quarterFinalIndices.get(spec.homeFromQfIndex)!;
    const awayQfIdx = quarterFinalIndices.get(spec.awayFromQfIndex)!;
    matches[homeQfIdx]._winnerNextMatchIndex = sfIdx;
    matches[homeQfIdx]._winnerNextMatchSlot = "home";
    matches[awayQfIdx]._winnerNextMatchIndex = sfIdx;
    matches[awayQfIdx]._winnerNextMatchSlot = "away";
  }

  // ── Step 5: 결승 1 매치 (round_number=6, bracket_level=3) ─────────────
  const finalMatchIdx = matches.length;
  matches.push({
    homeTeamId: null,
    awayTeamId: null,
    status: "pending",
    bracketPosition: 1,
    bracketLevel: 3, // 결승
    roundName: "결승",
    roundNumber: 6,
    matchNumber: matchNumberCounter++,
    tournamentId,
    group_name: null,
    // 결승 승자 = 우승팀 (next 없음)
    _winnerNextMatchIndex: null,
    _winnerNextMatchSlot: null,
    // 결승 패자 = 준우승 (next 없음)
    _loserNextMatchIndex: null,
    _loserNextMatchSlot: null,
    _homeSlotLabel: "4강 1경기 승자",
    _awaySlotLabel: "4강 2경기 승자",
  });

  // 4강 → 결승 매핑
  const sf1Idx = semiFinalIndices.get(1)!;
  const sf2Idx = semiFinalIndices.get(2)!;
  matches[sf1Idx]._winnerNextMatchIndex = finalMatchIdx;
  matches[sf1Idx]._winnerNextMatchSlot = "home";
  matches[sf2Idx]._winnerNextMatchIndex = finalMatchIdx;
  matches[sf2Idx]._winnerNextMatchSlot = "away";

  // 안전성 체크: 정확히 27 매치
  if (matches.length !== 27) {
    throw new Error(
      `듀얼토너먼트 매치 생성 실패: 27건이어야 하는데 ${matches.length}건이 생성됨.`,
    );
  }

  return matches;
}
