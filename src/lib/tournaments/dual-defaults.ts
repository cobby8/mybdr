/**
 * 2026-05-04: 듀얼 토너먼트 표준 default 정의
 *
 * 5/2 동호회최강전 (138b22d8) 운영 후 사용자 확정 표준 (planner-architect 분석 반영):
 *   - 16팀 / 4그룹 × 4팀
 *   - 조별 더블 엘리미네이션 (1경기/2경기/승자전/패자전/최종전)
 *   - 8강 KO + 4강 + 결승 (총 27 매치)
 *
 * 4강 페어링 (semifinalPairing):
 *   - "sequential" (기본 default) — A1+D2 / B1+C2 / C1+B2 / D1+A2
 *     · 4강 1 = 8강 1+2 / 4강 2 = 8강 3+4 (인접 인덱스)
 *     · 같은 조 1위/2위 결승까지 분리 (시드 정의 충실)
 *     · 단일 코트 순차 진행 시 8강 1+2 종료 직후 4강 1 시작 가능
 *     · 4그룹 모두 8강 등장 (대진 다양성 ↑)
 *
 *   - "adjacent" (5/2 운영 패턴, 옵션 보존) — A1+B2 / C1+D2 / B1+A2 / D1+C2
 *     · 4강 1 = 8강 1+3 / 4강 2 = 8강 2+4 (인터리브 인덱스)
 *     · AB 사이드 / CD 사이드 분리 (멀티 코트 시간대 묶기 유리)
 *     · 같은 조 출신 4강 재대결 가능 (인접 진영에 모임)
 */

export type SemifinalPairingMode = "sequential" | "adjacent";

/** 표준 default — 신규 대회 자동 적용 */
export const DUAL_DEFAULT_PAIRING: SemifinalPairingMode = "sequential";

export interface DualBracketDefaults {
  groupCount: 4;
  teamsPerGroup: 4;
  advancePerGroup: 2;
  knockoutSize: 8;
  hasGroupFinal: true;
  bronzeMatch: false;
  semifinalPairing: SemifinalPairingMode;
}

export const DUAL_DEFAULT_BRACKET: DualBracketDefaults = {
  groupCount: 4,
  teamsPerGroup: 4,
  advancePerGroup: 2,
  knockoutSize: 8,
  hasGroupFinal: true,
  bronzeMatch: false,
  semifinalPairing: DUAL_DEFAULT_PAIRING,
};

/**
 * 8강 매치업 사양 — 페어링 모드별
 *
 * matchIndex: 0~3 (8강 1, 2, 3, 4)
 * homeGroup/awayGroup: A | B | C | D
 * homeRank/awayRank: 1 (조 1위) | 2 (조 2위)
 * semifinalIndex: 0 (4강 1) | 1 (4강 2)
 * semifinalSlot: "home" | "away" (4강 매치 슬롯)
 */
export type QuarterfinalSpec = {
  matchIndex: number;
  homeGroup: "A" | "B" | "C" | "D";
  homeRank: 1 | 2;
  awayGroup: "A" | "B" | "C" | "D";
  awayRank: 1 | 2;
  semifinalIndex: 0 | 1;
  semifinalSlot: "home" | "away";
};

export const QUARTERFINAL_SPECS: Record<SemifinalPairingMode, QuarterfinalSpec[]> = {
  // sequential = 표준 default (옵션 A)
  // 8강 1: A1+D2, 8강 2: B1+C2 → 4강 1
  // 8강 3: C1+B2, 8강 4: D1+A2 → 4강 2
  sequential: [
    { matchIndex: 0, homeGroup: "A", homeRank: 1, awayGroup: "D", awayRank: 2, semifinalIndex: 0, semifinalSlot: "home" },
    { matchIndex: 1, homeGroup: "B", homeRank: 1, awayGroup: "C", awayRank: 2, semifinalIndex: 0, semifinalSlot: "away" },
    { matchIndex: 2, homeGroup: "C", homeRank: 1, awayGroup: "B", awayRank: 2, semifinalIndex: 1, semifinalSlot: "home" },
    { matchIndex: 3, homeGroup: "D", homeRank: 1, awayGroup: "A", awayRank: 2, semifinalIndex: 1, semifinalSlot: "away" },
  ],
  // adjacent = 5/2 동호회최강전 패턴 (옵션 X 보존)
  // 5/4 fix 후 bracketPosition 순서 정합 — i/2 매핑 → 4강 1=(0+1), 4강 2=(2+3)
  // 8강 1: B1+A2 → 4강 1 home  (8강 1+2 페어 = 5/4 우리 fix 후 운영 데이터 일치)
  // 8강 2: D1+C2 → 4강 1 away
  // 8강 3: A1+B2 → 4강 2 home
  // 8강 4: C1+D2 → 4강 2 away
  adjacent: [
    { matchIndex: 0, homeGroup: "B", homeRank: 1, awayGroup: "A", awayRank: 2, semifinalIndex: 0, semifinalSlot: "home" },
    { matchIndex: 1, homeGroup: "D", homeRank: 1, awayGroup: "C", awayRank: 2, semifinalIndex: 0, semifinalSlot: "away" },
    { matchIndex: 2, homeGroup: "A", homeRank: 1, awayGroup: "B", awayRank: 2, semifinalIndex: 1, semifinalSlot: "home" },
    { matchIndex: 3, homeGroup: "C", homeRank: 1, awayGroup: "D", awayRank: 2, semifinalIndex: 1, semifinalSlot: "away" },
  ],
};

/**
 * settings.bracket JSON 스키마 (대회 생성 시 저장)
 *
 * 사용처:
 *   - dual-tournament-generator.ts: 매치 생성 시 QUARTERFINAL_SPECS[pairing] 참조
 *   - bracket-builder.ts: UI 표시 시 페어링 모드 인지 (옵션)
 *   - admin UI: 운영자가 변경 가능 (default = DUAL_DEFAULT_PAIRING)
 */
export interface DualSettings {
  bracket: {
    groupCount: number;
    teamsPerGroup: number;
    advancePerGroup: number;
    knockoutSize: number;
    hasGroupFinal: boolean;
    bronzeMatch: boolean;
    semifinalPairing: SemifinalPairingMode;
    autoGenerateMatches?: boolean;
    groupAssignment?: Record<string, string[]>; // { A: [teamId, ...], B: [...], ... }
  };
}
